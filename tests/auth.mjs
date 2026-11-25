import assert from 'node:assert/strict';
import { SupabaseClient, loadConfig } from '../js/supabase.js';

class MemoryStorage {
  #values = new Map();
  getItem(key) { return this.#values.get(String(key)) ?? null; }
  setItem(key, value) { this.#values.set(String(key), String(value)); }
  removeItem(key) { this.#values.delete(String(key)); }
  clear() { this.#values.clear(); }
}

const tests = [];
function test(name, run) { tests.push({ name, run }); }
function response(status, payload) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(payload) };
}
const config = { supabaseUrl: 'https://projeto.supabase.co', supabaseAnonKey: 'chave-publica' };
const session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: '00000000-0000-4000-8000-000000000001', email: 'oficina@example.com' }
};

function setup(fetchImpl) {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const calls = [];
  const client = new SupabaseClient(config, {
    localStorage,
    sessionStorage,
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return fetchImpl(url, options);
    }
  });
  return { client, localStorage, sessionStorage, calls };
}

test('auth: entrada grava sessão temporária sem expor token em URL', async () => {
  const { client, localStorage, sessionStorage, calls } = setup(async (url, options) => {
    assert.match(url, /\/auth\/v1\/token\?grant_type=password$/);
    assert.doesNotMatch(url, /access-token|refresh-token|oficina@/);
    assert.equal(options.headers.get('apikey'), config.supabaseAnonKey);
    return response(200, session);
  });
  await client.signIn('oficina@example.com', 'senha-segura', false);
  assert.equal(client.user.email, 'oficina@example.com');
  assert.equal(localStorage.getItem('fcv.auth.session.v1'), null);
  assert.ok(sessionStorage.getItem('fcv.auth.session.v1').includes('refresh-token'));
  assert.equal(calls.length, 1);
});

test('auth: manter conectado usa armazenamento local', async () => {
  const { client, localStorage, sessionStorage } = setup(async () => response(200, session));
  await client.signIn('oficina@example.com', 'senha-segura', true);
  assert.ok(localStorage.getItem('fcv.auth.session.v1').includes('refresh-token'));
  assert.equal(sessionStorage.getItem('fcv.auth.session.v1'), null);
  assert.equal(localStorage.getItem('fcv.auth.remember.v1'), '1');
});

test('auth: cadastro com confirmação de e-mail não cria sessão', async () => {
  const { client, localStorage, sessionStorage, calls } = setup(async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.email, 'nova@example.com');
    assert.equal(body.emailRedirectTo, 'https://sistema.example/franlincarveiculos/');
    return response(200, { id: session.user.id, email: body.email });
  });
  globalThis.location = { origin: 'https://sistema.example', pathname: '/franlincarveiculos/' };
  const result = await client.signUp('nova@example.com', 'senha-segura', false);
  assert.equal(result.access_token, undefined);
  assert.equal(client.user, null);
  assert.equal(localStorage.getItem('fcv.auth.session.v1'), null);
  assert.equal(sessionStorage.getItem('fcv.auth.session.v1'), null);
  assert.equal(calls.length, 1);
  delete globalThis.location;
});

test('auth: recuperação de senha usa endpoint próprio e redirecionamento seguro', async () => {
  const { client, calls } = setup(async (url, options) => {
    assert.match(url, /\/auth\/v1\/recover$/);
    const body = JSON.parse(options.body);
    assert.equal(body.email, 'oficina@example.com');
    assert.equal(body.redirect_to, 'https://sistema.example/franlincarveiculos/');
    return response(200, {});
  });
  globalThis.location = { origin: 'https://sistema.example', pathname: '/franlincarveiculos/' };
  await client.recoverPassword('oficina@example.com');
  assert.equal(calls.length, 1);
  delete globalThis.location;
});

test('auth: resposta 401 renova a sessão e repete a consulta uma vez', async () => {
  let workspaceCalls = 0;
  const { client } = setup(async (url) => {
    if (url.includes('grant_type=refresh_token')) return response(200, { ...session, access_token: 'novo-access' });
    if (url.includes('/auth/v1/user')) return response(200, session.user);
    workspaceCalls += 1;
    if (workspaceCalls === 1) return response(401, { message: 'Token expirado' });
    assert.equal(url.includes('owner_id=eq.00000000-0000-4000-8000-000000000001'), true);
    return response(200, [{ state: { version: 1 }, revision: 3, updated_at: '2026-11-25T12:00:00Z' }]);
  });
  client.saveSession(session, false);
  const result = await client.fetchWorkspace();
  assert.equal(workspaceCalls, 2);
  assert.equal(result.revision, 3);
});

test('auth: sessão inválida é descartada e erro é apresentado', async () => {
  const { client } = setup(async () => response(401, { msg: 'Credenciais inválidas' }));
  await assert.rejects(() => client.signIn('oficina@example.com', 'senha-errada'), /Credenciais inválidas/);
});

test('auth: configuração exige HTTPS e chave pública', async () => {
  globalThis.FCV_CONFIG = { supabaseUrl: 'http://inseguro.example', supabaseAnonKey: 'chave' };
  assert.equal(await loadConfig(), null);
  delete globalThis.FCV_CONFIG;
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
