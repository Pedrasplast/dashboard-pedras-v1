-- Views de compras passam a respeitar as permissões (RLS) de quem consulta.
--
-- pedidos_compra_front: antes, qualquer usuário logado lia os 6.742 pedidos de
-- compra pela API, mesmo sem permissão. Agora vale a regra da tabela
-- pedidos_compra_omie (admin ou permissão do relatório "pedidos-compra-alterados").
-- Testado por usuário (transação desfeita): os 4 usuários com a tela de Pedidos
-- de Compra continuam vendo tudo; os 4 sem essa tela deixam de ver (não usam
-- nenhuma tela que leia esta view).
--
-- requisicoes_compra_front: regra da tabela permite qualquer usuário logado;
-- resultado idêntico para todos (testado).
--
-- compras_futuras_materia_prima_omie NÃO foi alterada: com security_invoker
-- daria "permission denied" para todos (compras_mp_pendentes_confirmados não tem
-- política de leitura) e usuários da tela de matéria-prima sem permissão de
-- pedidos de compra perderiam os dados. Fica como SECURITY DEFINER de propósito.
--
-- Rollback: supabase/rollback/20261020_views_compras_ORIGINAL.sql
alter view public.pedidos_compra_front set (security_invoker = true);
alter view public.requisicoes_compra_front set (security_invoker = true);
