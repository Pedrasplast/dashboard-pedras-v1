# Programação de Produção — refatoração

Esta versão mantém as regras atuais e separa responsabilidades para facilitar manutenção.

## Estrutura

```text
programacao-producao/
├── ProgramacaoProducaoPage.jsx
├── ProgramacaoProducaoPage.css
├── programacaoProducao.constants.js
├── components/
│   ├── ExcluirProgramacaoModal.jsx
│   ├── Kpi.jsx
│   ├── ProdutoProgramacaoCard.jsx
│   ├── ProgramacaoProducaoModal.jsx
│   └── ProjecaoDiariaTabela.jsx
├── hooks/
│   └── useProgramacaoProducao.js
├── services/
│   └── programacaoProducao.service.js
└── utils/
    ├── calendarioProducao.utils.js
    ├── planoProducao.utils.js
    ├── programacaoProducao.utils.js
    └── projecaoProducao.utils.js
```

## Responsabilidades

- `ProgramacaoProducaoPage.jsx`: composição da página, busca, filtros e abertura dos modais.
- `components/`: interface visual.
- `hooks/useProgramacaoProducao.js`: carregamento e estado dos dados da página.
- `services/programacaoProducao.service.js`: acesso ao Supabase e RPCs.
- `utils/programacaoProducao.utils.js`: datas, números, consolidação e ordenação.
- `utils/calendarioProducao.utils.js`: turnos, intervalos e horas efetivas.
- `utils/planoProducao.utils.js`: geração dos planos de produção por quantidade/tempo.
- `utils/projecaoProducao.utils.js`: montagem da projeção de estoque + pedidos por produto.

## Instalação

Substitua a pasta atual `src/features/programacao-producao` pelo conteúdo desta pasta.

A rota pode continuar importando:

```js
import ProgramacaoProducaoPage from "@/features/programacao-producao/ProgramacaoProducaoPage";
```

## Banco

Nenhuma alteração de banco é necessária para esta refatoração.

## Validação executada

Os arquivos `.js` e `.jsx` foram analisados pelo parser TypeScript/JSX e todos passaram sem erro de sintaxe. Também foi verificado que todos os imports relativos apontam para arquivos existentes.
