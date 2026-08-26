import React, { useMemo, useState } from "react";

import { FiArrowLeft, FiChevronRight, FiDownload, FiEye, FiFileText, FiX } from "react-icons/fi";

import { useQuery } from "@tanstack/react-query";

import {
  useCargaMaquina,
  useDescricoesProdutos,
  normalizarCodigoProduto,
} from "@/lib/cargaMaquina";

import { supabase } from "@/lib/supabaseClient";

import { buscarPedidosOmie } from "@/features/pedidos/omie.functions";

import FiltrosDashboard from "@/features/dashboard/FiltrosDashboard";

import { RELATORIOS } from "./config/Relatorio.config";

import { obterDataDoRegistro } from "./utils/Data";

import { obterDataPedidoRelatorio } from "./pedidos/PedidosRelatorios";

import FiltrosPedidosRelatorio from "./pedidos/FiltrosPedidosRelatorio";

import { gerarPdfRelatorio } from "./exportacao/GerarPDF";

import { gerarExcelRelatorio } from "./exportacao/GerarExcel";

import "./TelaRelatorios.css";

/* =========================================================
   FILTROS INICIAIS
========================================================= */

const criarFiltrosIniciais = (fonteDados = "producao") => ({
  dataInicio: "",
  dataFim: "",

  injetora: "Todos",

  cod_prod: "Todos",

  mp: "Todos",

  tipo: [],

  status: fonteDados === "pedidos" ? "Pedido" : "todos",

  cliente: "todos",

  vendedor: "todos",
});

/* =========================================================
   NORMALIZAR TEXTO
========================================================= */

const normalizarTexto = (valor) =>
  String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/* =========================================================
   NOMES DAS COLUNAS
========================================================= */

const TITULOS_COLUNAS_VISUALIZACAO = {
  data: "Data",

  injetora: "Injetora",

  produto: "Produto",

  descricao_produto: "Descrição do Produto",

  mp: "Matéria-Prima",

  tipo: "Tipo",

  conforme: "Conforme",

  danificada: "Danificada",

  total_produzido: "Total Produzido",

  duracao: "Duração",

  produtividade_hora: "UN/H",

  qualidade: "Qualidade",

  motivo: "Motivo",

  justificativa: "Justificativa",

  ocorrencias: "Ocorrências",

  tempo_total: "Tempo Total",

  tempo_medio: "Tempo Médio",

  percentual_impacto: "Percentual Impacto",

  op: "OP",

  descricao: "Descrição",

  quantidade_mp: "Qtd. MP",

  peso_unitario: "Peso Unitário",

  consumo_total: "Consumo Total",

  gasto_unidade: "Gasto por Unidade",

  /* PEDIDOS */

  pedido: "Pedido",

  cliente: "Cliente",

  data_pedido: "Data do Pedido",

  previsao: "Previsão Faturamento",

  dias_atraso: "Dias em Atraso",

  codigo_produto: "Código",

  produto_pedido: "Produto",

  quantidade: "Quantidade",

  unidade: "Un.",

  vendedor: "Vendedor",

  status: "Status",

  pedidos: "Pedidos",

  pedidos_atendidos: "Pedidos Atendidos",
};

/* =========================================================
   COLUNAS NUMÉRICAS
========================================================= */

const COLUNAS_NUMERICAS = new Set([
  "conforme",
  "danificada",
  "total_produzido",
  "produtividade_hora",
  "qualidade",

  "ocorrencias",
  "percentual_impacto",

  "quantidade_mp",
  "peso_unitario",
  "consumo_total",
  "gasto_unidade",

  "dias_atraso",
  "quantidade",
  "pedidos",
]);

/* =========================================================
   NÚMERO
========================================================= */

