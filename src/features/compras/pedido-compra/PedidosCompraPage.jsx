import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ShoppingBag,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";

import Paginacao from "@/components/paginacao/Paginacao";

import {
  PEDIDOS_COMPRA_POR_PAGINA,
  SITUACOES_RECEBIMENTO,
  TIPOS_DOCUMENTO,
} from "./constants/pedidosCompra.constants";

import PedidosCompraAtualizacao from "./components/PedidosCompraAtualizacao";

import PedidosCompraCardModal from "./components/PedidosCompraCardModal";

import PedidosCompraFiltros from "./components/PedidosCompraFiltros";

import PedidosCompraResumo from "./components/PedidosCompraResumo";

import PedidosCompraTabela from "./components/PedidosCompraTabela";

import {
  usePedidosCompra,
} from "./hooks/usePedidosCompra";

import {
  converterDataLocal,
  normalizarTexto,
  obterHojeLocal,
} from "./utils/pedidosCompra.utils";

import "./PedidosCompraPage.css";

const FILTROS_INICIAIS =
  Object.freeze({
    pesquisa: "",

    tipoDocumento:
      TIPOS_DOCUMENTO.TODOS,

    fornecedor:
      "todos",

    comprador:
      "todos",

    recebimento:
      SITUACOES_RECEBIMENTO.TODOS,

    dataInicio: "",

    dataFim: "",
  });

const CARDS_RESUMO =
  Object.freeze({
    ABERTOS:
      "abertos",

    ATRASADOS:
      "atrasados",

    VALOR_ABERTO:
      "valor-aberto",

    PROXIMOS_7_DIAS:
      "proximos-7-dias",

    HOJE:
      "hoje",

    REQUISICOES_TOTAL:
      "requisicoes-total",

    REQUISICOES_VALOR:
      "requisicoes-valor",

    REQUISICOES_ITENS:
      "requisicoes-itens",

    REQUISICOES_PROXIMOS_7_DIAS:
      "requisicoes-proximos-7-dias",

    REQUISICOES_HOJE:
      "requisicoes-hoje",
  });

function ehPedido(
  documento,
) {
  return (
    documento
      ?.tipo_documento ===
    TIPOS_DOCUMENTO.PEDIDO
  );
}

function ehRequisicao(
  documento,
) {
  return (
    documento
      ?.tipo_documento ===
    TIPOS_DOCUMENTO.REQUISICAO
  );
}

function estaEntreHojeE7Dias(
  documento,
  hoje,
  limite,
) {
  if (
    ehPedido(
      documento,
    ) &&
    Number(
      documento
        ?.saldo ??
        0,
    ) <= 0
  ) {
    return false;
  }

  const previsao =
    converterDataLocal(
      documento
        ?.data_previsao,
    );

  return Boolean(
    previsao &&
      previsao >= hoje &&
      previsao <= limite,
  );
}

function estaPrevistoParaHoje(
  documento,
  hoje,
) {
  if (
    ehPedido(
      documento,
    ) &&
    Number(
      documento
        ?.saldo ??
        0,
    ) <= 0
  ) {
    return false;
  }

  const previsao =
    converterDataLocal(
      documento
        ?.data_previsao,
    );

  return Boolean(
    previsao &&
      previsao.getTime() ===
        hoje.getTime(),
  );
}

function documentoAtendeCard(
  documento,
  cardId,
  hoje,
  limite,
) {
  if (
    ehPedido(
      documento,
    )
  ) {
    switch (
      cardId
    ) {
      case CARDS_RESUMO.ABERTOS:

      case CARDS_RESUMO.VALOR_ABERTO:
        return (
          Number(
            documento
              ?.saldo ??
              0,
          ) > 0
        );

      case CARDS_RESUMO.ATRASADOS:
        return (
          documento
            ?.situacao_recebimento ===
          SITUACOES_RECEBIMENTO.EM_ATRASO
        );

      case CARDS_RESUMO.PROXIMOS_7_DIAS:
        return estaEntreHojeE7Dias(
          documento,
          hoje,
          limite,
        );

      case CARDS_RESUMO.HOJE:
        return estaPrevistoParaHoje(
          documento,
          hoje,
        );

      default:
        return false;
    }
  }

  if (
    !ehRequisicao(
      documento,
    )
  ) {
    return false;
  }

  switch (
    cardId
  ) {
    case CARDS_RESUMO.REQUISICOES_TOTAL:

    case CARDS_RESUMO.REQUISICOES_VALOR:
      return true;

    case CARDS_RESUMO.REQUISICOES_ITENS:
      return (
        Array.isArray(
          documento
            ?.itens,
        ) &&
        documento
          .itens
          .length >
          0
      );

    case CARDS_RESUMO.REQUISICOES_PROXIMOS_7_DIAS:
      return estaEntreHojeE7Dias(
        documento,
        hoje,
        limite,
      );

    case CARDS_RESUMO.REQUISICOES_HOJE:
      return estaPrevistoParaHoje(
        documento,
        hoje,
      );

    default:
      return false;
  }
}

