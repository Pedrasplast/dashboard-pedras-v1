import {
  Fragment,
  useMemo,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiEye,
  FiFileText,
  FiPackage,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

import useConsumoProgramado
  from "./useConsumoProgramado";

import "./ConsumoProgramadoPorFornecedor.css";


/* =========================================================
   DATAS
========================================================= */

function dataHojeLocal() {
  const agora =
    new Date();

  return [
    agora.getFullYear(),

    String(
      agora.getMonth() + 1,
    ).padStart(
      2,
      "0",
    ),

    String(
      agora.getDate(),
    ).padStart(
      2,
      "0",
    ),
  ].join("-");
}


function adicionarDiasLocal(
  valor,
  dias,
) {
  const [
    ano,
    mes,
    dia,
  ] =
    String(
      valor,
    )
      .split("-")
      .map(Number);


  const data =
    new Date(
      ano,
      mes - 1,
      dia + dias,
      12,
      0,
      0,
    );


  return [
    data.getFullYear(),

    String(
      data.getMonth() + 1,
    ).padStart(
      2,
      "0",
    ),

    String(
      data.getDate(),
    ).padStart(
      2,
      "0",
    ),
  ].join("-");
}


function obterPeriodoInicial() {
  const hoje =
    dataHojeLocal();


  return {
    inicio:
      hoje,

    fim:
      adicionarDiasLocal(
        hoje,
        7,
      ),
  };
}


/* =========================================================
   FORMATADORES
========================================================= */

function formatarData(
  valor,
) {
  if (!valor) {
    return "-";
  }


  const partes =
    String(
      valor,
    ).split("-");


  if (
    partes.length !==
    3
  ) {
    return String(
      valor,
    );
  }


  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


function formatarDataHora(
  data,
  hora,
) {
  return hora
    ? `${formatarData(
        data,
      )} ${String(
        hora,
      ).slice(
        0,
        5,
      )}`
    : formatarData(
        data,
      );
}


function formatarNumero(
  valor,
  casas = 0,
) {
  const numero =
    Number(
      valor,
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "-";
  }


  return numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        casas,

      maximumFractionDigits:
        casas,
    },
  );
}


function formatarKg(
  valor,
) {
  const numero =
    Number(
      valor,
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "0,000 kg";
  }


  return `${numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        3,

      maximumFractionDigits:
        3,
    },
  )} kg`;
}


function formatarPercentual(
  valor,
) {
  const numero =
    Number(
      valor,
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "0%";
  }


  return `${numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        4,
    },
  )}%`;
}


function montarTextoPeriodo(
  dataInicial,
  dataFinal,
) {
  if (
    dataInicial &&
    dataFinal
  ) {
    return `De: ${formatarData(
      dataInicial,
    )} | Até: ${formatarData(
      dataFinal,
    )}`;
  }


  if (dataInicial) {
    return `De: ${formatarData(
      dataInicial,
    )}`;
  }


  if (dataFinal) {
    return `Até: ${formatarData(
      dataFinal,
    )}`;
  }


  return "Sem período informado";
}


/* =========================================================
   PRODUTO
========================================================= */

function montarProduto(
  codigo,
  descricao,
) {
  const codigoLimpo =
    String(
      codigo ?? "",
    ).trim();


  const descricaoLimpa =
    String(
      descricao ?? "",
    ).trim();


  if (
    codigoLimpo &&
    descricaoLimpa
  ) {
    return `${codigoLimpo} - ${descricaoLimpa}`;
  }


  if (
    codigoLimpo
  ) {
    return codigoLimpo;
  }


  if (
    descricaoLimpa
  ) {
    return descricaoLimpa;
  }


  return "-";
}


/* =========================================================
   TOTAL DE PEÇAS POR FORNECEDOR
========================================================= */

function obterTotalPecasFornecedor(
  grupo,
) {
  return (
    grupo?.detalhes ||
    []
  ).reduce(
    (
      total,
      detalhe,
    ) =>
      total +
      Number(
        detalhe?.pecasPrevistas ||
        0,
      ),
    0,
  );
}


