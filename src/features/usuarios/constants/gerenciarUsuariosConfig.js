export const CHAVE_TELA_USUARIOS =
  "usuarios";

export const CHAVE_TELA_RELATORIOS =
  "relatorios";


export const MODULOS_PERMISSOES =
  Object.freeze([
    {
      id: "cadastro",

      nome: "Cadastro",

      descricao:
        "Cadastros mestres utilizados nas rotinas do sistema.",

      chaves: [
        "cadastro_produto",
        "cadastro_fornecedor",
        "cadastro_material",
      ],
    },

    {
      id: "dashboards",

      nome: "Dashboards",

      descricao:
        "Painéis gerenciais e indicadores da operação.",

      chaves: [
        "dashboard",
        "dashboard_produtividade",
        "dashboard_materia_prima",
        "dashboard_paradas",
      ],
    },

    {
      id: "producao",

      nome: "Produção",

      descricao:
        "Operação e planejamento dos processos produtivos.",

      chaves: [
        "materia_prima",
        "estoque",
      ],
    },

    {
      id: "pedidos",

      nome: "Pedidos",

      descricao:
        "Consulta e acompanhamento dos pedidos.",

      chaves: [
        "pedidos",
      ],
    },

    {
      id: "financeiro",

      nome: "Financeiro",

      descricao:
        "Painéis e análises financeiras.",

      chaves: [
        "financeiro",
        "financeiro_evolucao_mensal",
      ],
    },

    {
      id: "relatorios",

      nome: "Relatórios",

      descricao:
        "Central de relatórios e permissões específicas.",

      chaves: [
        "relatorios",
      ],
    },

    {
      id: "administracao",

      nome: "Administração",

      descricao:
        "Funções administrativas disponíveis para operadores.",

      chaves: [
        "importar",
      ],
    },
  ]);