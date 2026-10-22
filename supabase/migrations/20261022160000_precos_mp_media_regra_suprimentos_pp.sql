-- Tabela de Preços MP: nova regra da média e médias de 45 e 60 dias.
--
-- Média (30/45/60 dias), pedida em 22/10:
--   * Etapa 15 — Aprovação.
--   * Departamento 11 — Suprimentos PP (9069810185).
--   * Situação diferente de Cancelado: pedido ainda presente no Omie
--     (ausencias_varreduras = 0). A sincronização não traz pedidos cancelados
--     (lExibirPedidosCancelados = 'N'); eles somem da lista e são arquivados.
--     Limitação: encerrados também não vêm (lExibirPedidosEncerrados = 'N').
--   * Material pelo código do produto no Omie (qualquer categoria; antes só 2.01.03).
--   * Data de inclusão do pedido; quantidade total comprada; valor total do item.
-- Última compra / último preço: regra anterior, sem alteração.
-- Colunas existentes mantidas (nomes e tipos); novas no fim:
--   quantidade_45d, preco_medio_45d, quantidade_60d, preco_medio_60d.
-- Teste em 22/10 (30 dias): PP 5,9703 (85.000 kg) -> 6,1850 (62.000 kg);
-- PP Extrusado 5,00 (1.000 kg) -> sem média; PET/PE e Rafia iguais.
-- Também usada pela tela Nec. Compra MP (preco_medio_30d), que acompanha.
create or replace view public.precos_materia_prima_omie as
 WITH base AS (
         SELECT i.cod_ped_compra,
            i.numero_pedido,
            i.etapa,
            i.data_previsao,
            i.data_inclusao,
            i.codigo_produto,
            i.codigo_produto_omie,
            i.descricao,
            i.unidade,
            i.categoria,
            i.quantidade,
            i.quantidade_recebida,
            i.quantidade_pendente,
            i.preco_unitario,
            i.valor_total,
            i.codigo_local_estoque,
                CASE
                    WHEN i.data_inclusao ~ '^\d{2}/\d{2}/\d{4}$'::text THEN to_date(i.data_inclusao, 'DD/MM/YYYY'::text)
                    ELSE NULL::date
                END AS data_compra
           FROM compras_materia_prima_itens_omie i
        ), ultima AS (
         SELECT DISTINCT ON (base.codigo_produto_omie) base.codigo_produto_omie,
            base.codigo_produto,
            base.descricao,
            base.unidade,
            base.data_compra AS ultima_compra,
                CASE
                    WHEN base.quantidade > 0::numeric THEN base.valor_total / base.quantidade
                    ELSE 0::numeric
                END AS ultimo_preco,
            base.quantidade AS quantidade_ultima_compra
           FROM base
          WHERE base.data_compra IS NOT NULL
          ORDER BY base.codigo_produto_omie, base.data_compra DESC, base.cod_ped_compra DESC
        ), compras_media AS (
         -- Regra da média (22/10): etapa 15 (Aprovação), departamento 11 Suprimentos PP
         -- (9069810185), situação diferente de Cancelado (pedido ainda presente no Omie:
         -- a sincronização não traz cancelados), material pelo código do produto no Omie
         -- (qualquer categoria), data de inclusão, quantidade total e valor total do item.
         SELECT NULLIF(item.value ->> 'codigo_produto'::text, ''::text)::bigint AS codigo_produto_omie,
            to_date(p.snapshot ->> 'data_inclusao'::text, 'DD/MM/YYYY'::text) AS data_compra,
            COALESCE(NULLIF(item.value ->> 'quantidade'::text, ''::text)::numeric, 0::numeric) AS quantidade,
            COALESCE(NULLIF(item.value ->> 'valor_total'::text, ''::text)::numeric, 0::numeric) AS valor_total
           FROM pedidos_compra_omie p
             CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.snapshot -> 'itens'::text, '[]'::jsonb)) item(value)
          WHERE (p.snapshot ->> 'etapa'::text) = '15'::text
            AND p.ausencias_varreduras = 0
            AND (p.snapshot ->> 'data_inclusao'::text) ~ '^\d{2}/\d{2}/\d{4}$'::text
            AND (EXISTS ( SELECT 1
                   FROM jsonb_array_elements(COALESCE(p.snapshot -> 'departamentos'::text, '[]'::jsonb)) d(value)
                  WHERE (d.value ->> 'cCodDepto'::text) = '9069810185'::text))
        ), medias AS (
         SELECT compras_media.codigo_produto_omie,
            sum(compras_media.quantidade) FILTER (WHERE compras_media.data_compra >= (CURRENT_DATE - 30)) AS q30,
            sum(compras_media.valor_total) FILTER (WHERE compras_media.data_compra >= (CURRENT_DATE - 30)) AS v30,
            sum(compras_media.quantidade) FILTER (WHERE compras_media.data_compra >= (CURRENT_DATE - 45)) AS q45,
            sum(compras_media.valor_total) FILTER (WHERE compras_media.data_compra >= (CURRENT_DATE - 45)) AS v45,
            sum(compras_media.quantidade) AS q60,
            sum(compras_media.valor_total) AS v60
           FROM compras_media
          WHERE compras_media.codigo_produto_omie IS NOT NULL
            AND compras_media.quantidade > 0::numeric
            AND compras_media.data_compra >= (CURRENT_DATE - 60)
            AND compras_media.data_compra <= CURRENT_DATE
          GROUP BY compras_media.codigo_produto_omie
        )
 SELECT u.codigo_produto_omie,
    u.codigo_produto,
    u.descricao,
    u.unidade,
    u.ultima_compra,
    u.ultimo_preco,
    u.quantidade_ultima_compra,
    COALESCE(m.q30, 0::numeric) AS quantidade_30d,
    COALESCE(m.v30 / NULLIF(m.q30, 0::numeric), 0::numeric) AS preco_medio_30d,
    COALESCE(m.q45, 0::numeric) AS quantidade_45d,
    COALESCE(m.v45 / NULLIF(m.q45, 0::numeric), 0::numeric) AS preco_medio_45d,
    COALESCE(m.q60, 0::numeric) AS quantidade_60d,
    COALESCE(m.v60 / NULLIF(m.q60, 0::numeric), 0::numeric) AS preco_medio_60d
   FROM ultima u
     LEFT JOIN medias m USING (codigo_produto_omie)
;

comment on view public.precos_materia_prima_omie is
  'Tabela de Preços MP. Média (30/45/60 dias): etapa 15, departamento 11 Suprimentos PP (9069810185), pedido ainda presente no Omie (não cancelado), material pelo código do produto, data de inclusão, quantidade total e valor total do item. Última compra: regra anterior (categoria 2.01.03).';
