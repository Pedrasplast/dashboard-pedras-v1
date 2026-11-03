# Dashboard Pedrasplast

Sistema interno da Pedrasplast: produção (OEE, paradas), matéria-prima,
compras, estoque, pedidos de venda, financeiro e relatórios, integrado ao ERP
Omie pelo Supabase.

O projeto também é editado pelo [Lovable](https://lovable.dev/projects/466a95f7-5c5e-4654-b8ab-0bb5e1bc5a8e):
o que entra na `main` sincroniza com o editor. Veja `AGENTS.md` antes de mexer
no histórico do git.

## Stack

- React 19 + TanStack Start/Router (rotas em `src/routes`, SSR desligado nas telas)
- TanStack Query para dados do servidor
- Supabase: Postgres com RLS, Auth, Edge Functions (Deno) e pg_cron
- Recharts (gráficos), ExcelJS/xlsx e jsPDF (exportações)
- Vite 8 + Nitro, deploy na Vercel (Node 22)

## Como rodar

```sh
cp .env.example .env      # preencha VITE_SUPABASE_PUBLISHABLE_KEY
npm ci
npm run dev
```

## Scripts

| Comando                   | O que faz                                                         |
| ------------------------- | ----------------------------------------------------------------- |
| `npm run dev`             | servidor de desenvolvimento                                       |
| `npm run build`           | build de produção (Vercel)                                        |
| `npm test`                | testes do site (Vitest)                                           |
| `npm run test:funcoes`    | testes das Edge Functions (`node --test`)                         |
| `npm run lint`            | ESLint                                                            |
| `npm run validate:static` | sintaxe, imports locais e padrão de nomes                         |
| `npm run validate`        | tudo acima + build — rode antes de abrir PR                       |

O GitHub Actions (`.github/workflows/validar.yml`) roda a mesma validação em
todo PR.

## Estrutura

```
src/
  routes/        uma rota por tela (nome = URL)
  features/      uma pasta por área: tela, componentes, hooks, *.service.js, *.regras.js
  components/    componentes usados por várias telas (layout, modal, filtros, paginação)
  shared/lib/    funções puras compartilhadas: números, textos, datas, formatação
  hooks/         hooks globais (permissões, auth)
  lib/           Supabase, sessão, provedor de autenticação, atualizador de versão
  styles/        tokens de cor/tipografia e animações globais
supabase/
  functions/     Edge Functions publicadas (ver README da pasta)
  migrations/    SQL aplicado no banco
```

## Padrões

- Nomes: [NOMENCLATURA.md](NOMENCLATURA.md)
- Funções compartilhadas: [src/shared/README.md](src/shared/README.md)
- CSS e tokens: [src/styles/README.md](src/styles/README.md)
- Histórico da refatoração: [REFATORACAO.md](REFATORACAO.md)

## Segurança

- O navegador usa só a chave publicável do Supabase; o acesso aos dados é
  controlado por RLS e por funções que conferem a permissão do usuário.
- A chave `service_role` fica só nas Edge Functions (secrets do Supabase).
  Nunca em variável `VITE_`, no código ou no `.env` commitado.
- As Edge Functions chamadas pelo pg_cron conferem o segredo do cron
  (`x-cron-secret`) ou exigem JWT.
