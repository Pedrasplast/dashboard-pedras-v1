-- Desfaz 20261022120000_horarios_rapido_sem_08_conferencia_ate_12h.sql
select cron.alter_job(
  job_id   := (select jobid from cron.job where jobname = 'sincronizar-estoque-omie-rapido-5min'),
  schedule := '8-59/15 10-20 * * 1-5'
);
select cron.alter_job(
  job_id   := (select jobid from cron.job where jobname = 'continuar-conferencia-completa-pedidos-compra'),
  schedule := '2-57/5 9-20 * * 1-5'
);
