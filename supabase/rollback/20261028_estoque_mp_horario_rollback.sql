-- Volta o estoque de matéria-prima aos minutos 15 e 45.
select cron.alter_job(jobid, schedule := '15,45 10-20 * * 1-5')
from cron.job where jobname = 'sincronizar-estoque-mp-matriz-30min';

-- A versão anterior da Edge Function sincronizar-estoque-materia-prima-omie
-- (que lia a view materiais_compra_omie) está no histórico do git:
-- git show <commit-anterior>:supabase/functions/sincronizar-estoque-materia-prima-omie/index.ts
