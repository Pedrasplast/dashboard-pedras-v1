-- Nec. Compra MP: aceite/recusa de peso suspeito (> 5 kg/un) da estrutura Omie.
-- A decisão vale só para a quantidade gravada; se o peso mudar no Omie, a
-- pendência volta. Quem tem a tela pode decidir e desfazer.
-- Rollback: drop table public.necessidade_mp_peso_decisoes;
create table if not exists public.necessidade_mp_peso_decisoes (
  codigo_produto  text        not null,
  codigo_mp       text        not null,
  quantidade      numeric     not null,
  decisao         text        not null check (decisao in ('ACEITO','RECUSADO')),
  decidido_por    uuid        not null default auth.uid(),
  decidido_por_email text     default (auth.jwt() ->> 'email'),
  decidido_em     timestamptz not null default now(),
  primary key (codigo_produto, codigo_mp)
);
alter table public.necessidade_mp_peso_decisoes enable row level security;
revoke all on public.necessidade_mp_peso_decisoes from public, anon, authenticated;
grant select, insert, update, delete on public.necessidade_mp_peso_decisoes to authenticated;
grant select on public.necessidade_mp_peso_decisoes to service_role;
create policy necessidade_mp_peso_decisoes_select on public.necessidade_mp_peso_decisoes
  for select to authenticated
  using ((select private.usuario_tem_permissao_tela('necessidade_materia_prima')));
create policy necessidade_mp_peso_decisoes_insert on public.necessidade_mp_peso_decisoes
  for insert to authenticated
  with check ((select private.usuario_tem_permissao_tela('necessidade_materia_prima')) and decidido_por = (select auth.uid()));
create policy necessidade_mp_peso_decisoes_update on public.necessidade_mp_peso_decisoes
  for update to authenticated
  using ((select private.usuario_tem_permissao_tela('necessidade_materia_prima')))
  with check ((select private.usuario_tem_permissao_tela('necessidade_materia_prima')) and decidido_por = (select auth.uid()));
create policy necessidade_mp_peso_decisoes_delete on public.necessidade_mp_peso_decisoes
  for delete to authenticated
  using ((select private.usuario_tem_permissao_tela('necessidade_materia_prima')));
comment on table public.necessidade_mp_peso_decisoes is
  'Nec. Compra MP: aceite/recusa de peso suspeito (> 5 kg/un) da estrutura Omie. Vale só para a quantidade gravada.';
