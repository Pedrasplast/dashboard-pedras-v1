import { useEffect, useMemo, useState } from "react";

/*
 * ATENÇÃO À ORDEM DOS IMPORTS: ela define a ordem do CSS na página.
 * useCatalogoRelatorios traz o Relatorio.config (e com ele o LayoutRelatorio.css)
 * e precisa vir ANTES de FiltrosPedidosRelatorio: as regras de mesma
 * especificidade do .css dos filtros têm de ficar por último.
 */
import { useDadosRelatorio } from "./hooks/useDadosRelatorio";
import FiltrosDashboard from "@/features/dashboard/FiltrosDashboard";
import PreVisualizacaoRelatorio from "./components/PreVisualizacaoRelatorio";
import { useCatalogoRelatorios } from "./hooks/useCatalogoRelatorios";

import { criarFiltrosIniciais, montarTextoFiltrosRelatorio } from "./utils/filtrosRelatorio";

import FiltrosPedidosRelatorio from "./pedidos/FiltrosPedidosRelatorio";
import LayoutRelatorio from "./components/LayoutRelatorio";
import NavegacaoRelatorio, { CarregandoRelatorios } from "./components/NavegacaoRelatorio";
import PainelRelatorios from "./components/PainelRelatorios";

import "./TelaRelatorios.css";

/* =====================================================
   CONFIGURAÇÃO DA PAGINAÇÃO
===================================================== */

const LINHAS_POR_PAGINA = 8;

/* =====================================================
   COMPONENTE PRINCIPAL
===================================================== */

