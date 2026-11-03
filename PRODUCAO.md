# Checklist de produção

Situação em 03/11/2026 (branch `fase-6-producao`). Auditoria do Supabase feita
só com leitura; nada foi alterado no banco nem nas Edge Functions.

## Pronto

- [x] Site sem chave secreta: o servidor do site usa só a chave publicável + o
      token do usuário. `SUPABASE_SERVICE_ROLE_KEY`, `OMIE_APP_KEY` e
      `OMIE_APP_SECRET` podem sair das variáveis da Vercel.
- [x] Função de servidor de sincronização manual (sem uso e exposta) removida.
- [x] Toda tabela do schema `public` com RLS ligado; o usuário anônimo só lê
      `parametros_produto` (ver P3).
- [x] As 20 funções `SECURITY DEFINER` que o usuário logado pode chamar
      conferem permissão por dentro (admin ou permissão de tela).
- [x] Edge Functions sem JWT (`verify_jwt = false`) conferem o segredo do cron
      ou o login; as de diagnóstico estão desativadas (respondem 410).
- [x] Todas as Edge Functions usadas pelo pg_cron estão no repositório
      (`supabase/functions`).
- [x] 17 rotinas do pg_cron executadas com sucesso no dia da auditoria.
- [x] Leituras pesadas reduzidas (Home e relatórios de pedidos) e respostas
      atrasadas descartadas (Calendário Industrial e Projeção).
- [x] Padrão de nomes documentado e validado automaticamente.
- [x] CI no GitHub Actions: validação, lint, testes e build em todo PR.
- [x] `README.md`, `.env.example`, `NOMENCLATURA.md`, `REFATORACAO.md`.

## Antes de publicar (fazer)

- [x] CI verde na branch: `npm ci`, validação, lint (0 erros, 6 avisos), 31 arquivos de teste do site, 49 testes das Edge Functions e build da Vercel.
- [ ] Testar no preview da Vercel: login, Home, Pedidos, Pedidos de Compra,
      Matéria-Prima, Financeiro, Relatórios (PDF e Excel), Usuários.
- [ ] Merge por PR, na ordem: fase-4 → fase-5 → fase-6 (cada uma contém a
      anterior; basta abrir o PR da fase-6 contra a `main`).
- [ ] Após o deploy, remover da Vercel as variáveis que o site não usa mais.

## Propostas para o Supabase (precisam de aprovação)

SQL em `supabase/propostas/20261103_seguranca_e_limpeza.sql`.

| #  | O quê                                                                                   | Risco                         | Prioridade |
| -- | --------------------------------------------------------------------------------------- | ----------------------------- | ---------- |
| P7 | 5 funções do cron (pedidos, reconciliação de pedidos, financeiro, estoque e estoque rápido) aceitam qualquer usuário logado (só JWT); passar a exigir `x-cron-secret` como as demais | exige deploy das funções      | Alta       |
| P5 | 2 views `SECURITY DEFINER` (preços e compras futuras de MP) ignoram RLS                 | trocar sem a política esvazia 2 telas | Média |
| P3 | `parametros_produto` legível sem login                                                  | baixo                         | Média      |
| P6 | Ligar proteção contra senhas vazadas no Auth                                            | nenhum                        | Média      |
| P8 | Financeiro apaga e regrava o mês em passos separados; falha no meio deixa o mês vazio até a próxima rodada — fazer numa transação (RPC) | exige deploy | Média |
| P1 | `search_path` fixo em 2 funções de recebimento físico                                   | baixo                         | Baixa      |
| P2 | Política de recebimento físico com `(select auth.uid())`                                | nenhum                        | Baixa      |
| P4 | Apagar tabelas/views/funções de teste e backup do schema `public`                       | irreversível                  | Baixa      |
| P9 | Pedido excluído no Omie demora a sair da tela (opções A/B já explicadas)                | exige deploy                  | Decisão pendente |

Observações do verificador do Supabase que **não** precisam de ação agora:
25 índices "sem uso" (as estatísticas podem ter sido zeradas; remover só após
observar por algumas semanas) e 12 tabelas internas com RLS e sem política
(acessadas só pelas Edge Functions com `service_role` — é o comportamento
desejado).

## Depois de publicar (melhorias)

- Trocar os 17 `window.alert` por avisos na tela (`sonner` já instalado) —
  muda a aparência, precisa de aprovação visual.
- Cabeçalhos de segurança HTTP na Vercel (`X-Content-Type-Options`,
  `Referrer-Policy`, CSP) — testar no preview.
- Classes CSS em português e migração para CSS Modules.
- Restringir a leitura de tabelas por permissão de tela no RLS (hoje qualquer
  usuário logado lê, por exemplo, `pedidos_omie`; a tela é que bloqueia).
