-- ROLLBACK: horários originais dos crons (UTC), antes de 2026-10-20.
select cron.alter_job(jobid, schedule := v.schedule)
from (values
  ('sincronizar-pedidos-omie-15min',                '*/15 * * * *'),
  ('sincronizar-financeiro-omie-05h-12h',           '0,10,20,30 8,15 * * *'),
  ('reconciliar-status-pedidos-omie-horario',       '4-59/15 * * * *'),
  ('sincronizar-estoque-omie-rapido-5min',          '8-59/15 * * * *'),
  ('sincronizar-estoque-omie-completo-horario',     '2 * * * *'),
  ('sincronizar-pedidos-compra-omie-1min',          '*/5 * * * *'),
  ('conferencia-completa-pedidos-compra-madrugada', '10 6 * * *'),
  ('sincronizar-requisicoes-compra-omie-2min',      '*/10 * * * *'),
  ('continuar-conferencia-completa-pedidos-compra', '2-57/5 * * * *'),
  ('sincronizar-estoque-mp-matriz-30min',           '15,45 * * * *'),
  ('atualizar-compras-futuras-mp-30min',            '7,37 * * * *')
) as v(jobname, schedule)
join cron.job j using (jobname);
