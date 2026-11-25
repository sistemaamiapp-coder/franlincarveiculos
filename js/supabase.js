const SESSION_KEY = 'fcv.auth.session.v1';
const REMEMBER_KEY = 'fcv.auth.remember.v1';
let configPromise = null;

function cleanConfig(value) {
  const supabaseUrl = String(value?.supabaseUrl || '').trim().replace(/\/+$/, '');
  const supabaseAnonKey = String(value?.supabaseAnonKey || '').trim();
  if (!supabaseUrl || !supabaseAnonKey) return null;
  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return { supabaseUrl, supabaseAnonKey };
}

export async function loadConfig() {
  if (!configPromise) {
    configPromise = (async () => {
      if (globalThis.FCV_CONFIG) return cleanConfig(globalThis.FCV_CONFIG);
      try {
        const response = await fetch('./config.json', { cache: 'no-store' });
        if (!response.ok) return null;
        return cleanConfig(await response.json());
      } catch {
        return null;
      }
    })();
  }
  return configPromise;
}

export class SupabaseAuthError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'SupabaseAuthError';
    this.status = status;
  }
}

export class SupabaseClient {
  constructor(config, options = {}) {
    this.config = cleanConfig(config);
    if (!this.config) throw new Error('Configuração do Supabase ausente.');
    this.fetchImpl = options.fetchImpl || globalThis.fetch.bind(globalThis);
    this.sessionStorage = options.sessionStorage || globalThis.sessionStorage;
    this.localStorage = options.localStorage || globalThis.localStorage;
    this.session = null;
    this.refreshPromise = null;
  }

  get accessToken() {
    return this.session?.access_token || '';
  }

  get user() {
    return this.session?.user || null;
  }

  get remember() {
    return this.localStorage?.getItem(REMEMBER_KEY) === '1';
  }

  saveSession(session, remember = false) {
    this.session = session;
    const target = remember ? this.localStorage : this.sessionStorage;
    this.sessionStorage?.removeItem(SESSION_KEY);
    this.localStorage?.removeItem(SESSION_KEY);
    if (remember) this.localStorage?.setItem(REMEMBER_KEY, '1');
    else {
      this.localStorage?.removeItem(REMEMBER_KEY);
      target?.setItem(SESSION_KEY, JSON.stringify(session));
    }
    if (remember) target?.setItem(SESSION_KEY, JSON.stringify(session));
  }

  readStoredSession() {
    const raw = this.localStorage?.getItem(SESSION_KEY) || this.sessionStorage?.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      this.clearSession();
      return null;
    }
  }

  clearSession() {
    this.session = null;
    this.sessionStorage?.removeItem(SESSION_KEY);
    this.localStorage?.removeItem(SESSION_KEY);
    this.localStorage?.removeItem(REMEMBER_KEY);
  }

  async request(path, options = {}, retry = true) {
    const headers = new Headers(options.headers || {});
    headers.set('apikey', this.config.supabaseAnonKey);
    headers.set('Content-Type', 'application/json');
    if (this.accessToken) headers.set('Authorization', `Bearer ${this.accessToken}`);
    let response;
    try {
      response = await this.fetchImpl(`${this.config.supabaseUrl}${path}`, { ...options, headers });
    } catch {
      throw new Error('Sem conexão com a nuvem. Verifique a internet e tente novamente.');
    }
    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }
    if (response.status === 401 && retry && this.session?.refresh_token && !path.startsWith('/auth/v1/')) {
      await this.refreshSession();
      return this.request(path, options, false);
    }
    if (!response.ok) {
      const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || 'Não foi possível concluir a operação.';
      throw new SupabaseAuthError(message, response.status);
    }
    return payload;
  }

  async signIn(email, password, remember = false) {
    const session = await this.request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: String(email).trim(), password })
    });
    this.saveSession(session, remember);
    return session;
  }

  async signUp(email, password, remember = false) {
    const redirectTo = globalThis.location ? `${globalThis.location.origin}${globalThis.location.pathname}` : undefined;
    const session = await this.request('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: String(email).trim(),
        password,
        ...(redirectTo ? { emailRedirectTo: redirectTo } : {})
      })
    });
    if (session?.access_token) this.saveSession(session, remember);
    return session;
  }

  async recoverPassword(email) {
    const redirectTo = globalThis.location ? `${globalThis.location.origin}${globalThis.location.pathname}` : undefined;
    return this.request('/auth/v1/recover', {
      method: 'POST',
      body: JSON.stringify({
        email: String(email).trim(),
        ...(redirectTo ? { redirect_to: redirectTo } : {})
      })
    });
  }

  async restoreSession() {
    const stored = this.readStoredSession();
    if (!stored?.access_token) return null;
    this.session = stored;
    if (Number(stored.expires_at || 0) > Date.now() / 1000 + 30) return stored;
    if (!stored.refresh_token) {
      this.clearSession();
      return null;
    }
    return this.refreshSession();
  }

  async refreshSession() {
    if (this.refreshPromise) return this.refreshPromise;
    const refreshToken = this.session?.refresh_token || this.readStoredSession()?.refresh_token;
    if (!refreshToken) {
      this.clearSession();
      return null;
    }
    this.refreshPromise = (async () => {
      try {
        const session = await this.request('/auth/v1/token?grant_type=refresh_token', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken })
        }, false);
        this.saveSession(session, this.remember);
        return session;
      } catch (error) {
        if (error instanceof SupabaseAuthError && [400, 401, 403].includes(error.status)) this.clearSession();
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise;
  }

  async getUser() {
    if (!this.accessToken) return null;
    const user = await this.request('/auth/v1/user');
    if (this.session) this.session.user = user;
    return user;
  }

  async signOut() {
    try {
      if (this.accessToken) await this.request('/auth/v1/logout', { method: 'POST' }, false);
    } finally {
      this.clearSession();
    }
  }

  async fetchWorkspace() {
    const query = new URLSearchParams({
      select: 'state,revision,updated_at',
      owner_id: `eq.${this.user.id}`,
      limit: '1'
    });
    const rows = await this.request(`/rest/v1/fcv_workspaces?${query}`);
    if (!rows?.length) return null;
    const row = rows[0];
    return { state: row.state, revision: Number(row.revision), updatedAt: row.updated_at };
  }

  async commitWorkspace({ baseRevision, state, mutationId, archiveRemote = false }) {
    const result = await this.request('/rest/v1/rpc/fcv_commit_workspace', {
      method: 'POST',
      body: JSON.stringify({
        p_base_revision: Number(baseRevision),
        p_state: state,
        p_mutation_id: mutationId,
        p_archive_remote: Boolean(archiveRemote)
      })
    });
    return {
      status: result.status,
      state: result.state,
      revision: Number(result.revision),
      updatedAt: result.updatedAt
    };
  }

  async clearConflictArchive() {
    return this.request('/rest/v1/rpc/fcv_clear_conflict_archive', { method: 'POST', body: '{}' });
  }
}
