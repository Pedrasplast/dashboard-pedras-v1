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

1. **Colisões de classe (11 seletores).** O mesmo seletor tem conteúdo diferente
   em arquivos diferentes; vence o CSS carregado por último, que depende da ordem
   de navegação.
   - `TelaRelatorios.css` × `PedidosCompraAlteradosRelatorio.css`: 6 seletores
     (`.relatorios-lista`, `.relatorios-categorias-filtro`…)
   - `PedidosAlteradosRelatorio.css` × `PedidosCompraAlteradosRelatorio.css`: 3
     (`.pedidos-alterados-tabela`, `.pedidos-alterados-tabela-wrapper`…)
   - `.girando` em `CadastrosPage.css`, `EstoquePage.css` e `SaldosIniciais.css`
     (0,8 s × 0,75 s)
   - `.dmp-filtros-card` em `DashboardMateriaPrima.css` ×
     `DashboardMateriaPrimaFiltros.css`
   - Sugestão: dar à tela de Pedidos de Compra Alterados classes próprias.
2. **Cores quase iguais (761 hex restantes).** Ex.: `#f8fbff`, `#fbfdff` (quase
   `--color-surface-subtle`), `#edf1f5`, `#dbe3ee` (quase `--color-border`).
   Unificar muda levemente o tom.
3. **`!important` (299).** Concentrados em `relatorios/components/LayoutRelatorio.css`
   (100) e `financeiro/FinanceiroPage.css` (48). Remover exige resolver antes as
   regras que eles estão vencendo.
4. **Breakpoints.** Mais de 20 larguras diferentes em `@media`; padronizar em
   480 / 768 / 1024 / 1280 px muda o ponto em que o layout quebra.
5. **CSS Modules.** Migrar o CSS de cada tela para `*.module.css` elimina as
   colisões de vez.
