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
  FiShoppingCart,
  FiX,
} from "react-icons/fi";

import useNecessidadeCompra
  from "./useNecessidadeCompra";

import "./NecessidadeCompraMateriaPrima.css";


/* =========================================================
   PERÍODO INICIAL
========================================================= */

function formatarDataInput(
  data,
) {
  const ano =
    data.getFullYear();

  const mes =
    String(
      data.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const dia =
    String(
      data.getDate(),
    ).padStart(
      2,
      "0",
    );


  return `${ano}-${mes}-${dia}`;
}


function obterPeriodoInicial() {
  const hoje =
    new Date();

  const fim =
    new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate() + 30,
    );


  return {
    inicio:
      formatarDataInput(
        hoje,
      ),

    fim:
      formatarDataInput(
        fim,
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
    ).split(
      "-",
    );


  if (
    partes.length !== 3
  ) {
    return String(
      valor,
    );
  }


  return `${partes[2]}/${partes[1]}/${partes[0]}`;
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
  if (
    valor === null ||
    valor === undefined
  ) {
    return "-";
  }


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


function montarTextoPeriodo(
  dataInicial,
  dataFinal,
) {
  if (
    !dataInicial ||
    !dataFinal
  ) {
    return "Período não informado";
  }


  return `${formatarData(
    dataInicial,
  )} até ${formatarData(
    dataFinal,
  )}`;
}


/* =========================================================
   STATUS
========================================================= */

const STATUS = {
  OK: {
    texto: "OK",
    classe: "ok",
  },

  ATENCAO: {
    texto: "Atenção",
    classe: "atencao",
  },

  COMPRAR: {
    texto: "Comprar",
    classe: "comprar",
  },

  CRITICO: {
    texto: "Crítico",
    classe: "critico",
  },

  CONFIGURAR: {
    texto: "Configurar",
    classe: "configurar",
  },

  SEM_SALDO: {
    texto: "Sem saldo",
    classe: "sem-saldo",
  },
};


function obterStatus(
  valor,
) {
  return STATUS[valor] || {
    texto:
      String(
        valor ?? "-",
      ),
    classe: "neutro",
  };
}


function BadgeStatus({
  status,
}) {
  const configuracao =
    obterStatus(
      status,
    );


  return (
    <span
      className={`ncm-status ${configuracao.classe}`}
    >
      {configuracao.texto}
    </span>
  );
}


/* =========================================================
   EXPORTAÇÃO CENTRAL
========================================================= */

function prepararExportacao(
  relatorio,
  dados,
) {
  const relatorioExportacao = {
    ...relatorio,

    titulo:
      relatorio?.titulo ||
      "Necessidade de Compra de Matéria-Prima",

    descricao:
      relatorio?.descricao ||
      "Planejamento de compra de PP considerando estoque, compras futuras, consumo programado, estoque mínimo, estoque alvo e prazo de reposição.",

    colunas: [
      "fornecedor",
      "estoque_atual",
      "compras_futuras",
      "consumo_programado",
      "menor_saldo",
      "estoque_minimo",
      "estoque_alvo",
      "comprar",
      "comprar_ate",
      "status",
    ],
  };


  const linhas =
    (
      dados?.fornecedores ||
      []
    ).map(
      (
        item,
      ) => ({
        fornecedor:
          item.fornecedorNome,

        estoque_atual:
          formatarKg(
            item.estoqueAtualKg,
          ),

        compras_futuras:
          formatarKg(
            item.comprasFuturasKg,
          ),

        consumo_programado:
          formatarKg(
            item.consumoProgramadoKg,
          ),

        menor_saldo:
          formatarKg(
            item.menorSaldoProjetadoKg,
          ),

        estoque_minimo:
          formatarKg(
            item.estoqueMinimoKg,
          ),

        estoque_alvo:
          formatarKg(
            item.estoqueAlvoKg,
          ),

        comprar:
          Number(
            item.necessidadeCompraKg ||
            0,
          ) > 0
            ? formatarKg(
                item.necessidadeCompraKg,
              )
            : "-",

        comprar_ate:
          item.dataLimiteCompra
            ? formatarData(
                item.dataLimiteCompra,
              )
            : "-",

        status:
          obterStatus(
            item.status,
          ).texto,
      }),
    );


  if (
    linhas.length > 0
  ) {
    linhas.push({
      fornecedor:
        "TOTAL GERAL",

      estoque_atual:
        "-",

      compras_futuras:
        formatarKg(
          dados?.resumo?.comprasFuturasKg,
        ),

      consumo_programado:
        formatarKg(
          dados?.resumo?.consumoProgramadoKg,
        ),

      menor_saldo:
        "-",

      estoque_minimo:
        "-",

      estoque_alvo:
        "-",

      comprar:
        formatarKg(
          dados?.resumo?.necessidadeCompraKg,
        ),

      comprar_ate:
        "-",

      status:
        "-",
    });
  }


  return {
    relatorioExportacao,
    dadosExportacao:
      linhas,
  };
}


/* =========================================================
   DETALHE DIÁRIO
========================================================= */

function DetalheFornecedor({
  fornecedor,
}) {
  return (
    <div className="ncm-detalhe">

      <div className="ncm-detalhe-resumo">

        <div>
          <span>Menor saldo</span>
          <strong>
            {formatarKg(
              fornecedor.menorSaldoProjetadoKg,
            )}
          </strong>
          <small>
            {fornecedor.dataMenorSaldo
              ? formatarData(
                  fornecedor.dataMenorSaldo,
                )
              : "Sem projeção disponível"}
          </small>
        </div>


        <div>
          <span>Primeiro abaixo do mínimo</span>
          <strong>
            {fornecedor.primeiraDataAbaixoMinimo
              ? formatarData(
                  fornecedor.primeiraDataAbaixoMinimo,
                )
              : "-"}
          </strong>
          <small>
            Mínimo: {formatarKg(
              fornecedor.estoqueMinimoKg,
            )}
          </small>
        </div>


        <div>
          <span>Prazo de entrega</span>
          <strong>
            {fornecedor.leadTimeDias === null ||
            fornecedor.leadTimeDias === undefined
              ? "-"
              : `${formatarNumero(
                  fornecedor.leadTimeDias,
                )} dia(s)`}
          </strong>
          <small>
            Comprar até: {fornecedor.dataLimiteCompra
              ? formatarData(
                  fornecedor.dataLimiteCompra,
                )
              : "-"}
          </small>
        </div>


        <div>
          <span>Ruptura prevista</span>
          <strong>
            {fornecedor.dataRuptura
              ? formatarData(
                  fornecedor.dataRuptura,
                )
              : "Não prevista"}
          </strong>
          <small>
            Saldo igual ou inferior a zero
          </small>
        </div>

      </div>


      <div className="ncm-detalhe-tabela-wrapper">

        <table className="ncm-detalhe-tabela">

          <thead>
            <tr>
              <th>Data</th>
              <th className="coluna-numerica">Saldo inicial</th>
              <th className="coluna-numerica">Recebido</th>
              <th className="coluna-numerica">Compra futura</th>
              <th className="coluna-numerica">Consumo</th>
              <th className="coluna-numerica">Saldo final</th>
            </tr>
          </thead>


          <tbody>
            {fornecedor.detalhes.map(
              (
                detalhe,
              ) => (
                <tr
                  key={`${fornecedor.fornecedorId}-${detalhe.data}`}
                  className={
                    detalhe.saldoFinalKg !== null &&
                    fornecedor.estoqueMinimoKg !== null &&
                    detalhe.saldoFinalKg < fornecedor.estoqueMinimoKg
                      ? "ncm-detalhe-linha-abaixo"
                      : ""
                  }
                >
                  <td>
                    <strong>
                      {formatarData(
                        detalhe.data,
                      )}
                    </strong>

                    {detalhe.saldoBaseAplicado && (
                      <span className="ncm-base-badge">
                        Saldo-base
                      </span>
                    )}
                  </td>

                  <td className="coluna-numerica">
                    {formatarKg(
                      detalhe.saldoInicioKg,
                    )}
                  </td>

                  <td className="coluna-numerica ncm-entrada">
                    {Number(
                      detalhe.recebidoKg ||
                      0,
                    ) > 0
                      ? formatarKg(
                          detalhe.recebidoKg,
                        )
                      : "-"}
                  </td>

                  <td className="coluna-numerica ncm-entrada">
                    {Number(
                      detalhe.compraFuturaKg ||
                      0,
                    ) > 0
                      ? formatarKg(
                          detalhe.compraFuturaKg,
                        )
                      : "-"}
                  </td>

                  <td className="coluna-numerica ncm-saida">
                    {Number(
                      detalhe.consumoKg ||
                      0,
                    ) > 0
                      ? formatarKg(
                          detalhe.consumoKg,
                        )
                      : "-"}
                  </td>

                  <td className="coluna-numerica">
                    <strong>
                      {formatarKg(
                        detalhe.saldoFinalKg,
                      )}
                    </strong>
                  </td>
                </tr>
              ),
            )}
          </tbody>

        </table>

      </div>

    </div>
  );
}


/* =========================================================
   TABELA PRINCIPAL
========================================================= */

function TabelaNecessidadeCompra({
  dados,
  expandidos,
  onAlternar,
}) {
  return (
    <div className="relatorio-visualizacao-tabela-wrapper">

      <table className="relatorio-visualizacao-tabela ncm-tabela">

        <thead>
          <tr>
            <th>Fornecedor</th>
            <th className="coluna-numerica">Estoque atual</th>
            <th className="coluna-numerica">Compras futuras</th>
            <th className="coluna-numerica">Consumo programado</th>
            <th className="coluna-numerica">Menor saldo</th>
            <th className="coluna-numerica">Estoque mínimo</th>
            <th className="coluna-numerica">Estoque alvo</th>
            <th className="coluna-numerica">Comprar</th>
            <th>Comprar até</th>
            <th>Status</th>
            <th>Detalhes</th>
          </tr>
        </thead>


        <tbody>
          {dados.fornecedores.map(
            (
              fornecedor,
            ) => {
              const chave =
                String(
                  fornecedor.fornecedorId,
                );

              const expandido =
                expandidos.has(
                  chave,
                );


              return (
                <Fragment
                  key={chave}
                >
                  <tr>
                    <td>
                      <strong className="ncm-fornecedor">
                        {fornecedor.fornecedorNome}
                      </strong>
                    </td>

                    <td className="coluna-numerica">
                      {formatarKg(
                        fornecedor.estoqueAtualKg,
                      )}
                    </td>

                    <td className="coluna-numerica">
                      {formatarKg(
                        fornecedor.comprasFuturasKg,
                      )}
                    </td>

                    <td className="coluna-numerica">
                      {formatarKg(
                        fornecedor.consumoProgramadoKg,
                      )}
                    </td>

                    <td className="coluna-numerica">
                      <strong
                        className={
                          fornecedor.menorSaldoProjetadoKg !== null &&
                          fornecedor.estoqueMinimoKg !== null &&
                          fornecedor.menorSaldoProjetadoKg <
                            fornecedor.estoqueMinimoKg
                            ? "ncm-valor-alerta"
                            : ""
                        }
                      >
                        {formatarKg(
                          fornecedor.menorSaldoProjetadoKg,
                        )}
                      </strong>
                    </td>

                    <td className="coluna-numerica">
                      {formatarKg(
                        fornecedor.estoqueMinimoKg,
                      )}
                    </td>

                    <td className="coluna-numerica">
                      {formatarKg(
                        fornecedor.estoqueAlvoKg,
                      )}
                    </td>

                    <td className="coluna-numerica ncm-comprar">
                      {Number(
                        fornecedor.necessidadeCompraKg ||
                        0,
                      ) > 0
                        ? formatarKg(
                            fornecedor.necessidadeCompraKg,
                          )
                        : "-"}
                    </td>

                    <td>
                      {fornecedor.dataLimiteCompra
                        ? formatarData(
                            fornecedor.dataLimiteCompra,
                          )
                        : "-"}
                    </td>

                    <td>
                      <BadgeStatus
                        status={
                          fornecedor.status
                        }
                      />
                    </td>

                    <td>
                      <button
                        type="button"
                        className="ncm-expandir"
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
                    <tr className="ncm-linha-detalhe">
                      <td colSpan={11}>
                        <DetalheFornecedor
                          fornecedor={
                            fornecedor
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
   RELATÓRIO
========================================================= */

export default function NecessidadeCompraMateriaPrima({
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
  ] = useState(
    periodoInicial.inicio,
  );

  const [
    dataFinal,
    setDataFinal,
  ] = useState(
    periodoInicial.fim,
  );

  const [
    fornecedoresExpandidos,
    setFornecedoresExpandidos,
  ] = useState(
    () =>
      new Set(),
  );

  const [
    visualizacaoAberta,
    setVisualizacaoAberta,
  ] = useState(
    false,
  );

  const [
    exportando,
    setExportando,
  ] = useState(
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
    useNecessidadeCompra({
      dataInicial,
      dataFinal,
      habilitado:
        !periodoInvalido,
    });


  const possuiDados =
    dados.fornecedores.length >
    0;

  const textoFiltros =
    montarTextoPeriodo(
      dataInicial,
      dataFinal,
    );


  const exportacao =
    useMemo(
      () =>
        prepararExportacao(
          relatorio,
          dados,
        ),
      [
        relatorio,
        dados,
      ],
    );


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


  async function exportarPDF() {
    if (
      !possuiDados ||
      exportando
    ) {
      return;
    }


    try {
      setExportando(
        "pdf",
      );


      const {
        gerarPdfRelatorio,
      } = await import(
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
        "Erro ao exportar necessidade de compra em PDF:",
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


  async function exportarExcel() {
    if (
      !possuiDados ||
      exportando
    ) {
      return;
    }


    try {
      setExportando(
        "excel",
      );


      const {
        gerarExcelRelatorio,
      } = await import(
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
        "Erro ao exportar necessidade de compra em Excel:",
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


  return (
    <>

      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <div className="relatorio-selecionado-header">

        <div className="relatorio-selecionado-icone">
          <FiShoppingCart />
        </div>


        <div>
          <span className="relatorio-selecionado-categoria">
            {relatorio?.categoria ||
              "Matéria-Prima"}
          </span>

          <h2>
            {relatorio?.titulo ||
              "Necessidade de Compra de Matéria-Prima"}
          </h2>

          <p>
            {relatorio?.descricao ||
              "Planejamento de compra com base no estoque disponível, consumo programado, compras futuras, estoque mínimo, estoque alvo e prazo de entrega."}
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
            carregando ||
            !possuiDados ||
            periodoInvalido
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
            carregando ||
            !possuiDados ||
            periodoInvalido ||
            Boolean(
              exportando,
            )
          }
        >

          {exportando ===
          "pdf" ? (

            <FiRefreshCw className="ncm-girando" />

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
            carregando ||
            !possuiDados ||
            periodoInvalido ||
            Boolean(
              exportando,
            )
          }
        >

          {exportando ===
          "excel" ? (

            <FiRefreshCw className="ncm-girando" />

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
              O período padrão considera os próximos 30 dias.
            </p>
          </div>
        </div>


        <div className="ncm-filtros">

          <label>
            <span>De</span>

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
            <span>Até</span>

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
            <span className="ncm-atualizando">
              <FiRefreshCw className="ncm-girando" />
              Atualizando dados...
            </span>
          )}

        </div>

      </div>


      {/* =================================================
          ERROS / AVISOS
      ================================================= */}

      {periodoInvalido && (
        <div className="ncm-mensagem ncm-mensagem-erro">
          <FiAlertTriangle />
          <span>
            A data final não pode ser anterior à data inicial.
          </span>
        </div>
      )}


      {erro && (
        <div className="ncm-mensagem ncm-mensagem-erro">
          <FiAlertTriangle />
          <span>{erro}</span>
        </div>
      )}


      {Number(
        dados.resumo.consumoSemReceitaKg ||
        0,
      ) > 0 && (
        <div className="ncm-mensagem ncm-mensagem-aviso">
          <FiAlertTriangle />

          <span>
            <strong>
              {formatarKg(
                dados.resumo.consumoSemReceitaKg,
              )}
            </strong>{" "}
            de PP programado não entrou na necessidade por fornecedor porque existem programações com receita pendente.
          </span>
        </div>
      )}


      {Number(
        dados.resumo.fornecedoresSemSaldo ||
        0,
      ) > 0 && (
        <div className="ncm-mensagem ncm-mensagem-aviso">
          <FiAlertTriangle />

          <span>
            Existem{" "}
            <strong>
              {formatarNumero(
                dados.resumo.fornecedoresSemSaldo,
              )}
            </strong>{" "}
            fornecedor(es) sem saldo-base suficiente para calcular a projeção.
          </span>
        </div>
      )}


      {/* =================================================
          RESUMO PADRÃO
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
                  dados.resumo.fornecedoresAnalisados,
                )}
          </strong>
        </div>


        <div className="relatorio-resumo-card">
          <span>
            Relatório selecionado
          </span>

          <strong className="relatorio-resumo-texto">
            {relatorio?.titulo ||
              "Necessidade de Compra de Matéria-Prima"}
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
                  "Necessidade de Compra de Matéria-Prima"}
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


          <div className="relatorio-visualizacao-info ncm-visualizacao-info">

            <div className="relatorio-visualizacao-info-item">
              <span>Filtros</span>
              <strong>{textoFiltros}</strong>
            </div>


            <div className="relatorio-visualizacao-info-item">
              <span>Comprar</span>
              <strong>
                {formatarNumero(
                  dados.resumo.fornecedoresComprar,
                )}{" "}
                fornecedor(es)
              </strong>
            </div>


            <div className="relatorio-visualizacao-info-item">
              <span>Críticos</span>
              <strong>
                {formatarNumero(
                  dados.resumo.fornecedoresCriticos,
                )}
              </strong>
            </div>


            <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
              <span>Compra sugerida</span>
              <strong>
                {formatarKg(
                  dados.resumo.necessidadeCompraKg,
                )}
              </strong>
            </div>

          </div>


          {carregando ? (
            <div className="relatorio-visualizacao-vazia">
              <FiRefreshCw className="ncm-girando" />
              <strong>
                Calculando necessidade de compra...
              </strong>
              <span>
                Aguarde enquanto estoque, programação e compras futuras são projetados.
              </span>
            </div>
          ) : possuiDados ? (
            <TabelaNecessidadeCompra
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
          ) : (
            <div className="relatorio-visualizacao-vazia">
              <FiFileText />
              <strong>
                Nenhum fornecedor encontrado
              </strong>
              <span>
                Não existem dados para o período selecionado.
              </span>
            </div>
          )}


          <div className="relatorio-visualizacao-footer">
            <span>
              {formatarNumero(
                dados.fornecedores.length,
              )}{" "}
              fornecedor(es) analisado(s)
            </span>

            <span>
              Estoque mínimo + estoque alvo + lead time
            </span>
          </div>

        </section>
      )}

    </>
  );
}
