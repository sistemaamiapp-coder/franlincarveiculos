import { escapeHtml, slugify, money, fmtDate, initials } from './util.js';

const ICONS = {
  painel: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  os: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/>',
  estoque: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  compras: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  despesas: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  caixa: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  clientes: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  fornecedores: '<path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  ajuda: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4"/><path d="M12 17h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  alerta: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  chave: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.1-2.1 2.4-2.2Z"/>',
  carro: '<path d="M5 17h14M6.5 17a2 2 0 1 0 0 .01M17.5 17a2 2 0 1 0 0 .01"/><path d="M3 13.5 5 8a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5.5V17H3v-3.5Z"/><path d="M5 13h14"/>',
  imprimir: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  lixeira: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  editar: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  voltar: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  avancar: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  subir: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
  banco: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  mensagem: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
  calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  telefone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>',
  whatsapp: '<path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.3 4.8 4.9-1.3A9.9 9.9 0 1 0 12.04 2Zm5.8 14.1c-.25.7-1.45 1.35-2 1.4-.55.1-1.05.25-3.45-.75-2.9-1.2-4.75-4.2-4.9-4.4-.15-.2-1.2-1.6-1.2-3.05 0-1.45.75-2.15 1.05-2.45.3-.3.65-.35.85-.35h.6c.2 0 .45-.05.7.55.25.6.85 2.1.95 2.25.1.15.15.35.05.55-.1.2-.15.35-.3.55-.15.2-.3.45-.45.6-.15.15-.3.3-.15.6.15.3.7 1.15 1.5 1.85 1.05.9 1.9 1.2 2.2 1.35.3.15.45.1.65-.05.2-.15.75-.85.95-1.15.2-.3.4-.25.65-.15.25.1 1.65.8 1.95.95.3.15.5.2.55.3.05.1.05.6-.2 1.3Z"/>',
  externo: '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  seta: '<path d="m6 9 6 6 6-6"/>',
  filtro: '<path d="M22 3H2l8 9.5V19l4 2v-8.5Z"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  escudo: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  copiar: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  menos: '<path d="M5 12h14"/>',
  freio: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
  gota: '<path d="M12 2s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  raio: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>'
};

const FILLED_ICONS = new Set(['whatsapp']);

