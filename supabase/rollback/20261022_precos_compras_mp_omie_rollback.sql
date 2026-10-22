-- Desfaz 20261022170000 e 20261022170100: tira a rotina e volta a média
-- para o cálculo sobre pedidos_compra_omie (20261022160000).
select cron.unschedule('atualizar-precos-compras-mp-omie');
-- Em seguida rode de novo supabase/migrations/20261022160000_precos_mp_media_regra_suprimentos_pp.sql
-- (ou supabase/rollback/20261022_precos_mp_media_ORIGINAL.sql para a média antiga).
-- Depois, se quiser apagar os objetos novos:
-- drop function if exists public.substituir_precos_compras_mp(date, jsonb);
-- drop table if exists public.precos_compras_mp_omie;
