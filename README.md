# Dashboard Pedrasplast

Sistema interno da Pedrasplast (produção, estoque, compras, matéria-prima e
financeiro), integrado ao Omie.

## Arquitetura

- **Front-end:** React + TanStack Start (Vite), publicado na **Vercel** a partir
  da branch `main` deste repositório.
- **Banco e back-end:** Supabase (projeto `PedrasPlast`) — Postgres, Auth,
  Realtime, Edge Functions e crons (`pg_cron`).
- **Integração Omie:** Edge Functions em `supabase/functions/`, disparadas pelos
  crons em horário comercial (seg–sex, 07:00–17:59).

## Desenvolvimento

Requer Node.js e npm.

```sh
npm install
npm run dev          # ambiente local
npm test             # testes (vitest)
npm run validate     # validação estática + build
```

Variáveis de ambiente do front (também configuradas na Vercel):
`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (ou `VITE_SUPABASE_ANON_KEY`).

## Supabase

- `supabase/migrations/` — alterações aplicadas no banco, em ordem.
- `supabase/rollback/` — scripts para desfazer cada alteração.
- `supabase/functions/` — código das Edge Functions em uso
  (testes com `node --test supabase/functions/<nome>/*.test.mjs`).
- `supabase/functions_arquivadas/` — funções desativadas (ver README da pasta).

## Plano free do Supabase

O projeto roda no plano free. Antes de criar telas ou rotinas novas:

- não use atualização automática mais curta que **5 minutos** (os dados do Omie
  mudam no máximo a cada 15 min; use Realtime quando precisar de tempo real);
- selecione só as colunas necessárias (nada de `select *` em tabelas grandes ou
  colunas JSON como `snapshot`);
- em sincronizações, grave só o que mudou;
- evite deixar abertas as páginas de Logs/Reports do Supabase (consomem a cota
  de *Log Query*).