/* =========================================================
   TOTAL DE PEÇAS SEM RECEITA
========================================================= */

function obterTotalPecasSemReceita(
  dados,
) {
  return (
    dados?.semReceita ||
    []
  ).reduce(
    (
      total,
      item,
    ) =>
      total +
      Number(
        item?.pecasPrevistas ||
        0,
      ),
    0,
  );
}


/* =========================================================
   EXPORTAÇÃO AGRUPADA

   ESTA MESMA ESTRUTURA É UTILIZADA EM:
   - PDF
   - EXCEL

   UMA LINHA POR FORNECEDOR.

   COLUNAS:
   - Fornecedor
   - Período
   - Peças
   - Consumo

   REMOVIDOS:
   - Injetora
   - Programação
   - Produto
   - Participação

   TOTAL GERAL:
   - não soma peças;
   - somente consumo PP.
========================================================= */

function prepararExportacaoFornecedor(
  relatorio,
  dados,
  dataInicial,
  dataFinal,
) {
  const relatorioExportacao = {
    ...relatorio,

    titulo:
      relatorio?.titulo ||
      "Consumo Programado por Fornecedor",

    descricao:
      relatorio?.descricao ||
      "Consolida a necessidade prevista de PP por fornecedor conforme as receitas dos produtos e a programação das injetoras no período selecionado.",

    colunas: [
      "fornecedor",
      "periodo",
      "pecas",
      "consumo",
    ],
  };


  const linhas =
    [];


  const periodo =
    dataInicial &&
    dataFinal
      ? `${formatarData(
          dataInicial,
        )} até ${formatarData(
          dataFinal,
        )}`
      : montarTextoPeriodo(
          dataInicial,
          dataFinal,
        );


  /* =====================================================
     FORNECEDORES
  ===================================================== */

  for (
    const grupo
    of dados?.porFornecedor ||
    []
  ) {
    linhas.push({
      fornecedor:
        grupo.fornecedorNome,

      periodo,

      pecas:
        formatarNumero(
          obterTotalPecasFornecedor(
            grupo,
          ),
        ),

      consumo:
        formatarKg(
          grupo.consumoKg,
        ),
    });
  }


  /* =====================================================
     SEM RECEITA

     APARECE SOMENTE QUANDO EXISTIR CONSUMO NÃO
     DISTRIBUÍDO ENTRE FORNECEDORES.
  ===================================================== */

  if (
    Number(
      dados?.resumo
        ?.consumoSemReceitaKg ||
        0,
    ) > 0
  ) {
    linhas.push({
      fornecedor:
        "SEM RECEITA",

      periodo,

      pecas:
        formatarNumero(
          obterTotalPecasSemReceita(
            dados,
          ),
        ),

      consumo:
        formatarKg(
          dados?.resumo
            ?.consumoSemReceitaKg,
        ),
    });
  }


  /* =====================================================
     TOTAL GERAL

     SOMENTE O CONSUMO PP É TOTALIZADO.

     NÃO SOMAMOS PEÇAS PORQUE UMA MESMA PEÇA PODE
     CONSUMIR MATERIAL DE MAIS DE UM FORNECEDOR.
  ===================================================== */

  if (
    linhas.length >
    0
  ) {
    linhas.push({
      fornecedor:
        "TOTAL GERAL",

      periodo:
        "-",

      pecas:
        "-",

      consumo:
        formatarKg(
          dados?.resumo
            ?.consumoTotalKg,
        ),
    });
  }


  return {
    relatorioExportacao,

    dadosExportacao:
      linhas,
  };
}


/* =========================================================
   DETALHES DO FORNECEDOR
========================================================= */