function documentoEstaNoPeriodo(
  documento,
  dataInicio,
  dataFim,
) {
  if (
    !dataInicio &&
    !dataFim
  ) {
    return true;
  }

  const dataDocumento =
    converterDataLocal(
      documento
        ?.data_inclusao ||
        documento
          ?.data_previsao,
    );

  if (
    !dataDocumento
  ) {
    return false;
  }

  const inicio =
    dataInicio
      ? converterDataLocal(
          dataInicio,
        )
      : null;

  const fim =
    dataFim
      ? converterDataLocal(
          dataFim,
        )
      : null;

  if (
    inicio &&
    dataDocumento <
      inicio
  ) {
    return false;
  }

  if (
    fim &&
    dataDocumento >
      fim
  ) {
    return false;
  }

  return true;
}

export default function PedidosCompraPage() {
  const {
    pedidos,
    atualizadoEm,
    estadoSincronizacao,
    error,
    isLoading,
    isFetching,
  } =
    usePedidosCompra();

  const [
    filtros,
    setFiltros,
  ] =
    useState(
      FILTROS_INICIAIS,
    );

  const [
    cardModalAberto,
    setCardModalAberto,
  ] =
    useState(null);

  const [
    paginaAtual,
    setPaginaAtual,
  ] =
    useState(1);

  const somenteRequisicoes =
    filtros
      .tipoDocumento ===
    TIPOS_DOCUMENTO.REQUISICAO;

  const fornecedores =
    useMemo(
      () =>
        [
          ...new Set(
            pedidos
              .filter(
                ehPedido,
              )
              .map(
                (
                  pedido,
                ) =>
                  pedido
                    .fornecedor_nome,
              )
              .filter(
                (
                  nome,
                ) =>
                  nome &&
                  nome !==
                    "-",
              ),
          ),
        ].sort(
          (
            a,
            b,
          ) =>
            a.localeCompare(
              b,
              "pt-BR",
            ),
        ),
      [
        pedidos,
      ],
    );

  const compradores =
    useMemo(
      () =>
        [
          ...new Set(
            pedidos
              .filter(
                ehPedido,
              )
              .map(
                (
                  pedido,
                ) =>
                  pedido
                    .comprador_nome,
              )
              .filter(
                (
                  nome,
                ) =>
                  nome &&
                  nome !==
                    "-",
              ),
          ),
        ].sort(
          (
            a,
            b,
          ) =>
            a.localeCompare(
              b,
              "pt-BR",
              {
                numeric:
                  true,
              },
            ),
        ),
      [
        pedidos,
      ],
    );

  const documentosFiltrados =
    useMemo(
      () => {
        const termo =
          normalizarTexto(
            filtros.pesquisa,
          );

        return pedidos.filter(
          (
            pedido,
          ) => {
            const pesquisa =
              !termo ||
              [
                pedido
                  .numero_requisicao,

                pedido
                  .numero_pedido,

                pedido
                  .numero_documento,

                pedido
                  .fornecedor_nome,

                pedido
                  .comprador_nome,

                pedido
                  .categoria_nome,

                pedido
                  .categoria,

                pedido
                  .observacoes,

                pedido
                  .observacoes_internas,

                ...pedido.itens.flatMap(
                  (
                    item,
                  ) => [
                    item
                      .codigo_comercial,

                    item
                      .descricao,

                    item
                      .observacao,
                  ],
                ),
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

            const tipoDocumento =
              filtros
                .tipoDocumento ===
                TIPOS_DOCUMENTO.TODOS ||
              pedido
                .tipo_documento ===
                filtros
                  .tipoDocumento;

            const fornecedor =
              somenteRequisicoes ||
              filtros
                .fornecedor ===
                "todos" ||
              pedido
                .fornecedor_nome ===
                filtros
                  .fornecedor;

            const comprador =
              somenteRequisicoes ||
              filtros
                .comprador ===
                "todos" ||
              pedido
                .comprador_nome ===
                filtros
                  .comprador;

            const recebimento =
              somenteRequisicoes ||
              filtros
                .recebimento ===
                SITUACOES_RECEBIMENTO.TODOS ||
              pedido
                .situacao_recebimento ===
                filtros
                  .recebimento;

            const periodo =
              documentoEstaNoPeriodo(
                pedido,
                filtros
                  .dataInicio,
                filtros
                  .dataFim,
              );

            return (
              pesquisa &&
              tipoDocumento &&
              fornecedor &&
              comprador &&
              recebimento &&
              periodo
            );
          },
        );
      },
      [
        pedidos,
        filtros,
        somenteRequisicoes,
      ],
    );

  const indicadores =
    useMemo(
      () => {
        const hoje =
          obterHojeLocal();

        const limite =
          new Date(
            hoje,
          );

        limite.setDate(
          limite.getDate() +
            7,
        );

        return documentosFiltrados.reduce(
          (
            acc,
            pedido,
          ) => {
            if (
              !ehPedido(
                pedido,
              )
            ) {
              return acc;
            }

            const saldoAberto =
              Number(
                pedido
                  .saldo ??
                  0,
              ) >
              0;

            if (
              saldoAberto
            ) {
              acc.abertos +=
                1;

              acc.valorEmAberto +=
                Number(
                  pedido
                    .valorEmAberto ??
                    0,
                );
            }

            if (
              pedido
                .situacao_recebimento ===
              SITUACOES_RECEBIMENTO.EM_ATRASO
            ) {
              acc.atrasados +=
                1;
            }

            if (
              estaEntreHojeE7Dias(
                pedido,
                hoje,
                limite,
              )
            ) {
              acc.proximos7Dias +=
                1;
            }

            if (
              estaPrevistoParaHoje(
                pedido,
                hoje,
              )
            ) {
              acc.hoje +=
                1;
            }

            return acc;
          },
          {
            abertos: 0,
            atrasados: 0,
            valorEmAberto: 0,
            proximos7Dias: 0,
            hoje: 0,
          },
        );
      },
      [
        documentosFiltrados,
      ],
    );

  const indicadoresRequisicoes =
    useMemo(
      () => {
        const hoje =
          obterHojeLocal();

        const limite =
          new Date(
            hoje,
          );

        limite.setDate(
          limite.getDate() +
            7,
        );

        return documentosFiltrados.reduce(
          (
            acc,
            requisicao,
          ) => {
            if (
              !ehRequisicao(
                requisicao,
              )
            ) {
              return acc;
            }

            acc.total += 1;

            acc.valorTotal +=
              Number(
                requisicao
                  .valorTotal ??
                  0,
              );

            acc.itens +=
              Number(
                requisicao
                  .quantidade_itens ??
                  requisicao
                    .itens
                    ?.length ??
                  0,
              );

            if (
              estaEntreHojeE7Dias(
                requisicao,
                hoje,
                limite,
              )
            ) {
              acc.proximos7Dias +=
                1;
            }

            if (
              estaPrevistoParaHoje(
                requisicao,
                hoje,
              )
            ) {
              acc.hoje +=
                1;
            }

            return acc;
          },
          {
            total: 0,
            valorTotal: 0,
            itens: 0,
            proximos7Dias: 0,
            hoje: 0,
          },
        );
      },
      [
        documentosFiltrados,
      ],
    );

  const pedidosDoModal =
    useMemo(
      () => {
        if (
          !cardModalAberto
        ) {
          return [];
        }

        const hoje =
          obterHojeLocal();

        const limite =
          new Date(
            hoje,
          );

        limite.setDate(
          limite.getDate() +
            7,
        );

        return documentosFiltrados.filter(
          (
            documento,
          ) =>
            documentoAtendeCard(
              documento,
              cardModalAberto,
              hoje,
              limite,
            ),
        );
      },
      [
        documentosFiltrados,
        cardModalAberto,
      ],
    );

  const modalEhRequisicao =
    [
      CARDS_RESUMO.REQUISICOES_TOTAL,
      CARDS_RESUMO.REQUISICOES_VALOR,
      CARDS_RESUMO.REQUISICOES_ITENS,
      CARDS_RESUMO.REQUISICOES_PROXIMOS_7_DIAS,
      CARDS_RESUMO.REQUISICOES_HOJE,
    ].includes(
      cardModalAberto,
    );

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        documentosFiltrados
          .length /
          PEDIDOS_COMPRA_POR_PAGINA,
      ),
    );

  useEffect(
    () => {
      if (
        paginaAtual >
        totalPaginas
      ) {
        setPaginaAtual(
          totalPaginas,
        );
      }
    },
    [
      paginaAtual,
      totalPaginas,
    ],
  );

  const pedidosPagina =
    useMemo(
      () => {
        const inicio =
          (
            paginaAtual -
            1
          ) *
          PEDIDOS_COMPRA_POR_PAGINA;

        const documentosOrdenados =
          [
            ...documentosFiltrados,
          ].sort(
            (
              a,
              b,
            ) => {
              const atrasadoA =
                a?.situacao_recebimento ===
                SITUACOES_RECEBIMENTO.EM_ATRASO;

              const atrasadoB =
                b?.situacao_recebimento ===
                SITUACOES_RECEBIMENTO.EM_ATRASO;

              if (
                atrasadoA &&
                !atrasadoB
              ) {
                return -1;
              }

              if (
                !atrasadoA &&
                atrasadoB
              ) {
                return 1;
              }

              const previsaoA =
                converterDataLocal(
                  a?.data_previsao,
                );

              const previsaoB =
                converterDataLocal(
                  b?.data_previsao,
                );

              if (
                !previsaoA &&
                !previsaoB
              ) {
                return 0;
              }

              if (
                !previsaoA
              ) {
                return 1;
              }

              if (
                !previsaoB
              ) {
                return -1;
              }

              return (
                previsaoA.getTime() -
                previsaoB.getTime()
              );
            },
          );

        return documentosOrdenados.slice(
          inicio,
          inicio +
            PEDIDOS_COMPRA_POR_PAGINA,
        );
      },
      [
        documentosFiltrados,
        paginaAtual,
      ],
    );

  const possuiFiltro =
    Boolean(
      filtros
        .pesquisa
        .trim(),
    ) ||
    filtros
      .tipoDocumento !==
      TIPOS_DOCUMENTO.TODOS ||
    (
      !somenteRequisicoes &&
      filtros
        .fornecedor !==
        "todos"
    ) ||
    (
      !somenteRequisicoes &&
      filtros
        .comprador !==
        "todos"
    ) ||
    (
      !somenteRequisicoes &&
      filtros
        .recebimento !==
        SITUACOES_RECEBIMENTO.TODOS
    ) ||
    Boolean(
      filtros
        .dataInicio,
    ) ||
    Boolean(
      filtros
        .dataFim,
    );

  const statusSincronizacao =
    String(
      estadoSincronizacao
        ?.status ??
        "",
    )
      .trim()
      .toLowerCase();

  const sincronizacaoComErro =
    [
      "erro",
      "error",
      "falha",
      "failed",
    ].includes(
      statusSincronizacao,
    );

  const mensagemErroOmie =
    error
      ?.message ||
    (
      sincronizacaoComErro
        ? estadoSincronizacao
            ?.mensagem
        : ""
    );

  const tituloLista =
    filtros
      .tipoDocumento ===
    TIPOS_DOCUMENTO.REQUISICAO
      ? "Requisições"
      : filtros
            .tipoDocumento ===
          TIPOS_DOCUMENTO.PEDIDO
        ? "Pedidos de compra"
        : "Pedidos e requisições";

  function alterarFiltro(
    chave,
    valor,
  ) {
    setFiltros(
      (
        atual,
      ) => {
        if (
          chave ===
            "tipoDocumento" &&
          valor ===
            TIPOS_DOCUMENTO.REQUISICAO
        ) {
          return {
            ...atual,

            tipoDocumento:
              valor,

            fornecedor:
              "todos",

            comprador:
              "todos",

            recebimento:
              SITUACOES_RECEBIMENTO.TODOS,
          };
        }

        return {
          ...atual,

          [chave]:
            valor,
        };
      },
    );

    setCardModalAberto(
      null,
    );

    setPaginaAtual(
      1,
    );
  }

  function limparFiltros() {
    setFiltros(
      FILTROS_INICIAIS,
    );

    setCardModalAberto(
      null,
    );

    setPaginaAtual(
      1,
    );
  }

  function abrirModalCard(
    cardId,
  ) {
    setCardModalAberto(
      cardId,
    );
  }

  function fecharModalCard() {
    setCardModalAberto(
      null,
    );
  }

  return (
    <main className="compras-page">
      <div className="compras-container">
        <PageHeader
          eyebrow="Compras"
          title="Pedidos e Requisições de Compra"
          description="Acompanhamento de requisições, pedidos de compra, previsões e recebimentos."
          icon={
            ShoppingBag
          }
          className="compras-header"
          actions={
            <PedidosCompraAtualizacao
              atualizadoEm={
                atualizadoEm
              }
              isFetching={
                isFetching
              }
            />
          }
        />

        <PedidosCompraResumo
          loading={
            isLoading
          }
          indicadores={
            indicadores
          }
          indicadoresRequisicoes={
            indicadoresRequisicoes
          }
          tipoDocumento={
            filtros
              .tipoDocumento
          }
          cardAtivo={
            cardModalAberto
          }
          onCardClick={
            abrirModalCard
          }
        />

        <PedidosCompraFiltros
          filtros={
            filtros
          }
          fornecedores={
            fornecedores
          }
          compradores={
            compradores
          }
          possuiFiltro={
            possuiFiltro
          }
          onChange={
            alterarFiltro
          }
          onLimpar={
            limparFiltros
          }
        />

        <section className="compras-content">
          <div className="compras-content-header">
            <div>
              <h2>
                {
                  tituloLista
                }
              </h2>

              <p>
                {isLoading
                  ? "Carregando documentos..."
                  : filtros.tipoDocumento ===
                      TIPOS_DOCUMENTO.TODOS
                    ? `${
                        documentosFiltrados.filter(
                          ehPedido,
                        ).length
                      } pedidos • ${
                        documentosFiltrados.filter(
                          ehRequisicao,
                        ).length
                      } requisições`
                    : filtros.tipoDocumento ===
                        TIPOS_DOCUMENTO.PEDIDO
                      ? `${
                          documentosFiltrados.length
                        } pedido${
                          documentosFiltrados.length !==
                          1
                            ? "s"
                            : ""
                        } encontrado${
                          documentosFiltrados.length !==
                          1
                            ? "s"
                            : ""
                        }`
                      : `${
                          documentosFiltrados.length
                        } requisição${
                          documentosFiltrados.length !==
                          1
                            ? "ões"
                            : ""
                        } encontrada${
                          documentosFiltrados.length !==
                          1
                            ? "s"
                            : ""
                        }`}

                {isFetching &&
                !isLoading
                  ? " • atualizando"
                  : ""}
              </p>
            </div>

            <span
              className={`compras-fonte${
                mensagemErroOmie
                  ? " compras-fonte--erro"
                  : ""
              }`}
            >
              Dados do Omie
            </span>
          </div>

          {mensagemErroOmie && (
            <div className="compras-omie-erro">
              <AlertTriangle
                size={
                  15
                }
              />

              <div>
                <strong>
                  Erro na atualização do Omie
                </strong>

                <span>
                  {
                    mensagemErroOmie
                  }
                </span>
              </div>
            </div>
          )}

          {!error &&
            isLoading && (
              <div className="compras-estado">
                <strong>
                  Carregando compras...
                </strong>

                <span>
                  Lendo requisições e pedidos sincronizados do Omie.
                </span>
              </div>
            )}

          {!error &&
            !isLoading &&
            pedidosPagina
              .length >
              0 && (
              <>
                <PedidosCompraTabela
                  pedidos={
                    pedidosPagina
                  }
                  tipoDocumento={
                    filtros
                      .tipoDocumento
                  }
                />

                <Paginacao
                  paginaAtual={
                    paginaAtual
                  }
                  totalItens={
                    documentosFiltrados
                      .length
                  }
                  itensPorPagina={
                    PEDIDOS_COMPRA_POR_PAGINA
                  }
                  onChangePagina={
                    setPaginaAtual
                  }
                />
              </>
            )}

          {!error &&
            !isLoading &&
            pedidosPagina
              .length ===
              0 && (
              <div className="compras-estado">
                <strong>
                  Nenhum documento encontrado.
                </strong>

                <span>
                  Ajuste os filtros para visualizar outros documentos.
                </span>

                {possuiFiltro && (
                  <button
                    type="button"
                    onClick={
                      limparFiltros
                    }
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
        </section>
      </div>

      <PedidosCompraCardModal
        aberto={
          Boolean(
            cardModalAberto,
          )
        }
        cardId={
          cardModalAberto
        }
        indicadores={
          modalEhRequisicao
            ? indicadoresRequisicoes
            : indicadores
        }
        pedidos={
          pedidosDoModal
        }
        tipoDocumento={
          modalEhRequisicao
            ? TIPOS_DOCUMENTO.REQUISICAO
            : TIPOS_DOCUMENTO.PEDIDO
        }
        onClose={
          fecharModalCard
        }
      />
    </main>
  );
}