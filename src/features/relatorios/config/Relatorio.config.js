import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiCalendar,
  FiDollarSign,
  FiEdit3,
  FiPackage,
  FiShoppingCart,
} from "react-icons/fi";


import {
  agruparProducaoPorInjetora,
} from "../producao/ProducaoPorInjetora";


import {
  agruparProducaoPorProduto,
} from "../producao/ProducaoPorProduto";


import {
  impactoParadasPorMotivo,
} from "../paradas/ImpactoPorMotivo";


import {
  agruparMotivoJustificativa,
} from "../paradas/MotivoJustificativa";


import {
  prepararPedidosDetalhados,
  prepararPedidosAtrasados,
  agruparPedidosPorCodigoProduto,
  agruparPedidosPorDataProduto,
} from "../pedidos/PedidosRelatorios";


import PedidosAlteradosRelatorio
  from "../pedidos-alterados/PedidosAlteradosRelatorio";


/* =========================================================
   FINANCEIRO
========================================================= */

import FinanceiroPrevistoRealizado
  from "../financeiro/FinanceiroPrevistoRealizado";



/* =========================================================
   CADASTRO CENTRAL DOS RELATÓRIOS

   fonteDados:
   - producao = carga_maquina
   - pedidos  = pedidos_omie
   - custom   = componente com consulta própria
========================================================= */

