-- Rollback da conferência rápida da coluna Aprovação (28/10/2026).
--
-- 1. Publique de novo a versão anterior da Edge Function cron-pedidos-compra-omie
--    (git show <commit-anterior>:supabase/functions/cron-pedidos-compra-omie/index.ts),
--    com verify_jwt = false. Sem isso a função chamaria uma RPC inexistente — a falha
--    fica só na mensagem da conferência e a incremental continua gravando normalmente.
--
-- 2. Remova a função de conciliação rápida:
drop function if exists public.conciliar_rapida_pedidos_compra_aprovacao(bigint[], integer);

-- 3. (Opcional) Pedidos escondidos pela conferência rápida têm ausencias_varreduras = 1.
--    A conferência completa diária devolve os que ainda estiverem na Aprovação e
--    arquiva os demais; não é necessário mexer manualmente.
