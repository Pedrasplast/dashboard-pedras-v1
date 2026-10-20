-- ROLLBACK: permissões exatamente como estavam antes de 2026-10-20.
-- Funções
grant execute on function public.definir_receita_padrao_produto(text,bigint) to authenticated;
grant execute on function public.definir_receita_padrao_produto_v2(text,bigint) to public, authenticated;
grant execute on function public.desativar_receita_materia_prima(bigint) to authenticated;
grant execute on function public.desativar_receita_materia_prima_v2(bigint) to authenticated;
grant execute on function public.excluir_receita_materia_prima_v3(bigint) to authenticated;
grant execute on function public.salvar_receita_materia_prima(bigint,text,text,jsonb) to authenticated;
grant execute on function public.listar_injetoras_programacao() to authenticated;
grant execute on function public.marcar_notificacao_pedido_lida(bigint) to authenticated;
grant execute on function public.marcar_todas_notificacoes_pedidos_lidas() to authenticated;
grant execute on function public.salvar_programacao_producao(text,timestamp with time zone,jsonb) to public, authenticated;
grant execute on function public.salvar_programacao_producao_simples(text,timestamp with time zone,integer) to public;
grant execute on function public.salvar_programacao_producao_configuracao(text,timestamp with time zone,integer,boolean,boolean) to public, authenticated;
grant execute on function public.salvar_programacao_producao_configuracao_v2(text,timestamp with time zone,integer,boolean,integer,boolean,integer) to public;
grant execute on function public.salvar_programacao_producao_configuracao_v3(text,text,timestamp with time zone,integer,boolean,integer,boolean,integer) to authenticated;
-- Views
grant truncate, references, trigger, maintain on public.consumo_pedidos_materia_prima_resumo to anon;
grant select, truncate, references, trigger, maintain on public.consumo_pedidos_materia_prima_resumo to authenticated;
grant truncate, references, trigger, maintain on public.consumo_pedidos_materia_prima_detalhe to anon;
grant select, truncate, references, trigger, maintain on public.consumo_pedidos_materia_prima_detalhe to authenticated;
grant truncate, references, trigger, maintain on public.materia_prima_itens_omie_disponiveis to anon;
grant select, truncate, references, trigger, maintain on public.materia_prima_itens_omie_disponiveis to authenticated;
grant truncate, references, trigger, maintain on public.materia_prima_produtos_cadastro to anon;
grant select, truncate, references, trigger, maintain on public.materia_prima_produtos_cadastro to authenticated;
grant select on public.vw_materia_prima_necessidade to authenticated;
grant select on public.vw_materia_prima_produtos_sem_peso to authenticated;
grant select on public.vw_materia_prima_tabela_preco to authenticated;
grant select on public.vw_materia_prima_compras_futuras_abertas to authenticated;
-- Tabelas
grant truncate, references, trigger, maintain on public.backup_migracao_produtos_usa_pp_20261016 to anon, authenticated;
grant truncate, references, trigger, maintain on public.materia_prima_entradas to anon;
grant insert, select, update, truncate, references, trigger, maintain on public.materia_prima_entradas to authenticated;
grant truncate, references, trigger, maintain on public.programacao_producao to anon;
grant all on public.programacao_producao to authenticated;
grant truncate, references, trigger, maintain on public.programacao_producao_dias to anon;
grant all on public.programacao_producao_dias to authenticated;
grant all on public.materia_prima_produto_receitas to authenticated;
