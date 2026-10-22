-- Desfaz 20261022160000_precos_mp_media_regra_suprimentos_pp.sql (média antiga:
-- todos os pedidos com item da categoria 2.01.03, sem filtro de etapa/departamento/situação).
-- As colunas de 45/60 dias precisam sair, então a view é recriada.
drop view if exists public.precos_materia_prima_omie;
create view public.precos_materia_prima_omie as
 WITH base AS (
         SELECT i.cod_ped_compra, i.numero_pedido, i.etapa, i.data_previsao, i.data_inclusao, i.codigo_produto, i.codigo_produto_omie,
            i.descricao, i.unidade, i.categoria, i.quantidade, i.quantidade_recebida, i.quantidade_pendente, i.preco_unitario, i.valor_total,
            i.codigo_local_estoque,
                CASE WHEN i.data_inclusao ~ '^\d{2}/\d{2}/\d{4}$'::text THEN to_date(i.data_inclusao, 'DD/MM/YYYY'::text) ELSE NULL::date END AS data_compra
           FROM compras_materia_prima_itens_omie i
        ), ultima AS (
         SELECT DISTINCT ON (base.codigo_produto_omie) base.codigo_produto_omie, base.codigo_produto, base.descricao, base.unidade,
            base.data_compra AS ultima_compra,
                CASE WHEN base.quantidade > 0::numeric THEN base.valor_total / base.quantidade ELSE 0::numeric END AS ultimo_preco,
            base.quantidade AS quantidade_ultima_compra
           FROM base WHERE base.data_compra IS NOT NULL
          ORDER BY base.codigo_produto_omie, base.data_compra DESC, base.cod_ped_compra DESC
        ), media30 AS (
         SELECT base.codigo_produto_omie, sum(base.quantidade) AS quantidade_30d,
                CASE WHEN sum(base.quantidade) > 0::numeric THEN sum(base.valor_total) / sum(base.quantidade) ELSE 0::numeric END AS preco_medio_30d
           FROM base
          WHERE base.data_compra >= (CURRENT_DATE - 30) AND base.data_compra <= CURRENT_DATE AND base.quantidade > 0::numeric
          GROUP BY base.codigo_produto_omie
        )
 SELECT u.codigo_produto_omie, u.codigo_produto, u.descricao, u.unidade, u.ultima_compra, u.ultimo_preco, u.quantidade_ultima_compra,
    COALESCE(m.quantidade_30d, 0::numeric) AS quantidade_30d,
    COALESCE(m.preco_medio_30d, 0::numeric) AS preco_medio_30d
   FROM ultima u LEFT JOIN media30 m USING (codigo_produto_omie);
grant select on public.precos_materia_prima_omie to authenticated;