export const RELATORIOS = [

  /* =====================================================
     PRODUÇÃO
  ===================================================== */

  {
    id:
      "producao-injetora",

    categoria:
      "Produção",

    titulo:
      "Produção por Injetora",

    descricao:
      "Resumo consolidado da produção por injetora no período selecionado.",

    icone:
      FiBarChart2,

    fonteDados:
      "producao",

    filtros: {
      periodo: true,
      injetora: true,
      produto: false,
      turno: false,
      mp: false,
      tipo: false,

      cliente: false,
      vendedor: false,
      status: false,
    },

    transformarDados:
      agruparProducaoPorInjetora,

    colunas: [
      "injetora",
      "conforme",
      "danificada",
      "total_produzido",
      "qualidade",
    ],
  },


  {
    id:
      "producao-produto",

    categoria:
      "Produção",

    titulo:
      "Produção por Produto",

    descricao:
      "Resumo consolidado da produção por produto e injetora no período selecionado.",

    icone:
      FiBarChart2,

    fonteDados:
      "producao",

    filtros: {
      periodo: true,
      injetora: true,
      produto: true,
      turno: false,
      mp: false,
      tipo: false,

      cliente: false,
      vendedor: false,
      status: false,
    },

    transformarDados:
      agruparProducaoPorProduto,

    colunas: [
      "produto",
      "injetora",
      "conforme",
      "danificada",
      "total_produzido",
      "duracao",
      "produtividade_hora",
      "qualidade",
    ],
  },


  /* =====================================================
     PARADAS
  ===================================================== */

  {
    id:
      "impacto-paradas-motivo",

    categoria:
      "Paradas",

    titulo:
      "Impacto das Paradas por Motivo",

    descricao:
      "Ranking dos motivos de parada conforme o tempo total perdido no período selecionado.",

    icone:
      FiAlertTriangle,

    fonteDados:
      "producao",

    filtros: {
      periodo: true,
      injetora: true,
      produto: false,
      turno: false,
      mp: false,
      tipo: true,

      cliente: false,
      vendedor: false,
      status: false,
    },

    transformarDados:
      impactoParadasPorMotivo,

    colunas: [
      "motivo",
      "ocorrencias",
      "tempo_total",
      "tempo_medio",
      "percentual_impacto",
    ],
  },


  {
    id:
      "paradas-motivo-justificativa",

    categoria:
      "Paradas",

    titulo:
      "Motivos e Justificativas das Paradas",

    descricao:
      "Detalha os motivos de parada e suas justificativas, destacando as causas que mais impactam a produção.",

    icone:
      FiAlertTriangle,

    fonteDados:
      "producao",

    filtros: {
      periodo: true,
      injetora: true,
      produto: false,
      turno: false,
      mp: false,
      tipo: true,

      cliente: false,
      vendedor: false,
      status: false,
    },

    transformarDados:
      agruparMotivoJustificativa,

    colunas: [
      "motivo",
      "justificativa",
      "ocorrencias",
      "tempo_total",
      "tempo_medio",
      "percentual_impacto",
    ],
  },


  /* =====================================================
     PEDIDOS
  ===================================================== */

  {
    id:
      "pedidos-abertos",

    categoria:
      "Pedidos",

    titulo:
      "Pedidos em Aberto",

    descricao:
      "Detalha os pedidos e seus itens utilizando a previsão de faturamento como período.",

    icone:
      FiShoppingCart,

    fonteDados:
      "pedidos",

    filtros: {
      periodo: true,

      injetora: false,
      produto: true,
      turno: false,
      mp: false,
      tipo: false,

      cliente: true,
      vendedor: true,
      status: true,
    },

    transformarDados:
      prepararPedidosDetalhados,

    colunas: [
      "pedido",
      "cliente",
      "data_pedido",
      "previsao",
      "codigo_produto",
      "produto_pedido",
      "quantidade",
      "unidade",
      "vendedor",
      "status",
    ],
  },


  {
    id:
      "pedidos-atrasados",

    categoria:
      "Pedidos",

    titulo:
      "Pedidos Atrasados",

    descricao:
      "Lista pedidos cuja previsão de faturamento já venceu e ainda estão com status Pedido.",

    icone:
      FiAlertTriangle,

    fonteDados:
      "pedidos",

    filtros: {
      periodo: true,

      injetora: false,
      produto: true,
      turno: false,
      mp: false,
      tipo: false,

      cliente: true,
      vendedor: true,

      status: false,
    },

    transformarDados:
      prepararPedidosAtrasados,

    colunas: [
      "pedido",
      "cliente",
      "previsao",
      "dias_atraso",
      "codigo_produto",
      "produto_pedido",
      "quantidade",
      "unidade",
      "vendedor",
    ],
  },


  /* =====================================================
     PEDIDOS ALTERADOS
  ===================================================== */

  {
    id:
      "pedidos-alterados",

    categoria:
      "Pedidos",

    titulo:
      "Pedidos Alterados",

    descricao:
      "Auditoria das alterações realizadas no conteúdo dos pedidos, mostrando reincidência e valores antes e depois.",

    icone:
      FiEdit3,

    fonteDados:
      "custom",

    tipoRelatorio:
      "custom",

    componenteCustomizado:
      PedidosAlteradosRelatorio,

    filtros: {
      periodo: false,

      injetora: false,
      produto: false,
      turno: false,
      mp: false,
      tipo: false,

      cliente: false,
      vendedor: false,
      status: false,
    },

    transformarDados:
      null,

    colunas: [],
  },


  {
    id:
      "pedidos-produto-codigo",

    categoria:
      "Pedidos",

    titulo:
      "Quantidade de Produtos por Código",

    descricao:
      "Soma as quantidades dos pedidos agrupando todos os itens pelo código do produto.",

    icone:
      FiPackage,

    fonteDados:
      "pedidos",

    filtros: {
      periodo: true,

      injetora: false,
      produto: true,
      turno: false,
      mp: false,
      tipo: false,

      cliente: true,
      vendedor: true,
      status: true,
    },

    transformarDados:
      agruparPedidosPorCodigoProduto,

    colunas: [
      "codigo_produto",
      "produto_pedido",
      "unidade",
      "quantidade",
      "pedidos_atendidos",
    ],
  },


  {
    id:
      "pedidos-produto-data",

    categoria:
      "Pedidos",

    titulo:
      "Produtos por Data de Faturamento",

    descricao:
      "Agrupa as quantidades por previsão de faturamento e código do produto para auxiliar o planejamento da produção.",

    icone:
      FiCalendar,

    fonteDados:
      "pedidos",

    filtros: {
      periodo: true,

      injetora: false,
      produto: true,
      turno: false,
      mp: false,
      tipo: false,

      cliente: true,
      vendedor: true,
      status: true,
    },

    transformarDados:
      agruparPedidosPorDataProduto,

    colunas: [
      "previsao",
      "codigo_produto",
      "produto_pedido",
      "unidade",
      "quantidade",
      "pedidos",
    ],
  },


  /* =====================================================
     FINANCEIRO
  ===================================================== */

  {
    id:
      "financeiro-previsto-realizado",

    categoria:
      "Financeiro",

    titulo:
      "Previsto x Realizado por Categoria",

    descricao:
      "Compara os valores previstos e realizados por categoria financeira, destacando os desvios favoráveis e desfavoráveis.",

    icone:
      FiDollarSign,

    fonteDados:
      "custom",

    tipoRelatorio:
      "custom",

    componenteCustomizado:
      FinanceiroPrevistoRealizado,

    filtros: {
      periodo: false,

      injetora: false,
      produto: false,
      turno: false,
      mp: false,
      tipo: false,

      cliente: false,
      vendedor: false,
      status: false,
    },

    transformarDados:
      null,

    colunas: [
      "codigo_categoria",
      "categoria_financeira",
      "tipo_financeiro",
      "valor_previsto",
      "valor_realizado",
      "variacao",
      "variacao_percentual",
    ],
  },
 
];