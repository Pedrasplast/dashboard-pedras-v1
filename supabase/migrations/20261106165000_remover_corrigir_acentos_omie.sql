-- Remove a função auxiliar criada em 20261106163000_corrigir_acentos_estoque_omie.sql.
-- Ela foi usada uma vez só; quem corrige os acentos agora é a função
-- sincronizar-estoque-omie (v8), a cada sincronização completa.

drop function if exists private.corrigir_acentos_omie(text);
