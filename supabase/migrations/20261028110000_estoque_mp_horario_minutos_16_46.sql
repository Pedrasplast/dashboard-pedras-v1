-- Estoque de matéria-prima: 15,45 -> 16,46 (UTC 10-20 = 07:00-17:59 BRT, seg a sex).
--
-- Em 28/10/2026 às 11:15 BRT a rotina falhou com "canceling statement due to
-- statement timeout": disparava no mesmo segundo que pedidos de venda (*/15) e
-- pedidos de compra (*/5). Os minutos 16 e 46 não coincidem com nenhuma outra
-- rotina (17 e 47 coincidiriam com a continuação da conferência completa, 2-57/5).
-- Junto com isso, a Edge Function deixou de ler a view materiais_compra_omie.
--
-- Rollback: supabase/rollback/20261028_estoque_mp_horario_rollback.sql
select cron.alter_job(jobid, schedule := '16,46 10-20 * * 1-5')
from cron.job where jobname = 'sincronizar-estoque-mp-matriz-30min';
