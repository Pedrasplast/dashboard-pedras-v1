-- View do Dashboard MP (Omie): nova coluna encerrado no final.
create or replace view public.dashboard_mp_compras_omie
with (security_invoker = true) as
with notas as (
  select n.cod_ped_compra, n.codigo_item,
         max(n.data_recebimento) as data_recebimento,
         string_agg(distinct ltrim(n.numero_nf, '0'), ', ') as numeros_nf
    from public.dashboard_mp_notas_omie n
   group by n.cod_ped_compra, n.codigo_item
)
select p.cod_ped_compra,
       p.codigo_item,
       p.numero_pedido,
       p.data_inclusao,
       p.data_previsao,
       p.codigo_fornecedor,
       p.fornecedor_nome,
       p.condicao_pagamento,
       p.codigo_produto,
       p.codigo_produto_omie,
       p.descricao,
       p.unidade,
       m.id   as material_id,
       m.nome as material_nome,
       p.quantidade,
       p.quantidade_recebida,
       greatest(p.quantidade - p.quantidade_recebida, 0) as quantidade_pendente,
       case
         when p.quantidade_recebida >= p.quantidade then 'RECEBIDO'
         when p.quantidade_recebida > 0 then 'PARCIAL'
         else 'PENDENTE'
       end as situacao_recebimento,
       p.preco_unitario,
       p.valor_mercadoria,
       p.valor_ipi,
       case when coalesce(p.valor_mercadoria, 0) > 0 and coalesce(p.valor_ipi, 0) > 0
            then round(p.valor_ipi / p.valor_mercadoria * 100, 4) end as ipi_percentual,
       p.valor_desconto,
       p.valor_frete,
       p.valor_outras_despesas,
       p.valor_total,
       nt.data_recebimento,
       nt.numeros_nf,
       p.sincronizado_em,
       p.encerrado
  from public.dashboard_mp_pedidos_omie p
  left join notas nt
    on nt.cod_ped_compra = p.cod_ped_compra and nt.codigo_item = p.codigo_item
  left join lateral (
    select mm.id, mm.nome
      from public.materia_prima_materiais mm
     where upper(trim(mm.codigo_omie)) = upper(trim(p.codigo_produto))
     order by mm.ativo desc, mm.id
     limit 1
  ) m on true;

