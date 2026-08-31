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
  FiEdit3,
  FiFileText,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  supabase,
} from "@/lib/supabaseClient";

import "./PedidosAlteradosRelatorio.css";


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const ITENS_POR_PAGINA =
  12;


/* =========================================================
   DATAS
========================================================= */

function formatarDataHora(
  valor,
) {
  if (!valor) {
    return "-";
  }

  const data =
    new Date(
      valor,
    );

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "-";
  }

  return data.toLocaleString(
    "pt-BR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );
}


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


function obterPeriodoPadrao() {
  /*
   * O relatório abre automaticamente
   * do primeiro dia do mês atual até hoje.
   *
   * Ao alterar qualquer uma das datas,
   * o React Query consulta o banco novamente.
   */
  const hoje =
    new Date();

  const inicio =
    new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      1,
    );

  return {
    inicio:
      formatarDataInput(
        inicio,
      ),

    fim:
      formatarDataInput(
        hoje,
      ),
  };
}


/* =========================================================
   TEXTO
========================================================= */

function normalizarTexto(
  valor,
) {
  return String(
    valor ?? "",
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}


/* =========================================================
   CAMPOS
========================================================= */

const ROTULOS_DETALHES =
  Object.freeze({
    numero_pedido:
      "Número do pedido",

    cliente:
      "Cliente",

    data_pedido:
      "Data do pedido",

    previsao:
      "Previsão de faturamento",

    codigo_produto:
      "Código do produto",

    produto:
      "Produto",

    quantidade:
      "Quantidade",

    unidade:
      "Unidade",

    vendedor:
      "Vendedor",

    valor:
      "Valor",

    item_adicionado:
      "Item adicionado",
  });


function obterRotuloCampo(
  chave,
) {
  return (
    ROTULOS_DETALHES[
      chave
    ] ||
    String(
      chave ?? "",
    )
      .replace(
        /_/g,
        " ",
      )
      .replace(
        /^\w/,
        (
          letra,
        ) =>
          letra.toUpperCase(),
      )
  );
}


/* =========================================================
   VALORES
========================================================= */

function formatarValorGenerico(
  valor,
  chave = "",
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "-";
  }

  if (
    typeof valor ===
    "object"
  ) {
    return JSON.stringify(
      valor,
    );
  }

  const chaveNormalizada =
    normalizarTexto(
      chave,
    );

  if (
    chaveNormalizada.includes(
      "data",
    ) ||
    chaveNormalizada.includes(
      "previsao",
    )
  ) {
    const data =
      new Date(
        String(
          valor,
        ),
      );

    if (
      !Number.isNaN(
        data.getTime(),
      )
    ) {
      return data.toLocaleDateString(
        "pt-BR",
      );
    }
  }

  if (
    chaveNormalizada ===
      "valor" &&
    Number.isFinite(
      Number(
        valor,
      ),
    )
  ) {
    return Number(
      valor,
    ).toLocaleString(
      "pt-BR",
      {
        style:
          "currency",

        currency:
          "BRL",
      },
    );
  }

  return String(
    valor,
  );
}


/* =========================================================
   DETALHES DE UMA OCORRÊNCIA
========================================================= */

function extrairMudancas(
  ocorrencia,
) {
  const detalhes =
    ocorrencia
      ?.detalhes;

  if (
    !detalhes ||
    typeof detalhes !==
      "object"
  ) {
    return [];
  }

  return Object.entries(
    detalhes,
  ).map(
    (
      [
        chave,
        valor,
      ],
    ) => {
      if (
        chave ===
          "item_adicionado" &&
        valor &&
        typeof valor ===
          "object"
      ) {
        const descricao =
          [
            valor.codigo_produto,
            valor.produto,
            valor.quantidade !==
              undefined
              ? `${valor.quantidade} ${valor.unidade || ""}`.trim()
              : null,
          ]
            .filter(
              Boolean,
            )
            .join(
              " • ",
            );

        return {
          chave,

          campo:
            "Item adicionado",

          anterior:
            "-",

          novo:
            descricao ||
            "Novo item incluído",
        };
      }


      const anterior =
        valor &&
        typeof valor ===
          "object"
          ? valor.anterior
          : null;

      const novo =
        valor &&
        typeof valor ===
          "object"
          ? valor.novo
          : valor;


      return {
        chave,

        campo:
          obterRotuloCampo(
            chave,
          ),

        anterior:
          formatarValorGenerico(
            anterior,
            chave,
          ),

        novo:
          formatarValorGenerico(
            novo,
            chave,
          ),
      };
    },
  );
}


