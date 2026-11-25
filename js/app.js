import * as S from './store.js';
import * as U from './ui.js';
import {
  esc, money, qty, fmtDate, fmtDateTime, todayISO, monthKey, monthLabel,
  whatsAppNumber, onlyDigits, phoneLooksValid, sum, sortBy, normalizeSearch,
  vehicleTitle, fileStamp, nowISO, round2, isInMonth
} from './util.js';

const APP_VERSION = '1.0.1';
const STORAGE_KEY = 'fcv.store.v1';
const root = document.getElementById('app');

const viewState = {
  orders: { search: '', status: 'todos' },
  stock: { search: '', categoria: 'todos', lowOnly: false },
  movements: { search: '', tipo: 'todos' },
  purchases: { search: '', status: 'todos' },
  expenses: { search: '', status: 'todos' },
  suppliers: { search: '' },
  clients: { search: '' }
};

let osDraft = null;
let purchaseDraft = null;
let manualCache = '';
let manualRequest = null;
let vehicleReturnClient = '';
let lastRouteKey = '';
const SERVICE_SUGGESTIONS = [
  'Troca de óleo e filtro', 'Alinhamento e balanceamento', 'Revisão geral',
  'Troca de pastilhas de freio', 'Diagnóstico eletrônico', 'Troca de correia dentada',
  'Recarga de gás do ar-condicionado', 'Troca de bateria'
];

function parseRoute() {
  const raw = String(location.hash || '#/').replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  return {
    path: pathPart.startsWith('/') ? pathPart : `/${pathPart}`,
    query: new URLSearchParams(queryPart)
  };
}

function pathSegments(path) {
  return String(path || '/').split('/').filter(Boolean);
}

function currentRoute() {
  return parseRoute().path;
}

function refresh() {
  render();
}

function navigate(path) {
  if (String(location.hash || '#/') === `#${path}`) render();
  else location.hash = path;
}

function titleForPath(path) {
  const parts = pathSegments(path);
  if (!parts.length) return 'Painel';
  if (parts[0] === 'ordens') {
    if (parts[1] === 'nova') return 'Nova ordem de serviço';
    if (parts[1] && parts[2] === 'editar') return 'Editar ordem de serviço';
    const order = parts[1] ? S.ordemById(parts[1]) : null;
    return order ? `O.S. ${order.numero}` : 'Ordens de serviço';
  }
  if (parts[0] === 'estoque') return parts[1] === 'movimentacoes' ? 'Movimentações de estoque' : 'Peças em estoque';
  if (parts[0] === 'compras') return parts[1] === 'nova' ? 'Nova compra' : 'Compras';
  if (parts[0] === 'despesas') return 'Despesas';
  if (parts[0] === 'financeiro') return 'Contas e caixa';
  if (parts[0] === 'clientes') return 'Clientes';
  if (parts[0] === 'fornecedores') return 'Fornecedores';
  if (parts[0] === 'ajuda') return 'Ajuda e manual';
  return 'Franlin Car Veículos';
}

function contentForPath(path, query) {
  const parts = pathSegments(path);
  if (!parts.length) return dashboardView();
  switch (parts[0]) {
    case 'ordens':
      if (parts[1] === 'nova') return orderFormView(null);
      if (parts[1] && parts[2] === 'editar') return orderFormView(parts[1]);
      if (parts[1]) return orderDetailView(parts[1]);
      return ordersView();
    case 'estoque':
      if (parts[1] === 'movimentacoes') return movementsView();
      return stockView(query);
    case 'compras':
      if (parts[1] === 'nova') return purchaseFormView();
      return purchasesView();
    case 'despesas': return expensesView();
    case 'financeiro': return financeView();
    case 'clientes': return clientsView(query);
    case 'fornecedores': return suppliersView();
    case 'ajuda': return helpView(path);
    default: return notFoundView();
  }
}

function notFoundView() {
  return `
    <div class="page-wrap">
      ${U.pageHead({ title: 'Página não encontrada', subtitle: 'O endereço acessado não existe neste sistema.' })}
      ${U.emptyState({
        iconName: 'ajuda', title: 'Vamos voltar ao início?',
        text: 'Use o menu ao lado ou volte para o painel.',
        action: `<a class="btn btn-primary" href="#/">Ir para o painel</a>`
      })}
    </div>
  `;
}

let fontScale = Math.min(3, Math.max(1, Number(localStorage.getItem('fcv.fontScale') || 1)));
const FONT_LABELS = { 1: 'Normal', 2: 'Grande', 3: 'Maior' };

function applyFontScale() {
  document.documentElement.dataset.scale = String(fontScale);
  const current = document.querySelector('.font-current');
  if (current) current.textContent = FONT_LABELS[fontScale];
  const down = document.querySelector('[data-action="fontDown"]');
  const up = document.querySelector('[data-action="fontUp"]');
  if (down) down.disabled = fontScale <= 1;
  if (up) up.disabled = fontScale >= 3;
}

function render() {
  const route = parseRoute();
  const routeKey = `${route.path}${route.query.toString() ? `?${route.query.toString()}` : ''}`;
  const content = contentForPath(route.path, route.query);
  const storageWarning = S.storageWarning();
  root.innerHTML = U.shell({
    path: route.path,
    counts: S.sidebarCounts(),
    content: storageWarning ? `
      <div class="notice notice-warning" role="alert">
        <span class="notice-icon">${icon('alerta')}</span>
        <div><strong>Dados salvos precisam de atenção</strong><p>${esc(storageWarning)}</p></div>
        <a class="btn btn-small btn-warning" href="#/ajuda">Ver opções de recuperação</a>
      </div>${content}` : content,
    fontLabel: FONT_LABELS[fontScale]
  });
  document.title = `${titleForPath(route.path)} · Franlin Car Veículos`;
  document.body.classList.remove('menu-open');
  const menuButton = document.querySelector('[data-action="toggleMenu"]');
  menuButton?.setAttribute('aria-expanded', 'false');
  applyFontScale();
  lastRouteKey = routeKey;
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
  if (route.path === '/clientes' && route.query.get('cliente')) {
    const id = route.query.get('cliente');
    history.replaceState(null, '', `${location.pathname}${location.search}#/clientes`);
    setTimeout(() => openVehiclesModal(id), 40);
  }
  if (route.path === '/estoque' && route.query.get('entrada')) {
    const id = route.query.get('peca') || '';
    history.replaceState(null, '', `${location.pathname}${location.search}#/estoque`);
    setTimeout(() => openMovementModal(id), 40);
  }
  if (route.path === '/ajuda') setTimeout(loadManualIntoPage, 0);
}

function quickAction({ iconName, title, text, href = '', action = '', id = '', primary = false }) {
  if (href) {
    return `<a class="quick-action ${primary ? 'quick-primary' : ''}" href="${esc(href)}">${icon(iconName)}<span><strong>${esc(title)}</strong><small>${esc(text)}</small></span>${icon('avancar', 'quick-arrow')}</a>`;
  }
  return `<button type="button" class="quick-action ${primary ? 'quick-primary' : ''}" data-action="${esc(action)}" ${id ? `data-id="${esc(id)}"` : ''}>${icon(iconName)}<span><strong>${esc(title)}</strong><small>${esc(text)}</small></span>${icon('avancar', 'quick-arrow')}</button>`;
}

function icon(name, className = 'icon') {
  return U.icon(name, className);
}

function dashboardView() {
  const data = S.dashboardData();
  const empty = S.isStoreEmpty();
  const lastBackup = S.store.data.meta.lastBackupAt;
  const backupOld = !lastBackup || Date.now() - new Date(lastBackup).getTime() > 30 * 24 * 60 * 60 * 1000;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const quick = `
    <section class="section-block">
      <div class="section-heading">
        <div><h2>O que você deseja fazer?</h2><p>As tarefas mais usadas, com poucos cliques.</p></div>
      </div>
      <div class="quick-grid">
        ${quickAction({ iconName: 'plus', title: 'Abrir nova O.S.', text: 'Cliente, veículo, peças e serviço', href: '#/ordens/nova', primary: true })}
        ${quickAction({ iconName: 'clientes', title: 'Cadastrar cliente', text: 'Pessoa e veículos', href: '#/clientes' })}
        ${quickAction({ iconName: 'estoque', title: 'Entrada em peças', text: 'Registrar chegada ou saída', action: 'openMovement' })}
        ${quickAction({ iconName: 'despesas', title: 'Registrar despesa', text: 'Conta da oficina', href: '#/despesas' })}
      </div>
    </section>
  `;

  const firstUse = empty ? `
    <section class="onboarding-card">
      <div class="onboarding-copy">
        <span class="eyebrow">Primeiros passos</span>
        <h2>Bem-vindo ao sistema da Franlin Car Veículos</h2>
        <p>Comece pelos clientes e pelas peças. Depois, abra uma ordem de serviço e envie o orçamento pelo WhatsApp.</p>
        <ol class="onboarding-steps">
          <li><span>1</span><div><strong>Cadastre o cliente e o veículo</strong><small>Assim os próximos atendimentos ficam mais rápidos.</small></div></li>
          <li><span>2</span><div><strong>Cadastre as peças da oficina</strong><small>Informe o estoque atual e o estoque mínimo.</small></div></li>
          <li><span>3</span><div><strong>Abra a primeira O.S.</strong><small>Monte o orçamento e envie pelo WhatsApp.</small></div></li>
        </ol>
        <div class="onboarding-actions">
          <button type="button" class="btn btn-primary" data-action="loadDemo">${icon('painel')}Ver dados de exemplo</button>
          <a class="btn btn-ghost" href="#/ajuda">${icon('ajuda')}Ler o manual</a>
        </div>
        <p class="fine-print">Os dados de exemplo servem apenas para treinar. Você poderá apagá-los em Ajuda e manual.</p>
      </div>
    </section>
  ` : '';

  const backupBanner = !empty && backupOld ? `
    <div class="notice notice-warning">
      <span class="notice-icon">${icon('banco')}</span>
      <div><strong>Faça uma cópia de segurança</strong><p>Os dados ficam salvos neste navegador. Guarde uma cópia para não perder as informações se limpar o navegador ou trocar de computador.</p></div>
      <a class="btn btn-small btn-warning" href="#/ajuda">Fazer cópia</a>
    </div>
  ` : '';

  const stats = `
    <section class="stats-grid">
      ${U.statCard({ label: 'O.S. em andamento', value: String(data.openOrders), hint: 'Orçamentos e serviços aprovados', tone: 'blue', iconName: 'os' })}
      ${U.statCard({ label: 'A receber', value: money(data.receivablesTotal), hint: `${data.receivables.length} O.S. faturada(s)`, tone: 'amber', iconName: 'caixa' })}
      ${U.statCard({ label: 'A pagar', value: money(data.payablesTotal), hint: `${data.payablesCount} conta(s) em aberto`, tone: 'rose', iconName: 'despesas' })}
      ${U.statCard({ label: `Resultado de ${monthLabel(data.month)}`, value: money(data.outcomeMonth), hint: 'Recebimentos menos pagamentos', tone: data.outcomeMonth >= 0 ? 'green' : 'rose', iconName: 'painel' })}
    </section>
  `;

  const alerts = data.lowStock.length ? `
    <section class="card">
      <div class="card-head">
        <div><h2>${icon('alerta')}Atenção ao estoque</h2><p>Estas peças estão no estoque mínimo ou abaixo dele.</p></div>
        <a class="text-link" href="#/estoque">Ver estoque</a>
      </div>
      <div class="mini-list">
        ${data.lowStock.slice(0, 5).map((part) => `
          <div class="mini-row">
            <span class="mini-icon tone-amber">${icon('estoque')}</span>
            <div class="mini-copy"><strong>${esc(part.nome)}</strong><small>Código ${esc(part.codigo || 'não informado')} · mínimo ${esc(qty(part.estoqueMinimo))} ${esc(part.unidade)}</small></div>
            <span class="mini-value mini-value-alert">${esc(qty(part.quantidadeEstoque))} ${esc(part.unidade)}</span>
            <button type="button" class="btn btn-small btn-secondary" data-action="openMovement" data-id="${esc(part.id)}">Repor</button>
          </div>
        `).join('')}
      </div>
    </section>
  ` : '';

  const recentOrders = data.recentOrders.length ? `
    <section class="card">
      <div class="card-head">
        <div><h2>${icon('os')}Últimas ordens de serviço</h2><p>Acompanhe o andamento dos atendimentos.</p></div>
        <a class="text-link" href="#/ordens">Ver todas</a>
      </div>
      <div class="mini-list">
        ${data.recentOrders.map((order) => `
          <a class="mini-row mini-link" href="#/ordens/${esc(order.id)}">
            <span class="mini-icon tone-blue">${icon('os')}</span>
            <div class="mini-copy"><strong>${esc(order.numero)} · ${esc(order.clienteNome)}</strong><small>${esc(order.veiculoDescricao || 'Veículo não informado')}${order.veiculoPlaca ? ` · ${esc(order.veiculoPlaca)}` : ''}</small></div>
            <div class="mini-side"><strong>${esc(money(order.total))}</strong>${U.statusBadge(order.status)}</div>
          </a>
        `).join('')}
      </div>
    </section>
  ` : '';

  const recentMovements = data.recentMovements.length ? `
    <section class="card">
      <div class="card-head"><div><h2>${icon('estoque')}Últimas movimentações</h2><p>Entradas e saídas recentes de peças.</p></div><a class="text-link" href="#/estoque/movimentacoes">Ver histórico</a></div>
      <div class="mini-list">
        ${data.recentMovements.map((movement) => `
          <div class="mini-row">
            <span class="mini-icon ${movement.tipo === 'Entrada' ? 'tone-green' : 'tone-rose'}">${icon(movement.tipo === 'Entrada' ? 'subir' : 'baixar')}</span>
            <div class="mini-copy"><strong>${esc(movement.pecaNome)}</strong><small>${esc(movement.motivo)} · ${esc(fmtDate(movement.data))}</small></div>
            <span class="mini-value ${movement.tipo === 'Entrada' ? 'text-green' : 'text-rose'}">${movement.tipo === 'Entrada' ? '+' : '−'}${esc(qty(movement.quantidade))}</span>
          </div>
        `).join('')}
      </div>
    </section>
  ` : '';

  return `
    <div class="page-wrap">
      ${U.pageHead({ title: `${greeting}!`, subtitle: `Este é o painel da Franlin Car Veículos. Resumo de ${monthLabel(data.month)}.`, help: 'painel' })}
      ${backupBanner}
      ${firstUse}
      ${quick}
      ${stats}
      ${!empty ? `<div class="dashboard-grid">${alerts}${recentOrders}</div><div class="dashboard-grid">${recentMovements}${financeSummaryCard(data)}</div>` : ''}
    </div>
  `;
}

function financeSummaryCard(data) {
  return `
    <section class="card summary-card">
      <div class="card-head"><div><h2>${icon('caixa')}Caixa do mês</h2><p>Valores efetivamente pagos ou recebidos.</p></div></div>
      <div class="summary-body">
        ${U.moneyRow('Recebimentos', data.receivedMonth)}
        ${U.moneyRow('Compras pagas', data.paidPurchasesMonth)}
        ${U.moneyRow('Despesas pagas', data.paidExpensesMonth)}
        ${U.moneyRow('Resultado do mês', data.outcomeMonth, true)}
      </div>
      <a class="btn btn-secondary btn-block" href="#/financeiro">${icon('avancar')}Abrir contas e caixa</a>
    </section>
  `;
}

function ordersView() {
  const state = viewState.orders;
  const all = S.store.data.ordens;
  const open = all.filter((order) => order.status === 'Orçamento' || order.status === 'Aprovada');
  const billed = all.filter((order) => order.status === 'Faturada');
  const unpaid = billed.filter((order) => !order.pago);
  const total = sum(all.filter((order) => order.status !== 'Cancelada'), (order) => order.total);
  return `
    <div class="page-wrap">
      ${U.pageHead({
        title: 'Ordens de serviço',
        subtitle: 'Do orçamento ao pagamento. As peças saem do estoque quando a O.S. é aprovada.',
        help: 'ordens',
        actions: `<a class="btn btn-primary" href="#/ordens/nova">${icon('plus')}Nova O.S.</a>`
      })}
      <section class="stats-grid stats-grid-4">
        ${U.statCard({ label: 'Em andamento', value: String(open.length), iconName: 'os', tone: 'blue' })}
        ${U.statCard({ label: 'Faturadas', value: String(billed.length), iconName: 'checkCircle', tone: 'green' })}
        ${U.statCard({ label: 'A receber', value: money(sum(unpaid, (order) => order.total)), iconName: 'caixa', tone: 'amber' })}
        ${U.statCard({ label: 'Total não cancelado', value: money(total), iconName: 'painel', tone: 'neutral' })}
      </section>
      <section class="card">
        <div class="filter-row">
          <div class="filter-chips" role="group" aria-label="Filtrar por status">
            ${statusFilter('orders', 'todos', 'Todas', all.length)}
            ${S.OS_STATUSES.map((status) => statusFilter('orders', status, status, all.filter((order) => order.status === status).length)).join('')}
          </div>
          ${U.searchField({ value: state.search, placeholder: 'Buscar por O.S., cliente, placa ou serviço…', name: 'busca', label: 'Buscar ordens' }).replace('type="search"', 'type="search" data-search="orders"')}
        </div>
        <div data-list="orders">${renderOrdersList()}</div>
      </section>
    </div>
  `;
}

function statusFilter(scope, value, label, count = null) {
  const active = viewState[scope].status === value;
  return `<button type="button" class="chip ${active ? 'is-active' : ''}" data-action="filter" data-scope="${esc(scope)}" data-value="${esc(value)}" aria-pressed="${active}">${esc(label)}${count !== null ? `<span>${count}</span>` : ''}</button>`;
}

function filteredOrders() {
  const { search, status } = viewState.orders;
  const query = normalizeSearch(search);
  return [...S.store.data.ordens]
    .filter((order) => status === 'todos' || order.status === status)
    .filter((order) => {
      if (!query) return true;
      return normalizeSearch([order.numero, order.clienteNome, order.veiculoPlaca, order.veiculoDescricao, order.problemaRelatado].join(' ')).includes(query);
    })
    .sort((a, b) => String(b.atualizadoEm || b.criadoEm).localeCompare(String(a.atualizadoEm || a.criadoEm)));
}

function renderOrdersList() {
  const orders = filteredOrders();
  if (!orders.length) return U.emptyState({
    iconName: 'os', title: 'Nenhuma O.S. encontrada',
    text: S.store.data.ordens.length ? 'Tente outro filtro ou limpe a busca.' : 'Abra uma nova ordem para começar.',
    action: S.store.data.ordens.length ? '' : `<a class="btn btn-primary" href="#/ordens/nova">${icon('plus')}Abrir primeira O.S.</a>`
  });
  return `<div class="record-list">${orders.map((order) => `
    <a class="record-card order-record" href="#/ordens/${esc(order.id)}">
      <span class="record-icon">${icon('os')}</span>
      <div class="record-main">
        <div class="record-title-line"><strong>${esc(order.numero)}</strong>${U.statusBadge(order.status)}${order.status === 'Faturada' ? U.statusBadge(order.pago ? 'Pago' : 'Pendente') : ''}</div>
        <p>${esc(order.clienteNome)}</p>
        <small>${esc(order.veiculoDescricao || 'Veículo não informado')}${order.veiculoPlaca ? ` · ${esc(order.veiculoPlaca)}` : ''}</small>
      </div>
      <div class="record-side">
        <strong>${esc(money(order.total))}</strong>
        <small>${esc(fmtDate(order.dataAbertura))}</small>
      </div>
      <span class="record-chevron">${icon('avancar')}</span>
    </a>
  `).join('')}</div>`;
}

