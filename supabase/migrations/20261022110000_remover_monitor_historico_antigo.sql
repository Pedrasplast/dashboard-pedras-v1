-- Remove a primeira versão da consulta de histórico do monitoramento
-- (sem duração), substituída por monitor_historico_execucoes.
-- Sem dependências e sem permissão para ninguém. Executado manualmente no
-- SQL Editor em 22/10 (o MCP cancela comandos DROP).
drop function if exists public.monitor_historico(text, integer);