/* =========================================================
   COMPONENTE
========================================================= */

export default function PedidosAlteradosRelatorio() {
  const periodoPadrao =
    useMemo(
      () =>
        obterPeriodoPadrao(),
      [],
    );


  /* =======================================================
     FILTROS
  ======================================================= */

  const [
    dataInicial,
    setDataInicial,
  ] =
    useState(
      periodoPadrao
        .inicio,
    );


  const [
    dataFinal,
    setDataFinal,
  ] =
    useState(
      periodoPadrao
        .fim,
    );


  const [
    pesquisa,
    setPesquisa,
  ] =
    useState("");


  const [
    paginaAtual,
    setPaginaAtual,
  ] =
    useState(1);


  const [
    pedidosExpandidos,
    setPedidosExpandidos,
  ] =
    useState(
      () =>
        new Set(),
    );


  const [
    exportando,
    setExportando,
  ] =
    useState(
      null,
    );


  /* =======================================================
     CONSULTA

     NÃO existe botão Atualizar.

     A consulta acontece automaticamente:
     - ao abrir;
     - ao trocar "De";
     - ao trocar "Até";
     - ao voltar para a aba do navegador.
  ======================================================= */

  const {
    data:
      relatorio = [],

    isLoading,

    error,
  } =
    useQuery({
      queryKey: [
        "relatorio-pedidos-alterados",
        dataInicial,
        dataFinal,
      ],

      queryFn:
        async () => {
          const {
            data,
            error:
              erroRpc,
          } =
            await supabase.rpc(
              "listar_relatorio_pedidos_alterados",
              {
                p_data_inicial:
                  dataInicial ||
                  null,

                p_data_final:
                  dataFinal ||
                  null,

                p_limite:
                  2000,
              },
            );

          if (
            erroRpc
          ) {
            throw erroRpc;
          }

          return Array.isArray(
            data,
          )
            ? data
            : [];
        },

      staleTime:
        30 * 1000,

      refetchOnWindowFocus:
        true,

      retry:
        1,
    });


  /* =======================================================
     FILTRO LOCAL
  ======================================================= */

  const pedidosFiltrados =
    useMemo(
      () => {
        const termo =
          normalizarTexto(
            pesquisa,
          );

        if (
          !termo
        ) {
          return relatorio;
        }

        return relatorio.filter(
          (
            pedido,
          ) => {
            const campos =
              Array.isArray(
                pedido
                  ?.campos_alterados,
              )
                ? pedido
                    .campos_alterados
                    .join(
                      " ",
                    )
                : "";

            return [
              pedido
                ?.numero_pedido,

              pedido
                ?.cliente,

              pedido
                ?.vendedor,

              campos,

              pedido
                ?.ultimo_resumo,
            ].some(
              (
                valor,
              ) =>
                normalizarTexto(
                  valor,
                ).includes(
                  termo,
                ),
            );
          },
        );
      },
      [
        relatorio,
        pesquisa,
      ],
    );


  /* =======================================================
     INDICADORES
  ======================================================= */


  const totalAlteracoes =
    useMemo(
      () =>
        pedidosFiltrados.reduce(
          (
            total,
            pedido,
          ) =>
            total +
            Number(
              pedido
                ?.quantidade_alteracoes ??
              0,
            ),
          0,
        ),
      [
        pedidosFiltrados,
      ],
    );



  /* =======================================================
     PAGINAÇÃO
  ======================================================= */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        pedidosFiltrados
          .length /
          ITENS_POR_PAGINA,
      ),
    );


  const pedidosPagina =
    useMemo(
      () => {
        const pagina =
          Math.min(
            paginaAtual,
            totalPaginas,
          );

        const inicio =
          (
            pagina - 1
          ) *
          ITENS_POR_PAGINA;

        return pedidosFiltrados.slice(
          inicio,
          inicio +
            ITENS_POR_PAGINA,
        );
      },
      [
        pedidosFiltrados,
        paginaAtual,
        totalPaginas,
      ],
    );


  /* =======================================================
     EXPANDIR
  ======================================================= */

  function alternarPedido(
    codigo,
  ) {
    setPedidosExpandidos(
      (
        atual,
      ) => {
        const proximo =
          new Set(
            atual,
          );

        if (
          proximo.has(
            codigo,
          )
        ) {
          proximo.delete(
            codigo,
          );
        } else {
          proximo.add(
            codigo,
          );
        }

        return proximo;
      },
    );
  }


  /* =======================================================
     FILTROS
  ======================================================= */

  function alterarDataInicial(
    valor,
  ) {
    setDataInicial(
      valor,
    );

    setPaginaAtual(
      1,
    );
  }


  function alterarDataFinal(
    valor,
  ) {
    setDataFinal(
      valor,
    );

    setPaginaAtual(
      1,
    );
  }


  function alterarPesquisa(
    valor,
  ) {
    setPesquisa(
      valor,
    );

    setPaginaAtual(
      1,
    );
  }


  /* =======================================================
     EXPORTAÇÃO PDF
  ======================================================= */

  async function exportarPDF() {
    if (
      pedidosFiltrados
        .length ===
      0
    ) {
      return;
    }

    try {
      setExportando(
        "pdf",
      );

      const {
        exportarPdfPedidosAlterados,
      } =
        await import(
          "./ExportarPedidosAlteradosPDF.js"
        );

      await exportarPdfPedidosAlterados({
        pedidos:
          pedidosFiltrados,

        dataInicial,

        dataFinal,

        pesquisa,

        extrairMudancas,

        formatarDataHora,
      });

    } catch (erro) {
      console.error(
        "Erro ao exportar PDF:",
        erro,
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
     EXPORTAÇÃO EXCEL
  ======================================================= */

  async function exportarExcel() {
    if (
      pedidosFiltrados
        .length ===
      0
    ) {
      return;
    }

    try {
      setExportando(
        "excel",
      );

      const {
        exportarExcelPedidosAlterados,
      } =
        await import(
          "./ExportarPedidosAlteradosExcel.js"
        );

      await exportarExcelPedidosAlterados({
        pedidos:
          pedidosFiltrados,

        dataInicial,

        dataFinal,

        pesquisa,

        extrairMudancas,

        formatarDataHora,
      });

    } catch (erro) {
      console.error(
        "Erro ao exportar Excel:",
        erro,
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
          CABEÇALHO — MESMO PADRÃO DOS RELATÓRIOS
      ================================================= */}

      <div className="relatorio-selecionado-header">
        <div className="relatorio-selecionado-icone">
          <FiEdit3 />
        </div>

        <div>
          <span className="relatorio-selecionado-categoria">
            Pedidos
          </span>

          <h2>
            Pedidos Alterados
          </h2>

          <p>
            Acompanhe alterações realizadas no conteúdo dos pedidos,
            sem considerar o avanço normal de status ou etapa.
          </p>
        </div>
      </div>


      {/* =================================================
          AÇÕES — MESMO PADRÃO PDF / EXCEL
      ================================================= */}

      <div className="relatorio-acoes">
        <button
          type="button"
          className="btn-relatorio btn-relatorio-pdf"
          onClick={exportarPDF}
          disabled={
            pedidosFiltrados.length === 0 ||
            Boolean(exportando)
          }
        >
          {exportando === "pdf" ? (
            <FiRefreshCw className="pedidos-alterados-girando" />
          ) : (
            <FiFileText />
          )}

          <div>
            <strong>
              Baixar PDF
            </strong>

            <span>
              Histórico expandido por pedido
            </span>
          </div>
        </button>


        <button
          type="button"
          className="btn-relatorio btn-relatorio-csv"
          onClick={exportarExcel}
          disabled={
            pedidosFiltrados.length === 0 ||
            Boolean(exportando)
          }
        >
          {exportando === "excel" ? (
            <FiRefreshCw className="pedidos-alterados-girando" />
          ) : (
            <FiDownload />
          )}

          <div>
            <strong>
              Exportar Excel
            </strong>

            <span>
              Resumo + histórico expandido
            </span>
          </div>
        </button>
      </div>


      {/* =================================================
          FILTROS — MESMO CARD DOS RELATÓRIOS
      ================================================= */}

      <div className="relatorio-filtros-card">
        <div className="relatorio-filtros-header">
          <div>
            <h3>
              Parâmetros do relatório
            </h3>

            <p>
              O período é atualizado automaticamente ao alterar as datas.
            </p>
          </div>
        </div>


        <div className="pedidos-alterados-filtros">
          <label className="pedidos-alterados-campo">
            <span>
              De
            </span>

            <input
              type="date"
              value={dataInicial}
              max={dataFinal || undefined}
              onChange={(event) =>
                alterarDataInicial(
                  event.target.value,
                )
              }
            />
          </label>


          <label className="pedidos-alterados-campo">
            <span>
              Até
            </span>

            <input
              type="date"
              value={dataFinal}
              min={dataInicial || undefined}
              onChange={(event) =>
                alterarDataFinal(
                  event.target.value,
                )
              }
            />
          </label>


          <label className="pedidos-alterados-campo pedidos-alterados-pesquisa-campo">
            <span>
              Buscar
            </span>

            <div className="pedidos-alterados-pesquisa">
              <FiSearch />

              <input
                type="text"
                value={pesquisa}
                onChange={(event) =>
                  alterarPesquisa(
                    event.target.value,
                  )
                }
                placeholder="Pedido, cliente, vendedor ou campo alterado..."
              />
            </div>
          </label>
        </div>
      </div>


      {/* =================================================
          ERRO
      ================================================= */}

      {error && (
        <div className="relatorios-erro pedidos-alterados-erro">
          <FiAlertTriangle />

          <span>
            {error.message ||
              "Não foi possível carregar as alterações dos pedidos."}
          </span>
        </div>
      )}


      {/* =================================================
          CARREGANDO
      ================================================= */}

      {!error &&
        isLoading && (
          <div className="relatorios-loading pedidos-alterados-loading">
            <div className="relatorios-loading-card">
              <div className="relatorios-spinner" />

              <p>
                Carregando alterações dos pedidos...
              </p>
            </div>
          </div>
        )}


      {/* =================================================
          TABELA — MESMO PADRÃO DA VISUALIZAÇÃO
      ================================================= */}

      {!error &&
        !isLoading &&
        pedidosFiltrados.length > 0 && (
          <>
            <section className="relatorio-visualizacao pedidos-alterados-visualizacao">
              <div className="relatorio-visualizacao-header">
                <div>
                  <span className="relatorio-visualizacao-eyebrow">
                    Auditoria
                  </span>

                  <h3>
                    Alterações encontradas
                  </h3>
                </div>
              </div>


              <div className="relatorio-visualizacao-info">
                <div className="relatorio-visualizacao-info-item">
                  <span>
                    Período
                  </span>

                  <strong>
                    {dataInicial
                      ? dataInicial.split("-").reverse().join("/")
                      : "Sem data inicial"}
                    {" até "}
                    {dataFinal
                      ? dataFinal.split("-").reverse().join("/")
                      : "Sem data final"}
                  </strong>
                </div>

                <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
                  <span>
                    Pedidos
                  </span>

                  <strong>
                    {pedidosFiltrados.length}
                  </strong>
                </div>
              </div>


              <div className="relatorio-visualizacao-tabela-wrapper pedidos-alterados-tabela-wrapper">
                <table className="relatorio-visualizacao-tabela pedidos-alterados-tabela">
                  <thead>
                    <tr>
                      <th>
                        Pedido
                      </th>

                      <th>
                        Cliente
                      </th>

                      <th>
                        Vendedor
                      </th>

                      <th>
                        Última alteração
                      </th>

                      <th>
                        Nº alterações
                      </th>

                      <th>
                        O que foi alterado
                      </th>

                      <th>
                        Histórico
                      </th>
                    </tr>
                  </thead>


                  <tbody>
                    {pedidosPagina.map(
                      (pedido) => {
                        const codigo =
                          pedido.codigo_pedido_omie;

                        const expandido =
                          pedidosExpandidos.has(
                            codigo,
                          );

                        const campos =
                          Array.isArray(
                            pedido.campos_alterados,
                          )
                            ? pedido.campos_alterados
                            : [];

                        const ocorrencias =
                          Array.isArray(
                            pedido.detalhes_alteracoes,
                          )
                            ? pedido.detalhes_alteracoes
                            : [];


                        return (
                          <Fragment
                            key={`pedido-${codigo}`}
                          >
                            <tr>
                              <td>
                                <strong className="pedidos-alterados-numero">
                                  {pedido.numero_pedido ||
                                    codigo}
                                </strong>
                              </td>

                              <td>
                                {pedido.cliente ||
                                  "-"}
                              </td>

                              <td>
                                {pedido.vendedor ||
                                  "-"}
                              </td>

                              <td>
                                {formatarDataHora(
                                  pedido.ultima_alteracao,
                                )}
                              </td>

                              <td>
                                <span className="pedidos-alterados-contador">
                                  {pedido.quantidade_alteracoes}
                                </span>
                              </td>

                              <td>
                                <div className="pedidos-alterados-campos">
                                  {campos.map(
                                    (campo) => (
                                      <span
                                        key={campo}
                                      >
                                        {campo}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className="pedidos-alterados-ver"
                                  onClick={() =>
                                    alternarPedido(
                                      codigo,
                                    )
                                  }
                                  aria-expanded={expandido}
                                >
                                  {expandido ? (
                                    <FiChevronUp />
                                  ) : (
                                    <FiChevronDown />
                                  )}

                                  {expandido
                                    ? "Fechar"
                                    : "Ver"}
                                </button>
                              </td>
                            </tr>


                            {expandido && (
                              <tr className="pedidos-alterados-historico-linha">
                                <td colSpan={7}>
                                  <div className="pedidos-alterados-historico">
                                    <div className="pedidos-alterados-historico-titulo">
                                      <FiEdit3 />

                                      <div>
                                        <strong>
                                          Histórico do pedido{" "}
                                          {pedido.numero_pedido ||
                                            codigo}
                                        </strong>

                                        <span>
                                          {ocorrencias.length} ocorrência
                                          {ocorrencias.length !== 1
                                            ? "s"
                                            : ""}
                                        </span>
                                      </div>
                                    </div>


                                    <div className="pedidos-alterados-ocorrencias">
                                      {ocorrencias.map(
                                        (
                                          ocorrencia,
                                          indice,
                                        ) => {
                                          const mudancas =
                                            extrairMudancas(
                                              ocorrencia,
                                            );

                                          return (
                                            <article
                                              key={
                                                ocorrencia.id ||
                                                `${codigo}-${indice}`
                                              }
                                              className="pedidos-alterados-ocorrencia"
                                            >
                                              <div className="pedidos-alterados-ocorrencia-topo">
                                                <strong>
                                                  Alteração #
                                                  {ocorrencias.length -
                                                    indice}
                                                </strong>

                                                <span>
                                                  {formatarDataHora(
                                                    ocorrencia.alterado_em,
                                                  )}
                                                </span>
                                              </div>


                                              {mudancas.length > 0 ? (
                                                <div className="pedidos-alterados-mudancas">
                                                  {mudancas.map(
                                                    (mudanca) => (
                                                      <div
                                                        key={`${ocorrencia.id}-${mudanca.chave}`}
                                                        className="pedidos-alterados-mudanca"
                                                      >
                                                        <strong>
                                                          {mudanca.campo}
                                                        </strong>

                                                        <div className="pedidos-alterados-antes-depois">
                                                          <span>
                                                            <small>
                                                              Antes
                                                            </small>

                                                            <b>
                                                              {mudanca.anterior}
                                                            </b>
                                                          </span>

                                                          <span className="pedidos-alterados-seta">
                                                            →
                                                          </span>

                                                          <span>
                                                            <small>
                                                              Depois
                                                            </small>

                                                            <b>
                                                              {mudanca.novo}
                                                            </b>
                                                          </span>
                                                        </div>
                                                      </div>
                                                    ),
                                                  )}
                                                </div>
                                              ) : (
                                                <p className="pedidos-alterados-sem-detalhe">
                                                  {ocorrencia.resumo ||
                                                    "Alteração registrada sem detalhamento disponível."}
                                                </p>
                                              )}
                                            </article>
                                          );
                                        },
                                      )}
                                    </div>
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


              <div className="relatorio-visualizacao-footer">
                <span>
                  {pedidosFiltrados.length} pedido(s) alterado(s)
                </span>

                <span>
                  {totalAlteracoes} alteração(ões) no período
                </span>
              </div>
            </section>


            {totalPaginas > 1 && (
              <div className="pedidos-alterados-paginacao">
                <button
                  type="button"
                  disabled={paginaAtual <= 1}
                  onClick={() =>
                    setPaginaAtual(
                      (pagina) =>
                        Math.max(
                          1,
                          pagina - 1,
                        ),
                    )
                  }
                >
                  Anterior
                </button>

                <span>
                  Página{" "}
                  <strong>
                    {Math.min(
                      paginaAtual,
                      totalPaginas,
                    )}
                  </strong>{" "}
                  de{" "}
                  <strong>
                    {totalPaginas}
                  </strong>
                </span>

                <button
                  type="button"
                  disabled={
                    paginaAtual >=
                    totalPaginas
                  }
                  onClick={() =>
                    setPaginaAtual(
                      (pagina) =>
                        Math.min(
                          totalPaginas,
                          pagina + 1,
                        ),
                    )
                  }
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}


      {/* =================================================
          VAZIO
      ================================================= */}

      {!error &&
        !isLoading &&
        pedidosFiltrados.length === 0 && (
          <div className="relatorio-visualizacao-vazia pedidos-alterados-vazio">
            <FiEdit3 />

            <strong>
              Nenhuma alteração encontrada
            </strong>

            <span>
              Não existem pedidos com alterações reais no período selecionado.
            </span>
          </div>
        )}
    </>
  );

}