export function icon(name, className = 'icon') {
  const body = ICONS[name] || ICONS.info;
  if (FILLED_ICONS.has(name)) {
    return `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${body}</svg>`;
  }
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export function brandMark(compact = false) {
  return `
    <span class="brand-symbol" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="13" fill="#145cc4"/>
        <path d="M10 29.5 12.4 23a4 4 0 0 1 3.7-2.6h15.8A4 4 0 0 1 35.6 23l2.4 6.5V35h-4.2a3.6 3.6 0 0 1-7.2 0H21.4a3.6 3.6 0 0 1-7.2 0H10v-5.5Z" fill="#fff"/>
        <path d="M15.5 26.5h17M22 20.4h4" stroke="#145cc4" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="17.8" cy="32.4" r="1.5" fill="#145cc4"/>
        <circle cx="32.2" cy="32.4" r="1.5" fill="#145cc4"/>
      </svg>
    </span>
    ${compact ? '' : `<span class="brand-copy">
      <strong>FRANLIN <span>CAR</span></strong>
      <small>VEÍCULOS · OFICINA</small>
    </span>`}
  `;
}

export const NAV_GROUPS = [
  {
    label: 'Atendimento',
    items: [
      { key: 'ordens', label: 'Ordens de serviço', href: '#/ordens', icon: 'os', badge: 'openOrders' }
    ]
  },
  {
    label: 'Loja',
    items: [
      { key: 'estoque', label: 'Estoque', href: '#/estoque', icon: 'estoque', badge: 'stockAlerts' }
    ]
  }
];

function navActive(path, href) {
  const route = href.replace(/^#/, '') || '/';
  if (route === '/') return path === '/';
  return path === route || path.startsWith(`${route}/`);
}

function syncPresentation(sync) {
  const status = sync?.status || 'offline';
  const labels = {
    synced: ['Sincronizado', 'Dados salvos na nuvem e neste dispositivo.'],
    syncing: ['Sincronizando', 'Enviando ou recebendo alterações.'],
    offline: ['Offline', 'Alterações ficam guardadas neste dispositivo.'],
    error: ['Falha na sincronização', sync?.message || 'Tente novamente quando houver conexão.'],
    auth: ['Sessão expirada', 'Entre novamente para continuar usando os dados da oficina.'],
    conflict: ['Conflito de dados', 'Escolha qual versão deve ser mantida.'],
    pending: ['Migração pendente', 'Escolha como importar os dados deste computador.'],
    idle: ['Conectando', 'Verificando os dados da nuvem.']
  };
  const [label, text] = labels[status] || labels.idle;
  return { label, text };
}

export function syncBadge(sync) {
  const status = sync?.status || 'offline';
  return `<span class="sync-badge sync-${escapeHtml(status)}" title="${escapeHtml(syncPresentation(sync).text)}"><span class="sync-dot" aria-hidden="true"></span>${escapeHtml(syncPresentation(sync).label)}${sync?.pending ? ' · pendente' : ''}</span>`;
}

export function shell({ path, counts = {}, content, fontLabel = 'Normal', sync = null }) {
  const nav = NAV_GROUPS.map((group) => `
    <div class="nav-group">
      <p class="nav-label">${escapeHtml(group.label)}</p>
      ${group.items.map((item) => {
        const badge = item.badge ? Number(counts[item.badge] || 0) : 0;
        return `
          <a class="nav-link ${navActive(path, item.href) ? 'is-active' : ''}" href="${item.href}" ${navActive(path, item.href) ? 'aria-current="page"' : ''}>
            ${icon(item.icon, 'nav-icon')}
            <span class="nav-text">${escapeHtml(item.label)}</span>
            ${badge > 0 ? `<span class="nav-badge" aria-label="${badge} pendente(s)">${badge > 99 ? '99+' : badge}</span>` : ''}
          </a>
        `;
      }).join('')}
    </div>
  `).join('');

  return `
    <div class="app-shell">
      <div class="sidebar-scrim" data-action="closeMenu"></div>
      <aside class="sidebar" id="sidebar" aria-label="Menu principal">
        <div class="sidebar-top">
          <a class="brand" href="#/ordens" aria-label="Franlin Car Veículos — ir para ordens de serviço">${brandMark()}</a>
          <button class="icon-button sidebar-close" data-action="closeMenu" aria-label="Fechar menu">${icon('x')}</button>
        </div>
        <a class="btn btn-primary btn-new-os" href="#/ordens/nova">${icon('plus')}<span>Nova O.S.</span></a>
        <nav class="nav">${nav}</nav>
        <div class="sidebar-foot">
          <a class="nav-link nav-help" href="#/ajuda">${icon('ajuda', 'nav-icon')}<span class="nav-text">Ajuda e manual</span></a>
          <div class="sidebar-cloud">
            ${syncBadge(sync)}
            <p>${escapeHtml(syncPresentation(sync).text)}</p>
          </div>
        </div>
      </aside>
      <div class="app-main">
        <header class="topbar">
          <button class="icon-button menu-button" data-action="toggleMenu" aria-label="Abrir menu" aria-controls="sidebar" aria-expanded="false">${icon('menu')}</button>
          <a class="topbar-brand" href="#/ordens">${brandMark(true)}<span>Franlin Car Veículos</span></a>
          <div class="topbar-actions">
            ${sync ? `<div class="account-area">
              ${syncBadge(sync)}
              <div class="account-copy"><span>Conta conectada</span><strong title="${escapeHtml(sync.user?.email || '')}">${escapeHtml(sync.user?.email || '')}</strong></div>
              <button type="button" class="btn btn-small btn-secondary" data-action="signOut">Sair</button>
            </div>` : ''}
            <div class="font-control" role="group" aria-label="Tamanho da letra">
              <span class="font-label">Letra</span>
              <button type="button" class="font-btn" data-action="fontDown" aria-label="Diminuir letra">A−</button>
              <span class="font-current" aria-live="polite">${escapeHtml(fontLabel)}</span>
              <button type="button" class="font-btn" data-action="fontUp" aria-label="Aumentar letra">A+</button>
            </div>
          </div>
        </header>
        <main class="content" id="conteudo" tabindex="-1">
          ${content}
          <p class="content-foot">Franlin Car Veículos · sistema de gestão da oficina</p>
        </main>
      </div>
    </div>
  `;
}

export function pageHead({ title, subtitle = '', help = '', actions = '' }) {
  return `
    <header class="page-head">
      <div class="page-head-copy">
        <div class="page-head-title-row">
          <h1>${escapeHtml(title)}</h1>
          ${help ? `<a class="help-link" href="#/ajuda/${escapeHtml(help)}">${icon('ajuda')}<span>Como usar</span></a>` : ''}
        </div>
        ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
      </div>
      ${actions ? `<div class="page-head-actions">${actions}</div>` : ''}
    </header>
  `;
}

export function authView({ mode = 'login', error = '', email = '', configured = true }) {
  const titles = { login: 'Entrar na sua conta', signup: 'Criar sua conta', recover: 'Recuperar a senha' };
  const subtitles = {
    login: 'Use o mesmo e-mail e senha em qualquer computador para acessar os dados da oficina.',
    signup: 'Crie uma conta para guardar os dados da oficina com segurança na nuvem.',
    recover: 'Informe o e-mail da conta. Enviaremos um link para definir uma nova senha.'
  };
  return `
    <main class="auth-page">
      <section class="auth-card" aria-labelledby="auth-title">
        <div class="auth-brand">${brandMark()}</div>
        <span class="eyebrow">Franlin Car Veículos</span>
        <h1 id="auth-title">${titles[mode]}</h1>
        <p class="auth-subtitle">${subtitles[mode]}</p>
        ${!configured ? '<div class="notice notice-warning">A conexão com a nuvem ainda não foi configurada pelo administrador do sistema.</div>' : ''}
        ${error ? `<div class="notice notice-error" role="alert">${escapeHtml(error)}</div>` : ''}
        <form class="form-grid auth-form" data-auth="${mode}">
          ${field({ label: 'E-mail', name: 'email', value: email, type: 'email', required: true, span: 2, placeholder: 'voce@exemplo.com', attrs: 'autocomplete="email"' })}
          ${mode !== 'recover' ? field({ label: 'Senha', name: 'password', type: 'password', required: true, span: 2, placeholder: 'Sua senha', attrs: `autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" minlength="6"` }) : ''}
          ${mode === 'signup' ? field({ label: 'Repita a senha', name: 'passwordConfirm', type: 'password', required: true, span: 2, placeholder: 'Repita a senha', attrs: 'autocomplete="new-password" minlength="6"' }) : ''}
          <div class="form-actions field-span2">
            <button class="btn btn-primary" type="submit">${mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link de recuperação'}</button>
          </div>
        </form>
        <div class="auth-links">
          ${mode === 'login' ? `<button type="button" class="link-button" data-action="authMode" data-mode="signup">Criar conta</button><button type="button" class="link-button" data-action="authMode" data-mode="recover">Esqueci minha senha</button>` : ''}
          ${mode !== 'login' ? '<button type="button" class="link-button" data-action="authMode" data-mode="login">Voltar para entrar</button>' : ''}
        </div>
        <p class="auth-foot">Seus dados ficam associados somente a esta conta. Não compartilhe sua senha.</p>
      </section>
    </main>
  `;
}

export function migrationView({ migration }) {
  const local = migration?.local;
  const remote = migration?.remote;
  const count = (data) => ['ordens', 'clientes', 'veiculos'].reduce((total, key) => total + (data?.[key]?.length || 0), 0);
  return `
    <main class="gate-page">
      <section class="gate-card">
        <span class="gate-icon">${icon('banco')}</span>
        <span class="eyebrow">Dados encontrados</span>
        <h1>Escolha quais dados usar</h1>
        <p>Este computador tem dados da versão anterior${remote ? ' e sua conta também tem dados na nuvem' : ''}. Para não apagar nada sem confirmação, escolha uma opção.</p>
        <div class="gate-options">
          <article><span class="eyebrow">Nuvem</span><h2>${remote ? `${count(remote.state)} registros` : 'Conta vazia'}</h2><p>${remote ? 'Manter somente os dados que já estão na nuvem.' : 'Começar uma conta vazia na nuvem.'}</p><button type="button" class="btn btn-primary" data-action="resolveCloud">Usar dados da nuvem</button></article>
          <article><span class="eyebrow">Este computador</span><h2>${count(local)} registros</h2><p>Enviar os dados locais para a nuvem. A versão anterior da nuvem será arquivada no servidor.</p><button type="button" class="btn btn-primary" data-action="resolveDevice">Usar dados deste computador</button></article>
        </div>
        <p class="gate-note">Nenhuma opção será aplicada até você confirmar.</p>
      </section>
    </main>
  `;
}

export function conflictView({ conflict }) {
  const count = (data) => ['ordens', 'clientes', 'veiculos', 'movimentacoes'].reduce((total, key) => total + (data?.[key]?.length || 0), 0);
  return `
    <main class="gate-page">
      <section class="gate-card">
        <span class="gate-icon gate-warning">${icon('alerta')}</span>
        <span class="eyebrow">Alterações ao mesmo tempo</span>
        <h1>Resolva o conflito de dados</h1>
        <p>Este dispositivo e a nuvem têm versões diferentes. As alterações estão bloqueadas para evitar perda de ordens, estoque ou pagamentos.</p>
        <div class="gate-options">
          <article><span class="eyebrow">Nuvem · revisão ${escapeHtml(conflict.remoteRevision)}</span><h2>${count(conflict.remote)} registros</h2><p>Descartar a versão pendente deste dispositivo e usar a versão mais recente da nuvem.</p><button type="button" class="btn btn-primary" data-action="resolveCloud">Usar dados da nuvem</button></article>
          <article><span class="eyebrow">Este dispositivo · revisão ${escapeHtml(conflict.localRevision)}</span><h2>${count(conflict.local)} registros</h2><p>Enviar a versão deste dispositivo. A versão atual da nuvem será arquivada no servidor.</p><button type="button" class="btn btn-primary" data-action="resolveDevice">Usar dados deste computador</button></article>
        </div>
        <p class="gate-note">Não há escolha automática. Revise as cópias de segurança se precisar comparar os dados.</p>
      </section>
    </main>
  `;
}

export function statCard({ label, value, hint = '', tone = 'neutral', iconName = 'info' }) {
  return `
    <article class="stat-card tone-${escapeHtml(tone)}">
      <span class="stat-icon">${icon(iconName)}</span>
      <div class="stat-copy">
        <p class="stat-label">${escapeHtml(label)}</p>
        <p class="stat-value">${escapeHtml(value)}</p>
        ${hint ? `<p class="stat-hint">${escapeHtml(hint)}</p>` : ''}
      </div>
    </article>
  `;
}

export function statusBadge(label, extraClass = '') {
  const key = slugify(label || 'sem-status');
  return `<span class="badge badge-${key} ${extraClass}">${escapeHtml(label || 'Sem status')}</span>`;
}

export function emptyState({ iconName = 'info', title, text = '', action = '', compact = false }) {
  return `
    <div class="empty ${compact ? 'empty-compact' : ''}">
      <span class="empty-icon">${icon(iconName)}</span>
      <h3>${escapeHtml(title)}</h3>
      ${text ? `<p>${escapeHtml(text)}</p>` : ''}
      ${action ? `<div class="empty-action">${action}</div>` : ''}
    </div>
  `;
}

export function searchField({ value = '', placeholder = 'Buscar…', name = 'busca', label = 'Buscar' }) {
  return `
    <label class="search-field">
      ${icon('search', 'search-icon')}
      <span class="sr-only">${escapeHtml(label)}</span>
      <input type="search" name="${escapeHtml(name)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" autocomplete="off">
    </label>
  `;
}

export function field({ label, name, value = '', type = 'text', required = false, placeholder = '', help = '', attrs = '', span = 1, min, max, step }) {
  const numericAttrs = [
    min !== undefined ? `min="${escapeHtml(min)}"` : '',
    max !== undefined ? `max="${escapeHtml(max)}"` : '',
    step !== undefined ? `step="${escapeHtml(step)}"` : ''
  ].filter(Boolean).join(' ');
  return `
    <div class="field ${span === 2 ? 'field-span2' : ''}">
      <label for="f-${escapeHtml(name)}">${escapeHtml(label)}${required ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>
      <input id="f-${escapeHtml(name)}" name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" ${required ? 'required' : ''} ${numericAttrs} ${attrs}>
      ${help ? `<p class="field-help">${escapeHtml(help)}</p>` : ''}
    </div>
  `;
}

export function textareaField({ label, name, value = '', rows = 3, placeholder = '', help = '', span = 2, required = false }) {
  return `
    <div class="field ${span === 2 ? 'field-span2' : ''}">
      <label for="f-${escapeHtml(name)}">${escapeHtml(label)}${required ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>
      <textarea id="f-${escapeHtml(name)}" name="${escapeHtml(name)}" rows="${rows}" placeholder="${escapeHtml(placeholder)}" ${required ? 'required' : ''}>${escapeHtml(value)}</textarea>
      ${help ? `<p class="field-help">${escapeHtml(help)}</p>` : ''}
    </div>
  `;
}

export function selectField({ label, name, value = '', options = [], required = false, help = '', placeholder = '', span = 1, attrs = '', blankLabel = '' }) {
  const list = options.map((option) => {
    const item = typeof option === 'string' ? { value: option, label: option } : option;
    return `<option value="${escapeHtml(item.value)}" ${String(item.value) === String(value) ? 'selected' : ''}>${escapeHtml(item.label)}</option>`;
  }).join('');
  return `
    <div class="field ${span === 2 ? 'field-span2' : ''}">
      <label for="f-${escapeHtml(name)}">${escapeHtml(label)}${required ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>
      <select id="f-${escapeHtml(name)}" name="${escapeHtml(name)}" ${required ? 'required' : ''} ${attrs}>
        ${placeholder || blankLabel ? `<option value="">${escapeHtml(blankLabel || placeholder)}</option>` : ''}
        ${list}
      </select>
      ${help ? `<p class="field-help">${escapeHtml(help)}</p>` : ''}
    </div>
  `;
}

export function avatar(name, tone = 'red') {
  return `<span class="avatar avatar-${tone}">${escapeHtml(initials(name))}</span>`;
}

export function moneyRow(label, value, strong = false) {
  return `<div class="money-row ${strong ? 'is-strong' : ''}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(money(value))}</strong></div>`;
}

export function dateLine(iso) {
  return escapeHtml(fmtDate(iso));
}

let currentModal = null;

export function openModal({ title, subtitle = '', body = '', footer = '', size = '', onMount = null, onClose = null }) {
  closeModal(true);
  const root = document.getElementById('modal-root');
  const previousFocus = document.activeElement;
  const id = `modal-${Date.now()}`;
  root.innerHTML = `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="modal ${size ? `modal-${size}` : ''}" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
        <header class="modal-head">
          <div>
            <h2 id="${id}-title">${escapeHtml(title)}</h2>
            ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
          </div>
          <button type="button" class="icon-button" data-modal-close aria-label="Fechar">${icon('x')}</button>
        </header>
        <div class="modal-body">${body}</div>
        ${footer ? `<footer class="modal-foot">${footer}</footer>` : ''}
      </section>
    </div>
  `;
  document.body.classList.add('modal-open');
  const backdrop = root.querySelector('[data-modal-backdrop]');
  const dialog = root.querySelector('.modal');
  const close = () => closeModal();
  const onKey = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const onBackdrop = (event) => {
    if (event.target === backdrop) close();
  };
  const closeButtons = root.querySelectorAll('[data-modal-close]');
  closeButtons.forEach((button) => button.addEventListener('click', close));
  backdrop.addEventListener('mousedown', onBackdrop);
  document.addEventListener('keydown', onKey);
  currentModal = {
    previousFocus,
    dialog,
    onClose,
    cleanup() {
      document.removeEventListener('keydown', onKey);
      backdrop.removeEventListener('mousedown', onBackdrop);
    }
  };
  dialog.querySelector('form[data-form]')?.addEventListener('submit', (event) => event.preventDefault());
  const focusTarget = dialog.querySelector('input:not([type="hidden"]), select, textarea, button');
  setTimeout(() => focusTarget?.focus(), 30);
  if (onMount) onMount(dialog, close);
  return close;
}

export function closeModal(silent = false) {
  const root = document.getElementById('modal-root');
  if (!root) return;
  if (currentModal) {
    currentModal.cleanup();
    const { previousFocus, onClose } = currentModal;
    currentModal = null;
    if (!silent && typeof onClose === 'function') onClose();
    if (previousFocus?.isConnected) setTimeout(() => previousFocus.focus(), 20);
  }
  root.innerHTML = '';
  document.body.classList.remove('modal-open');
}

export function confirmDialog({ title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', tone = 'primary' }) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value, close) => {
      if (settled) return;
      settled = true;
      close();
      resolve(value);
    };
    openModal({
      title,
      size: 'sm',
      body: `<p class="confirm-text">${escapeHtml(message)}</p>`,
      footer: `
        <button type="button" class="btn btn-ghost" data-confirm="no">${escapeHtml(cancelText)}</button>
        <button type="button" class="btn btn-${tone === 'danger' ? 'danger' : 'primary'}" data-confirm="yes">${escapeHtml(confirmText)}</button>
      `,
      onMount(dialog, close) {
        dialog.querySelector('[data-confirm="no"]').addEventListener('click', () => finish(false, close));
        dialog.querySelector('[data-confirm="yes"]').addEventListener('click', () => finish(true, close));
      },
      onClose() {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }
    });
  });
}

export function alertDialog({ title = 'Atenção', message, button = 'Entendi' }) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value, close) => {
      if (settled) return;
      settled = true;
      close();
      resolve(value);
    };
    openModal({
      title,
      size: 'sm',
      body: `<p class="confirm-text">${escapeHtml(message)}</p>`,
      footer: `<button type="button" class="btn btn-primary" data-confirm="ok">${escapeHtml(button)}</button>`,
      onMount(dialog, close) {
        dialog.querySelector('[data-confirm="ok"]').addEventListener('click', () => finish(true, close));
      },
      onClose() {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }
    });
  });
}

