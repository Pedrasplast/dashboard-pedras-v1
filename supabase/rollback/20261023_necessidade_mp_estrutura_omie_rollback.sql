-- Rollback da estrutura Omie da Nec. Compra MP (20261023120000 e 20261023120100).
select cron.unschedule('atualizar-estrutura-produtos-omie');
drop function if exists public.gravar_necessidade_mp_estrutura(jsonb, jsonb);
drop table if exists public.necessidade_mp_estrutura_itens_omie;
drop table if exists public.necessidade_mp_estrutura_produtos_omie;
