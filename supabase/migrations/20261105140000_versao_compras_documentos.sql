-- Impressão digital dos dados da tela "Pedidos de Compra".
--
-- A tela consulta esta função (resposta de ~32 bytes) e só baixa a lista
-- completa de documentos/itens (~10 MB) quando o valor muda.
--
-- Cobre exatamente as colunas lidas pelo front em compras_documentos_front,
-- compras_documentos_itens_front e pedidos_compra_fornecedores.
-- Ficam de fora primeira/ultima_sincronizacao_em: são tocadas a cada varredura
-- mesmo sem mudança real e não são exibidas na tela.
--
-- SECURITY INVOKER: respeita as mesmas permissões/RLS das views.

create or replace function public.versao_compras_documentos()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select md5(
    (select coalesce(string_agg(md5(row(
        documento_id, tipo_documento, numero_documento, cod_ped_compra, cod_req_compra,
        numero_pedido, numero_requisicao, codigo_fornecedor, codigo_comprador, categoria,
        categoria_nome, centro_custo, condicao_pagamento, data_previsao, data_inclusao,
        observacoes, observacoes_internas, quantidade_itens
      )::text), '' order by documento_id), '')
     from public.compras_documentos_front)
    || '#' ||
    (select coalesce(string_agg(md5(row(
        documento_id, tipo_documento, cod_ped_compra, cod_req_compra, numero_documento,
        codigo_item, codigo_produto, codigo_comercial, descricao, unidade, quantidade,
        quantidade_recebida, preco_unitario, valor_total, desconto, observacao,
        local_estoque, sequencia
      )::text), '' order by documento_id, sequencia, codigo_item), '')
     from public.compras_documentos_itens_front)
    || '#' ||
    (select coalesce(string_agg(codigo || '=' || coalesce(nome, ''), '|' order by codigo), '')
     from public.pedidos_compra_fornecedores)
  );
$$;

revoke all on function public.versao_compras_documentos() from public, anon;
grant execute on function public.versao_compras_documentos() to authenticated, service_role;
