-- Relatório "Entradas e Compras de Matéria-Prima" passa a ler os dados do
-- Omie (view dashboard_mp_compras_omie, security_invoker): quem tem a tela
-- Relatórios também pode ler os pedidos e notas do Omie.
-- Rollback:
--   drop policy dashboard_mp_pedidos_omie_select_relatorios on public.dashboard_mp_pedidos_omie;
--   drop policy dashboard_mp_notas_omie_select_relatorios on public.dashboard_mp_notas_omie;
create policy dashboard_mp_pedidos_omie_select_relatorios on public.dashboard_mp_pedidos_omie
  for select to authenticated
  using ((select private.usuario_tem_permissao_tela('relatorios')));
create policy dashboard_mp_notas_omie_select_relatorios on public.dashboard_mp_notas_omie
  for select to authenticated
  using ((select private.usuario_tem_permissao_tela('relatorios')));
