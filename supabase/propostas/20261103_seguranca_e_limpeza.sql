-- =====================================================================
-- PROPOSTAS — NÃO APLICADAS
-- ---------------------------------------------------------------------
-- Levantadas na auditoria (somente leitura) de 03/11/2026.
-- Cada bloco é independente. Aplicar só depois de aprovado, um por vez,
-- e conferir a tela indicada logo em seguida.
-- =====================================================================


-- ---------------------------------------------------------------------
-- P1. Funções sem search_path fixo (aviso do Supabase)
-- Risco: baixo. São SECURITY INVOKER e usam nomes sem schema; fixar
-- "public, pg_temp" mantém exatamente a mesma resolução de hoje.
-- Conferir: registrar e estornar um recebimento físico (Pedidos de Compra).
-- ---------------------------------------------------------------------
alter function public.registrar_recebimento_fisico_item(bigint, bigint, numeric, text, text)
  set search_path = public, pg_temp;
alter function public.estornar_recebimento_fisico_item(bigint, bigint, numeric, text, text)
  set search_path = public, pg_temp;


-- ---------------------------------------------------------------------
-- P2. Política de INSERT reavalia auth.uid() por linha (desempenho)
-- Risco: nenhum na regra (mesma condição). Conferir: registrar recebimento.
-- ---------------------------------------------------------------------
alter policy recebimento_fisico_insercao on public.pedidos_compra_recebimentos_fisicos
  with check (usuario_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- P3. parametros_produto legível sem login
-- Hoje a política "Permitir leitura parametros_produto" vale para anon.
-- O site só lê essa tabela em telas logadas (Cadastros e Produtos PP).
-- Conferir: Cadastro de Produto e Matéria-Prima > Produtos.
-- ---------------------------------------------------------------------
alter policy "Permitir leitura parametros_produto" on public.parametros_produto
  to authenticated;


-- ---------------------------------------------------------------------
-- P4. Limpeza de objetos de teste/backup no schema public
-- Confirme antes que ninguém usa (nenhum é lido pelo site).
-- Risco: irreversível sem backup — exporte antes se quiser guardar.
-- ---------------------------------------------------------------------
-- drop view  if exists public.precos_mp_periodos_teste;
-- drop table if exists public.precos_mp_historico_teste;
-- drop table if exists public.backup_migracao_produtos_usa_pp_20261016;
-- Edge Functions de teste (painel ou CLI):
--   supabase functions delete precos-mp-staging-teste
--   supabase functions delete probe-estoque-mp-temp
--   supabase functions delete probe-coluna-aprovacao-temp
--   (e as probe-* / *-temp com verify_jwt, já desativadas com 410)


-- ---------------------------------------------------------------------
-- P5. Views SECURITY DEFINER (alerta "ERROR" do Supabase)
-- compras_futuras_materia_prima_omie e precos_materia_prima_omie leem
-- tabelas SEM política de leitura (compras_mp_pendentes_confirmados,
-- precos_compras_mp_omie). Por isso funcionam: rodam como o dono.
-- NÃO basta trocar para security_invoker — as telas ficariam vazias.
-- Quem lê: Necessidade de MP (compras_futuras_materia_prima_omie) e
-- Tabela de Preços (precos_materia_prima_omie).
-- Correção completa (dar leitura a quem tem a tela, depois trocar):
-- Conferir: Necessidade de MP e Tabela de Preços, com um operador.
-- ---------------------------------------------------------------------
-- create policy compras_mp_pendentes_confirmados_select on public.compras_mp_pendentes_confirmados
--   for select to authenticated
--   using (private.usuario_tem_permissao_tela('necessidade_materia_prima') or private.usuario_eh_admin());
-- create policy precos_compras_mp_omie_select on public.precos_compras_mp_omie
--   for select to authenticated
--   using (private.usuario_tem_permissao_tela('tabela_precos_materia_prima') or private.usuario_tem_permissao_tela('necessidade_materia_prima') or private.usuario_eh_admin());
-- alter view public.compras_futuras_materia_prima_omie set (security_invoker = true);
-- alter view public.precos_materia_prima_omie set (security_invoker = true);
-- (chaves conferidas em public.telas_sistema em 03/11/2026)


-- ---------------------------------------------------------------------
-- P6. Auth: proteção contra senhas vazadas
-- Painel > Authentication > Policies > "Leaked password protection".
-- ---------------------------------------------------------------------
