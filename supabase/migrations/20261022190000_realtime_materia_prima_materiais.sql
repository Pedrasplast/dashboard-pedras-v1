-- Cadastro de Material em tempo real: Tabela de Preços e Necessidade de Compra
-- escutam materia_prima_materiais (hook useAtualizarAoAlterarMateriais) e
-- recarregam na hora ao habilitar/desabilitar um material.
-- Tabela pequena (7 linhas, poucas alterações): custo desprezível no plano free.
-- O Realtime respeita a política de SELECT (RLS) da tabela.
-- Rollback: supabase/rollback/20261022_realtime_materia_prima_materiais_rollback.sql
alter publication supabase_realtime add table public.materia_prima_materiais;
