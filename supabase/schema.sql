create or replace function public.fcv_valid_state(p_state jsonb)
returns boolean
language sql
immutable
strict
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_typeof(p_state) = 'object'
    and p_state->>'version' = '1'
    and jsonb_typeof(p_state->'meta') = 'object'
    and jsonb_typeof(p_state->'clientes') = 'array'
    and jsonb_typeof(p_state->'veiculos') = 'array'
    and jsonb_typeof(p_state->'fornecedores') = 'array'
    and jsonb_typeof(p_state->'pecas') = 'array'
    and jsonb_typeof(p_state->'movimentacoes') = 'array'
    and jsonb_typeof(p_state->'ordens') = 'array'
    and jsonb_typeof(p_state->'compras') = 'array'
    and jsonb_typeof(p_state->'despesas') = 'array',
    false
  );
$$;

create table if not exists public.fcv_workspaces (
  owner_id uuid not null default auth.uid()
    primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  revision bigint not null default 1 check (revision >= 1),
  mutation_ids jsonb not null default '[]'::jsonb
    check (jsonb_typeof(mutation_ids) = 'array'),
  conflict_archive jsonb not null default '[]'::jsonb
    check (jsonb_typeof(conflict_archive) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fcv_workspaces_state_valid check (public.fcv_valid_state(state)),
  constraint fcv_workspaces_state_size check (pg_column_size(state) <= 5242880)
);

alter table public.fcv_workspaces enable row level security;
alter table public.fcv_workspaces force row level security;

drop policy if exists fcv_workspaces_select on public.fcv_workspaces;
create policy fcv_workspaces_select on public.fcv_workspaces
  for select to authenticated
  using (owner_id = (select auth.uid()));

revoke all on public.fcv_workspaces from public, anon, authenticated;
grant select on public.fcv_workspaces to authenticated;

create or replace function public.fcv_commit_workspace(
  p_base_revision bigint,
  p_state jsonb,
  p_mutation_id uuid,
  p_archive_remote boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid := auth.uid();
  v_row public.fcv_workspaces%rowtype;
  v_now timestamptz := now();
  v_mutation_ids jsonb;
begin
  if v_owner_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_mutation_id is null or not public.fcv_valid_state(p_state) then
    raise exception 'Dados da oficina inválidos.';
  end if;

  if pg_column_size(p_state) > 5242880 then
    raise exception 'Os dados ultrapassam o limite de 5 MB.';
  end if;

  select *
  into v_row
  from public.fcv_workspaces
  where owner_id = v_owner_id
  for update;

  if not found then
    if p_base_revision <> 0 then
      return jsonb_build_object(
        'status', 'conflict',
        'state', null,
        'revision', 0,
        'updatedAt', null
      );
    end if;

    insert into public.fcv_workspaces (
      owner_id, state, revision, mutation_ids, created_at, updated_at
    ) values (
      v_owner_id, p_state, 1, jsonb_build_array(p_mutation_id::text), v_now, v_now
    )
    returning * into v_row;

    return jsonb_build_object(
      'status', 'created',
      'state', v_row.state,
      'revision', v_row.revision,
      'updatedAt', v_row.updated_at
    );
  end if;

  if v_row.mutation_ids @> jsonb_build_array(p_mutation_id::text) then
    return jsonb_build_object(
      'status', 'deduped',
      'state', v_row.state,
      'revision', v_row.revision,
      'updatedAt', v_row.updated_at
    );
  end if;

  if p_base_revision <> v_row.revision then
    return jsonb_build_object(
      'status', 'conflict',
      'state', v_row.state,
      'revision', v_row.revision,
      'updatedAt', v_row.updated_at
    );
  end if;

  if p_archive_remote then
    v_row.conflict_archive := (jsonb_build_array(jsonb_build_object(
      'state', v_row.state,
      'revision', v_row.revision,
      'archivedAt', v_now
    )) || v_row.conflict_archive)[1:10];
  end if;

  select coalesce(jsonb_agg(item.value order by item.ordinality), '[]'::jsonb)
  into v_mutation_ids
  from (
    select value, ordinality
    from jsonb_array_elements(
      jsonb_build_array(p_mutation_id::text) || v_row.mutation_ids
    ) with ordinality
    order by ordinality
    limit 2000
  ) as item;

  update public.fcv_workspaces
  set state = p_state,
      revision = v_row.revision + 1,
      mutation_ids = v_mutation_ids,
      conflict_archive = v_row.conflict_archive,
      updated_at = v_now
  where owner_id = v_owner_id
  returning * into v_row;

  return jsonb_build_object(
    'status', 'committed',
    'state', v_row.state,
    'revision', v_row.revision,
    'updatedAt', v_row.updated_at
  );
end;
$$;

create or replace function public.fcv_clear_conflict_archive()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid := auth.uid();
begin
  if v_owner_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  update public.fcv_workspaces
  set conflict_archive = '[]'::jsonb,
      updated_at = now()
  where owner_id = v_owner_id;

  return jsonb_build_object('status', 'cleared');
end;
$$;

revoke all on function public.fcv_commit_workspace(bigint, jsonb, uuid, boolean) from public, anon;
revoke all on function public.fcv_clear_conflict_archive() from public, anon;
grant execute on function public.fcv_commit_workspace(bigint, jsonb, uuid, boolean) to authenticated;
grant execute on function public.fcv_clear_conflict_archive() to authenticated;
