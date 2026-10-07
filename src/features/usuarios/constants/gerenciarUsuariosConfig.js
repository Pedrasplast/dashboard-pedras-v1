export const CHAVE_TELA_USUARIOS = "usuarios";

export const CHAVE_TELA_RELATORIOS = "relatorios";

/* =========================================================
   CATÁLOGO CENTRAL DE TELAS

   Esta é a fonte única das telas controladas pelo sistema.

   Ao criar uma nova tela:
   1. adicione-a aqui;
   2. informe o módulo;
   3. use a mesma chave no Navbar e no RotaProtegida.

   Quando um administrador abrir Gerenciamento de Usuários,
   o catálogo será sincronizado automaticamente com o Supabase.
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
    chave: "dashboard_produtividade",
    nome: "Produtividade",
    rota: "/dashboard-produtividade",
    ordem: 4,
    ativo: true,
    modulo: "dashboards",
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
========================================================= */

const MODULOS = Object.freeze([
  {
    id: "cadastro",
    nome: "Cadastro",
    descricao:
      "Cadastros mestres utilizados nas rotinas do sistema.",
  },

  {
    id: "dashboards",
    nome: "Dashboards",
    descricao:
      "Painéis gerenciais e indicadores da operação.",
  },

  {
    id: "producao",
    nome: "Produção",
    descricao:
      "Operação e planejamento dos processos produtivos.",
  },

  {
    id: "compras",
    nome: "Compras",
    descricao:
      "Pedidos de compra, compras futuras e recebimentos de matéria-prima.",
  },

  {
    id: "pedidos",
    nome: "Pedidos",
    descricao:
      "Consulta e acompanhamento dos pedidos.",
  },

  {
    id: "financeiro",
    nome: "Financeiro",
    descricao:
      "Painéis e análises financeiras.",
  },

  {
    id: "relatorios",
    nome: "Relatórios",
    descricao:
      "Central de relatórios e permissões específicas.",
  },

  {
    id: "administracao",
    nome: "Administração",
    descricao:
      "Funções administrativas disponíveis para operadores.",
  },
]);

/* =========================================================
   GERAR MÓDULOS DE PERMISSÕES AUTOMATICAMENTE
========================================================= */

export const MODULOS_PERMISSOES = Object.freeze(
  MODULOS.map((modulo) => ({
    ...modulo,

    chaves: TELAS_SISTEMA.filter(
      (tela) =>
        tela.modulo === modulo.id &&
        tela.gerenciavel !== false,
    ).map((tela) => tela.chave),
  })).filter(
    (modulo) =>
      modulo.chaves.length > 0,
  ),
);

/* =========================================================
   LOCALIZAR TELA POR CHAVE
========================================================= */

export function obterTelaSistema(chave) {
  return (
    TELAS_SISTEMA.find(
      (tela) =>
        tela.chave === chave,
    ) || null
  );
}