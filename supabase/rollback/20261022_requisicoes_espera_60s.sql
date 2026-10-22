-- Desfaz 20261022123000_requisicoes_espera_180s.sql
select cron.alter_job(
  job_id  := (select jobid from cron.job where jobname = 'sincronizar-requisicoes-compra-omie-2min'),
  command := replace((select command from cron.job where jobname = 'sincronizar-requisicoes-compra-omie-2min'),
                     'timeout_milliseconds := 180000', 'timeout_milliseconds := 60000')
);
