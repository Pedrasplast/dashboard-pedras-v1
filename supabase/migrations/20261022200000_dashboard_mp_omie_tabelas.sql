-- Dashboard de Matéria-Prima — origem Omie (separada da base manual).
-- Nada aqui altera materia_prima_compras_futuras nem as telas manuais.
-- Preenchidas pela rotina sincronizar-dashboard-mp-omie:
--   pedidos: PesquisarPedCompra sem cancelados, etapa 15, departamento 11
--            Suprimentos PP (9069810185), todos os itens; data = inclusão.
--   notas:   recebimentos de NF-e ligados a esses pedidos (data de recebimento,
--            nº da NF, quantidade da nota).
-- Rollback: supabase/rollback/20261022_dashboard_mp_omie_rollback.sql

create table if not exists public.dashboard_mp_pedidos_omie (
  cod_ped_compra          bigint      not null,
  codigo_item             bigint      not null,
  numero_pedido           text        not null,
  etapa                   text,
  data_inclusao           date        not null,
  data_previsao           date,
  codigo_fornecedor       bigint,
  fornecedor_nome         text,
  condicao_pagamento      text,
  codigo_produto          text,
  codigo_produto_omie     bigint,
  descricao               text,
  unidade                 text,
  quantidade              numeric     not null,
  quantidade_recebida     numeric     not null default 0,
  preco_unitario          numeric,
  valor_mercadoria        numeric,
  valor_ipi               numeric,
  valor_desconto          numeric,
  valor_frete             numeric,
  valor_outras_despesas   numeric,
  valor_total             numeric     not null,
  percentual_departamento numeric,
  sincronizado_em         timestamptz not null default now(),
  primary key (cod_ped_compra, codigo_item)
);
create index if not exists dashboard_mp_pedidos_omie_inclusao_idx
  on public.dashboard_mp_pedidos_omie (data_inclusao);

create table if not exists public.dashboard_mp_notas_omie (
  id_recebimento     bigint      not null,
  id_item_nota       bigint      not null,
  cod_ped_compra     bigint      not null,
  codigo_item        bigint,
  numero_pedido      text,
  numero_nf          text,
  data_emissao       date        not null,
  data_recebimento   date,
  quantidade         numeric,
  valor_total        numeric,
  sincronizado_em    timestamptz not null default now(),
  primary key (id_recebimento, id_item_nota)
);
create index if not exists dashboard_mp_notas_omie_item_idx
  on public.dashboard_mp_notas_omie (cod_ped_compra, codigo_item);
create index if not exists dashboard_mp_notas_omie_emissao_idx
  on public.dashboard_mp_notas_omie (data_emissao);

-- Leitura: quem tem a tela Dashboard de Matéria-Prima. Escrita: só a rotina (RPC abaixo).
alter table public.dashboard_mp_pedidos_omie enable row level security;
alter table public.dashboard_mp_notas_omie enable row level security;
revoke all on public.dashboard_mp_pedidos_omie, public.dashboard_mp_notas_omie from public, anon, authenticated;
grant select on public.dashboard_mp_pedidos_omie, public.dashboard_mp_notas_omie to authenticated;

create policy dashboard_mp_pedidos_omie_select on public.dashboard_mp_pedidos_omie
  for select to authenticated
  using ((select private.usuario_tem_permissao_tela('dashboard_materia_prima')));
create policy dashboard_mp_notas_omie_select on public.dashboard_mp_notas_omie
  for select to authenticated
  using ((select private.usuario_tem_permissao_tela('dashboard_materia_prima')));

comment on table public.dashboard_mp_pedidos_omie is
  'Dashboard MP (origem Omie): itens de pedidos de compra etapa 15, departamento 11 Suprimentos PP, sem cancelados. Rotina sincronizar-dashboard-mp-omie.';
comment on table public.dashboard_mp_notas_omie is
  'Dashboard MP (origem Omie): itens de NF-e de entrada ligados aos pedidos de dashboard_mp_pedidos_omie (data de recebimento e nº da NF).';
