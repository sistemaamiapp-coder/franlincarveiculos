import * as S from './store.js';

const LEGACY_KEY = 'fcv.store.v1';
const DEVICE_KEY = 'fcv.device.v1';
const MIGRATED_KEY = 'fcv.migrated.v1';
const BLOCK_MESSAGE = 'Resolva o conflito de sincronização antes de alterar os dados.';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sameData(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function emptyData(data) {
  return !data || Object.values(data).every((value) => Array.isArray(value) ? value.length === 0 : true);
}

function validRevision(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function isAuthError(error) {
  return error?.name === 'SupabaseAuthError' && [401, 403].includes(error.status);
}

function readJson(storage, key) {
  const raw = storage?.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export class SyncManager {
  constructor(client, options = {}) {
    this.client = client;
    this.store = options.store || S;
    this.localStorage = options.localStorage || globalThis.localStorage;
    this.sessionStorage = options.sessionStorage || globalThis.sessionStorage;
    this.crypto = options.crypto || globalThis.crypto;
    this.channelFactory = options.channelFactory || globalThis.BroadcastChannel;
    this.polling = options.polling !== false;
    this.user = client.user;
    this.deviceId = this.localStorage?.getItem(DEVICE_KEY) || this.sessionStorage?.getItem(DEVICE_KEY) || this.crypto.randomUUID();
    this.localStorage?.setItem(DEVICE_KEY, this.deviceId);
    this.sessionStorage?.setItem(DEVICE_KEY, this.deviceId);
    this.stateKey = `fcv.state.v1:${this.user.id}:${this.deviceId}`;
    this.metaKey = `fcv.sync.v1:${this.user.id}:${this.deviceId}`;
    this.migratedKey = `${MIGRATED_KEY}:${this.user.id}`;
    this.cacheStorage = {
      getItem: () => this.localStorage.getItem(this.stateKey),
      setItem: (_key, value) => this.localStorage.setItem(this.stateKey, value),
      removeItem: () => this.localStorage.removeItem(this.stateKey)
    };
    this.envelope = { revision: 0, syncedState: null, outbox: null, updatedAt: '' };
    this.pendingMigration = null;
    this.conflict = null;
    this.status = 'idle';
    this.message = '';
    this.authExpired = false;
    this.listeners = new Set();
    this.pushTimer = null;
    this.pollTimer = null;
    this.pushing = null;
    this.unsubscribeStore = null;
    this.channel = null;
  }

  get state() {
    return clone(this.store.store.data);
  }

  get blockingMessage() {
    if (this.authExpired) return 'Sua sessão expirou. Entre novamente antes de alterar os dados.';
    if (this.conflict) return BLOCK_MESSAGE;
    if (this.pendingMigration) return 'Escolha como usar os dados deste computador antes de continuar.';
    return '';
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot() {
    return {
      status: this.status,
      message: this.message,
      pending: this.outboxPending,
      conflict: this.conflict,
      migration: this.pendingMigration,
      user: this.user,
      revision: this.envelope.revision
    };
  }

  get outboxPending() {
    return Boolean(this.envelope.outbox);
  }

  emit() {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  setStatus(status, message = '') {
    this.status = status;
    this.message = message;
    this.emit();
  }

  readEnvelope() {
    const value = readJson(this.localStorage, this.metaKey);
    const empty = { revision: 0, syncedState: null, outbox: null, updatedAt: '' };
    if (!value || typeof value !== 'object' || Array.isArray(value)) return empty;
    const revision = validRevision(value.revision) ? value.revision : 0;
    const outbox = value.outbox && typeof value.outbox === 'object' && !Array.isArray(value.outbox)
      && this.store.isValidData(value.outbox.state)
      && validRevision(value.outbox.baseRevision)
      && typeof value.outbox.mutationId === 'string'
      && value.outbox.mutationId.length > 0
      && value.outbox.mutationId.length <= 128
      ? {
          state: value.outbox.state,
          baseRevision: value.outbox.baseRevision,
          mutationId: value.outbox.mutationId,
          archiveRemote: value.outbox.archiveRemote === true
        }
      : null;
    return {
      revision,
      syncedState: this.store.isValidData(value.syncedState) ? value.syncedState : null,
      outbox,
      updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : ''
    };
  }

  writeEnvelope() {
    this.localStorage.setItem(this.metaKey, JSON.stringify(this.envelope));
  }

  readLegacy() {
    if (this.localStorage.getItem(this.migratedKey) === '1') return null;
    const value = readJson(this.localStorage, LEGACY_KEY);
    return this.store.isValidData(value) ? value : null;
  }

  markLegacyMigrated() {
    this.localStorage.setItem(this.migratedKey, '1');
  }

  configureStore(data) {
    this.store.setStorageAdapter(this.cacheStorage, { reload: false });
    this.store.applyRemoteData(data);
  }

  attachStore() {
    this.unsubscribeStore?.();
    const cached = readJson(this.localStorage, this.stateKey);
    if (this.store.isValidData(cached)) this.configureStore(cached);
    this.unsubscribeStore = this.store.subscribe((state) => this.markDirty(state));
    this.store.setWriteGuard(() => this.blockingMessage);
  }

  async start() {
    this.envelope = this.readEnvelope();
    const localState = readJson(this.localStorage, this.stateKey);
    const validLocal = this.store.isValidData(localState) ? localState : null;
    let remote = null;
    try {
      remote = await this.client.fetchWorkspace();
    } catch (error) {
      if (isAuthError(error)) {
        this.authExpired = true;
        this.setStatus('auth', 'Sua sessão expirou. Entre novamente para continuar.');
        return { offline: false, authExpired: true };
      }
      const legacy = this.readLegacy();
      if (!validLocal && legacy && !emptyData(legacy)) {
        this.pendingMigration = { local: legacy, remote: null, localRevision: 0 };
        this.setStatus('pending', 'Existem dados antigos neste computador. Escolha como usá-los; a conexão será necessária para concluir a sincronização.');
      } else {
        this.configureStore(validLocal || this.store.createEmptyData());
        this.setStatus('offline', error.message);
      }
      this.startPolling();
      return { offline: true };
    }

    if (remote) {
      if (validLocal) {
        if (this.envelope.outbox) {
          if (this.envelope.revision === remote.revision) {
            this.configureStore(validLocal);
            await this.push();
          } else {
            this.configureStore(validLocal);
            this.setConflict(this.envelope.outbox.baseRevision, validLocal, remote);
          }
        } else if (sameData(validLocal, remote.state)) {
          this.configureStore(remote.state);
          this.envelope.revision = remote.revision;
          this.envelope.syncedState = clone(remote.state);
          this.envelope.updatedAt = remote.updatedAt;
          this.writeEnvelope();
          this.setStatus('synced');
        } else if ((this.envelope.revision || 0) === remote.revision) {
          this.configureStore(validLocal);
          this.envelope.outbox = { state: clone(validLocal), baseRevision: remote.revision, mutationId: this.crypto.randomUUID(), archiveRemote: false };
          this.writeEnvelope();
          await this.push();
        } else {
          this.configureStore(validLocal);
          this.setConflict(this.envelope.revision, validLocal, remote);
        }
      } else {
        const legacy = this.readLegacy();
        if (legacy && !emptyData(legacy)) {
          this.pendingMigration = { local: legacy, remote, localRevision: 0 };
          this.configureStore(remote.state);
          this.envelope.revision = remote.revision;
          this.envelope.syncedState = clone(remote.state);
          this.envelope.updatedAt = remote.updatedAt;
          this.writeEnvelope();
          this.setStatus('pending', 'Existem dados neste computador e dados na nuvem.');
        } else {
          this.configureStore(remote.state);
          this.envelope.revision = remote.revision;
          this.envelope.syncedState = clone(remote.state);
          this.envelope.updatedAt = remote.updatedAt;
          this.writeEnvelope();
          this.setStatus('synced');
        }
      }
    } else if (validLocal) {
      this.configureStore(validLocal);
      if (!this.envelope.outbox && !emptyData(validLocal)) {
        this.envelope.outbox = { state: clone(validLocal), baseRevision: this.envelope.revision, mutationId: this.crypto.randomUUID(), archiveRemote: false };
        this.writeEnvelope();
      }
      await this.push();
    } else {
      const legacy = this.readLegacy();
      if (legacy && !emptyData(legacy)) {
        this.pendingMigration = { local: legacy, remote: null, localRevision: 0 };
        this.configureStore(legacy);
        this.setStatus('pending', 'Existem dados deste computador para migrar.');
      } else {
        const empty = this.store.createEmptyData();
        this.configureStore(empty);
        this.envelope.outbox = { state: clone(empty), baseRevision: 0, mutationId: this.crypto.randomUUID(), archiveRemote: false };
        this.writeEnvelope();
        await this.push();
      }
    }

    this.startPolling();
    return { offline: false };
  }

  markDirty(state) {
    if (this.conflict || this.pendingMigration) return;
    const snapshot = clone(state);
    if (this.envelope.outbox) this.envelope.outbox.state = snapshot;
    else {
      this.envelope.outbox = {
        state: snapshot,
        baseRevision: this.envelope.revision,
        mutationId: this.crypto.randomUUID(),
        archiveRemote: false
      };
    }
    this.writeEnvelope();
    if (!navigator.onLine) {
      if (this.status !== 'offline') this.setStatus('offline', 'Alterações guardadas neste dispositivo e aguardando conexão.');
    } else {
      if (this.status !== 'syncing') this.setStatus('syncing', 'Salvando alterações na nuvem…');
      this.schedulePush();
    }
  }

  schedulePush() {
    clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => this.push(), 350);
    this.pushTimer?.unref?.();
  }

  async push() {
    if (this.authExpired) return;
    if (this.pushing) return this.pushing;
    this.pushing = (async () => {
      while (this.envelope.outbox && !this.conflict && !this.pendingMigration) {
        if (!navigator.onLine) {
          this.setStatus('offline', 'Alterações guardadas neste dispositivo e aguardando conexão.');
          break;
        }
        const item = clone(this.envelope.outbox);
        this.setStatus('syncing', 'Salvando alterações na nuvem…');
        try {
          const result = await this.client.commitWorkspace({
            baseRevision: item.baseRevision,
            state: item.state,
            mutationId: item.mutationId,
            archiveRemote: item.archiveRemote
          });
          if (result.status === 'conflict') {
            this.setConflict(item.baseRevision, item.state, {
              state: result.state,
              revision: result.revision,
              updatedAt: result.updatedAt
            });
            break;
          }
          this.envelope.revision = result.revision;
          this.envelope.syncedState = clone(result.state);
          this.envelope.updatedAt = result.updatedAt;
          if (sameData(this.state, item.state)) this.envelope.outbox = null;
          else {
            this.envelope.outbox = {
              state: this.state,
              baseRevision: result.revision,
              mutationId: this.crypto.randomUUID(),
              archiveRemote: false
            };
          }
          this.writeEnvelope();
          this.channel?.postMessage({ type: 'updated', revision: result.revision });
          this.setStatus(this.envelope.outbox ? 'syncing' : 'synced', this.envelope.outbox ? 'Enviando alterações mais recentes…' : 'Dados sincronizados com a nuvem.');
        } catch (error) {
          if (isAuthError(error)) {
            this.authExpired = true;
            clearInterval(this.pollTimer);
            this.pollTimer = null;
            this.setStatus('auth', 'Sua sessão expirou. Entre novamente para continuar.');
          } else {
            this.setStatus(navigator.onLine ? 'error' : 'offline', error.message);
          }
          break;
        }
      }
    })();
    try {
      await this.pushing;
    } finally {
      this.pushing = null;
    }
  }

  setConflict(baseRevision, local, remote) {
    this.conflict = {
      baseRevision,
      localRevision: this.envelope.revision,
      local: clone(local),
      remote: clone(remote.state),
      remoteRevision: remote.revision,
      remoteUpdatedAt: remote.updatedAt
    };
    this.setStatus('conflict', 'Há alterações diferentes neste dispositivo e na nuvem. Nenhuma versão foi sobrescrita.');
  }

  async pull() {
    if (this.authExpired) return;
    if (this.pushing) await this.pushing;
    if (this.envelope.outbox) return this.push();
    if (this.conflict || this.pendingMigration) return;
    try {
      const remote = await this.client.fetchWorkspace();
      if (!remote) throw new Error('O espaço de dados não foi encontrado na nuvem.');
      if (remote.revision === this.envelope.revision && sameData(remote.state, this.state)) {
        this.setStatus('synced');
        return;
      }
      if (remote.revision < this.envelope.revision) throw new Error('A versão da nuvem é anterior ao cache deste dispositivo.');
      this.configureStore(remote.state);
      this.envelope.revision = remote.revision;
      this.envelope.syncedState = clone(remote.state);
      this.envelope.updatedAt = remote.updatedAt;
      this.writeEnvelope();
      this.setStatus('synced', 'Dados atualizados a partir da nuvem.');
    } catch (error) {
      if (isAuthError(error)) {
        this.authExpired = true;
        clearInterval(this.pollTimer);
        this.pollTimer = null;
        this.setStatus('auth', 'Sua sessão expirou. Entre novamente para continuar.');
      } else {
        this.setStatus(navigator.onLine ? 'error' : 'offline', error.message);
      }
    }
  }

  async resolveCloud() {
    const source = this.conflict?.remote || this.pendingMigration?.remote?.state;
    if (this.conflict || this.pendingMigration?.remote) {
      if (!source) throw new Error('Não há dados na nuvem para restaurar.');
      this.configureStore(source);
      this.envelope.revision = this.conflict?.remoteRevision || this.pendingMigration.remote.revision;
      this.envelope.syncedState = clone(source);
      this.envelope.updatedAt = this.conflict?.remoteUpdatedAt || this.pendingMigration.remote.updatedAt;
      this.envelope.outbox = null;
    } else {
      const empty = this.store.createEmptyData();
      this.configureStore(empty);
      this.envelope.revision = 0;
      this.envelope.syncedState = null;
      this.envelope.outbox = { state: clone(empty), baseRevision: 0, mutationId: this.crypto.randomUUID(), archiveRemote: false };
    }
    this.conflict = null;
    this.pendingMigration = null;
    this.markLegacyMigrated();
    this.writeEnvelope();
    this.setStatus(this.envelope.outbox ? 'syncing' : 'synced', this.envelope.outbox ? 'Enviando a seleção para a nuvem…' : 'Dados da nuvem selecionados.');
    if (this.envelope.outbox) await this.push();
  }

  async resolveUseDevice() {
    let baseRevision = this.envelope.revision;
    let archiveRemote = false;
    if (this.pendingMigration?.remote) {
      baseRevision = this.pendingMigration.remote.revision;
      archiveRemote = true;
    } else if (this.conflict) {
      const remote = await this.client.fetchWorkspace();
      if (!remote) throw new Error('Não foi possível confirmar a versão mais recente da nuvem.');
      baseRevision = remote.revision;
      archiveRemote = true;
    }
    const selected = clone(this.pendingMigration?.local || this.state);
    if (this.pendingMigration) this.configureStore(selected);
    this.envelope.outbox = {
      state: selected,
      baseRevision,
      mutationId: this.crypto.randomUUID(),
      archiveRemote
    };
    this.conflict = null;
    this.pendingMigration = null;
    this.markLegacyMigrated();
    this.writeEnvelope();
    await this.push();
  }

  startPolling() {
    if (!this.polling || this.authExpired) return;
    clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      if (document.visibilityState !== 'hidden') this.pull();
    }, 20000);
    this.pollTimer?.unref?.();
    if (this.channelFactory && !this.channel) {
      try {
        this.channel = new this.channelFactory(`fcv-sync-${this.user.id}`);
        this.channel.onmessage = () => this.pull();
      } catch {
        this.channel = null;
      }
    }
  }

  destroy() {
    clearTimeout(this.pushTimer);
    clearInterval(this.pollTimer);
    this.unsubscribeStore?.();
    this.unsubscribeStore = null;
    this.store.setWriteGuard(null);
    this.channel?.close();
    this.channel = null;
    this.listeners.clear();
  }
}
