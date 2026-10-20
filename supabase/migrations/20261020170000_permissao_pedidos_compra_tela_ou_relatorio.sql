-- Leitura de pedidos de compra: tela "Pedidos de Compra" OU relatório
-- "Pedidos de compra alterados" (antes: só o relatório).
--
-- Motivo: a tela de Pedidos de Compra lê pedidos_compra_omie (via views com
-- security_invoker), o status da sincronização e o cache de fornecedores. As
-- regras dessas tabelas exigiam a permissão do RELATÓRIO, então um usuário com
-- só a TELA liberada veria a tela vazia e sem nomes de fornecedores.
--
-- O histórico de alterações (pedidos_compra_alteracoes_historico) e a função do
-- relatório (listar_relatorio_pedidos_compra_alterados) continuam exigindo a
-- permissão do relatório.
--
-- Rollback: supabase/rollback/20261020_permissao_pedidos_compra_ORIGINAL.sql

create or replace function public.pode_ver_pedidos_compra()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select auth.uid() is not null
     and (
       private.usuario_tem_permissao_tela('pedidos_compra')   -- inclui admin
       or public.pode_ver_pedidos_compra_alterados()
     );
$$;

revoke execute on function public.pode_ver_pedidos_compra() from public, anon;
grant execute on function public.pode_ver_pedidos_compra() to authenticated, service_role;

alter policy pedidos_compra_leitura on public.pedidos_compra_omie
  using ((select public.pode_ver_pedidos_compra()));

alter policy pedidos_compra_sync_leitura on public.sincronizacao_pedidos_compra_omie
  using ((select public.pode_ver_pedidos_compra()));

alter policy pedidos_compra_fornecedores_leitura on public.pedidos_compra_fornecedores
  using ((select public.pode_ver_pedidos_compra()));
