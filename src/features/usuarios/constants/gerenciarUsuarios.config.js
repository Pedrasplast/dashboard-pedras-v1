export const CHAVE_TELA_USUARIOS = "usuarios";

export const CHAVE_TELA_RELATORIOS = "relatorios";

/* =========================================================
   CATÁLOGO CENTRAL DE TELAS

   Fonte única das telas controladas pelo sistema.

   Ao criar uma nova tela:
   1. Cadastrar neste arquivo.
   2. Informar o módulo correto.
   3. Usar a mesma chave na Navbar.
   4. Usar a mesma chave no RotaProtegida.

   A sincronização com o Supabase é realizada
   pelo módulo de Gerenciamento de Usuários.
========================================================= */

export const TELAS_SISTEMA = Object.freeze([
  {
    chave: "materia_prima",
    nome: "Matéria-Prima",
    rota: "/materia-prima",
    ordem: 0,
    ativo: true,
    modulo: "producao",
    gerenciavel: true,
  },

  {
    chave: "dashboard",
    nome: "Dashboard",
    rota: "/dashboard",
    ordem: 1,
    ativo: true,
    modulo: "dashboards",
    gerenciavel: true,
  },

  {
    chave: "pedidos",
    nome: "Pedidos",
    rota: "/pedidos",
    ordem: 2,
    ativo: true,
    modulo: "pedidos",
    gerenciavel: true,
  },

  {
    chave: "relatorios",
    nome: "Relatórios",
    rota: "/relatorios",
    ordem: 3,
    ativo: true,
    modulo: "relatorios",
    gerenciavel: true,
  },

  {
    chave: "dashboard_materia_prima",
    nome: "Matéria-prima",
    rota: "/dashboard-materia-prima",
    ordem: 5,
    ativo: true,
    modulo: "dashboards",
    gerenciavel: true,
  },

  {
    chave: "importar",
    nome: "Importar",
    rota: "/importar",
    ordem: 6,
    ativo: true,
    modulo: "administracao",
    gerenciavel: true,
  },

  {
    chave: "usuarios",
    nome: "Gerenciar usuários",
    rota: "/usuarios",
    ordem: 7,
    ativo: true,
    modulo: "administracao",
    gerenciavel: false,
  },

  {
    chave: "financeiro",
    nome: "Financeiro",
    rota: "/financeiro",
    ordem: 8,
    ativo: true,
    modulo: "financeiro",
    gerenciavel: true,
  },

  {
    chave: "financeiro_evolucao_mensal",
    nome: "Evolução Mensal Financeira",
    rota: "/financeiro-evolucao-mensal",
    ordem: 9,
    ativo: true,
    modulo: "financeiro",
    gerenciavel: true,
  },

  {
    chave: "dashboard_paradas",
    nome: "Dashboard de Paradas",
    rota: "/dashboard-paradas",
    ordem: 10,
    ativo: true,
    modulo: "dashboards",
    gerenciavel: true,
  },

  {
    chave: "estoque",
    nome: "Estoque",
    rota: "/estoque",
    ordem: 11,
    ativo: true,
    modulo: "producao",
    gerenciavel: true,
  },

  {
    chave: "cadastro_produto",
    nome: "Cadastro de Produto",
    rota: "/cadastro-produto",
    ordem: 12,
    ativo: true,
    modulo: "cadastro",
    gerenciavel: true,
  },

  {
    chave: "cadastro_fornecedor",
    nome: "Cadastro de Fornecedor",
    rota: "/cadastro-fornecedor",
    ordem: 13,
    ativo: true,
    modulo: "cadastro",
    gerenciavel: true,
  },

  {
    chave: "cadastro_material",
    nome: "Cadastro de Material",
    rota: "/cadastro-material",
    ordem: 14,
    ativo: true,
    modulo: "cadastro",
    gerenciavel: true,
  },

  {
    chave: "compras_futuras",
    nome: "Compras Futuras",
    rota: "/compras-futuras",
    ordem: 15,
    ativo: true,
    modulo: "compras",
    gerenciavel: true,
  },

  {
    chave: "pedidos_compra",
    nome: "Pedidos de Compra",
    rota: "/pedidos-compra",
    ordem: 16,
    ativo: true,
    modulo: "compras",
    gerenciavel: true,
  },

  {
    chave: "entradas_materia_prima",
    nome: "Entradas",
    rota: "/entradas-materia-prima",
    ordem: 17,
    ativo: true,
    modulo: "compras",
    gerenciavel: true,
  },

  /* =====================================================
     NOVAS TELAS DO MÓDULO COMPRAS
  ===================================================== */

  {
    chave: "necessidade_materia_prima",
    nome: "Necessidade de Matéria-Prima",
    rota: "/necessidade-materia-prima",
    ordem: 18,
    ativo: true,
    modulo: "compras",
    gerenciavel: true,
  },

  {
    chave: "tabela_precos_materia_prima",
    nome: "Tabela de Preços",
    rota: "/tabela-precos-materia-prima",
    ordem: 19,
    ativo: true,
    modulo: "compras",
    gerenciavel: true,
  },

  {
    chave: "cadastro_receita",
    nome: "Cadastro de Receita",
    rota: "/cadastro-receita",
    ordem: 35,
    ativo: true,
    modulo: "cadastro",
    gerenciavel: true,
  },
]);

/* =========================================================
   MÓDULOS

   A organização do Gerenciamento de Usuários
   utiliza os módulos definidos nesta lista.
========================================================= */

const MODULOS = Object.freeze([
  {
    id: "cadastro",
    nome: "Cadastro",
    descricao: "Cadastros mestres utilizados nas rotinas do sistema.",
  },

  {
    id: "dashboards",
    nome: "Dashboards",
    descricao: "Painéis gerenciais e indicadores da operação.",
  },

  {
    id: "producao",
    nome: "Produção",
    descricao: "Operação e planejamento dos processos produtivos.",
  },

  {
    id: "compras",
    nome: "Compras",
    descricao:
      "Pedidos de compra, compras futuras, recebimentos, necessidade de matéria-prima e tabela de preços.",
  },

  {
    id: "pedidos",
    nome: "Pedidos",
    descricao: "Consulta e acompanhamento dos pedidos.",
  },

  {
    id: "financeiro",
    nome: "Financeiro",
    descricao: "Painéis e análises financeiras.",
  },

  {
    id: "relatorios",
    nome: "Relatórios",
    descricao: "Central de relatórios e permissões específicas.",
  },

  {
    id: "administracao",
    nome: "Administração",
    descricao: "Funções administrativas disponíveis para operadores.",
  },
]);

/* =========================================================
   MÓDULOS DE PERMISSÕES

   Lista gerada automaticamente a partir
   do catálogo central.

   Evita duplicidade de configurações.
========================================================= */

export const MODULOS_PERMISSOES = Object.freeze(
  MODULOS.map((modulo) => ({
    ...modulo,

    chaves: TELAS_SISTEMA.filter(
      (tela) => tela.modulo === modulo.id && tela.gerenciavel !== false,
    ).map((tela) => tela.chave),
  })).filter((modulo) => modulo.chaves.length > 0),
);

/* =========================================================
   CONSULTA DE TELA POR CHAVE
========================================================= */

export function obterTelaSistema(chave) {
  return TELAS_SISTEMA.find((tela) => tela.chave === chave) || null;
}