function TelaRelatorios({ dadosBrutos: dadosExternos }) {
  const [relatorioSelecionadoId, setRelatorioSelecionadoId] = useState(null);

  const [filtros, setFiltros] = useState(() => criarFiltrosIniciais());

  const [visualizacaoAberta, setVisualizacaoAberta] = useState(false);

  const [paginaAtual, setPaginaAtual] = useState(1);

  const catalogo = useCatalogoRelatorios();

  const { permissoesCarregadas, relatoriosPermitidosIds, relatoriosDisponiveis } = catalogo;

  /* =====================================================
     RELATÓRIO SELECIONADO
  ===================================================== */

  const relatorioSelecionado = useMemo(
    () =>
      relatoriosDisponiveis.find((relatorio) => relatorio.id === relatorioSelecionadoId) || null,
    [relatorioSelecionadoId, relatoriosDisponiveis],
  );

  // Neste relatório o total aparece exclusivamente no PDF.
  const relatorioProdutosPorData = relatorioSelecionado?.id === "pedidos-produto-data";

  const {
    fonteEhPedidos,
    relatorioEhCustom,
    dadosBrutos,
    pedidosBrutos,
    erroPedidos,
    erroDescricoes,
    carregandoRelatorio,
    colunasVisualizacao,
    produtosDisponiveis,
    mpsDisponiveis,
    tiposDisponiveis,
    dadosRelatorioFinal,
    totalRegistrosRelatorio,
  } = useDadosRelatorio({ relatorioSelecionado, relatorioSelecionadoId, dadosExternos, filtros });

  const ComponenteCustomizado = relatorioEhCustom
    ? relatorioSelecionado?.componenteCustomizado
    : null;

  const textoFiltros = useMemo(
    () =>
      montarTextoFiltrosRelatorio({
        relatorio: relatorioSelecionado,
        filtros,
        fonteEhPedidos,
        relatorioEhCustom,
      }),
    [relatorioSelecionado, filtros, fonteEhPedidos, relatorioEhCustom],
  );

  /* =====================================================
     ABRIR, VOLTAR E PROTEÇÃO CONTRA REMOÇÃO DE PERMISSÃO
  ===================================================== */

  function abrirRelatorio(id, fonteDados) {
    setRelatorioSelecionadoId(id);

    setFiltros(criarFiltrosIniciais(fonteDados));

    setVisualizacaoAberta(false);

    setPaginaAtual(1);
  }

  const selecionarRelatorio = (id) => {
    const relatorio = relatoriosDisponiveis.find((item) => item.id === id);

    if (!relatorio) {
      return;
    }

    abrirRelatorio(id, relatorio?.fonteDados || "producao");

    // Abre sempre do topo (não fica por baixo da navbar).
    window.scrollTo({ top: 0 });
  };

  const voltarListaRelatorios = () => abrirRelatorio(null);

  useEffect(() => {
    if (!permissoesCarregadas || !relatorioSelecionadoId) {
      return;
    }

    if (!relatoriosPermitidosIds.has(relatorioSelecionadoId)) {
      setRelatorioSelecionadoId(null);
      setFiltros(criarFiltrosIniciais());
      setVisualizacaoAberta(false);
      setPaginaAtual(1);
    }
  }, [permissoesCarregadas, relatorioSelecionadoId, relatoriosPermitidosIds]);

  /* =====================================================
     PAGINAÇÃO DA PRÉ-VISUALIZAÇÃO
  ===================================================== */

  const totalPaginasVisualizacao = Math.max(
    1,
    Math.ceil(dadosRelatorioFinal.length / LINHAS_POR_PAGINA),
  );

  /* Página válida mesmo se a quantidade de dados diminuir. */
  const paginaVisualizacao = Math.min(paginaAtual, totalPaginasVisualizacao);

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtros, relatorioSelecionadoId]);

  useEffect(() => {
    if (paginaAtual > totalPaginasVisualizacao) {
      setPaginaAtual(totalPaginasVisualizacao);
    }
  }, [paginaAtual, totalPaginasVisualizacao]);

  /* =====================================================
     EXPORTAÇÃO (todos os registros filtrados, sem paginação)
  ===================================================== */

  const handleGerarPDF = async () => {
    if (relatorioEhCustom) {
      return;
    }

    const { gerarPdfRelatorio } = await import("./exportacao/GerarPDF");

    gerarPdfRelatorio({
      relatorio: relatorioSelecionado,
      dados: dadosRelatorioFinal,
      textoFiltros,
    });
  };

  const handleGerarExcel = async () => {
    if (relatorioEhCustom) {
      return;
    }

    const { gerarExcelRelatorio } = await import("./exportacao/GerarExcel");

    await gerarExcelRelatorio({
      relatorio: relatorioSelecionado,
      dados: dadosRelatorioFinal,
      textoFiltros,
    });
  };

  /* =====================================================
     CARREGANDO
  ===================================================== */

  if (!permissoesCarregadas) {
    return <CarregandoRelatorios mensagem="Verificando permissões dos relatórios..." />;
  }

  if (carregandoRelatorio && relatorioSelecionado) {
    return <CarregandoRelatorios mensagem="Carregando dados do relatório..." />;
  }

  /* =====================================================
     RENDERIZAÇÃO
  ===================================================== */

  return (
    <div
      className={`relatorios-container ${
        relatorioSelecionado ? "relatorios-container--aberto" : ""
      }`}
    >
      {relatorioSelecionado && (
        <NavegacaoRelatorio relatorio={relatorioSelecionado} onVoltar={voltarListaRelatorios} />
      )}

      {!relatorioSelecionado && catalogo.erroPermissoesRelatorios && (
        <div className="relatorios-erro">{catalogo.erroPermissoesRelatorios}</div>
      )}

      {!relatorioSelecionado &&
        !catalogo.erroPermissoesRelatorios &&
        relatoriosDisponiveis.length === 0 && (
          <div className="relatorios-erro">
            Você não possui relatórios liberados. Solicite a um administrador a permissão
            necessária.
          </div>
        )}

      {!relatorioSelecionado && relatoriosDisponiveis.length > 0 && (
        <PainelRelatorios
          relatoriosDisponiveis={relatoriosDisponiveis}
          relatoriosCatalogo={catalogo.relatoriosCatalogo}
          categoriasCatalogo={catalogo.categoriasCatalogo}
          categoriaSelecionada={catalogo.categoriaSelecionada}
          onCategoria={catalogo.setCategoriaSelecionada}
          busca={catalogo.buscaRelatorios}
          onBusca={catalogo.setBuscaRelatorios}
          onAbrir={selecionarRelatorio}
        />
      )}

      {relatorioSelecionado && (
        <div className="relatorio-selecionado">
          {relatorioEhCustom && ComponenteCustomizado && (
            <ComponenteCustomizado relatorio={relatorioSelecionado} />
          )}

          {fonteEhPedidos && erroPedidos && (
            <div className="relatorios-erro">
              {erroPedidos.message || "Não foi possível carregar os pedidos."}
            </div>
          )}

          {relatorioSelecionadoId === "producao-produto" && erroDescricoes && (
            <div className="relatorios-erro">
              {erroDescricoes} A produção permanece disponível, mas algumas descrições podem
              aparecer como "-".
            </div>
          )}

          {!relatorioEhCustom && (
            <>
              <LayoutRelatorio
                relatorio={relatorioSelecionado}
                fixo
                filtros={
                  <>
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
                  </>
                }
                acoes={{
                  onVisualizar: () => {
                    setPaginaAtual(1);
                    setVisualizacaoAberta(true);
                  },
                  onPdf: handleGerarPDF,
                  onExcel: handleGerarExcel,
                  desabilitado: dadosRelatorioFinal.length === 0,
                }}
                indicadores={[
                  /* Produtos por data não mostra contagem (mantido). */
                  !relatorioProdutosPorData && {
                    rotulo: "Registros no relatório",
                    valor: totalRegistrosRelatorio,
                    destaque: true,
                  },
                  {
                    rotulo: "Filtros aplicados",
                    valor: textoFiltros,
                    texto: true,
                  },
                ]}
              >
                {visualizacaoAberta && (
                  <PreVisualizacaoRelatorio
                    relatorio={relatorioSelecionado}
                    textoFiltros={textoFiltros}
                    mostrarTotal={!relatorioProdutosPorData}
                    totalRegistros={totalRegistrosRelatorio}
                    colunas={colunasVisualizacao}
                    dados={dadosRelatorioFinal}
                    pagina={paginaVisualizacao}
                    linhasPorPagina={LINHAS_POR_PAGINA}
                    onMudarPagina={setPaginaAtual}
                    onFechar={() => setVisualizacaoAberta(false)}
                  />
                )}

                {!visualizacaoAberta && (
                  <div className="rl-vazio">
                    <strong>
                      {dadosRelatorioFinal.length > 0
                        ? "Clique em Visualizar para conferir os dados"
                        : "Nenhum registro com os filtros atuais"}
                    </strong>
                    <span>
                      {dadosRelatorioFinal.length > 0
                        ? "Ou baixe direto em PDF ou Excel."
                        : "Ajuste os filtros para ver os dados."}
                    </span>
                  </div>
                )}
              </LayoutRelatorio>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TelaRelatorios;
