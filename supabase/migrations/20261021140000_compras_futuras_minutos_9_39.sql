-- Compras futuras MP: :07/:37 -> :09/:39.
-- Em :07/:37 também roda a continuação da conferência completa de pedidos de
-- compra (2-57/5), e as duas chamam PesquisarPedCompra no Omie ao mesmo tempo
-- ("Já existe uma requisição desse método sendo executada", visto às 07:37 de
-- 21/10). Em :09/:39 nenhuma outra rotina de compras roda.
select cron.alter_job(
  job_id   := (select jobid from cron.job where jobname = 'atualizar-compras-futuras-mp-30min'),
  schedule := '9,39 10-20 * * 1-5'
);
