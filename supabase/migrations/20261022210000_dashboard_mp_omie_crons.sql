-- Agendamentos do Dashboard MP (origem Omie), dias úteis, em horários sem
-- outras rotinas do Omie (UTC; Brasília = UTC-3):
--   08:13 e 21:13 — pedidos incluídos/alterados nos últimos 7 dias (05:13 e 18:13)
--   08:24 e 21:24 — notas de entrada emitidas nos últimos 60 dias  (05:24 e 18:24)
-- Monitoradas pela tela de Monitoramento (monitor_disparar).
-- Rollback: select cron.unschedule('atualizar-dashboard-mp-omie-pedidos');
--           select cron.unschedule('atualizar-dashboard-mp-omie-notas');

select cron.schedule(
  'atualizar-dashboard-mp-omie-pedidos',
  '13 8,21 * * 1-5',
  $$select public.monitor_disparar('atualizar-dashboard-mp-omie-pedidos',
    url := (select decrypted_secret from vault.decrypted_secrets where name='project_url') || '/functions/v1/sincronizar-dashboard-mp-omie',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='cron_pedidos_compra_token')),
    body := jsonb_build_object('tipo','pedidos'),
    timeout_milliseconds := 150000) as request_id;$$
);

select cron.schedule(
  'atualizar-dashboard-mp-omie-notas',
  '24 8,21 * * 1-5',
  $$select public.monitor_disparar('atualizar-dashboard-mp-omie-notas',
    url := (select decrypted_secret from vault.decrypted_secrets where name='project_url') || '/functions/v1/sincronizar-dashboard-mp-omie',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='cron_pedidos_compra_token')),
    body := jsonb_build_object('tipo','notas'),
    timeout_milliseconds := 150000) as request_id;$$
);
