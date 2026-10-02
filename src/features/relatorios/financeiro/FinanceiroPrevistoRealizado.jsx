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
  FiX,
} from "react-icons/fi";

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
  criarGruposFinanceiros,
  MESES,
  obterAnoAtual,
  obterMesAtual,
  obterNomeMes,
  paginarGruposFinanceiros,
} from "./utils/financeiroPrevistoRealizado.utils";

import "./FinanceiroPrevistoRealizado.css";


const ITENS_POR_PAGINA = 10;


export default function FinanceiroPrevistoRealizado({
  relatorio,
}) {
  const [ano, setAno] = useState(
    obterAnoAtual(),
  );

  const [mes, setMes] = useState(
    obterMesAtual(),
  );

  const [tipo, setTipo] = useState(
    "todos",
  );

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


  const gruposRelatorio = useMemo(
    () =>
      criarGruposFinanceiros(
        dados,
        tipo,
      ),
    [dados, tipo],
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

    return (
      `Ano: ${ano} | ` +
      `Mês: ${obterNomeMes(mes)} | ` +
      `Tipo: ${tipoTexto}`
    );
  }, [ano, mes, tipo]);


  function alterarAno(valor) {
    setAno(Number(valor));
    setPaginaAtual(1);
  }


  function alterarMes(valor) {
    setMes(Number(valor));
    setPaginaAtual(1);
  }


  function alterarTipo(valor) {
    setTipo(valor);
    setPaginaAtual(1);
  }


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


      <div className="relatorio-filtros-card">
        <div className="relatorio-filtros-header">
          <div>
            <h3>
              Parâmetros do relatório
            </h3>

            <p>
              Selecione o ano, mês e tipo financeiro.
            </p>
          </div>

          {atualizando && (
            <span className="financeiro-relatorio-atualizando">
              <FiRefreshCw className="financeiro-relatorio-girando" />
              Atualizando dados...
            </span>
          )}
        </div>


        <div className="financeiro-relatorio-filtros">
          <label>
            <span>Ano</span>

            <select
              value={ano}
              onChange={(event) =>
                alterarAno(
                  event.target.value,
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
            <span>Mês</span>

            <select
              value={mes}
              onChange={(event) =>
                alterarMes(
                  event.target.value,
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


          <label>
            <span>Tipo</span>

            <select
              value={tipo}
              onChange={(event) =>
                alterarTipo(
                  event.target.value,
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
        </div>
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
              {dados.length}
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
                Registros
              </span>

              <strong>
                {totalItens}
              </strong>
            </div>
          </div>


          {totalItens > 0 ? (
            <div className="financeiro-relatorio-grupos">
              {gruposPagina.map((grupo) => (
                <FinanceiroTabelaGrupo
                  key={grupo.chave}
                  grupo={grupo}
                  colunas={colunasExibicao}
                />
              ))}
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
              Exibindo {inicioExibicao} a {fimExibicao} de{" "}
              {totalItens} registro(s)
            </span>

            <span>
              Valores positivos são favoráveis e negativos desfavoráveis.
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