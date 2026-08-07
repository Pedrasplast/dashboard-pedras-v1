import React, { useMemo, useState } from "react";

import { useNavigate } from "@/lib/navegacao";

import { FiArrowLeft, FiFileText, FiDownload, FiChevronRight } from "react-icons/fi";

import { useCargaMaquina } from "@/lib/cargaMaquina";

import FiltrosDashboard from "@/features/dashboard/FiltrosDashboard";

import { RELATORIOS } from "./config/Relatorio.config";

import { obterDataDoRegistro } from "./utils/Data";

import { gerarPdfRelatorio } from "./exportacao/GerarPDF";

import { gerarExcelRelatorio } from "./exportacao/GerarExcel";

import "./TelaRelatorios.css";

/* =====================================================
   ESTADO INICIAL DOS FILTROS
===================================================== */

const criarFiltrosIniciais = () => ({
  dataInicio: "",
  dataFim: "",
  injetora: "Todos",
  cod_prod: "Todos",
  mp: "Todos",
  tipo: [],
  status: "todos",
});

/* =====================================================
   COMPONENTE
===================================================== */

function TelaRelatorios({ dadosBrutos: dadosExternos }) {
  const navigate = useNavigate();

  /* =====================================================
     DADOS
  ===================================================== */

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

  const [filtros, setFiltros] = useState(criarFiltrosIniciais);

  /* =====================================================
     RELATÓRIO SELECIONADO
  ===================================================== */

  const relatorioSelecionado = useMemo(
    () => RELATORIOS.find((relatorio) => relatorio.id === relatorioSelecionadoId) || null,
    [relatorioSelecionadoId],
  );

  /* =====================================================
     CATEGORIAS
  ===================================================== */

  const categorias = useMemo(() => [...new Set(RELATORIOS.map((item) => item.categoria))], []);

  /* =====================================================
     PRODUTOS DISPONÍVEIS
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

  /* =====================================================
     MATÉRIAS-PRIMAS
  ===================================================== */

  const mpsDisponiveis = useMemo(() => {
    if (!Array.isArray(dadosBrutos)) {
      return [];
    }

    return [...new Set(dadosBrutos.map((item) => item.mp || item.materia_prima))].filter(Boolean);
  }, [dadosBrutos]);

  /* =====================================================
     TIPOS
  ===================================================== */

  const tiposDisponiveis = useMemo(() => {
    if (!Array.isArray(dadosBrutos)) {
      return [];
    }

    return [
      ...new Set(
        dadosBrutos
          .map((item) => String(item.tipo ?? "").trim())
          .filter((tipo) => ["1", "2", "3"].includes(tipo)),
      ),
    ].sort((a, b) => Number(a) - Number(b));
  }, [dadosBrutos]);

  /* =====================================================
     FILTRO DOS DADOS

     IMPORTANTE:

     FILTRA PRIMEIRO.
     AGRUPA DEPOIS.
  ===================================================== */

  const dadosFiltrados = useMemo(() => {
    if (!Array.isArray(dadosBrutos) || !relatorioSelecionado) {
      return [];
    }

    return dadosBrutos.filter((item) => {
      /* FILTRO FIXO */

      if (relatorioSelecionado.filtroFixo && !relatorioSelecionado.filtroFixo(item)) {
        return false;
      }

      /* STATUS */

      const statusItem = String(item.status || "")
        .trim()
        .toLowerCase();

      if (filtros.status && filtros.status !== "todos" && statusItem !== filtros.status) {
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

      /* MATÉRIA-PRIMA */

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
  }, [dadosBrutos, filtros, relatorioSelecionado]);

  /* =====================================================
     TRANSFORMAÇÃO / AGRUPAMENTO
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
     SELEÇÃO
  ===================================================== */

  const selecionarRelatorio = (id) => {
    setRelatorioSelecionadoId(id);

    setFiltros(criarFiltrosIniciais());
  };

  const voltarListaRelatorios = () => {
    setRelatorioSelecionadoId(null);

    setFiltros(criarFiltrosIniciais());
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
     EXPORTAÇÃO
  ===================================================== */

  const handleGerarPDF = () => {
    gerarPdfRelatorio({
      relatorio: relatorioSelecionado,

      dados: dadosRelatorio,

      textoFiltros: montarTextoFiltros(),
    });
  };

  const handleGerarExcel = async () => {
    await gerarExcelRelatorio({
      relatorio: relatorioSelecionado,

      dados: dadosRelatorio,
    });
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
