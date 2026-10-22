-- Itens de compra que entram na média da Tabela de Preços (últimos 60 dias).
-- Preenchida pela rotina sincronizar-precos-compras-mp-omie (4x/dia), que
-- consulta o Omie direto: PesquisarPedCompra com todas as situações menos
-- Cancelado (inclui encerrados), etapa 15, departamento 11 Suprimentos PP,
-- materiais cadastrados, data de inclusão.
-- Motivo: pedidos_compra_omie não serve para a média — a sincronização de
-- compras não traz encerrados, e um pedido que some da lista não é
-- necessariamente cancelado (teste de 22/10: nenhum cancelado no período).
create table if not exists public.precos_compras_mp_omie (
  cod_ped_compra       bigint      not null,
  codigo_item          bigint      not null,
  numero_pedido        text,
  etapa                text,
  data_inclusao        date        not null,
  codigo_produto       text        not null,
  codigo_produto_omie  bigint,
  quantidade           numeric     not null,
  quantidade_recebida  numeric,
  valor_total          numeric     not null,
  sincronizado_em      timestamptz not null default now(),
  primary key (cod_ped_compra, codigo_item)
);
create index if not exists precos_compras_mp_omie_produto_data_idx
  on public.precos_compras_mp_omie (codigo_produto_omie, data_inclusao);
alter table public.precos_compras_mp_omie enable row level security;
revoke all on public.precos_compras_mp_omie from public, anon, authenticated;
comment on table public.precos_compras_mp_omie is
  'Itens de pedidos de compra de matéria-prima que entram na média da Tabela de Preços (últimos 60 dias): PesquisarPedCompra sem cancelados (inclui encerrados), etapa 15, departamento 11 Suprimentos PP, materiais cadastrados. Gravada pela rotina sincronizar-precos-compras-mp-omie.';

-- Substitui a janela inteira numa transação (só a rotina, com service_role).
create or replace function public.substituir_precos_compras_mp(p_desde date, p_itens jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_removidos integer; v_inseridos integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Restrito ao integrador Omie';
  end if;
  if p_desde is null or jsonb_typeof(p_itens) <> 'array' then
    raise exception 'Parâmetros inválidos';
  end if;

  with apagados as (
    delete from public.precos_compras_mp_omie where data_inclusao >= p_desde returning 1
  ) select count(*) into v_removidos from apagados;

  insert into public.precos_compras_mp_omie
    (cod_ped_compra, codigo_item, numero_pedido, etapa, data_inclusao, codigo_produto,
     codigo_produto_omie, quantidade, quantidade_recebida, valor_total, sincronizado_em)
  select (x->>'cod_ped_compra')::bigint, (x->>'codigo_item')::bigint, x->>'numero_pedido', x->>'etapa',
         (x->>'data_inclusao')::date, x->>'codigo_produto', nullif(x->>'codigo_produto_omie','')::bigint,
         (x->>'quantidade')::numeric, nullif(x->>'quantidade_recebida','')::numeric, (x->>'valor_total')::numeric, now()
    from jsonb_array_elements(p_itens) x
   where (x->>'data_inclusao')::date >= p_desde;
  get diagnostics v_inseridos = row_count;

  return jsonb_build_object('removidos', v_removidos, 'inseridos', v_inseridos);
end; $$;
revoke all on function public.substituir_precos_compras_mp(date, jsonb) from public, anon, authenticated;
grant execute on function public.substituir_precos_compras_mp(date, jsonb) to service_role;
