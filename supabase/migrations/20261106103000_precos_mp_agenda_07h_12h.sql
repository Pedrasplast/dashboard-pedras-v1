-- Preço médio de matéria-prima (Tabela de Preços MP): passa de 4 vezes
-- por dia (07:41, 10:41, 13:41, 16:41) para 2 vezes, de segunda a sexta,
-- às 07:01 e 12:01 (horário de Brasília = 10:01 e 15:01 UTC).
-- Pedido do usuário em 06/11/2026: poucas movimentações por dia.
--
-- Por que :01 e não :00: às 07:00 e 12:00 já disparam juntas
-- sincronizar-pedidos-compra-omie-1min (usa o mesmo método do Omie,
-- PesquisarPedCompra, que só aceita uma chamada por vez),
-- sincronizar-pedidos-omie-15min, sincronizar-requisicoes-compra-omie-2min
-- e, às 12:00, sincronizar-financeiro-omie-05h-12h.
--
-- Desfazer:
--   select cron.alter_job(
--     (select jobid from cron.job where jobname = 'atualizar-precos-compras-mp-omie'),
--     schedule := '41 10,13,16,19 * * 1-5');

select cron.alter_job(
  (select jobid from cron.job where jobname = 'atualizar-precos-compras-mp-omie'),
  schedule := '1 10,15 * * 1-5'
);
