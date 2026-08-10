import { FiFileText, FiBarChart2, FiClock, FiActivity, FiAlertTriangle } from "react-icons/fi";

import { agruparProducaoPorInjetora } from "../producao/ProducaoPorInjetora";
import { agruparProducaoPorProduto } from "../producao/ProducaoPorProduto";
import { agruparProducaoPorMateriaPrima } from "../producao/ProducaoPorMateriaPrima";
import { impactoParadasPorMotivo } from "../paradas/ImpactoPorMotivo";
import { agruparMotivoJustificativa } from "../paradas/MotivoJustificativa";

/* =====================================================
   CADASTRO CENTRAL DOS RELATÓRIOS
===================================================== */

export const RELATORIOS = [
  /* ===================================================
     PRODUÇÃO
  =================================================== */

  {
    id: "producao-injetora",

    categoria: "Produção",

    titulo: "Produção por Injetora",

    descricao: "Resumo consolidado da produção por injetora no período selecionado.",

    icone: FiBarChart2,

    filtros: {
      periodo: true,
      injetora: true,
      produto: false,
      mp: false,
      tipo: false,
    },

    transformarDados: agruparProducaoPorInjetora,

    colunas: ["injetora", "conforme", "danificada", "total_produzido", "qualidade"],
  },

  {
    id: "producao-produto",

    categoria: "Produção",

    titulo: "Produção por Produto",

    descricao: "Resumo consolidado da produção por produto e injetora no período selecionado.",

    icone: FiBarChart2,

    filtros: {
      periodo: true,
      injetora: true,
      produto: true,
      mp: false,
      tipo: false,
    },

    transformarDados: agruparProducaoPorProduto,

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

  {
    id: "producao-mp",

    categoria: "Produção",

    titulo: "Consumo de Matéria-Prima por Produto",

    descricao: "Apresenta a produção total e o consumo de matéria-prima de cada produto.",

    icone: FiActivity,

    filtros: {
      periodo: true,
      injetora: true,
      produto: true,
      mp: true,
      tipo: false,
    },

    transformarDados: agruparProducaoPorMateriaPrima,

    colunas: [
      "produto",
      "mp",
      "conforme",
      "danificada",
      "total_produzido",
      "peso",
      "consumo_total",
      "gasto_unidade",
      "peso_total",
    ],
  },

  /* ===================================================
     PARADAS
  =================================================== */

  {
    id: "impacto-paradas-motivo",

    categoria: "Paradas",

    titulo: "Impacto das Paradas por Motivo",

    descricao:
      "Ranking dos motivos de parada conforme o tempo total perdido no período selecionado.",

    icone: FiAlertTriangle,

    filtros: {
      periodo: true,
      injetora: true,
      produto: false,
      mp: false,

      /*
       * Permite selecionar:
       *
       * 1 Planejada
       * 2 Não Planejada
       * 3 Fora de Produção
       */
      tipo: true,
    },

    transformarDados: impactoParadasPorMotivo,

    colunas: ["motivo", "ocorrencias", "tempo_total", "tempo_medio", "percentual_impacto"],
  },

  {
    id: "paradas-planejadas",

    categoria: "Paradas",

    titulo: "Paradas Planejadas",

    descricao: "Lista os apontamentos classificados como parada planejada.",

    icone: FiClock,

    filtros: {
      periodo: true,
      injetora: true,
      produto: false,
      mp: false,
      tipo: false,
    },

    filtroFixo: (item) => String(item.tipo || "").trim() === "1",

    colunas: ["data", "injetora", "descricao", "duracao", "op"],
  },

  {
    id: "paradas-nao-planejadas",

    categoria: "Paradas",

    titulo: "Paradas Não Planejadas",

    descricao: "Lista os apontamentos classificados como parada não planejada.",

    icone: FiAlertTriangle,

    filtros: {
      periodo: true,
      injetora: true,
      produto: false,
      mp: false,
      tipo: false,
    },

    filtroFixo: (item) => String(item.tipo || "").trim() === "2",

    colunas: ["data", "injetora", "descricao", "duracao", "op"],
  },

  {
    id: "paradas-fora-producao",

    categoria: "Paradas",

    titulo: "Paradas Fora de Produção",

    descricao: "Lista os apontamentos classificados como fora de produção.",

    icone: FiClock,

    filtros: {
      periodo: true,
      injetora: true,
      produto: false,
      mp: false,
      tipo: false,
    },

    filtroFixo: (item) => String(item.tipo || "").trim() === "3",

    colunas: ["data", "injetora", "descricao", "duracao", "op"],
  },

  {
    id: "paradas-motivo-justificativa",

    categoria: "Paradas",

    titulo: "Motivos e Justificativas das Paradas",

    descricao:
      "Detalha os motivos de parada e suas justificativas, destacando as causas que mais impactam a produção.",

    icone: FiAlertTriangle,

    filtros: {
      periodo: true,
      injetora: true,
      produto: false,
      mp: false,
      tipo: true,
    },

    transformarDados: agruparMotivoJustificativa,

    colunas: [
      "motivo",
      "justificativa",
      "ocorrencias",
      "tempo_total",
      "tempo_medio",
      "percentual_impacto",
    ],
  },

  /* ===================================================
     QUALIDADE
  =================================================== */

  {
    id: "qualidade",

    categoria: "Qualidade",

    titulo: "Conformes e Danificadas",

    descricao: "Acompanha peças conformes e danificadas por máquina e produto.",

    icone: FiActivity,

    filtros: {
      periodo: true,
      injetora: true,
      produto: true,
      mp: false,
      tipo: false,
    },

    colunas: ["data", "injetora", "produto", "conforme", "danificada"],
  },

  /* ===================================================
     GERAL
  =================================================== */

  {
    id: "relatorio-completo",

    categoria: "Geral",

    titulo: "Relatório Completo",

    descricao: "Relatório geral permitindo aplicar todos os filtros disponíveis.",

    icone: FiFileText,

    filtros: {
      periodo: true,
      injetora: true,
      produto: true,
      mp: true,
      tipo: true,
    },

    colunas: ["data", "injetora", "produto", "mp", "tipo", "conforme", "danificada", "duracao"],
  },
];