function DetalhesFornecedor({
  grupo,
}) {
  return (
    <div className="mpf-detalhes-lista">

      {grupo.detalhes.map(
        (
          detalhe,
          indice,
        ) => (

        <article
          key={`${grupo.fornecedorId}-${detalhe.programacaoId}-${detalhe.codigoProduto}-${indice}`}
          className="mpf-detalhe"
        >

          <div className="mpf-detalhe-topo">

            <div>

              <span>
                Injetora{" "}
                {detalhe.injetora}
                {" • "}
                Programação #{
                  detalhe.programacaoId
                }
              </span>


              <strong>
                {montarProduto(
                  detalhe.codigoProduto,
                  detalhe.descricao,
                )}
              </strong>

            </div>


            <strong className="mpf-detalhe-consumo">
              {formatarKg(
                detalhe.consumoFornecedorKg,
              )}
            </strong>

          </div>


          <div className="mpf-detalhe-grid">

            <div>

              <span>
                Período considerado
              </span>


              <strong>

                {formatarDataHora(
                  detalhe.dataInicioConsiderada,
                  detalhe.horaInicioConsiderada,
                )}

                {" → "}

                {formatarDataHora(
                  detalhe.dataFimConsiderada,
                  detalhe.horaFimConsiderada,
                )}

              </strong>

            </div>


            <div>

              <span>
                Receita
              </span>


              <strong>
                {formatarPercentual(
                  detalhe.percentual,
                )}
              </strong>

            </div>


            <div>

              <span>
                Peças previstas
              </span>


              <strong>
                {formatarNumero(
                  detalhe.pecasPrevistas,
                )}
              </strong>

            </div>


            <div>

              <span>
                PP total do programa
              </span>


              <strong>
                {formatarKg(
                  detalhe.consumoProgramaKg,
                )}
              </strong>

            </div>

          </div>

        </article>

        ),
      )}

    </div>
  );
}


/* =========================================================
   TABELA DA TELA
========================================================= */

function TabelaFornecedores({
  dados,
  expandidos,
  onAlternar,
}) {
  return (
    <div className="relatorio-visualizacao-tabela-wrapper">

      <table className="relatorio-visualizacao-tabela mpf-tabela">

        <thead>

          <tr>

            <th>
              Fornecedor
            </th>

            <th className="coluna-numerica">
              Injetoras
            </th>

            <th className="coluna-numerica">
              Produtos
            </th>

            <th className="coluna-numerica">
              Programações
            </th>

            <th className="coluna-numerica">
              Consumo PP
            </th>

            <th>
              Detalhes
            </th>

          </tr>

        </thead>


        <tbody>

          {dados.porFornecedor.map(
            (
              grupo,
            ) => {
              const chave =
                String(
                  grupo.fornecedorId ??
                  grupo.fornecedorNome,
                );


              const expandido =
                expandidos.has(
                  chave,
                );


              return (
                <Fragment
                  key={
                    chave
                  }
                >

                  <tr>

                    <td>

                      <strong className="mpf-fornecedor">
                        {grupo.fornecedorNome}
                      </strong>

                    </td>


                    <td className="coluna-numerica">

                      {formatarNumero(
                        grupo.quantidadeInjetoras,
                      )}

                    </td>


                    <td className="coluna-numerica">

                      {formatarNumero(
                        grupo.quantidadeProdutos,
                      )}

                    </td>


                    <td className="coluna-numerica">

                      {formatarNumero(
                        grupo.quantidadeProgramacoes,
                      )}

                    </td>


                    <td className="coluna-numerica mpf-total">

                      {formatarKg(
                        grupo.consumoKg,
                      )}

                    </td>


                    <td>

                      <button
                        type="button"
                        className="mpf-expandir"
                        onClick={
                          () =>
                            onAlternar(
                              chave,
                            )
                        }
                        aria-expanded={
                          expandido
                        }
                      >

                        {expandido
                          ? <FiChevronUp />
                          : <FiChevronDown />}


                        {expandido
                          ? "Fechar"
                          : "Ver"}

                      </button>

                    </td>

                  </tr>


                  {expandido && (

                    <tr className="mpf-linha-detalhe">

                      <td colSpan={6}>

                        <DetalhesFornecedor
                          grupo={
                            grupo
                          }
                        />

                      </td>

                    </tr>

                  )}

                </Fragment>
              );
            },
          )}

        </tbody>

      </table>

    </div>
  );
}


