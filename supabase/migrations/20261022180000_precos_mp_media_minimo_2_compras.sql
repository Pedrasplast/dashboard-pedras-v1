-- Tabela de Preços MP: média só quando há 2 compras ou mais no período.
-- Com 1 ou nenhuma compra a média vem 0 e as telas (Tabela de Preços e
-- Necessidade) usam o último preço, sem mudar o front.
-- Último preço passa a vir da mesma fonte das médias (precos_compras_mp_omie,
-- direto do Omie); sem compra nos últimos 60 dias, usa o histórico antigo
-- (categoria 2.01.03), agora com desempate fixo (antes podia variar entre leituras).
-- Novas colunas no final: compras_30d, compras_45d, compras_60d.
-- Conferido em 22/10: PE/PET média 1,65 (4 compras); PP 5,73 (14);
-- PP Extrusado, Rafia e Scrap mostram o último preço (5,00 / 5,30 / 0,10).
-- Rollback: supabase/rollback/20261022_precos_mp_minimo_2_compras_rollback.sql
create or replace view public.precos_materia_prima_omie as  WITH base AS (
         SELECT i.cod_ped_compra, i.numero_pedido, i.etapa, i.data_previsao, i.data_inclusao, i.codigo_produto, i.codigo_produto_omie,
            i.descricao, i.unidade, i.categoria, i.quantidade, i.quantidade_recebida, i.quantidade_pendente, i.preco_unitario, i.valor_total,
            i.codigo_local_estoque,
                CASE WHEN i.data_inclusao ~ '^\d{2}/\d{2}/\d{4}$'::text THEN to_date(i.data_inclusao, 'DD/MM/YYYY'::text) ELSE NULL::date END AS data_compra
           FROM compras_materia_prima_itens_omie i
        ), ultima_antiga AS (
         -- Histórico antigo (categoria 2.01.03): só para material sem compra nos últimos 60 dias.
         SELECT DISTINCT ON (base.codigo_produto_omie) base.codigo_produto_omie, base.codigo_produto, base.descricao, base.unidade,
            base.data_compra AS ultima_compra,
                CASE WHEN base.quantidade > 0::numeric THEN base.valor_total / base.quantidade ELSE 0::numeric END AS ultimo_preco,
            base.quantidade AS quantidade_ultima_compra
           FROM base WHERE base.data_compra IS NOT NULL
          ORDER BY base.codigo_produto_omie, base.data_compra DESC, base.cod_ped_compra DESC, base.quantidade DESC, base.valor_total DESC
        ), compras_media AS (
         -- Itens gravados pela rotina sincronizar-precos-compras-mp-omie (4x/dia, direto do Omie).
         SELECT c.cod_ped_compra, c.codigo_item, c.codigo_produto_omie, c.data_inclusao AS data_compra, c.quantidade, c.valor_total
           FROM precos_compras_mp_omie c
          WHERE c.codigo_produto_omie IS NOT NULL AND c.quantidade > 0::numeric
            AND c.data_inclusao >= (CURRENT_DATE - 60) AND c.data_inclusao <= CURRENT_DATE
        ), ultima_nova AS (
         SELECT DISTINCT ON (compras_media.codigo_produto_omie) compras_media.codigo_produto_omie,
            compras_media.data_compra AS ultima_compra,
            compras_media.valor_total / compras_media.quantidade AS ultimo_preco,
            compras_media.quantidade AS quantidade_ultima_compra
           FROM compras_media
          ORDER BY compras_media.codigo_produto_omie, compras_media.data_compra DESC, compras_media.cod_ped_compra DESC, compras_media.codigo_item DESC
        ), medias AS (
         SELECT compras_media.codigo_produto_omie,
            count(*) FILTER (WHERE compras_media.data_compra >= (CURRENT_DATE - 30)) AS c30,
            sum(compras_media.quantidade) FILTER (WHERE compras_media.data_compra >= (CURRENT_DATE - 30)) AS q30,
            sum(compras_media.valor_total) FILTER (WHERE compras_media.data_compra >= (CURRENT_DATE - 30)) AS v30,
            count(*) FILTER (WHERE compras_media.data_compra >= (CURRENT_DATE - 45)) AS c45,
            sum(compras_media.quantidade) FILTER (WHERE compras_media.data_compra >= (CURRENT_DATE - 45)) AS q45,
            sum(compras_media.valor_total) FILTER (WHERE compras_media.data_compra >= (CURRENT_DATE - 45)) AS v45,
            count(*) AS c60, sum(compras_media.quantidade) AS q60, sum(compras_media.valor_total) AS v60
           FROM compras_media
          GROUP BY compras_media.codigo_produto_omie
        )
 SELECT u.codigo_produto_omie, u.codigo_produto, u.descricao, u.unidade,
    COALESCE(n.ultima_compra, u.ultima_compra) AS ultima_compra,
    COALESCE(n.ultimo_preco, u.ultimo_preco) AS ultimo_preco,
    COALESCE(n.quantidade_ultima_compra, u.quantidade_ultima_compra) AS quantidade_ultima_compra,
    COALESCE(m.q30, 0::numeric) AS quantidade_30d,
    -- Média só com 2 compras ou mais; com 1 ou nenhuma vem 0 e as telas usam o último preço.
    CASE WHEN m.c30 >= 2 THEN m.v30 / NULLIF(m.q30, 0::numeric) ELSE 0::numeric END AS preco_medio_30d,
    COALESCE(m.q45, 0::numeric) AS quantidade_45d,
    CASE WHEN m.c45 >= 2 THEN m.v45 / NULLIF(m.q45, 0::numeric) ELSE 0::numeric END AS preco_medio_45d,
    COALESCE(m.q60, 0::numeric) AS quantidade_60d,
    CASE WHEN m.c60 >= 2 THEN m.v60 / NULLIF(m.q60, 0::numeric) ELSE 0::numeric END AS preco_medio_60d,
    COALESCE(m.c30, 0::bigint) AS compras_30d,
    COALESCE(m.c45, 0::bigint) AS compras_45d,
    COALESCE(m.c60, 0::bigint) AS compras_60d
   FROM ultima_antiga u
     LEFT JOIN ultima_nova n USING (codigo_produto_omie)
     LEFT JOIN medias m USING (codigo_produto_omie)
;

comment on view public.precos_materia_prima_omie is
  'Tabela de Preços MP. Média (30/45/60 dias) de precos_compras_mp_omie (direto do Omie, 4x/dia): etapa 15, departamento 11 Suprimentos PP, sem cancelados, material pelo código, data de inclusão. Média só com 2+ compras no período; com 1 ou nenhuma a média vem 0 e as telas usam o último preço. Último preço: última compra da mesma fonte (60 dias); sem compra no período, histórico antigo (categoria 2.01.03).';
