-- DESATIVA (não apaga) objetos sem uso: nenhuma referência no front (todas as
-- branches do GitHub), nas Edge Functions, em views/funções em uso ou nos
-- crons, e nenhuma chamada nos logs. Tira o acesso de anon/authenticated/PUBLIC;
-- dados e definições continuam intactos. Se algo reclamar ("permission denied"),
-- rodar o rollback. Depois de um período sem problemas, podem ser apagados.
--
-- Rollback: supabase/rollback/20261020_objetos_sem_uso_ORIGINAL.sql

-- Funções (versões antigas / substituídas)
revoke execute on function public.definir_receita_padrao_produto(text,bigint) from public, anon, authenticated;
revoke execute on function public.definir_receita_padrao_produto_v2(text,bigint) from public, anon, authenticated;
revoke execute on function public.desativar_receita_materia_prima(bigint) from public, anon, authenticated;
revoke execute on function public.desativar_receita_materia_prima_v2(bigint) from public, anon, authenticated;
revoke execute on function public.excluir_receita_materia_prima_v3(bigint) from public, anon, authenticated;
revoke execute on function public.salvar_receita_materia_prima(bigint,text,text,jsonb) from public, anon, authenticated;
revoke execute on function public.listar_injetoras_programacao() from public, anon, authenticated;
revoke execute on function public.marcar_notificacao_pedido_lida(bigint) from public, anon, authenticated;
revoke execute on function public.marcar_todas_notificacoes_pedidos_lidas() from public, anon, authenticated;
revoke execute on function public.salvar_programacao_producao(text,timestamp with time zone,jsonb) from public, anon, authenticated;
revoke execute on function public.salvar_programacao_producao_simples(text,timestamp with time zone,integer) from public, anon, authenticated;
revoke execute on function public.salvar_programacao_producao_configuracao(text,timestamp with time zone,integer,boolean,boolean) from public, anon, authenticated;
revoke execute on function public.salvar_programacao_producao_configuracao_v2(text,timestamp with time zone,integer,boolean,integer,boolean,integer) from public, anon, authenticated;
revoke execute on function public.salvar_programacao_producao_configuracao_v3(text,text,timestamp with time zone,integer,boolean,integer,boolean,integer) from public, anon, authenticated;

-- Views
revoke all on public.consumo_pedidos_materia_prima_resumo from anon, authenticated;
revoke all on public.consumo_pedidos_materia_prima_detalhe from anon, authenticated;
revoke all on public.materia_prima_itens_omie_disponiveis from anon, authenticated;
revoke all on public.materia_prima_produtos_cadastro from anon, authenticated;
revoke all on public.vw_materia_prima_necessidade from anon, authenticated;
revoke all on public.vw_materia_prima_produtos_sem_peso from anon, authenticated;
revoke all on public.vw_materia_prima_tabela_preco from anon, authenticated;
revoke all on public.vw_materia_prima_compras_futuras_abertas from anon, authenticated;

-- Tabelas (vazias, backup ou só usadas pelas funções acima)
revoke all on public.backup_migracao_produtos_usa_pp_20261016 from anon, authenticated;
revoke all on public.materia_prima_entradas from anon, authenticated;
revoke all on public.programacao_producao from anon, authenticated;
revoke all on public.programacao_producao_dias from anon, authenticated;
revoke all on public.materia_prima_produto_receitas from anon, authenticated;