/* =========================================================
   SEM RECEITA
========================================================= */

function BlocoSemReceita({
  dados,
}) {
  if (
    !dados.semReceita.length
  ) {
    return null;
  }


  return (
    <section className="mpf-sem-receita">

      <div className="mpf-sem-receita-header">

        <div>

          <FiAlertTriangle />


          <div>

            <strong>
              Sem receita configurada
            </strong>


            <span>
              Consumo ainda não distribuído entre fornecedores.
            </span>

          </div>

        </div>


        <b>
          {formatarKg(
            dados.resumo.consumoSemReceitaKg,
          )}
        </b>

      </div>


      <div className="mpf-sem-receita-lista">

        {dados.semReceita.map(
          (
            item,
          ) => (

          <div
            key={
              item.id
            }
          >

            <span>
              Injetora{" "}
              {item.injetora}
            </span>


            <strong>
              {montarProduto(
                item.codigoProduto,
                item.descricao,
              )}
            </strong>


            <b>
              {formatarKg(
                item.consumoSemReceitaKg,
              )}
            </b>

          </div>

          ),
        )}

      </div>

    </section>
  );
}


/* =========================================================
   RELATÓRIO
========================================================= */

export default function ConsumoProgramadoPorFornecedor({
  relatorio,
}) {
  const periodoInicial =
    useMemo(
      () =>
        obterPeriodoInicial(),
      [],
    );


  const [
    dataInicial,
    setDataInicial,
  ] =
    useState(
      periodoInicial.inicio,
    );


  const [
    dataFinal,
    setDataFinal,
  ] =
    useState(
      periodoInicial.fim,
    );


  const [
    fornecedoresExpandidos,
    setFornecedoresExpandidos,
  ] =
    useState(
      () =>
        new Set(),
    );


  const [
    visualizacaoAberta,
    setVisualizacaoAberta,
  ] =
    useState(
      false,
    );


  const [
    exportando,
    setExportando,
  ] =
    useState(
      null,
    );


  const periodoInvalido =
    Boolean(
      dataInicial &&
      dataFinal &&
      dataFinal <
        dataInicial,
    );


  const {
    dados,
    carregando,
    atualizando,
    erro,
  } =
    useConsumoProgramado({
      dataInicial,

      dataFinal,

      habilitado:
        !periodoInvalido,
    });


  const possuiDados =
    dados.porFornecedor.length >
      0 ||
    dados.semReceita.length >
      0;


  const textoFiltros =
    montarTextoPeriodo(
      dataInicial,
      dataFinal,
    );


  /* =======================================================
     EXPORTAÇÃO

     PDF E EXCEL UTILIZAM EXATAMENTE A MESMA BASE.
  ======================================================= */

  const exportacao =
    useMemo(
      () =>
        prepararExportacaoFornecedor(
          relatorio,
          dados,
          dataInicial,
          dataFinal,
        ),
      [
        relatorio,
        dados,
        dataInicial,
        dataFinal,
      ],
    );


  /* =======================================================
     EXPANSÃO
  ======================================================= */

  function alternarFornecedor(
    chave,
  ) {
    setFornecedoresExpandidos(
      (
        atuais,
      ) => {
        const proximo =
          new Set(
            atuais,
          );


        if (
          proximo.has(
            chave,
          )
        ) {
          proximo.delete(
            chave,
          );
        } else {
          proximo.add(
            chave,
          );
        }


        return proximo;
      },
    );
  }


  /* =======================================================
     PDF
  ======================================================= */

  async function exportarPDF() {
    if (
      !possuiDados ||
      exportando ||
      exportacao.dadosExportacao.length ===
        0
    ) {
      return;
    }


    try {
      setExportando(
        "pdf",
      );


      const {
        gerarPdfRelatorio,
      } =
        await import(
          "../exportacao/GerarPDF"
        );


      await gerarPdfRelatorio({
        relatorio:
          exportacao.relatorioExportacao,

        dados:
          exportacao.dadosExportacao,

        textoFiltros,
      });

    } catch (error) {
      console.error(
        "Erro ao exportar relatório por fornecedor em PDF:",
        error,
      );


      window.alert(
        "Não foi possível gerar o PDF.",
      );

    } finally {
      setExportando(
        null,
      );
    }
  }


  /* =======================================================
     EXCEL

     MESMAS COLUNAS, AGRUPAMENTO E TOTAL DO PDF.
  ======================================================= */

  async function exportarExcel() {
    if (
      !possuiDados ||
      exportando ||
      exportacao.dadosExportacao.length ===
        0
    ) {
      return;
    }


    try {
      setExportando(
        "excel",
      );


      const {
        gerarExcelRelatorio,
      } =
        await import(
          "../exportacao/GerarExcel"
        );


      await gerarExcelRelatorio({
        relatorio:
          exportacao.relatorioExportacao,

        dados:
          exportacao.dadosExportacao,
      });

    } catch (error) {
      console.error(
        "Erro ao exportar relatório por fornecedor em Excel:",
        error,
      );


      window.alert(
        "Não foi possível gerar o Excel.",
      );

    } finally {
      setExportando(
        null,
      );
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <div className="relatorio-selecionado-header">

        <div className="relatorio-selecionado-icone">
          <FiPackage />
        </div>


        <div>

          <span className="relatorio-selecionado-categoria">
            {relatorio?.categoria ||
              "Matéria-Prima"}
          </span>


          <h2>
            {relatorio?.titulo ||
              "Consumo Programado por Fornecedor"}
          </h2>


          <p>
            {relatorio?.descricao ||
              "Necessidade total de PP por fornecedor conforme as receitas e a programação das injetoras no período."}
          </p>

        </div>

      </div>


      {/* =================================================
          AÇÕES
      ================================================= */}

      <div className="relatorio-acoes">

        <button
          type="button"
          className="btn-relatorio"
          onClick={
            () =>
              setVisualizacaoAberta(
                true,
              )
          }
          disabled={
            !possuiDados
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
          onClick={
            exportarPDF
          }
          disabled={
            !possuiDados ||
            Boolean(
              exportando,
            )
          }
        >

          {exportando ===
          "pdf" ? (

            <FiRefreshCw className="mpf-girando" />

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
          onClick={
            exportarExcel
          }
          disabled={
            !possuiDados ||
            Boolean(
              exportando,
            )
          }
        >

          {exportando ===
          "excel" ? (

            <FiRefreshCw className="mpf-girando" />

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


      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="relatorio-filtros-card">

        <div className="relatorio-filtros-header">

          <div>

            <h3>
              Parâmetros do relatório
            </h3>


            <p>
              Refine os dados antes de visualizar ou exportar.
            </p>

          </div>

        </div>


        <div className="mpf-filtros">

          <label>

            <span>
              De
            </span>


            <input
              type="date"
              value={
                dataInicial
              }
              max={
                dataFinal ||
                undefined
              }
              onChange={
                (
                  event,
                ) =>
                  setDataInicial(
                    event.target.value,
                  )
              }
            />

          </label>


          <label>

            <span>
              Até
            </span>


            <input
              type="date"
              value={
                dataFinal
              }
              min={
                dataInicial ||
                undefined
              }
              onChange={
                (
                  event,
                ) =>
                  setDataFinal(
                    event.target.value,
                  )
              }
            />

          </label>


          {atualizando && (

            <span className="mpf-atualizando">

              <FiRefreshCw className="mpf-girando" />

              Atualizando dados...

            </span>

          )}

        </div>

      </div>


      {/* =================================================
          ERROS
      ================================================= */}

      {periodoInvalido && (

        <div className="mpf-mensagem mpf-mensagem-erro">

          <FiAlertTriangle />

          <span>
            A data final não pode ser anterior à data inicial.
          </span>

        </div>

      )}


      {erro && (

        <div className="mpf-mensagem mpf-mensagem-erro">

          <FiAlertTriangle />

          <span>
            {erro}
          </span>

        </div>

      )}


      {/* =================================================
          RESUMO
      ================================================= */}

      <div className="relatorio-resumo-grid">

        <div className="relatorio-resumo-card">

          <span>
            Registros no relatório
          </span>


          <strong>

            {carregando
              ? "..."
              : formatarNumero(
                  dados.resumo.fornecedoresEnvolvidos,
                )}

          </strong>

        </div>


        <div className="relatorio-resumo-card">

          <span>
            Relatório selecionado
          </span>


          <strong className="relatorio-resumo-texto">

            {relatorio?.titulo ||
              "Consumo Programado por Fornecedor"}

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


      {Number(
        dados.resumo.consumoSemReceitaKg ||
          0,
      ) > 0 && (

        <div className="mpf-mensagem mpf-mensagem-aviso">

          <FiAlertTriangle />


          <span>

            <strong>
              {formatarKg(
                dados.resumo.consumoSemReceitaKg,
              )}
            </strong>{" "}

            ainda não pode ser atribuído a fornecedores porque{" "}
            {dados.resumo.programacoesSemReceita} programação(ões)
            possui(em) receita pendente.

          </span>

        </div>

      )}


      {/* =================================================
          VISUALIZAÇÃO
      ================================================= */}

      {visualizacaoAberta && (

        <section className="relatorio-visualizacao">

          <div className="relatorio-visualizacao-header">

            <div>

              <span className="relatorio-visualizacao-eyebrow">
                Pré-visualização
              </span>


              <h3>
                {relatorio?.titulo ||
                  "Consumo Programado por Fornecedor"}
              </h3>

            </div>


            <button
              type="button"
              className="relatorio-visualizacao-fechar"
              onClick={
                () =>
                  setVisualizacaoAberta(
                    false,
                  )
              }
              aria-label="Fechar visualização"
            >

              <FiX />

            </button>

          </div>


          <div className="relatorio-visualizacao-info mpf-visualizacao-info">

            <div className="relatorio-visualizacao-info-item">

              <span>
                Filtros
              </span>

              <strong>
                {textoFiltros}
              </strong>

            </div>


            <div className="relatorio-visualizacao-info-item">

              <span>
                PP distribuído
              </span>

              <strong>
                {formatarKg(
                  dados.resumo.consumoDistribuidoKg,
                )}
              </strong>

            </div>


            <div className="relatorio-visualizacao-info-item">

              <span>
                Sem receita
              </span>

              <strong>
                {formatarKg(
                  dados.resumo.consumoSemReceitaKg,
                )}
              </strong>

            </div>


            <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">

              <span>
                Consumo total
              </span>

              <strong>
                {formatarKg(
                  dados.resumo.consumoTotalKg,
                )}
              </strong>

            </div>

          </div>


          {carregando ? (

            <div className="relatorio-visualizacao-vazia">

              <FiRefreshCw className="mpf-girando" />

              <strong>
                Carregando dados do relatório...
              </strong>

              <span>
                Aguarde enquanto o consumo por fornecedor é calculado.
              </span>

            </div>

          ) : possuiDados ? (

            <>

              {dados.porFornecedor.length >
                0 && (

                <TabelaFornecedores
                  dados={
                    dados
                  }
                  expandidos={
                    fornecedoresExpandidos
                  }
                  onAlternar={
                    alternarFornecedor
                  }
                />

              )}


              <BlocoSemReceita
                dados={
                  dados
                }
              />

            </>

          ) : (

            <div className="relatorio-visualizacao-vazia">

              <FiFileText />

              <strong>
                Nenhum registro encontrado
              </strong>

              <span>
                Ajuste o período para visualizar os dados.
              </span>

            </div>

          )}


          <div className="relatorio-visualizacao-footer">

            <span>

              {formatarNumero(
                dados.porFornecedor.length,
              )} fornecedor(es) exibido(s)

            </span>


            <span>
              Visualização atualizada conforme os filtros
            </span>

          </div>

        </section>

      )}

    </>
  );
}