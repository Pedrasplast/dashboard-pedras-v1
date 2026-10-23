-- Rollback do Dashboard MP (origem Omie). Rodar no SQL Editor.
-- Remove só os objetos novos; a base manual (materia_prima_compras_futuras) não é tocada.
-- Antes: desagendar o cron 'atualizar-dashboard-mp-omie' (se criado):
--   select cron.unschedule('atualizar-dashboard-mp-omie-pedidos');
--   select cron.unschedule('atualizar-dashboard-mp-omie-notas');
begin;
drop view if exists public.dashboard_mp_compras_omie;
drop function if exists public.substituir_dashboard_mp_pedidos(date, date, jsonb);
drop function if exists public.substituir_dashboard_mp_notas(date, date, jsonb);
drop table if exists public.dashboard_mp_notas_omie;
drop table if exists public.dashboard_mp_pedidos_omie;
commit;
