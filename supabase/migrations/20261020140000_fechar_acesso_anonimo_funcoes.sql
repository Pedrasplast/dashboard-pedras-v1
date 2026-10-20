-- Fecha o acesso SEM LOGIN (anon / PUBLIC) a funções SECURITY DEFINER que
-- gravam dados e são usadas pelo app. O app só chama essas funções com
-- usuário logado (role authenticated, conferido nos logs), que mantém acesso.
--
-- Rollback: supabase/rollback/20261020_acesso_anonimo_funcoes_ORIGINAL.sql
revoke execute on function public.excluir_produto_v2(text) from public, anon;
revoke execute on function public.salvar_cadastro_produto_v3(text,text,numeric,boolean,integer,numeric,numeric,numeric,numeric,numeric,text,bigint) from public, anon;
revoke execute on function public.salvar_receita_materia_prima_v3(bigint,text,text,jsonb,jsonb) from public, anon;

grant execute on function public.excluir_produto_v2(text) to authenticated;
grant execute on function public.salvar_cadastro_produto_v3(text,text,numeric,boolean,integer,numeric,numeric,numeric,numeric,numeric,text,bigint) to authenticated;
grant execute on function public.salvar_receita_materia_prima_v3(bigint,text,text,jsonb,jsonb) to authenticated;
