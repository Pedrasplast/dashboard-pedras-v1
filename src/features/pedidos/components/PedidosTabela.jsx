import { AlertTriangle } from "lucide-react";

import {
  calcularDiasAtraso,
  formatarData,
} from "../utils/date.utils";

import {
  formatarNumero,
  normalizarTexto,
} from "../utils/format.utils";

import {
  formatarTextoAtraso,
  obterCodigoPedidoOmie,
  pedidoEhCancelado,
  pedidoEstaAtrasado,
} from "../utils/pedidos.utils";

import "./PedidosTabela.css";


export default function PedidosTabela({
  pedidosAgrupados,
  notificacoesPorPedido,
  onVisualizarPedido,
}) {
  /* =======================================================
     PREPARAÇÃO DOS GRUPOS
  ======================================================= */

  const gruposPreparados = (pedidosAgrupados ?? []).map(
    (grupo) => {
      const primeiroPedido = grupo.itens[0];

      const codigoPedidoOmie =
        obterCodigoPedidoOmie(primeiroPedido);

      const notificacaoPedido = codigoPedidoOmie
        ? notificacoesPorPedido?.get?.(codigoPedidoOmie)
        : null;

      const pedidoPendente =
        Boolean(notificacaoPedido);

      const tipoNotificacao =
        normalizarTexto(
          notificacaoPedido?.tipo,
        );

      const pedidoNovo =
        pedidoPendente &&
        tipoNotificacao !== "alterado";

      const pedidoAlterado =
        pedidoPendente &&
        tipoNotificacao === "alterado";

      const cancelado =
        pedidoEhCancelado(
          primeiroPedido,
        );

      const diasAtraso =
        calcularDiasAtraso(
          primeiroPedido.previsao,
        );

      const atrasado =
        !cancelado &&
        pedidoEstaAtrasado(
          primeiroPedido,
        );

      return {
        ...grupo,
        primeiroPedido,
        pedidoPendente,
        pedidoNovo,
        pedidoAlterado,
        cancelado,
        atrasado,
        diasAtraso,
      };
    },
  );


  /* =======================================================
     VISUALIZAR PEDIDO
  ======================================================= */

  function visualizarPedido(pedido) {
    if (!pedido) {
      return;
    }

    onVisualizarPedido?.(pedido);
  }


  /* =======================================================
     ACESSIBILIDADE MOBILE
  ======================================================= */

  function tratarTeclaCard(
    evento,
    pedido,
    pedidoPendente,
  ) {
    if (!pedidoPendente) {
      return;
    }

    if (
      evento.key === "Enter" ||
      evento.key === " "
    ) {
      evento.preventDefault();

      visualizarPedido(pedido);
    }
  }


  return (
    <>
      {/* ===================================================
          DESKTOP / TABLET
      =================================================== */}

      <div className="pedidos-tabela-desktop">
        <div className="pedidos-tabela-wrapper">
          <table className="pedidos-tabela">
            <thead>
              <tr>
                <th>Pedido</th>

                <th>Cliente</th>

                <th>Data Inclusão</th>

                <th className="pedidos-col-previsao">
                  Previsão faturamento
                </th>

                <th>Código</th>

                <th className="pedidos-col-produto">
                  Produto
                </th>

                <th className="pedidos-col-numero">
                  Quantidade
                </th>

                <th>Un.</th>

                <th>Vendedor</th>
              </tr>
            </thead>

            <tbody>
              {gruposPreparados.flatMap(
                (grupo) => {
                  const quantidadeItens =
                    grupo.itens.length;

                  const {
                    pedidoPendente,
                    pedidoNovo,
                    pedidoAlterado,
                  } = grupo;

                  return grupo.itens.map(
                    (
                      pedido,
                      indiceItem,
                    ) => {
                      const primeiroItem =
                        indiceItem === 0;

                      const cancelado =
                        pedidoEhCancelado(
                          pedido,
                        );

                      const diasAtraso =
                        calcularDiasAtraso(
                          pedido.previsao,
                        );

                      const atrasado =
                        !cancelado &&
                        pedidoEstaAtrasado(
                          pedido,
                        );

                      const classesLinha = [
                        primeiroItem
                          ? "pedidos-inicio-grupo"
                          : "pedidos-item-continuacao",

                        atrasado
                          ? "pedido-linha-atrasada"
                          : "",

                        cancelado
                          ? "pedido-linha-cancelada"
                          : "",

                        pedidoNovo
                          ? "pedido-linha-nova"
                          : "",

                        pedidoAlterado
                          ? "pedido-linha-alterada"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <tr
                          key={pedido.id}
                          className={classesLinha}
                          onClick={
                            pedidoPendente
                              ? () =>
                                  visualizarPedido(
                                    pedido,
                                  )
                              : undefined
                          }
                          title={
                            pedidoNovo
                              ? "Novo pedido. Clique para marcar como visualizado."
                              : pedidoAlterado
                                ? "Pedido alterado. Clique para marcar como visualizado."
                                : undefined
                          }
                        >
                          {/* PEDIDO */}

                          {primeiroItem && (
                            <td
                              rowSpan={
                                quantidadeItens
                              }
                              className={`pedidos-celula-agrupada pedidos-celula-pedido${
                                atrasado
                                  ? " pedido-celula-atrasada"
                                  : ""
                              }${
                                cancelado
                                  ? " pedido-celula-cancelada"
                                  : ""
                              }${
                                pedidoNovo
                                  ? " pedido-celula-nova"
                                  : ""
                              }${
                                pedidoAlterado
                                  ? " pedido-celula-alterada"
                                  : ""
                              }`}
                            >
                              <div className="pedidos-pedido-agrupado">
                                <strong className="pedidos-numero">
                                  {pedido.pedidoExibicao ??
                                    pedido.pedido}
                                </strong>

                                {pedidoNovo && (
                                  <span className="pedido-novo-badge">
                                    NOVO
                                  </span>
                                )}

                                {pedidoAlterado && (
                                  <span className="pedido-alterado-badge">
                                    ALTERADO
                                  </span>
                                )}

                                {quantidadeItens >
                                  1 && (
                                  <span className="pedidos-itens-badge">
                                    {
                                      quantidadeItens
                                    }{" "}
                                    itens
                                  </span>
                                )}
                              </div>
                            </td>
                          )}


                          {/* CLIENTE */}

                          {primeiroItem && (
                            <td
                              rowSpan={
                                quantidadeItens
                              }
                              className={`pedidos-celula-agrupada${
                                atrasado
                                  ? " pedido-celula-atrasada"
                                  : ""
                              }${
                                cancelado
                                  ? " pedido-celula-cancelada"
                                  : ""
                              }`}
                            >
                              <div className="pedidos-cliente">
                                {
                                  pedido.cliente
                                }
                              </div>
                            </td>
                          )}


                          {/* DATA */}

                          {primeiroItem && (
                            <td
                              rowSpan={
                                quantidadeItens
                              }
                              className={`pedidos-celula-agrupada${
                                atrasado
                                  ? " pedido-celula-atrasada"
                                  : ""
                              }${
                                cancelado
                                  ? " pedido-celula-cancelada"
                                  : ""
                              }`}
                            >
                              {formatarData(
                                pedido.data,
                              )}
                            </td>
                          )}


                          {/* PREVISÃO */}

                          {primeiroItem && (
                            <td
                              rowSpan={
                                quantidadeItens
                              }
                              className={`pedidos-celula-agrupada pedidos-col-previsao${
                                atrasado
                                  ? " pedido-celula-atrasada"
                                  : ""
                              }${
                                cancelado
                                  ? " pedido-celula-cancelada"
                                  : ""
                              }`}
                            >
                              <div className="pedidos-previsao-wrapper">
                                <span className="pedidos-previsao-data">
                                  {formatarData(
                                    pedido.previsao,
                                  )}
                                </span>

                                {atrasado && (
                                  <span className="pedidos-tag-atraso">
                                    <AlertTriangle
                                      size={11}
                                    />

                                    {formatarTextoAtraso(
                                      diasAtraso,
                                    )}
                                  </span>
                                )}
                              </div>
                            </td>
                          )}


                          {/* CÓDIGO */}

                          <td>
                            <span className="pedidos-codigo-produto">
                              {pedido.codigoProduto ||
                                "-"}
                            </span>
                          </td>


                          {/* PRODUTO */}

                          <td className="pedidos-col-produto">
                            <div className="pedidos-produto">
                              {!primeiroItem && (
                                <span className="pedidos-item-indicador">
                                  ↳
                                </span>
                              )}

                              <span>
                                {
                                  pedido.produto
                                }
                              </span>
                            </div>
                          </td>


                          {/* QUANTIDADE */}

                          <td className="pedidos-col-numero">
                            {formatarNumero(
                              pedido.quantidade,
                            )}
                          </td>


                          {/* UNIDADE */}

                          <td>
                            {pedido.unidade ||
                              "-"}
                          </td>


                          {/* VENDEDOR */}

                          {primeiroItem && (
                            <td
                              rowSpan={
                                quantidadeItens
                              }
                              className={`pedidos-celula-agrupada${
                                atrasado
                                  ? " pedido-celula-atrasada"
                                  : ""
                              }${
                                cancelado
                                  ? " pedido-celula-cancelada"
                                  : ""
                              }`}
                            >
                              <div className="pedidos-vendedor">
                                {
                                  pedido.vendedor
                                }
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    },
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* ===================================================
          MOBILE
      =================================================== */}

      <div className="pedidos-lista-mobile">
        {gruposPreparados.map(
          (grupo) => {
            const {
              primeiroPedido,
              pedidoPendente,
              pedidoNovo,
              pedidoAlterado,
              cancelado,
              atrasado,
              diasAtraso,
            } = grupo;

            const quantidadeItens =
              grupo.itens.length;

            const classesCard = [
              "pedidos-mobile-card",

              pedidoPendente
                ? "pedidos-mobile-card--clicavel"
                : "",

              atrasado
                ? "pedidos-mobile-card--atrasado"
                : "",

              cancelado
                ? "pedidos-mobile-card--cancelado"
                : "",

              pedidoNovo
                ? "pedidos-mobile-card--novo"
                : "",

              pedidoAlterado
                ? "pedidos-mobile-card--alterado"
                : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <article
                key={
                  grupo.chave ??
                  primeiroPedido.id
                }
                className={
                  classesCard
                }
                onClick={
                  pedidoPendente
                    ? () =>
                        visualizarPedido(
                          primeiroPedido,
                        )
                    : undefined
                }
                onKeyDown={(evento) =>
                  tratarTeclaCard(
                    evento,
                    primeiroPedido,
                    pedidoPendente,
                  )
                }
                role={
                  pedidoPendente
                    ? "button"
                    : undefined
                }
                tabIndex={
                  pedidoPendente
                    ? 0
                    : undefined
                }
                title={
                  pedidoNovo
                    ? "Novo pedido. Clique para marcar como visualizado."
                    : pedidoAlterado
                      ? "Pedido alterado. Clique para marcar como visualizado."
                      : undefined
                }
              >
                {/* CABEÇALHO */}

                <div className="pedidos-mobile-header">
                  <div className="pedidos-mobile-pedido">
                    <span className="pedidos-mobile-label">
                      Pedido
                    </span>

                    <div className="pedidos-mobile-pedido-numero">
                      <strong>
                        {primeiroPedido.pedidoExibicao ??
                          primeiroPedido.pedido}
                      </strong>

                      {quantidadeItens >
                        1 && (
                        <span className="pedidos-itens-badge">
                          {
                            quantidadeItens
                          }{" "}
                          itens
                        </span>
                      )}
                    </div>
                  </div>

                  {(pedidoNovo ||
                    pedidoAlterado) && (
                    <div className="pedidos-mobile-header-direita">
                      {pedidoNovo && (
                        <span className="pedido-novo-badge">
                          NOVO
                        </span>
                      )}

                      {pedidoAlterado && (
                        <span className="pedido-alterado-badge">
                          ALTERADO
                        </span>
                      )}
                    </div>
                  )}
                </div>


                {/* CLIENTE */}

                <div className="pedidos-mobile-cliente">
                  <span className="pedidos-mobile-label">
                    Cliente
                  </span>

                  <strong>
                    {
                      primeiroPedido.cliente
                    }
                  </strong>
                </div>


                {/* INFORMAÇÕES */}

                <div className="pedidos-mobile-info-grid">
                  <div className="pedidos-mobile-info">
                    <span className="pedidos-mobile-label">
                      Data Inclusão
                    </span>

                    <strong>
                      {formatarData(
                        primeiroPedido.data,
                      )}
                    </strong>
                  </div>

                  <div className="pedidos-mobile-info">
                    <span className="pedidos-mobile-label">
                      Previsão
                    </span>

                    <strong>
                      {formatarData(
                        primeiroPedido.previsao,
                      )}
                    </strong>

                    {atrasado && (
                      <span className="pedidos-tag-atraso">
                        <AlertTriangle
                          size={11}
                        />

                        {formatarTextoAtraso(
                          diasAtraso,
                        )}
                      </span>
                    )}
                  </div>

                  <div className="pedidos-mobile-info">
                    <span className="pedidos-mobile-label">
                      Vendedor
                    </span>

                    <strong>
                      {primeiroPedido.vendedor ||
                        "-"}
                    </strong>
                  </div>
                </div>


                {/* ITENS */}

                <div className="pedidos-mobile-itens">
                  {grupo.itens.map(
                    (pedido) => (
                      <div
                        key={pedido.id}
                        className="pedidos-mobile-item"
                      >
                        <div className="pedidos-mobile-item-topo">
                          <span className="pedidos-mobile-item-codigo">
                            {pedido.codigoProduto ||
                              "-"}
                          </span>

                          <span className="pedidos-mobile-item-quantidade">
                            {formatarNumero(
                              pedido.quantidade,
                            )}{" "}
                            {pedido.unidade ||
                              ""}
                          </span>
                        </div>

                        <div className="pedidos-mobile-item-produto">
                          {
                            pedido.produto
                          }
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </article>
            );
          },
        )}
      </div>
    </>
  );
}