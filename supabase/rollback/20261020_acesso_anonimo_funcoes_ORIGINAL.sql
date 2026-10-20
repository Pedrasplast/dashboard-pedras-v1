-- ROLLBACK: devolve EXECUTE a PUBLIC (estado anterior a 2026-10-20).
grant execute on function public.excluir_produto_v2(text) to public;
grant execute on function public.salvar_cadastro_produto_v3(text,text,numeric,boolean,integer,numeric,numeric,numeric,numeric,numeric,text,bigint) to public;
grant execute on function public.salvar_receita_materia_prima_v3(bigint,text,text,jsonb,jsonb) to public;
