import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
    run();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}
console.log(`${tests.length - failures}/${tests.length} testes passaram.`);
if (failures) process.exitCode = 1;
