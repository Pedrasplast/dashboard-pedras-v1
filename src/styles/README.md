# src/styles

Estilos globais, carregados em `src/routes/__root.tsx` nesta ordem:

| Arquivo               | Conteúdo                                                                                                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens.css`          | Cores, tipografia, espaçamento, raio, sombra, foco e transições. Tokens semânticos (`--color-primary`, `--color-border`...) e a paleta base (`--blue-100`, `--red-200`...). |
| `animacoes.css`       | `@keyframes` compartilhados: `sistema-girar`, `sistema-aparecer`, `sistema-surgir-confirmacao`.                                                                             |
| `../legacy-base.css`  | Reset e estrutura da página.                                                                                                                                                |
| `../app-layout.css`   | Layout da aplicação.                                                                                                                                                        |
| `paginas-sistema.css` | Páginas 404 e de erro.                                                                                                                                                      |

O CSS de cada tela fica ao lado da tela, em `features/`.

## Regras

- **Cor:** use `var(--color-…)`. Se nenhum token semântico servir, use a paleta
  base (`--blue-100`…). Não escreva hex novo no CSS das telas.
- **Animação:** use `sistema-girar` / `sistema-aparecer` em vez de criar
  `@keyframes` iguais.
- **Nome de classe:** todo CSS é global. Prefixe as classes com o nome da tela
  (`.estoque-…`, `.dmp-…`) e não reutilize a classe de outra tela para mudar o
  visual dela.
- Evite `!important`; se precisar dele, a causa costuma ser uma colisão de classe.

## Pendências que exigem comparação visual

Estes itens mudam a aparência de alguma tela e só devem ser feitos com as telas
abertas lado a lado (antes/depois).

1. **Colisões de classe.** O mesmo seletor tem conteúdo diferente em arquivos
   diferentes; vence o CSS carregado por último.
   - Resolvido: Relatórios. `PedidosCompraAlteradosRelatorio.css` era quase todo
     CSS sem uso (`pc-audit-*` e um catálogo `relatorios-*` antigo) e foi removido;
     as 3 regras que valiam foram para `PedidosAlteradosRelatorio.css`, cujas
     classes os dois relatórios usam. Os dois CSS sempre carregam juntos
     (`Relatorio.config.js` importa os dois relatórios), então nada mudou na tela.
   - Resolvido: `.girando` global (0,8 s × 0,75 s, conforme a última tela
     aberta). Agora é `.cadastros-girando` (0,8 s) e `.saldos-iniciais-girando`
     (0,75 s); o `.girando` do Estoque não era usado e saiu. A Programação segue
     com `.programacao-pp-atualizar .girando`.
   - Para conferir: `node colisoes-css.mjs <repo>` (ferramentas da refatoração).
2. **Cores quase iguais.** Lote 1 feito: 304 usos com ΔE < 2 (imperceptível)
   viraram tokens do mesmo papel (borda, fundo, texto) e matiz. Lote 2 feito:
   55 bordas claras (`#edf1f5`, `#edf2f7`, `#eef2f7`…) viraram
   `--color-border-subtle`. Restam ~307 usos de hex fixo: ~74 com ΔE entre 2 e 4
   (sutil) e ~233 com ΔE ≥ 4 (cores próprias de cada tela).
   Ferramentas: `cores-proximas.mjs` (inventário) e `aplicar-cores.mjs`.
3. **`!important` (246, eram 299 antes da remoção do CSS morto).** Concentrados
   em `relatorios/components/LayoutRelatorio.css` (100). Remover exige resolver
   antes as regras que eles estão vencendo (`avaliar-important.mjs` testa cada um
   no navegador).
4. **Breakpoints.** Mais de 20 larguras diferentes em `@media`; padronizar em
   480 / 768 / 1024 / 1280 px muda o ponto em que o layout quebra.
5. **CSS Modules.** Migrar o CSS de cada tela para `*.module.css` elimina as
   colisões de vez.

CSS sem uso: removido (482 regras, ~71 KB). Para conferir de novo:
`remover-css-morto.mjs <repo> --listar` (simulação).
