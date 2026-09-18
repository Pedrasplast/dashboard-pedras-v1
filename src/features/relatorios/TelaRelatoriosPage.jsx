import React, { useEffect, useMemo, useState } from "react";

import { FiDownload, FiEye, FiFileText } from "react-icons/fi";

import FiltrosDashboard from "@/features/dashboard/FiltrosDashboard";

import PageHeader from "@/components/layout/PageHeader";

import FiltrosPedidosRelatorio from "./pedidos/FiltrosPedidosRelatorio";

import CatalogoRelatorios from "./components/CatalogoRelatorios";

import PreVisualizacaoRelatorio from "./components/PreVisualizacaoRelatorio";

import NavegacaoRelatorios from "./components/NavegacaoRelatorios";

import { usePermissoesRelatorios } from "./hooks/usePermissoesRelatorios";

import { useDadosRelatorio } from "./hooks/useDadosRelatorio";

import { criarFiltrosIniciais } from "./utils/FiltrarDadosRelatorio";

import {
  contarRegistrosRelatorio,
  deveMostrarContagem,
  montarTextoFiltros,
} from "./utils/ResumoRelatorio";

import "./TelaRelatorios.css";

function TelaRelatorios({ dadosBrutos: dadosExternos }) {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [relatorioSelecionadoId, setRelatorioSelecionadoId] = useState(null);

  const [filtros, setFiltros] = useState(() => criarFiltrosIniciais());

  const [visualizacaoAberta, setVisualizacaoAberta] = useState(false);

  const [exportando, setExportando] = useState("");

  const [erroExportacao, setErroExportacao] = useState("");

  /* =====================================================
     PERMISSÕES
  ===================================================== */

  const {
    carregadas: permissoesRelatoriosCarregadas,
    idsPermitidos: relatoriosPermitidosIds,
    erro: erroPermissoesRelatorios,
    relatoriosDisponiveis,
  } = usePermissoesRelatorios();

  /* =====================================================
     RELATÓRIO SELECIONADO
  ===================================================== */

  const relatorioSelecionado = useMemo(
    () => relatoriosDisponiveis.find((item) => item.id === relatorioSelecionadoId) || null,

    [relatorioSelecionadoId, relatoriosDisponiveis],
  );

  /* =====================================================
     DADOS DO RELATÓRIO
  ===================================================== */

  const {
    fonteEhPedidos,
    relatorioEhCustom,
    ComponenteCustomizado,
    dadosBrutos,
    pedidosBrutos,
    erroPedidos,
    erroDescricoes,
    produtosDisponiveis,
    mpsDisponiveis,
    tiposDisponiveis,
    dadosRelatorioFinal,
    carregandoRelatorio,
  } = useDadosRelatorio({
    relatorio: relatorioSelecionado,
    filtros,
    dadosExternos,
  });

  /* =====================================================
     VERIFICAÇÃO DE PERMISSÕES

     Se a permissão do relatório for removida,
     a seleção atual também é removida.
  ===================================================== */

  useEffect(() => {
    if (
      permissoesRelatoriosCarregadas &&
      relatorioSelecionadoId &&
      !relatoriosPermitidosIds.has(relatorioSelecionadoId)
    ) {
      setRelatorioSelecionadoId(null);

      setFiltros(criarFiltrosIniciais());

      setVisualizacaoAberta(false);

      setErroExportacao("");
    }
  }, [permissoesRelatoriosCarregadas, relatorioSelecionadoId, relatoriosPermitidosIds]);

  /* =====================================================
     INFORMAÇÕES DO RESUMO
  ===================================================== */

  const textoFiltros = montarTextoFiltros(relatorioSelecionado, filtros);

  const mostrarContagem = deveMostrarContagem(relatorioSelecionado);

  const totalRegistrosRelatorio = useMemo(
    () => contarRegistrosRelatorio(relatorioSelecionado, dadosRelatorioFinal),

    [relatorioSelecionado, dadosRelatorioFinal],
  );

  /* =====================================================
     SELECIONAR RELATÓRIO

     Abre o relatório escolhido no catálogo
     e posiciona a página no início.
  ===================================================== */

  function selecionarRelatorio(id) {
    const relatorio = relatoriosDisponiveis.find((item) => item.id === id);

    if (!relatorio) {
      return;
    }

    setRelatorioSelecionadoId(id);

    setFiltros(criarFiltrosIniciais(relatorio.fonteDados || "producao"));

    setVisualizacaoAberta(false);

    setErroExportacao("");

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }

  /* =====================================================
     VOLTAR AO CATÁLOGO

     Esta função continua na página principal
     porque ela controla os estados do relatório.

     O componente NavegacaoRelatorios recebe
     esta função através da propriedade onVoltar.
  ===================================================== */

  function voltarListaRelatorios() {
    setRelatorioSelecionadoId(null);

    setFiltros(criarFiltrosIniciais());

    setVisualizacaoAberta(false);

    setErroExportacao("");

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }

  /* =====================================================
     EXPORTAÇÃO

     Os arquivos recebem TODOS os dados filtrados,
     e não apenas a página da pré-visualização.
  ===================================================== */

  async function exportar(formato) {
    if (!relatorioSelecionado || relatorioEhCustom || exportando || !dadosRelatorioFinal.length) {
      return;
    }

    setExportando(formato);

    setErroExportacao("");

    try {
      const parametros = {
        relatorio: relatorioSelecionado,

        dados: dadosRelatorioFinal,

        textoFiltros,
      };

      if (formato === "pdf") {
        const { gerarPdfRelatorio } = await import("./exportacao/GerarPDF");

        await gerarPdfRelatorio(parametros);
      } else {
        const { gerarExcelRelatorio } = await import("./exportacao/GerarExcel");

        await gerarExcelRelatorio(parametros);
      }
    } catch (error) {
      console.error(`Erro ao gerar ${formato.toUpperCase()}:`, error);

      setErroExportacao(`Não foi possível gerar o ${formato.toUpperCase()}. Tente novamente.`);
    } finally {
      setExportando("");
    }
  }

  /* =====================================================
     CARREGAMENTO
  ===================================================== */

  if (!permissoesRelatoriosCarregadas || (carregandoRelatorio && relatorioSelecionado)) {
    return (
      <div className="relatorios-loading">
        <div className="relatorios-loading-card">
          <div className="relatorios-spinner" />

          <p>
            {!permissoesRelatoriosCarregadas
              ? "Verificando permissões dos relatórios..."
              : "Carregando dados do relatório..."}
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     TELA PRINCIPAL
  ===================================================== */

  return (
    <div className="relatorios-container">
      {/* =================================================
          COMPONENTE INDEPENDENTE DE NAVEGAÇÃO

          A página informa:
          - O título do relatório.
          - A função para voltar ao catálogo.

          Toda a estrutura visual do botão fica
          dentro de NavegacaoRelatorios.jsx.
      ================================================= */}

      {relatorioSelecionado && (
        <NavegacaoRelatorios
          titulo={relatorioSelecionado.titulo}
          onVoltar={voltarListaRelatorios}
        />
      )}

      {/* =================================================
          CABEÇALHO DO CATÁLOGO
      ================================================= */}

      {!relatorioSelecionado && (
        <PageHeader
          eyebrow="Central de Relatórios"
          title="Relatórios"
          description="Consulte produção, paradas, pedidos e financeiro utilizando dados já sincronizados no sistema."
          icon={FiFileText}
          className="relatorios-header"
        />
      )}

      {/* =================================================
          ERRO DE PERMISSÕES
      ================================================= */}

      {!relatorioSelecionado && erroPermissoesRelatorios && (
        <div className="relatorios-erro">{erroPermissoesRelatorios}</div>
      )}

      {/* =================================================
          NENHUM RELATÓRIO LIBERADO
      ================================================= */}

      {!relatorioSelecionado && !erroPermissoesRelatorios && !relatoriosDisponiveis.length && (
        <div className="relatorios-erro">
          Você não possui relatórios liberados. Solicite a um administrador a permissão necessária.
        </div>
      )}

      {/* =================================================
          CATÁLOGO

          Mantém o seletor de categorias da
          primeira versão.
      ================================================= */}

      {!relatorioSelecionado && relatoriosDisponiveis.length > 0 && (
        <CatalogoRelatorios relatorios={relatoriosDisponiveis} onSelecionar={selecionarRelatorio} />
      )}

      {/* =================================================
          RELATÓRIO SELECIONADO
      ================================================= */}

      {relatorioSelecionado && (
        <div className="relatorio-selecionado">
          {/* =========================================
              CABEÇALHO DOS RELATÓRIOS PADRÃO
          ========================================= */}

          {!relatorioEhCustom && (
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
          )}

          {/* =========================================
              RELATÓRIOS CUSTOMIZADOS

              Inclui Pedidos de Compra Alterados.
          ========================================= */}

          {relatorioEhCustom && ComponenteCustomizado && (
            <ComponenteCustomizado relatorio={relatorioSelecionado} />
          )}

          {/* =========================================
              ERROS DOS PEDIDOS
          ========================================= */}

          {fonteEhPedidos && erroPedidos && (
            <div className="relatorios-erro">
              {erroPedidos.message || "Não foi possível carregar os pedidos."}
            </div>
          )}

          {/* =========================================
              ERROS NAS DESCRIÇÕES
          ========================================= */}

          {relatorioSelecionado.id === "producao-produto" && erroDescricoes && (
            <div className="relatorios-erro">
              {erroDescricoes} A produção permanece disponível, mas algumas descrições podem
              aparecer como "-".
            </div>
          )}

          {/* =========================================
              ERRO DE EXPORTAÇÃO
          ========================================= */}

          {erroExportacao && (
            <div className="relatorios-erro" role="alert">
              {erroExportacao}
            </div>
          )}

          {/* =========================================
              RELATÓRIOS PADRÃO
          ========================================= */}

          {!relatorioEhCustom && (
            <>
              {/* =====================================
                  BOTÕES DE AÇÃO
              ===================================== */}

              <div className="relatorio-acoes">
                {/* VISUALIZAR */}

                <button
                  type="button"
                  className="btn-relatorio"
                  onClick={() => setVisualizacaoAberta(true)}
                  disabled={!dadosRelatorioFinal.length}
                >
                  <FiEye />

                  <div>
                    <strong>Visualizar</strong>

                    <span>Conferir antes de exportar</span>
                  </div>
                </button>

                {/* PDF */}

                <button
                  type="button"
                  className="btn-relatorio btn-relatorio-pdf"
                  onClick={() => exportar("pdf")}
                  disabled={!dadosRelatorioFinal.length || Boolean(exportando)}
                >
                  <FiFileText />

                  <div>
                    <strong>{exportando === "pdf" ? "Gerando PDF..." : "Baixar PDF"}</strong>

                    <span>Relatório formatado</span>
                  </div>
                </button>

                {/* EXCEL */}

                <button
                  type="button"
                  className="btn-relatorio btn-relatorio-csv"
                  onClick={() => exportar("excel")}
                  disabled={!dadosRelatorioFinal.length || Boolean(exportando)}
                >
                  <FiDownload />

                  <div>
                    <strong>
                      {exportando === "excel" ? "Gerando Excel..." : "Exportar Excel"}
                    </strong>

                    <span>Tabela XLSX</span>
                  </div>
                </button>
              </div>

              {/* =====================================
                  FILTROS DO RELATÓRIO
              ===================================== */}

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

              {/* =====================================
                  RESUMO DO RELATÓRIO
              ===================================== */}

              <div
                className={`relatorio-resumo-grid${
                  !mostrarContagem ? " relatorio-resumo-grid--sem-contagem" : ""
                }`}
              >
                {/* REGISTROS */}

                {mostrarContagem && (
                  <div className="relatorio-resumo-card">
                    <span>Registros no relatório</span>

                    <strong>{totalRegistrosRelatorio}</strong>
                  </div>
                )}

                {/* RELATÓRIO SELECIONADO */}

                <div className="relatorio-resumo-card">
                  <span>Relatório selecionado</span>

                  <strong className="relatorio-resumo-texto">{relatorioSelecionado.titulo}</strong>
                </div>

                {/* FILTROS APLICADOS */}

                <div className="relatorio-resumo-card">
                  <span>Filtros aplicados</span>

                  <strong className="relatorio-resumo-texto">{textoFiltros}</strong>
                </div>
              </div>

              {/* =====================================
                  PRÉ-VISUALIZAÇÃO
              ===================================== */}

              {visualizacaoAberta && (
                <PreVisualizacaoRelatorio
                  key={relatorioSelecionado.id}
                  relatorio={relatorioSelecionado}
                  dados={dadosRelatorioFinal}
                  filtros={filtros}
                  textoFiltros={textoFiltros}
                  onFechar={() => setVisualizacaoAberta(false)}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TelaRelatorios;
