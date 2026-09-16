import {
  useMemo,
  useState,
} from "react";

import {
  FiDollarSign,
  FiDownload,
  FiEye,
  FiFileText,
  FiX,
} from "react-icons/fi";

import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabaseClient";

import Paginacao from "@/components/paginacao/Paginacao";

import {
  obterColunasRelatorio,
} from "../config/Colunas.config";

import "./FinanceiroPrevistoRealizado.css";

/* =====================================================
   PAGINAÇÃO PADRÃO
===================================================== */

const ITENS_POR_PAGINA = 10;

/* =====================================================
   MESES
===================================================== */

const MESES = Object.freeze([
  { valor: 1, nome: "Janeiro" },
  { valor: 2, nome: "Fevereiro" },
  { valor: 3, nome: "Março" },
  { valor: 4, nome: "Abril" },
  { valor: 5, nome: "Maio" },
  { valor: 6, nome: "Junho" },
  { valor: 7, nome: "Julho" },
  { valor: 8, nome: "Agosto" },
  { valor: 9, nome: "Setembro" },
  { valor: 10, nome: "Outubro" },
  { valor: 11, nome: "Novembro" },
  { valor: 12, nome: "Dezembro" },
]);

function obterAnoAtual() {
  return new Date().getFullYear();
}

function obterMesAtual() {
  return new Date().getMonth() + 1;
}

function obterNomeMes(numero) {
  return MESES.find(
    (item) => item.valor === Number(numero),
  )?.nome || "-";
}

/* =====================================================
   MANTER CABEÇALHO FINANCEIRO PRIMEIRO
===================================================== */

function colocarCabecalhoPrimeiro(lista, codigoCabecalho) {
  const registros = Array.isArray(lista)
    ? [...lista]
    : [];

  const indice = registros.findIndex(
    (item) =>
      String(item?.codigo_categoria || "").trim() ===
      String(codigoCabecalho),
  );

  if (indice <= 0) {
    return registros;
  }

  const [cabecalho] = registros.splice(indice, 1);

  return [
    cabecalho,
    ...registros,
  ];
}

/* =====================================================
   COMPONENTE
===================================================== */

