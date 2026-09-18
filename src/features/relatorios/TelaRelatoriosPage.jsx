import React, { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiDownload, FiEye, FiFileText } from "react-icons/fi";
import FiltrosDashboard from "@/features/dashboard/FiltrosDashboard";
import PageHeader from "@/components/layout/PageHeader";
import FiltrosPedidosRelatorio from "./pedidos/FiltrosPedidosRelatorio";
import CatalogoRelatorios from "./components/CatalogoRelatorios";
import PreVisualizacaoRelatorio from "./components/PreVisualizacaoRelatorio";
import { usePermissoesRelatorios } from "./hooks/usePermissoesRelatorios";
import { useDadosRelatorio } from "./hooks/useDadosRelatorio";
import { criarFiltrosIniciais } from "./utils/FiltrarDadosRelatorio";
import {
  contarRegistrosRelatorio,
  deveMostrarContagem,
  montarTextoFiltros,
} from "./utils/ResumoRelatorio";
import "./TelaRelatorios.css";

/** A tela coordena os módulos; cada relatório mantém seus filtros e cálculos. */
function TelaRelatorios({ dadosBrutos: dadosExternos }) {
  const [relatorioSelecionadoId, setRelatorioSelecionadoId] = useState(null);
  const [filtros, setFiltros] = useState(() => criarFiltrosIniciais());
  const [visualizacaoAberta, setVisualizacaoAberta] = useState(false);
  const [exportando, setExportando] = useState("");
  const [erroExportacao, setErroExportacao] = useState("");

  const {
    carregadas: permissoesRelatoriosCarregadas,
    idsPermitidos: relatoriosPermitidosIds,
    erro: erroPermissoesRelatorios,
    relatoriosDisponiveis,
  } = usePermissoesRelatorios();

  const relatorioSelecionado = useMemo(
    () => relatoriosDisponiveis.find((item) => item.id === relatorioSelecionadoId) || null,
    [relatorioSelecionadoId, relatoriosDisponiveis]
  );

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
  } = useDadosRelatorio({ relatorio: relatorioSelecionado, filtros, dadosExternos });

  useEffect(() => {
    if (permissoesRelatoriosCarregadas && relatorioSelecionadoId &&
      !relatoriosPermitidosIds.has(relatorioSelecionadoId)) {
      setRelatorioSelecionadoId(null);
      setFiltros(criarFiltrosIniciais());
      setVisualizacaoAberta(false);
      setErroExportacao("");
    }
  }, [permissoesRelatoriosCarregadas, relatorioSelecionadoId, relatoriosPermitidosIds]);

  const textoFiltros = montarTextoFiltros(relatorioSelecionado, filtros);
  const mostrarContagem = deveMostrarContagem(relatorioSelecionado);
  const totalRegistrosRelatorio = useMemo(
    () => contarRegistrosRelatorio(relatorioSelecionado, dadosRelatorioFinal),
    [relatorioSelecionado, dadosRelatorioFinal]
  );

  function selecionarRelatorio(id) {
    const relatorio = relatoriosDisponiveis.find((item) => item.id === id);
    if (!relatorio) return;
    setRelatorioSelecionadoId(id);
    setFiltros(criarFiltrosIniciais(relatorio.fonteDados || "producao"));
    setVisualizacaoAberta(false);
    setErroExportacao("");
  }

  function voltarListaRelatorios() {
    setRelatorioSelecionadoId(null);
    setFiltros(criarFiltrosIniciais());
    setVisualizacaoAberta(false);
    setErroExportacao("");
  }

  async function exportar(formato) {
    if (!relatorioSelecionado || relatorioEhCustom || exportando || !dadosRelatorioFinal.length) return;
    setExportando(formato);
    setErroExportacao("");
    try {
      const parametros = {
        relatorio: relatorioSelecionado,
        // PDF e Excel recebem TODOS os dados filtrados, nunca a página da visualização.
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

  if (!permissoesRelatoriosCarregadas || (carregandoRelatorio && relatorioSelecionado)) {
    return (
      <div className="relatorios-loading">
        <div className="relatorios-loading-card">
          <div className="relatorios-spinner" />
          <p>{!permissoesRelatoriosCarregadas
            ? "Verificando permissões dos relatórios..."
            : "Carregando dados do relatório..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relatorios-container">
      {relatorioSelecionado && (
        <div className="relatorios-navegacao-topo">
          <button type="button" className="btn-voltar-topo" onClick={voltarListaRelatorios}>
            <FiArrowLeft /><span>Painel de Relatórios</span>
          </button>
        </div>
      )}

      {!relatorioSelecionado && (
        <PageHeader
          eyebrow="Central de Relatórios"
          title="Relatórios"
          description="Consulte produção, paradas, pedidos e financeiro utilizando dados já sincronizados no sistema."
          icon={FiFileText}
          className="relatorios-header"
        />
      )}
      {!relatorioSelecionado && erroPermissoesRelatorios && (
        <div className="relatorios-erro">{erroPermissoesRelatorios}</div>
      )}
      {!relatorioSelecionado && !erroPermissoesRelatorios && !relatoriosDisponiveis.length && (
        <div className="relatorios-erro">
          Você não possui relatórios liberados. Solicite a um administrador a permissão necessária.
        </div>
      )}
      {!relatorioSelecionado && relatoriosDisponiveis.length > 0 && (
        <CatalogoRelatorios relatorios={relatoriosDisponiveis} onSelecionar={selecionarRelatorio} />
      )}

      {relatorioSelecionado && (
        <div className="relatorio-selecionado">
          {!relatorioEhCustom && (
            <div className="relatorio-selecionado-header">
              <div className="relatorio-selecionado-icone">
                {React.createElement(relatorioSelecionado.icone)}
              </div>
              <div>
                <span className="relatorio-selecionado-categoria">{relatorioSelecionado.categoria}</span>
                <h2>{relatorioSelecionado.titulo}</h2>
                <p>{relatorioSelecionado.descricao}</p>
              </div>
            </div>
          )}

          {relatorioEhCustom && ComponenteCustomizado && (
            <ComponenteCustomizado relatorio={relatorioSelecionado} />
          )}

          {fonteEhPedidos && erroPedidos && (
            <div className="relatorios-erro">
              {erroPedidos.message || "Não foi possível carregar os pedidos."}
            </div>
          )}
          {relatorioSelecionado.id === "producao-produto" && erroDescricoes && (
            <div className="relatorios-erro">
              {erroDescricoes} A produção permanece disponível, mas algumas descrições podem aparecer como "-".
            </div>
          )}
          {erroExportacao && <div className="relatorios-erro" role="alert">{erroExportacao}</div>}

          {!relatorioEhCustom && (
            <>
              <div className="relatorio-acoes">
                <button
                  type="button"
                  className="btn-relatorio"
                  onClick={() => setVisualizacaoAberta(true)}
                  disabled={!dadosRelatorioFinal.length}
                >
                  <FiEye />
                  <div><strong>Visualizar</strong><span>Conferir antes de exportar</span></div>
                </button>
                <button
                  type="button"
                  className="btn-relatorio btn-relatorio-pdf"
                  onClick={() => exportar("pdf")}
                  disabled={!dadosRelatorioFinal.length || Boolean(exportando)}
                >
                  <FiFileText />
                  <div><strong>{exportando === "pdf" ? "Gerando PDF..." : "Baixar PDF"}</strong><span>Relatório formatado</span></div>
                </button>
                <button
                  type="button"
                  className="btn-relatorio btn-relatorio-csv"
                  onClick={() => exportar("excel")}
                  disabled={!dadosRelatorioFinal.length || Boolean(exportando)}
                >
                  <FiDownload />
                  <div><strong>{exportando === "excel" ? "Gerando Excel..." : "Exportar Excel"}</strong><span>Tabela XLSX</span></div>
                </button>
              </div>

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

              <div className={`relatorio-resumo-grid${!mostrarContagem ? " relatorio-resumo-grid--sem-contagem" : ""}`}>
                {mostrarContagem && (
                  <div className="relatorio-resumo-card">
                    <span>Registros no relatório</span>
                    <strong>{totalRegistrosRelatorio}</strong>
                  </div>
                )}
                <div className="relatorio-resumo-card">
                  <span>Relatório selecionado</span>
                  <strong className="relatorio-resumo-texto">{relatorioSelecionado.titulo}</strong>
                </div>
                <div className="relatorio-resumo-card">
                  <span>Filtros aplicados</span>
                  <strong className="relatorio-resumo-texto">{textoFiltros}</strong>
                </div>
              </div>

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