export function toast(message, type = 'success') {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const iconName = type === 'error' ? 'alerta' : type === 'info' ? 'info' : 'checkCircle';
  const element = document.createElement('div');
  element.className = `toast toast-${type}`;
  element.id = id;
  element.setAttribute('role', type === 'error' ? 'alert' : 'status');
  element.innerHTML = `${icon(iconName)}<span>${escapeHtml(message)}</span>`;
  root.appendChild(element);
  while (root.children.length > 3) root.firstElementChild.remove();
  setTimeout(() => {
    element.classList.add('toast-out');
    setTimeout(() => element.remove(), 240);
  }, 4600);
}

function inline(text) {
  let output = escapeHtml(text);
  const code = [];
  output = output.replace(/`([^`]+)`/g, (_, content) => {
    code.push(`<code>${content}</code>`);
    return `\u0000CODE${code.length - 1}\u0000`;
  });
  output = output.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const safe = /^(https?:\/\/|#|\.\/|\/)/i.test(url) ? url : '#';
    const external = /^https?:/i.test(safe);
    return `<a href="${safe}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
  });
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  output = output.replace(/\u0000CODE(\d+)\u0000/g, (_, index) => code[Number(index)]);
  return output;
}

export function markdownToHtml(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const html = [];
  const headings = [];
  const usedIds = new Map();
  let index = 0;
  let paragraph = [];
  let listType = null;
  let listItems = [];
  let inCode = false;
  let codeLines = [];
  let quote = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!listType || !listItems.length) {
      listType = null;
      listItems = [];
      return;
    }
    html.push(`<${listType}>${listItems.map((item) => `<li>${inline(item)}</li>`).join('')}</${listType}>`);
    listType = null;
    listItems = [];
  };
  const flushQuote = () => {
    if (!quote.length) return;
    html.push(`<blockquote>${quote.map((line) => `<p>${inline(line)}</p>`).join('')}</blockquote>`);
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  while (index < lines.length) {
    const raw = lines[index];
    const line = raw.trimEnd();

    if (inCode) {
      if (line.trim().startsWith('```')) {
        html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        inCode = false;
        codeLines = [];
      } else {
        codeLines.push(raw);
      }
      index += 1;
      continue;
    }

    if (line.trim().startsWith('```')) {
      flushAll();
      inCode = true;
      index += 1;
      continue;
    }

    if (!line.trim()) {
      flushAll();
      index += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      let text = heading[2].trim();
      let explicitId = '';
      const idMatch = /\s*\{#([\w-]+)\}\s*$/.exec(text);
      if (idMatch) {
        explicitId = idMatch[1];
        text = text.replace(idMatch[0], '').trim();
      }
      let id = explicitId || slugify(text) || `secao-${headings.length + 1}`;
      if (usedIds.has(id)) {
        usedIds.set(id, usedIds.get(id) + 1);
        id = `${id}-${usedIds.get(id)}`;
      } else {
        usedIds.set(id, 1);
      }
      headings.push({ level, id, text });
      html.push(`<h${level} id="${escapeHtml(id)}">${inline(text)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushAll();
      html.push('<hr>');
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph();
      flushList();
      quote.push(line.replace(/^>\s?/, ''));
      index += 1;
      continue;
    }

    const unordered = /^\s*[-*]\s+(.+)$/.exec(line);
    if (unordered) {
      flushParagraph();
      flushQuote();
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(unordered[1]);
      index += 1;
      continue;
    }

    const ordered = /^\s*\d+\.\s+(.+)$/.exec(line);
    if (ordered) {
      flushParagraph();
      flushQuote();
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(ordered[1]);
      index += 1;
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
    index += 1;
  }

  if (inCode && codeLines.length) html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  flushAll();
  return { html: html.join('\n'), headings };
}