const converterNumeroVisualizacao = (valor) => {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  let texto = String(valor).trim().replace(/\s/g, "");

  if (texto.includes(",") && texto.includes(".")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else {
    texto = texto.replace(",", ".");
  }

  const numero = Number(texto);

  return Number.isFinite(numero) ? numero : 0;
};

/* =========================================================
   DATA
========================================================= */

const formatarDataVisualizacao = (valor) => {
  if (!valor) {
    return "-";
  }

  const texto = String(valor).trim();

  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (iso) {
    return `${iso[3]}/` + `${iso[2]}/` + `${iso[1]}`;
  }

  return texto;
};

/* =========================================================
   TEMPO
========================================================= */

const formatarTempoComMilhar = (valor) => {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  const texto = String(valor).trim();

  const partes = texto.split(":");

  if (partes.length < 2) {
    return texto;
  }

  const horas = Number(partes[0]);

  if (!Number.isFinite(horas)) {
    return texto;
  }

  return [
    horas.toLocaleString("pt-BR", {
      maximumFractionDigits: 0,
    }),

    ...partes.slice(1),
  ].join(":");
};

/* =========================================================
   TÍTULO AUTOMÁTICO
========================================================= */

const criarTituloAutomatico = (chave) =>
  String(chave || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());

/* =========================================================
   VALOR DA CÉLULA
========================================================= */

const obterValorVisualizacao = (item, chave) => {
  switch (chave) {
    /* =================================================
         DATAS
      ================================================= */

    case "data":
      return formatarDataVisualizacao(item.inicio_dia || item.inicio || item.data);

    case "data_pedido":
      return formatarDataVisualizacao(item.data_pedido);

    case "previsao":
      return formatarDataVisualizacao(item.previsao);

    /* =================================================
         PRODUÇÃO
      ================================================= */

    case "injetora":
      return item.injetora || "-";

    case "produto":
      return item.cod_prod || item.produto || "-";

    case "descricao_produto":
      return item.descricao_produto || "-";

    case "mp":
      return item.mp || item.materia_prima || "-";

    case "tipo":
      return item.tipo || "-";

    case "conforme":
    case "danificada":
    case "total_produzido":
      return converterNumeroVisualizacao(item[chave]).toLocaleString("pt-BR", {
        maximumFractionDigits: 2,
      });

    case "duracao":
      return formatarTempoComMilhar(item.duracao || item.tempo);

    case "produtividade_hora":
      return Math.round(converterNumeroVisualizacao(item.produtividade_hora)).toLocaleString(
        "pt-BR",
      );

    case "qualidade":
      return `${converterNumeroVisualizacao(item.qualidade).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,

        maximumFractionDigits: 2,
      })}%`;

    /* =================================================
         PARADAS
      ================================================= */

    case "motivo":
      return item.motivo || item.descricao || "-";

    case "justificativa":
      return item.justificativa || "-";

    case "ocorrencias":
      return converterNumeroVisualizacao(item.ocorrencias).toLocaleString("pt-BR", {
        maximumFractionDigits: 0,
      });

    case "tempo_total":
    case "tempo_medio":
      return formatarTempoComMilhar(item[chave]);

    case "percentual_impacto":
      return `${converterNumeroVisualizacao(item.percentual_impacto).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,

        maximumFractionDigits: 2,
      })}%`;

    case "op":
      return item.op || "-";

    case "descricao":
      return item.descricao || item.justificativa || item.natureza || item.motivo || "-";

    /* =================================================
         MATÉRIA-PRIMA
      ================================================= */

    case "quantidade_mp":
      return converterNumeroVisualizacao(item.quantidade_mp).toLocaleString("pt-BR", {
        maximumFractionDigits: 2,
      });

    case "peso_unitario":
      return converterNumeroVisualizacao(item.peso_unitario).toLocaleString("pt-BR", {
        minimumFractionDigits: 4,

        maximumFractionDigits: 4,
      });

    case "consumo_total":
      return converterNumeroVisualizacao(item.consumo_total).toLocaleString("pt-BR", {
        minimumFractionDigits: 4,

        maximumFractionDigits: 4,
      });

    case "gasto_unidade":
      return converterNumeroVisualizacao(item.gasto_unidade).toLocaleString("pt-BR", {
        minimumFractionDigits: 4,

        maximumFractionDigits: 6,
      });

    /* =================================================
         PEDIDOS
      ================================================= */

    case "pedido":
      return item.pedido || "-";

    case "cliente":
      return item.cliente || "-";

    case "dias_atraso":
      return converterNumeroVisualizacao(item.dias_atraso).toLocaleString("pt-BR", {
        maximumFractionDigits: 0,
      });

    case "codigo_produto":
      return item.codigo_produto || item.codigoProduto || "-";

    case "produto_pedido":
      return item.produto_pedido || item.produto || "-";

    case "quantidade":
      return converterNumeroVisualizacao(item.quantidade).toLocaleString("pt-BR", {
        maximumFractionDigits: 3,
      });

    case "pedidos":
      return converterNumeroVisualizacao(item.pedidos).toLocaleString("pt-BR", {
        maximumFractionDigits: 0,
      });

    case "unidade":
      return item.unidade || "-";

    case "vendedor":
      return item.vendedor || "-";

    case "status":
      return item.status || "-";

    default: {
      const valor = item?.[chave];

      if (valor === null || valor === undefined || valor === "") {
        return "-";
      }

      return String(valor);
    }
  }
};

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

function TelaRelatorios({ dadosBrutos: dadosExternos }) {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [relatorioSelecionadoId, setRelatorioSelecionadoId] = useState(null);

  const [filtros, setFiltros] = useState(() => criarFiltrosIniciais());

  const [visualizacaoAberta, setVisualizacaoAberta] = useState(false);

  /* =====================================================
     RELATÓRIO SELECIONADO
  ===================================================== */

  const relatorioSelecionado = useMemo(
    () => RELATORIOS.find((relatorio) => relatorio.id === relatorioSelecionadoId) || null,

    [relatorioSelecionadoId],
  );

  const fonteEhPedidos = relatorioSelecionado?.fonteDados === "pedidos";

  /* =====================================================
     PRODUÇÃO
  ===================================================== */

  const temDadosExternos = Array.isArray(dadosExternos) && dadosExternos.length > 0;

  const {
    dados: dadosProducao,

    loading: carregandoProducao,
  } = useCargaMaquina({
    enabled: !temDadosExternos && !fonteEhPedidos,
  });

  const dadosProducaoBrutos = temDadosExternos ? dadosExternos : dadosProducao;

  /* =====================================================
     PEDIDOS

     NÃO CONSULTA O OMIE DIRETAMENTE.

     buscarPedidosOmie lê os dados sincronizados
     existentes no Supabase.
  ===================================================== */

  const {
    data: respostaPedidos,

    error: erroPedidos,

    isLoading: carregandoPedidos,
  } = useQuery({
    queryKey: ["pedidos-supabase-relatorios"],

    enabled: fonteEhPedidos,

    queryFn: async () => {
      const {
        data: sessaoData,

        error: sessaoErro,
      } = await supabase.auth.getSession();

      if (sessaoErro) {
        throw new Error("Não foi possível validar sua sessão.");
      }

      const accessToken = sessaoData?.session?.access_token;

      if (!accessToken) {
        throw new Error("Sua sessão expirou. Entre novamente no sistema.");
      }

      return await buscarPedidosOmie({
        data: {
          accessToken,
        },
      });
    },

    staleTime: 30 * 1000,

    refetchOnMount: true,

    refetchOnWindowFocus: true,

    retry: 1,
  });

  const pedidosBrutos = Array.isArray(respostaPedidos?.pedidos) ? respostaPedidos.pedidos : [];

  /* =====================================================
     FONTE ATUAL
  ===================================================== */

  const dadosBrutos = fonteEhPedidos
    ? pedidosBrutos
    : Array.isArray(dadosProducaoBrutos)
      ? dadosProducaoBrutos
      : [];

  const loading = fonteEhPedidos
    ? carregandoPedidos
    : relatorioSelecionado
      ? carregandoProducao
      : false;

  /* =====================================================
     DESCRIÇÕES PRODUTOS DA PRODUÇÃO
  ===================================================== */

  const { descricoesProdutos } = useDescricoesProdutos({
    enabled: relatorioSelecionadoId === "producao-produto",
  });

  /* =====================================================
     CATEGORIAS
  ===================================================== */

  const categorias = useMemo(() => [...new Set(RELATORIOS.map((item) => item.categoria))], []);

  /* =====================================================
     COLUNAS
  ===================================================== */

  const colunasVisualizacao = useMemo(() => {
    if (!relatorioSelecionado || !Array.isArray(relatorioSelecionado.colunas)) {
      return [];
    }

    const chaves = [...relatorioSelecionado.colunas];

    /* Produção por produto */

    if (relatorioSelecionado.id === "producao-produto") {
      const indiceProduto = chaves.indexOf("produto");

      if (indiceProduto !== -1 && !chaves.includes("descricao_produto")) {
        chaves.splice(indiceProduto + 1, 0, "descricao_produto");
      }
    }

    return chaves.map((chave) => ({
      chave,

      titulo: TITULOS_COLUNAS_VISUALIZACAO[chave] || criarTituloAutomatico(chave),

      numerica: COLUNAS_NUMERICAS.has(chave),
    }));
  }, [relatorioSelecionado]);

  /* =====================================================
     PRODUTOS DA PRODUÇÃO
  ===================================================== */

  const produtosDisponiveis = useMemo(() => {
    if (fonteEhPedidos) {
      return [];
    }

    let lista = Array.isArray(dadosBrutos) ? dadosBrutos : [];

    if (filtros.injetora && filtros.injetora !== "Todos") {
      lista = lista.filter(
        (item) => String(item.injetora || "").trim() === String(filtros.injetora).trim(),
      );
    }

    return [...new Set(lista.map((item) => item.cod_prod || item.produto))].filter(Boolean);
  }, [dadosBrutos, filtros.injetora, fonteEhPedidos]);

  /* =====================================================
     MATÉRIAS-PRIMAS
  ===================================================== */

  const mpsDisponiveis = useMemo(() => {
    if (fonteEhPedidos || !Array.isArray(dadosBrutos)) {
      return [];
    }

    return [...new Set(dadosBrutos.map((item) => item.mp || item.materia_prima))].filter(Boolean);
  }, [dadosBrutos, fonteEhPedidos]);

  /* =====================================================
     TIPOS
  ===================================================== */

  const tiposDisponiveis = useMemo(() => {
    if (fonteEhPedidos || !Array.isArray(dadosBrutos)) {
      return [];
    }

    return [
      ...new Set(
        dadosBrutos
          .map((item) => String(item.tipo ?? "").trim())
          .filter((tipo) => ["1", "2", "3"].includes(tipo)),
      ),
    ].sort((a, b) => Number(a) - Number(b));
  }, [dadosBrutos, fonteEhPedidos]);

  /* =====================================================
     FILTRAGEM
  ===================================================== */

  const dadosFiltrados = useMemo(() => {
    if (!Array.isArray(dadosBrutos) || !relatorioSelecionado) {
      return [];
    }

    /* =================================================
           PEDIDOS
        ================================================= */

    if (fonteEhPedidos) {
      return dadosBrutos.filter((item) => {
        /* FILTRO FIXO */

        if (relatorioSelecionado.filtroFixo && !relatorioSelecionado.filtroFixo(item)) {
          return false;
        }

        /* STATUS */

        if (relatorioSelecionado.filtros.status && filtros.status && filtros.status !== "todos") {
          if (normalizarTexto(item.status) !== normalizarTexto(filtros.status)) {
            return false;
          }
        }

        /* PERÍODO */

        if (relatorioSelecionado.filtros.periodo) {
          const dataRegistro = obterDataPedidoRelatorio(item);

          if ((filtros.dataInicio || filtros.dataFim) && !dataRegistro) {
            return false;
          }

          if (filtros.dataInicio && dataRegistro < filtros.dataInicio) {
            return false;
          }

          if (filtros.dataFim && dataRegistro > filtros.dataFim) {
            return false;
          }
        }

        /* CLIENTE */

        if (
          relatorioSelecionado.filtros.cliente &&
          filtros.cliente &&
          filtros.cliente !== "todos"
        ) {
          if (String(item.cliente || "").trim() !== String(filtros.cliente).trim()) {
            return false;
          }
        }

        /* VENDEDOR */

        if (
          relatorioSelecionado.filtros.vendedor &&
          filtros.vendedor &&
          filtros.vendedor !== "todos"
        ) {
          if (String(item.vendedor || "").trim() !== String(filtros.vendedor).trim()) {
            return false;
          }
        }

        /* PRODUTO */

        if (
          relatorioSelecionado.filtros.produto &&
          filtros.cod_prod &&
          filtros.cod_prod !== "Todos"
        ) {
          const codigo = String(
            item.codigoProduto ?? item.codigo_produto ?? item.codigo ?? "",
          ).trim();

          if (codigo !== String(filtros.cod_prod).trim()) {
            return false;
          }
        }

        return true;
      });
    }

    /* =================================================
           PRODUÇÃO E PARADAS
        ================================================= */

    return dadosBrutos.filter((item) => {
      /* FILTRO FIXO */

      if (relatorioSelecionado.filtroFixo && !relatorioSelecionado.filtroFixo(item)) {
        return false;
      }

      /* PERÍODO */

      if (relatorioSelecionado.filtros.periodo) {
        const dataRegistro = obterDataDoRegistro(item);

        if ((filtros.dataInicio || filtros.dataFim) && !dataRegistro) {
          return false;
        }

        if (filtros.dataInicio && dataRegistro < filtros.dataInicio) {
          return false;
        }

        if (filtros.dataFim && dataRegistro > filtros.dataFim) {
          return false;
        }
      }

      /* INJETORA */

      if (
        relatorioSelecionado.filtros.injetora &&
        filtros.injetora &&
        filtros.injetora !== "Todos"
      ) {
        if (String(item.injetora || "").trim() !== String(filtros.injetora).trim()) {
          return false;
        }
      }

      /* PRODUTO */

      if (
        relatorioSelecionado.filtros.produto &&
        filtros.cod_prod &&
        filtros.cod_prod !== "Todos"
      ) {
        const produto = String(item.cod_prod || item.produto || "").trim();

        if (produto !== String(filtros.cod_prod).trim()) {
          return false;
        }
      }

      /* MP */

      if (relatorioSelecionado.filtros.mp && filtros.mp && filtros.mp !== "Todos") {
        const mp = String(item.mp || item.materia_prima || "").trim();

        if (mp !== String(filtros.mp).trim()) {
          return false;
        }
      }

      /* TIPO */

      if (
        relatorioSelecionado.filtros.tipo &&
        Array.isArray(filtros.tipo) &&
        filtros.tipo.length > 0
      ) {
        const tipo = String(item.tipo || "").trim();

        const selecionados = filtros.tipo.map((valor) => String(valor).trim());

        if (!selecionados.includes(tipo)) {
          return false;
        }
      }

      return true;
    });
  }, [dadosBrutos, filtros, fonteEhPedidos, relatorioSelecionado]);

  /* =====================================================
     TRANSFORMAR DADOS
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
     DESCRIÇÃO DO PRODUTO
  ===================================================== */

  const dadosRelatorioFinal = useMemo(() => {
    if (relatorioSelecionado?.id !== "producao-produto") {
      return dadosRelatorio;
    }

    return dadosRelatorio.map((item) => {
      const codigo = normalizarCodigoProduto(item.produto || item.cod_prod || "");

      let descricao = "-";

      if (descricoesProdutos instanceof Map) {
        descricao = descricoesProdutos.get(codigo) || "-";
      } else if (descricoesProdutos && typeof descricoesProdutos === "object") {
        descricao = descricoesProdutos[codigo] || "-";
      }

      return {
        ...item,

        descricao_produto: descricao,
      };
    });
  }, [dadosRelatorio, descricoesProdutos, relatorioSelecionado]);

  /* =====================================================
     SELECIONAR RELATÓRIO
  ===================================================== */

  const selecionarRelatorio = (id) => {
    const relatorio = RELATORIOS.find((item) => item.id === id);

    setRelatorioSelecionadoId(id);

    setFiltros(criarFiltrosIniciais(relatorio?.fonteDados || "producao"));

    setVisualizacaoAberta(false);
  };

  /* =====================================================
     VOLTAR
  ===================================================== */

  const voltarListaRelatorios = () => {
    setRelatorioSelecionadoId(null);

    setFiltros(criarFiltrosIniciais());

    setVisualizacaoAberta(false);
  };

  /* =====================================================
     TEXTO DOS FILTROS
  ===================================================== */

  const montarTextoFiltros = () => {
    const lista = [];

    /* PEDIDOS */

    if (fonteEhPedidos) {
      if (filtros.cliente && filtros.cliente !== "todos") {
        lista.push(`Cliente: ${filtros.cliente}`);
      }

      if (filtros.vendedor && filtros.vendedor !== "todos") {
        lista.push(`Vendedor: ${filtros.vendedor}`);
      }

      if (filtros.cod_prod && filtros.cod_prod !== "Todos") {
        lista.push(`Produto: ${filtros.cod_prod}`);
      }

      if (relatorioSelecionado?.filtros?.status && filtros.status && filtros.status !== "todos") {
        lista.push(`Status: ${filtros.status}`);
      }
    } else {
      /* PRODUÇÃO */

      if (filtros.injetora && filtros.injetora !== "Todos") {
        lista.push(`Injetora: ${filtros.injetora}`);
      }

      if (filtros.cod_prod && filtros.cod_prod !== "Todos") {
        lista.push(`Produto: ${filtros.cod_prod}`);
      }

      if (filtros.mp && filtros.mp !== "Todos") {
        lista.push(`MP: ${filtros.mp}`);
      }
    }

    /* DATA INICIAL */

    if (filtros.dataInicio) {
      lista.push(`De: ${filtros.dataInicio.split("-").reverse().join("/")}`);
    }

    /* DATA FINAL */

    if (filtros.dataFim) {
      lista.push(`Até: ${filtros.dataFim.split("-").reverse().join("/")}`);
    }

    return lista.length > 0
      ? lista.join(" | ")
      : fonteEhPedidos
        ? "Status Pedido"
        : "Sem filtros adicionais";
  };

  /* =====================================================
     PDF
  ===================================================== */

  const handleGerarPDF = () => {
    gerarPdfRelatorio({
      relatorio: relatorioSelecionado,

      dados: dadosRelatorioFinal,

      textoFiltros: montarTextoFiltros(),
    });
  };

  /* =====================================================
     EXCEL
  ===================================================== */

  const handleGerarExcel = async () => {
    await gerarExcelRelatorio({
      relatorio: relatorioSelecionado,

      dados: dadosRelatorioFinal,
    });
  };

  /* =====================================================
     CARREGANDO
  ===================================================== */

  if (loading && relatorioSelecionado) {
    return (
      <div className="relatorios-loading">
        <div className="relatorios-loading-card">
          <div className="relatorios-spinner" />

          <p>Carregando dados do relatório...</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="relatorios-container">
      {/* =================================================
          VOLTAR
      ================================================= */}

      {relatorioSelecionado && (
        <div className="relatorios-navegacao-topo">
          <button type="button" className="btn-voltar-topo" onClick={voltarListaRelatorios}>
            <FiArrowLeft />

            <span>Painel de Relatórios</span>
          </button>
        </div>
      )}

      {/* =================================================
    CABEÇALHO
    APARECE SOMENTE NO MENU DE RELATÓRIOS
================================================= */}

      {!relatorioSelecionado && (
        <div className="relatorios-header">
          <div>
            <span className="relatorios-eyebrow">Central de Relatórios</span>

            <h1>Relatórios</h1>

            <p>
              Consulte produção, paradas e pedidos utilizando dados já sincronizados no sistema.
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          LISTA DOS RELATÓRIOS
      ================================================= */}

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
                          <span className="relatorio-card-categoria">{relatorio.categoria}</span>

                          <h3>{relatorio.titulo}</h3>

                          <p>{relatorio.descricao}</p>
                        </div>

                        <FiChevronRight className="relatorio-card-seta" />
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* =================================================
          RELATÓRIO SELECIONADO
      ================================================= */}

      {relatorioSelecionado && (
        <div className="relatorio-selecionado">
          {/* ===============================================
              CABEÇALHO
          =============================================== */}

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

          {/* ===============================================
              ERRO PEDIDOS
          =============================================== */}

          {fonteEhPedidos && erroPedidos && (
            <div className="relatorios-erro">
              {erroPedidos.message || "Não foi possível carregar os pedidos."}
            </div>
          )}

          {/* ===============================================
              AÇÕES
          =============================================== */}

          <div className="relatorio-acoes">
            <button
              type="button"
              className="btn-relatorio"
              onClick={() => setVisualizacaoAberta(true)}
              disabled={dadosRelatorioFinal.length === 0}
            >
              <FiEye />

              <div>
                <strong>Visualizar</strong>

                <span>Conferir antes de exportar</span>
              </div>
            </button>

            <button
              type="button"
              className="btn-relatorio btn-relatorio-pdf"
              onClick={handleGerarPDF}
              disabled={dadosRelatorioFinal.length === 0}
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
              disabled={dadosRelatorioFinal.length === 0}
            >
              <FiDownload />

              <div>
                <strong>Exportar Excel</strong>

                <span>Tabela XLSX</span>
              </div>
            </button>
          </div>


          {/* ===============================================
              FILTROS
          =============================================== */}

          <div className="relatorio-filtros-card">
            <div className="relatorio-filtros-header">
              <div>
                <h3>Parâmetros do relatório</h3>

                <p>Refine os dados antes de visualizar ou exportar.</p>
              </div>
            </div>

            {fonteEhPedidos ? (
              <FiltrosPedidosRelatorio
                filtros={filtros}

                setFiltros={setFiltros}

                pedidos={pedidosBrutos}

                relatorio={relatorioSelecionado}
              />
            ) : (
              <FiltrosDashboard
                filtros={filtros}

                setFiltros={setFiltros}

                rawDados={dadosBrutos}

                exibirPeriodo={relatorioSelecionado.filtros.periodo}

                exibirInjetora={relatorioSelecionado.filtros.injetora}

                exibirTurno={false}

                exibirProduto={relatorioSelecionado.filtros.produto}

                exibirMp={relatorioSelecionado.filtros.mp}

                exibirTipo={relatorioSelecionado.filtros.tipo}

                tiposDisponiveis={tiposDisponiveis}

                produtosDisponiveis={produtosDisponiveis}

                mpsDisponiveis={mpsDisponiveis}

                modoRelatorio={true}
              />
            )}
          </div>

          {/* ===============================================
              RESUMO
          =============================================== */}

          <div className="relatorio-resumo-grid">
            <div className="relatorio-resumo-card">
              <span>Registros no relatório</span>

              <strong>{dadosRelatorioFinal.length}</strong>
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

          
          {/* ===============================================
              VISUALIZAÇÃO
          =============================================== */}

          {visualizacaoAberta && (
            <section className="relatorio-visualizacao">
              <div className="relatorio-visualizacao-header">
                <div>
                  <span className="relatorio-visualizacao-eyebrow">Pré-visualização</span>

                  <h3>{relatorioSelecionado.titulo}</h3>
                </div>

                <button
                  type="button"
                  className="relatorio-visualizacao-fechar"
                  onClick={() => setVisualizacaoAberta(false)}
                  aria-label="Fechar visualização"
                >
                  <FiX />
                </button>
              </div>

              <div className="relatorio-visualizacao-info">
                <div className="relatorio-visualizacao-info-item">
                  <span>Filtros</span>

                  <strong>{montarTextoFiltros()}</strong>
                </div>

                <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
                  <span>Registros</span>

                  <strong>{dadosRelatorioFinal.length}</strong>
                </div>
              </div>

              {dadosRelatorioFinal.length > 0 ? (
                <div className="relatorio-visualizacao-tabela-wrapper">
                  <table className="relatorio-visualizacao-tabela">
                    <thead>
                      <tr>
                        {colunasVisualizacao.map((coluna) => (
                          <th
                            key={coluna.chave}
                            className={coluna.numerica ? "coluna-numerica" : ""}
                          >
                            {coluna.titulo}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {dadosRelatorioFinal.map((item, indice) => (
                        <tr key={`${relatorioSelecionado.id}-${indice}`}>
                          {colunasVisualizacao.map((coluna) => (
                            <td
                              key={coluna.chave}
                              className={coluna.numerica ? "coluna-numerica" : ""}
                            >
                              {obterValorVisualizacao(item, coluna.chave)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="relatorio-visualizacao-vazia">
                  <FiFileText />

                  <strong>Nenhum registro encontrado</strong>

                  <span>Ajuste os filtros para visualizar os dados.</span>
                </div>
              )}

              <div className="relatorio-visualizacao-footer">
                <span>{dadosRelatorioFinal.length} registro(s) exibido(s)</span>

                <span>Visualização atualizada conforme os filtros</span>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default TelaRelatorios;
