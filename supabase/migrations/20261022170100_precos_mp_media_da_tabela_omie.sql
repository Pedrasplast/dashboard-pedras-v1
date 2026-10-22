-- Tabela de Preços MP: médias passam a vir de precos_compras_mp_omie
-- (gravada 4x/dia direto do Omie). Substitui o cálculo sobre pedidos_compra_omie
-- de 20261022160000, que não tinha os encerrados e excluía pedidos que só
-- tinham mudado de situação. Mesmas colunas.
-- Conferido em 22/10 (30 dias): PP 14 compras R$ 5,7334; PE/PET 4 compras
-- R$ 1,6460 (igual ao teste do usuário); PP Extrusado R$ 5,00; Rafia R$ 5,30.
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
         -- Itens gravados pela rotina sincronizar-precos-compras-mp-omie (4x/dia):
         -- PesquisarPedCompra sem cancelados (inclui encerrados), etapa 15,
         -- departamento 11 Suprimentos PP, materiais cadastrados, data de inclusão.
         SELECT c.codigo_produto_omie,
            c.data_inclusao AS data_compra,
            c.quantidade,
            c.valor_total
           FROM precos_compras_mp_omie c
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
  'Tabela de Preços MP. Média (30/45/60 dias) de precos_compras_mp_omie, gravada 4x/dia direto do Omie: etapa 15, departamento 11 Suprimentos PP, sem cancelados (inclui encerrados), material pelo código, data de inclusão, quantidade total e valor total do item. Última compra: regra anterior (categoria 2.01.03).';

-- Rotina 07:41, 10:41, 13:41 e 16:41 (seg–sex), monitorada.
select cron.schedule(
  'atualizar-precos-compras-mp-omie',
  '41 10,13,16,19 * * 1-5',
  $c$select public.monitor_disparar('atualizar-precos-compras-mp-omie',
    url := (select decrypted_secret from vault.decrypted_secrets where name='project_url') || '/functions/v1/sincronizar-precos-compras-mp-omie',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='cron_pedidos_compra_token')),
    body := '{}'::jsonb,
    timeout_milliseconds := 180000) as request_id;$c$
);
