-- Nec. Compra MP: leitura da estrutura Omie em dias úteis às 07:27, 11:27 e
-- 15:27 (Brasília; UTC 10:27, 14:27, 18:27), minuto sem outras rotinas do Omie.
-- Monitorada pela tela de Monitoramento (monitor_disparar).
-- Rollback: select cron.unschedule('atualizar-estrutura-produtos-omie');
select cron.schedule(
  'atualizar-estrutura-produtos-omie',
  '27 10,14,18 * * 1-5',
  $$select public.monitor_disparar('atualizar-estrutura-produtos-omie',
    url := (select decrypted_secret from vault.decrypted_secrets where name='project_url') || '/functions/v1/sincronizar-estrutura-omie',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='cron_pedidos_compra_token')),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000) as request_id;$$
);
