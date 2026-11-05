-- Remove a tela "Dashboard de Produtividade" (em construção, descontinuada em 05/11/2026).
--
-- A tela tinha id 4 em telas_sistema e 10 linhas em usuario_permissoes,
-- todas com permitido = false (ninguém tinha acesso).
-- A FK usuario_permissoes.tela_id é ON DELETE CASCADE, então as permissões
-- saem junto.
--
-- Rollback: supabase/rollback/20261105_remover_tela_dashboard_produtividade_rollback.sql

delete from public.telas_sistema
where chave = 'dashboard_produtividade';
