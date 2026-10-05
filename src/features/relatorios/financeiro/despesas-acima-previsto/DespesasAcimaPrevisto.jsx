import {
  useMemo,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiDownload,
  FiEye,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";

import Filtros
  from "@/components/filtros/Filtros";

import Paginacao
  from "@/components/paginacao/Paginacao";

import {
  obterColunasRelatorio,
} from "../../config/Colunas.config";

import {
  criarRelatorioFinanceiroExportacao,
  exportarFinanceiroExcel,
  exportarFinanceiroPDF,
} from "../export/financeiroPrevistoRealizadoExport";

import useFinanceiroPrevistoRealizado
  from "../hooks/useFinanceiroPrevistoRealizado";

import {
  filtrarCategoriasFinanceiras,
  filtrarDadosPorCategoria,
  MESES,
  obterAnoAtual,
  obterCategoriasFinanceiras,
  obterMesAtual,
  obterNomeCategoriaSelecionada,
  obterNomeMes,
} from "../utils/financeiroPrevistoRealizado.utils";

import DespesasAcimaPrevistoTabela
  from "./components/DespesasAcimaPrevistoTabela";

import {
  obterMaiorExcesso,
  prepararDespesasAcimaPrevisto,
} from "./utils/despesasAcimaPrevisto.utils";

import "./DespesasAcimaPrevisto.css";


const ITENS_POR_PAGINA = 10;


function criarFiltrosIniciais() {
  return {
    ano:
      obterAnoAtual(),

    mes:
      obterMesAtual(),

    categoria:
      "todas",

    buscaCategoria:
      "",
  };
}


function formatarMoeda(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "-";
  }

  return numero.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}


