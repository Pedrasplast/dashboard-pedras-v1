-- Necessidade de Compra MP: estrutura (malha) dos produtos lida do Omie.
-- Substitui o KG/UN e o vínculo produto → material manuais na tela
-- "Nec. Compra MP". Regra (23/10): da estrutura entra só a matéria-prima
-- do primeiro nível (tipo 01 / família Matéria Prima).
-- Preenchidas pela rotina sincronizar-estrutura-omie (geral/malha ConsultarEstrutura).
-- Rollback: supabase/rollback/20261023_necessidade_mp_estrutura_omie_rollback.sql

-- Um registro por produto lido (mesmo sem estrutura, para virar pendência).
create table if not exists public.necessidade_mp_estrutura_produtos_omie (
  codigo_produto   text        primary key,
  id_produto_omie  bigint,
  descricao        text,
  total_itens      integer     not null default 0,
  erro             text,
  sincronizado_em  timestamptz not null default now()
);

-- Linhas de matéria-prima da estrutura de cada produto.
create table if not exists public.necessidade_mp_estrutura_itens_omie (
  codigo_produto       text        not null references public.necessidade_mp_estrutura_produtos_omie (codigo_produto) on delete cascade,
  id_malha             bigint      not null,
  codigo_mp            text        not null,
  codigo_mp_omie       bigint,
  descricao_mp         text,
  tipo                 text,
  familia              text,
  unidade              text,
  quantidade           numeric     not null default 0,
  percentual_perda     numeric     not null default 0,
  sincronizado_em      timestamptz not null default now(),
  primary key (codigo_produto, id_malha)
);
create index if not exists necessidade_mp_estrutura_itens_mp_idx
  on public.necessidade_mp_estrutura_itens_omie (codigo_mp_omie);

-- Leitura: quem tem a tela Nec. Compra MP. Escrita: só a rotina (service_role).
alter table public.necessidade_mp_estrutura_produtos_omie enable row level security;
alter table public.necessidade_mp_estrutura_itens_omie enable row level security;
revoke all on public.necessidade_mp_estrutura_produtos_omie, public.necessidade_mp_estrutura_itens_omie from public, anon, authenticated;
grant select on public.necessidade_mp_estrutura_produtos_omie, public.necessidade_mp_estrutura_itens_omie to authenticated, service_role;

create policy necessidade_mp_estrutura_produtos_select on public.necessidade_mp_estrutura_produtos_omie
  for select to authenticated
  using ((select private.usuario_tem_permissao_tela('necessidade_materia_prima')));
create policy necessidade_mp_estrutura_itens_select on public.necessidade_mp_estrutura_itens_omie
  for select to authenticated
  using ((select private.usuario_tem_permissao_tela('necessidade_materia_prima')));

-- Gravação: só a rotina (service_role), direto nas tabelas.
grant insert, update, delete on public.necessidade_mp_estrutura_produtos_omie, public.necessidade_mp_estrutura_itens_omie to service_role;

comment on table public.necessidade_mp_estrutura_produtos_omie is
  'Nec. Compra MP: produtos dos pedidos de venda cuja estrutura (malha) foi lida do Omie. Rotina sincronizar-estrutura-omie.';
comment on table public.necessidade_mp_estrutura_itens_omie is
  'Nec. Compra MP: linhas de matéria-prima (1º nível, tipo 01) da estrutura Omie de cada produto.';