function orderDetailView(id) {
  const order = S.ordemById(id);
  if (!order) return notFoundView();
  const client = S.clienteById(order.clienteId);
  const vehicle = S.veiculoById(order.veiculoId);
  const totals = S.computeOrderTotals(order.itens || [], order.desconto);
  const phone = S.clientePhone(order);

  return `
    <div class="page-wrap">
      <a class="back-link" href="#/ordens">${icon('voltar')}Voltar para ordens</a>
      <section class="detail-hero">
        <div>
          <div class="eyebrow">Ordem de serviço</div>
          <h1>O.S. ${esc(order.numero)}</h1>
          <p>${esc(order.clienteNome)} · ${esc(order.veiculoDescricao || 'Veículo não informado')}${order.veiculoPlaca ? ` · ${esc(order.veiculoPlaca)}` : ''}</p>
          <div class="badge-line">${U.statusBadge(order.status)}${order.estoqueBaixado ? `<span class="stock-used">${icon('estoque')}Peças baixadas do estoque</span>` : ''}</div>
        </div>
        <div class="detail-total"><span>Total da O.S.</span><strong>${esc(money(totals.total))}</strong></div>
      </section>

      <div class="detail-grid">
        <div class="detail-main">
          <section class="card">
            <div class="card-head"><div><h2>${icon('os')}Serviço solicitado</h2><p>Problema relatado pelo cliente.</p></div></div>
            <div class="prose-block">${order.problemaRelatado ? esc(order.problemaRelatado).replace(/\n/g, '<br>') : '<span class="muted">Nenhum problema descrito.</span>'}</div>
          </section>

          <section class="card">
            <div class="card-head"><div><h2>${icon('estoque')}Peças e mão de obra</h2><p>${(order.itens || []).length} item(ns) neste orçamento.</p></div><button type="button" class="btn btn-small btn-secondary" data-action="orderEdit" data-id="${esc(order.id)}">${icon('editar')}Editar itens</button></div>
            ${orderItemsTable(order.itens || [])}
            <div class="totals-box">
              ${U.moneyRow('Total em peças', order.totalPecas)}
              ${U.moneyRow('Mão de obra', order.totalMaoObra)}
              ${Number(order.desconto) > 0 ? U.moneyRow('Desconto', -Number(order.desconto)) : ''}
              ${U.moneyRow('Total geral', order.total, true)}
            </div>
          </section>

          ${order.observacoes ? `<section class="card"><div class="card-head"><div><h2>${icon('mensagem')}Observações</h2></div></div><div class="prose-block">${esc(order.observacoes).replace(/\n/g, '<br>')}</div></section>` : ''}

          <section class="card">
            <div class="card-head"><div><h2>${icon('calendario')}Datas e veículo</h2></div></div>
            <dl class="data-grid">
              <div><dt>Abertura</dt><dd>${esc(fmtDate(order.dataAbertura))}</dd></div>
              <div><dt>Previsão de entrega</dt><dd>${esc(fmtDate(order.dataPrevisao))}</dd></div>
              <div><dt>Faturamento</dt><dd>${esc(fmtDate(order.dataFaturamento))}</dd></div>
              <div><dt>KM informado</dt><dd>${order.km ? `${esc(qty(order.km))} km` : '—'}</dd></div>
            </dl>
          </section>
        </div>

        <aside class="detail-side">
          <section class="card action-card">
            <div class="card-head"><div><h2>Próximos passos</h2><p>Use as ações na ordem indicada.</p></div></div>
            <div class="action-stack">
              ${nextOrderActions(order, phone)}
            </div>
          </section>

          <section class="card">
            <div class="card-head"><div><h2>${icon('caixa')}Pagamento</h2></div>${order.status === 'Faturada' ? U.statusBadge(order.pago ? 'Pago' : 'Pendente') : ''}</div>
            <dl class="data-list">
              <div><dt>Forma</dt><dd>${esc(order.formaPagamento || 'Não informada')}</dd></div>
              <div><dt>Pagamento</dt><dd>${order.pago ? esc(fmtDate(order.dataPagamento)) : (order.status === 'Faturada' ? 'Aguardando' : 'Após faturamento')}</dd></div>
            </dl>
            ${order.status === 'Faturada' ? (order.pago
              ? `<button type="button" class="btn btn-ghost btn-block" data-action="orderUnpay" data-id="${esc(order.id)}">${icon('voltar')}Marcar como não pago</button>`
              : `<button type="button" class="btn btn-success btn-block" data-action="orderPay" data-id="${esc(order.id)}">${icon('check')}Marcar como recebida</button>`) : ''}
          </section>

          <section class="card">
            <div class="card-head"><div><h2>${icon('clientes')}Cliente</h2></div></div>
            <div class="person-block">
              ${U.avatar(order.clienteNome)}
              <div><strong>${esc(order.clienteNome)}</strong><small>${esc(phone || 'Telefone não informado')}</small></div>
            </div>
            <dl class="data-list">
              <div><dt>CPF / CNPJ</dt><dd>${esc(order.clienteDocumento || '—')}</dd></div>
              <div><dt>Endereço</dt><dd>${esc(order.clienteEndereco || '—')}</dd></div>
            </dl>
            ${client ? `<a class="btn btn-secondary btn-block" href="#/clientes?cliente=${esc(client.id)}">${icon('clientes')}Abrir cadastro do cliente</a>` : ''}
          </section>

          <section class="card">
            <div class="card-head"><div><h2>${icon('carro')}Veículo</h2></div></div>
            <div class="vehicle-block">${icon('carro')}<div><strong>${esc(order.veiculoDescricao || 'Não informado')}</strong><small>${esc(order.veiculoPlaca || 'Placa não informada')}</small></div></div>
            ${vehicle ? `<p class="fine-print">Veículo vinculado ao cadastro do cliente.</p>` : ''}
          </section>

          <section class="card">
            <div class="card-head"><div><h2>Outras ações</h2></div></div>
            <div class="action-stack">
              <button type="button" class="btn btn-whatsapp btn-block" data-action="orderWhatsApp" data-id="${esc(order.id)}" data-template="${esc(order.status === 'Orçamento' ? 'orcamento' : order.status === 'Cancelada' ? 'cancelada' : order.status === 'Faturada' ? 'pronta' : 'andamento')}">${icon('whatsapp')}Enviar mensagem no WhatsApp</button>
              <button type="button" class="btn btn-secondary btn-block" data-action="orderPrint" data-id="${esc(order.id)}">${icon('imprimir')}Imprimir / salvar PDF</button>
              <a class="btn btn-secondary btn-block" href="#/ordens/${esc(order.id)}/editar">${icon('editar')}Editar O.S.</a>
              <button type="button" class="btn btn-danger-ghost btn-block" data-action="orderDelete" data-id="${esc(order.id)}">${icon('lixeira')}Excluir O.S.</button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  `;
}

