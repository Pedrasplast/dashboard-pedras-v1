# Edge Functions arquivadas (2026-10-20)

Código das Edge Functions que estavam publicadas no Supabase mas **não eram usadas**
por nenhuma tela (nenhuma branch), nenhum cron e nenhuma outra função. Em 2026-10-20 cada
uma foi substituída no Supabase por uma versão "desativada", que responde HTTP 410
sem acessar banco nem Omie.

Para reativar uma delas, publique de novo a pasta correspondente
(`supabase functions deploy <nome>`), com a mesma configuração de `verify_jwt`.

| Função | verify_jwt | Motivo |
|---|---|---|
| probe-requisicoes-omie | true | Teste de auditoria do Omie (código fixo) |
| probe-pedido-compra-contato | false | Teste de um pedido fixo (14552) |
| probe-pedidos-compra-ausentes | false | Diagnóstico pontual de ausentes |
| probe-numeros-requisicoes | false | Teste sem autenticação que devolvia dados do Omie |
| diagnostico-status-compra-mp | false | Diagnóstico pontual (chamado manualmente via SQL) |
| validar-estoque-materia-prima-omie | true | Diagnóstico somente leitura, substituído pela sincronização |
| arquivar-pedidos-compra-ausentes | false | Rotina única (esperava exatamente 80 ausentes) |
| reconciliar-status-pedidos-compra-omie | false | **Sem autenticação** e arquivava pedidos; período fixo set–out/2026 |
| sincronizar-pedidos-compra-omie | true | Substituída por `cron-pedidos-compra-omie` |
| sincronizar-requisicoes-omie | true | Já quebrada: usa tabela/RPC que não existem mais; substituída por `sincronizar-requisicoes-compra-omie` |

- `probe-numero-requisicao-temp` (22/10): diagnóstico do número da requisição
  14983 na auditoria do Omie. Mostrou que a auditoria é lenta (20–120 s), o que
  levou à v9 de `sincronizar-requisicoes-compra-omie`. Publicada como stub 410.
- `probe-situacao-pedidos-compra-temp` (22/10): situação real dos pedidos de
  compra no Omie para a regra da média de preços. Ver README da pasta.
- `probe-coluna-aprovacao-temp` (28/10): testou, somente leitura, quais filtros do
  `PesquisarPedCompra` reproduzem a coluna "Aprovação" do Omie. Resultado: "pendentes +
  faturados + parciais, sem recebidos/cancelados/encerrados" devolve exatamente os
  pedidos abertos da coluna (85, em 2 páginas), inclusive os que entram na Aprovação
  sem "alteração" registrada (invisíveis para `lApenasAlterados`). Base da conferência
  rápida em `cron-pedidos-compra-omie`. Publicada como stub 410.
- `probe-estoque-mp-temp` (28/10): leu, somente leitura, as posições de estoque do
  local de matéria-prima para comparar a rotina `sincronizar-estoque-materia-prima-omie`
  com e sem a view `materiais_compra_omie`. Resultado idêntico (5 materiais, mesmo
  código, descrição, ID e saldo); a view foi retirada da rotina. Publicada como stub 410.
  Usa `omie-retentativa.mjs` da rotina original.
