import { Fragment, useEffect, useMemo, useState } from "react";

import {
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiGitBranch,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabaseClient";

// Paginação padrão já utilizada no sistema.
import Paginacao from "@/components/paginacao/Paginacao";

import "./PedidosAlteradosRelatorio.css";

/* =====================================================
   CONFIGURAÇÕES
===================================================== */

const ITENS_POR_PAGINA = 8;


/* =====================================================
   DESDOBRAMENTO / NUMERAÇÃO VISUAL

   Mantido neste arquivo para que seja necessário alterar
   somente PedidosAlteradosRelatorio.jsx.
===================================================== */

const TAMANHO_PAGINA_NUMERACAO = 1000;

function obterTimestampCriacaoPedido(valor) {
  if (!valor) {
    return Number.POSITIVE_INFINITY;
  }

  const timestamp = new Date(valor).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : Number.POSITIVE_INFINITY;
}

function criarMapaMetadadosPedidoExibicao(registros) {
  const pedidosPorCodigo = new Map();

  for (const registro of registros ?? []) {
    const codigo = Number(registro?.codigo_pedido_omie);
    const numeroPedido = String(registro?.numero_pedido ?? "").trim();

    if (!Number.isFinite(codigo) || codigo <= 0 || !numeroPedido) {
      continue;
    }

    const criadoEmOriginal = registro?.criado_em ?? null;
    const criadoEm = obterTimestampCriacaoPedido(criadoEmOriginal);
    const existente = pedidosPorCodigo.get(codigo);

    if (!existente || criadoEm < existente.criadoEm) {
      pedidosPorCodigo.set(codigo, {
        codigo,
        numeroPedido,
        criadoEm,
        criadoEmOriginal,
      });
    }
  }

  const gruposPorNumero = new Map();

  for (const pedido of pedidosPorCodigo.values()) {
    if (!gruposPorNumero.has(pedido.numeroPedido)) {
      gruposPorNumero.set(pedido.numeroPedido, []);
    }

    gruposPorNumero.get(pedido.numeroPedido).push(pedido);
  }

  const mapaMetadados = new Map();

  for (const [numeroPedido, grupo] of gruposPorNumero.entries()) {
    grupo.sort((pedidoA, pedidoB) => {
      if (pedidoA.criadoEm !== pedidoB.criadoEm) {
        return pedidoA.criadoEm - pedidoB.criadoEm;
      }

      return pedidoA.codigo - pedidoB.codigo;
    });

    const total = grupo.length;

    const partes = grupo.map((pedido, indice) => ({
      codigo_pedido_omie: pedido.codigo,
      numero_pedido: numeroPedido,
      numero_exibicao: indice === 0 ? numeroPedido : `${numeroPedido}/${indice}`,
      indice,
      criado_em: pedido.criadoEmOriginal,
    }));

    grupo.forEach((pedido, indice) => {
      mapaMetadados.set(pedido.codigo, {
        codigoPedidoOmie: pedido.codigo,
        numeroOriginal: numeroPedido,
        numeroExibicao: indice === 0 ? numeroPedido : `${numeroPedido}/${indice}`,
        indice,
        total,
        desdobrado: total > 1,
        ehOriginal: indice === 0,
        quantidadeDerivados: Math.max(0, total - 1),
        partes,
      });
    });
  }

  return mapaMetadados;
}

async function carregarMapaMetadadosPedidoExibicao() {
  const registros = [];
  let inicio = 0;

  while (true) {
    const { data, error } = await supabase
      .from("pedidos_omie")
      .select("codigo_pedido_omie,numero_pedido,criado_em")
      .order("criado_em", { ascending: true })
      .order("codigo_pedido_omie", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA_NUMERACAO - 1);

    if (error) {
      throw error;
    }

    const pagina = Array.isArray(data) ? data : [];
    registros.push(...pagina);

    if (pagina.length < TAMANHO_PAGINA_NUMERACAO) {
      break;
    }

    inicio += TAMANHO_PAGINA_NUMERACAO;
  }

  return criarMapaMetadadosPedidoExibicao(registros);
}

const ESTILOS_DESDOBRAMENTO = `
.pedidos-alterados-pedido-identificacao {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.pedidos-alterados-desdobramento-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 0.56rem;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}

.pedidos-alterados-desdobramento-badge svg {
  width: 11px;
  height: 11px;
}

.pedidos-alterados-desdobramento-badge.original {
  color: #7c3aed;
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
}

.pedidos-alterados-desdobramento-badge.derivado {
  color: #0369a1;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
}

.pedidos-alterados-desdobramento-aviso {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  padding: 11px 12px;
  color: #334155;
  background: #f8fafc;
  border: 1px solid #dbeafe;
  border-left: 3px solid #6366f1;
  border-radius: 8px;
}

.pedidos-alterados-desdobramento-aviso > svg {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin-top: 1px;
  color: #4f46e5;
}

.pedidos-alterados-desdobramento-aviso > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pedidos-alterados-desdobramento-aviso strong {
  color: #1e293b;
  font-size: 0.72rem;
}

.pedidos-alterados-desdobramento-aviso > div > span {
  color: #64748b;
  font-size: 0.64rem;
  line-height: 1.45;
}

.pedidos-alterados-desdobramento-partes {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 5px;
}

.pedidos-alterados-desdobramento-partes small {
  color: #94a3b8;
  font-size: 0.58rem;
  font-weight: 700;
}

.pedidos-alterados-desdobramento-partes > div {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.pedidos-alterados-desdobramento-partes > div > span {
  display: inline-flex;
  padding: 3px 7px;
  color: #475569;
  background: #ffffff;
  border: 1px solid #dbe3ee;
  border-radius: 999px;
  font-size: 0.59rem;
  font-weight: 800;
}

.pedidos-alterados-desdobramento-partes > div > span.atual {
  color: #4338ca;
  background: #eef2ff;
  border-color: #c7d2fe;
}
`;

/* =====================================================
   FORMATAR DATA E HORA
===================================================== */

function formatarDataHora(valor) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatarDataSemFuso(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  const texto = String(valor).trim();

  // Data no formato YYYY-MM-DD: não converter para UTC.
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);

  if (correspondencia) {
    const [, ano, mes, dia] = correspondencia;

    return `${dia}/${mes}/${ano}`;
  }

  // Data que já está no formato brasileiro.
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    return texto;
  }

  return texto;
}

