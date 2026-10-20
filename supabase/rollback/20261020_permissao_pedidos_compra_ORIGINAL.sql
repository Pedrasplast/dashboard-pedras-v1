-- ROLLBACK: regras voltam a exigir só a permissão do relatório.
-- (Se a Edge Function nomes-fornecedores-pedidos-compra já chamar
--  pode_ver_pedidos_compra, republique a versão anterior dela ANTES de rodar
--  o drop abaixo.)
alter policy pedidos_compra_leitura on public.pedidos_compra_omie
  using ((select public.pode_ver_pedidos_compra_alterados()));
alter policy pedidos_compra_sync_leitura on public.sincronizacao_pedidos_compra_omie
  using ((select public.pode_ver_pedidos_compra_alterados()));
alter policy pedidos_compra_fornecedores_leitura on public.pedidos_compra_fornecedores
  using (public.pode_ver_pedidos_compra_alterados());
-- drop function public.pode_ver_pedidos_compra();
