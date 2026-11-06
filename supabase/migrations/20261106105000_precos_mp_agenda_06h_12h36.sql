-- Preço médio de matéria-prima: 06:00 e 12:36 (horário de Brasília),
-- de segunda a sexta. Substitui a agenda 07:01/12:01 de
-- 20261106103000_precos_mp_agenda_07h_12h.sql.
--
-- Os dois horários têm minutos diferentes e não cabem numa expressão
-- cron só, por isso são duas rotinas com o mesmo comando:
--   atualizar-precos-compras-mp-omie        → 06:00 (09:00 UTC)
--   atualizar-precos-compras-mp-omie-12h36  → 12:36 (15:36 UTC)
-- Cada uma registra no monitoramento com o próprio nome.
--
-- Por que esses horários:
--   06:00: nenhuma rotina roda (o financeiro e o painel de MP acabam por
--     volta de 05:30; a conferência completa de pedidos de compra começa
--     às 06:30).
--   12:36: entre sincronizar-pedidos-compra-omie-1min das 12:35 e das
--     12:40 (mesmo método do Omie, PesquisarPedCompra, que só aceita uma
--     chamada por vez) e longe do grupo das 12:30 (pedidos de compra,
--     pedidos de venda, requisições e financeiro).
--
-- Desfazer (volta para 07:41, 10:41, 13:41, 16:41):
--   select cron.unschedule('atualizar-precos-compras-mp-omie-12h36');
--   select cron.alter_job(
--     (select jobid from cron.job where jobname = 'atualizar-precos-compras-mp-omie'),
--     schedule := '41 10,13,16,19 * * 1-5');

select cron.alter_job(
  (select jobid from cron.job where jobname = 'atualizar-precos-compras-mp-omie'),
  schedule := '0 9 * * 1-5'
);

select cron.schedule(
  'atualizar-precos-compras-mp-omie-12h36',
  '36 15 * * 1-5',
  $cron$select public.monitor_disparar('atualizar-precos-compras-mp-omie-12h36',
    url := (select decrypted_secret from vault.decrypted_secrets where name='project_url') || '/functions/v1/sincronizar-precos-compras-mp-omie',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='cron_pedidos_compra_token')),
    body := '{}'::jsonb,
    timeout_milliseconds := 180000) as request_id;$cron$
);