/* =====================================================
   FORMATAR DATA PARA INPUT
===================================================== */

function formatarDataInput(data) {
  const ano = data.getFullYear();

  const mes = String(data.getMonth() + 1).padStart(2, "0");

  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

/* =====================================================
   PERÍODO PADRÃO

   Primeiro dia do mês até hoje.
===================================================== */

function obterPeriodoPadrao() {
  const hoje = new Date();

  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  return {
    inicio: formatarDataInput(inicio),
    fim: formatarDataInput(hoje),
  };
}

/* =====================================================
   NORMALIZAR TEXTO
===================================================== */

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* =====================================================
   RÓTULOS DOS CAMPOS
===================================================== */

const ROTULOS_DETALHES = Object.freeze({
  numero_pedido: "Número do pedido",
  cliente: "Cliente",
  data_pedido: "Data do pedido",
  previsao: "Previsão de faturamento",
  codigo_produto: "Código do produto",
  produto: "Produto",
  quantidade: "Quantidade",
  unidade: "Unidade",
  vendedor: "Vendedor",
  valor: "Valor",
  item_adicionado: "Item adicionado",
});

function obterRotuloCampo(chave) {
  return (
    ROTULOS_DETALHES[chave] ||
    String(chave ?? "")
      .replace(/_/g, " ")
      .replace(/^\w/, (letra) => letra.toUpperCase())
  );
}

/* =====================================================
   FORMATAR VALORES DO HISTÓRICO
===================================================== */

function formatarValorGenerico(valor, chave = "") {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  const chaveNormalizada = normalizarTexto(chave);

  // Somente campos realmente identificados como data podem ser formatados como data.
  // Isso evita que números como 20240, 10120 ou 20000 sejam interpretados pelo
  // JavaScript como anos (01/01/20240, 01/01/10120, etc.).
  if (chaveNormalizada.includes("data") || chaveNormalizada.includes("previsao")) {
    return formatarDataSemFuso(valor);
  }

  if (chaveNormalizada === "valor" && Number.isFinite(Number(valor))) {
    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (chaveNormalizada === "quantidade" && Number.isFinite(Number(valor))) {
    return Number(valor).toLocaleString("pt-BR", {
      maximumFractionDigits: 3,
    });
  }

  if (typeof valor === "object") {
    return JSON.stringify(valor);
  }

  return String(valor);
}

/* =====================================================
   EXTRAIR ALTERAÇÕES DE UMA OCORRÊNCIA
===================================================== */

function extrairMudancas(ocorrencia) {
  const detalhes = ocorrencia?.detalhes;

  if (!detalhes || typeof detalhes !== "object") {
    return [];
  }

  return Object.entries(detalhes).map(([chave, valor]) => {
    /* ITEM ADICIONADO */

    if (chave === "item_adicionado" && valor && typeof valor === "object") {
      const descricao = [
        valor.codigo_produto,

        valor.produto,

        valor.quantidade !== undefined ? `${valor.quantidade} ${valor.unidade || ""}`.trim() : null,
      ]
        .filter(Boolean)
        .join(" • ");

      return {
        chave,
        campo: "Item adicionado",
        anterior: "-",
        novo: descricao || "Novo item incluído",
      };
    }

    /* ALTERAÇÃO NORMAL */

    const anterior = valor && typeof valor === "object" ? valor.anterior : null;

    const novo = valor && typeof valor === "object" ? valor.novo : valor;

    return {
      chave,

      campo: obterRotuloCampo(chave),

      anterior: formatarValorGenerico(anterior, chave),

      novo: formatarValorGenerico(novo, chave),
    };
  });
}

/* =====================================================
   COMPONENTE PRINCIPAL
===================================================== */

export default function PedidosAlteradosRelatorio() {
  /* =================================================
     PERÍODO INICIAL
  ================================================= */

  const periodoPadrao = useMemo(() => obterPeriodoPadrao(), []);

  /* =================================================
     ESTADOS DOS FILTROS
  ================================================= */

  const [dataInicial, setDataInicial] = useState(periodoPadrao.inicio);

  const [dataFinal, setDataFinal] = useState(periodoPadrao.fim);

  const [pesquisa, setPesquisa] = useState("");

  /* =================================================
     PAGINAÇÃO
  ================================================= */

  const [paginaAtual, setPaginaAtual] = useState(1);

  /* =================================================
     HISTÓRICO EXPANDIDO
  ================================================= */

  const [pedidosExpandidos, setPedidosExpandidos] = useState(() => new Set());

  /* =================================================
     EXPORTAÇÃO
  ================================================= */

  const [exportando, setExportando] = useState(null);

  /* =================================================
     CONSULTA PRINCIPAL DO RELATÓRIO

     IMPORTANTE:
     O carregamento dos pedidos NÃO depende mais da consulta
     auxiliar de desdobramentos. Primeiro o relatório carrega
     normalmente pela RPC. A identificação de desdobramento é
     buscada em uma segunda consulta, sem bloquear a tela.
  ================================================= */

  const {
    data: relatorioBase = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "relatorio-pedidos-alterados",
      dataInicial,
      dataFinal,
    ],

    queryFn: async () => {
      const { data, error: erroRpc } = await supabase.rpc(
        "listar_relatorio_pedidos_alterados",
        {
          p_data_inicial: dataInicial || null,
          p_data_final: dataFinal || null,
          p_limite: 2000,
        },
      );

      if (erroRpc) {
        throw erroRpc;
      }

      return Array.isArray(data) ? data : [];
    },

    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  /* =================================================
     CONSULTA AUXILIAR DE DESDOBRAMENTOS

     Se essa consulta falhar por qualquer motivo, os pedidos
     continuam aparecendo normalmente. Apenas o selo /1, /2 e
     a mensagem de desdobramento ficam temporariamente sem ser
     exibidos.
  ================================================= */

  const {
    data: mapaMetadadosPedidoExibicao,
  } = useQuery({
    queryKey: ["mapa-metadados-pedidos-desdobrados-v3"],

    queryFn: async () => {
      try {
        return await carregarMapaMetadadosPedidoExibicao();
      } catch (erro) {
        console.warn(
          "Não foi possível carregar os metadados de desdobramento dos pedidos:",
          erro,
        );

        return new Map();
      }
    },

    enabled: relatorioBase.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  /* =================================================
     APLICAR NUMERAÇÃO VISUAL / DESDOBRAMENTO

     Enquanto o mapa auxiliar ainda não chegou, usa exatamente
     os dados originais retornados pela RPC. Assim o relatório
     nunca fica vazio aguardando a consulta de desdobramento.
  ================================================= */

  const relatorio = useMemo(() => {
    const mapa =
      mapaMetadadosPedidoExibicao instanceof Map
        ? mapaMetadadosPedidoExibicao
        : new Map();

    return relatorioBase.map((pedido) => {
      const codigoPedidoOmie = Number(
        pedido?.codigo_pedido_omie,
      );

      const numeroOriginal = String(
        pedido?.numero_pedido ??
          codigoPedidoOmie ??
          "",
      ).trim();

      const metadadosDesdobramento =
        mapa.get(codigoPedidoOmie);

      const numeroExibicao =
        metadadosDesdobramento?.numeroExibicao ??
        numeroOriginal;

      return {
        ...pedido,

        numero_pedido_original: numeroOriginal,

        // A troca acontece somente no objeto em memória do relatório.
        // O Supabase e o Omie continuam com o número original.
        numero_pedido: numeroExibicao,

        // Metadados visuais do desdobramento.
        // Isso NÃO aumenta a contagem de alterações.
        pedido_desdobrado:
          Boolean(metadadosDesdobramento?.desdobrado),

        pedido_desdobramento_original:
          Boolean(metadadosDesdobramento?.ehOriginal),

        pedido_desdobramento_indice:
          Number(metadadosDesdobramento?.indice ?? 0),

        pedido_desdobramento_total:
          Number(metadadosDesdobramento?.total ?? 1),

        pedido_desdobramento_quantidade_derivados:
          Number(metadadosDesdobramento?.quantidadeDerivados ?? 0),

        pedido_desdobramento_partes:
          Array.isArray(metadadosDesdobramento?.partes)
            ? metadadosDesdobramento.partes
            : [],
      };
    });
  }, [relatorioBase, mapaMetadadosPedidoExibicao]);

  /* =================================================
     FILTRAGEM LOCAL
  ================================================= */

  const pedidosFiltrados = useMemo(() => {
    const termo = normalizarTexto(pesquisa);

    if (!termo) {
      return relatorio;
    }

    return relatorio.filter((pedido) => {
      const campos = Array.isArray(pedido?.campos_alterados)
        ? pedido.campos_alterados.join(" ")
        : "";

      return [
        pedido?.numero_pedido,
        pedido?.numero_pedido_original,
        pedido?.pedido_desdobrado ? "desdobrado desdobramento" : "",
        pedido?.cliente,
        pedido?.vendedor,
        campos,
        pedido?.ultimo_resumo,
      ].some((valor) => normalizarTexto(valor).includes(termo));
    });
  }, [relatorio, pesquisa]);

  /* =================================================
     TOTAL DE ALTERAÇÕES

     Calculado sobre todos os registros filtrados,
     independentemente da página atual.
  ================================================= */

  const totalAlteracoes = useMemo(
    () =>
      pedidosFiltrados.reduce(
        (total, pedido) => total + Number(pedido?.quantidade_alteracoes ?? 0),
        0,
      ),

    [pedidosFiltrados],
  );

  /* =================================================
     PAGINAÇÃO PADRÃO

     10 pedidos por página.
  ================================================= */

  const totalItens = pedidosFiltrados.length;

  const totalPaginas = Math.max(1, Math.ceil(totalItens / ITENS_POR_PAGINA));

  /* =================================================
     GARANTIR PÁGINA VÁLIDA
  ================================================= */

  const paginaValida = Math.max(1, Math.min(paginaAtual, totalPaginas));

  useEffect(() => {
    if (paginaAtual !== paginaValida) {
      setPaginaAtual(paginaValida);
    }
  }, [paginaAtual, paginaValida]);

  /* =================================================
     PEDIDOS DA PÁGINA ATUAL

     Somente a tabela recebe paginação.
  ================================================= */

  const pedidosPagina = useMemo(() => {
    const inicio = (paginaValida - 1) * ITENS_POR_PAGINA;

    return pedidosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [pedidosFiltrados, paginaValida]);

  /* =================================================
     INTERVALO EXIBIDO
  ================================================= */

  const inicioExibicao = totalItens > 0 ? (paginaValida - 1) * ITENS_POR_PAGINA + 1 : 0;

  const fimExibicao = Math.min(paginaValida * ITENS_POR_PAGINA, totalItens);

  /* =================================================
     EXPANDIR HISTÓRICO DO PEDIDO
  ================================================= */

  function alternarPedido(codigo) {
    setPedidosExpandidos((atual) => {
      const proximo = new Set(atual);

      if (proximo.has(codigo)) {
        proximo.delete(codigo);
      } else {
        proximo.add(codigo);
      }

      return proximo;
    });
  }

  /* =================================================
     ALTERAR DATA INICIAL
  ================================================= */

  function alterarDataInicial(valor) {
    setDataInicial(valor);

    setPaginaAtual(1);
  }

  /* =================================================
     ALTERAR DATA FINAL
  ================================================= */

  function alterarDataFinal(valor) {
    setDataFinal(valor);

    setPaginaAtual(1);
  }

  /* =================================================
     ALTERAR PESQUISA
  ================================================= */

  function alterarPesquisa(valor) {
    setPesquisa(valor);

    setPaginaAtual(1);
  }

  /* =================================================
     EXPORTAR PDF

     Exporta todos os pedidos filtrados.
     Não utiliza pedidosPagina.
  ================================================= */

  async function exportarPDF() {
    if (pedidosFiltrados.length === 0 || exportando) {
      return;
    }

    try {
      setExportando("pdf");

      const { exportarPdfPedidosAlterados } = await import("./ExportarPedidosAlteradosPDF.js");

      await exportarPdfPedidosAlterados({
        pedidos: pedidosFiltrados,

        dataInicial,

        dataFinal,

        pesquisa,

        extrairMudancas,

        formatarDataHora,
      });
    } catch (erro) {
      console.error("Erro ao exportar PDF:", erro);

      window.alert("Não foi possível gerar o PDF.");
    } finally {
      setExportando(null);
    }
  }

  /* =================================================
     EXPORTAR EXCEL

     Exporta todos os pedidos filtrados.
     Não utiliza pedidosPagina.
  ================================================= */

  async function exportarExcel() {
    if (pedidosFiltrados.length === 0 || exportando) {
      return;
    }

    try {
      setExportando("excel");

      const { exportarExcelPedidosAlterados } = await import("./ExportarPedidosAlteradosExcel.js");

      await exportarExcelPedidosAlterados({
        pedidos: pedidosFiltrados,

        dataInicial,

        dataFinal,

        pesquisa,

        extrairMudancas,

        formatarDataHora,
      });
    } catch (erro) {
      console.error("Erro ao exportar Excel:", erro);

      window.alert("Não foi possível gerar o Excel.");
    } finally {
      setExportando(null);
    }
  }

  /* =====================================================
     RENDERIZAÇÃO
  ===================================================== */

  return (
    <>
      <style>{ESTILOS_DESDOBRAMENTO}</style>

      {/* ===============================================
          CABEÇALHO DO RELATÓRIO
      =============================================== */}

      <div className="relatorio-selecionado-header">
        <div className="relatorio-selecionado-icone">
          <FiEdit3 />
        </div>

        <div>
          <span className="relatorio-selecionado-categoria">Pedidos</span>

          <h2>Pedidos Alterados</h2>

          <p>
            Acompanhe alterações realizadas no conteúdo dos pedidos, sem considerar o avanço normal
            de status ou etapa.
          </p>
        </div>
      </div>

      {/* ===============================================
          AÇÕES
      =============================================== */}

      <div className="relatorio-acoes">
        {/* PDF */}

        <button
          type="button"
          className="btn-relatorio btn-relatorio-pdf"
          onClick={exportarPDF}
          disabled={totalItens === 0 || Boolean(exportando)}
        >
          {exportando === "pdf" ? (
            <FiRefreshCw className="pedidos-alterados-girando" />
          ) : (
            <FiFileText />
          )}

          <div>
            <strong>Baixar PDF</strong>

            <span>Histórico expandido por pedido</span>
          </div>
        </button>

        {/* EXCEL */}

        <button
          type="button"
          className="btn-relatorio btn-relatorio-csv"
          onClick={exportarExcel}
          disabled={totalItens === 0 || Boolean(exportando)}
        >
          {exportando === "excel" ? (
            <FiRefreshCw className="pedidos-alterados-girando" />
          ) : (
            <FiDownload />
          )}

          <div>
            <strong>Exportar Excel</strong>

            <span>Resumo + histórico expandido</span>
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

            <p>O período é atualizado automaticamente ao alterar as datas.</p>
          </div>
        </div>

        <div className="pedidos-alterados-filtros">
          {/* DATA INICIAL */}

          <label className="pedidos-alterados-campo">
            <span>De</span>

            <input
              type="date"
              value={dataInicial}
              max={dataFinal || undefined}
              onChange={(event) => alterarDataInicial(event.target.value)}
            />
          </label>

          {/* DATA FINAL */}

          <label className="pedidos-alterados-campo">
            <span>Até</span>

            <input
              type="date"
              value={dataFinal}
              min={dataInicial || undefined}
              onChange={(event) => alterarDataFinal(event.target.value)}
            />
          </label>

          {/* PESQUISA */}

          <label className="pedidos-alterados-campo pedidos-alterados-pesquisa-campo">
            <span>Buscar</span>

            <div className="pedidos-alterados-pesquisa">
              <FiSearch />

              <input
                type="text"
                value={pesquisa}
                onChange={(event) => alterarPesquisa(event.target.value)}
                placeholder="Pedido, cliente, vendedor ou campo alterado..."
              />
            </div>
          </label>
        </div>
      </div>

      {/* ===============================================
          ERRO DA CONSULTA
      =============================================== */}

      {error && (
        <div className="relatorios-erro pedidos-alterados-erro">
          <FiAlertTriangle />

          <span>{error.message || "Não foi possível carregar as alterações dos pedidos."}</span>
        </div>
      )}

      {/* ===============================================
          CARREGAMENTO
      =============================================== */}

      {!error && isLoading && (
        <div className="relatorios-loading pedidos-alterados-loading">
          <div className="relatorios-loading-card">
            <div className="relatorios-spinner" />

            <p>Carregando alterações dos pedidos...</p>
          </div>
        </div>
      )}

      {/* ===============================================
          TABELA DE AUDITORIA
      =============================================== */}

      {!error && !isLoading && totalItens > 0 && (
        <>
          <section className="relatorio-visualizacao pedidos-alterados-visualizacao">
            {/* CABEÇALHO */}

            <div className="relatorio-visualizacao-header">
              <div>
                <span className="relatorio-visualizacao-eyebrow">Auditoria</span>

                <h3>Alterações encontradas</h3>
              </div>
            </div>

            {/* INFORMAÇÕES */}

            <div className="relatorio-visualizacao-info">
              <div className="relatorio-visualizacao-info-item">
                <span>Período</span>

                <strong>
                  {dataInicial ? dataInicial.split("-").reverse().join("/") : "Sem data inicial"}

                  {" até "}

                  {dataFinal ? dataFinal.split("-").reverse().join("/") : "Sem data final"}
                </strong>
              </div>

              <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
                <span>Pedidos</span>

                <strong>{totalItens}</strong>
              </div>
            </div>

            {/* =====================================
                TABELA
            ===================================== */}

            <div className="relatorio-visualizacao-tabela-wrapper pedidos-alterados-tabela-wrapper">
              <table className="relatorio-visualizacao-tabela pedidos-alterados-tabela">
                <thead>
                  <tr>
                    <th>Pedido</th>

                    <th>Cliente</th>

                    <th>Vendedor</th>

                    <th>Última alteração</th>

                    <th>Nº alterações</th>

                    <th>O que foi alterado</th>

                    <th>Histórico</th>
                  </tr>
                </thead>

                {/* =================================
                    CORPO DA TABELA

                    Usa pedidosPagina.
                ================================= */}

                <tbody>
                  {pedidosPagina.map((pedido) => {
                    const codigo = pedido.codigo_pedido_omie;

                    const expandido = pedidosExpandidos.has(codigo);

                    const campos = Array.isArray(pedido.campos_alterados)
                      ? pedido.campos_alterados
                      : [];

                    const ocorrencias = Array.isArray(pedido.detalhes_alteracoes)
                      ? pedido.detalhes_alteracoes
                      : [];

                    return (
                      <Fragment key={`pedido-${codigo}`}>
                        {/* =========================
                            LINHA DO PEDIDO
                        ========================= */}

                        <tr>
                          {/* PEDIDO */}

                          <td>
                            <div className="pedidos-alterados-pedido-identificacao">
                              <strong className="pedidos-alterados-numero">
                                {pedido.numero_pedido || codigo}
                              </strong>

                              {pedido.pedido_desdobrado && (
                                <span
                                  className={`pedidos-alterados-desdobramento-badge ${
                                    pedido.pedido_desdobramento_original
                                      ? "original"
                                      : "derivado"
                                  }`}
                                  title={
                                    pedido.pedido_desdobramento_original
                                      ? "Pedido original que possui desdobramento"
                                      : `Pedido gerado pelo desdobramento do pedido ${
                                          pedido.numero_pedido_original || ""
                                        }`
                                  }
                                >
                                  <FiGitBranch />

                                  {pedido.pedido_desdobramento_original
                                    ? "Desdobrado"
                                    : "Parte desdobrada"}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* CLIENTE */}

                          <td>{pedido.cliente || "-"}</td>

                          {/* VENDEDOR */}

                          <td>{pedido.vendedor || "-"}</td>

                          {/* ÚLTIMA ALTERAÇÃO */}

                          <td>{formatarDataHora(pedido.ultima_alteracao)}</td>

                          {/* QUANTIDADE DE ALTERAÇÕES */}

                          <td>
                            <span className="pedidos-alterados-contador">
                              {pedido.quantidade_alteracoes}
                            </span>
                          </td>

                          {/* CAMPOS ALTERADOS */}

                          <td>
                            <div className="pedidos-alterados-campos">
                              {campos.map((campo) => (
                                <span key={campo}>{campo}</span>
                              ))}
                            </div>
                          </td>

                          {/* BOTÃO HISTÓRICO */}

                          <td>
                            <button
                              type="button"
                              className="pedidos-alterados-ver"
                              onClick={() => alternarPedido(codigo)}
                              aria-expanded={expandido}
                            >
                              {expandido ? <FiChevronUp /> : <FiChevronDown />}

                              {expandido ? "Fechar" : "Ver"}
                            </button>
                          </td>
                        </tr>

                        {/* =========================
                            HISTÓRICO EXPANDIDO
                        ========================= */}

                        {expandido && (
                          <tr className="pedidos-alterados-historico-linha">
                            <td colSpan={7}>
                              <div className="pedidos-alterados-historico">
                                {/* TÍTULO */}

                                <div className="pedidos-alterados-historico-titulo">
                                  <FiEdit3 />

                                  <div>
                                    <strong>
                                      Histórico do pedido {pedido.numero_pedido || codigo}
                                    </strong>

                                    <span>
                                      {ocorrencias.length} ocorrência
                                      {ocorrencias.length !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                </div>

                                {pedido.pedido_desdobrado && (
                                  <div className="pedidos-alterados-desdobramento-aviso">
                                    <FiGitBranch />

                                    <div>
                                      <strong>
                                        {pedido.pedido_desdobramento_original
                                          ? `Pedido ${
                                              pedido.numero_pedido_original ||
                                              pedido.numero_pedido ||
                                              codigo
                                            } desdobrado`
                                          : `Pedido gerado por desdobramento de ${
                                              pedido.numero_pedido_original || "pedido original"
                                            }`}
                                      </strong>

                                      <span>
                                        {pedido.pedido_desdobramento_original
                                          ? `Este é o pedido original. O sistema identificou ${
                                              pedido.pedido_desdobramento_quantidade_derivados
                                            } ${
                                              pedido.pedido_desdobramento_quantidade_derivados === 1
                                                ? "pedido derivado"
                                                : "pedidos derivados"
                                            } vinculado${
                                              pedido.pedido_desdobramento_quantidade_derivados === 1
                                                ? ""
                                                : "s"
                                            } a ele.`
                                          : `Esta é a parte ${
                                              pedido.pedido_desdobramento_indice
                                            } do desdobramento. O sufixo /${
                                              pedido.pedido_desdobramento_indice
                                            } é apenas visual para diferenciar os pedidos; no Omie e no Supabase o número-base permanece ${
                                              pedido.numero_pedido_original || "o mesmo"
                                            }.`}
                                      </span>

                                      {pedido.pedido_desdobramento_partes?.length > 1 && (
                                        <div className="pedidos-alterados-desdobramento-partes">
                                          <small>Pedidos relacionados:</small>

                                          <div>
                                            {pedido.pedido_desdobramento_partes.map((parte) => (
                                              <span
                                                key={`${codigo}-desdobramento-${parte.codigo_pedido_omie}`}
                                                className={
                                                  Number(parte.codigo_pedido_omie) === Number(codigo)
                                                    ? "atual"
                                                    : ""
                                                }
                                              >
                                                {parte.numero_exibicao}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* OCORRÊNCIAS */}

                                <div className="pedidos-alterados-ocorrencias">
                                  {ocorrencias.map((ocorrencia, indice) => {
                                    const mudancas = extrairMudancas(ocorrencia);

                                    return (
                                      <article
                                        key={ocorrencia.id || `${codigo}-${indice}`}
                                        className="pedidos-alterados-ocorrencia"
                                      >
                                        {/* TOPO */}

                                        <div className="pedidos-alterados-ocorrencia-topo">
                                          <strong>Alteração #{ocorrencias.length - indice}</strong>

                                          <span>{formatarDataHora(ocorrencia.alterado_em)}</span>
                                        </div>

                                        {/* MUDANÇAS */}

                                        {mudancas.length > 0 ? (
                                          <div className="pedidos-alterados-mudancas">
                                            {mudancas.map((mudanca) => (
                                              <div
                                                key={`${ocorrencia.id}-${mudanca.chave}`}
                                                className="pedidos-alterados-mudanca"
                                              >
                                                <strong>{mudanca.campo}</strong>

                                                <div className="pedidos-alterados-antes-depois">
                                                  {/* ANTES */}

                                                  <span>
                                                    <small>Antes</small>

                                                    <b>{mudanca.anterior}</b>
                                                  </span>

                                                  {/* SETA */}

                                                  <span className="pedidos-alterados-seta">→</span>

                                                  {/* DEPOIS */}

                                                  <span>
                                                    <small>Depois</small>

                                                    <b>{mudanca.novo}</b>
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="pedidos-alterados-sem-detalhe">
                                            {ocorrencia.resumo ||
                                              "Alteração registrada sem detalhamento disponível."}
                                          </p>
                                        )}
                                      </article>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* =====================================
                RODAPÉ

                Mantém totais gerais, mas exibe
                o intervalo da página.
            ===================================== */}

            <div className="relatorio-visualizacao-footer">
              <span>
                Exibindo {inicioExibicao} a {fimExibicao} de {totalItens} pedido(s)
              </span>

              <span>{totalAlteracoes} alteração(ões) no período</span>
            </div>
          </section>

          {/* =====================================
              PAGINAÇÃO PADRÃO DO SISTEMA

              Substitui os botões antigos.
          ===================================== */}

          {totalPaginas > 1 && (
            <Paginacao
              paginaAtual={paginaValida}
              totalItens={totalItens}
              itensPorPagina={ITENS_POR_PAGINA}
              onChangePagina={setPaginaAtual}
            />
          )}
        </>
      )}

      {/* ===============================================
          NENHUMA ALTERAÇÃO
      =============================================== */}

      {!error && !isLoading && totalItens === 0 && (
        <div className="relatorio-visualizacao-vazia pedidos-alterados-vazio">
          <FiEdit3 />

          <strong>Nenhuma alteração encontrada</strong>

          <span>Não existem pedidos com alterações reais no período selecionado.</span>
        </div>
      )}
    </>
  );
}
