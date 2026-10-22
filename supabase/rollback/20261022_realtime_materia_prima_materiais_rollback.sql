-- Rollback de 20261022190000_realtime_materia_prima_materiais.sql
-- As telas voltam a atualizar só pelo intervalo (5-10 min) ou F5.
alter publication supabase_realtime drop table public.materia_prima_materiais;
