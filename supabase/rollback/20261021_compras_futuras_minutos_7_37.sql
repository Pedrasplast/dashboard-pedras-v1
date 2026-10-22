-- Desfaz 20261021140000_compras_futuras_minutos_9_39.sql
select cron.alter_job(
  job_id   := (select jobid from cron.job where jobname = 'atualizar-compras-futuras-mp-30min'),
  schedule := '7,37 10-20 * * 1-5'
);
