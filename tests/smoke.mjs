import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

class MemoryStorage {
  #values = new Map();

  get length() {
    return this.#values.size;
  }

  key(index) {
    return [...this.#values.keys()][index] ?? null;
  }

  getItem(key) {
    return this.#values.get(String(key)) ?? null;
  }

  setItem(key, value) {
    this.#values.set(String(key), String(value));
  }

  removeItem(key) {
    this.#values.delete(String(key));
  }

  clear() {
    this.#values.clear();
  }
}

let uuidCounter = 0;
globalThis.localStorage = new MemoryStorage();
globalThis.window = {
  crypto: {
    randomUUID() {
      uuidCounter += 1;
      return `00000000-0000-4000-8000-${String(uuidCounter).padStart(12, '0')}`;
    }
  }
};

const U = await import('../js/util.js');
const UI = await import('../js/ui.js');
const S = await import('../js/store.js');
const STORAGE_KEY = 'fcv.store.v1';
const ARRAY_KEYS = ['clientes', 'veiculos', 'fornecedores', 'pecas', 'movimentacoes', 'ordens', 'compras', 'despesas'];
const tests = [];

function test(name, run) {
  tests.push({ name, run });
}

function resetState() {
  uuidCounter = 0;
  localStorage.clear();
  S.clearAll();
}

function makeClient(overrides = {}) {
  return S.saveCliente({
    nome: 'Cliente Teste',
    tipo: 'Pessoa Física',
    telefone: '(27) 99999-1010',
    email: 'cliente@example.com',
    ...overrides
  });
}

function makeVehicle(clienteId, overrides = {}) {
  return S.saveVeiculo({
    clienteId,
    placa: 'ABC1D23',
    marca: 'Fiat',
    modelo: 'Uno',
    ano: '2014',
    km: '128400',
    ...overrides
  });
}

function makeSupplier(overrides = {}) {
  return S.saveFornecedor({ nome: 'Fornecedor Teste', telefone: '(27) 3333-4040', ...overrides });
}

function makePart(overrides = {}) {
  return S.savePeca({
    nome: 'Peça Teste',
    codigo: 'PT-001',
    categoria: 'Motor',
    unidade: 'un',
    precoCusto: 50,
    precoVenda: 100,
    quantidadeEstoque: 10,
    estoqueMinimo: 2,
    ...overrides
  });
}

function makeOrder({ client, vehicle, part, status = 'Orçamento', items, desconto = 0, pago = false, ...overrides }) {
  return S.saveOrder({
    clienteId: client?.id || '',
    clienteNome: client?.nome || '',
    clienteTelefone: client?.telefone || '',
    veiculoId: vehicle?.id || '',
    veiculoPlaca: vehicle?.placa || '',
    veiculoDescricao: vehicle ? `${vehicle.marca} ${vehicle.modelo}` : '',
    status,
    problemaRelatado: 'Problema de teste',
    itens: items ?? [
      { tipo: 'peca', pecaId: part.id, descricao: part.nome, quantidade: 2, valorUnitario: 100 },
      { tipo: 'mao_obra', descricao: 'Serviço de teste', quantidade: 1, valorUnitario: 50 }
    ],
    desconto,
    pago,
    ...overrides
  });
}

function orderFixture() {
  const client = makeClient();
  const vehicle = makeVehicle(client.id);
  const part = makePart();
  return { client, vehicle, part };
}

function monthDate(offset) {
  const now = new Date();
  return U.localDateISO(new Date(now.getFullYear(), now.getMonth() + offset, 15));
}

function assertEmptyData() {
  assert.equal(S.store.data.version, 1);
  for (const key of ARRAY_KEYS) assert.deepEqual(S.store.data[key], []);
  assert.equal(S.store.data.meta.nextOs, 1);
  assert.equal(S.store.data.meta.demo, false);
  assert.equal(S.isStoreEmpty(), true);
}

test('util: formatação, datas e escape de HTML', () => {
  assert.equal(U.money(1234.5).replace(/\s/g, ''), 'R$1.234,50');
  assert.equal(U.money('inválido'), U.money(0));
  assert.equal(U.qty(2.5), '2,5');
  assert.equal(U.round2(10.006), 10.01);
  assert.equal(U.fmtDate('2026-11-22'), '22/11/2026');
  assert.equal(U.fmtDate(''), '—');
  assert.equal(U.localDateISO(new Date(2026, 10, 22)), '2026-11-22');
  assert.equal(U.monthKey('2026-11-22'), '2026-11');
  assert.equal(U.isInMonth('2026-11-30', '2026-11'), true);
  assert.equal(U.isInMonth('2026-12-01', '2026-11'), false);
  assert.equal(U.escapeHtml(`<script>"'&`), '&lt;script&gt;&quot;&#39;&amp;');
  assert.equal(U.attr(`<b title="x">`), '&lt;b title=&quot;x&quot;&gt;');
  assert.equal(U.slugify('Órgão e Serviço'), 'orgao-e-servico');
  assert.equal(U.normalizeSearch(' AÇÃO '), ' acao ');
  assert.equal(U.initials('Maria Aparecida Souza'), 'MS');
});

test('ui: campos numéricos preservam limites e casas decimais', () => {
  const html = UI.field({ label: 'Valor', name: 'valor', type: 'number', min: '0.01', max: '1000', step: '0.01' });
  assert.match(html, /type="number"/);
  assert.match(html, /min="0\.01"/);
  assert.match(html, /max="1000"/);
  assert.match(html, /step="0\.01"/);
});

test('ui: formulários usam IDs fixos e não inserem IDs importados no HTML', () => {
  const source = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /const formId = `/);
  for (const id of ['form-cliente', 'form-veiculo', 'form-fornecedor', 'form-peca', 'form-despesa', 'form-compra', 'form-item-compra', 'form-peca-os', 'form-mao-obra-os']) {
    assert.ok(source.includes(`const formId = '${id}';`), `ID fixo ausente: ${id}`);
  }
});

test('ui: manual fica no final do menu e da página de ajuda', () => {
  const shell = UI.shell({ path: '/ajuda', content: '<p>Conteúdo</p>' });
  assert.doesNotMatch(shell, /btn-help-top/);
  assert.ok(shell.indexOf('nav-help') > shell.lastIndexOf('nav-group'));

  const source = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const helpView = source.slice(source.indexOf('function helpView('), source.indexOf('async function getManual()'));
  assert.ok(helpView.indexOf('backup-card') < helpView.indexOf('manual-content'));
  assert.doesNotMatch(helpView, /data-action="(?:exportBackup|importBackup|loadDemo|clearAll)"/);
  assert.match(helpView, /data-action="syncNow"/);
  assert.doesNotMatch(helpView, /data-action="printManual"/);
  assert.ok(source.indexOf('data-action="printManual"') > source.indexOf('class="manual-toolbar"'));
  assert.match(source, /route\.path\.startsWith\('\/ajuda'\)\) loadManualIntoPage\(\)/);
  assert.doesNotMatch(source, /setTimeout\(loadManualIntoPage/);
});

test('ui: sistema expõe apenas O.S. e mantém cliente e veículo opcionais', () => {
  assert.equal(UI.NAV_GROUPS.length, 1);
  assert.deepEqual(UI.NAV_GROUPS[0].items.map((item) => item.key), ['ordens']);
  const shell = UI.shell({ path: '/ordens', content: '<p>Ordens</p>' });
  assert.match(shell, /class="brand" href="#\/ordens"/);
  for (const label of ['Painel', 'Peças em estoque', 'Compras', 'Fornecedores', 'Despesas', 'Contas e caixa', 'Clientes e veículos']) {
    assert.ok(!shell.includes(label), `Menu fora do fluxo de O.S.: ${label}`);
  }

  const source = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const routeContent = source.slice(source.indexOf('function contentForPath('), source.indexOf('function notFoundView('));
  assert.match(routeContent, /if \(parts\[0\] === 'ordens'\)/);
  assert.match(routeContent, /if \(parts\[0\] === 'ajuda'\)/);
  for (const route of ['dashboardView', 'stockView', 'purchasesView', 'expensesView', 'financeView', 'clientsView', 'suppliersView']) {
    assert.ok(!routeContent.includes(route), `Rota fora do fluxo de O.S.: ${route}`);
  }
  const parseRoute = source.slice(source.indexOf('function parseRoute('), source.indexOf('function pathSegments('));
  assert.match(parseRoute, /path = '\/ordens'/);
  assert.match(parseRoute, /history\.replaceState/);
  const draft = source.slice(source.indexOf('function blankOsDraft()'), source.indexOf('function ensureOsDraft()'));
  for (const field of ['clienteNome', 'clienteTelefone', 'veiculoPlaca', 'veiculoDescricao']) {
    assert.ok(draft.includes(`${field}: ''`), `Campo opcional ausente no rascunho: ${field}`);
  }
  const stepOne = source.slice(source.indexOf('function osStepOne('), source.indexOf('function osStepTwo('));
  assert.match(stepOne, /Cliente \(opcional\)/);
  assert.match(stepOne, /Veículo \(opcional\)/);
  assert.match(stepOne, /Cadastrar cliente/);
  assert.match(stepOne, /Cadastrar veículo/);
  assert.match(stepOne, /name: 'clienteNome'/);
  assert.match(stepOne, /name: 'clienteTelefone'/);
  assert.match(stepOne, /name: 'veiculoPlaca'/);
  assert.match(stepOne, /name: 'veiculoDescricao'/);
  assert.doesNotMatch(stepOne, /required: true/);
  assert.doesNotMatch(stepOne, /Sem cliente não é possível abrir uma O.S./);
  assert.doesNotMatch(source, /Cliente salvo\. Agora cadastre o veículo\./);
  const orderActions = source.slice(source.indexOf('function nextOrderActions('), source.indexOf('function blankOsDraft()'));
  assert.match(orderActions, /const canSendWhatsApp = phoneLooksValid\(phone\)/);
  const review = source.slice(source.indexOf('function osStepThree('), source.indexOf('function stockView('));
  assert.match(review, /phoneLooksValid\(phone\) && draft\.itens\.length/);

  const clientModal = source.slice(source.indexOf('function openClientModal('), source.indexOf('function openVehicleModal('));
  assert.match(clientModal, /Dados adicionais \(opcional\)/);
  assert.match(clientModal, /Informe nome e telefone; o e-mail é opcional/);
  assert.match(clientModal, /label: 'Telefone \/ WhatsApp'[^\n]*required: true/);
  assert.doesNotMatch(clientModal, /label: 'E-mail'[^\n]*required: true/);
  const vehicleModal = source.slice(source.indexOf('function openVehicleModal('), source.indexOf('function openVehiclesModal('));
  assert.match(vehicleModal, /Outros dados do veículo \(opcional\)/);
  assert.match(stepOne, /<button type="button"[^>]*data-action="osNewVehicle"/);
  const clickHandler = source.slice(source.indexOf("document.addEventListener('click'"), source.indexOf("document.addEventListener('submit'"));
  assert.match(clickHandler, /trigger instanceof HTMLButtonElement\) event\.preventDefault\(\)/);
  const uiSource = readFileSync(new URL('../js/ui.js', import.meta.url), 'utf8');
  assert.match(uiSource, /dialog\.querySelector\('form\[data-form\]'\)\?\.addEventListener\('submit', \(event\) => event\.preventDefault\(\)\)/);
});

test('interface: tema claro e versões sincronizadas', () => {
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /color-scheme:\s*light/);
  assert.doesNotMatch(css, /color-scheme:\s*dark|interface escura|--bg:\s*#0b0d11/);
  assert.match(css, /--text:\s*#17202a/);

  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const manual = readFileSync(new URL('../MANUAL.md', import.meta.url), 'utf8');
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.equal(app.match(/APP_VERSION = '([^']+)'/)[1], pkg.version);
  assert.ok(manual.includes(`versão **${pkg.version}**`));
  assert.ok(manual.includes(`Versão ${pkg.version}`));
  assert.ok(readme.includes(`versão atual é **${pkg.version}**`));
});

test('util: normalização e validação de WhatsApp', () => {
  assert.equal(U.onlyDigits('(27) 99999-1010'), '27999991010');
  assert.equal(U.whatsAppNumber('(27) 99999-1010'), '5527999991010');
  assert.equal(U.whatsAppNumber('(27) 3333-4040'), '552733334040');
  assert.equal(U.whatsAppNumber('+55 (27) 99999-1010'), '5527999991010');
  assert.equal(U.whatsAppNumber('5527999991010'), '5527999991010');
  assert.equal(U.whatsAppNumber(''), '');
  assert.equal(U.whatsAppNumber('123'), '');
  assert.equal(U.whatsAppNumber('12345678901234'), '');
  assert.equal(U.phoneLooksValid('27999991010'), true);
  assert.equal(U.phoneLooksValid('2733334040'), true);
  assert.equal(U.phoneLooksValid('5527999991010'), false);
});

test('store: estado inicial e numeração', () => {
  assertEmptyData();
  assert.equal(S.peekNextOrderNumber(), 'OS-0001');
  assert.deepEqual(S.lowStockParts(), []);
  const dashboard = S.dashboardData();
  assert.equal(dashboard.openOrders, 0);
  assert.equal(dashboard.receivablesTotal, 0);
  assert.equal(dashboard.payablesTotal, 0);
  assert.equal(dashboard.receivedMonth, 0);
  assert.equal(dashboard.outcomeMonth, 0);
  assert.equal(JSON.parse(localStorage.getItem(STORAGE_KEY)).version, 1);
});

test('store: dados de exemplo e bloqueio em base não vazia', () => {
  makeSupplier();
  assert.equal(S.isStoreEmpty(), false);
  assert.throws(() => S.seedDemo(), /podem ser carregados quando o sistema ainda está vazio/);
  S.clearAll();

  S.seedDemo();
  const data = S.store.data;
  assert.equal(data.clientes.length, 3);
  assert.equal(data.veiculos.length, 3);
  assert.equal(data.fornecedores.length, 3);
  assert.equal(data.pecas.length, 7);
  assert.equal(data.ordens.length, 4);
  assert.equal(data.compras.length, 2);
  assert.equal(data.despesas.length, 2);
  assert.equal(data.meta.demo, true);
  assert.equal(data.ordens.filter((order) => order.status === 'Orçamento').length, 1);
  assert.equal(data.ordens.filter((order) => order.status === 'Aprovada').length, 1);
  assert.equal(data.ordens.filter((order) => order.status === 'Faturada').length, 2);
  assert.equal(data.pecas.find((part) => part.codigo === 'PF-330').quantidadeEstoque, 3);
  assert.equal(data.pecas.find((part) => part.codigo === 'BAT60').quantidadeEstoque, 4);
  const before = JSON.stringify(data);
  assert.throws(() => S.seedDemo(), /podem ser carregados quando o sistema ainda está vazio/);
  assert.equal(JSON.stringify(S.store.data), before);
});

test('store: CRUD de cliente e veículo', () => {
  assert.throws(() => S.saveCliente({ nome: ' ' }), /Informe o nome do cliente/);
  assert.throws(() => S.saveCliente({ nome: 'Maria Teste', telefone: ' ' }), /Informe o telefone do cliente/);
  const client = makeClient({ nome: '  Maria Teste  ' });
  assert.equal(client.nome, 'Maria Teste');
  assert.equal(S.store.data.clientes.length, 1);
  const edited = S.saveCliente({ ...client, nome: 'Maria Editada', telefone: '(27) 98888-2020' });
  assert.equal(edited.id, client.id);
  assert.equal(edited.nome, 'Maria Editada');
  assert.equal(S.store.data.clientes.length, 1);

  assert.throws(() => S.saveVeiculo({ placa: 'ABC1D23' }), /Escolha o cliente/);
  assert.throws(() => S.saveVeiculo({ clienteId: client.id }), /Informe a placa/);
  const vehicle = makeVehicle(client.id, { placa: ' abc 1d2 ', km: '128.400 km' });
  assert.equal(vehicle.placa, 'ABC1D2');
  assert.equal(vehicle.km, '128400');
  assert.equal(S.veiculosDoCliente(client.id).length, 1);
  const editedVehicle = S.saveVeiculo({ ...vehicle, modelo: 'Palio' });
  assert.equal(editedVehicle.id, vehicle.id);
  assert.equal(editedVehicle.modelo, 'Palio');
  S.deleteVeiculo(vehicle.id);
  assert.equal(S.veiculosDoCliente(client.id).length, 0);
  makeVehicle(client.id);
  S.deleteCliente(client.id);
  assert.equal(S.store.data.clientes.length, 0);
  assert.equal(S.store.data.veiculos.length, 0);
});

test('store: CRUD de fornecedor e peça', () => {
  assert.throws(() => S.saveFornecedor({ nome: '' }), /Informe o nome do fornecedor/);
  const supplier = makeSupplier();
  assert.equal(S.saveFornecedor({ ...supplier, contato: 'Carlos' }).id, supplier.id);
  assert.equal(S.store.data.fornecedores.length, 1);

  assert.throws(() => S.savePeca({ nome: '' }), /Informe o nome da peça/);
  const part = makePart({ precoCusto: 10.126, precoVenda: 20.126 });
  assert.equal(part.precoCusto, 10.13);
  assert.equal(part.precoVenda, 20.13);
  assert.equal(part.quantidadeEstoque, 10);
  assert.equal(S.store.data.movimentacoes.length, 1);
  assert.equal(S.store.data.movimentacoes[0].motivo, 'Estoque inicial');
  const edited = S.savePeca({ ...part, precoVenda: 30, quantidadeEstoque: 999 });
  assert.equal(edited.id, part.id);
  assert.equal(edited.precoVenda, 30);
  assert.equal(edited.quantidadeEstoque, 10);
  assert.equal(S.store.data.movimentacoes.length, 1);
  S.deletePeca(part.id);
  assert.equal(S.store.data.pecas.length, 0);
  assert.equal(S.store.data.movimentacoes.length, 1);
  S.deleteFornecedor(supplier.id);
  assert.equal(S.store.data.fornecedores.length, 0);
});

test('store: orçamento, totais, desconto e número único', () => {
  const { client, vehicle, part } = orderFixture();
  const initialMovements = S.store.data.movimentacoes.length;
  const order = makeOrder({ client, vehicle, part, desconto: 10 });
  assert.equal(order.numero, 'OS-0001');
  assert.equal(order.status, 'Orçamento');
  assert.equal(order.totalPecas, 200);
  assert.equal(order.totalMaoObra, 50);
  assert.equal(order.total, 240);
  assert.equal(order.estoqueBaixado, false);
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 10);
  assert.equal(S.store.data.movimentacoes.length, initialMovements);
  assert.equal(S.peekNextOrderNumber(), 'OS-0002');
  assert.throws(() => makeOrder({ client, vehicle, part, numero: 'OS-0001' }), /Já existe uma O.S./);
  assert.equal(S.store.data.ordens.length, 1);
  const edited = S.saveOrder({ ...order, desconto: 20 });
  assert.equal(edited.total, 230);
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 10);
});

test('store: O.S. pode ser salva sem cliente e veículo', () => {
  const part = makePart();
  const order = S.saveOrder({
    status: 'Aprovada',
    problemaRelatado: 'Revisão solicitada no balcão',
    itens: [{ tipo: 'peca', pecaId: part.id, descricao: part.nome, quantidade: 1, valorUnitario: 100 }]
  });
  assert.equal(order.clienteId, '');
  assert.equal(order.clienteNome, '');
  assert.equal(order.veiculoId, '');
  assert.equal(order.veiculoPlaca, '');
  assert.equal(order.estoqueBaixado, true);
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 9);
  assert.match(S.store.data.movimentacoes[0].referencia, /Cliente não informado/);
  S.deleteOrder(order.id);
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 10);
});

test('store: O.S. guarda identificação simples sem cadastro', () => {
  const order = S.saveOrder({
    clienteNome: 'Maria do Balcão',
    clienteTelefone: '(27) 99999-1010',
    veiculoPlaca: 'abc1d23',
    veiculoDescricao: 'Volkswagen Gol',
    itens: [{ tipo: 'mao_obra', descricao: 'Diagnóstico', quantidade: 1, valorUnitario: 80 }]
  });
  assert.equal(order.clienteId, '');
  assert.equal(order.veiculoId, '');
  assert.equal(order.clienteNome, 'Maria do Balcão');
  assert.equal(order.veiculoPlaca, 'ABC1D23');
  assert.equal(S.clientePhone(order), '(27) 99999-1010');
  assert.equal(S.store.data.clientes.length, 0);
  assert.equal(S.store.data.veiculos.length, 0);
});

test('store: telefone salvo na O.S. tem prioridade sobre o cadastro', () => {
  const client = makeClient({ telefone: '(27) 99999-1010' });
  const order = S.saveOrder({
    clienteId: client.id,
    clienteNome: client.nome,
    clienteTelefone: '(27) 98888-2020',
    itens: [{ tipo: 'mao_obra', descricao: 'Diagnóstico', quantidade: 1, valorUnitario: 80 }]
  });
  assert.equal(S.clientePhone(order), '(27) 98888-2020');
  S.saveCliente({ ...client, telefone: '(27) 97777-3030' });
  assert.equal(S.clientePhone(order), '(27) 98888-2020');
  const legacyOrder = S.saveOrder({
    clienteId: client.id,
    clienteNome: client.nome,
    itens: [{ tipo: 'mao_obra', descricao: 'Revisão', quantidade: 1, valorUnitario: 90 }]
  });
  assert.equal(S.clientePhone(legacyOrder), '(27) 97777-3030');
});

test('store: aprovação e faturamento baixam estoque uma vez', () => {
  const { client, vehicle, part } = orderFixture();
  const initialMovements = S.store.data.movimentacoes.length;
  let order = makeOrder({ client, vehicle, part });
  order = S.setOrderStatus(order.id, 'Aprovada');
  assert.equal(order.estoqueBaixado, true);
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 8);
  assert.equal(S.store.data.movimentacoes.length, initialMovements + 1);
  assert.match(S.store.data.movimentacoes[0].motivo, /Baixa automática/);

  order = S.setOrderStatus(order.id, 'Faturada');
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 8);
  assert.equal(S.store.data.movimentacoes.length, initialMovements + 1);
  assert.equal(order.dataFaturamento, U.todayISO());
  order = S.saveOrder({ ...order, status: 'Faturada' });
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 8);
  assert.equal(S.store.data.movimentacoes.length, initialMovements + 1);

  order = S.markOrderPaid(order.id);
  assert.equal(order.pago, true);
  assert.equal(order.dataPagamento, U.todayISO());
  const paymentDate = order.dataPagamento;
  S.markOrderPaid(order.id);
  assert.equal(S.ordemById(order.id).dataPagamento, paymentDate);
  order = S.markOrderPaid(order.id, false);
  assert.equal(order.pago, false);
  assert.equal(order.dataPagamento, '');
  assert.equal(S.financeData().receivables.length, 1);
});

test('store: aprovação direta soma linhas da mesma peça antes de baixar estoque', () => {
  const client = makeClient();
  const vehicle = makeVehicle(client.id);
  const part = makePart({ quantidadeEstoque: 3 });
  const items = [
    { tipo: 'peca', pecaId: part.id, descricao: part.nome, quantidade: 2, valorUnitario: 100 },
    { tipo: 'peca', pecaId: part.id, descricao: part.nome, quantidade: 2, valorUnitario: 100 }
  ];
  const before = JSON.stringify(S.store.data);
  assert.throws(() => makeOrder({ client, vehicle, part, status: 'Aprovada', items }), /Estoque insuficiente/);
  assert.equal(JSON.stringify(S.store.data), before);
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 3);
  assert.equal(S.store.data.ordens.length, 0);

  const order = makeOrder({ client, vehicle, part, items });
  assert.throws(() => S.setOrderStatus(order.id, 'Aprovada'), /Estoque insuficiente/);
  assert.equal(S.ordemById(order.id).status, 'Orçamento');
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 3);
});

test('store: cancelar, reabrir e excluir restauram estoque', () => {
  const first = orderFixture();
  const initialMovements = S.store.data.movimentacoes.length;
  let order = makeOrder({ client: first.client, vehicle: first.vehicle, part: first.part });
  S.setOrderStatus(order.id, 'Aprovada');
  assert.equal(S.pecaById(first.part.id).quantidadeEstoque, 8);
  order = S.setOrderStatus(order.id, 'Cancelada');
  assert.equal(order.estoqueBaixado, false);
  assert.equal(S.pecaById(first.part.id).quantidadeEstoque, 10);
  assert.equal(S.store.data.movimentacoes.length, initialMovements + 2);
  assert.match(S.store.data.movimentacoes[0].motivo, /Estorno de estoque/);
  order = S.setOrderStatus(order.id, 'Orçamento');
  assert.equal(S.pecaById(first.part.id).quantidadeEstoque, 10);
  S.setOrderStatus(order.id, 'Aprovada');
  assert.equal(S.pecaById(first.part.id).quantidadeEstoque, 8);
  S.deleteOrder(order.id);
  assert.equal(S.pecaById(first.part.id).quantidadeEstoque, 10);
  assert.equal(S.store.data.ordens.length, 0);

  const second = orderFixture();
  const billed = makeOrder({ client: second.client, vehicle: second.vehicle, part: second.part, status: 'Faturada' });
  assert.equal(S.pecaById(second.part.id).quantidadeEstoque, 8);
  S.deleteOrder(billed.id);
  assert.equal(S.pecaById(second.part.id).quantidadeEstoque, 10);
});

test('store: edição de itens reconcilia baixa e estorno', () => {
  const { client, vehicle, part } = orderFixture();
  const initialMovements = S.store.data.movimentacoes.length;
  let order = makeOrder({ client, vehicle, part });
  S.setOrderStatus(order.id, 'Aprovada');
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 8);
  order = S.saveOrder({
    ...order,
    itens: [
      { tipo: 'peca', pecaId: part.id, descricao: part.nome, quantidade: 3, valorUnitario: 100 },
      { tipo: 'mao_obra', descricao: 'Serviço de teste', quantidade: 1, valorUnitario: 50 }
    ]
  });
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 7);
  assert.equal(S.store.data.movimentacoes.length, initialMovements + 3);
  assert.equal(S.store.data.movimentacoes[0].motivo.includes('Baixa automática'), true);
  assert.equal(S.store.data.movimentacoes[1].motivo.includes('Estorno de estoque'), true);
  S.saveOrder({ ...order });
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 7);
  assert.equal(S.store.data.movimentacoes.length, initialMovements + 3);
  S.setOrderStatus(order.id, 'Cancelada');
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 10);
});

test('store: movimentação manual e alerta de estoque mínimo', () => {
  const part = makePart({ quantidadeEstoque: 5, estoqueMinimo: 2 });
  const entry = S.adjustStock({ pecaId: part.id, tipo: 'Entrada', quantidade: 3, motivo: 'Contagem de inventário', data: '2026-11-22' });
  assert.equal(entry.saldoAnterior, 5);
  assert.equal(entry.saldoNovo, 8);
  assert.equal(entry.data, '2026-11-22T12:00:00');
  const beforeExit = JSON.stringify(S.store.data);
  assert.throws(() => S.adjustStock({ pecaId: part.id, tipo: 'Saída', quantidade: 10, referencia: 'Ajuste de teste' }), /Estoque insuficiente/);
  assert.equal(JSON.stringify(S.store.data), beforeExit);
  const exit = S.adjustStock({ pecaId: part.id, tipo: 'Saída', quantidade: 8, referencia: 'Ajuste de teste' });
  assert.equal(exit.saldoNovo, 0);
  assert.equal(S.lowStockParts().map((item) => item.id).includes(part.id), true);
  const movementCount = S.store.data.movimentacoes.length;
  assert.throws(() => S.adjustStock({ pecaId: part.id, tipo: 'Entrada', quantidade: 0 }), /quantidade maior que zero/);
  assert.equal(S.store.data.movimentacoes.length, movementCount);
});

test('store: compra entra no estoque e exclusão reverte', () => {
  const supplier = makeSupplier();
  const part = makePart();
  const purchase = S.createCompra({
    fornecedorId: supplier.id,
    fornecedorNome: supplier.nome,
    numeroNota: '1234',
    data: U.todayISO(),
    dataVencimento: U.todayISO(),
    statusPagamento: 'Pendente',
    itens: [{ pecaId: part.id, pecaNome: part.nome, quantidade: 4, valorUnitario: 25 }]
  });
  assert.equal(purchase.total, 100);
  assert.equal(purchase.estoqueRegistrado, true);
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 14);
  assert.equal(S.store.data.movimentacoes.length, 2);
  assert.match(S.store.data.movimentacoes[0].referencia, /NF 1234/);
  S.updateCompraMeta(purchase.id, { numeroNota: '5678', statusPagamento: 'Pago', dataPagamento: U.todayISO() });
  assert.equal(S.compraById(purchase.id).statusPagamento, 'Pago');
  S.markCompraPaid(purchase.id, false);
  assert.equal(S.compraById(purchase.id).dataPagamento, '');
  S.markCompraPaid(purchase.id);
  assert.equal(S.compraById(purchase.id).dataPagamento, U.todayISO());
  S.deleteCompra(purchase.id);
  assert.equal(S.store.data.compras.length, 0);
  assert.equal(S.pecaById(part.id).quantidadeEstoque, 10);
  assert.match(S.store.data.movimentacoes[0].motivo, /Estorno de compra/);

  const newPurchase = S.createCompra({
    fornecedorNome: supplier.nome,
    itens: [{ pecaNome: 'Peça Nova da Compra', quantidade: 2, valorUnitario: 15 }]
  });
  const newPart = S.pecaById(newPurchase.itens[0].pecaId);
  assert.equal(newPart.quantidadeEstoque, 2);
  S.deleteCompra(newPurchase.id);
  assert.equal(S.pecaById(newPart.id).quantidadeEstoque, 0);
});

test('store: despesa, pagamento, reabertura e exclusão', () => {
  assert.throws(() => S.saveDespesa({ descricao: '' }), /Informe a descrição da despesa/);
  let expense = S.saveDespesa({
    descricao: 'Conta de energia',
    categoria: 'Energia',
    valor: 123.456,
    data: U.todayISO(),
    dataVencimento: U.todayISO(),
    status: 'Pendente',
    formaPagamento: 'Boleto'
  });
  assert.equal(expense.valor, 123.46);
  assert.equal(expense.status, 'Pendente');
  expense = S.saveDespesa({ ...expense, descricao: 'Conta de energia editada', categoria: 'Energia' });
  assert.equal(expense.descricao, 'Conta de energia editada');
  expense = S.markDespesaPaid(expense.id);
  assert.equal(expense.status, 'Pago');
  assert.equal(expense.dataPagamento, U.todayISO());
  expense = S.saveDespesa({ ...expense, dataPagamento: monthDate(-1) });
  assert.equal(expense.dataPagamento, monthDate(-1));
  expense = S.markDespesaPaid(expense.id, false);
  assert.equal(expense.status, 'Pendente');
  assert.equal(expense.dataPagamento, '');
  expense = S.saveDespesa({ ...expense, status: 'Pago', dataPagamento: monthDate(-1) });
  assert.equal(expense.dataPagamento, monthDate(-1));
  S.deleteDespesa(expense.id);
  assert.equal(S.store.data.despesas.length, 0);
});

test('store: financeiro e painel agregam recebíveis e pagáveis', () => {
  const { client, vehicle, part } = orderFixture();
  makeOrder({ client, vehicle, part, status: 'Faturada', pago: true, items: [{ tipo: 'mao_obra', descricao: 'Serviço recebido', quantidade: 1, valorUnitario: 150 }] });
  makeOrder({ client, vehicle, part, status: 'Faturada', items: [{ tipo: 'mao_obra', descricao: 'Serviço pendente', quantidade: 1, valorUnitario: 50 }] });
  S.createCompra({
    fornecedorNome: 'Fornecedor A',
    statusPagamento: 'Pago',
    dataPagamento: U.todayISO(),
    itens: [{ pecaId: part.id, quantidade: 1, valorUnitario: 100 }]
  });
  S.createCompra({
    fornecedorNome: 'Fornecedor B',
    statusPagamento: 'Pendente',
    itens: [{ pecaId: part.id, quantidade: 1, valorUnitario: 40 }]
  });
  S.saveDespesa({ descricao: 'Despesa paga', valor: 30, status: 'Pago', dataPagamento: U.todayISO() });
  S.saveDespesa({ descricao: 'Despesa pendente', valor: 20, status: 'Pendente' });

  const finance = S.financeData();
  assert.equal(finance.receivables.length, 1);
  assert.equal(finance.receivablesTotal, 50);
  assert.equal(finance.pendingPurchases.length, 1);
  assert.equal(finance.purchasesPendingTotal, 40);
  assert.equal(finance.pendingExpenses.length, 1);
  assert.equal(finance.expensesPendingTotal, 20);
  assert.equal(finance.receivedMonth, 150);
  assert.equal(finance.paidPurchasesMonth, 100);
  assert.equal(finance.paidExpensesMonth, 30);
  assert.equal(finance.outcomeMonth, 20);

  const dashboard = S.dashboardData();
  assert.equal(dashboard.receivablesTotal, 50);
  assert.equal(dashboard.payablesCount, 2);
  assert.equal(dashboard.payablesTotal, 60);
  assert.equal(dashboard.receivedMonth, 150);
  assert.equal(dashboard.outcomeMonth, 20);
  assert.equal(S.sidebarCounts().pendingBills, 2);
});

test('store: data de pagamento determina o mês do caixa', () => {
  const { client, vehicle, part } = orderFixture();
  const currentMonth = monthDate(0);
  const previousMonth = monthDate(-1);

  const previousOrder = makeOrder({ client, vehicle, part, status: 'Faturada', pago: true, dataAbertura: currentMonth, items: [{ tipo: 'mao_obra', descricao: 'Recebimento mês anterior', quantidade: 1, valorUnitario: 90 }] });
  previousOrder.dataPagamento = previousMonth;
  S.save();
  makeOrder({ client, vehicle, part, status: 'Faturada', items: [{ tipo: 'mao_obra', descricao: 'Recebimento mês atual', quantidade: 1, valorUnitario: 25 }] });
  S.markOrderPaid(S.store.data.ordens[0].id);

  S.createCompra({
    fornecedorNome: 'Fornecedor',
    data: currentMonth,
    statusPagamento: 'Pago',
    dataPagamento: previousMonth,
    itens: [{ pecaId: part.id, quantidade: 1, valorUnitario: 100 }]
  });
  S.saveDespesa({ descricao: 'Despesa do mês anterior', valor: 30, data: currentMonth, status: 'Pago', dataPagamento: previousMonth });

  const finance = S.financeData();
  assert.equal(finance.receivedMonth, 25);
  assert.equal(finance.paidPurchasesMonth, 0);
  assert.equal(finance.paidExpensesMonth, 0);
  assert.equal(finance.outcomeMonth, 25);
  assert.equal(finance.receivables.length, 0);
});

test('store: exportação e importação preservam os dados', () => {
  const { client, vehicle, part } = orderFixture();
  makeOrder({ client, vehicle, part, status: 'Aprovada' });
  S.createCompra({ fornecedorNome: 'Fornecedor', itens: [{ pecaId: part.id, quantidade: 1, valorUnitario: 25 }] });
  S.saveDespesa({ descricao: 'Aluguel', valor: 500, status: 'Pendente' });

  const raw = S.exportPayload();
  const payload = JSON.parse(raw);
  assert.equal(payload.app, 'Franlin Car Veículos');
  assert.equal(payload.format, 'fcv-backup');
  assert.equal(Number.isNaN(Date.parse(payload.exportedAt)), false);
  assert.notEqual(S.store.data.meta.lastBackupAt, '');
  const snapshot = JSON.parse(JSON.stringify(S.store.data));
  S.clearAll();
  assertEmptyData();
  S.importPayload(raw);
  assert.deepEqual(S.store.data, snapshot);
  assert.deepEqual(S.reload(), snapshot);
  assert.equal(JSON.parse(localStorage.getItem(STORAGE_KEY)).data, undefined);
  assert.equal(JSON.parse(localStorage.getItem(STORAGE_KEY)).clientes.length, 1);
});

test('store: falha de gravação desfaz alterações em memória e no estoque', () => {
  const { client, vehicle, part } = orderFixture();
  const order = makeOrder({ client, vehicle, part });
  const before = JSON.parse(JSON.stringify(S.store.data));
  const rawBefore = localStorage.getItem(STORAGE_KEY);
  const originalSetItem = localStorage.setItem;
  const originalError = console.error;
  localStorage.setItem = () => { throw new Error('Quota excedida'); };
  console.error = () => {};
  try {
    assert.throws(() => S.saveCliente({ nome: 'Cliente não salvo', telefone: '(27) 99999-1010' }), /Não foi possível salvar/);
    assert.deepEqual(S.store.data, before);
    assert.throws(() => S.adjustStock({ pecaId: part.id, tipo: 'Entrada', quantidade: 2 }), /Não foi possível salvar/);
    assert.deepEqual(S.store.data, before);
    assert.throws(() => S.setOrderStatus(order.id, 'Aprovada'), /Não foi possível salvar/);
    assert.deepEqual(S.store.data, before);
    assert.equal(localStorage.getItem(STORAGE_KEY), rawBefore);
  } finally {
    localStorage.setItem = originalSetItem;
    console.error = originalError;
  }
});

test('store: exportação continua disponível quando o armazenamento está cheio', () => {
  makeClient({ nome: 'Cliente da cópia' });
  const before = JSON.parse(JSON.stringify(S.store.data));
  const originalSetItem = localStorage.setItem;
  const originalError = console.error;
  localStorage.setItem = () => { throw new Error('Quota excedida'); };
  console.error = () => {};
  try {
    const payload = JSON.parse(S.exportPayload());
    assert.equal(payload.format, 'fcv-backup');
    assert.deepEqual(payload.data, before);
    assert.deepEqual(S.store.data, before);
  } finally {
    localStorage.setItem = originalSetItem;
    console.error = originalError;
  }
});

test('store: JSON corrompido é preservado e só pode ser substituído por recuperação explícita', async () => {
  makeClient({ nome: 'Cliente recuperado' });
  const backup = S.exportPayload();
  const corrupted = '{"clientes": [';
  const originalError = console.error;
  console.error = () => {};
  try {
    localStorage.setItem(STORAGE_KEY, corrupted);
    const Corrupt = await import('../js/store.js?corrupt-storage-test');
    assert.match(Corrupt.storageWarning(), /corrompidos/);
    assert.throws(() => Corrupt.saveCliente({ nome: 'Não deve substituir', telefone: '(27) 99999-1010' }), /corrompidos/);
    assert.equal(localStorage.getItem(STORAGE_KEY), corrupted);
    assert.equal(Corrupt.store.data.clientes.length, 0);
    Corrupt.importPayload(backup);
    assert.equal(Corrupt.storageWarning(), '');
    assert.equal(Corrupt.store.data.clientes.length, 1);
    assert.equal(JSON.parse(localStorage.getItem(STORAGE_KEY)).clientes.length, 1);

    const incomplete = '{"clientes":[]}';
    localStorage.setItem(STORAGE_KEY, incomplete);
    const Incomplete = await import('../js/store.js?incomplete-storage-test');
    assert.match(Incomplete.storageWarning(), /corrompidos/);
    assert.equal(localStorage.getItem(STORAGE_KEY), incomplete);
  } finally {
    console.error = originalError;
  }
});

test('store: carregar exemplo é atômico se uma gravação intermediária falhar', () => {
  const before = JSON.parse(JSON.stringify(S.store.data));
  const rawBefore = localStorage.getItem(STORAGE_KEY);
  const originalSetItem = localStorage.setItem;
  const originalError = console.error;
  let writes = 0;
  localStorage.setItem = (key, value) => {
    writes += 1;
    if (writes === 5) throw new Error('Quota excedida');
    originalSetItem.call(localStorage, key, value);
  };
  console.error = () => {};
  try {
    assert.throws(() => S.seedDemo(), /Não foi possível salvar/);
    assert.deepEqual(S.store.data, before);
    assert.equal(localStorage.getItem(STORAGE_KEY), rawBefore);
  } finally {
    localStorage.setItem = originalSetItem;
    console.error = originalError;
  }
});

test('store: importação inválida é rejeitada sem substituir dados', () => {
  const client = makeClient();
  const before = JSON.stringify(S.store.data);
  const malformed = ['{', '{}', '[]', '{"clientes":"inválido"}', '{"data":null}', '{"outro":[]}'];
  for (const raw of malformed) {
    assert.throws(() => S.importPayload(raw), /cópia de segurança válida|não contém dados do sistema/);
    assert.equal(JSON.stringify(S.store.data), before);
    assert.equal(S.clienteById(client.id).nome, client.nome);
  }
});

test('store: alteração de outra aba é lida por reload', () => {
  const client = makeClient({ nome: 'Cliente original' });
  const external = JSON.parse(localStorage.getItem(STORAGE_KEY));
  external.clientes[0].nome = 'Cliente atualizado na outra aba';
  external.clientes.push({ ...external.clientes[0], id: 'cli-outra-aba', nome: 'Cliente novo da outra aba' });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(external));

  assert.equal(S.clienteById(client.id).nome, 'Cliente original');
  assert.equal(S.store.data.clientes.length, 1);
  S.reload();
  assert.equal(S.clienteById(client.id).nome, 'Cliente atualizado na outra aba');
  assert.equal(S.store.data.clientes.length, 2);

  localStorage.removeItem(STORAGE_KEY);
  assert.equal(S.store.data.clientes.length, 2);
  S.reload();
  assertEmptyData();
});

test('store: limpeza remove todos os registros', () => {
  const { client, vehicle, part } = orderFixture();
  makeOrder({ client, vehicle, part, status: 'Faturada', pago: true });
  makeSupplier();
  S.createCompra({ fornecedorNome: 'Fornecedor', itens: [{ pecaId: part.id, quantidade: 1, valorUnitario: 25 }] });
  S.saveDespesa({ descricao: 'Energia', valor: 100, status: 'Pago' });
  S.clearAll();
  assertEmptyData();
  assert.deepEqual(S.reload(), S.store.data);
  assert.equal(JSON.parse(localStorage.getItem(STORAGE_KEY)).ordens.length, 0);
});

let passed = 0;
let failed = 0;
for (const { name, run } of tests) {
  try {
    resetState();
    await run();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(error?.stack || error);
  }
}

console.log(`\n${passed}/${tests.length} testes passaram.`);
if (failed > 0) process.exitCode = 1;
