-- Requisições de compra: o cron passa a esperar a resposta da função por até
-- 180 s (antes 60 s), como as demais rotinas longas.
-- Em 22/10 às 09:20 uma requisição nova fez a função buscar o número na
-- auditoria do Omie por ~132 s; a função terminou com sucesso, mas o pg_net
-- desistiu aos 60 s e o monitoramento registrou "Tempo limite excedido".
select cron.alter_job(
  job_id  := (select jobid from cron.job where jobname = 'sincronizar-requisicoes-compra-omie-2min'),
  command := replace((select command from cron.job where jobname = 'sincronizar-requisicoes-compra-omie-2min'),
                     'timeout_milliseconds := 60000', 'timeout_milliseconds := 180000')
);
