import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const tests = [];
function test(name, run) { tests.push({ name, run }); }
const schema = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');

test('schema: workspace pertence ao usuário autenticado e tem RLS obrigatória', () => {
  assert.match(schema, /owner_id uuid not null default auth\.uid\(\)/);
  assert.match(schema, /primary key references auth\.users\(id\) on delete cascade/);
  assert.match(schema, /alter table public\.fcv_workspaces enable row level security/i);
  assert.match(schema, /alter table public\.fcv_workspaces force row level security/i);
  assert.match(schema, /using \(owner_id = \(select auth\.uid\(\)\)\)/);
  assert.doesNotMatch(schema, /create policy[^;]+using \(true\)/i);
});

test('schema: função de commit é security definer com search_path fixo', () => {
  assert.match(schema, /create or replace function public\.fcv_commit_workspace/i);
  assert.match(schema, /security definer/i);
  assert.match(schema, /set search_path = public, pg_temp/i);
  assert.match(schema, /if v_owner_id is null then/i);
  assert.match(schema, /for update/i);
});

test('schema: revisão e mutation_id protegem concorrência e duplicidade', () => {
  assert.match(schema, /p_base_revision <> v_row\.revision/i);
  assert.match(schema, /v_row\.mutation_ids @> jsonb_build_array\(p_mutation_id::text\)/i);
  assert.match(schema, /status.*conflict/i);
  assert.match(schema, /status.*deduped/i);
  assert.match(schema, /p_archive_remote/i);
});

test('schema: estado é validado e limitado antes da gravação', () => {
  assert.match(schema, /constraint fcv_workspaces_state_valid/i);
  assert.match(schema, /pg_column_size\(p_state\) > 5242880/i);
  assert.match(schema, /jsonb_typeof\(p_state->'clientes'\) = 'array'/i);
  assert.match(schema, /jsonb_typeof\(p_state->'ordens'\) = 'array'/i);
  assert.match(schema, /jsonb_typeof\(p_state->'movimentacoes'\) = 'array'/i);
});

test('schema: arquivo de conflito é limitado e pertence ao próprio usuário', () => {
  assert.match(schema, /v_row\.conflict_archive := \(jsonb_build_array\([\s\S]*?'state', v_row\.state[\s\S]*?'revision', v_row\.revision[\s\S]*?\) \|\| v_row\.conflict_archive\)\[1:10\]/i);
  assert.match(schema, /create or replace function public\.fcv_clear_conflict_archive/i);
});

test('service worker: usa arquivos atuais com internet e cache somente offline', async () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const origin = 'https://franlincarveiculos.vercel.app';
  const cached = new Response('arquivo-antigo');
  let fetchHandler;
  let networkCalls = 0;
  let cacheWrites = 0;
  const sandbox = {
    self: {
      location: { origin },
      addEventListener: (type, handler) => { if (type === 'fetch') fetchHandler = handler; },
      skipWaiting() {},
      clients: { claim() {} }
    },
    caches: {
      match: async () => cached,
      open: async () => ({ put: async () => { cacheWrites += 1; } })
    },
    fetch: async () => {
      networkCalls += 1;
      return new Response('arquivo-atual');
    },
    URL,
    Response
  };
  vm.runInNewContext(sw, sandbox);
  let responsePromise;
  fetchHandler({
    request: new Request(`${origin}/js/ui.js`),
    respondWith: (promise) => { responsePromise = promise; }
  });
  assert.equal(await (await responsePromise).text(), 'arquivo-atual');
  assert.equal(networkCalls, 1);
  assert.equal(cacheWrites, 1);

  sandbox.fetch = async () => { throw new Error('Sem conexão.'); };
  fetchHandler({
    request: new Request(`${origin}/js/ui.js`),
    respondWith: (promise) => { responsePromise = promise; }
  });
  assert.equal(await (await responsePromise).text(), 'arquivo-antigo');
});

test('interface: CSP e service worker não autorizam scripts inseguros nem cache da nuvem', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(html, /script-src 'self'/);
  assert.doesNotMatch(html, /script-src[^"']*'unsafe-inline'|script-src[^"']*'unsafe-eval'/);
  assert.match(html, /connect-src 'self' https:\/\/\*\.supabase\.co/);
  assert.match(html, /object-src 'none'/);
  assert.doesNotMatch(html, /frame-ancestors/);
  assert.match(sw, /url\.origin !== self\.location\.origin/);
  assert.match(sw, /url\.pathname\.endsWith\('\/config\.json'\)/);
  assert.doesNotMatch(sw, /supabase\.co/);
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
