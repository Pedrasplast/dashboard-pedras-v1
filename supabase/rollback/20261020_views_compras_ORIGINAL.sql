-- ROLLBACK: views voltam a rodar com as permissões do dono (estado anterior).
alter view public.pedidos_compra_front reset (security_invoker);
alter view public.requisicoes_compra_front reset (security_invoker);
