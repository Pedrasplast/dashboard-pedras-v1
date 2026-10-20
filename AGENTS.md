# Instruções para agentes

- A branch `main` é publicada automaticamente na Vercel: mantenha-a sempre
  funcionando e trabalhe em branches com Pull Request.
- Não reescreva histórico já enviado (sem force push, rebase ou amend de commits
  publicados).
- Alterações no banco (Supabase) vão em `supabase/migrations/` com o script de
  volta correspondente em `supabase/rollback/`.
- Antes de abrir um PR: `npm test` e `npm run validate`.
- O projeto roda no plano free do Supabase: siga as regras da seção
  "Plano free do Supabase" do README (polling ≥ 5 min, sem `select *` em tabelas
  grandes, gravar só o que mudou).
