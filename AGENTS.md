<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Banco de dados e testes

- NUNCA testar no navegador contra o Supabase de produção
  (`rkfjhxcczgjyxfucytla`). O projeto está no plano free e cada carregamento
  da tela Carga de Máquina baixa ~21 MB, consumindo a cota de egress.
- Para testes no navegador, usar o Supabase local (`supabase start`) com dados
  de exemplo pequenos (ex.: 200 linhas de `carga_maquina`) ou dados simulados
  (mock).
- Preferir validações sem navegador: type-check, lint e testes unitários.
- Se for indispensável abrir o sistema real, abrir cada tela no máximo uma vez
  e nunca a tela Carga de Máquina.

## Refatoração — padrão de nomes

Todo trabalho da refatoração (plano "Análise de Refatoração — Dashboard
Pedrasplast") usa a marca **REF**, para separar essas branches das demais.

**Branches:** `REF/fase-<n>-<descricao>`

- Sempre começam com `REF/` (maiúsculo). O Git não aceita colchetes no nome,
  por isso a branch usa `REF/` e não `[REF]`.
- Depois vem a fase e uma descrição curta, em minúsculas, com hífens, sem
  acentos nem espaços.
- Exemplos: `REF/fase-0-limpeza`, `REF/fase-1-utilitarios`,
  `REF/fase-2-estilos`, `REF/fase-3-componentes`.
- Cada branch nasce da `main` atualizada e volta para a `main` por PR.

**Commits e PRs:** o título começa com `[REF]` e a fase.

- Exemplos: `[REF] Fase 0: remove arquivos sem uso`,
  `[REF] Fase 1: cria shared/lib/formatar.js`.

Branches sem `REF/` não fazem parte da refatoração.
