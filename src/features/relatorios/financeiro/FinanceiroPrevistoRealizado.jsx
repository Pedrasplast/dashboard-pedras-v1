import {
  useMemo,
  useState,
} from "react";

import {
  FiDollarSign,
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

import FinanceiroTabelaGrupo
  from "./components/FinanceiroTabelaGrupo";

import {
  obterColunasFinanceiro,
} from "./config/financeiroColunas";

import {
  criarRelatorioFinanceiroExportacao,
  exportarFinanceiroExcel,
  exportarFinanceiroPDF,
} from "./export/financeiroPrevistoRealizadoExport";

import useFinanceiroPrevistoRealizado
  from "./hooks/useFinanceiroPrevistoRealizado";

import {
  criarFiltrosFinanceirosIniciais,
  criarGruposFinanceiros,
  filtrarCategoriasFinanceiras,
  filtrarDadosPorCategoria,
  MESES,
  obterAnoAtual,
  obterCategoriasFinanceiras,
  obterNomeCategoriaSelecionada,
  obterNomeMes,
  paginarGruposFinanceiros,
} from "./utils/financeiroPrevistoRealizado.utils";

import "./FinanceiroPrevistoRealizado.css";


const ITENS_POR_PAGINA = 10;


export default function FinanceiroPrevistoRealizado({
  relatorio,
}) {
  const filtrosPadrao = useMemo(
    () => criarFiltrosFinanceirosIniciais(),
    [],
  );

  const [filtros, setFiltros] = useState(
    () => criarFiltrosFinanceirosIniciais(),
  );

  const {
    ano,
    mes,
    tipo,
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
    tipo,
    habilitado: Boolean(relatorio),
  });


  const colunasExibicao = useMemo(
    () =>
      obterColunasFinanceiro({
        incluirTipo: false,
      }),
    [],
  );


  const relatorioExportacao = useMemo(
    () =>
      criarRelatorioFinanceiroExportacao(
        relatorio,
      ),
    [relatorio],
  );


  const categoriasDisponiveis = useMemo(
    () =>
      obterCategoriasFinanceiras(
        dados,
      ),
    [dados],
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
        (item) => item.codigo === categoria,
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
        dados,
        categoria,
        buscaCategoria,
      ),
    [
      dados,
      categoria,
      buscaCategoria,
    ],
  );


  const gruposRelatorio = useMemo(
    () =>
      criarGruposFinanceiros(
        dadosFiltrados,
        tipo,
      ),
    [
      dadosFiltrados,
      tipo,
    ],
  );


  const dadosExportacao = useMemo(
    () =>
      gruposRelatorio.flatMap(
        (grupo) => grupo.dados,
      ),
    [gruposRelatorio],
  );


  const totalItens =
    dadosExportacao.length;


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


  const gruposPagina = useMemo(
    () =>
      paginarGruposFinanceiros({
        grupos: gruposRelatorio,
        inicio: inicioPagina,
        fim: fimPagina,
      }),
    [
      gruposRelatorio,
      inicioPagina,
      fimPagina,
    ],
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
    const tipoTexto =
      tipo === "todos"
        ? "Receitas e Despesas"
        : tipo;

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
      `Tipo: ${tipoTexto} | ` +
      `Categoria: ${categoriaTexto}`
    );
  }, [
    ano,
    mes,
    tipo,
    categoria,
    buscaCategoria,
    categoriasDisponiveis,
  ]);


  async function handleGerarPDF() {
    if (
      dadosExportacao.length === 0 ||
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
          dadosExportacao,

        textoFiltros,

        grupos:
          gruposRelatorio,
      });
    } catch (errorExportacao) {
      console.error(
        "Erro ao gerar PDF financeiro:",
        errorExportacao,
      );

      window.alert(
        "Não foi possível gerar o PDF financeiro.",
      );
    } finally {
      setExportando(null);
    }
  }


  async function handleGerarExcel() {
    if (
      dadosExportacao.length === 0 ||
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
          dadosExportacao,

        textoFiltros,

        grupos:
          gruposRelatorio,
      });
    } catch (errorExportacao) {
      console.error(
        "Erro ao gerar Excel financeiro:",
        errorExportacao,
      );

      window.alert(
        "Não foi possível gerar o Excel financeiro.",
      );
    } finally {
      setExportando(null);
    }
  }


  return (
    <>
      <div className="relatorio-selecionado-header">
        <div className="relatorio-selecionado-icone">
          <FiDollarSign />
        </div>

        <div>
          <span className="relatorio-selecionado-categoria">
            Financeiro
          </span>

          <h2>
            {relatorio?.titulo ||
              "Previsto x Realizado por Categoria"}
          </h2>

          <p>
            {relatorio?.descricao ||
              "Compara os valores previstos e realizados por categoria financeira no período selecionado."}
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
            dadosExportacao.length === 0
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
            dadosExportacao.length === 0 ||
            Boolean(exportando)
          }
        >
          {exportando === "pdf" ? (
            <FiRefreshCw className="financeiro-relatorio-girando" />
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
            dadosExportacao.length === 0 ||
            Boolean(exportando)
          }
        >
          {exportando === "excel" ? (
            <FiRefreshCw className="financeiro-relatorio-girando" />
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


      <div className="relatorio-filtros-card financeiro-relatorio-filtros-card">
        <div className="relatorio-filtros-header financeiro-relatorio-filtros-header">
          <div>
            <h3>
              Parâmetros do relatório
            </h3>
          </div>

          {atualizando && (
            <span className="financeiro-relatorio-atualizando">
              <FiRefreshCw className="financeiro-relatorio-girando" />

              Atualizando dados...
            </span>
          )}
        </div>


        <Filtros
          filtros={filtros}
          setFiltros={setFiltros}
          valoresPadrao={filtrosPadrao}
          className="financeiro-relatorio-filtros-wrapper"
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
            <div className="financeiro-relatorio-filtros">

              {/* ANO */}

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


              {/* MÊS */}

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
                  {MESES.map(
                    (itemMes) => (
                      <option
                        key={
                          itemMes.valor
                        }
                        value={
                          itemMes.valor
                        }
                      >
                        {itemMes.nome}
                      </option>
                    ),
                  )}
                </select>
              </label>


              {/* TIPO */}

              <label>
                <span>
                  Tipo
                </span>

                <select
                  value={tipo}
                  onChange={(event) =>
                    alterar(
                      "tipo",
                      event.target.value,
                      {
                        categoria:
                          "todas",

                        buscaCategoria:
                          "",
                      },
                    )
                  }
                >
                  <option value="todos">
                    Receitas e Despesas
                  </option>

                  <option value="Receita">
                    Receita
                  </option>

                  <option value="Despesa">
                    Despesa
                  </option>
                </select>
              </label>


              {/* CATEGORIA */}

              <label className="financeiro-relatorio-filtro-categoria">
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
                        key={
                          item.codigo
                        }
                        value={
                          item.codigo
                        }
                      >
                        {item.codigo} - {item.nome}
                      </option>
                    ),
                  )}

                  {buscaCategoria.trim() &&
                    categoriasEncontradas.length ===
                      0 && (
                      <option
                        value="__sem_resultado__"
                        disabled
                      >
                        Nenhuma categoria encontrada
                      </option>
                    )}
                </select>
              </label>


              {/* BUSCA CATEGORIA */}

              <label className="financeiro-relatorio-busca-categoria">
                <span>
                  Buscar categoria
                </span>

                <div className="financeiro-relatorio-busca-categoria-campo">
                  <FiSearch />

                  <input
                    type="search"
                    value={
                      buscaCategoria
                    }
                    onChange={(
                      event,
                    ) =>
                      alterar(
                        "buscaCategoria",
                        event.target
                          .value,
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
        <div className="relatorios-loading financeiro-relatorio-loading">
          <div className="relatorios-loading-card">
            <div className="relatorios-spinner" />

            <p>
              Carregando dados financeiros...
            </p>
          </div>
        </div>
      )}


      {!carregando && !erro && (
        <div className="relatorio-resumo-grid">
          <div className="relatorio-resumo-card">
            <span>
              Registros no relatório
            </span>

            <strong>
              {totalItens}
            </strong>
          </div>


          <div className="relatorio-resumo-card">
            <span>
              Relatório selecionado
            </span>

            <strong className="relatorio-resumo-texto">
              {relatorio?.titulo}
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
                setVisualizacaoAberta(
                  false,
                )
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
                Registros
              </span>

              <strong>
                {totalItens}
              </strong>
            </div>
          </div>


          {totalItens > 0 ? (
            <div className="financeiro-relatorio-grupos">
              {gruposPagina.map(
                (grupo) => (
                  <FinanceiroTabelaGrupo
                    key={
                      grupo.chave
                    }
                    grupo={
                      grupo
                    }
                    colunas={
                      colunasExibicao
                    }
                  />
                ),
              )}
            </div>
          ) : (
            <div className="relatorio-visualizacao-vazia">
              <FiFileText />

              <strong>
                Nenhum registro encontrado
              </strong>

              <span>
                Ajuste os filtros para visualizar os dados.
              </span>
            </div>
          )}


          <div className="relatorio-visualizacao-footer">
            <span>
              Exibindo{" "}
              {inicioExibicao} a{" "}
              {fimExibicao} de{" "}
              {totalItens} registro(s)
            </span>

            <span>
              Valores positivos são favoráveis e negativos desfavoráveis.
            </span>
          </div>


          {totalItens >
            ITENS_POR_PAGINA && (
            <Paginacao
              paginaAtual={
                paginaValida
              }
              totalItens={
                totalItens
              }
              itensPorPagina={
                ITENS_POR_PAGINA
              }
              onChangePagina={
                setPaginaAtual
              }
            />
          )}
        </section>
      )}
    </>
  );
}