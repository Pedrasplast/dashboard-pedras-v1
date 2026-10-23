-- Dashboard MP (origem Omie): gravação incremental por pedido.
-- Motivo (teste de 22/10): o filtro de datas padrão do PesquisarPedCompra
-- segue a previsão e deixa pedidos de fora (março: 20 x 32). Com
-- lApenasAlterados = 'T' o período vale pela inclusão/alteração; a rotina
-- passa a buscar "incluídos ou alterados desde X" e grava pedido a pedido:
--   p_codigos: todos os pedidos lidos nessa leitura (válidos ou não);
--   p_itens:   itens dos que são do departamento 11 / etapa 15.
-- Pedido lido que saiu da regra (outro departamento, cancelado) é removido.
create or replace function public.gravar_dashboard_mp_pedidos(p_codigos bigint[], p_itens jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_removidos integer; v_inseridos integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Restrito ao integrador Omie';
  end if;
  if p_codigos is null or jsonb_typeof(p_itens) <> 'array' then
    raise exception 'Parâmetros inválidos';
  end if;

  with apagados as (
    delete from public.dashboard_mp_pedidos_omie where cod_ped_compra = any(p_codigos) returning 1
  ) select count(*) into v_removidos from apagados;

  insert into public.dashboard_mp_pedidos_omie (
    cod_ped_compra, codigo_item, numero_pedido, etapa, data_inclusao, data_previsao,
    codigo_fornecedor, fornecedor_nome, condicao_pagamento, codigo_produto, codigo_produto_omie,
    descricao, unidade, quantidade, quantidade_recebida, preco_unitario, valor_mercadoria,
    valor_ipi, valor_desconto, valor_frete, valor_outras_despesas, valor_total,
    percentual_departamento, sincronizado_em)
  select (x->>'cod_ped_compra')::bigint, (x->>'codigo_item')::bigint, x->>'numero_pedido', x->>'etapa',
         (x->>'data_inclusao')::date, nullif(x->>'data_previsao','')::date,
         nullif(x->>'codigo_fornecedor','')::bigint, x->>'fornecedor_nome', x->>'condicao_pagamento',
         x->>'codigo_produto', nullif(x->>'codigo_produto_omie','')::bigint,
         x->>'descricao', x->>'unidade', (x->>'quantidade')::numeric,
         coalesce(nullif(x->>'quantidade_recebida','')::numeric, 0),
         nullif(x->>'preco_unitario','')::numeric, nullif(x->>'valor_mercadoria','')::numeric,
         nullif(x->>'valor_ipi','')::numeric, nullif(x->>'valor_desconto','')::numeric,
         nullif(x->>'valor_frete','')::numeric, nullif(x->>'valor_outras_despesas','')::numeric,
         (x->>'valor_total')::numeric, nullif(x->>'percentual_departamento','')::numeric, now()
    from jsonb_array_elements(p_itens) x
   where (x->>'cod_ped_compra')::bigint = any(p_codigos)
  on conflict (cod_ped_compra, codigo_item) do nothing;
  get diagnostics v_inseridos = row_count;

  return jsonb_build_object('removidos', v_removidos, 'inseridos', v_inseridos);
end; $$;
revoke all on function public.gravar_dashboard_mp_pedidos(bigint[], jsonb) from public, anon, authenticated;
grant execute on function public.gravar_dashboard_mp_pedidos(bigint[], jsonb) to service_role;
