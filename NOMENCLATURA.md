# Padrão de nomes

Vale para todo código novo ou alterado em `src/`. `npm run validate:nomes`
confere pastas, arquivos e os casos mais comuns de nome em inglês (também roda
dentro de `npm run validate:static`).

## Idioma

Nomes criados por nós ficam em **português**. Ficam como estão os nomes que
vêm de bibliotecas ou do banco:

| Fica como está                                                  | Origem                        |
| --------------------------------------------------------------- | ----------------------------- |
| `data`, `error`, `isLoading`, `isFetching`, `refetch`, `enabled` | React Query / Supabase        |
| `session.user`, `data.user`                                     | Supabase Auth                 |
| `onClick`, `onChange`, `onSubmit`, `className`, `style`, `key`  | React / HTML                  |
| `onSelect`, `onOpenChange`, `dataKey`, `payload`                | DayPicker, Radix, Recharts    |
| `codigo_pedido_omie`, `data_pedido`… (snake_case)              | colunas do banco e campos do Omie |

Termos técnicos aceitos sem tradução: `auth`, `login`, `email`, `id`, `ref`,
`modal`, `card`, `menu`, `mobile`, `desktop`, `navbar`, `dashboard`, `status`,
`pdf`, `excel`, `cache`, `toast`, `badge`, e o sufixo `Page` em telas
(`PedidosPage`).

## Pastas e arquivos

| O quê                         | Padrão                                   | Exemplo                                     |
| ----------------------------- | ---------------------------------------- | ------------------------------------------- |
| Pasta                         | kebab-case                               | `compras-futuras/`, `confirmacao-exclusao/` |
| Componente React              | PascalCase `.jsx`                        | `PedidosPage.jsx`, `ProvedorAuth.jsx`       |
| Hook                          | `useNome.js`                             | `usePermissoes.js`                          |
| Outros módulos                | camelCase                                | `gerarPdf.js`, `numeroPedidoExibicao.js`    |
| Módulo com papel definido     | camelCase + `.papel.js`                  | ver tabela abaixo                           |
| Teste                         | mesmo nome + `.test.js`                  | `entradas.utils.test.js`                    |
| Rota (TanStack Router)        | kebab-case, nome = URL                   | `routes/pedidos-compra.jsx`                 |
| CSS de componente             | mesmo nome do componente                 | `PedidosPage.css`                           |

Papéis:

| Sufixo            | Conteúdo                                                           |
| ----------------- | ------------------------------------------------------------------ |
| `.service.js`     | acesso ao Supabase / Edge Functions / server functions             |
| `.regras.js`      | regras de negócio e cálculos puros da tela (sem React, sem rede)   |
| `.utils.js`       | funções auxiliares puras da feature                                |
| `.constants.js`   | constantes                                                         |
| `.config.js`      | configuração declarativa (colunas, menus, relatórios)              |
| `.selectors.js`   | derivação de dados para a tela (puro)                              |
| `.formatadores.js`| formatação para exibição                                           |
| `.functions.js`   | funções de servidor do TanStack Start (`createServerFn`)           |

Exceções de ferramenta (não renomear): `routeTree.gen.ts`, `router.tsx`,
`server.ts`, `start.ts` e `lib/error-capture.ts`, `lib/error-page.ts`,
`lib/lovable-error-reporting.ts` (modelo do Lovable).

## Nomes no código

| O quê                         | Padrão                                       | Exemplo                                        |
| ----------------------------- | -------------------------------------------- | ---------------------------------------------- |
| Variável / função             | camelCase                                    | `pedidosAtrasados`, `buscarPedidos`            |
| Função                        | verbo no infinitivo                          | `formatarData`, `calcularMedia`, `salvar`      |
| Booleano                      | `eh` / `tem` / `pode` / `esta` / particípio  | `ehAdmin`, `temFiltros`, `podeEditar`, `aberto`|
| Estado de carga               | `carregando…`, `salvando…`, `atualizando…`   | `carregandoPermissoes`                         |
| Par de estado                 | `[nome, setNome]`                            | `[menuAberto, setMenuAberto]`                  |
| Handler dentro do componente  | verbo; `ao…` se o verbo já for outro nome    | `sair`, `aoSalvarFornecedor`                   |
| Prop de evento                | `on` + verbo em português                    | `onSalvar`, `onFechar`, `onAlterarPeriodo`     |
| Componente                    | PascalCase, substantivo                      | `TabelaEntradasCompras`, `RotuloHoras`         |
| Constante de módulo           | MAIÚSCULAS_COM_SUBLINHADO                    | `ITENS_POR_PAGINA`, `FUSO_BRASILIA`            |
| Chave do React Query          | `chave…` / `CHAVE_…`                         | `CHAVE_PEDIDOS_SUPABASE`                       |
| Ref                           | nome + `Ref`                                 | `campoArquivoRef`                              |
| Rótulo de gráfico             | `rotulo…`                                    | `rotuloMes`, `rotuloData`                      |

Evite: `isX`, `hasX`, `handleX`, `toggleX`, `loadingX`, `xChange`, `xLabel`,
`userX`, sufixos `Service.js`/`Utils.js` sem ponto.

## Ainda fora do padrão

- Nomes de classes CSS em inglês (`navbar-user-area`, `loading-spinner`…). Mudar
  exige alterar CSS e JSX juntos e comparar as telas antes/depois.
- Edge Functions em `supabase/functions` (Deno) não passam pelo validador.
