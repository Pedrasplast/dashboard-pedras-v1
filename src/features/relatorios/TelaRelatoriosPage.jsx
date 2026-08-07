import React, { useMemo, useState } from "react";
import { useNavigate } from "@/lib/navegacao";
import {
  FiArrowLeft,
  FiFileText,
  FiDownload,
  FiChevronRight,
  FiBarChart2,
  FiClock,
  FiActivity,
  FiAlertTriangle,
} from "react-icons/fi";

import {
  agruparProducaoPorInjetora,
} from "./producao/producaoPorInjetora";

import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useCargaMaquina } from "@/lib/cargaMaquina";
import FiltrosDashboard from "@/features/dashboard/FiltrosDashboard";

import jsPDF from "jspdf";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import "./TelaRelatorios.css";

/* =====================================================
   FUNÇÕES AUXILIARES DE DURAÇÃO
===================================================== */

const converterDuracaoParaSegundos = (duracao) => {
  if (!duracao) return 0;

  const texto = String(duracao).trim();

  if (!texto) return 0;

  const partes = texto.split(":").map(Number);

  if (partes.some((parte) => Number.isNaN(parte))) {
    return 0;
  }

  if (partes.length === 3) {
    const [horas, minutos, segundos] = partes;

    return horas * 3600 + minutos * 60 + segundos;
  }

  if (partes.length === 2) {
    const [minutos, segundos] = partes;

    return minutos * 60 + segundos;
  }

  if (partes.length === 1) {
    return partes[0] || 0;
  }

  return 0;
};

const formatarSegundosComoDuracao = (totalSegundos) => {
  const segundosValidos = Math.max(0, Number(totalSegundos) || 0);

  const horas = Math.floor(segundosValidos / 3600);

  const minutos = Math.floor((segundosValidos % 3600) / 60);

  const segundos = Math.floor(segundosValidos % 60);

  return [
    String(horas).padStart(2, "0"),
    String(minutos).padStart(2, "0"),
    String(segundos).padStart(2, "0"),
  ].join(":");
};

/* =====================================================
   DATA OFICIAL DO REGISTRO

   PRIORIDADE:
   1. inicio_dia
   2. inicio
   3. data
===================================================== */

const obterDataDoRegistro = (item) => {
  const valor = item.inicio_dia || item.inicio || item.data || null;

  if (!valor) {
    return null;
  }

  const texto = String(valor).trim();

  /*
     Exemplos aceitos:

     2026-07-01
     2026-07-01 08:15:25+00
     2026-07-01T08:15:25
  */
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return texto.slice(0, 10);
  }

  /*
     Também aceita:

     01/07/2026
     01/07/2026 08:15:25
     01/07/26
  */
  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{2,4})/);

  if (match) {
    const dia = match[1];
    const mes = match[2];

    let ano = match[3];

    if (ano.length === 2) {
      ano = `20${ano}`;
    }

    return `${ano}-${mes}-${dia}`;
  }

  return null;
};

/* =====================================================
   AGRUPAMENTO — PRODUÇÃO POR INJETORA

   IMPORTANTE:
   ESTA FUNÇÃO SÓ RECEBE DADOS JÁ FILTRADOS.
===================================================== */

const agruparProducaoPorInjetora = (dados) => {
  if (!Array.isArray(dados)) {
    return [];
  }

  const agrupado = new Map();

  dados.forEach((item) => {
    const injetora = String(item.injetora || "SEM INJETORA").trim() || "SEM INJETORA";

    if (!agrupado.has(injetora)) {
      agrupado.set(injetora, {
        injetora,
        conforme: 0,
        danificada: 0,
        total_produzido: 0,
        duracaoSegundos: 0,
        duracao: "00:00:00",
      });
    }

    const registro = agrupado.get(injetora);

    const conforme = parseFloat(String(item.conforme ?? "0").replace(",", ".")) || 0;

    const danificada = parseFloat(String(item.danificada ?? "0").replace(",", ".")) || 0;

    registro.conforme += conforme;

    registro.danificada += danificada;

    registro.total_produzido += conforme + danificada;

    registro.duracaoSegundos += converterDuracaoParaSegundos(item.duracao);
  });

  return Array.from(agrupado.values())
    .map((item) => ({
      ...item,

      duracao: formatarSegundosComoDuracao(item.duracaoSegundos),
    }))
    .sort((a, b) =>
      a.injetora.localeCompare(b.injetora, "pt-BR", {
        numeric: true,
        sensitivity: "base",
      }),
    );
};

