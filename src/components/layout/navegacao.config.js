import {
  ArrowDownToLine,
  Boxes,
  Calculator,
  CirclePause,
  ClipboardList,
  DollarSign,
  Factory,
  FileText,
  FlaskConical,
  Gauge,
  Home,
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  TableProperties,
  Users,
  Warehouse,
} from "lucide-react";

/* =========================================================
   NAVEGAÇÃO POR MÓDULOS
========================================================= */

export const NAVIGATION_GROUPS = Object.freeze([
  {
    type: "link",
    id: "inicio",
    label: "Início",
    path: "/",
    icon: Home,
    permissao: null,
  },

  /* =====================================================
     CADASTRO
  ===================================================== */

  {
    type: "group",
    id: "cadastro",
    label: "Cadastro",
    icon: ClipboardList,
    children: [
      {
        type: "link",
        id: "cadastro-produto",
        label: "Produto",
        path: "/cadastro-produto",
        icon: ClipboardList,
        permissao: "cadastro_produto",
      },
      {
        type: "link",
        id: "cadastro-fornecedor",
        label: "Fornecedor",
        path: "/cadastro-fornecedor",
        icon: Users,
        permissao: "cadastro_fornecedor",
      },
      {
        type: "link",
        id: "cadastro-material",
        label: "Material",
        path: "/cadastro-material",
        icon: Boxes,
        permissao: "cadastro_material",
      },
      {
        type: "link",
        id: "cadastro-receita",
        label: "Receita",
        path: "/cadastro-receita",
        icon: FlaskConical,
        permissao: "cadastro_receita",
      },
    ],
  },

  /* =====================================================
     DASHBOARDS
  ===================================================== */

  {
    type: "group",
    id: "dashboards",
    label: "Dashboards",
    icon: LayoutDashboard,
    children: [
      {
        label: "Dashboard-Produção",
        path: "/dashboard",
        icon: Factory,
        permissao: "dashboard",
      },
      {
        label: "Dashboard-Paradas",
        path: "/dashboard-paradas",
        icon: CirclePause,
        permissao: "dashboard_paradas",
      },
      {
        label: "Dashboard-Matéria-Prima",
        path: "/dashboard-materia-prima",
        icon: Gauge,
        permissao: "dashboard_materia_prima",
      },
    ],
  },

  /* =====================================================
     PRODUÇÃO
  ===================================================== */

  {
    type: "group",
    id: "producao",
    label: "Produção",
    icon: Factory,
    children: [
      {
        type: "link",
        id: "materia-prima",
        label: "Matéria-Prima",
        path: "/materia-prima",
        icon: Boxes,
        permissao: "materia_prima",
      },
      {
        type: "link",
        id: "estoque",
        label: "Estoque Produto Acabado",
        path: "/estoque",
        icon: Warehouse,
        permissao: "estoque",
      },
    ],
  },

  /* =====================================================
     COMPRAS
     Novas telas integradas ao grupo existente
  ===================================================== */

  {
    type: "group",
    id: "compras",
    label: "Compras",
    icon: ShoppingBag,
    children: [
      {
        type: "link",
        id: "pedidos-compra",
        label: "Pedidos de Compra",
        path: "/pedidos-compra",
        icon: ShoppingBag,
        permissao: "pedidos_compra",
      },
      {
        type: "link",
        id: "compras-futuras",
        label: "Compras Futuras",
        path: "/compras-futuras",
        icon: ShoppingBag,
        permissao: "compras_futuras",
      },
      {
        type: "link",
        id: "entradas-materia-prima",
        label: "Entradas",
        path: "/entradas-materia-prima",
        icon: ArrowDownToLine,
        permissao: "entradas_materia_prima",
      },

      /* NOVA TELA: NECESSIDADE */

      {
        type: "link",
        id: "necessidade-materia-prima",
        label: "Nec. Compra MP",
        path: "/necessidade-materia-prima",
        icon: Calculator,
        permissao: "necessidade_materia_prima",
      },

      /* NOVA TELA: TABELA DE PREÇOS */

      {
        type: "link",
        id: "tabela-precos-materia-prima",
        label: "Tabela de Preços",
        path: "/tabela-precos-materia-prima",
        icon: TableProperties,
        permissao: "tabela_precos_materia_prima",
      },
    ],
  },

  /* =====================================================
     PEDIDOS
  ===================================================== */

  {
    type: "group",
    id: "pedidos",
    label: "Pedidos",
    icon: ShoppingCart,
    children: [
      {
        label: "Pedidos",
        path: "/pedidos",
        icon: ShoppingCart,
        permissao: "pedidos",
        notificationKey: "pedidos",
      },
    ],
  },

  /* =====================================================
     FINANCEIRO
  ===================================================== */

  {
    type: "group",
    id: "financeiro",
    label: "Financeiro",
    icon: DollarSign,
    children: [
      {
        label: "Visão Geral",
        path: "/financeiro",
        icon: DollarSign,
        permissao: "financeiro",
      },
      {
        label: "Evolução Mensal",
        path: "/financeiro-evolucao-mensal",
        icon: DollarSign,
        permissao: "financeiro_evolucao_mensal",
      },
    ],
  },

  /* =====================================================
     RELATÓRIOS
  ===================================================== */

  {
    type: "link",
    id: "relatorios",
    label: "Relatórios",
    path: "/relatorios",
    icon: FileText,
    permissao: "relatorios",
  },
]);

/* =========================================================
   UTILITÁRIOS
========================================================= */

export function normalizarCaminho(path) {
  const caminho = String(path || "/").trim();

  return caminho === "/" ? "/" : caminho.replace(/\/+$/, "");
}

export function obterNomeUsuario(email) {
  if (!email) return "";

  return String(email)
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

export function obterIniciais(nome) {
  if (!nome) return "US";

  const palavras = String(nome).trim().split(/\s+/).filter(Boolean);

  if (palavras.length === 0) return "US";

  if (palavras.length === 1) {
    return palavras[0].slice(0, 2).toUpperCase();
  }

  return `${palavras[0][0]}${palavras.at(-1)[0]}`.toUpperCase();
}

export function formatarBadgePedidos(quantidade) {
  const numero = Number(quantidade || 0);

  if (!Number.isFinite(numero) || numero <= 0) {
    return null;
  }

  return numero > 99 ? "99+" : String(numero);
}
