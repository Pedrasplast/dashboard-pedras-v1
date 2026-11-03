# Edge Functions

Código das funções publicadas no projeto Supabase **PedrasPlast**
(`rkfjhxcczgjyxfucytla`). O repositório é a fonte de verdade: altere aqui e
publique a partir daqui.

| Função                                   | Quem chama                                   | Proteção                                  |
| ---------------------------------------- | -------------------------------------------- | ----------------------------------------- |
| `sincronizar-pedidos-omie`               | pg_cron, a cada 15 min (seg–sex)             | JWT (`verify_jwt`)                        |
| `reconciliar-status-pedidos-omie`        | pg_cron, a cada 15 min (seg–sex)             | JWT (`verify_jwt`)                        |
| `sincronizar-financeiro-omie`            | pg_cron, 05h e 12h (seg–sex)                 | JWT (`verify_jwt`)                        |
| `sincronizar-estoque-omie`               | pg_cron, de hora em hora (seg–sex)           | JWT (`verify_jwt`)                        |
| `sincronizar-estoque-omie-rapido`        | pg_cron, a cada 15 min (seg–sex)             | JWT (`verify_jwt`)                        |
| `cron-pedidos-compra-omie`               | pg_cron, a cada 5 min + conferência diária   | `x-cron-secret`                           |
| `sincronizar-requisicoes-compra-omie`    | pg_cron, a cada 10 min                       | `x-cron-secret`                           |
| `sincronizar-estoque-materia-prima-omie` | pg_cron, a cada 30 min e tela de Estoque     | token do cron ou login                    |
| `sincronizar-compras-futuras-mp-omie`    | pg_cron, a cada 30 min                       | `x-cron-secret`                           |
| `sincronizar-precos-compras-mp-omie`     | pg_cron, 4x ao dia                           | `x-cron-secret`                           |
| `sincronizar-dashboard-mp-omie`          | pg_cron, 2x ao dia                           | `x-cron-secret`                           |
| `sincronizar-estrutura-omie`             | pg_cron, 3x ao dia                           | `x-cron-secret`                           |
| `nomes-fornecedores-pedidos-compra`      | tela de Pedidos de Compra                    | login (valida o JWT no código)            |
| `criar-usuario`                          | tela de Usuários                             | login + perfil admin                      |

Funções desativadas ou de diagnóstico ficam em `../functions_arquivadas`.

## Origem

`sincronizar-pedidos-omie` (v20), `sincronizar-financeiro-omie` (v6),
`sincronizar-estoque-omie` (v4) e `sincronizar-compras-futuras-mp-omie` (v5)
existiam só no Supabase. O código foi copiado sem alteração da versão publicada
em 03/11/2026.

## Publicar

```sh
supabase functions deploy <nome> --project-ref rkfjhxcczgjyxfucytla
```

As funções que usam `x-cron-secret` (ou `verify_jwt = false`) precisam manter
esse modo no deploy (`--no-verify-jwt`); confira na lista do painel antes.
