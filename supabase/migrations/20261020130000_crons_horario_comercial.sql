-- Crons de integração com o Omie só em horário comercial: segunda a sexta,
-- 07:00–17:59 (America/Sao_Paulo) = 10:00–20:59 UTC (pg_cron roda em GMT).
-- A frequência dentro do horário NÃO muda. Fora do horário não há execuções;
-- a primeira rodada do dia recupera tudo (pedidos usam cursor; estoque,
-- requisições e compras futuras leem a posição completa).
--
-- Exceções:
--  - financeiro: mantém 05:00 e 12:00 (BRT), só em dias úteis.
--  - conferência completa de pedidos de compra: 03:10 -> 06:30 (BRT) em dias
--    úteis; a continuação roda das 06:00 às 17:59 para terminá-la (~1h30).
--  - limpezas e monitoramento (jobs 17, 18, 19) não mudam.
--
-- Rollback: supabase/rollback/20261020_cron_horarios_ORIGINAIS.sql
select cron.alter_job(jobid, schedule := v.schedule)
from (values
  ('sincronizar-pedidos-omie-15min',                '*/15 10-20 * * 1-5'),
  ('sincronizar-financeiro-omie-05h-12h',           '0,10,20,30 8,15 * * 1-5'),
  ('reconciliar-status-pedidos-omie-horario',       '4-59/15 10-20 * * 1-5'),
  ('sincronizar-estoque-omie-rapido-5min',          '8-59/15 10-20 * * 1-5'),
  ('sincronizar-estoque-omie-completo-horario',     '2 10-20 * * 1-5'),
  ('sincronizar-pedidos-compra-omie-1min',          '*/5 10-20 * * 1-5'),
  ('conferencia-completa-pedidos-compra-madrugada', '30 9 * * 1-5'),
  ('sincronizar-requisicoes-compra-omie-2min',      '*/10 10-20 * * 1-5'),
  ('continuar-conferencia-completa-pedidos-compra', '2-57/5 9-20 * * 1-5'),
  ('sincronizar-estoque-mp-matriz-30min',           '15,45 10-20 * * 1-5'),
  ('atualizar-compras-futuras-mp-30min',            '7,37 10-20 * * 1-5')
) as v(jobname, schedule)
join cron.job j using (jobname);