function orderItemsTable(items) {
  if (!items.length) return U.emptyState({ iconName: 'estoque', title: 'Nenhum item lançado', text: 'Edite a O.S. para adicionar peças ou mão de obra.', compact: true });
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Tipo</th><th>Descrição</th><th class="num">Qtd.</th><th class="num">Unitário</th><th class="num">Total</th></tr></thead>
        <tbody>
          ${items.map((item) => {
            const total = (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0);
            return `<tr><td><span class="item-type ${item.tipo === 'mao_obra' ? 'item-labor' : ''}">${icon(item.tipo === 'peca' ? 'estoque' : 'chave')}${item.tipo === 'peca' ? 'Peça' : 'Mão de obra'}</span></td><td><strong>${esc(item.descricao || item.pecaNome || 'Item')}</strong>${item.codigo ? `<small>Código ${esc(item.codigo)}</small>` : ''}</td><td class="num">${esc(qty(item.quantidade))} ${esc(item.unidade || '')}</td><td class="num">${esc(money(item.valorUnitario))}</td><td class="num"><strong>${esc(money(total))}</strong></td></tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function nextOrderActions(order, phone) {
  const buttons = [];
  if (order.status === 'Orçamento') {
    buttons.push(`<button type="button" class="btn btn-whatsapp btn-block" data-action="orderWhatsApp" data-id="${esc(order.id)}" data-template="orcamento">${icon('whatsapp')}Enviar orçamento</button>`);
    buttons.push(`<button type="button" class="btn btn-success btn-block" data-action="orderApprove" data-id="${esc(order.id)}">${icon('check')}Cliente aprovou</button>`);
  } else if (order.status === 'Aprovada') {
    buttons.push(`<button type="button" class="btn btn-whatsapp btn-block" data-action="orderWhatsApp" data-id="${esc(order.id)}" data-template="andamento">${icon('whatsapp')}Avisar cliente</button>`);
    buttons.push(`<button type="button" class="btn btn-primary btn-block" data-action="orderInvoice" data-id="${esc(order.id)}">${icon('despesas')}Faturar O.S.</button>`);
  } else if (order.status === 'Faturada') {
    if (!order.pago) {
      buttons.push(`<button type="button" class="btn btn-success btn-block" data-action="orderPay" data-id="${esc(order.id)}">${icon('check')}Marcar como recebida</button>`);
      buttons.push(`<button type="button" class="btn btn-whatsapp btn-block" data-action="orderWhatsApp" data-id="${esc(order.id)}" data-template="cobranca">${icon('whatsapp')}Cobrar no WhatsApp</button>`);
    } else {
      buttons.push(`<div class="notice notice-success compact">${icon('checkCircle')}<div><strong>Pagamento recebido</strong><p>${esc(fmtDate(order.dataPagamento))}</p></div></div>`);
    }
    buttons.push(`<button type="button" class="btn btn-whatsapp btn-block" data-action="orderWhatsApp" data-id="${esc(order.id)}" data-template="pronta">${icon('whatsapp')}Avisar que está pronto</button>`);
  } else if (order.status === 'Cancelada') {
    buttons.push(`<button type="button" class="btn btn-primary btn-block" data-action="orderReopen" data-id="${esc(order.id)}">${icon('voltar')}Reabrir como orçamento</button>`);
  }
  if (order.status !== 'Cancelada' && order.status !== 'Faturada') {
    buttons.push(`<button type="button" class="btn btn-danger-ghost btn-block" data-action="orderCancel" data-id="${esc(order.id)}">${icon('x')}Cancelar O.S.</button>`);
  }
  if (order.status === 'Cancelada') {
    buttons.push(`<p class="field-help">O.S. cancelada. Se as peças haviam sido baixadas, elas voltaram ao estoque.</p>`);
  }
  if (!phone) buttons.push(`<p class="field-help text-warning">Cadastre o telefone com DDD do cliente para enviar mensagens.</p>`);
  return buttons.join('');
}

function blankOsDraft() {
  return {
    id: '', numero: S.peekNextOrderNumber(), clienteId: '', veiculoId: '', km: '',
    dataAbertura: todayISO(), dataPrevisao: '', problemaRelatado: '', itens: [],
    desconto: 0, status: 'Orçamento', formaPagamento: '', pago: false, observacoes: '', step: 1
  };
}

function ensureOsDraft() {
  if (!osDraft) osDraft = blankOsDraft();
  return osDraft;
}

function orderFormView(id) {
  if (id && (!osDraft || osDraft.id !== id)) {
    const order = S.ordemById(id);
    if (!order) return notFoundView();
    osDraft = { ...order, itens: (order.itens || []).map((item) => ({ ...item })), step: 1 };
  }
  if (!id && (!osDraft || osDraft.id)) osDraft = blankOsDraft();
  const draft = ensureOsDraft();
  if (!draft.step) draft.step = 1;
  return `
    <div class="page-wrap">
      <a class="back-link" href="#/ordens">${icon('voltar')}Voltar para ordens</a>
      ${osStepper(draft.step)}
      ${draft.step === 1 ? osStepOne(draft) : draft.step === 2 ? osStepTwo(draft) : osStepThree(draft)}
    </div>
  `;
}

function osStepper(step) {
  const steps = [
    { number: 1, label: 'Cliente e veículo', id: 'cliente' },
    { number: 2, label: 'Peças e serviços', id: 'itens' },
    { number: 3, label: 'Revisão e envio', id: 'revisao' }
  ];
  return `<ol class="stepper" aria-label="Passos da ordem de serviço">${steps.map((item) => `
    <li class="${step === item.number ? 'is-current' : ''} ${step > item.number ? 'is-done' : ''}">
      <span>${step > item.number ? icon('check') : item.number}</span>
      <div><small>Passo ${item.number} de 3</small><strong>${esc(item.label)}</strong></div>
    </li>`).join('')}</ol>`;
}

function osStepOne(draft) {
  const clients = sortBy(S.store.data.clientes, (client) => client.nome);
  const vehicles = S.veiculosDoCliente(draft.clienteId);
  const client = S.clienteById(draft.clienteId);
  return `
    <header class="form-page-head">
      <div><span class="eyebrow">Passo 1 de 3</span><h1>${draft.id ? 'Editar cliente e veículo' : 'Quem será atendido?'}</h1><p>Escolha um cliente cadastrado e o veículo que está na oficina.</p></div>
    </header>
    <form class="form-card" data-form="osStep1">
      ${!clients.length ? U.emptyState({
        iconName: 'clientes', title: 'Cadastre o primeiro cliente',
        text: 'Sem cliente não é possível abrir uma O.S.',
        action: `<button type="button" class="btn btn-primary" data-action="newClient">${icon('plus')}Cadastrar cliente</button>`,
        compact: true
      }) : `
        <div class="form-section">
          <div class="form-section-head"><span>1</span><div><h2>Cliente</h2><p>O telefone será usado no WhatsApp.</p></div><button type="button" class="btn btn-small btn-secondary" data-action="newClient">${icon('plus')}Novo cliente</button></div>
          <div class="form-grid">
            ${U.selectField({ label: 'Cliente', name: 'clienteId', value: draft.clienteId, required: true, options: clients.map((item) => ({ value: item.id, label: `${item.nome}${item.telefone ? ` · ${item.telefone}` : ''}` })), placeholder: 'Escolha o cliente', span: 2, attrs: 'data-os-client' })}
            ${client ? `<div class="inline-note field-span2">${icon('telefone')}<span>${esc(client.telefone || 'Sem telefone cadastrado')} · ${esc(client.cpfCnpj || 'Sem CPF/CNPJ')}</span></div>` : ''}
          </div>
        </div>
      `}

      <div class="form-section">
        <div class="form-section-head"><span>2</span><div><h2>Veículo</h2><p>Escolha um veículo do cliente ou cadastre um novo.</p></div>${client ? `<button type="button" class="btn btn-small btn-secondary" data-action="osNewVehicle" data-id="${esc(client.id)}">${icon('plus')}Novo veículo</button>` : ''}</div>
        <div class="form-grid">
          ${U.selectField({ label: 'Veículo do cliente', name: 'veiculoId', value: draft.veiculoId, required: true, options: vehicles.map((vehicle) => ({ value: vehicle.id, label: `${vehicle.placa} · ${vehicleTitle(vehicle) || 'Veículo'}${vehicle.cor ? ` · ${vehicle.cor}` : ''}` })), placeholder: client ? 'Escolha o veículo' : 'Escolha o cliente primeiro', span: 2, attrs: client ? '' : 'disabled', help: vehicles.length ? 'A placa e a descrição serão copiadas para a O.S.' : client ? 'Este cliente ainda não tem veículo. Use o botão Novo veículo.' : '' })}
          ${U.field({ label: 'KM atual', name: 'km', value: draft.km, placeholder: 'Ex.: 128400', help: 'Quilometragem informada na entrada.', attrs: 'inputmode="numeric" maxlength="10"' })}
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-head"><span>3</span><div><h2>Atendimento</h2><p>Descreva o problema com as palavras do cliente.</p></div></div>
        <div class="form-grid">
          ${U.field({ label: 'Data de abertura', name: 'dataAbertura', type: 'date', value: draft.dataAbertura })}
          ${U.field({ label: 'Previsão de entrega', name: 'dataPrevisao', type: 'date', value: draft.dataPrevisao, help: 'Pode ser preenchida depois.' })}
          ${U.textareaField({ label: 'Problema relatado / serviço solicitado', name: 'problemaRelatado', value: draft.problemaRelatado, rows: 4, placeholder: 'Ex.: barulho no freio ao parar; cliente pediu revisão completa.' })}
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-action="osCancel">${icon('x')}Cancelar</button>
        <button type="submit" class="btn btn-primary btn-large">Continuar para peças e serviços ${icon('avancar')}</button>
      </div>
    </form>
  `;
}

function osStepTwo(draft) {
  const client = S.clienteById(draft.clienteId);
  const vehicle = S.veiculoById(draft.veiculoId);
  const totals = S.computeOrderTotals(draft.itens || [], 0);
  return `
    <header class="form-page-head">
      <div><span class="eyebrow">Passo 2 de 3</span><h1>Quais peças e serviços?</h1><p>Adicione cada item. O sistema calcula o total automaticamente.</p></div>
      <div class="selected-entity">${U.avatar(client?.nome || '?')}<div><small>Cliente e veículo</small><strong>${esc(client?.nome || '')}</strong><span>${esc(vehicleTitle(vehicle))}${vehicle?.placa ? ` · ${esc(vehicle.placa)}` : ''}</span></div><button type="button" class="btn btn-small btn-secondary" data-action="osBack">${icon('editar')}Alterar</button></div>
    </header>
    <div class="os-items-layout">
      <section class="card">
        <div class="card-head"><div><h2>${icon('estoque')}Itens da O.S.</h2><p>${(draft.itens || []).length} item(ns) adicionado(s).</p></div></div>
        <div class="os-item-list">
          ${(draft.itens || []).length ? draft.itens.map((item, index) => osItemCard(item, index)).join('') : U.emptyState({
            iconName: 'plus', title: 'Ainda não há itens',
            text: 'Adicione uma peça do estoque ou um serviço de mão de obra.',
            compact: true
          })}
        </div>
        <div class="add-item-actions">
          <button type="button" class="btn btn-primary" data-action="osAddPart">${icon('estoque')}Adicionar peça</button>
          <button type="button" class="btn btn-secondary" data-action="osAddLabor">${icon('chave')}Adicionar mão de obra</button>
        </div>
      </section>
      <aside class="card totals-card">
        <div class="card-head"><div><h2>Total até agora</h2></div></div>
        ${U.moneyRow('Peças', totals.totalPecas)}
        ${U.moneyRow('Mão de obra', totals.totalMaoObra)}
        ${U.moneyRow('Subtotal', totals.total, true)}
        <p class="field-help">O desconto será informado no próximo passo.</p>
      </aside>
    </div>
    <div class="form-actions form-actions-sticky">
      <button type="button" class="btn btn-ghost" data-action="osBack">${icon('voltar')}Voltar</button>
      <button type="button" class="btn btn-primary btn-large" data-action="osNextReview">Continuar para revisão ${icon('avancar')}</button>
    </div>
  `;
}

function osItemCard(item, index) {
  const part = item.pecaId ? S.pecaById(item.pecaId) : null;
  const total = (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0);
  const insufficient = item.tipo === 'peca' && part && Number(item.quantidade) > Number(part.quantidadeEstoque);
  return `
    <article class="os-item-card">
      <span class="os-item-icon ${item.tipo === 'mao_obra' ? 'tone-amber' : 'tone-blue'}">${icon(item.tipo === 'peca' ? 'estoque' : 'chave')}</span>
      <div class="os-item-copy"><span class="item-kind">${item.tipo === 'peca' ? 'Peça' : 'Mão de obra'}</span><strong>${esc(item.descricao || item.pecaNome || 'Item')}</strong><small>${esc(qty(item.quantidade))} ${esc(item.unidade || '')} × ${esc(money(item.valorUnitario))}${part ? ` · Disponível: ${esc(qty(part.quantidadeEstoque))} ${esc(part.unidade)}` : ''}</small>${insufficient ? `<span class="inline-warning">${icon('alerta')}Quantidade maior que o estoque atual.</span>` : ''}</div>
      <strong class="os-item-total">${esc(money(total))}</strong>
      <div class="os-item-actions"><button type="button" class="icon-button" data-action="osEditItem" data-index="${index}" aria-label="Editar item">${icon('editar')}</button><button type="button" class="icon-button danger-icon" data-action="osRemoveItem" data-index="${index}" aria-label="Remover item">${icon('lixeira')}</button></div>
    </article>
  `;
}

function osStepThree(draft) {
  const client = S.clienteById(draft.clienteId);
  const vehicle = S.veiculoById(draft.veiculoId);
  const totals = S.computeOrderTotals(draft.itens || [], draft.desconto);
  const phone = client?.telefone || '';
  return `
    <header class="form-page-head">
      <div><span class="eyebrow">Passo 3 de 3</span><h1>Revise e salve a O.S.</h1><p>Confira os dados, escolha o status e salve. Depois você poderá enviar o orçamento pelo WhatsApp.</p></div>
    </header>
    <form class="form-card" data-form="osSave">
      <section class="review-summary">
        <div><span>Cliente</span><strong>${esc(client?.nome || '')}</strong><small>${esc(phone || 'Sem telefone')}</small></div>
        <div><span>Veículo</span><strong>${esc(vehicleTitle(vehicle) || '')}</strong><small>${esc(vehicle?.placa || '')}</small></div>
        <div><span>Itens</span><strong>${(draft.itens || []).length} item(ns)</strong><small>${esc(money(totals.totalPecas + totals.totalMaoObra))}</small></div>
        <button type="button" class="btn btn-small btn-secondary" data-action="osBackTwo">${icon('editar')}Alterar itens</button>
      </section>

      <div class="form-section">
        <div class="form-section-head"><span>1</span><div><h2>Status e pagamento</h2><p>Deixe em Orçamento para enviar ao cliente antes de aprovar.</p></div></div>
        <div class="form-grid">
          ${U.field({ label: 'Número da O.S.', name: 'numero', value: draft.numero, required: true, attrs: 'maxlength="24"' })}
          ${U.selectField({ label: 'Status', name: 'status', value: draft.status, required: true, options: S.OS_STATUSES, attrs: 'data-os-status', help: 'Ao aprovar ou faturar, as peças são baixadas do estoque automaticamente.' })}
          ${U.field({ label: 'Desconto (R$)', name: 'desconto', type: 'number', min: '0', step: '0.01', value: draft.desconto || 0 })}
          ${U.selectField({ label: 'Forma de pagamento', name: 'formaPagamento', value: draft.formaPagamento, options: S.PAYMENT_METHODS, placeholder: 'Escolha depois' })}
          <label class="check-card field-span2"><input type="checkbox" name="pago" ${draft.pago ? 'checked' : ''} ${draft.status === 'Faturada' ? '' : 'disabled'}><span><strong>Pagamento já recebido</strong><small>Disponível quando a O.S. estiver faturada.</small></span></label>
          <div class="inline-note field-span2 status-stock-note" id="os-stock-note">${icon('info')}<span>${draft.status === 'Orçamento' ? 'Em orçamento: nenhuma peça sai do estoque.' : draft.status === 'Aprovada' || draft.status === 'Faturada' ? 'Ao salvar, as peças desta O.S. serão baixadas do estoque.' : 'O.S. cancelada: nenhuma peça será baixada.'}</span></div>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-head"><span>2</span><div><h2>Observações</h2><p>Use para combinações com o cliente ou detalhes internos.</p></div></div>
        ${U.textareaField({ label: 'Observações da O.S.', name: 'observacoes', value: draft.observacoes, rows: 3 })}
      </div>

      <div class="final-total">
        <div><span>Peças</span><strong>${esc(money(totals.totalPecas))}</strong></div>
        <div><span>Mão de obra</span><strong>${esc(money(totals.totalMaoObra))}</strong></div>
        <div><span>Desconto</span><strong>− ${esc(money(draft.desconto))}</strong></div>
        <div class="final-total-main"><span>Total da O.S.</span><strong>${esc(money(totals.total))}</strong></div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-action="osBackTwo">${icon('voltar')}Voltar</button>
        <div class="form-actions-right">
          ${phone && draft.itens.length ? `<button type="submit" name="intent" value="send" class="btn btn-whatsapp">${icon('whatsapp')}Salvar e enviar no WhatsApp</button>` : ''}
          <button type="submit" name="intent" value="save" class="btn btn-primary btn-large">${icon('check')}Salvar O.S.</button>
        </div>
      </div>
    </form>
  `;
}

function stockView() {
  const state = viewState.stock;
  const parts = S.store.data.pecas;
  const alerts = S.lowStockParts();
  const units = sum(parts, (part) => part.quantidadeEstoque);
  const value = sum(parts, (part) => (Number(part.precoCusto) || 0) * (Number(part.quantidadeEstoque) || 0));
  return `
    <div class="page-wrap">
      ${U.pageHead({
        title: 'Peças em estoque',
        subtitle: 'Controle o disponível, o estoque mínimo e todo o histórico de entradas e saídas.',
        help: 'estoque',
        actions: `<a class="btn btn-secondary" href="#/estoque/movimentacoes">${icon('relogio')}Movimentações</a><button type="button" class="btn btn-primary" data-action="newPart">${icon('plus')}Nova peça</button>`
      })}
      <section class="stats-grid stats-grid-4">
        ${U.statCard({ label: 'Peças cadastradas', value: String(parts.length), iconName: 'estoque', tone: 'blue' })}
        ${U.statCard({ label: 'Unidades em estoque', value: qty(units), iconName: 'banco', tone: 'neutral' })}
        ${U.statCard({ label: 'Valor de custo', value: money(value), iconName: 'caixa', tone: 'green' })}
        ${U.statCard({ label: 'Alertas de reposição', value: String(alerts.length), hint: 'No mínimo ou abaixo dele', iconName: 'alerta', tone: alerts.length ? 'amber' : 'green' })}
      </section>
      <section class="card">
        <div class="filter-row stock-filter-row">
          ${U.searchField({ value: state.search, placeholder: 'Buscar por nome, código, marca ou fornecedor…', name: 'busca', label: 'Buscar peças' }).replace('type="search"', 'type="search" data-search="stock"')}
          <label class="inline-select"><span class="sr-only">Categoria</span><select data-stock-category aria-label="Filtrar por categoria">${stockCategoryOptions(state.categoria)}</select></label>
          <button type="button" class="chip ${state.lowOnly ? 'is-active' : ''}" data-action="filter" data-scope="stock" data-value="low" aria-pressed="${state.lowOnly}">${icon('alerta')}Somente estoque mínimo</button>
          <button type="button" class="btn btn-secondary btn-small" data-action="openMovement">${icon('subir')}Entrada / saída</button>
        </div>
        <div data-list="stock">${renderStockList()}</div>
      </section>
    </div>
  `;
}

function stockCategoryOptions(selected) {
  const all = ['todos', ...S.PART_CATEGORIES];
  return all.map((category) => `<option value="${esc(category)}" ${selected === category ? 'selected' : ''}>${category === 'todos' ? 'Todas as categorias' : category}</option>`).join('');
}

function filteredStock() {
  const { search, categoria, lowOnly } = viewState.stock;
  const query = normalizeSearch(search);
  return [...S.store.data.pecas]
    .filter((part) => categoria === 'todos' || part.categoria === categoria)
    .filter((part) => !lowOnly || (Number(part.estoqueMinimo) > 0 && Number(part.quantidadeEstoque) <= Number(part.estoqueMinimo)))
    .filter((part) => {
      if (!query) return true;
      const supplier = S.fornecedorById(part.fornecedorId)?.nome || part.fornecedorNome;
      return normalizeSearch([part.nome, part.codigo, part.marca, part.categoria, supplier, part.localizacao].join(' ')).includes(query);
    })
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
}

function renderStockList() {
  const parts = filteredStock();
  if (!parts.length) return U.emptyState({
    iconName: 'estoque', title: 'Nenhuma peça encontrada',
    text: S.store.data.pecas.length ? 'Tente outro filtro ou limpe a busca.' : 'Cadastre a primeira peça e informe o estoque inicial.',
    action: S.store.data.pecas.length ? '' : `<button type="button" class="btn btn-primary" data-action="newPart">${icon('plus')}Cadastrar peça</button>`
  });
  return `
    <div class="table-wrap">
      <table class="data-table stock-table">
        <thead><tr><th>Peça</th><th class="num">Disponível</th><th class="num">Mínimo</th><th class="num">Custo / venda</th><th>Fornecedor</th><th class="actions-col">Ações</th></tr></thead>
        <tbody>${parts.map((part) => {
          const low = Number(part.estoqueMinimo) > 0 && Number(part.quantidadeEstoque) <= Number(part.estoqueMinimo);
          const negative = Number(part.quantidadeEstoque) < 0;
          return `
            <tr>
              <td data-label="Peça"><strong>${esc(part.nome)}</strong><small>${esc(part.codigo || 'Sem código')}${part.marca ? ` · ${esc(part.marca)}` : ''}${part.localizacao ? ` · ${esc(part.localizacao)}` : ''}</small><span class="table-tag">${esc(part.categoria)}</span></td>
              <td class="num" data-label="Disponível"><span class="stock-qty ${negative ? 'is-negative' : low ? 'is-low' : ''}">${esc(qty(part.quantidadeEstoque))} ${esc(part.unidade)}</span>${low ? '<small class="text-warning">Repor</small>' : ''}</td>
              <td class="num" data-label="Mínimo">${esc(qty(part.estoqueMinimo))} ${esc(part.unidade)}</td>
              <td class="num" data-label="Custo / venda"><span>${esc(money(part.precoCusto))}</span><small>${esc(money(part.precoVenda))}</small></td>
              <td data-label="Fornecedor">${esc(S.fornecedorById(part.fornecedorId)?.nome || part.fornecedorNome || '—')}</td>
              <td class="actions-col" data-label="Ações"><div class="table-actions"><button type="button" class="btn btn-small btn-secondary" data-action="openMovement" data-id="${esc(part.id)}">Entrada/saída</button><button type="button" class="btn btn-small btn-ghost" data-action="partHistory" data-id="${esc(part.id)}">Histórico</button><button type="button" class="icon-button" data-action="editPart" data-id="${esc(part.id)}" aria-label="Editar ${esc(part.nome)}">${icon('editar')}</button><button type="button" class="icon-button danger-icon" data-action="deletePart" data-id="${esc(part.id)}" aria-label="Excluir ${esc(part.nome)}">${icon('lixeira')}</button></div></td>
            </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
  `;
}

function movementsView() {
  const state = viewState.movements;
  return `
    <div class="page-wrap">
      <a class="back-link" href="#/estoque">${icon('voltar')}Voltar para estoque</a>
      ${U.pageHead({ title: 'Movimentações de estoque', subtitle: 'Histórico de entradas, saídas e estornos de peças.', help: 'estoque' })}
      <section class="card">
        <div class="filter-row">
          <div class="filter-chips" role="group" aria-label="Filtrar movimentações">
            ${movementFilter('todos', 'Todas')}${movementFilter('Entrada', 'Entradas')}${movementFilter('Saída', 'Saídas')}
          </div>
          ${U.searchField({ value: state.search, placeholder: 'Buscar peça, motivo ou referência…', name: 'busca', label: 'Buscar movimentações' }).replace('type="search"', 'type="search" data-search="movements"')}
        </div>
        <div data-list="movements">${renderMovementsList()}</div>
      </section>
    </div>
  `;
}

function movementFilter(value, label) {
  const active = viewState.movements.tipo === value;
  return `<button type="button" class="chip ${active ? 'is-active' : ''}" data-action="movementFilter" data-value="${esc(value)}" aria-pressed="${active}">${esc(label)}</button>`;
}

function filteredMovements() {
  const { search, tipo } = viewState.movements;
  const query = normalizeSearch(search);
  return [...S.store.data.movimentacoes]
    .filter((movement) => tipo === 'todos' || movement.tipo === tipo)
    .filter((movement) => !query || normalizeSearch([movement.pecaNome, movement.motivo, movement.referencia].join(' ')).includes(query))
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));
}

function renderMovementsList() {
  const movements = filteredMovements();
  if (!movements.length) return U.emptyState({ iconName: 'relogio', title: 'Nenhuma movimentação', text: 'As entradas e saídas aparecerão aqui.', compact: true });
  return `<div class="record-list">${movements.map((movement) => `
    <article class="record-card movement-record">
      <span class="record-icon ${movement.tipo === 'Entrada' ? 'record-green' : 'record-rose'}">${icon(movement.tipo === 'Entrada' ? 'subir' : 'baixar')}</span>
      <div class="record-main"><div class="record-title-line"><strong>${esc(movement.pecaNome)}</strong>${U.statusBadge(movement.tipo)}</div><p>${esc(movement.motivo)}</p><small>${esc(fmtDateTime(movement.data))}${movement.referencia ? ` · ${esc(movement.referencia)}` : ''}</small></div>
      <div class="record-side"><strong class="${movement.tipo === 'Entrada' ? 'text-green' : 'text-rose'}">${movement.tipo === 'Entrada' ? '+' : '−'}${esc(qty(movement.quantidade))}</strong><small>${esc(qty(movement.saldoAnterior))} → ${esc(qty(movement.saldoNovo))}</small></div>
    </article>`).join('')}</div>`;
}

function clientsView() {
  const state = viewState.clients;
  const clients = S.store.data.clientes;
  const vehicles = S.store.data.veiculos;
  return `
    <div class="page-wrap">
      ${U.pageHead({
        title: 'Clientes',
        subtitle: 'Cadastre as pessoas e os veículos para agilizar as próximas ordens de serviço.',
        help: 'clientes',
        actions: `<button type="button" class="btn btn-primary" data-action="newClient">${icon('plus')}Novo cliente</button>`
      })}
      <section class="stats-grid stats-grid-3">
        ${U.statCard({ label: 'Clientes cadastrados', value: String(clients.length), iconName: 'clientes', tone: 'blue' })}
        ${U.statCard({ label: 'Veículos cadastrados', value: String(vehicles.length), iconName: 'carro', tone: 'green' })}
        ${U.statCard({ label: 'Com WhatsApp', value: String(clients.filter((client) => client.telefone).length), iconName: 'whatsapp', tone: 'green' })}
      </section>
      <section class="card">
        <div class="filter-row">
          ${U.searchField({ value: state.search, placeholder: 'Buscar nome, telefone, CPF/CNPJ, placa ou veículo…', name: 'busca', label: 'Buscar clientes' }).replace('type="search"', 'type="search" data-search="clients"')}
          <p class="filter-help">${icon('info')}Clique em Veículos para cadastrar ou editar os carros do cliente.</p>
        </div>
        <div data-list="clients">${renderClientsList()}</div>
      </section>
    </div>
  `;
}

function filteredClients() {
  const query = normalizeSearch(viewState.clients.search);
  return [...S.store.data.clientes]
    .filter((client) => {
      if (!query) return true;
      const vehicles = S.veiculosDoCliente(client.id);
      return normalizeSearch([
        client.nome, client.telefone, client.email, client.cpfCnpj, client.cidade,
        ...vehicles.flatMap((vehicle) => [vehicle.placa, vehicle.marca, vehicle.modelo])
      ].join(' ')).includes(query);
    })
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
}

function renderClientsList() {
  const clients = filteredClients();
  if (!clients.length) return U.emptyState({
    iconName: 'clientes', title: 'Nenhum cliente encontrado',
    text: S.store.data.clientes.length ? 'Tente outra busca.' : 'Cadastre o primeiro cliente e o veículo.',
    action: S.store.data.clientes.length ? '' : `<button type="button" class="btn btn-primary" data-action="newClient">${icon('plus')}Cadastrar cliente</button>`
  });
  return `<div class="client-grid">${clients.map((client) => {
    const vehicles = S.veiculosDoCliente(client.id);
    return `
      <article class="client-card">
        <div class="client-head">${U.avatar(client.nome)}<div><h3>${esc(client.nome)}</h3><p>${esc(client.tipo || 'Pessoa Física')}${client.cidade ? ` · ${esc(client.cidade)}` : ''}</p></div></div>
        <dl class="client-data">
          <div><dt>${icon('telefone')}Telefone</dt><dd>${esc(client.telefone || '—')}</dd></div>
          <div><dt>${icon('mensagem')}E-mail</dt><dd>${esc(client.email || '—')}</dd></div>
          <div><dt>${icon('usuario')}CPF / CNPJ</dt><dd>${esc(client.cpfCnpj || '—')}</dd></div>
          <div><dt>${icon('carro')}Veículos</dt><dd>${vehicles.length || 'Nenhum'}</dd></div>
        </dl>
        ${vehicles.length ? `<div class="vehicle-tags">${vehicles.map((vehicle) => `<span>${icon('carro')}${esc(vehicle.placa)}<small>${esc(vehicleTitle(vehicle))}</small></span>`).join('')}</div>` : ''}
        ${client.observacoes ? `<p class="client-notes">${esc(client.observacoes)}</p>` : ''}
        <div class="client-actions">
          <button type="button" class="btn btn-small btn-whatsapp" data-action="clientWhatsApp" data-id="${esc(client.id)}">${icon('whatsapp')}WhatsApp</button>
          <button type="button" class="btn btn-small btn-secondary" data-action="clientVehicles" data-id="${esc(client.id)}">${icon('carro')}Veículos (${vehicles.length})</button>
          <button type="button" class="btn btn-small btn-ghost" data-action="editClient" data-id="${esc(client.id)}">${icon('editar')}Editar</button>
          <button type="button" class="icon-button danger-icon" data-action="deleteClient" data-id="${esc(client.id)}" aria-label="Excluir ${esc(client.nome)}">${icon('lixeira')}</button>
        </div>
      </article>`;
  }).join('')}</div>`;
}

function suppliersView() {
  const state = viewState.suppliers;
  const suppliers = S.store.data.fornecedores;
  return `
    <div class="page-wrap">
      ${U.pageHead({
        title: 'Fornecedores',
        subtitle: 'Lojas e distribuidores usados nas compras de peças.',
        help: 'fornecedores',
        actions: `<button type="button" class="btn btn-primary" data-action="newSupplier">${icon('plus')}Novo fornecedor</button>`
      })}
      <section class="card">
        <div class="filter-row">${U.searchField({ value: state.search, placeholder: 'Buscar por nome, CNPJ, contato ou telefone…', name: 'busca', label: 'Buscar fornecedores' }).replace('type="search"', 'type="search" data-search="suppliers"')}</div>
        <div data-list="suppliers">${renderSuppliersList()}</div>
      </section>
    </div>
  `;
}

function filteredSuppliers() {
  const query = normalizeSearch(viewState.suppliers.search);
  return [...S.store.data.fornecedores]
    .filter((supplier) => !query || normalizeSearch([supplier.nome, supplier.cnpj, supplier.contato, supplier.telefone, supplier.email, supplier.endereco].join(' ')).includes(query))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
}

function renderSuppliersList() {
  const suppliers = filteredSuppliers();
  if (!suppliers.length) return U.emptyState({
    iconName: 'fornecedores', title: 'Nenhum fornecedor encontrado',
    text: S.store.data.fornecedores.length ? 'Tente outra busca.' : 'Cadastre os fornecedores para usar nas compras e nas peças.',
    action: S.store.data.fornecedores.length ? '' : `<button type="button" class="btn btn-primary" data-action="newSupplier">${icon('plus')}Cadastrar fornecedor</button>`
  });
  return `<div class="record-list">${suppliers.map((supplier) => `
    <article class="record-card supplier-record">
      <span class="record-icon">${icon('fornecedores')}</span>
      <div class="record-main"><div class="record-title-line"><strong>${esc(supplier.nome)}</strong>${supplier.cnpj ? `<span class="table-tag">${esc(supplier.cnpj)}</span>` : ''}</div><p>${esc(supplier.contato || 'Sem pessoa de contato')}</p><small>${esc(supplier.telefone || 'Sem telefone')}${supplier.email ? ` · ${esc(supplier.email)}` : ''}</small></div>
      <div class="supplier-address">${esc(supplier.endereco || 'Sem endereço')}${supplier.observacoes ? `<small>${esc(supplier.observacoes)}</small>` : ''}</div>
      <div class="table-actions"><button type="button" class="btn btn-small btn-ghost" data-action="editSupplier" data-id="${esc(supplier.id)}">${icon('editar')}Editar</button><button type="button" class="icon-button danger-icon" data-action="deleteSupplier" data-id="${esc(supplier.id)}" aria-label="Excluir ${esc(supplier.nome)}">${icon('lixeira')}</button></div>
    </article>`).join('')}</div>`;
}

function purchasesView() {
  const state = viewState.purchases;
  const purchases = S.store.data.compras;
  const pending = purchases.filter((purchase) => purchase.statusPagamento !== 'Pago');
  const paidMonth = sum(purchases.filter((purchase) => purchase.statusPagamento === 'Pago' && isInMonth(purchase.dataPagamento)), (purchase) => purchase.total);
  return `
    <div class="page-wrap">
      ${U.pageHead({
        title: 'Compras de peças',
        subtitle: 'Ao salvar uma compra, as peças entram no estoque e ficam registradas no histórico.',
        help: 'compras',
        actions: `<button type="button" class="btn btn-primary" data-action="startPurchase">${icon('plus')}Nova compra</button>`
      })}
      <section class="stats-grid stats-grid-3">
        ${U.statCard({ label: 'Compras pendentes', value: String(pending.length), hint: money(sum(pending, (purchase) => purchase.total)), iconName: 'compras', tone: 'amber' })}
        ${U.statCard({ label: `Pago em ${monthLabel(monthKey())}`, value: money(paidMonth), iconName: 'checkCircle', tone: 'green' })}
        ${U.statCard({ label: 'Total de compras', value: String(purchases.length), iconName: 'banco', tone: 'blue' })}
      </section>
      <section class="card">
        <div class="filter-row">
          <div class="filter-chips" role="group" aria-label="Filtrar compras">
            ${statusFilter('purchases', 'todos', 'Todas', purchases.length)}
            ${statusFilter('purchases', 'Pendente', 'Pendentes', pending.length)}
            ${statusFilter('purchases', 'Pago', 'Pagas', purchases.length - pending.length)}
          </div>
          ${U.searchField({ value: state.search, placeholder: 'Buscar fornecedor, nota fiscal ou peça…', name: 'busca', label: 'Buscar compras' }).replace('type="search"', 'type="search" data-search="purchases"')}
        </div>
        <div data-list="purchases">${renderPurchasesList()}</div>
      </section>
    </div>
  `;
}

function filteredPurchases() {
  const { search, status } = viewState.purchases;
  const query = normalizeSearch(search);
  return [...S.store.data.compras]
    .filter((purchase) => status === 'todos' || purchase.statusPagamento === status)
    .filter((purchase) => {
      if (!query) return true;
      return normalizeSearch([purchase.fornecedorNome, purchase.numeroNota, ...(purchase.itens || []).map((item) => item.pecaNome)].join(' ')).includes(query);
    })
    .sort((a, b) => String(b.data).localeCompare(String(a.data)) || String(b.criadoEm).localeCompare(String(a.criadoEm)));
}

function renderPurchasesList() {
  const purchases = filteredPurchases();
  if (!purchases.length) return U.emptyState({
    iconName: 'compras', title: 'Nenhuma compra encontrada',
    text: S.store.data.compras.length ? 'Tente outro filtro ou limpe a busca.' : 'Registre a primeira compra de peças.',
    action: S.store.data.compras.length ? '' : `<button type="button" class="btn btn-primary" data-action="startPurchase">${icon('plus')}Nova compra</button>`
  });
  return `<div class="record-list">${purchases.map((purchase) => {
    const overdue = purchase.statusPagamento !== 'Pago' && purchase.dataVencimento && purchase.dataVencimento < todayISO();
    return `
      <article class="record-card purchase-record">
        <span class="record-icon">${icon('compras')}</span>
        <div class="record-main"><div class="record-title-line"><strong>${esc(purchase.fornecedorNome || 'Fornecedor não informado')}</strong>${U.statusBadge(purchase.statusPagamento)}</div><p>${purchase.numeroNota ? `Nota fiscal ${esc(purchase.numeroNota)}` : 'Sem nota fiscal'} · ${(purchase.itens || []).length} peça(s)</p><small>Compra em ${esc(fmtDate(purchase.data))}${purchase.dataVencimento ? ` · vence ${esc(fmtDate(purchase.dataVencimento))}` : ''}${overdue ? ' · vencida' : ''}</small></div>
        <div class="record-side"><strong>${esc(money(purchase.total))}</strong><small>${esc(purchase.formaPagamento || 'Sem forma de pagamento')}</small></div>
        <div class="table-actions"><button type="button" class="btn btn-small btn-secondary" data-action="viewPurchase" data-id="${esc(purchase.id)}">Ver</button><button type="button" class="btn btn-small btn-ghost" data-action="editPurchase" data-id="${esc(purchase.id)}">Editar</button>${purchase.statusPagamento !== 'Pago' ? `<button type="button" class="btn btn-small btn-success" data-action="purchasePaid" data-id="${esc(purchase.id)}" data-paid="true">${icon('check')}Pagar</button>` : `<button type="button" class="btn btn-small btn-ghost" data-action="purchasePaid" data-id="${esc(purchase.id)}" data-paid="false">Reabrir</button>`}<button type="button" class="icon-button danger-icon" data-action="deletePurchase" data-id="${esc(purchase.id)}" aria-label="Excluir compra">${icon('lixeira')}</button></div>
      </article>`;
  }).join('')}</div>`;
}

function blankPurchaseDraft() {
  return {
    fornecedorId: '', fornecedorNome: '', numeroNota: '', data: todayISO(),
    dataVencimento: '', statusPagamento: 'Pendente', dataPagamento: '',
    formaPagamento: '', observacoes: '', itens: []
  };
}

function startPurchase() {
  purchaseDraft = blankPurchaseDraft();
  navigate('#/compras/nova');
}

function purchaseFormView() {
  if (!purchaseDraft) purchaseDraft = blankPurchaseDraft();
  const draft = purchaseDraft;
  const suppliers = sortBy(S.store.data.fornecedores, (supplier) => supplier.nome);
  const total = purchaseTotal(draft.itens);
  return `
    <div class="page-wrap">
      <a class="back-link" href="#/compras">${icon('voltar')}Voltar para compras</a>
      <header class="form-page-head"><div><span class="eyebrow">Nova compra de peças</span><h1>Registrar a compra</h1><p>Preencha os dados e adicione as peças. O estoque será atualizado ao salvar.</p></div></header>
      <form class="form-card" data-form="purchase">
        <div class="form-section">
          <div class="form-section-head"><span>1</span><div><h2>Dados da compra</h2><p>Fornecedor, nota e vencimento.</p></div></div>
          <div class="form-grid">
            ${U.selectField({ label: 'Fornecedor cadastrado', name: 'fornecedorId', value: draft.fornecedorId, options: suppliers.map((supplier) => ({ value: supplier.id, label: supplier.nome })), placeholder: 'Escolha o fornecedor', span: 2, help: 'Se o fornecedor ainda não está cadastrado, preencha o nome livre abaixo.' })}
            ${U.field({ label: 'Nome do fornecedor (livre)', name: 'fornecedorNome', value: draft.fornecedorNome, span: 2, placeholder: 'Ex.: Auto Peças do Bairro' })}
            ${U.field({ label: 'Número da nota fiscal', name: 'numeroNota', value: draft.numeroNota, placeholder: 'Ex.: 123456' })}
            ${U.field({ label: 'Data da compra', name: 'data', type: 'date', value: draft.data })}
            ${U.field({ label: 'Vencimento', name: 'dataVencimento', type: 'date', value: draft.dataVencimento })}
            ${U.selectField({ label: 'Situação do pagamento', name: 'statusPagamento', value: draft.statusPagamento, options: S.PAYMENT_STATUSES })}
            ${U.selectField({ label: 'Forma de pagamento', name: 'formaPagamento', value: draft.formaPagamento, options: S.PAYMENT_METHODS, placeholder: 'Escolha depois' })}
            ${draft.statusPagamento === 'Pago' ? U.field({ label: 'Data do pagamento', name: 'dataPagamento', type: 'date', value: draft.dataPagamento || todayISO() }) : ''}
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-head"><span>2</span><div><h2>Peças compradas</h2><p>Escolha uma peça do estoque ou cadastre uma nova.</p></div><button type="button" class="btn btn-small btn-primary" data-action="purchaseAddItem">${icon('plus')}Adicionar peça</button></div>
          <div class="os-item-list">
            ${draft.itens.length ? draft.itens.map((item, index) => purchaseItemCard(item, index)).join('') : U.emptyState({ iconName: 'compras', title: 'Nenhuma peça adicionada', text: 'Use Adicionar peça para montar a compra.', compact: true })}
          </div>
          <div class="purchase-total">${U.moneyRow('Total da compra', total, true)}</div>
        </div>

        <div class="form-section">
          <div class="form-section-head"><span>3</span><div><h2>Observações</h2><p>Detalhes para consulta futura.</p></div></div>
          ${U.textareaField({ label: 'Observações da compra', name: 'observacoes', value: draft.observacoes, rows: 3 })}
        </div>

        <div class="form-actions">
          <a class="btn btn-ghost" href="#/compras">${icon('x')}Cancelar</a>
          <button type="submit" class="btn btn-primary btn-large">${icon('check')}Salvar compra e dar entrada no estoque</button>
        </div>
      </form>
    </div>
  `;
}

function purchaseItemCard(item, index) {
  const part = item.pecaId ? S.pecaById(item.pecaId) : null;
  const total = (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0);
  return `
    <article class="os-item-card">
      <span class="os-item-icon tone-blue">${icon('estoque')}</span>
      <div class="os-item-copy"><span class="item-kind">${part ? 'Peça do estoque' : 'Peça nova'}</span><strong>${esc(item.pecaNome || item.descricao || 'Peça')}</strong><small>${esc(qty(item.quantidade))} × ${esc(money(item.valorUnitario))}${item.codigo ? ` · código ${esc(item.codigo)}` : ''}</small></div>
      <strong class="os-item-total">${esc(money(total))}</strong>
      <div class="os-item-actions"><button type="button" class="icon-button" data-action="purchaseEditItem" data-index="${index}" aria-label="Editar peça">${icon('editar')}</button><button type="button" class="icon-button danger-icon" data-action="purchaseRemoveItem" data-index="${index}" aria-label="Remover peça">${icon('lixeira')}</button></div>
    </article>
  `;
}

function purchaseTotal(items) {
  return round2(sum(items || [], (item) => (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0)));
}

function expensesView() {
  const state = viewState.expenses;
  const expenses = S.store.data.despesas;
  const pending = expenses.filter((expense) => expense.status !== 'Pago');
  const paidMonth = sum(expenses.filter((expense) => expense.status === 'Pago' && isInMonth(expense.dataPagamento)), (expense) => expense.valor);
  return `
    <div class="page-wrap">
      ${U.pageHead({
        title: 'Despesas da oficina',
        subtitle: 'Aluguel, salários, contas e outros gastos. Marque como paga quando o pagamento sair.',
        help: 'despesas',
        actions: `<button type="button" class="btn btn-primary" data-action="newExpense">${icon('plus')}Nova despesa</button>`
      })}
      <section class="stats-grid stats-grid-3">
        ${U.statCard({ label: 'Despesas pendentes', value: String(pending.length), hint: money(sum(pending, (expense) => expense.valor)), iconName: 'despesas', tone: 'amber' })}
        ${U.statCard({ label: `Pago em ${monthLabel(monthKey())}`, value: money(paidMonth), iconName: 'checkCircle', tone: 'green' })}
        ${U.statCard({ label: 'Total de despesas', value: String(expenses.length), iconName: 'banco', tone: 'blue' })}
      </section>
      <section class="card">
        <div class="filter-row">
          <div class="filter-chips" role="group" aria-label="Filtrar despesas">
            ${statusFilter('expenses', 'todos', 'Todas', expenses.length)}
            ${statusFilter('expenses', 'Pendente', 'Pendentes', pending.length)}
            ${statusFilter('expenses', 'Pago', 'Pagas', expenses.length - pending.length)}
          </div>
          ${U.searchField({ value: state.search, placeholder: 'Buscar descrição, categoria ou credor…', name: 'busca', label: 'Buscar despesas' }).replace('type="search"', 'type="search" data-search="expenses"')}
        </div>
        <div data-list="expenses">${renderExpensesList()}</div>
      </section>
    </div>
  `;
}

function filteredExpenses() {
  const { search, status } = viewState.expenses;
  const query = normalizeSearch(search);
  return [...S.store.data.despesas]
    .filter((expense) => status === 'todos' || expense.status === status)
    .filter((expense) => !query || normalizeSearch([expense.descricao, expense.categoria, expense.fornecedorNome, expense.observacoes].join(' ')).includes(query))
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));
}

function renderExpensesList() {
  const expenses = filteredExpenses();
  if (!expenses.length) return U.emptyState({
    iconName: 'despesas', title: 'Nenhuma despesa encontrada',
    text: S.store.data.despesas.length ? 'Tente outro filtro ou limpe a busca.' : 'Registre a primeira despesa da oficina.',
    action: S.store.data.despesas.length ? '' : `<button type="button" class="btn btn-primary" data-action="newExpense">${icon('plus')}Nova despesa</button>`
  });
  return `<div class="record-list">${expenses.map((expense) => {
    const overdue = expense.status !== 'Pago' && expense.dataVencimento && expense.dataVencimento < todayISO();
    return `
      <article class="record-card expense-record">
        <span class="record-icon record-rose">${icon('despesas')}</span>
        <div class="record-main"><div class="record-title-line"><strong>${esc(expense.descricao)}</strong>${U.statusBadge(expense.status)}</div><p>${esc(expense.categoria)}${expense.fornecedorNome ? ` · ${esc(expense.fornecedorNome)}` : ''}</p><small>${esc(fmtDate(expense.data))}${expense.dataVencimento ? ` · vence ${esc(fmtDate(expense.dataVencimento))}` : ''}${overdue ? ' · vencida' : ''}</small></div>
        <div class="record-side"><strong class="text-rose">${esc(money(expense.valor))}</strong><small>${esc(expense.formaPagamento || 'Sem forma')}</small></div>
        <div class="table-actions"><button type="button" class="btn btn-small btn-ghost" data-action="editExpense" data-id="${esc(expense.id)}">${icon('editar')}Editar</button>${expense.status !== 'Pago' ? `<button type="button" class="btn btn-small btn-success" data-action="expensePaid" data-id="${esc(expense.id)}" data-paid="true">${icon('check')}Pagar</button>` : `<button type="button" class="btn btn-small btn-ghost" data-action="expensePaid" data-id="${esc(expense.id)}" data-paid="false">Reabrir</button>`}<button type="button" class="icon-button danger-icon" data-action="deleteExpense" data-id="${esc(expense.id)}" aria-label="Excluir despesa">${icon('lixeira')}</button></div>
      </article>`;
  }).join('')}</div>`;
}

function financeView() {
  const data = S.financeData();
  return `
    <div class="page-wrap">
      ${U.pageHead({
        title: 'Contas e caixa',
        subtitle: `Valores a receber, contas a pagar e resultado de ${monthLabel(data.month)}.`,
        help: 'financeiro',
        actions: `<button type="button" class="btn btn-secondary" data-action="newExpense">${icon('plus')}Nova despesa</button>`
      })}
      <section class="stats-grid stats-grid-finance">
        ${U.statCard({ label: 'Entradas do mês', value: money(data.receivedMonth), iconName: 'subir', tone: 'green' })}
        ${U.statCard({ label: 'Saídas pagas no mês', value: money(data.paidPurchasesMonth + data.paidExpensesMonth), iconName: 'baixar', tone: 'rose' })}
        ${U.statCard({ label: 'Resultado do mês', value: money(data.outcomeMonth), iconName: 'painel', tone: data.outcomeMonth >= 0 ? 'blue' : 'rose' })}
        ${U.statCard({ label: 'A receber', value: money(data.receivablesTotal), hint: `${data.receivables.length} O.S.`, iconName: 'caixa', tone: 'amber' })}
        ${U.statCard({ label: 'A pagar', value: money(data.purchasesPendingTotal + data.expensesPendingTotal), hint: `${data.pendingPurchases.length + data.pendingExpenses.length} contas`, iconName: 'despesas', tone: 'rose' })}
      </section>

      <div class="finance-grid">
        <section class="card">
          <div class="card-head"><div><h2>${icon('caixa')}Contas a receber</h2><p>O.S. faturadas que ainda não foram pagas.</p></div><span class="count-pill">${data.receivables.length}</span></div>
          ${data.receivables.length ? `<div class="finance-list">${data.receivables.map(receivableRow).join('')}</div>` : U.emptyState({ iconName: 'checkCircle', title: 'Nenhuma conta a receber', text: 'As O.S. faturadas e não pagas aparecem aqui.', compact: true })}
        </section>

        <section class="card">
          <div class="card-head"><div><h2>${icon('despesas')}Contas a pagar</h2><p>Compras e despesas pendentes.</p></div><span class="count-pill">${data.pendingPurchases.length + data.pendingExpenses.length}</span></div>
          ${data.pendingPurchases.length || data.pendingExpenses.length ? `
            <h3 class="subsection-title">Compras</h3>
            <div class="finance-list">${data.pendingPurchases.length ? data.pendingPurchases.map(purchasePayableRow).join('') : U.emptyState({ iconName: 'checkCircle', title: 'Nenhuma compra pendente', compact: true })}</div>
            <h3 class="subsection-title">Despesas</h3>
            <div class="finance-list">${data.pendingExpenses.length ? data.pendingExpenses.map(expensePayableRow).join('') : U.emptyState({ iconName: 'checkCircle', title: 'Nenhuma despesa pendente', compact: true })}</div>
          ` : U.emptyState({ iconName: 'checkCircle', title: 'Nenhuma conta a pagar', text: 'Tudo em dia por aqui.', compact: true })}
        </section>
      </div>

      <section class="card summary-card finance-summary">
        <div class="card-head"><div><h2>${icon('painel')}Resumo de ${monthLabel(data.month)}</h2><p>Entram apenas valores com data de pagamento neste mês.</p></div></div>
        <div class="summary-grid">
          <div>${U.moneyRow('O.S. recebidas', data.receivedMonth)}</div>
          <div>${U.moneyRow('Compras pagas', data.paidPurchasesMonth)}</div>
          <div>${U.moneyRow('Despesas pagas', data.paidExpensesMonth)}</div>
          <div>${U.moneyRow('Resultado do mês', data.outcomeMonth, true)}</div>
        </div>
      </section>
    </div>
  `;
}

function receivableRow(order) {
  return `
    <article class="finance-row">
      <div class="finance-row-main"><strong>${esc(order.clienteNome)}</strong><span>${esc(order.numero)} · ${esc(order.veiculoDescricao || 'Veículo')}</span><small>Faturada em ${esc(fmtDate(order.dataFaturamento))}</small></div>
      <strong class="finance-row-value">${esc(money(order.total))}</strong>
      <div class="table-actions"><button type="button" class="btn btn-small btn-whatsapp" data-action="chargeWhatsApp" data-id="${esc(order.id)}">${icon('whatsapp')}Cobrar</button><button type="button" class="btn btn-small btn-success" data-action="orderPay" data-id="${esc(order.id)}">${icon('check')}Receber</button></div>
    </article>
  `;
}

function purchasePayableRow(purchase) {
  return `
    <article class="finance-row">
      <div class="finance-row-main"><strong>${esc(purchase.fornecedorNome || 'Fornecedor')}</strong><span>Compra${purchase.numeroNota ? ` · NF ${esc(purchase.numeroNota)}` : ''}</span><small>${purchase.dataVencimento ? `Vence em ${esc(fmtDate(purchase.dataVencimento))}` : 'Sem vencimento'}</small></div>
      <strong class="finance-row-value">${esc(money(purchase.total))}</strong>
      <button type="button" class="btn btn-small btn-success" data-action="purchasePaid" data-id="${esc(purchase.id)}" data-paid="true">${icon('check')}Pagar</button>
    </article>
  `;
}

function expensePayableRow(expense) {
  return `
    <article class="finance-row">
      <div class="finance-row-main"><strong>${esc(expense.descricao)}</strong><span>${esc(expense.categoria)}${expense.fornecedorNome ? ` · ${esc(expense.fornecedorNome)}` : ''}</span><small>${expense.dataVencimento ? `Vence em ${esc(fmtDate(expense.dataVencimento))}` : 'Sem vencimento'}</small></div>
      <strong class="finance-row-value">${esc(money(expense.valor))}</strong>
      <button type="button" class="btn btn-small btn-success" data-action="expensePaid" data-id="${esc(expense.id)}" data-paid="true">${icon('check')}Pagar</button>
    </article>
  `;
}

function helpView(path) {
  const section = pathSegments(path)[1] || '';
  const data = S.store.data;
  const empty = S.isStoreEmpty();
  const lastBackup = data.meta.lastBackupAt;
  return `
    <div class="page-wrap help-page">
      ${U.pageHead({
        title: 'Ajuda e manual',
        subtitle: 'Aprenda a usar cada parte do sistema. O manual é atualizado junto com as mudanças.',
        actions: `<button type="button" class="btn btn-secondary" data-action="printManual">${icon('imprimir')}Imprimir manual</button>`
      })}
      <section class="backup-card">
        <div class="backup-copy">
          <span class="backup-icon">${icon('banco')}</span>
          <div><h2>Cópia de segurança</h2><p>Seus dados ficam neste navegador. Baixe uma cópia toda semana e sempre que trocar de computador.</p><small>${lastBackup ? `Última cópia: ${esc(fmtDateTime(lastBackup))}` : 'Você ainda não fez uma cópia.'} · ${data.clientes.length} cliente(s) · ${data.ordens.length} O.S. · ${data.pecas.length} peça(s)</small></div>
        </div>
        <div class="backup-actions">
          <button type="button" class="btn btn-primary" data-action="exportBackup">${icon('baixar')}Baixar cópia</button>
          <button type="button" class="btn btn-secondary" data-action="importBackup">${icon('subir')}Restaurar cópia</button>
          <input type="file" id="backup-file" accept="application/json,.json" hidden>
          ${empty ? `<button type="button" class="btn btn-ghost" data-action="loadDemo">${icon('painel')}Carregar dados de exemplo</button>` : ''}
          <button type="button" class="btn btn-danger-ghost btn-small" data-action="clearAll">${icon('lixeira')}Apagar todos os dados</button>
        </div>
      </section>
      <section class="manual-card" id="manual-content" data-section="${esc(section)}">
        <div class="manual-loading">${icon('relogio')}<p>Carregando o manual…</p></div>
      </section>
    </div>
  `;
}

async function getManual() {
  if (manualCache) return manualCache;
  if (manualRequest) return manualRequest;
  manualRequest = fetch('./MANUAL.md', { cache: 'no-cache' })
    .then(async (response) => {
      if (!response.ok) throw new Error('Não foi possível carregar o manual.');
      manualCache = await response.text();
      return manualCache;
    })
    .finally(() => { manualRequest = null; });
  return manualRequest;
}

async function loadManualIntoPage() {
  const container = document.getElementById('manual-content');
  if (!container) return;
  const section = container.dataset.section || '';
  try {
    const markdown = await getManual();
    if (!document.getElementById('manual-content')) return;
    const parsed = U.markdownToHtml(markdown);
    const toc = parsed.headings.filter((heading) => heading.level === 2);
    container.innerHTML = `
      <header class="manual-toolbar">
        <div><span class="eyebrow">Manual do usuário</span><p>Encontre a tarefa no índice ou leia na ordem.</p></div>
        <button type="button" class="btn btn-small btn-secondary" data-action="manualTop">${icon('avancar')}Voltar ao início</button>
      </header>
      <div class="manual-layout">
        <nav class="manual-toc" aria-label="Índice do manual">
          <h2>Neste manual</h2>
          <ol>${toc.map((heading) => `<li><button type="button" data-action="manualJump" data-id="${esc(heading.id)}">${esc(heading.text)}</button></li>`).join('')}</ol>
          <div class="manual-toc-note">${icon('info')}<p>Se não encontrar uma resposta, consulte a seção de perguntas frequentes.</p></div>
        </nav>
        <article class="manual-body">${parsed.html}</article>
      </div>
    `;
    if (section) {
      requestAnimationFrame(() => {
        const target = document.getElementById(section);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  } catch (error) {
    console.error(error);
    if (!document.getElementById('manual-content')) return;
    container.innerHTML = U.emptyState({
      iconName: 'alerta', title: 'O manual não carregou',
      text: 'Verifique sua conexão com a internet e atualize a página. Você também pode abrir o arquivo do manual separadamente.',
      action: `<a class="btn btn-secondary" href="./MANUAL.md" target="_blank" rel="noopener noreferrer">${icon('externo')}Abrir manual</a><button type="button" class="btn btn-primary" data-action="retryManual">${icon('relogio')}Tentar novamente</button>`
    });
  }
}

function formValues(form) {
  const values = {};
  new FormData(form).forEach((value, key) => { values[key] = value; });
  return values;
}

function openClientModal(id = '') {
  const client = id ? S.clienteById(id) : null;
  const formId = 'form-cliente';
  U.openModal({
    title: client ? 'Editar cliente' : 'Cadastrar cliente',
    subtitle: 'O telefone com DDD será usado para enviar mensagens pelo WhatsApp.',
    body: `<form id="${formId}" data-form="cliente" data-id="${esc(client?.id || '')}">
      <div class="modal-form-grid">
        ${U.field({ label: 'Nome completo / razão social', name: 'nome', value: client?.nome, required: true, span: 2, placeholder: 'Ex.: Maria Aparecida Souza' })}
        ${U.selectField({ label: 'Tipo de cliente', name: 'tipo', value: client?.tipo || 'Pessoa Física', options: ['Pessoa Física', 'Pessoa Jurídica'] })}
        ${U.field({ label: 'CPF / CNPJ', name: 'cpfCnpj', value: client?.cpfCnpj, placeholder: 'Somente números ou com pontuação' })}
        ${U.field({ label: 'Telefone com DDD', name: 'telefone', value: client?.telefone, required: true, placeholder: 'Ex.: (11) 98765-4321', attrs: 'inputmode="tel" autocomplete="tel"', help: 'Necessário para o WhatsApp.' })}
        ${U.field({ label: 'E-mail', name: 'email', type: 'email', value: client?.email, placeholder: 'cliente@email.com', attrs: 'autocomplete="email"' })}
        ${U.field({ label: 'Endereço', name: 'endereco', value: client?.endereco, span: 2, placeholder: 'Rua, número e bairro' })}
        ${U.field({ label: 'Cidade / UF', name: 'cidade', value: client?.cidade, span: 2, placeholder: 'Ex.: São Paulo / SP' })}
        ${U.textareaField({ label: 'Observações', name: 'observacoes', value: client?.observacoes, rows: 3 })}
      </div>
    </form>`,
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Cancelar</button><button type="submit" form="${formId}" class="btn btn-primary">${icon('check')}Salvar cliente</button>`,
    size: 'lg'
  });
}

function openVehicleModal(id = '', clientId = '', context = '') {
  const vehicle = id ? S.veiculoById(id) : null;
  const selectedClient = clientId || vehicle?.clienteId || '';
  const clients = sortBy(S.store.data.clientes, (client) => client.nome);
  if (!clients.length) {
    U.alertDialog({ title: 'Cadastre um cliente primeiro', message: 'Todo veículo precisa estar ligado a um cliente. Cadastre o cliente e depois volte para adicionar o veículo.' });
    return;
  }
  if (context) vehicleReturnClient = context;
  const formId = 'form-veiculo';
  U.openModal({
    title: vehicle ? 'Editar veículo' : 'Cadastrar veículo',
    subtitle: 'Informe a placa e os dados que aparecerão na ordem de serviço.',
    body: `<form id="${formId}" data-form="veiculo" data-id="${esc(vehicle?.id || '')}">
      <div class="modal-form-grid">
        ${U.selectField({ label: 'Cliente', name: 'clienteId', value: selectedClient, required: true, options: clients.map((client) => ({ value: client.id, label: client.nome })), placeholder: 'Escolha o cliente', span: 2, attrs: vehicle ? '' : 'data-vehicle-client' })}
        ${U.field({ label: 'Placa', name: 'placa', value: vehicle?.placa, required: true, placeholder: 'Ex.: ABC1D23', attrs: 'maxlength="8" autocapitalize="characters"', help: 'A placa será salva em letras maiúsculas.' })}
        ${U.field({ label: 'Marca', name: 'marca', value: vehicle?.marca, placeholder: 'Ex.: Volkswagen' })}
        ${U.field({ label: 'Modelo', name: 'modelo', value: vehicle?.modelo, placeholder: 'Ex.: Gol 1.0' })}
        ${U.field({ label: 'Ano', name: 'ano', value: vehicle?.ano, placeholder: 'Ex.: 2018', attrs: 'inputmode="numeric" maxlength="4"' })}
        ${U.field({ label: 'Cor', name: 'cor', value: vehicle?.cor, placeholder: 'Ex.: Prata' })}
        ${U.field({ label: 'Quilometragem atual', name: 'km', value: vehicle?.km, placeholder: 'Ex.: 128400', attrs: 'inputmode="numeric"' })}
        ${U.textareaField({ label: 'Observações do veículo', name: 'observacoes', value: vehicle?.observacoes, rows: 3 })}
      </div>
    </form>`,
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Cancelar</button><button type="submit" form="${formId}" class="btn btn-primary">${icon('check')}Salvar veículo</button>`,
    size: 'lg'
  });
}

function openVehiclesModal(clientId) {
  const client = S.clienteById(clientId);
  if (!client) return;
  vehicleReturnClient = `lista:${clientId}`;
  const vehicles = sortBy(S.veiculosDoCliente(clientId), (vehicle) => vehicle.placa);
  U.openModal({
    title: `Veículos de ${client.nome}`,
    subtitle: 'Cadastre, consulte e edite os veículos deste cliente.',
    body: `<div class="person-block modal-person">${U.avatar(client.nome)}<div><strong>${esc(client.nome)}</strong><small>${esc(client.telefone)}</small></div></div>
      ${vehicles.length ? `<div class="vehicle-modal-list">${vehicles.map((vehicle) => `
        <article class="vehicle-mini-card">
          <span class="vehicle-mini-icon">${icon('carro')}</span>
          <div><strong>${esc(vehicle.placa)}</strong><p>${esc(vehicleTitle(vehicle) || 'Veículo sem descrição')}</p><small>${vehicle.ano ? `${esc(vehicle.ano)} · ` : ''}${vehicle.cor ? esc(vehicle.cor) : 'Cor não informada'}${vehicle.km ? ` · ${esc(qty(vehicle.km))} km` : ''}</small></div>
          <div class="table-actions"><button type="button" class="btn btn-small btn-secondary" data-action="editVehicle" data-id="${esc(vehicle.id)}">${icon('editar')}Editar</button><button type="button" class="icon-button danger-icon" data-action="deleteVehicle" data-id="${esc(vehicle.id)}" aria-label="Excluir veículo ${esc(vehicle.placa)}">${icon('lixeira')}</button></div>
        </article>`).join('')}</div>` : U.emptyState({ iconName: 'carro', title: 'Nenhum veículo cadastrado', text: 'Adicione o primeiro veículo deste cliente.', compact: true })}
    `,
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Fechar</button><button type="button" class="btn btn-primary" data-action="clientAddVehicle" data-id="${esc(client.id)}">${icon('plus')}Adicionar veículo</button>`,
    size: 'lg'
  });
}

function openSupplierModal(id = '') {
  const supplier = id ? S.fornecedorById(id) : null;
  const formId = 'form-fornecedor';
  U.openModal({
    title: supplier ? 'Editar fornecedor' : 'Cadastrar fornecedor',
    subtitle: 'Use estes dados nas compras e no cadastro das peças.',
    body: `<form id="${formId}" data-form="fornecedor" data-id="${esc(supplier?.id || '')}">
      <div class="modal-form-grid">
        ${U.field({ label: 'Nome da empresa', name: 'nome', value: supplier?.nome, required: true, span: 2 })}
        ${U.field({ label: 'CNPJ', name: 'cnpj', value: supplier?.cnpj })}
        ${U.field({ label: 'Pessoa de contato', name: 'contato', value: supplier?.contato })}
        ${U.field({ label: 'Telefone', name: 'telefone', value: supplier?.telefone, attrs: 'inputmode="tel"' })}
        ${U.field({ label: 'E-mail', name: 'email', type: 'email', value: supplier?.email })}
        ${U.field({ label: 'Endereço', name: 'endereco', value: supplier?.endereco })}
        ${U.textareaField({ label: 'Observações', name: 'observacoes', value: supplier?.observacoes, rows: 3 })}
      </div>
    </form>`,
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Cancelar</button><button type="submit" form="${formId}" class="btn btn-primary">${icon('check')}Salvar fornecedor</button>`,
    size: 'lg'
  });
}

function openPartModal(id = '', returnContext = '') {
  const part = id ? S.pecaById(id) : null;
  const suppliers = sortBy(S.store.data.fornecedores, (supplier) => supplier.nome);
  const supplierName = part?.fornecedorNome || S.fornecedorById(part?.fornecedorId)?.nome || '';
  if (returnContext) vehicleReturnClient = returnContext;
  const formId = 'form-peca';
  U.openModal({
    title: part ? 'Editar peça' : 'Cadastrar peça',
    subtitle: 'O estoque é controlado pelas movimentações. Para corrigir a quantidade, use Entrada / saída.',
    body: `<form id="${formId}" data-form="peca" data-id="${esc(part?.id || '')}">
      <div class="modal-form-grid">
        ${U.field({ label: 'Nome da peça', name: 'nome', value: part?.nome, required: true, span: 2, placeholder: 'Ex.: Filtro de óleo' })}
        ${U.field({ label: 'Código', name: 'codigo', value: part?.codigo, placeholder: 'Código interno ou do fabricante' })}
        ${U.field({ label: 'Marca', name: 'marca', value: part?.marca })}
        ${U.selectField({ label: 'Categoria', name: 'categoria', value: part?.categoria || 'Outros', options: S.PART_CATEGORIES })}
        ${U.selectField({ label: 'Unidade', name: 'unidade', value: part?.unidade || 'un', options: S.PART_UNITS })}
        ${U.selectField({ label: 'Fornecedor', name: 'fornecedorId', value: part?.fornecedorId, options: suppliers.map((supplier) => ({ value: supplier.id, label: supplier.nome })), placeholder: 'Não informado', attrs: 'data-part-supplier' })}
        ${U.field({ label: 'Nome livre do fornecedor', name: 'fornecedorNome', value: supplierName, help: 'Preenchido automaticamente ao escolher um fornecedor.' })}
        ${U.field({ label: 'Localização no estoque', name: 'localizacao', value: part?.localizacao, placeholder: 'Ex.: Prateleira A2' })}
        ${U.field({ label: 'Preço de custo (R$)', name: 'precoCusto', type: 'number', min: '0', step: '0.01', value: part?.precoCusto ?? 0 })}
        ${U.field({ label: 'Preço de venda (R$)', name: 'precoVenda', type: 'number', min: '0', step: '0.01', value: part?.precoVenda ?? 0 })}
        ${U.field({ label: 'Estoque mínimo', name: 'estoqueMinimo', type: 'number', min: '0', step: '0.01', value: part?.estoqueMinimo ?? 0, help: 'Avisa quando chegar a este valor.' })}
        ${part ? `<div class="inline-note">${icon('estoque')}<span>Estoque atual: ${esc(qty(part.quantidadeEstoque))} ${esc(part.unidade)}. Use uma movimentação para alterar.</span></div>` : U.field({ label: 'Estoque inicial', name: 'quantidadeEstoque', type: 'number', min: '0', step: '0.01', value: 0, help: 'Uma entrada inicial será registrada no histórico.' })}
        ${U.textareaField({ label: 'Observações', name: 'observacoes', value: part?.observacoes, rows: 3 })}
      </div>
    </form>`,
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Cancelar</button><button type="submit" form="${formId}" class="btn btn-primary">${icon('check')}Salvar peça</button>`,
    size: 'lg',
    onMount(dialog) {
      const select = dialog.querySelector('[data-part-supplier]');
      const freeName = dialog.querySelector('[name="fornecedorNome"]');
      select?.addEventListener('change', () => {
        if (!select.value) return;
        const supplier = S.fornecedorById(select.value);
        if (supplier && freeName) freeName.value = supplier.nome;
      });
    }
  });
}

async function openMovementModal(partId = '') {
  const parts = sortBy(S.store.data.pecas, (part) => part.nome);
  if (!parts.length) {
    await U.alertDialog({ title: 'Cadastre uma peça primeiro', message: 'Não há peças para movimentar. Cadastre uma peça e informe o estoque inicial.' });
    openPartModal();
    return;
  }
  const selected = partId || parts[0]?.id;
  const formId = 'form-movimentacao';
  U.openModal({
    title: 'Entrada ou saída de estoque',
    subtitle: 'Toda alteração fica registrada no histórico com data, motivo e saldo.',
    body: `<form id="${formId}" data-form="movimentacao">
      <div class="modal-form-grid">
        ${U.selectField({ label: 'Peça', name: 'pecaId', value: selected, required: true, options: parts.map((part) => ({ value: part.id, label: `${part.nome} · ${qty(part.quantidadeEstoque)} ${part.unidade}` })), span: 2, attrs: 'data-movement-part' })}
        ${U.selectField({ label: 'Tipo de movimentação', name: 'tipo', value: 'Entrada', required: true, options: ['Entrada', 'Saída'], attrs: 'data-movement-type' })}
        ${U.field({ label: 'Quantidade', name: 'quantidade', type: 'number', min: '0.01', step: '0.01', value: 1, required: true })}
        ${U.selectField({ label: 'Motivo', name: 'motivo', required: true, options: S.STOCK_REASONS.Entrada, attrs: 'data-movement-reason' })}
        ${U.field({ label: 'Data', name: 'data', type: 'date', value: todayISO(), required: true })}
        ${U.field({ label: 'Referência', name: 'referencia', placeholder: 'Ex.: Nota fiscal 1234', help: 'Opcional. Ajuda a encontrar o lançamento depois.' })}
        <div class="inline-note field-span2" id="movement-stock-note">${icon('info')}<span></span></div>
      </div>
    </form>`,
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Cancelar</button><button type="submit" form="${formId}" class="btn btn-primary">${icon('check')}Registrar movimentação</button>`,
    size: 'md',
    onMount(dialog) {
      const partSelect = dialog.querySelector('[data-movement-part]');
      const typeSelect = dialog.querySelector('[data-movement-type]');
      const reasonSelect = dialog.querySelector('[data-movement-reason]');
      const note = dialog.querySelector('#movement-stock-note span');
      const update = () => {
        const part = S.pecaById(partSelect.value);
        const reasons = typeSelect.value === 'Saída' ? S.STOCK_REASONS.Saída : S.STOCK_REASONS.Entrada;
        reasonSelect.innerHTML = reasons.map((reason) => `<option value="${esc(reason)}">${esc(reason)}</option>`).join('');
        if (part) note.textContent = `${part.nome}: ${qty(part.quantidadeEstoque)} ${part.unidade} em estoque.`;
      };
      partSelect.addEventListener('change', update);
      typeSelect.addEventListener('change', update);
      update();
    }
  });
}

function openExpenseModal(id = '') {
  const expense = id ? S.despesaById(id) : null;
  const formId = 'form-despesa';
  U.openModal({
    title: expense ? 'Editar despesa' : 'Registrar despesa',
    subtitle: 'Despesas pagas entram no caixa pela data de pagamento.',
    body: `<form id="${formId}" data-form="despesa" data-id="${esc(expense?.id || '')}">
      <div class="modal-form-grid">
        ${U.field({ label: 'Descrição', name: 'descricao', value: expense?.descricao, required: true, span: 2, placeholder: 'Ex.: Conta de energia' })}
        ${U.selectField({ label: 'Categoria', name: 'categoria', value: expense?.categoria || 'Outros', options: S.EXPENSE_CATEGORIES })}
        ${U.field({ label: 'Valor (R$)', name: 'valor', type: 'number', min: '0.01', step: '0.01', value: expense?.valor ?? '', required: true })}
        ${U.field({ label: 'Credor / fornecedor', name: 'fornecedorNome', value: expense?.fornecedorNome, placeholder: 'Para quem foi pago' })}
        ${U.field({ label: 'Data da despesa', name: 'data', type: 'date', value: expense?.data || todayISO(), required: true })}
        ${U.field({ label: 'Vencimento', name: 'dataVencimento', type: 'date', value: expense?.dataVencimento })}
        ${U.selectField({ label: 'Situação', name: 'status', value: expense?.status || 'Pendente', options: S.PAYMENT_STATUSES, attrs: 'data-expense-status' })}
        ${U.selectField({ label: 'Forma de pagamento', name: 'formaPagamento', value: expense?.formaPagamento, options: S.PAYMENT_METHODS, placeholder: 'Escolha depois' })}
        ${U.field({ label: 'Data do pagamento', name: 'dataPagamento', type: 'date', value: expense?.dataPagamento || todayISO(), attrs: expense?.status === 'Pago' ? '' : 'data-expense-paid-date' })}
        ${U.textareaField({ label: 'Observações', name: 'observacoes', value: expense?.observacoes, rows: 3 })}
      </div>
    </form>`,
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Cancelar</button><button type="submit" form="${formId}" class="btn btn-primary">${icon('check')}Salvar despesa</button>`,
    size: 'lg'
  });
}

function openPurchaseDetail(id) {
  const purchase = S.compraById(id);
  if (!purchase) return;
  const items = purchase.itens || [];
  U.openModal({
    title: `Compra · ${purchase.fornecedorNome || 'Fornecedor não informado'}`,
    subtitle: `${purchase.numeroNota ? `Nota fiscal ${purchase.numeroNota}` : 'Sem nota fiscal'} · ${fmtDate(purchase.data)}`,
    body: `
      <div class="purchase-detail-meta">
        ${U.statusBadge(purchase.statusPagamento)}
        <span>${esc(purchase.formaPagamento || 'Forma de pagamento não informada')}</span>
        ${purchase.dataVencimento ? `<span>Vence em ${esc(fmtDate(purchase.dataVencimento))}</span>` : ''}
        ${purchase.statusPagamento === 'Pago' ? `<span>Pago em ${esc(fmtDate(purchase.dataPagamento))}</span>` : ''}
      </div>
      <div class="table-wrap">
        <table class="data-table"><thead><tr><th>Peça</th><th class="num">Qtd.</th><th class="num">Unitário</th><th class="num">Total</th></tr></thead><tbody>
          ${items.map((item) => `<tr><td><strong>${esc(item.pecaNome)}</strong>${item.codigo ? `<small>Código ${esc(item.codigo)}</small>` : ''}</td><td class="num">${esc(qty(item.quantidade))} ${esc(item.unidade || '')}</td><td class="num">${esc(money(item.valorUnitario))}</td><td class="num"><strong>${esc(money(item.quantidade * item.valorUnitario))}</strong></td></tr>`).join('')}
        </tbody></table>
      </div>
      <div class="totals-box compact-totals">${U.moneyRow('Total da compra', purchase.total, true)}</div>
      ${purchase.observacoes ? `<div class="prose-block purchase-notes">${esc(purchase.observacoes).replace(/\n/g, '<br>')}</div>` : ''}
      <p class="field-help">${icon('estoque')} As peças desta compra já entraram no estoque. Para trocar os itens, exclua a compra e cadastre novamente.</p>
    `,
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Fechar</button><button type="button" class="btn btn-secondary" data-action="editPurchase" data-id="${esc(id)}">${icon('editar')}Editar dados</button>${purchase.statusPagamento === 'Pago' ? `<button type="button" class="btn btn-ghost" data-action="purchasePaid" data-id="${esc(id)}" data-paid="false">Reabrir</button>` : `<button type="button" class="btn btn-success" data-action="purchasePaid" data-id="${esc(id)}" data-paid="true">${icon('check')}Marcar como paga</button>`}`,
    size: 'lg'
  });
}

function openPurchaseMeta(id) {
  const purchase = S.compraById(id);
  if (!purchase) return;
  const suppliers = sortBy(S.store.data.fornecedores, (supplier) => supplier.nome);
  const formId = 'form-compra';
  U.openModal({
    title: 'Editar dados da compra',
    subtitle: 'Os itens e o estoque não são alterados aqui.',
    body: `<form id="${formId}" data-form="compraMeta">
      <input type="hidden" name="id" value="${esc(id)}">
      <div class="modal-form-grid">
        ${U.selectField({ label: 'Fornecedor cadastrado', name: 'fornecedorId', value: purchase.fornecedorId, options: suppliers.map((supplier) => ({ value: supplier.id, label: supplier.nome })), placeholder: 'Não informado', span: 2 })}
        ${U.field({ label: 'Nome do fornecedor', name: 'fornecedorNome', value: purchase.fornecedorNome, span: 2 })}
        ${U.field({ label: 'Número da nota fiscal', name: 'numeroNota', value: purchase.numeroNota })}
        ${U.field({ label: 'Data da compra', name: 'data', type: 'date', value: purchase.data, required: true })}
        ${U.field({ label: 'Vencimento', name: 'dataVencimento', type: 'date', value: purchase.dataVencimento })}
        ${U.selectField({ label: 'Situação', name: 'statusPagamento', value: purchase.statusPagamento, options: S.PAYMENT_STATUSES, attrs: 'data-purchase-status' })}
        ${U.selectField({ label: 'Forma de pagamento', name: 'formaPagamento', value: purchase.formaPagamento, options: S.PAYMENT_METHODS, placeholder: 'Escolha depois' })}
        ${U.field({ label: 'Data do pagamento', name: 'dataPagamento', type: 'date', value: purchase.dataPagamento || todayISO() })}
        ${U.textareaField({ label: 'Observações', name: 'observacoes', value: purchase.observacoes, rows: 3 })}
      </div>
    </form>`,
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Cancelar</button><button type="submit" form="${formId}" class="btn btn-primary">${icon('check')}Salvar alterações</button>`,
    size: 'lg'
  });
}

function openPurchaseItem(index = null) {
  if (!purchaseDraft) purchaseDraft = blankPurchaseDraft();
  const item = index === null ? null : purchaseDraft.itens[index];
  const parts = sortBy(S.store.data.pecas, (part) => part.nome);
  const selected = item?.pecaId || '__nova__';
  const isNew = selected === '__nova__';
  const formId = 'form-item-compra';
  U.openModal({
    title: item ? 'Editar peça da compra' : 'Adicionar peça à compra',
    subtitle: 'Escolha uma peça já cadastrada ou informe uma peça nova.',
    body: `<form id="${formId}" data-form="purchaseItem" data-index="${index ?? ''}">
      <div class="modal-form-grid">
        ${U.selectField({ label: 'Peça', name: 'pecaId', value: selected, required: true, options: [{ value: '__nova__', label: '+ Cadastrar peça nova' }, ...parts.map((part) => ({ value: part.id, label: `${part.nome} · ${qty(part.quantidadeEstoque)} ${part.unidade}` }))], span: 2, attrs: 'data-purchase-part' })}
        <div class="field-span2 purchase-new-fields" ${isNew ? '' : 'hidden'}><div class="form-grid">
          ${U.field({ label: 'Nome da peça nova', name: 'pecaNome', value: item?.pecaNome, required: true, span: 2 })}
          ${U.field({ label: 'Código', name: 'codigo', value: item?.codigo })}
          ${U.field({ label: 'Marca', name: 'marca', value: item?.marca })}
          ${U.selectField({ label: 'Categoria', name: 'categoria', value: item?.categoria || 'Outros', options: S.PART_CATEGORIES })}
          ${U.selectField({ label: 'Unidade', name: 'unidade', value: item?.unidade || 'un', options: S.PART_UNITS })}
          ${U.field({ label: 'Preço de venda (R$)', name: 'precoVenda', type: 'number', min: '0', step: '0.01', value: item?.precoVenda ?? 0 })}
          ${U.field({ label: 'Estoque mínimo', name: 'estoqueMinimo', type: 'number', min: '0', step: '0.01', value: item?.estoqueMinimo ?? 0 })}
        </div></div>
        ${U.field({ label: 'Quantidade comprada', name: 'quantidade', type: 'number', min: '0.01', step: '0.01', value: item?.quantidade || 1, required: true })}
        ${U.field({ label: 'Custo unitário (R$)', name: 'valorUnitario', type: 'number', min: '0', step: '0.01', value: item?.valorUnitario ?? 0, required: true })}
      </div>
    </form>`,
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Cancelar</button><button type="submit" form="${formId}" class="btn btn-primary">${icon('check')}Adicionar à compra</button>`,
    size: 'lg',
    onMount(dialog) {
      const select = dialog.querySelector('[data-purchase-part]');
      const wrapper = dialog.querySelector('.purchase-new-fields');
      const required = wrapper.querySelector('[name="pecaNome"]');
      const update = (resetPrice = false) => {
        const newPart = select.value === '__nova__';
        wrapper.hidden = !newPart;
        required.required = newPart;
        if (newPart) return;
        const part = S.pecaById(select.value);
        if (!part) return;
        if (resetPrice) dialog.querySelector('[name="valorUnitario"]').value = Number(part.precoCusto) || 0;
      };
      select.addEventListener('change', () => update(true));
      update();
    }
  });
}

function openOsPartModal(index = null, preferredPartId = '') {
  const draft = ensureOsDraft();
  const item = index === null ? null : draft.itens[index];
  const parts = sortBy(S.store.data.pecas, (part) => part.nome);
  if (!parts.length) {
    openPartModal('', 'part:os');
    return;
  }
  const selected = item?.pecaId || preferredPartId || parts[0].id;
  const initialPart = S.pecaById(selected);
  const formId = 'form-peca-os';
  U.openModal({
    title: item ? 'Editar peça' : 'Adicionar peça à O.S.',
    subtitle: 'A quantidade será conferida com o estoque antes de aprovar o serviço.',
    body: `<form id="${formId}" data-form="osPart" data-index="${index ?? ''}">
      <div class="modal-form-grid">
        ${U.selectField({ label: 'Peça do estoque', name: 'pecaId', value: selected, required: true, options: parts.map((part) => ({ value: part.id, label: `${part.nome} · ${qty(part.quantidadeEstoque)} ${part.unidade}${part.codigo ? ` · ${part.codigo}` : ''}` })), span: 2, attrs: 'data-os-part' })}
        ${U.field({ label: 'Quantidade', name: 'quantidade', type: 'number', min: '0.01', step: '0.01', value: item?.quantidade || 1, required: true })}
        ${U.field({ label: 'Valor unitário (R$)', name: 'valorUnitario', type: 'number', min: '0', step: '0.01', value: item?.valorUnitario ?? initialPart?.precoVenda ?? 0, required: true })}
        <div class="inline-note field-span2" id="os-part-stock-note">${icon('info')}<span></span></div>
      </div>
    </form>`,
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Cancelar</button><button type="submit" form="${formId}" class="btn btn-primary">${icon('check')}Adicionar peça</button>`,
    size: 'md',
    onMount(dialog) {
      const select = dialog.querySelector('[data-os-part]');
      const quantity = dialog.querySelector('[name="quantidade"]');
      const note = dialog.querySelector('#os-part-stock-note span');
      const update = (resetPrice = false) => {
        const part = S.pecaById(select.value);
        if (!part) return;
        if (resetPrice) dialog.querySelector('[name="valorUnitario"]').value = Number(part.precoVenda) || 0;
        const insufficient = Number(quantity.value) > Number(part.quantidadeEstoque);
        note.textContent = insufficient
          ? `Atenção: você informou ${qty(quantity.value)} e há apenas ${qty(part.quantidadeEstoque)} ${part.unidade} em estoque.`
          : `Disponível: ${qty(part.quantidadeEstoque)} ${part.unidade}.`;
        note.classList.toggle('is-warning', insufficient);
      };
      select.addEventListener('change', () => update(true));
      quantity.addEventListener('input', () => update(false));
      update();
    }
  });
}

function openOsLaborModal(index = null) {
  const draft = ensureOsDraft();
  const item = index === null ? null : draft.itens[index];
  const formId = 'form-mao-obra-os';
  U.openModal({
    title: item ? 'Editar mão de obra' : 'Adicionar mão de obra',
    subtitle: 'Descreva o serviço e informe o valor cobrado.',
    body: `<form id="${formId}" data-form="osLabor" data-index="${index ?? ''}">
      <div class="modal-form-grid">
        ${U.field({ label: 'Descrição do serviço', name: 'descricao', value: item?.descricao, required: true, span: 2, attrs: 'list="servicos-sugeridos"', placeholder: 'Ex.: Troca de óleo e filtro' })}
        <datalist id="servicos-sugeridos">${SERVICE_SUGGESTIONS.map((service) => `<option value="${esc(service)}"></option>`).join('')}</datalist>
        ${U.field({ label: 'Quantidade', name: 'quantidade', type: 'number', min: '0.01', step: '0.01', value: item?.quantidade || 1, required: true })}
        ${U.field({ label: 'Valor unitário (R$)', name: 'valorUnitario', type: 'number', min: '0', step: '0.01', value: item?.valorUnitario ?? '', required: true })}
      </div>
    </form>`,
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Cancelar</button><button type="submit" form="${formId}" class="btn btn-primary">${icon('check')}Adicionar serviço</button>`,
    size: 'md'
  });
}

function whatsAppUrl(number, message) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function validWhatsApp(phone) {
  const number = whatsAppNumber(phone);
  if (!number) {
    U.alertDialog({
      title: 'Telefone inválido',
      message: 'Cadastre um telefone brasileiro com DDD. Exemplos: (11) 98765-4321 ou 11987654321. Depois tente enviar a mensagem novamente.'
    });
    return '';
  }
  return number;
}

function openWhatsAppModal(phone, title, message) {
  const number = validWhatsApp(phone);
  if (!number) return;
  const formattedPhone = phone.replace(/\D/g, '').replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
  U.openModal({
    title: title || 'Enviar mensagem pelo WhatsApp',
    subtitle: 'Revise o texto. A mensagem só será enviada depois que você confirmar no WhatsApp.',
    body: `<div class="whatsapp-recipient">${icon('whatsapp')}<div><small>Para</small><strong>${esc(formattedPhone || phone)}</strong></div></div>
      <label class="whatsapp-message-label" for="whatsapp-message">Mensagem preparada</label>
      <textarea class="whatsapp-message" id="whatsapp-message" data-wa-message rows="14">${esc(message)}</textarea>
      <div class="whatsapp-meta"><span data-wa-count>${message.length} caracteres</span><span>Você pode editar antes de abrir.</span></div>
      <p class="field-help">${icon('info')} O sistema não envia mensagens sozinho e não guarda o conteúdo desta conversa.</p>
    `,
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Cancelar</button><button type="button" class="btn btn-secondary" data-action="copyWhatsApp">${icon('copiar')}Copiar texto</button><a class="btn btn-whatsapp" data-wa-open href="${esc(whatsAppUrl(number, message))}" target="_blank" rel="noopener noreferrer">${icon('whatsapp')}Abrir WhatsApp</a>`,
    size: 'lg',
    onMount(dialog) {
      const textarea = dialog.querySelector('[data-wa-message]');
      const count = dialog.querySelector('[data-wa-count]');
      const openButton = dialog.querySelector('[data-wa-open]');
      const update = () => {
        const text = textarea.value;
        count.textContent = `${text.length} caracteres`;
        openButton.href = whatsAppUrl(number, text);
        openButton.classList.toggle('is-disabled', !text.trim());
      };
      textarea.addEventListener('input', update);
      textarea.addEventListener('change', update);
      openButton.addEventListener('click', (event) => {
        if (!textarea.value.trim()) {
          event.preventDefault();
          U.toast('Escreva uma mensagem antes de abrir o WhatsApp.', 'error');
        }
      });
      update();
    }
  });
}

function orderWhatsAppMessage(order, template) {
  const firstName = String(order.clienteNome || '').trim().split(/\s+/)[0] || 'cliente';
  const vehicle = [order.veiculoDescricao, order.veiculoPlaca].filter(Boolean).join(' · ');
  const items = (order.itens || []).map((item) => `• ${item.descricao || item.pecaNome}: ${qty(item.quantidade)} ${item.unidade || ''} × ${money(item.valorUnitario)}`).join('\n');
  const total = `Total: ${money(order.total)}${Number(order.desconto) > 0 ? ` (desconto de ${money(order.desconto)})` : ''}`;
  let text = '';
  if (template === 'orcamento') {
    text = `Olá, ${firstName}! Aqui é a Franlin Car Veículos.\n\nSegue o orçamento da O.S. ${order.numero}${vehicle ? ` para ${vehicle}` : ''}:\n\n${items || 'Serviço a combinar.'}\n\n${total}${order.dataPrevisao ? `\nPrevisão de entrega: ${fmtDate(order.dataPrevisao)}` : ''}\n\nPor favor, confirme se o orçamento está aprovado. Obrigado!`;
  } else if (template === 'andamento') {
    text = `Olá, ${firstName}! Aqui é a Franlin Car Veículos.\n\nA O.S. ${order.numero}${vehicle ? ` do veículo ${vehicle}` : ''} foi aprovada e o serviço está em andamento.${order.dataPrevisao ? `\nPrevisão de entrega: ${fmtDate(order.dataPrevisao)}.` : ''}\n\nAvisaremos assim que estiver pronta. Obrigado!`;
  } else if (template === 'cobranca') {
    text = `Olá, ${firstName}! Aqui é a Franlin Car Veículos.\n\nEstamos entrando em contato sobre a O.S. ${order.numero}, faturada em ${fmtDate(order.dataFaturamento)}.\n\nValor em aberto: ${money(order.total)}${order.formaPagamento ? `\nForma combinada: ${order.formaPagamento}` : ''}\n\nEntre em contato conosco para confirmar o pagamento. Obrigado!`;
  } else if (template === 'pronta') {
    text = `Olá, ${firstName}! Aqui é a Franlin Car Veículos.\n\nBoas notícias: a O.S. ${order.numero}${vehicle ? ` do veículo ${vehicle}` : ''} está finalizada e o veículo está pronto para retirada.\n\n${total}${!order.pago ? '\nPagamento: aguardando.' : `\nPagamento recebido em ${fmtDate(order.dataPagamento)}.`}\n\nCombine o horário de retirada conosco. Obrigado!`;
  } else if (template === 'cancelada') {
    text = `Olá, ${firstName}! Aqui é a Franlin Car Veículos.\n\nInformamos que a O.S. ${order.numero} foi cancelada. Se houver peças que já haviam sido separadas, o estoque foi ajustado.\n\nSe precisar de mais informações, entre em contato conosco. Obrigado!`;
  } else {
    text = `Olá, ${firstName}! Aqui é a Franlin Car Veículos. Estamos entrando em contato sobre a O.S. ${order.numero}${vehicle ? ` do veículo ${vehicle}` : ''}. Como podemos ajudar?`;
  }
  return text;
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      if (!copied) throw new Error('copy failed');
    }
    U.toast('Texto copiado. Agora cole no WhatsApp.');
  } catch {
    U.toast('Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.', 'error');
  }
}

function printDocument({ title = 'Franlin Car Veículos', subtitle = '', content = '' }) {
  let printRoot = document.getElementById('print-root');
  if (!printRoot) {
    printRoot = document.createElement('div');
    printRoot.id = 'print-root';
    document.body.appendChild(printRoot);
  }
  printRoot.innerHTML = `<article class="print-document">
    <header class="print-header"><div><strong>FRANLIN CAR VEÍCULOS</strong><small>Sistema de gestão da oficina</small></div><div><h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div></header>
    ${content}
    <footer class="print-footer">Documento gerado em ${esc(fmtDateTime(nowISO()))} · Franlin Car Veículos</footer>
  </article>`;
  document.body.classList.add('print-mode');
  const cleanup = () => {
    document.body.classList.remove('print-mode');
    printRoot.innerHTML = '';
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  requestAnimationFrame(() => window.print());
  setTimeout(cleanup, 60000);
}

function printableOrder(order) {
  const items = order.itens || [];
  return `
    <section class="print-section"><h2>Dados do cliente e do veículo</h2><div class="print-info-grid">
      <div><span>Cliente</span><strong>${esc(order.clienteNome)}</strong></div>
      <div><span>CPF / CNPJ</span><strong>${esc(order.clienteDocumento || '—')}</strong></div>
      <div><span>Telefone</span><strong>${esc(S.clientePhone(order) || '—')}</strong></div>
      <div><span>Veículo</span><strong>${esc(order.veiculoDescricao || '—')}</strong></div>
      <div><span>Placa</span><strong>${esc(order.veiculoPlaca || '—')}</strong></div>
      <div><span>KM</span><strong>${order.km ? `${esc(qty(order.km))} km` : '—'}</strong></div>
      <div><span>Abertura</span><strong>${esc(fmtDate(order.dataAbertura))}</strong></div>
      <div><span>Previsão</span><strong>${esc(fmtDate(order.dataPrevisao))}</strong></div>
    </div></section>
    <section class="print-section"><h2>Problema relatado / serviço solicitado</h2><p>${esc(order.problemaRelatado || 'Não informado').replace(/\n/g, '<br>')}</p></section>
    <section class="print-section"><h2>Peças e serviços</h2><table class="print-table"><thead><tr><th>Descrição</th><th>Qtd.</th><th>Unitário</th><th>Total</th></tr></thead><tbody>
      ${items.map((item) => `<tr><td>${esc(item.descricao || item.pecaNome)}</td><td>${esc(qty(item.quantidade))} ${esc(item.unidade || '')}</td><td>${esc(money(item.valorUnitario))}</td><td>${esc(money(item.quantidade * item.valorUnitario))}</td></tr>`).join('')}
    </tbody></table><div class="print-totals">
      <div><span>Peças</span><strong>${esc(money(order.totalPecas))}</strong></div>
      <div><span>Mão de obra</span><strong>${esc(money(order.totalMaoObra))}</strong></div>
      ${Number(order.desconto) > 0 ? `<div><span>Desconto</span><strong>− ${esc(money(order.desconto))}</strong></div>` : ''}
      <div class="print-total-main"><span>Total</span><strong>${esc(money(order.total))}</strong></div>
    </div></section>
    ${order.observacoes ? `<section class="print-section"><h2>Observações</h2><p>${esc(order.observacoes).replace(/\n/g, '<br>')}</p></section>` : ''}
    <section class="print-section print-status"><strong>Status: ${esc(order.status)}</strong><span>Pagamento: ${order.pago ? `Pago em ${esc(fmtDate(order.dataPagamento))}` : order.status === 'Faturada' ? 'Pendente' : 'Após faturamento'}</span><span>Forma: ${esc(order.formaPagamento || 'Não informada')}</span></section>
    <section class="print-signatures"><div><span>Assinatura do cliente</span></div><div><span>Responsável pela oficina</span></div></section>
  `;
}

function exportBackup() {
  const content = S.exportPayload();
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `franlin-car-veiculos-${fileStamp()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  refresh();
  U.toast('Cópia de segurança baixada. Guarde o arquivo em um local seguro.');
}

async function readBackupFile(input) {
  const file = input.files?.[0];
  if (!file) return;
  try {
    if (file.size > 10 * 1024 * 1024) throw new Error('O arquivo é muito grande. Escolha uma cópia de segurança válida.');
    const content = await file.text();
    const parsed = JSON.parse(content);
    const data = parsed?.data || parsed;
    if (!data || typeof data !== 'object' || !['clientes', 'ordens', 'pecas', 'compras', 'despesas'].some((key) => Array.isArray(data[key]))) {
      throw new Error('O arquivo escolhido não é uma cópia de segurança do Franlin Car Veículos.');
    }
    const confirmed = await U.confirmDialog({
      title: 'Restaurar esta cópia?',
      message: 'Os dados atuais deste navegador serão substituídos pelos dados do arquivo. Baixe uma cópia dos dados atuais antes de continuar.',
      confirmText: 'Sim, restaurar cópia',
      tone: 'danger'
    });
    if (!confirmed) return;
    S.importPayload(content);
    osDraft = null;
    purchaseDraft = null;
    manualCache = '';
    navigate('#/');
    U.toast('Cópia restaurada com sucesso.');
  } catch (error) {
    U.toast(error.message || 'Não foi possível restaurar a cópia.', 'error');
  } finally {
    input.value = '';
  }
}

async function loadDemoData() {
  const confirmed = await U.confirmDialog({
    title: 'Carregar dados de exemplo?',
    message: 'Estes dados servem para treinar. Eles só podem ser carregados com o sistema vazio e podem ser apagados depois em Ajuda e manual.',
    confirmText: 'Carregar exemplo'
  });
  if (!confirmed) return;
  try {
    S.seedDemo();
    navigate('#/');
    U.toast('Dados de exemplo carregados. Explore o sistema e apague quando terminar.');
  } catch (error) {
    U.toast(error.message, 'error');
  }
}

async function clearAllData() {
  const first = await U.confirmDialog({
    title: 'Apagar todos os dados?',
    message: 'Clientes, veículos, peças, ordens, compras, despesas e todo o histórico deste navegador serão apagados. Esta ação não pode ser desfeita.',
    confirmText: 'Continuar',
    tone: 'danger'
  });
  if (!first) return;
  const second = await U.confirmDialog({
    title: 'Confirmação final',
    message: 'Tem certeza de que deseja apagar tudo? Se precisar dos dados depois, cancele agora e baixe uma cópia de segurança.',
    confirmText: 'Sim, apagar definitivamente',
    tone: 'danger'
  });
  if (!second) return;
  S.clearAll();
  osDraft = null;
  purchaseDraft = null;
  manualCache = '';
  navigate('#/');
  U.toast('Todos os dados deste navegador foram apagados.', 'info');
}

async function submitForm(form, submitter = null) {
  const kind = form.dataset.form;
  const values = formValues(form);
  try {
    if (kind === 'cliente') {
      const client = S.saveCliente({ ...values, id: form.dataset.id || '' });
      U.closeModal();
      if (currentRoute() === '/ordens/nova' || /^\/ordens\/[^/]+\/editar$/.test(currentRoute())) {
        if (osDraft) {
          osDraft.clienteId = client.id;
          osDraft.veiculoId = '';
        }
        refresh();
        U.toast('Cliente salvo. Agora cadastre o veículo.');
        setTimeout(() => openVehicleModal('', client.id, `os:${client.id}`), 60);
      } else {
        refresh();
        U.toast('Cliente salvo com sucesso.');
      }
    } else if (kind === 'veiculo') {
      const vehicle = S.saveVeiculo({ ...values, id: form.dataset.id || '' });
      const context = vehicleReturnClient;
      vehicleReturnClient = '';
      U.closeModal();
      refresh();
      if (context.startsWith('os:')) {
        if (osDraft) {
          osDraft.clienteId = vehicle.clienteId;
          osDraft.veiculoId = vehicle.id;
        }
        refresh();
        U.toast('Veículo salvo e selecionado na O.S.');
      } else if (context.startsWith('lista:')) {
        setTimeout(() => openVehiclesModal(context.slice(6)), 40);
        U.toast('Veículo salvo com sucesso.');
      } else {
        U.toast('Veículo salvo com sucesso.');
      }
    } else if (kind === 'fornecedor') {
      S.saveFornecedor({ ...values, id: form.dataset.id || '' });
      U.closeModal();
      refresh();
      U.toast('Fornecedor salvo com sucesso.');
    } else if (kind === 'peca') {
      const returnContext = vehicleReturnClient;
      const part = S.savePeca({ ...values, id: form.dataset.id || '' });
      vehicleReturnClient = '';
      U.closeModal();
      refresh();
      U.toast('Peça salva com sucesso.');
      if (returnContext === 'part:os') setTimeout(() => openOsPartModal(null, part.id), 50);
    } else if (kind === 'movimentacao') {
      const part = S.pecaById(values.pecaId);
      if (part && values.tipo === 'Saída' && Number(values.quantidade) > Number(part.quantidadeEstoque)) {
        throw new Error(`A saída é maior que o estoque disponível (${qty(part.quantidadeEstoque)} ${part.unidade}).`);
      }
      S.adjustStock(values);
      U.closeModal();
      refresh();
      U.toast('Movimentação de estoque registrada.');
    } else if (kind === 'despesa') {
      S.saveDespesa({
        ...values,
        id: form.dataset.id || '',
        status: values.status,
        dataPagamento: values.status === 'Pago' ? values.dataPagamento || todayISO() : ''
      });
      U.closeModal();
      refresh();
      U.toast('Despesa salva com sucesso.');
    } else if (kind === 'compraMeta') {
      if (!values.fornecedorNome && values.fornecedorId) values.fornecedorNome = S.fornecedorById(values.fornecedorId)?.nome || '';
      S.updateCompraMeta(values.id, {
        ...values,
        dataPagamento: values.statusPagamento === 'Pago' ? values.dataPagamento || todayISO() : ''
      });
      U.closeModal();
      refresh();
      U.toast('Dados da compra atualizados.');
    } else if (kind === 'purchase') {
      if (!values.fornecedorNome && values.fornecedorId) values.fornecedorNome = S.fornecedorById(values.fornecedorId)?.nome || '';
      if (!values.fornecedorNome) throw new Error('Escolha um fornecedor ou informe o nome do fornecedor.');
      const purchase = S.createCompra({
        ...values,
        itens: purchaseDraft.itens,
        dataPagamento: values.statusPagamento === 'Pago' ? values.dataPagamento || todayISO() : ''
      });
      purchaseDraft = null;
      navigate('#/compras');
      U.toast(`Compra registrada. ${purchase.itens.length} peça(s) entraram no estoque.`);
    } else if (kind === 'purchaseItem') {
      const index = form.dataset.index === '' ? null : Number(form.dataset.index);
      let item;
      if (values.pecaId === '__nova__') {
        item = {
          pecaId: '', pecaNome: values.pecaNome, descricao: values.pecaNome,
          codigo: values.codigo, marca: values.marca, categoria: values.categoria,
          unidade: values.unidade, precoVenda: values.precoVenda,
          estoqueMinimo: values.estoqueMinimo, quantidade: values.quantidade,
          valorUnitario: values.valorUnitario
        };
      } else {
        const part = S.pecaById(values.pecaId);
        if (!part) throw new Error('A peça escolhida não foi encontrada.');
        item = {
          pecaId: part.id, pecaNome: part.nome, descricao: part.nome,
          codigo: part.codigo, marca: part.marca, categoria: part.categoria,
          unidade: part.unidade, precoVenda: part.precoVenda,
          estoqueMinimo: part.estoqueMinimo, quantidade: values.quantidade,
          valorUnitario: values.valorUnitario
        };
      }
      if (index === null) purchaseDraft.itens.push(item);
      else purchaseDraft.itens[index] = item;
      U.closeModal();
      refresh();
      U.toast('Peça atualizada na compra.');
    } else if (kind === 'osPart') {
      const index = form.dataset.index === '' ? null : Number(form.dataset.index);
      const part = S.pecaById(values.pecaId);
      if (!part) throw new Error('A peça escolhida não foi encontrada.');
      const item = {
        tipo: 'peca', pecaId: part.id, pecaNome: part.nome, descricao: part.nome,
        codigo: part.codigo, unidade: part.unidade,
        quantidade: values.quantidade, valorUnitario: values.valorUnitario
      };
      if (index === null) osDraft.itens.push(item);
      else osDraft.itens[index] = item;
      U.closeModal();
      refresh();
      U.toast('Peça atualizada na O.S.');
    } else if (kind === 'osLabor') {
      const index = form.dataset.index === '' ? null : Number(form.dataset.index);
      const item = {
        tipo: 'mao_obra', pecaId: '', pecaNome: '', codigo: '', unidade: '',
        descricao: values.descricao, quantidade: values.quantidade,
        valorUnitario: values.valorUnitario
      };
      if (index === null) osDraft.itens.push(item);
      else osDraft.itens[index] = item;
      U.closeModal();
      refresh();
      U.toast('Serviço atualizado na O.S.');
    } else if (kind === 'osStep1') {
      if (!values.clienteId) throw new Error('Escolha o cliente.');
      const vehicle = S.veiculoById(values.veiculoId);
      if (!vehicle || vehicle.clienteId !== values.clienteId) throw new Error('Escolha um veículo que pertença ao cliente selecionado.');
      Object.assign(osDraft, values, { step: 2 });
      refresh();
    } else if (kind === 'osSave') {
      const client = S.clienteById(osDraft.clienteId);
      const vehicle = S.veiculoById(osDraft.veiculoId);
      if (!client || !vehicle || vehicle.clienteId !== client.id) throw new Error('Confira o cliente e o veículo antes de salvar.');
      if (!osDraft.itens.length) throw new Error('Adicione pelo menos uma peça ou um serviço antes de salvar.');
      if (Number(values.desconto) > S.computeOrderTotals(osDraft.itens).total) throw new Error('O desconto não pode ser maior que o total dos itens.');
      const pago = values.status === 'Faturada' && values.pago === 'on';
      const order = S.saveOrder({
        ...osDraft,
        ...values,
        pago,
        clienteNome: client.nome,
        clienteTelefone: client.telefone,
        clienteDocumento: client.cpfCnpj,
        clienteEndereco: [client.endereco, client.cidade].filter(Boolean).join(' · '),
        veiculoPlaca: vehicle.placa,
        veiculoDescricao: vehicleTitle(vehicle)
      });
      const send = submitter?.value === 'send';
      osDraft = null;
      navigate(`#/ordens/${order.id}`);
      U.toast('Ordem de serviço salva com sucesso.');
      if (send) setTimeout(() => openOrderWhatsApp(order.id, order.status === 'Orçamento' ? 'orcamento' : 'andamento'), 100);
    } else {
      return;
    }
  } catch (error) {
    U.toast(error.message || 'Não foi possível salvar. Confira os campos.', 'error');
  }
}

function openOrderWhatsApp(id, template = '') {
  const order = S.ordemById(id);
  if (!order) return;
  const selectedTemplate = template || (order.status === 'Orçamento' ? 'orcamento' : order.status === 'Cancelada' ? 'cancelada' : order.status === 'Faturada' ? 'pronta' : 'andamento');
  openWhatsAppModal(S.clientePhone(order), 'Mensagem para o cliente', orderWhatsAppMessage(order, selectedTemplate));
}

function openClientWhatsApp(id) {
  const client = S.clienteById(id);
  if (!client) return;
  const firstName = String(client.nome || '').trim().split(/\s+/)[0] || 'cliente';
  openWhatsAppModal(client.telefone, `Mensagem para ${client.nome}`, `Olá, ${firstName}! Aqui é a Franlin Car Veículos. Como podemos ajudar?`);
}

async function changeOrderStatus(id, status) {
  const order = S.ordemById(id);
  if (!order) return;
  if ((status === 'Aprovada' || status === 'Faturada') && !order.estoqueBaixado) {
    const insufficient = order.itens.filter((item) => {
      if (item.tipo !== 'peca' || !item.pecaId) return false;
      const part = S.pecaById(item.pecaId);
      return part && Number(item.quantidade) > Number(part.quantidadeEstoque);
    });
    if (insufficient.length) {
      await U.alertDialog({
        title: 'Estoque insuficiente',
        message: `Estas peças não têm quantidade suficiente: ${insufficient.map((item) => item.descricao || item.pecaNome).join(', ')}. Reponha o estoque ou ajuste os itens antes de aprovar a O.S.`
      });
      return;
    }
  }
  const messages = {
    Aprovada: 'Ao aprovar, as peças desta O.S. serão baixadas do estoque automaticamente.',
    Faturada: 'A O.S. será faturada e entrará em Contas a receber se ainda não estiver paga.',
    Cancelada: order.estoqueBaixado ? 'Ao cancelar, as peças baixadas voltarão ao estoque.' : 'A O.S. será marcada como cancelada.',
    Orçamento: order.estoqueBaixado ? 'Ao reabrir como orçamento, as peças voltarão ao estoque.' : 'A O.S. voltará para Orçamento.'
  };
  const labels = { Aprovada: 'Aprovar O.S.', Faturada: 'Faturar O.S.', Cancelada: 'Cancelar O.S.', Orçamento: 'Reabrir O.S.' };
  const confirmed = await U.confirmDialog({
    title: labels[status],
    message: messages[status] || 'Deseja continuar?',
    confirmText: labels[status],
    tone: status === 'Cancelada' ? 'danger' : 'primary'
  });
  if (!confirmed) return;
  S.setOrderStatus(id, status);
  refresh();
  U.toast(`O.S. atualizada para ${status}.`);
}

async function setOrderPaid(id, paid) {
  const order = S.ordemById(id);
  if (!order) return;
  if (!paid) {
    S.markOrderPaid(id, false);
    refresh();
    U.toast('O.S. marcada como não paga.');
    return;
  }
  const confirmed = await U.confirmDialog({
    title: 'Confirmar recebimento',
    message: `Confirmar o recebimento de ${money(order.total)} na data de hoje? O valor entrará no caixa deste mês.`,
    confirmText: 'Sim, recebido'
  });
  if (!confirmed) return;
  S.markOrderPaid(id, true);
  refresh();
  U.toast('Pagamento registrado. O valor entrou no caixa.');
}

async function setPurchasePaid(id, paid) {
  const purchase = S.compraById(id);
  if (!purchase) return;
  if (paid) {
    const confirmed = await U.confirmDialog({ title: 'Confirmar pagamento', message: `Marcar a compra de ${money(purchase.total)} como paga hoje?`, confirmText: 'Sim, pagar' });
    if (!confirmed) return;
  }
  S.markCompraPaid(id, paid);
  U.closeModal();
  refresh();
  U.toast(paid ? 'Compra marcada como paga.' : 'Compra reaberta como pendente.');
}

async function setExpensePaid(id, paid) {
  const expense = S.despesaById(id);
  if (!expense) return;
  if (paid) {
    const confirmed = await U.confirmDialog({ title: 'Confirmar pagamento', message: `Marcar a despesa de ${money(expense.valor)} como paga hoje?`, confirmText: 'Sim, pagar' });
    if (!confirmed) return;
  }
  S.markDespesaPaid(id, paid);
  refresh();
  U.toast(paid ? 'Despesa marcada como paga.' : 'Despesa reaberta como pendente.');
}

async function deleteOrder(id) {
  const order = S.ordemById(id);
  if (!order) return;
  const confirmed = await U.confirmDialog({
    title: `Excluir O.S. ${order.numero}?`,
    message: order.estoqueBaixado ? 'A O.S. será excluída e todas as peças baixadas por ela voltarão ao estoque. Esta ação não pode ser desfeita.' : 'A O.S. será excluída. Esta ação não pode ser desfeita.',
    confirmText: 'Excluir O.S.',
    tone: 'danger'
  });
  if (!confirmed) return;
  S.deleteOrder(id);
  navigate('#/ordens');
  U.toast('O.S. excluída.');
}

async function deleteClient(id) {
  const client = S.clienteById(id);
  if (!client) return;
  const ordersCount = S.store.data.ordens.filter((order) => order.clienteId === id).length;
  const confirmed = await U.confirmDialog({
    title: `Excluir ${client.nome}?`,
    message: `O cadastro e os veículos serão excluídos.${ordersCount ? ` As ${ordersCount} O.S. continuarão no histórico com os dados copiados na época.` : ''} Esta ação não pode ser desfeita.`,
    confirmText: 'Excluir cliente',
    tone: 'danger'
  });
  if (!confirmed) return;
  S.deleteCliente(id);
  U.closeModal();
  refresh();
  U.toast('Cliente e veículos excluídos.');
}

async function deleteVehicle(id) {
  const vehicle = S.veiculoById(id);
  if (!vehicle) return;
  const ordersCount = S.store.data.ordens.filter((order) => order.veiculoId === id).length;
  const confirmed = await U.confirmDialog({
    title: `Excluir veículo ${vehicle.placa}?`,
    message: `O veículo será removido do cadastro.${ordersCount ? ' As ordens de serviço antigas continuarão com os dados copiados.' : ''} Esta ação não pode ser desfeita.`,
    confirmText: 'Excluir veículo',
    tone: 'danger'
  });
  if (!confirmed) return;
  S.deleteVeiculo(id);
  if (osDraft?.veiculoId === id) osDraft.veiculoId = '';
  const context = vehicleReturnClient;
  U.closeModal();
  refresh();
  if (context.startsWith('lista:')) setTimeout(() => openVehiclesModal(context.slice(6)), 40);
  U.toast('Veículo excluído.');
}

async function deletePart(id) {
  const part = S.pecaById(id);
  if (!part) return;
  const confirmed = await U.confirmDialog({
    title: `Excluir ${part.nome}?`,
    message: 'A peça será removida do cadastro. O histórico de movimentações e os dados das O.S. antigas serão preservados. Esta ação não pode ser desfeita.',
    confirmText: 'Excluir peça',
    tone: 'danger'
  });
  if (!confirmed) return;
  S.deletePeca(id);
  refresh();
  U.toast('Peça excluída do cadastro.');
}

async function deleteSupplier(id) {
  const supplier = S.fornecedorById(id);
  if (!supplier) return;
  const confirmed = await U.confirmDialog({
    title: `Excluir ${supplier.nome}?`,
    message: 'O fornecedor será removido do cadastro. Compras e peças antigas preservam o nome que foi usado na época.',
    confirmText: 'Excluir fornecedor',
    tone: 'danger'
  });
  if (!confirmed) return;
  S.deleteFornecedor(id);
  refresh();
  U.toast('Fornecedor excluído.');
}

async function deleteExpense(id) {
  const expense = S.despesaById(id);
  if (!expense) return;
  const confirmed = await U.confirmDialog({ title: 'Excluir despesa?', message: `A despesa "${expense.descricao}" será excluída e não fará mais parte do caixa.`, confirmText: 'Excluir despesa', tone: 'danger' });
  if (!confirmed) return;
  S.deleteDespesa(id);
  refresh();
  U.toast('Despesa excluída.');
}

async function deletePurchase(id) {
  const purchase = S.compraById(id);
  if (!purchase) return;
  const confirmed = await U.confirmDialog({
    title: 'Excluir compra e estornar estoque?',
    message: 'A compra será excluída e a quantidade de cada peça será retirada do estoque. Se as peças já tiverem sido usadas, o saldo poderá ficar negativo. Esta ação não pode ser desfeita.',
    confirmText: 'Excluir e estornar',
    tone: 'danger'
  });
  if (!confirmed) return;
  S.deleteCompra(id);
  U.closeModal();
  refresh();
  U.toast('Compra excluída e estoque estornado.');
}

function openPartHistory(id) {
  const part = S.pecaById(id);
  if (!part) return;
  const movements = S.store.data.movimentacoes.filter((movement) => movement.pecaId === id);
  U.openModal({
    title: `Histórico · ${part.nome}`,
    subtitle: `Estoque atual: ${qty(part.quantidadeEstoque)} ${part.unidade}`,
    body: movements.length ? `<div class="history-list">${movements.map((movement) => `
      <article class="history-row"><span class="history-icon ${movement.tipo === 'Entrada' ? 'tone-green' : 'tone-rose'}">${icon(movement.tipo === 'Entrada' ? 'subir' : 'baixar')}</span><div><strong>${esc(movement.motivo)}</strong><small>${esc(fmtDateTime(movement.data))}${movement.referencia ? ` · ${esc(movement.referencia)}` : ''}</small></div><div class="history-values"><strong class="${movement.tipo === 'Entrada' ? 'text-green' : 'text-rose'}">${movement.tipo === 'Entrada' ? '+' : '−'}${esc(qty(movement.quantidade))}</strong><small>Saldo: ${esc(qty(movement.saldoNovo))}</small></div></article>`).join('')}</div>` : U.emptyState({ iconName: 'relogio', title: 'Nenhuma movimentação', text: 'As entradas e saídas desta peça aparecerão aqui.', compact: true }),
    footer: `<button type="button" class="btn btn-ghost" data-modal-close>Fechar</button><button type="button" class="btn btn-primary" data-action="openMovement" data-id="${esc(id)}">${icon('subir')}Nova movimentação</button>`,
    size: 'lg'
  });
}

const LIST_RENDERERS = {
  orders: renderOrdersList,
  stock: renderStockList,
  movements: renderMovementsList,
  clients: renderClientsList,
  suppliers: renderSuppliersList,
  purchases: renderPurchasesList,
  expenses: renderExpensesList
};

document.addEventListener('click', async (event) => {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;
  const action = trigger.dataset.action;
  const id = trigger.dataset.id || '';
  try {
    switch (action) {
      case 'fontDown':
        fontScale = Math.max(1, fontScale - 1);
        localStorage.setItem('fcv.fontScale', String(fontScale));
        applyFontScale();
        break;
      case 'fontUp':
        fontScale = Math.min(3, fontScale + 1);
        localStorage.setItem('fcv.fontScale', String(fontScale));
        applyFontScale();
        break;
      case 'toggleMenu':
        document.body.classList.toggle('menu-open');
        trigger.setAttribute('aria-expanded', String(document.body.classList.contains('menu-open')));
        break;
      case 'closeMenu':
        document.body.classList.remove('menu-open');
        document.querySelector('[data-action="toggleMenu"]')?.setAttribute('aria-expanded', 'false');
        break;
      case 'filter': {
        const scope = trigger.dataset.scope;
        const value = trigger.dataset.value;
        if (scope === 'stock' && value === 'low') viewState.stock.lowOnly = !viewState.stock.lowOnly;
        else if (viewState[scope]) viewState[scope].status = value;
        refresh();
        break;
      }
      case 'newClient': openClientModal(); break;
      case 'editClient': openClientModal(id); break;
      case 'newVehicle': openVehicleModal(); break;
      case 'clientAddVehicle': openVehicleModal('', id, `lista:${id}`); break;
      case 'editVehicle': openVehicleModal(id, '', `lista:${vehicleReturnClient.replace(/^lista:/, '')}`); break;
      case 'clientVehicles': openVehiclesModal(id); break;
      case 'deleteClient': await deleteClient(id); break;
      case 'deleteVehicle': await deleteVehicle(id); break;
      case 'newSupplier': openSupplierModal(); break;
      case 'editSupplier': openSupplierModal(id); break;
      case 'deleteSupplier': await deleteSupplier(id); break;
      case 'newPart': openPartModal(); break;
      case 'editPart': openPartModal(id); break;
      case 'deletePart': await deletePart(id); break;
      case 'partHistory': openPartHistory(id); break;
      case 'openMovement': openMovementModal(id); break;
      case 'clientWhatsApp': openClientWhatsApp(id); break;
      case 'newExpense': openExpenseModal(); break;
      case 'editExpense': openExpenseModal(id); break;
      case 'expensePaid': await setExpensePaid(id, trigger.dataset.paid === 'true'); break;
      case 'deleteExpense': await deleteExpense(id); break;
      case 'startPurchase': startPurchase(); break;
      case 'viewPurchase': openPurchaseDetail(id); break;
      case 'editPurchase': openPurchaseMeta(id); break;
      case 'purchaseAddItem':
        purchaseDraft = { ...purchaseDraft, ...formValues(document.querySelector('form[data-form="purchase"]')) };
        openPurchaseItem();
        break;
      case 'purchaseEditItem':
        purchaseDraft = { ...purchaseDraft, ...formValues(document.querySelector('form[data-form="purchase"]')) };
        openPurchaseItem(Number(trigger.dataset.index));
        break;
      case 'purchaseRemoveItem':
        purchaseDraft = { ...purchaseDraft, ...formValues(document.querySelector('form[data-form="purchase"]')) };
        purchaseDraft.itens.splice(Number(trigger.dataset.index), 1);
        refresh();
        break;
      case 'purchasePaid': await setPurchasePaid(id, trigger.dataset.paid === 'true'); break;
      case 'deletePurchase': await deletePurchase(id); break;
      case 'orderEdit': navigate(`#/ordens/${id}/editar`); break;
      case 'orderWhatsApp': openOrderWhatsApp(id, trigger.dataset.template || ''); break;
      case 'chargeWhatsApp': openOrderWhatsApp(id, 'cobranca'); break;
      case 'orderPrint': {
        const order = S.ordemById(id);
        if (order) printDocument({ title: `Ordem de Serviço ${order.numero}`, subtitle: `${order.clienteNome} · ${order.status}`, content: printableOrder(order) });
        break;
      }
      case 'orderApprove': await changeOrderStatus(id, 'Aprovada'); break;
      case 'orderInvoice': await changeOrderStatus(id, 'Faturada'); break;
      case 'orderCancel': await changeOrderStatus(id, 'Cancelada'); break;
      case 'orderReopen': await changeOrderStatus(id, 'Orçamento'); break;
      case 'orderPay': await setOrderPaid(id, true); break;
      case 'orderUnpay': await setOrderPaid(id, false); break;
      case 'orderDelete': await deleteOrder(id); break;
      case 'osNewVehicle': openVehicleModal('', id, `os:${id}`); break;
      case 'osAddPart': openOsPartModal(); break;
      case 'osAddLabor': openOsLaborModal(); break;
      case 'osEditItem': {
        const item = osDraft?.itens[Number(trigger.dataset.index)];
        if (item?.tipo === 'peca') openOsPartModal(Number(trigger.dataset.index));
        else if (item?.tipo === 'mao_obra') openOsLaborModal(Number(trigger.dataset.index));
        break;
      }
      case 'osRemoveItem':
        osDraft.itens.splice(Number(trigger.dataset.index), 1);
        refresh();
        break;
      case 'osBack':
        osDraft.step = 1;
        refresh();
        break;
      case 'osBackTwo':
        osDraft.step = 2;
        refresh();
        break;
      case 'osNextReview':
        if (!osDraft.itens.length) {
          await U.alertDialog({ title: 'Adicione um item', message: 'Inclua pelo menos uma peça ou um serviço de mão de obra antes de continuar.' });
          break;
        }
        osDraft.step = 3;
        refresh();
        break;
      case 'osCancel': {
        const confirmed = await U.confirmDialog({
          title: 'Sair da ordem de serviço?',
          message: 'As alterações que ainda não foram salvas serão perdidas.',
          confirmText: 'Sair sem salvar',
          tone: 'danger'
        });
        if (confirmed) {
          osDraft = null;
          navigate('#/ordens');
        }
        break;
      }
      case 'copyWhatsApp': {
        const message = document.querySelector('[data-wa-message]')?.value || '';
        await copyText(message);
        break;
      }
      case 'exportBackup': exportBackup(); break;
      case 'importBackup': document.getElementById('backup-file')?.click(); break;
      case 'loadDemo': await loadDemoData(); break;
      case 'clearAll': await clearAllData(); break;
      case 'movementFilter':
        viewState.movements.tipo = trigger.dataset.value || 'todos';
        refresh();
        break;
      case 'manualTop': document.getElementById('manual-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
      case 'manualJump': document.getElementById(trigger.dataset.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); break;
      case 'retryManual': manualCache = ''; loadManualIntoPage(); break;
      case 'printManual': {
        let body = document.querySelector('.manual-body');
        if (!body) {
          const parsed = U.markdownToHtml(await getManual());
          body = document.createElement('article');
          body.className = 'manual-body';
          body.innerHTML = parsed.html;
        }
        printDocument({ title: 'Manual do Usuário', subtitle: `Versão ${APP_VERSION}`, content: body.innerHTML });
        break;
      }
      default:
        console.warn(`Ação não tratada: ${action}`);
    }
  } catch (error) {
    console.error(error);
    U.toast(error.message || 'Não foi possível concluir a ação.', 'error');
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  submitForm(form, event.submitter);
});

document.addEventListener('input', (event) => {
  const input = event.target.closest('[data-search]');
  if (!input) return;
  const scope = input.dataset.search;
  viewState[scope].search = input.value;
  clearTimeout(input._searchTimer);
  input._searchTimer = setTimeout(() => {
    const list = document.querySelector(`[data-list="${scope}"]`);
    if (list) list.innerHTML = LIST_RENDERERS[scope]();
  }, 140);
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (target.id === 'backup-file') {
    readBackupFile(target);
    return;
  }
  if (target.matches('[data-stock-category]')) {
    viewState.stock.categoria = target.value;
    const list = document.querySelector('[data-list="stock"]');
    if (list) list.innerHTML = renderStockList();
    return;
  }
  if (target.matches('[data-movement-type]') && currentRoute() === '/estoque/movimentacoes') {
    viewState.movements.tipo = target.value;
    const list = document.querySelector('[data-list="movements"]');
    if (list) list.innerHTML = renderMovementsList();
    return;
  }
  if (target.matches('[data-os-client]')) {
    Object.assign(osDraft, formValues(target.form));
    osDraft.veiculoId = '';
    refresh();
    return;
  }
  if (target.matches('[data-os-status]')) {
    Object.assign(osDraft, formValues(target.form), { pago: target.form.querySelector('[name="pago"]')?.checked || false });
    if (osDraft.status !== 'Faturada') osDraft.pago = false;
    refresh();
    return;
  }
  if (target.matches('[data-purchase-status]') && target.form.dataset.form === 'purchase') {
    purchaseDraft = { ...purchaseDraft, ...formValues(target.form) };
    if (purchaseDraft.statusPagamento === 'Pago' && !purchaseDraft.dataPagamento) purchaseDraft.dataPagamento = todayISO();
    if (purchaseDraft.statusPagamento !== 'Pago') purchaseDraft.dataPagamento = '';
    refresh();
    return;
  }
  if (target.matches('[name="fornecedorId"]') && target.form.dataset.form === 'purchase') {
    const supplier = S.fornecedorById(target.value);
    const freeName = target.form.querySelector('[name="fornecedorNome"]');
    if (supplier && freeName) freeName.value = supplier.nome;
  }
});

document.getElementById('backup-file')?.addEventListener('change', (event) => readBackupFile(event.target));

window.addEventListener('hashchange', () => {
  render();
});

window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  S.reload();
  osDraft = null;
  purchaseDraft = null;
  refresh();
  U.toast('Os dados foram atualizados por outra aba deste navegador.', 'info');
});

if (!location.hash) history.replaceState(null, '', `${location.pathname}${location.search}#/`);
render();
