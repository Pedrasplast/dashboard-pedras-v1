-- Gravação do Dashboard MP (origem Omie): só a rotina (service_role).
-- Cada chamada substitui uma janela inteira numa transação; fora dela nada muda.

-- Pedidos: janela pela data de inclusão [p_de, p_ate].
create or replace function public.substituir_dashboard_mp_pedidos(p_de date, p_ate date, p_itens jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_removidos integer; v_inseridos integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Restrito ao integrador Omie';
  end if;
  if p_de is null or p_ate is null or p_ate < p_de or jsonb_typeof(p_itens) <> 'array' then
    raise exception 'Parâmetros inválidos';
  end if;

  with apagados as (
    delete from public.dashboard_mp_pedidos_omie
     where data_inclusao between p_de and p_ate
    returning 1
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
   where (x->>'data_inclusao')::date between p_de and p_ate;
  get diagnostics v_inseridos = row_count;

  return jsonb_build_object('removidos', v_removidos, 'inseridos', v_inseridos);
end; $$;
revoke all on function public.substituir_dashboard_mp_pedidos(date, date, jsonb) from public, anon, authenticated;
grant execute on function public.substituir_dashboard_mp_pedidos(date, date, jsonb) to service_role;

-- Notas de entrada: janela pela data de emissão [p_de, p_ate].
create or replace function public.substituir_dashboard_mp_notas(p_de date, p_ate date, p_itens jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_removidos integer; v_inseridos integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Restrito ao integrador Omie';
  end if;
  if p_de is null or p_ate is null or p_ate < p_de or jsonb_typeof(p_itens) <> 'array' then
    raise exception 'Parâmetros inválidos';
  end if;

  with apagados as (
    delete from public.dashboard_mp_notas_omie
     where data_emissao between p_de and p_ate
    returning 1
  ) select count(*) into v_removidos from apagados;

  insert into public.dashboard_mp_notas_omie (
    id_recebimento, id_item_nota, cod_ped_compra, codigo_item, numero_pedido, numero_nf,
    data_emissao, data_recebimento, quantidade, valor_total, sincronizado_em)
  select (x->>'id_recebimento')::bigint, (x->>'id_item_nota')::bigint, (x->>'cod_ped_compra')::bigint,
         nullif(x->>'codigo_item','')::bigint, x->>'numero_pedido', x->>'numero_nf',
         (x->>'data_emissao')::date, nullif(x->>'data_recebimento','')::date,
         nullif(x->>'quantidade','')::numeric, nullif(x->>'valor_total','')::numeric, now()
    from jsonb_array_elements(p_itens) x
   where (x->>'data_emissao')::date between p_de and p_ate
  on conflict (id_recebimento, id_item_nota) do update set
    cod_ped_compra = excluded.cod_ped_compra, codigo_item = excluded.codigo_item,
    numero_pedido = excluded.numero_pedido, numero_nf = excluded.numero_nf,
    data_emissao = excluded.data_emissao, data_recebimento = excluded.data_recebimento,
    quantidade = excluded.quantidade, valor_total = excluded.valor_total, sincronizado_em = now();
  get diagnostics v_inseridos = row_count;

  return jsonb_build_object('removidos', v_removidos, 'inseridos', v_inseridos);
end; $$;
revoke all on function public.substituir_dashboard_mp_notas(date, date, jsonb) from public, anon, authenticated;
grant execute on function public.substituir_dashboard_mp_notas(date, date, jsonb) to service_role;