export default function FinanceiroPrevistoRealizado({
  relatorio,
}) {
  /* =================================================
     FILTROS
  ================================================= */

  const [ano, setAno] = useState(obterAnoAtual());
  const [mes, setMes] = useState(obterMesAtual());
  const [tipo, setTipo] = useState("todos");

  const [visualizacaoAberta, setVisualizacaoAberta] =
    useState(false);

  /* =================================================
     PAGINAÇÃO
  ================================================= */

  const [paginaAtual, setPaginaAtual] = useState(1);

  /* =================================================
     ANOS DISPONÍVEIS
  ================================================= */

  const {
    data: anosDisponiveis = [],
  } = useQuery({
    queryKey: ["financeiro-relatorios-anos"],

    queryFn: async () => {
      const { data, error } = await supabase
        .from("financeiro_omie_resumo")
        .select("ano")
        .order("ano", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      return [
        ...new Set(
          (data || [])
            .map((item) => Number(item.ano))
            .filter(Number.isFinite),
        ),
      ];
    },

    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  /* =================================================
     CONSULTA DO RELATÓRIO
  ================================================= */

  const {
    data: dados = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "relatorio-financeiro-previsto-realizado",
      ano,
      mes,
      tipo,
    ],

    queryFn: async () => {
      const {
        data,
        error: erroRpc,
      } = await supabase.rpc(
        "listar_relatorio_financeiro_previsto_realizado",
        {
          p_ano: Number(ano),

          p_mes_inicial: Number(mes),

          p_mes_final: Number(mes),

          p_tipo: tipo === "todos" ? null : tipo,

          p_limite: 5000,
        },
      );

      if (erroRpc) {
        throw erroRpc;
      }

      return Array.isArray(data) ? data : [];
    },

    enabled: Boolean(relatorio && ano && mes),

    staleTime: 30 * 1000,

    refetchOnWindowFocus: true,

    retry: 1,
  });

  /* =================================================
     COLUNAS
  ================================================= */

  const colunas = useMemo(
    () => obterColunasRelatorio(relatorio),
    [relatorio],
  );

  const colunasExibicao = useMemo(
    () =>
      colunas.filter(
        (coluna) => coluna.chave !== "tipo_financeiro",
      ),
    [colunas],
  );

  /* =================================================
     CONFIGURAÇÃO DA EXPORTAÇÃO
  ================================================= */

  const relatorioExportacao = useMemo(
    () => ({
      ...relatorio,

      colunas: Array.isArray(relatorio?.colunas)
        ? relatorio.colunas.filter(
            (chave) => chave !== "tipo_financeiro",
          )
        : [],
    }),
    [relatorio],
  );

  /* =================================================
     SEPARAR RECEITAS E DESPESAS
  ================================================= */

  const dadosReceitas = useMemo(
    () =>
      colocarCabecalhoPrimeiro(
        dados.filter(
          (item) =>
            String(item.tipo || "")
              .trim()
              .toLowerCase() === "receita",
        ),
        "1",
      ),
    [dados],
  );

  const dadosDespesas = useMemo(
    () =>
      colocarCabecalhoPrimeiro(
        dados.filter(
          (item) =>
            String(item.tipo || "")
              .trim()
              .toLowerCase() === "despesa",
        ),
        "2",
      ),
    [dados],
  );

  /* =================================================
     GRUPOS ORIGINAIS
  ================================================= */

  const gruposRelatorio = useMemo(() => {
    if (tipo === "Receita") {
      return [
        {
          chave: "receitas",
          titulo: "Receitas",
          dados: dadosReceitas,
        },
      ];
    }

    if (tipo === "Despesa") {
      return [
        {
          chave: "despesas",
          titulo: "Despesas",
          dados: dadosDespesas,
        },
      ];
    }

    return [
      {
        chave: "receitas",
        titulo: "Receitas",
        dados: dadosReceitas,
      },
      {
        chave: "despesas",
        titulo: "Despesas",
        dados: dadosDespesas,
      },
    ].filter((grupo) => grupo.dados.length > 0);
  }, [
    tipo,
    dadosReceitas,
    dadosDespesas,
  ]);

  /* =================================================
     DADOS COMPLETOS PARA EXPORTAÇÃO

     Não sofre paginação.
  ================================================= */

  const dadosExportacao = useMemo(
    () =>
      gruposRelatorio.flatMap(
        (grupo) => grupo.dados,
      ),
    [gruposRelatorio],
  );

  /* =================================================
     PAGINAÇÃO PADRÃO

     Aplica 10 linhas no conjunto de receitas
     e despesas, sem modificar os dados originais.
  ================================================= */

  const totalItens = dadosExportacao.length;

  const totalPaginas = Math.max(
    1,
    Math.ceil(totalItens / ITENS_POR_PAGINA),
  );

  const paginaValida = Math.max(
    1,
    Math.min(paginaAtual, totalPaginas),
  );

  const inicioPagina =
    (paginaValida - 1) * ITENS_POR_PAGINA;

  const fimPagina =
    inicioPagina + ITENS_POR_PAGINA;

  /* =================================================
     SEPARAR OS REGISTROS DA PÁGINA POR GRUPO

     Mantém Receitas e Despesas em tabelas separadas.
  ================================================= */

  const gruposPagina = useMemo(() => {
    let indiceGlobal = 0;

    return gruposRelatorio
      .map((grupo) => {
        const inicioGrupo = indiceGlobal;

        const fimGrupo =
          inicioGrupo + grupo.dados.length;

        indiceGlobal = fimGrupo;

        const inicioLocal = Math.max(
          0,
          inicioPagina - inicioGrupo,
        );

        const fimLocal = Math.max(
          0,
          Math.min(
            grupo.dados.length,
            fimPagina - inicioGrupo,
          ),
        );

        return {
          ...grupo,

          totalGrupo: grupo.dados.length,

          dados: grupo.dados.slice(
            inicioLocal,
            fimLocal,
          ),
        };
      })
      .filter((grupo) => grupo.dados.length > 0);
  }, [
    gruposRelatorio,
    inicioPagina,
    fimPagina,
  ]);

  /* =================================================
     INTERVALO EXIBIDO
  ================================================= */

  const inicioExibicao =
    totalItens > 0 ? inicioPagina + 1 : 0;

  const fimExibicao = Math.min(
    fimPagina,
    totalItens,
  );

  /* =================================================
     ALTERAR FILTROS
  ================================================= */

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

  /* =================================================
     TEXTO DOS FILTROS
  ================================================= */

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

  /* =================================================
     EXPORTAÇÃO PDF — TODOS OS REGISTROS
  ================================================= */

  async function handleGerarPDF() {
    if (dadosExportacao.length === 0) {
      return;
    }

    const {
      gerarPdfRelatorio,
    } = await import("../exportacao/GerarPDF");

    gerarPdfRelatorio({
      relatorio: relatorioExportacao,

      dados: dadosExportacao,

      textoFiltros,

      grupos: gruposRelatorio,
    });
  }

  /* =================================================
     EXPORTAÇÃO EXCEL — TODOS OS REGISTROS
  ================================================= */

  async function handleGerarExcel() {
    if (dadosExportacao.length === 0) {
      return;
    }

    const {
      gerarExcelRelatorio,
    } = await import("../exportacao/GerarExcel");

    await gerarExcelRelatorio({
      relatorio: relatorioExportacao,

      dados: dadosExportacao,

      grupos: gruposRelatorio,
    });
  }

  /* =================================================
     RENDERIZAÇÃO
  ================================================= */

  return (
    <>
      {/* CABEÇALHO */}

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

      {/* AÇÕES */}

      <div className="relatorio-acoes">
        <button
          type="button"
          className="btn-relatorio"
          onClick={() => {
            setPaginaAtual(1);
            setVisualizacaoAberta(true);
          }}
          disabled={dadosExportacao.length === 0}
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
          disabled={dadosExportacao.length === 0}
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
          disabled={dadosExportacao.length === 0}
        >
          <FiDownload />

          <div>
            <strong>Exportar Excel</strong>
            <span>Tabela XLSX</span>
          </div>
        </button>
      </div>

      {/* FILTROS */}

      <div className="relatorio-filtros-card">
        <div className="relatorio-filtros-header">
          <div>
            <h3>Parâmetros do relatório</h3>

            <p>
              Selecione o ano, mês e tipo financeiro.
            </p>
          </div>
        </div>

        <div className="financeiro-relatorio-filtros">
          <label>
            <span>Ano</span>

            <select
              value={ano}
              onChange={(event) =>
                alterarAno(event.target.value)
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
                alterarMes(event.target.value)
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
                alterarTipo(event.target.value)
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

      {/* ERRO */}

      {error && (
        <div className="relatorios-erro">
          {error.message ||
            "Não foi possível carregar o relatório financeiro."}
        </div>
      )}

      {/* CARREGAMENTO */}

      {isLoading && (
        <div className="relatorios-loading financeiro-relatorio-loading">
          <div className="relatorios-loading-card">
            <div className="relatorios-spinner" />

            <p>Carregando dados financeiros...</p>
          </div>
        </div>
      )}

      {/* RESUMO */}

      {!isLoading && !error && (
        <div className="relatorio-resumo-grid">
          <div className="relatorio-resumo-card">
            <span>Registros no relatório</span>
            <strong>{dados.length}</strong>
          </div>

          <div className="relatorio-resumo-card">
            <span>Relatório selecionado</span>

            <strong className="relatorio-resumo-texto">
              {relatorio?.titulo}
            </strong>
          </div>

          <div className="relatorio-resumo-card">
            <span>Filtros aplicados</span>

            <strong className="relatorio-resumo-texto">
              {textoFiltros}
            </strong>
          </div>
        </div>
      )}

      {/* PRÉ-VISUALIZAÇÃO */}

      {visualizacaoAberta && (
        <section className="relatorio-visualizacao">
          <div className="relatorio-visualizacao-header">
            <div>
              <span className="relatorio-visualizacao-eyebrow">
                Pré-visualização
              </span>

              <h3>{relatorio?.titulo}</h3>
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
              <strong>{textoFiltros}</strong>
            </div>

            <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
              <span>Registros</span>
              <strong>{totalItens}</strong>
            </div>
          </div>

          {totalItens > 0 ? (
            <div className="financeiro-relatorio-grupos">
              {gruposPagina.map((grupo) => (
                <section
                  key={grupo.chave}
                  className={`financeiro-relatorio-grupo financeiro-relatorio-grupo-${grupo.chave}`}
                >
                  <div className="financeiro-relatorio-grupo-titulo">
                    <div>
                      <span>Classificação financeira</span>
                      <h4>{grupo.titulo}</h4>
                    </div>

                    <strong>
                      {grupo.totalGrupo} categoria(s)
                    </strong>
                  </div>

                  <div className="relatorio-visualizacao-tabela-wrapper">
                    <table className="relatorio-visualizacao-tabela">
                      <thead>
                        <tr>
                          {colunasExibicao.map((coluna) => (
                            <th key={coluna.chave}>
                              {coluna.titulo}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {grupo.dados.map((item, indice) => (
                          <tr
                            key={`${grupo.chave}-${item.codigo_categoria || "categoria"}-${indice}`}
                            className={
                              String(
                                item.codigo_categoria || "",
                              ).trim() ===
                              (
                                grupo.chave === "receitas"
                                  ? "1"
                                  : "2"
                              )
                                ? "financeiro-linha-cabecalho-grupo"
                                : ""
                            }
                          >
                            {colunasExibicao.map((coluna) => (
                              <td key={coluna.chave}>
                                {coluna.valor(item)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="relatorio-visualizacao-vazia">
              <FiFileText />

              <strong>Nenhum registro encontrado</strong>

              <span>
                Ajuste os filtros para visualizar os dados.
              </span>
            </div>
          )}

          {/* RODAPÉ */}

          <div className="relatorio-visualizacao-footer">
            <span>
              Exibindo {inicioExibicao} a {fimExibicao} de{" "}
              {totalItens} registro(s)
            </span>

            <span>
              Valores positivos são favoráveis e negativos desfavoráveis.
            </span>
          </div>

          {/* PAGINAÇÃO PADRÃO */}

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