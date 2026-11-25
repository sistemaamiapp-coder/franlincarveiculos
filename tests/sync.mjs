import assert from 'node:assert/strict';
import * as S from '../js/store.js';
import { SyncManager } from '../js/sync.js';

class MemoryStorage {
  #values = new Map();
  getItem(key) { return this.#values.get(String(key)) ?? null; }
  setItem(key, value) { this.#values.set(String(key), String(value)); }
  removeItem(key) { this.#values.delete(String(key)); }
  clear() { this.#values.clear(); }
}

let uuidCounter = 0;
globalThis.window = { crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++uuidCounter).padStart(12, '0')}` } };
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: true } });
globalThis.document = { visibilityState: 'visible' };

const tests = [];
function test(name, run) { tests.push({ name, run }); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function stateWithOrder(description) {
  const state = S.createEmptyData();
  state.ordens.push({
    id: `ordem-${description}`,
    numero: `OS-${description}`,
    problemaRelatado: description,
    status: 'Orçamento',
    itens: [],
    pago: false
  });
  return state;
}

class WorkspaceClient {
  constructor(remote = null) {
    this.user = { id: '00000000-0000-4000-8000-000000000001', email: 'oficina@example.com' };
    this.remote = remote;
    this.mutations = [];
    this.archive = [];
    this.failAfterCommit = false;
  }
  async fetchWorkspace() { return this.remote ? clone(this.remote) : null; }
  async commitWorkspace({ baseRevision, state, mutationId, archiveRemote = false }) {
    if (this.failAfterCommit) {
      this.failAfterCommit = false;
      this.remote = { state: clone(state), revision: (this.remote?.revision || 0) + 1, updatedAt: '2026-11-25T12:00:01Z' };
      this.mutations.push(mutationId);
      throw new Error('A resposta foi perdida depois do envio.');
    }
    if (this.mutations.includes(mutationId)) return { status: 'deduped', ...clone(this.remote) };
    if ((this.remote?.revision || 0) !== baseRevision) {
      return { status: 'conflict', state: this.remote?.state || S.createEmptyData(), revision: this.remote?.revision || 0, updatedAt: this.remote?.updatedAt || '' };
    }
    if (archiveRemote && this.remote) this.archive.push(clone(this.remote));
    const status = this.remote ? 'committed' : 'created';
    this.remote = { state: clone(state), revision: baseRevision + 1, updatedAt: '2026-11-25T12:00:00Z' };
    this.mutations.push(mutationId);
    return { status, ...clone(this.remote) };
  }
  async clearConflictArchive() { this.archive = []; }
}

function environment(client) {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const manager = new SyncManager(client, { localStorage, sessionStorage, channelFactory: null, polling: false });
  return { manager, localStorage, sessionStorage };
}

async function dispose(manager) {
  if (manager) manager.destroy();
  S.setWriteGuard(null);
  S.useLocalStorage();
  globalThis.localStorage?.clear();
  navigator.onLine = true;
}

test('sync: primeira entrada cria espaço vazio e salva alterações automaticamente', async () => {
  const client = new WorkspaceClient();
  const { manager } = environment(client);
  await manager.start();
  assert.equal(client.remote.revision, 1);
  assert.equal(manager.status, 'synced');
  manager.attachStore();
  S.saveOrder({ problemaRelatado: 'Troca de óleo' });
  assert.equal(manager.outboxPending, true);
  await manager.push();
  assert.equal(client.remote.state.ordens.length, 1);
  assert.equal(manager.outboxPending, false);
  assert.equal(manager.status, 'synced');
  await dispose(manager);
});

test('sync: cache da mesma conta é reutilizado sem criar migração repetida', async () => {
  const client = new WorkspaceClient();
  const first = environment(client);
  await first.manager.start();
  first.manager.attachStore();
  S.saveOrder({ problemaRelatado: 'Revisão' });
  await first.manager.push();
  const meta = JSON.parse(first.localStorage.getItem(first.manager.metaKey));
  assert.equal(meta.revision, 2);
  await dispose(first.manager);

  const second = environment(client);
  second.sessionStorage.setItem('fcv.device.v1', first.manager.deviceId);
  const reopened = new SyncManager(client, { localStorage: second.localStorage, sessionStorage: second.sessionStorage, channelFactory: null, polling: false });
  await reopened.start();
  assert.equal(reopened.pendingMigration, null);
  assert.equal(reopened.conflict, null);
  assert.equal(reopened.state.ordens.length, 1);
  assert.equal(reopened.status, 'synced');
  await dispose(reopened);
});

test('sync: migração legada exige escolha e versão local pode arquivar a nuvem', async () => {
  const client = new WorkspaceClient({ state: stateWithOrder('nuvem'), revision: 4, updatedAt: '2026-11-25T10:00:00Z' });
  const { manager, localStorage } = environment(client);
  localStorage.setItem('fcv.store.v1', JSON.stringify(stateWithOrder('computador')));
  await manager.start();
  assert.equal(manager.status, 'pending');
  assert.equal(manager.pendingMigration.local.ordens[0].problemaRelatado, 'computador');
  assert.equal(manager.state.ordens[0].problemaRelatado, 'nuvem');
  await manager.resolveUseDevice();
  assert.equal(client.remote.revision, 5);
  assert.equal(client.remote.state.ordens[0].problemaRelatado, 'computador');
  assert.equal(manager.state.ordens[0].problemaRelatado, 'computador');
  assert.equal(client.archive.length, 1);
  assert.equal(client.archive[0].state.ordens[0].problemaRelatado, 'nuvem');
  assert.equal(localStorage.getItem(manager.migratedKey), '1');
  await dispose(manager);
});

test('sync: edição concorrente bloqueia escrita e preserva as duas versões', async () => {
  const client = new WorkspaceClient({ state: S.createEmptyData(), revision: 1, updatedAt: '2026-11-25T10:00:00Z' });
  const first = environment(client);
  const second = environment(client);
  await first.manager.start();
  await second.manager.start();
  first.manager.attachStore();
  S.saveOrder({ problemaRelatado: 'Alteração do primeiro dispositivo' });
  assert.equal(JSON.parse(first.localStorage.getItem(first.manager.stateKey)).ordens.length, 1);
  clearTimeout(first.manager.pushTimer);
  first.manager.destroy();
  S.setWriteGuard(null);
  second.manager.attachStore();
  S.saveOrder({ problemaRelatado: 'Alteração do segundo dispositivo' });
  await second.manager.push();
  const reattached = new SyncManager(client, { localStorage: first.localStorage, sessionStorage: first.sessionStorage, channelFactory: null, polling: false });
  await reattached.start();
  reattached.attachStore();
  await reattached.push();
  assert.equal(reattached.status, 'conflict');
  assert.equal(reattached.conflict.local.ordens.length, 1, JSON.stringify(reattached.conflict.local));
  assert.equal(reattached.conflict.local.ordens[0].problemaRelatado, 'Alteração do primeiro dispositivo');
  assert.equal(reattached.conflict.remote.ordens[0].problemaRelatado, 'Alteração do segundo dispositivo');
  const before = reattached.state;
  assert.throws(() => S.saveOrder({ problemaRelatado: 'Não permitido' }), /Resolva o conflito/);
  assert.deepEqual(reattached.state, before);
  await reattached.resolveUseDevice();
  assert.equal(client.remote.state.ordens[0].problemaRelatado, 'Alteração do primeiro dispositivo');
  assert.equal(client.archive.at(-1).state.ordens[0].problemaRelatado, 'Alteração do segundo dispositivo');
  await dispose(reattached);
  await dispose(second.manager);
});

test('sync: metadados locais inválidos não criam revisão ou envio inválido', () => {
  const client = new WorkspaceClient();
  const { manager, localStorage } = environment(client);
  const state = stateWithOrder('cache');
  localStorage.setItem(manager.metaKey, JSON.stringify({
    revision: 'revisão inválida',
    updatedAt: 123,
    syncedState: state,
    outbox: { state, baseRevision: -1, mutationId: '', archiveRemote: 'true' }
  }));
  assert.deepEqual(manager.readEnvelope(), { revision: 0, syncedState: state, outbox: null, updatedAt: '' });
  localStorage.setItem(manager.metaKey, JSON.stringify({
    revision: 4,
    updatedAt: '2026-11-25T10:00:00Z',
    syncedState: state,
    outbox: { state, baseRevision: 4, mutationId: 'operacao-valida', archiveRemote: true }
  }));
  assert.deepEqual(manager.readEnvelope(), {
    revision: 4,
    updatedAt: '2026-11-25T10:00:00Z',
    syncedState: state,
    outbox: { state, baseRevision: 4, mutationId: 'operacao-valida', archiveRemote: true }
  });
  manager.destroy();
});

test('sync: sessão expirada na abertura não é tratada como offline', async () => {
  const client = new WorkspaceClient();
  client.fetchWorkspace = async () => {
    throw Object.assign(new Error('JWT expirado'), { name: 'SupabaseAuthError', status: 401 });
  };
  const { manager } = environment(client);
  await manager.start();
  assert.equal(manager.status, 'auth');
  assert.equal(manager.authExpired, true);
  assert.equal(manager.outboxPending, false);
  manager.attachStore();
  assert.throws(() => S.saveOrder({ problemaRelatado: 'Não permitido sem sessão' }), /Entre novamente/);
  await manager.pull();
  assert.equal(manager.status, 'auth');
  await dispose(manager);
});

test('sync: autenticação perdida no envio preserva a alteração para o próximo login', async () => {
  const client = new WorkspaceClient({ state: S.createEmptyData(), revision: 1, updatedAt: '2026-11-25T10:00:00Z' });
  const first = environment(client);
  await first.manager.start();
  first.manager.attachStore();
  const commitWorkspace = client.commitWorkspace.bind(client);
  client.commitWorkspace = async () => {
    throw Object.assign(new Error('Sessão inválida'), { name: 'SupabaseAuthError', status: 403 });
  };
  S.saveOrder({ problemaRelatado: 'Alteração preservada' });
  await first.manager.push();
  assert.equal(first.manager.status, 'auth');
  assert.equal(first.manager.outboxPending, true);
  const mutationId = first.manager.envelope.outbox.mutationId;
  await dispose(first.manager);
  client.commitWorkspace = commitWorkspace;

  const reopened = new SyncManager(client, { localStorage: first.localStorage, sessionStorage: first.sessionStorage, channelFactory: null, polling: false });
  await reopened.start();
  assert.equal(reopened.status, 'synced');
  assert.equal(reopened.outboxPending, false);
  assert.equal(reopened.state.ordens[0].problemaRelatado, 'Alteração preservada');
  assert.equal(client.mutations.includes(mutationId), true);
  await dispose(reopened);
});

test('sync: alterações offline aguardam conexão sem perder o estado', async () => {
  const client = new WorkspaceClient();
  const { manager } = environment(client);
  await manager.start();
  manager.attachStore();
  navigator.onLine = false;
  S.saveOrder({ problemaRelatado: 'Cadastro sem internet' });
  await manager.push();
  assert.equal(manager.status, 'offline');
  assert.equal(manager.outboxPending, true);
  assert.equal(client.remote.state.ordens.length, 0);
  navigator.onLine = true;
  await manager.push();
  assert.equal(manager.status, 'synced');
  assert.equal(client.remote.state.ordens.length, 1);
  await dispose(manager);
});

test('sync: nova tentativa usa o mesmo mutation_id e não duplica a revisão', async () => {
  const client = new WorkspaceClient({ state: S.createEmptyData(), revision: 1, updatedAt: '2026-11-25T10:00:00Z' });
  const { manager } = environment(client);
  await manager.start();
  manager.attachStore();
  client.failAfterCommit = true;
  S.saveOrder({ problemaRelatado: 'Resposta perdida' });
  await manager.push();
  assert.equal(manager.status, 'error');
  const mutationId = manager.envelope.outbox.mutationId;
  await manager.push();
  assert.equal(manager.envelope.outbox, null);
  assert.equal(manager.envelope.revision, 2);
  assert.equal(client.mutations.filter((id) => id === mutationId).length, 1);
  assert.equal(client.remote.state.ordens.length, 1);
  await dispose(manager);
});

let failures = 0;
for (const { name, run } of tests) {
  try {
    await run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}
console.log(`${tests.length - failures}/${tests.length} testes passaram.`);
if (failures) process.exitCode = 1;