/* =====================================================
   CADASTRO DAS COLUNAS DISPONÍVEIS
===================================================== */

const COLUNAS_RELATORIO = {
  data: {
    titulo: "Data",
    larguraPdf: 22,

    valor: (item) => {
      const data = item.inicio_dia || item.inicio || item.data;

      if (!data) {
        return "-";
      }

      const texto = String(data).trim();

      if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
        return texto.slice(0, 10).split("-").reverse().join("/");
      }

      const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{2,4})/);

      if (match) {
        let ano = match[3];

        if (ano.length === 2) {
          ano = `20${ano}`;
        }

        return `${match[1]}/${match[2]}/${ano}`;
      }

      return texto;
    },
  },

  injetora: {
    titulo: "Injetora",
    larguraPdf: 32,

    valor: (item) => item.injetora || "-",
  },

  produto: {
    titulo: "Produto",
    larguraPdf: 34,

    valor: (item) => item.cod_prod || item.produto || "-",
  },

  mp: {
    titulo: "Matéria-Prima",
    larguraPdf: 38,

    valor: (item) => item.mp || item.materia_prima || "-",
  },

  tipo: {
    titulo: "Tipo",
    larguraPdf: 22,

    valor: (item) => item.tipo || "-",
  },

  conforme: {
    titulo: "Conforme",
    larguraPdf: 25,

    valor: (item) =>
      Number(item.conforme || 0).toLocaleString("pt-BR", {
        maximumFractionDigits: 2,
      }),
  },

  danificada: {
    titulo: "Danificada",
    larguraPdf: 25,

    valor: (item) =>
      Number(item.danificada || 0).toLocaleString("pt-BR", {
        maximumFractionDigits: 2,
      }),
  },

  total_produzido: {
    titulo: "Total Produzido",
    larguraPdf: 30,

    valor: (item) =>
      Number(item.total_produzido || 0).toLocaleString("pt-BR", {
        maximumFractionDigits: 2,
      }),
  },

  duracao: {
    titulo: "Duração",
    larguraPdf: 25,

    valor: (item) => item.duracao || item.tempo || "-",
  },

  op: {
    titulo: "OP",
    larguraPdf: 25,

    valor: (item) => item.op || "-",
  },

  descricao: {
    titulo: "Descrição",
    larguraPdf: 48,

    valor: (item) => item.descricao || item.justificativa || item.natureza || item.motivo || "-",
  },
};

/* =====================================================
   RELATÓRIOS PRÉ-DEFINIDOS
===================================================== */

