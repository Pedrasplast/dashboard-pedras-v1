-- Estoque rápido: sem a execução das :08 (seis minutos depois da completa das
-- :02, mudava quase nada e era o horário com mais conflitos no Omie).
-- Continuação da conferência completa de pedidos de compra: só até 11:57
-- (a conferência começa 06:30 e termina por volta de 08:15).
select cron.alter_job(
  job_id   := (select jobid from cron.job where jobname = 'sincronizar-estoque-omie-rapido-5min'),
  schedule := '23,38,53 10-20 * * 1-5'
);
select cron.alter_job(
  job_id   := (select jobid from cron.job where jobname = 'continuar-conferencia-completa-pedidos-compra'),
  schedule := '2-57/5 9-14 * * 1-5'
);
