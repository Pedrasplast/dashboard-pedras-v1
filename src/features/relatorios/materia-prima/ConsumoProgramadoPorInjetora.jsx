import {
  Fragment,
  useMemo,
  useState,
} from "react";

import {
  FiActivity,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiEye,
  FiFileText,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

import useConsumoProgramado
  from "./useConsumoProgramado";

import "./ConsumoProgramadoPorInjetora.css";


/* =========================================================
   DATAS
========================================================= */

function dataHojeLocal() {
  const agora = new Date();

  return [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, "0"),
    String(agora.getDate()).padStart(2, "0"),
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
  ] = String(
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


function formatarHoras(
  valor,
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "Legado";
  }


  return `${formatarNumero(
    valor,
    2,
  )} h`;
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
   PRODUTO / CICLO POR INJETORA
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


function obterProdutosGrupo(
  grupo,
) {
  const produtos =
    [];


  const encontrados =
    new Set();


  for (
    const programacao
    of grupo?.programacoes ||
    []
  ) {
    const produto =
      montarProduto(
        programacao?.codigoProduto,
        programacao?.descricao,
      );


    if (
      produto === "-" ||
      encontrados.has(
        produto,
      )
    ) {
      continue;
    }


    encontrados.add(
      produto,
    );


    produtos.push(
      produto,
    );
  }


  return produtos.length > 0
    ? produtos.join(" / ")
    : "-";
}


function obterCiclosProdutosGrupo(
  grupo,
) {
  const pares =
    [];


  const chaves =
    new Set();


  for (
    const programacao
    of grupo?.programacoes ||
    []
  ) {
    const codigo =
      String(
        programacao?.codigoProduto ??
        "",
      ).trim();


    const ciclo =
      Number(
        programacao?.cicloSegundos,
      );


    if (
      !Number.isFinite(
        ciclo,
      ) ||
      ciclo <= 0
    ) {
      continue;
    }


    const chave =
      `${codigo}|${ciclo}`;


    if (
      chaves.has(
        chave,
      )
    ) {
      continue;
    }


    chaves.add(
      chave,
    );


    pares.push({
      codigo,
      ciclo,
    });
  }


  if (
    pares.length ===
    0
  ) {
    return "-";
  }


  if (
    pares.length ===
    1
  ) {
    return `${formatarNumero(
      pares[0].ciclo,
      2,
    )} s`;
  }


  return pares
    .map(
      (
        item,
      ) =>
        item.codigo
          ? `${item.codigo}: ${formatarNumero(
              item.ciclo,
              2,
            )} s`
          : `${formatarNumero(
              item.ciclo,
              2,
            )} s`,
    )
    .join(" | ");
}


/* =========================================================
   EXPORTAÇÃO CENTRAL

   PDF e Excel utilizam os mesmos geradores dos demais
   relatórios do sistema.
========================================================= */

function prepararExportacaoInjetora(
  relatorio,
  dados,
) {
  const relatorioExportacao = {
    ...relatorio,

    titulo:
      relatorio?.titulo ||
      "Consumo Programado por Injetora",

    descricao:
      relatorio?.descricao ||
      "Consumo previsto de PP por injetora no período selecionado.",

    colunas: [
      "injetora",
      "produto",
      "horas",
      "ciclo",
      "pecas",
      "consumo_pp",
    ],
  };


  const linhas =
    [];


  for (
    const grupo
    of dados?.porInjetora ||
    []
  ) {
    for (
      const programacao
      of grupo?.programacoes ||
      []
    ) {
      linhas.push({
        injetora:
          `Injetora ${grupo.injetora}`,

        produto:
          montarProduto(
            programacao?.codigoProduto,
            programacao?.descricao,
          ),

        horas:
          formatarHoras(
            programacao?.horasProgramadas,
          ),

        ciclo:
          Number.isFinite(
            Number(
              programacao?.cicloSegundos,
            ),
          ) &&
          Number(
            programacao?.cicloSegundos,
          ) > 0
            ? `${formatarNumero(
                programacao.cicloSegundos,
                2,
              )} s`
            : "-",

        pecas:
          formatarNumero(
            programacao?.pecasPrevistas,
          ),

        consumo_pp:
          formatarKg(
            programacao?.consumoTotalKg,
          ),
      });
    }
  }


  /*
   * TOTAL GERAL
   *
   * Somente o consumo de PP é totalizado.
   *
   * Não totalizamos:
   * - horas;
   * - ciclo;
   * - peças.
   */
  if (
    linhas.length >
    0
  ) {
    linhas.push({
      injetora:
        "TOTAL GERAL",

      produto:
        "-",

      horas:
        "-",

      ciclo:
        "-",

      pecas:
        "-",

      consumo_pp:
        formatarKg(
          dados?.resumo?.consumoTotalKg,
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
   DETALHE DA PROGRAMAÇÃO
========================================================= */

function DetalheProgramacao({
  programacao,
}) {
  return (
    <article className="mpi-programacao">

      <div className="mpi-programacao-topo">

        <div>

          <span>
            Programação #{programacao.id}
          </span>


          <strong>
            {montarProduto(
              programacao.codigoProduto,
              programacao.descricao,
            )}
          </strong>

        </div>


        <strong className="mpi-programacao-consumo">
          {formatarKg(
            programacao.consumoTotalKg,
          )}
        </strong>

      </div>


      <div className="mpi-programacao-grid">

        <div>

          <span>
            Período considerado
          </span>


          <strong>

            {formatarDataHora(
              programacao.dataInicioConsiderada,
              programacao.horaInicioConsiderada,
            )}

            {" → "}

            {formatarDataHora(
              programacao.dataFimConsiderada,
              programacao.horaFimConsiderada,
            )}

          </strong>

        </div>


        <div>

          <span>
            Horas
          </span>


          <strong>
            {formatarHoras(
              programacao.horasProgramadas,
            )}
          </strong>

        </div>


        <div>

          <span>
            Ciclo
          </span>


          <strong>

            {programacao.cicloSegundos
              ? `${formatarNumero(
                  programacao.cicloSegundos,
                  2,
                )} s`
              : "-"}

          </strong>

        </div>


        <div>

          <span>
            Cavidades
          </span>


          <strong>
            {formatarNumero(
              programacao.cavidadeMolde,
            )}
          </strong>

        </div>


        <div>

          <span>
            Ciclos completos
          </span>


          <strong>

            {programacao.ciclosCompletos ===
            null
              ? "Legado"
              : formatarNumero(
                  programacao.ciclosCompletos,
                )}

          </strong>

        </div>


        <div>

          <span>
            Peças previstas
          </span>


          <strong>
            {formatarNumero(
              programacao.pecasPrevistas,
            )}
          </strong>

        </div>


        <div>

          <span>
            Peso da peça
          </span>


          <strong>
            {formatarKg(
              programacao.pesoKg,
            )}
          </strong>

        </div>


        <div>

          <span>
            Receita
          </span>


          <strong
            className={
              programacao.receitaConfigurada
                ? "mpi-texto-ok"
                : "mpi-texto-aviso"
            }
          >

            {programacao.receitaConfigurada
              ? "100% configurada"
              : `${formatarPercentual(
                  programacao.receitaPercentualTotal,
                )} configurado`}

          </strong>

        </div>

      </div>


      {!programacao.parametrosValidos && (

        <div className="mpi-aviso-inline">

          <FiAlertTriangle />


          <span>
            Esta programação possui parâmetros técnicos inválidos e não pôde ter o consumo calculado.
          </span>

        </div>

      )}


      {programacao.receitaConfigurada &&
      programacao.consumosFornecedores.length >
        0 ? (

        <div className="mpi-receita">

          <div className="mpi-receita-titulo">
            Receita por fornecedor
          </div>


          <div className="mpi-receita-tabela-wrapper">

            <table className="mpi-receita-tabela">

              <thead>

                <tr>

                  <th>
                    Fornecedor
                  </th>

                  <th className="coluna-numerica">
                    Participação
                  </th>

                  <th className="coluna-numerica">
                    Consumo
                  </th>

                </tr>

              </thead>


              <tbody>

                {programacao.consumosFornecedores.map(
                  (
                    fornecedor,
                  ) => (

                  <tr
                    key={`${programacao.id}-${fornecedor.fornecedorId}-${fornecedor.fornecedorNome}`}
                  >

                    <td>
                      {fornecedor.fornecedorNome}
                    </td>


                    <td className="coluna-numerica">

                      {formatarPercentual(
                        fornecedor.percentual,
                      )}

                    </td>


                    <td className="coluna-numerica mpi-receita-consumo">

                      {formatarKg(
                        fornecedor.consumoKg,
                      )}

                    </td>

                  </tr>

                  ),
                )}

              </tbody>

            </table>

          </div>

        </div>

      ) : Number(
          programacao.consumoSemReceitaKg ||
            0,
        ) > 0 ? (

        <div className="mpi-receita-pendente">

          <FiAlertTriangle />


          <div>

            <strong>
              Receita pendente
            </strong>


            <span>

              {formatarKg(
                programacao.consumoSemReceitaKg,
              )} não distribuído entre fornecedores.

            </span>

          </div>

        </div>

      ) : null}

    </article>
  );
}


/* =========================================================
   TABELA PRINCIPAL
========================================================= */

function TabelaInjetoras({
  dados,
  expandidas,
  onAlternar,
}) {
  return (
    <div className="relatorio-visualizacao-tabela-wrapper">

      <table className="relatorio-visualizacao-tabela mpi-tabela">

        <thead>

          <tr>

            <th>
              Injetora
            </th>

            <th>
              Produto
            </th>

            <th className="coluna-numerica">
              Horas
            </th>

            <th className="coluna-numerica">
              Ciclo
            </th>

            <th className="coluna-numerica">
              Peças
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

          {dados.porInjetora.map(
            (
              grupo,
            ) => {
              const expandida =
                expandidas.has(
                  grupo.injetora,
                );


              return (
                <Fragment
                  key={
                    grupo.injetora
                  }
                >

                  <tr>

                    <td>

                      <strong className="mpi-injetora">
                        Injetora{" "}
                        {grupo.injetora}
                      </strong>

                    </td>


                    <td>

                      <strong>
                        {obterProdutosGrupo(
                          grupo,
                        )}
                      </strong>

                    </td>


                    <td className="coluna-numerica">

                      {formatarHoras(
                        grupo.horasProgramadas,
                      )}


                      {grupo.possuiCalculoLegado && (

                        <span className="mpi-legado">
                          Legado
                        </span>

                      )}

                    </td>


                    <td className="coluna-numerica">

                      {obterCiclosProdutosGrupo(
                        grupo,
                      )}

                    </td>


                    <td className="coluna-numerica">

                      {formatarNumero(
                        grupo.pecasPrevistas,
                      )}

                    </td>


                    <td className="coluna-numerica mpi-total">

                      {formatarKg(
                        grupo.consumoTotalKg,
                      )}

                    </td>


                    <td>

                      <button
                        type="button"
                        className="mpi-expandir"
                        onClick={
                          () =>
                            onAlternar(
                              grupo.injetora,
                            )
                        }
                        aria-expanded={
                          expandida
                        }
                      >

                        {expandida
                          ? <FiChevronUp />
                          : <FiChevronDown />}


                        {expandida
                          ? "Fechar"
                          : "Ver"}

                      </button>

                    </td>

                  </tr>


                  {expandida && (

                    <tr className="mpi-linha-detalhe">

                      <td colSpan={7}>

                        <div className="mpi-programacoes-lista">

                          {grupo.programacoes.map(
                            (
                              programacao,
                            ) => (

                            <DetalheProgramacao
                              key={
                                programacao.id
                              }
                              programacao={
                                programacao
                              }
                            />

                            ),
                          )}

                        </div>

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
   RELATÓRIO
========================================================= */

export default function ConsumoProgramadoPorInjetora({
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
    injetorasExpandidas,
    setInjetorasExpandidas,
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
    dados.porInjetora.length >
    0;


  const textoFiltros =
    montarTextoPeriodo(
      dataInicial,
      dataFinal,
    );


  const exportacao =
    useMemo(
      () =>
        prepararExportacaoInjetora(
          relatorio,
          dados,
        ),
      [
        relatorio,
        dados,
      ],
    );


  /* =======================================================
     EXPANSÃO
  ======================================================= */

  function alternarInjetora(
    injetora,
  ) {
    setInjetorasExpandidas(
      (
        atuais,
      ) => {
        const proximo =
          new Set(
            atuais,
          );


        if (
          proximo.has(
            injetora,
          )
        ) {
          proximo.delete(
            injetora,
          );
        } else {
          proximo.add(
            injetora,
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
        "Erro ao exportar relatório por injetora em PDF:",
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
        "Erro ao exportar relatório por injetora em Excel:",
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
          <FiActivity />
        </div>


        <div>

          <span className="relatorio-selecionado-categoria">
            {relatorio?.categoria ||
              "Matéria-Prima"}
          </span>


          <h2>
            {relatorio?.titulo ||
              "Consumo Programado por Injetora"}
          </h2>


          <p>
            {relatorio?.descricao ||
              "Consumo previsto de PP por injetora, com detalhamento das programações e da receita por fornecedor."}
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

            <FiRefreshCw className="mpi-girando" />

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

            <FiRefreshCw className="mpi-girando" />

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


        <div className="mpi-filtros">

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

            <span className="mpi-atualizando">

              <FiRefreshCw className="mpi-girando" />

              Atualizando dados...

            </span>

          )}

        </div>

      </div>


      {/* =================================================
          ERROS / AVISOS
      ================================================= */}

      {periodoInvalido && (

        <div className="mpi-mensagem mpi-mensagem-erro">

          <FiAlertTriangle />

          <span>
            A data final não pode ser anterior à data inicial.
          </span>

        </div>

      )}


      {erro && (

        <div className="mpi-mensagem mpi-mensagem-erro">

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
                  dados.resumo.injetorasProgramadas,
                )}

          </strong>

        </div>


        <div className="relatorio-resumo-card">

          <span>
            Relatório selecionado
          </span>


          <strong className="relatorio-resumo-texto">

            {relatorio?.titulo ||
              "Consumo Programado por Injetora"}

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

        <div className="mpi-mensagem mpi-mensagem-aviso">

          <FiAlertTriangle />


          <span>

            <strong>
              {formatarKg(
                dados.resumo.consumoSemReceitaKg,
              )}
            </strong>{" "}

            ainda não está distribuído entre fornecedores porque{" "}
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
                  "Consumo Programado por Injetora"}
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


          <div className="relatorio-visualizacao-info mpi-visualizacao-info">

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
                Programações
              </span>

              <strong>
                {formatarNumero(
                  dados.resumo.programacoes,
                )}
              </strong>

            </div>


            <div className="relatorio-visualizacao-info-item">

              <span>
                Peças previstas
              </span>

              <strong>
                {formatarNumero(
                  dados.resumo.pecasPrevistas,
                )}
              </strong>

            </div>


            <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">

              <span>
                Consumo PP
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

              <FiRefreshCw className="mpi-girando" />

              <strong>
                Carregando dados do relatório...
              </strong>

              <span>
                Aguarde enquanto o consumo programado é calculado.
              </span>

            </div>

          ) : possuiDados ? (

            <TabelaInjetoras
              dados={
                dados
              }
              expandidas={
                injetorasExpandidas
              }
              onAlternar={
                alternarInjetora
              }
            />

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
                dados.porInjetora.length,
              )} injetora(s) exibida(s)
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