export default function DespesasAcimaPrevisto({
  relatorio,
}) {
  const filtrosPadrao = useMemo(
    () => criarFiltrosIniciais(),
    [],
  );

  const [filtros, setFiltros] = useState(
    () => criarFiltrosIniciais(),
  );

  const {
    ano,
    mes,
    categoria,
    buscaCategoria,
  } = filtros;

  const [visualizacaoAberta, setVisualizacaoAberta] =
    useState(false);

  const [paginaAtual, setPaginaAtual] =
    useState(1);

  const [exportando, setExportando] =
    useState(null);


  const {
    anosDisponiveis,
    dados,
    carregando,
    atualizando,
    erro,
  } = useFinanceiroPrevistoRealizado({
    ano,
    mes,
    tipo: "Despesa",
    habilitado: Boolean(relatorio),
  });


  const despesasAcimaPrevisto = useMemo(
    () =>
      prepararDespesasAcimaPrevisto(
        dados,
      ),
    [dados],
  );


  const categoriasDisponiveis = useMemo(
    () =>
      obterCategoriasFinanceiras(
        despesasAcimaPrevisto,
      ),
    [despesasAcimaPrevisto],
  );


  const categoriasEncontradas = useMemo(
    () =>
      filtrarCategoriasFinanceiras(
        categoriasDisponiveis,
        buscaCategoria,
      ),
    [
      categoriasDisponiveis,
      buscaCategoria,
    ],
  );


  const categoriasExibidas = useMemo(() => {
    if (
      !categoria ||
      categoria === "todas" ||
      categoriasEncontradas.some(
        (item) =>
          item.codigo === categoria,
      )
    ) {
      return categoriasEncontradas;
    }

    const selecionada =
      categoriasDisponiveis.find(
        (item) =>
          item.codigo === categoria,
      );

    if (!selecionada) {
      return categoriasEncontradas;
    }

    return [
      selecionada,
      ...categoriasEncontradas,
    ];
  }, [
    categoria,
    categoriasDisponiveis,
    categoriasEncontradas,
  ]);


  const dadosFiltrados = useMemo(
    () =>
      filtrarDadosPorCategoria(
        despesasAcimaPrevisto,
        categoria,
        buscaCategoria,
      ),
    [
      despesasAcimaPrevisto,
      categoria,
      buscaCategoria,
    ],
  );


  const relatorioExportacao = useMemo(
    () =>
      criarRelatorioFinanceiroExportacao(
        relatorio,
      ),
    [relatorio],
  );


  const colunasExibicao = useMemo(
    () =>
      obterColunasRelatorio(
        relatorioExportacao,
      ),
    [relatorioExportacao],
  );


  const maiorExcesso = useMemo(
    () =>
      obterMaiorExcesso(
        dadosFiltrados,
      ),
    [dadosFiltrados],
  );


  const totalItens =
    dadosFiltrados.length;

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      totalItens /
      ITENS_POR_PAGINA,
    ),
  );

  const paginaValida = Math.max(
    1,
    Math.min(
      paginaAtual,
      totalPaginas,
    ),
  );

  const inicioPagina =
    (paginaValida - 1) *
    ITENS_POR_PAGINA;

  const fimPagina =
    inicioPagina +
    ITENS_POR_PAGINA;

  const dadosPagina =
    dadosFiltrados.slice(
      inicioPagina,
      fimPagina,
    );

  const inicioExibicao =
    totalItens > 0
      ? inicioPagina + 1
      : 0;

  const fimExibicao = Math.min(
    fimPagina,
    totalItens,
  );


  const textoFiltros = useMemo(() => {
    const categoriaTexto =
      categoria !== "todas"
        ? obterNomeCategoriaSelecionada(
            categoriasDisponiveis,
            categoria,
          )
        : buscaCategoria.trim()
          ? `Busca: ${buscaCategoria.trim()}`
          : "Todas as categorias";

    return (
      `Ano: ${ano} | ` +
      `Mês: ${obterNomeMes(mes)} | ` +
      `Categoria: ${categoriaTexto} | ` +
      "Condição: Realizado > Previsto"
    );
  }, [
    ano,
    mes,
    categoria,
    buscaCategoria,
    categoriasDisponiveis,
  ]);


  async function handleGerarPDF() {
    if (
      dadosFiltrados.length === 0 ||
      exportando
    ) {
      return;
    }

    try {
      setExportando("pdf");

      await exportarFinanceiroPDF({
        relatorio:
          relatorioExportacao,

        dados:
          dadosFiltrados,

        textoFiltros,
      });
    } catch (errorExportacao) {
      console.error(
        "Erro ao gerar PDF de despesas acima do previsto:",
        errorExportacao,
      );

      window.alert(
        "Não foi possível gerar o PDF.",
      );
    } finally {
      setExportando(null);
    }
  }


  async function handleGerarExcel() {
    if (
      dadosFiltrados.length === 0 ||
      exportando
    ) {
      return;
    }

    try {
      setExportando("excel");

      await exportarFinanceiroExcel({
        relatorio:
          relatorioExportacao,

        dados:
          dadosFiltrados,

        textoFiltros,
      });
    } catch (errorExportacao) {
      console.error(
        "Erro ao gerar Excel de despesas acima do previsto:",
        errorExportacao,
      );

      window.alert(
        "Não foi possível gerar o Excel.",
      );
    } finally {
      setExportando(null);
    }
  }


  return (
    <>
      <div className="relatorio-selecionado-header">
        <div className="relatorio-selecionado-icone despesas-acima-previsto-icone">
          <FiAlertTriangle />
        </div>

        <div>
          <span className="relatorio-selecionado-categoria">
            Financeiro
          </span>

          <h2>
            {relatorio?.titulo ||
              "Despesas Acima do Previsto"}
          </h2>

          <p>
            {relatorio?.descricao ||
              "Lista as categorias de despesa em que o valor realizado ultrapassou o valor previsto."}
          </p>
        </div>
      </div>


      <div className="relatorio-acoes">
        <button
          type="button"
          className="btn-relatorio"
          onClick={() => {
            setPaginaAtual(1);
            setVisualizacaoAberta(true);
          }}
          disabled={
            dadosFiltrados.length === 0
          }
        >
          <FiEye />

          <div>
            <strong>
              Visualizar
            </strong>

            <span>
              Conferir antes de exportar
            </span>
          </div>
        </button>


        <button
          type="button"
          className="btn-relatorio btn-relatorio-pdf"
          onClick={handleGerarPDF}
          disabled={
            dadosFiltrados.length === 0 ||
            Boolean(exportando)
          }
        >
          {exportando === "pdf" ? (
            <FiRefreshCw className="despesas-acima-previsto-girando" />
          ) : (
            <FiFileText />
          )}

          <div>
            <strong>
              Baixar PDF
            </strong>

            <span>
              Relatório formatado
            </span>
          </div>
        </button>


        <button
          type="button"
          className="btn-relatorio btn-relatorio-csv"
          onClick={handleGerarExcel}
          disabled={
            dadosFiltrados.length === 0 ||
            Boolean(exportando)
          }
        >
          {exportando === "excel" ? (
            <FiRefreshCw className="despesas-acima-previsto-girando" />
          ) : (
            <FiDownload />
          )}

          <div>
            <strong>
              Exportar Excel
            </strong>

            <span>
              Tabela XLSX
            </span>
          </div>
        </button>
      </div>


      <div className="relatorio-filtros-card despesas-acima-previsto-filtros-card">
        <div className="relatorio-filtros-header despesas-acima-previsto-filtros-header">
          <div>
            <h3>
              Parâmetros do relatório
            </h3>
          </div>

          {atualizando && (
            <span className="despesas-acima-previsto-atualizando">
              <FiRefreshCw className="despesas-acima-previsto-girando" />

              Atualizando dados...
            </span>
          )}
        </div>


        <Filtros
          filtros={filtros}
          setFiltros={setFiltros}
          valoresPadrao={filtrosPadrao}
          className="despesas-acima-previsto-filtros-wrapper"
          mostrarBotaoLimpar={true}
          textoLimpar="Limpar filtros"
          iconeLimpar={<FiX />}
          onDepoisAlterar={() =>
            setPaginaAtual(1)
          }
          onDepoisLimpar={() =>
            setPaginaAtual(1)
          }
        >
          {({ alterar }) => (
            <div className="despesas-acima-previsto-filtros">
              <label>
                <span>
                  Ano
                </span>

                <select
                  value={ano}
                  onChange={(event) =>
                    alterar(
                      "ano",
                      Number(
                        event.target.value,
                      ),
                      {
                        categoria:
                          "todas",

                        buscaCategoria:
                          "",
                      },
                    )
                  }
                >
                  {(anosDisponiveis.length > 0
                    ? anosDisponiveis
                    : [obterAnoAtual()]
                  ).map((itemAno) => (
                    <option
                      key={itemAno}
                      value={itemAno}
                    >
                      {itemAno}
                    </option>
                  ))}
                </select>
              </label>


              <label>
                <span>
                  Mês
                </span>

                <select
                  value={mes}
                  onChange={(event) =>
                    alterar(
                      "mes",
                      Number(
                        event.target.value,
                      ),
                      {
                        categoria:
                          "todas",

                        buscaCategoria:
                          "",
                      },
                    )
                  }
                >
                  {MESES.map((itemMes) => (
                    <option
                      key={itemMes.valor}
                      value={itemMes.valor}
                    >
                      {itemMes.nome}
                    </option>
                  ))}
                </select>
              </label>


              <label className="despesas-acima-previsto-filtro-categoria">
                <span>
                  Categoria
                </span>

                <select
                  value={categoria}
                  onChange={(event) =>
                    alterar(
                      "categoria",
                      event.target.value,
                      {
                        buscaCategoria:
                          "",
                      },
                    )
                  }
                >
                  <option value="todas">
                    Todas as categorias
                  </option>

                  {categoriasExibidas.map(
                    (item) => (
                      <option
                        key={item.codigo}
                        value={item.codigo}
                      >
                        {item.codigo} - {item.nome}
                      </option>
                    ),
                  )}

                  {buscaCategoria.trim() &&
                    categoriasEncontradas.length === 0 && (
                      <option
                        value="__sem_resultado__"
                        disabled
                      >
                        Nenhuma categoria encontrada
                      </option>
                    )}
                </select>
              </label>


              <label className="despesas-acima-previsto-busca-categoria">
                <span>
                  Buscar categoria
                </span>

                <div className="despesas-acima-previsto-busca-campo">
                  <FiSearch />

                  <input
                    type="search"
                    value={buscaCategoria}
                    onChange={(event) =>
                      alterar(
                        "buscaCategoria",
                        event.target.value,
                        {
                          categoria:
                            "todas",
                        },
                      )
                    }
                    placeholder="Código ou nome da categoria"
                    autoComplete="off"
                  />
                </div>
              </label>
            </div>
          )}
        </Filtros>
      </div>


      {erro && (
        <div className="relatorios-erro">
          {erro.message ||
            "Não foi possível carregar o relatório financeiro."}
        </div>
      )}


      {carregando && (
        <div className="relatorios-loading despesas-acima-previsto-loading">
          <div className="relatorios-loading-card">
            <div className="relatorios-spinner" />

            <p>
              Carregando despesas...
            </p>
          </div>
        </div>
      )}


      {!carregando && !erro && (
        <div className="relatorio-resumo-grid">
          <div className="relatorio-resumo-card">
            <span>
              Categorias acima do previsto
            </span>

            <strong>
              {totalItens}
            </strong>
          </div>


          <div className="relatorio-resumo-card">
            <span>
              Maior excesso
            </span>

            <strong className="relatorio-resumo-texto despesas-acima-previsto-resumo-excesso">
              {maiorExcesso
                ? `${maiorExcesso.codigo_categoria} · ${formatarMoeda(maiorExcesso.excesso_previsto)}`
                : "-"}
            </strong>
          </div>


          <div className="relatorio-resumo-card">
            <span>
              Filtros aplicados
            </span>

            <strong className="relatorio-resumo-texto">
              {textoFiltros}
            </strong>
          </div>
        </div>
      )}


      {visualizacaoAberta && (
        <section className="relatorio-visualizacao">
          <div className="relatorio-visualizacao-header">
            <div>
              <span className="relatorio-visualizacao-eyebrow">
                Pré-visualização
              </span>

              <h3>
                {relatorio?.titulo}
              </h3>
            </div>

            <button
              type="button"
              className="relatorio-visualizacao-fechar"
              onClick={() =>
                setVisualizacaoAberta(false)
              }
              aria-label="Fechar visualização"
            >
              <FiX />
            </button>
          </div>


          <div className="relatorio-visualizacao-info">
            <div className="relatorio-visualizacao-info-item">
              <span>
                Filtros
              </span>

              <strong>
                {textoFiltros}
              </strong>
            </div>

            <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
              <span>
                Categorias
              </span>

              <strong>
                {totalItens}
              </strong>
            </div>
          </div>


          {totalItens > 0 ? (
            <div className="despesas-acima-previsto-tabela-area">
              <DespesasAcimaPrevistoTabela
                dados={dadosPagina}
                colunas={colunasExibicao}
              />
            </div>
          ) : (
            <div className="relatorio-visualizacao-vazia">
              <FiFileText />

              <strong>
                Nenhuma despesa acima do previsto
              </strong>

              <span>
                Não há categorias com valor realizado maior que o previsto para os filtros selecionados.
              </span>
            </div>
          )}


          <div className="relatorio-visualizacao-footer">
            <span>
              Exibindo {inicioExibicao} a {fimExibicao} de{" "}
              {totalItens} categoria(s)
            </span>

            <span>
              Ordenado pelo maior excesso sobre o previsto.
            </span>
          </div>


          {totalItens > ITENS_POR_PAGINA && (
            <Paginacao
              paginaAtual={paginaValida}
              totalItens={totalItens}
              itensPorPagina={ITENS_POR_PAGINA}
              onChangePagina={setPaginaAtual}
            />
          )}
        </section>
      )}
    </>
  );
}