const RELATORIOS = [
  {
    id: "producao-injetora",

    categoria: "Produção",

    titulo: "Produção por Injetora",

    descricao: "Resumo consolidado da produção por injetora no período selecionado.",

    icone: FiBarChart2,

    filtros: {
      periodo: true,
      injetora: true,
      produto: true,
      mp: false,
      tipo: false,
    },

    transformarDados: agruparProducaoPorInjetora,

    colunas: ["injetora", "conforme", "danificada", "total_produzido", "duracao"],
  },

  {
    id: "producao-produto",

    categoria: "Produção",

    titulo: "Produção por Produto",

    descricao: "Permite acompanhar a produção de um código específico em todas as máquinas.",

    icone: FiActivity,

    filtros: {
      periodo: true,
      injetora: true,
      produto: true,
      mp: true,
      tipo: false,
    },

    colunas: ["data", "produto", "injetora", "mp", "conforme", "danificada", "duracao"],
  },

  {
    id: "producao-mp",

    categoria: "Produção",

    titulo: "Produção por Matéria-Prima",

    descricao: "Apresenta os registros associados à matéria-prima selecionada.",

    icone: FiActivity,

    filtros: {
      periodo: true,
      injetora: true,
      produto: true,
      mp: true,
      tipo: false,
    },

    colunas: ["data", "injetora", "produto", "mp", "duracao"],
  },

  {
    id: "paradas-planejadas",

    categoria: "Paradas",

    titulo: "Paradas Planejadas",

    descricao: "Lista somente os apontamentos classificados como tipo 1.",

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

    descricao: "Lista somente os apontamentos classificados como tipo 2.",

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

    descricao: "Lista somente os apontamentos classificados como tipo 3.",

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

/* =====================================================
   COMPONENTE
===================================================== */

function TelaRelatorios({ dadosBrutos: dadosExternos }) {
  const navigate = useNavigate();

  const temDadosExternos = Array.isArray(dadosExternos) && dadosExternos.length > 0;

  const { dados, loading: carregando } = useCargaMaquina({
    enabled: !temDadosExternos,
  });

  const dadosBrutos = temDadosExternos ? dadosExternos : dados;

  const loading = temDadosExternos ? false : carregando;

  /* =====================================================
     ESTADOS
  ===================================================== */

  const [relatorioSelecionadoId, setRelatorioSelecionadoId] = useState(null);

  const [filtros, setFiltros] = useState({
    dataInicio: "",
    dataFim: "",
    injetora: "Todos",
    cod_prod: "Todos",
    mp: "Todos",
    tipo: [],
    status: "todos",
  });

  /* =====================================================
     RELATÓRIO SELECIONADO
  ===================================================== */

  const relatorioSelecionado = useMemo(() => {
    return RELATORIOS.find((relatorio) => relatorio.id === relatorioSelecionadoId) || null;
  }, [relatorioSelecionadoId]);

  /* =====================================================
     CATEGORIAS
  ===================================================== */

  const categorias = useMemo(() => {
    return [...new Set(RELATORIOS.map((item) => item.categoria))];
  }, []);

  /* =====================================================
     LISTA DE PRODUTOS DISPONÍVEIS

     TAMBÉM RESPEITA A INJETORA SELECIONADA.
  ===================================================== */

  const produtosDisponiveis = useMemo(() => {
    let lista = Array.isArray(dadosBrutos) ? dadosBrutos : [];

    if (filtros.injetora && filtros.injetora !== "Todos") {
      lista = lista.filter(
        (item) => String(item.injetora || "").trim() === String(filtros.injetora).trim(),
      );
    }

    return [...new Set(lista.map((item) => item.cod_prod || item.produto))].filter(Boolean);
  }, [dadosBrutos, filtros.injetora]);

  const mpsDisponiveis = useMemo(() => {
    if (!Array.isArray(dadosBrutos)) {
      return [];
    }

    return [...new Set(dadosBrutos.map((item) => item.mp || item.materia_prima))].filter(Boolean);
  }, [dadosBrutos]);

  const tiposDisponiveis = useMemo(() => {
    if (!Array.isArray(dadosBrutos)) {
      return [];
    }

    return [...new Set(dadosBrutos.map((item) => item.tipo))].filter(Boolean);
  }, [dadosBrutos]);

  /* =====================================================
     FILTRAGEM DOS REGISTROS

     A ORDEM É:

     1. FILTRO FIXO
     2. STATUS
     3. PERÍODO PELO inicio_dia
     4. INJETORA
     5. PRODUTO
     6. MATÉRIA-PRIMA
     7. TIPO

     SOMENTE DEPOIS O AGRUPAMENTO É FEITO.
  ===================================================== */

  const dadosFiltrados = useMemo(() => {
    if (!Array.isArray(dadosBrutos) || !relatorioSelecionado) {
      return [];
    }

    return dadosBrutos.filter((item) => {
      /* =================================================
         1. FILTRO FIXO DO RELATÓRIO
      ================================================= */

      if (relatorioSelecionado.filtroFixo && !relatorioSelecionado.filtroFixo(item)) {
        return false;
      }

      /* =================================================
         2. STATUS
      ================================================= */

      const statusItem = String(item.status || "")
        .trim()
        .toLowerCase();

      if (filtros.status && filtros.status !== "todos" && statusItem !== filtros.status) {
        return false;
      }

      /* =================================================
         3. PERÍODO

         CAMPO PRINCIPAL:
         inicio_dia
      ================================================= */

      if (relatorioSelecionado.filtros.periodo) {
        const dataRegistro = obterDataDoRegistro(item);

        if ((filtros.dataInicio || filtros.dataFim) && !dataRegistro) {
          return false;
        }

        if (filtros.dataInicio && dataRegistro && dataRegistro < filtros.dataInicio) {
          return false;
        }

        if (filtros.dataFim && dataRegistro && dataRegistro > filtros.dataFim) {
          return false;
        }
      }

      /* =================================================
         4. INJETORA
      ================================================= */

      if (
        relatorioSelecionado.filtros.injetora &&
        filtros.injetora &&
        filtros.injetora !== "Todos"
      ) {
        const injetoraRegistro = String(item.injetora || "").trim();

        const injetoraFiltro = String(filtros.injetora).trim();

        if (injetoraRegistro !== injetoraFiltro) {
          return false;
        }
      }

      /* =================================================
         5. PRODUTO
      ================================================= */

      if (
        relatorioSelecionado.filtros.produto &&
        filtros.cod_prod &&
        filtros.cod_prod !== "Todos"
      ) {
        const produtoRegistro = String(item.cod_prod || item.produto || "").trim();

        const produtoFiltro = String(filtros.cod_prod).trim();

        if (produtoRegistro !== produtoFiltro) {
          return false;
        }
      }

      /* =================================================
         6. MATÉRIA-PRIMA
      ================================================= */

      if (relatorioSelecionado.filtros.mp && filtros.mp && filtros.mp !== "Todos") {
        const mpRegistro = String(item.mp || item.materia_prima || "").trim();

        const mpFiltro = String(filtros.mp).trim();

        if (mpRegistro !== mpFiltro) {
          return false;
        }
      }

      /* =================================================
         7. TIPO
      ================================================= */

      if (
        relatorioSelecionado.filtros.tipo &&
        Array.isArray(filtros.tipo) &&
        filtros.tipo.length > 0
      ) {
        const tipoRegistro = String(item.tipo || "").trim();

        const tiposSelecionados = filtros.tipo.map((tipo) => String(tipo).trim());

        if (!tiposSelecionados.includes(tipoRegistro)) {
          return false;
        }
      }

      return true;
    });
  }, [dadosBrutos, filtros, relatorioSelecionado]);

  /* =====================================================
     DADOS FINAIS DO RELATÓRIO

     É SOMENTE AQUI QUE O AGRUPAMENTO ACONTECE.

     Portanto:

     BANCO
       ↓
     FILTRO inicio_dia
       ↓
     FILTRO INJETORA
       ↓
     FILTRO PRODUTO
       ↓
     DADOS FILTRADOS
       ↓
     AGRUPAMENTO
       ↓
     PDF / CSV
  ===================================================== */

  const dadosRelatorio = useMemo(() => {
    if (!relatorioSelecionado) {
      return [];
    }

    if (typeof relatorioSelecionado.transformarDados === "function") {
      return relatorioSelecionado.transformarDados(dadosFiltrados);
    }

    return dadosFiltrados;
  }, [dadosFiltrados, relatorioSelecionado]);

  /* =====================================================
     MÉTRICAS
  ===================================================== */

  useDashboardMetrics(dadosFiltrados);

  /* =====================================================
     SELECIONAR RELATÓRIO
  ===================================================== */

  const selecionarRelatorio = (id) => {
    setRelatorioSelecionadoId(id);

    setFiltros({
      dataInicio: "",
      dataFim: "",
      injetora: "Todos",
      cod_prod: "Todos",
      mp: "Todos",
      tipo: [],
      status: "todos",
    });
  };

  const voltarListaRelatorios = () => {
    setRelatorioSelecionadoId(null);

    setFiltros({
      dataInicio: "",
      dataFim: "",
      injetora: "Todos",
      cod_prod: "Todos",
      mp: "Todos",
      tipo: [],
      status: "todos",
    });
  };

  /* =====================================================
     TEXTO DOS FILTROS
  ===================================================== */

  const montarTextoFiltros = () => {
    const lista = [];

    if (filtros.injetora && filtros.injetora !== "Todos") {
      lista.push(`Injetora: ${filtros.injetora}`);
    }

    if (filtros.cod_prod && filtros.cod_prod !== "Todos") {
      lista.push(`Produto: ${filtros.cod_prod}`);
    }

    if (filtros.mp && filtros.mp !== "Todos") {
      lista.push(`MP: ${filtros.mp}`);
    }

    if (filtros.dataInicio) {
      lista.push(`De: ${filtros.dataInicio.split("-").reverse().join("/")}`);
    }

    if (filtros.dataFim) {
      lista.push(`Até: ${filtros.dataFim.split("-").reverse().join("/")}`);
    }

    return lista.length > 0 ? lista.join(" | ") : "Sem filtros adicionais";
  };

  /* =====================================================
     GERAR PDF
  ===================================================== */

  const handleGerarPDF = () => {
    if (!relatorioSelecionado) {
      return;
    }

    if (dadosRelatorio.length === 0) {
      alert("Nenhum dado encontrado com os filtros selecionados.");

      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 12;

    let y = 14;

    /* CABEÇALHO */

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);

    doc.text(relatorioSelecionado.titulo.toUpperCase(), margin, y);

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);

    doc.text(relatorioSelecionado.descricao, margin, y);

    y += 5;

    doc.text(
      `Emitido em ${new Date().toLocaleDateString(
        "pt-BR",
      )} às ${new Date().toLocaleTimeString("pt-BR")}`,
      margin,
      y,
    );

    /* FILTROS */

    y += 8;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);

    doc.roundedRect(margin, y, pageWidth - margin * 2, 16, 2, 2, "FD");

    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    doc.text("PARÂMETROS:", margin + 4, y);

    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    doc.text(montarTextoFiltros(), margin + 4, y);

    /* COLUNAS */

    const colunas = relatorioSelecionado.colunas.map((chave) => ({
      chave,
      ...COLUNAS_RELATORIO[chave],
    }));

    const larguraDisponivel = pageWidth - margin * 2;

    const larguraTotalOriginal = colunas.reduce((total, coluna) => total + coluna.larguraPdf, 0);

    const proporcao = larguraDisponivel / larguraTotalOriginal;

    let xAtual = margin;

    const colunasPosicionadas = colunas.map((coluna) => {
      const largura = coluna.larguraPdf * proporcao;

      const resultado = {
        ...coluna,
        x: xAtual,
        largura,
      };

      xAtual += largura;

      return resultado;
    });

    const desenharCabecalhoTabela = () => {
      doc.setFillColor(30, 41, 59);

      doc.rect(margin, y, larguraDisponivel, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.2);
      doc.setTextColor(255, 255, 255);

      colunasPosicionadas.forEach((coluna) => {
        doc.text(coluna.titulo, coluna.x + 2, y + 5.3);
      });

      y += 8;
    };

    y += 13;

    desenharCabecalhoTabela();

    /* LINHAS */

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);

    dadosRelatorio.forEach((item, index) => {
      if (y > pageHeight - 18) {
        doc.addPage();

        y = 14;

        desenharCabecalhoTabela();
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);

        doc.rect(margin, y, larguraDisponivel, 7, "F");
      }

      doc.setTextColor(51, 65, 85);

      colunasPosicionadas.forEach((coluna) => {
        const valor = coluna.valor(item);

        const texto = valor === null || valor === undefined ? "-" : String(valor);

        const limiteTexto = coluna.largura - 4;

        const textoQuebrado = doc.splitTextToSize(texto, limiteTexto);

        doc.text(textoQuebrado[0] || "-", coluna.x + 2, y + 4.6);
      });

      doc.setDrawColor(241, 245, 249);

      doc.line(margin, y + 7, pageWidth - margin, y + 7);

      y += 7;
    });

    /* RODAPÉ */

    y += 7;

    if (y > pageHeight - 15) {
      doc.addPage();

      y = 15;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    const textoRodape =
      relatorioSelecionado.id === "producao-injetora"
        ? `Total de injetoras: ${dadosRelatorio.length}`
        : `Total de registros: ${dadosRelatorio.length}`;

    doc.text(textoRodape, margin, y);

    doc.save(`${relatorioSelecionado.id}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  /* =====================================================
   GERAR EXCEL EM FORMATO DE TABELA
===================================================== */

  const handleGerarExcel = async () => {
    if (!relatorioSelecionado) {
      return;
    }

    if (dadosRelatorio.length === 0) {
      alert("Nenhum dado encontrado com os filtros selecionados.");
      return;
    }

    try {
      const colunas = relatorioSelecionado.colunas.map((chave) => ({
        chave,
        ...COLUNAS_RELATORIO[chave],
      }));

      const workbook = new ExcelJS.Workbook();

      workbook.creator = "Pedrasplast";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Relatório", {
        views: [
          {
            state: "frozen",
            ySplit: 1,
          },
        ],
      });

      const cabecalhos = colunas.map((coluna) => coluna.titulo);

      const linhas = dadosRelatorio.map((item) =>
        colunas.map((coluna) => {
          switch (coluna.chave) {
            case "conforme":
              return Number(item.conforme || 0);

            case "danificada":
              return Number(item.danificada || 0);

            case "total_produzido":
              return Number(item.total_produzido || 0);

            default: {
              const valor = coluna.valor(item);

              return valor ?? "";
            }
          }
        }),
      );

      worksheet.addTable({
        name: "TabelaRelatorio",
        ref: "A1",

        headerRow: true,
        totalsRow: false,

        style: {
          theme: "TableStyleMedium2",
          showRowStripes: true,
          showColumnStripes: false,
        },

        columns: cabecalhos.map((cabecalho) => ({
          name: cabecalho,
          filterButton: true,
        })),

        rows: linhas,
      });

      worksheet.columns = colunas.map((coluna) => {
        switch (coluna.chave) {
          case "injetora":
            return { width: 36 };

          case "descricao":
            return { width: 48 };

          case "produto":
            return { width: 22 };

          case "mp":
            return { width: 24 };

          case "tipo":
            return { width: 16 };

          case "op":
            return { width: 18 };

          case "data":
            return { width: 14 };

          case "duracao":
            return { width: 16 };

          case "conforme":
          case "danificada":
          case "total_produzido":
            return { width: 18 };

          default:
            return { width: 20 };
        }
      });

      colunas.forEach((coluna, index) => {
        if (
          coluna.chave === "conforme" ||
          coluna.chave === "danificada" ||
          coluna.chave === "total_produzido"
        ) {
          worksheet.getColumn(index + 1).numFmt = "#,##0";
        }
      });

      worksheet.eachRow((row, rowNumber) => {
        row.alignment = {
          vertical: "middle",
        };

        if (rowNumber === 1) {
          row.height = 24;
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();

      const nomeArquivo = `${relatorioSelecionado.id}_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, nomeArquivo);
    } catch (erro) {
      console.error("Erro ao gerar Excel:", erro);

      alert("Não foi possível gerar o arquivo Excel.");
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="relatorios-loading">
        <div className="relatorios-loading-card">
          <div className="relatorios-spinner" />

          <p>Carregando dados dos relatórios...</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     TELA
  ===================================================== */

  return (
    <div className="relatorios-container">
      <div className="relatorios-topo">
        <button className="btn-voltar-home" onClick={() => navigate("/")}>
          <FiArrowLeft />

          <span>Voltar ao Início</span>
        </button>
      </div>

      <div className="relatorios-header">
        <div>
          <span className="relatorios-eyebrow">Central de Relatórios</span>

          <h1>Relatórios</h1>

          <p>Selecione um relatório pré-definido e informe apenas os parâmetros necessários.</p>
        </div>
      </div>

      {!relatorioSelecionado && (
        <div className="relatorios-lista">
          {categorias.map((categoria) => {
            const relatoriosCategoria = RELATORIOS.filter((item) => item.categoria === categoria);

            return (
              <section key={categoria} className="relatorios-categoria">
                <div className="relatorios-categoria-header">
                  <h2>{categoria}</h2>

                  <span>{relatoriosCategoria.length} relatório(s)</span>
                </div>

                <div className="relatorios-grid">
                  {relatoriosCategoria.map((relatorio) => {
                    const Icone = relatorio.icone;

                    return (
                      <button
                        key={relatorio.id}
                        type="button"
                        className="relatorio-card"
                        onClick={() => selecionarRelatorio(relatorio.id)}
                      >
                        <div className="relatorio-card-icone">
                          <Icone />
                        </div>

                        <div className="relatorio-card-conteudo">
                          <h3>{relatorio.titulo}</h3>

                          <p>{relatorio.descricao}</p>
                        </div>

                        <div className="relatorio-card-seta">
                          <FiChevronRight />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {relatorioSelecionado && (
        <div className="relatorio-detalhe">
          <button type="button" className="btn-voltar-relatorios" onClick={voltarListaRelatorios}>
            <FiArrowLeft />

            <span>Voltar aos relatórios</span>
          </button>

          <div className="relatorio-selecionado-header">
            <div className="relatorio-selecionado-icone">
              {React.createElement(relatorioSelecionado.icone)}
            </div>

            <div>
              <span className="relatorio-selecionado-categoria">
                {relatorioSelecionado.categoria}
              </span>

              <h2>{relatorioSelecionado.titulo}</h2>

              <p>{relatorioSelecionado.descricao}</p>
            </div>
          </div>

          <div className="relatorio-filtros-card">
            <div className="relatorio-filtros-header">
              <div>
                <h3>Parâmetros do relatório</h3>

                <p>Refine os dados antes de gerar o arquivo.</p>
              </div>
            </div>

            <FiltrosDashboard
              filtros={filtros}
              setFiltros={setFiltros}
              rawDados={dadosBrutos}
              exibirPeriodo={relatorioSelecionado.filtros.periodo}
              exibirInjetora={relatorioSelecionado.filtros.injetora}
              exibirProduto={relatorioSelecionado.filtros.produto}
              exibirMp={relatorioSelecionado.filtros.mp}
              exibirTipo={relatorioSelecionado.filtros.tipo}
              tiposDisponiveis={tiposDisponiveis}
              produtosDisponiveis={produtosDisponiveis}
              mpsDisponiveis={mpsDisponiveis}
            />
          </div>

          <div className="relatorio-resumo-grid">
            <div className="relatorio-resumo-card">
              <span>
                {relatorioSelecionado.id === "producao-injetora"
                  ? "Injetoras no relatório"
                  : "Registros encontrados"}
              </span>

              <strong>{dadosRelatorio.length}</strong>
            </div>

            <div className="relatorio-resumo-card">
              <span>Relatório selecionado</span>

              <strong className="relatorio-resumo-texto">{relatorioSelecionado.titulo}</strong>
            </div>

            <div className="relatorio-resumo-card">
              <span>Filtros aplicados</span>

              <strong className="relatorio-resumo-texto">{montarTextoFiltros()}</strong>
            </div>
          </div>

          <div className="relatorio-acoes">
            <button
              type="button"
              className="btn-relatorio btn-relatorio-pdf"
              onClick={handleGerarPDF}
              disabled={dadosRelatorio.length === 0}
            >
              <FiFileText />

              <div>
                <strong>Baixar PDF</strong>

                <span>Relatório formatado</span>
              </div>
            </button>

            <button
              type="button"
              className="btn-relatorio btn-relatorio-csv"
              onClick={handleGerarExcel}
              disabled={dadosRelatorio.length === 0}
            >
              <FiDownload />

              <div>
                <strong>Exportar Excel</strong>
                <span>Tabela XLSX</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TelaRelatorios;
