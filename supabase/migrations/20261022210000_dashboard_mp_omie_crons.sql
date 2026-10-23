-- Agendamentos do Dashboard MP (origem Omie), dias úteis, em horários sem
-- outras rotinas do Omie (UTC; Brasília = UTC-3):
--   08:13 e 21:13 — pedidos incluídos nos últimos 30 dias      (05:13 e 18:13)
--   08:18         — pedidos de 31 a 60 dias (recebimento/valores) (05:18)
--   08:24 e 21:24 — notas de entrada (emissão nos últimos 60 dias) (05:24 e 18:24)
-- Cada chamada lê ~90 dias de previsão no Omie (~60-80 s), dentro do limite.
-- Monitoradas pela tela de Monitoramento (monitor_disparar).
-- Rollback: select cron.unschedule('<nome>') para os três nomes abaixo.

select cron.schedule(
  'atualizar-dashboard-mp-omie-pedidos-recentes',
  '13 8,21 * * 1-5',
  $$select public.monitor_disparar('atualizar-dashboard-mp-omie-pedidos-recentes',
    url := (select decrypted_secret from vault.decrypted_secrets where name='project_url') || '/functions/v1/sincronizar-dashboard-mp-omie',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='cron_pedidos_compra_token')),
    body := jsonb_build_object('tipo','pedidos','de',(current_date - 30)::text,'ate',current_date::text),
    timeout_milliseconds := 150000) as request_id;$$
);

select cron.schedule(
  'atualizar-dashboard-mp-omie-pedidos-anteriores',
  '18 8 * * 1-5',
  $$select public.monitor_disparar('atualizar-dashboard-mp-omie-pedidos-anteriores',
    url := (select decrypted_secret from vault.decrypted_secrets where name='project_url') || '/functions/v1/sincronizar-dashboard-mp-omie',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='cron_pedidos_compra_token')),
    body := jsonb_build_object('tipo','pedidos','de',(current_date - 60)::text,'ate',(current_date - 31)::text),
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
