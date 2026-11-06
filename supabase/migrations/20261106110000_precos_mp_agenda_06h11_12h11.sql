-- Preço médio de matéria-prima: uma rotina só, às 06:11 e 12:11
-- (horário de Brasília = 09:11 e 15:11 UTC), de segunda a sexta.
-- Substitui 20261106105000_precos_mp_agenda_06h_12h36.sql, que usava
-- duas rotinas por ter minutos diferentes.
--
-- Por que o minuto 11:
--   06:11: nenhuma outra rotina (o financeiro e o painel de MP acabam por
--     volta de 05:30; a conferência completa de pedidos de compra começa
--     às 06:30).
--   12:11: entre sincronizar-pedidos-compra-omie-1min das 12:10 e das
--     12:15 (mesmo método do Omie, PesquisarPedCompra, que só aceita uma
--     chamada por vez); de 12:11 a 12:14 nenhuma outra rotina roda.
--   A rotina leva no máximo ~2 min (prazo de 125 s).
--
-- Desfazer (volta para 07:41, 10:41, 13:41, 16:41):
--   select cron.alter_job(
--     (select jobid from cron.job where jobname = 'atualizar-precos-compras-mp-omie'),
--     schedule := '41 10,13,16,19 * * 1-5');

select cron.unschedule('atualizar-precos-compras-mp-omie-12h36')
where exists (select 1 from cron.job where jobname = 'atualizar-precos-compras-mp-omie-12h36');

select cron.alter_job(
  (select jobid from cron.job where jobname = 'atualizar-precos-compras-mp-omie'),
  schedule := '11 9,15 * * 1-5'
);
