import { useState } from "react";

import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  TIPOS_DOCUMENTO,
} from "../constants/pedidosCompra.constants";

import {
  calcularDiasAtraso,
  formatarData,
  formatarMoeda,
  formatarNumero,
  obterRotuloSituacaoRecebimento,
} from "../utils/pedidosCompra.utils";

import "./PedidosCompraTabela.css";

function obterNomeCategoria(pedido) {
  return (
    String(
      pedido?.categoria_nome ?? "",
    ).trim() ||
    String(
      pedido?.categoria ?? "",
    ).trim() ||
    "-"
  );
}

function obterSolicitante(pedido) {
  const valor =
    pedido?.solicitante ??
    pedido?.contato ??
    pedido?.snapshot?.contato ??
    "";

  return String(valor).trim() || "-";
}

function obterCodigoItem(item) {
  const codigo =
    String(
      item?.codigo_comercial ?? "",
    ).trim();

  if (codigo) {
    return codigo;
  }

  const codigoOmie =
    String(
      item?.codigo_produto ?? "",
    ).trim();

  return codigoOmie
    ? `OMIE ${codigoOmie}`
    : "-";
}

function obterDescricaoItem(item) {
  const descricao =
    String(
      item?.descricao ?? "",
    ).trim();

  if (descricao) {
    return descricao;
  }

  return "Produto não identificado";
}

function obterValorItem(item) {
  const valorTotal =
    Number(item?.valor_total);

  if (
    Number.isFinite(valorTotal)
  ) {
    return valorTotal;
  }

  const quantidade =
    Number(
      item?.quantidade ?? 0,
    );

  const precoUnitario =
    Number(
      item?.preco_unitario ?? 0,
    );

  return (
    quantidade *
    precoUnitario
  );
}

function BadgeRecebimento({
  situacao,
}) {
  if (!situacao) {
    return (
      <span className="compras-sem-status">
        -
      </span>
    );
  }

  const classe =
    String(situacao)
      .toLowerCase()
      .replaceAll("_", "-");

  return (
    <span
      className={`compras-badge compras-badge--${classe}`}
    >
      {
        obterRotuloSituacaoRecebimento(
          situacao,
        )
      }
    </span>
  );
}

function PrevisaoRecebimento({
  pedido,
}) {
  if (
    pedido?.tipo_documento ===
    TIPOS_DOCUMENTO.REQUISICAO
  ) {
    return (
      <div className="compras-previsao-conteudo">
        <strong>
          {
            formatarData(
              pedido.data_previsao,
            )
          }
        </strong>
      </div>
    );
  }

  const atrasado =
    pedido.situacao_recebimento ===
    "EM_ATRASO";

  const diasAtraso =
    atrasado
      ? calcularDiasAtraso(
          pedido.data_previsao,
        )
      : 0;

  return (
    <div className="compras-previsao-conteudo">
      <strong>
        {
          formatarData(
            pedido.data_previsao,
          )
        }
      </strong>

      {atrasado &&
        diasAtraso > 0 && (
          <span className="compras-tag-atraso">
            <AlertTriangle
              size={12}
            />

            {diasAtraso}{" "}
            {diasAtraso === 1
              ? "dia"
              : "dias"}{" "}
            em atraso
          </span>
        )}
    </div>
  );
}

function BotaoItens({
  totalItens,
  expandido,
  onClick,
}) {
  if (totalItens <= 1) {
    return null;
  }

  const itensOcultos =
    Math.max(
      totalItens - 1,
      0,
    );

  return (
    <button
      type="button"
      className={`compras-btn-itens${
        expandido
          ? " compras-btn-itens--aberto"
          : ""
      }`}
      onClick={onClick}
      title={
        expandido
          ? "Recolher itens"
          : "Ver todos os itens"
      }
    >
      {expandido ? (
        <>
          Recolher
          <ChevronUp size={13} />
        </>
      ) : (
        <>
          +{itensOcultos}{" "}
          {itensOcultos === 1
            ? "item"
            : "itens"}
          <ChevronDown size={13} />
        </>
      )}
    </button>
  );
}

function ProdutoComExpansao({
  item,
  primeiro,
  possuiMaisItens,
  totalItens,
  expandido,
  onAlternarItens,
}) {
  return (
    <div className="compras-produto-linha">
      <span className="compras-produto-descricao">
        {
          obterDescricaoItem(
            item,
          )
        }
      </span>

      {primeiro &&
        possuiMaisItens && (
          <BotaoItens
            totalItens={
              totalItens
            }
            expandido={
              expandido
            }
            onClick={
              onAlternarItens
            }
          />
        )}
    </div>
  );
}

function TabelaRequisicoes({
  pedidos,
  documentosExpandidos,
  onAlternarItens,
  documentoEmFoco,
  onEntrarDocumento,
  onSairDocumento,
}) {
  return (
    <div className="compras-tabela-wrapper">
      <table className="compras-tabela compras-tabela--requisicoes">
        <thead>
          <tr>
            <th className="compras-col-requisicao">
              Requisição
            </th>

            <th className="compras-col-categoria">
              Categoria
            </th>

            <th className="compras-col-previsao">
              Previsão
            </th>

            <th className="compras-col-codigo">
              Código
            </th>

            <th className="compras-col-produto">
              Produto
            </th>

            <th className="compras-col-observacao-item">
              Observação do item
            </th>

            <th className="compras-col-numero">
              Qtd.
            </th>

            <th className="compras-col-unidade">
              Un.
            </th>

            <th className="compras-col-observacoes">
              Observações
            </th>

            <th className="compras-col-observacoes-internas">
              Observações internas
            </th>
          </tr>
        </thead>

        <tbody>
          {pedidos.flatMap(
            (pedido) => {
              const todosItens =
                Array.isArray(
                  pedido?.itens,
                ) &&
                pedido.itens.length
                  ? pedido.itens
                  : [
                      {
                        codigo_item:
                          `vazio-${pedido.documento_id}`,
                      },
                    ];

              const documentoId =
                String(
                  pedido.documento_id,
                );

              const expandido =
                documentosExpandidos.has(
                  documentoId,
                );

              const possuiMaisItens =
                todosItens.length > 1;

              const itensVisiveis =
                expandido
                  ? todosItens
                  : todosItens.slice(
                      0,
                      1,
                    );

              return itensVisiveis.map(
                (
                  item,
                  indice,
                ) => {
                  const primeiro =
                    indice === 0;

                  const quantidade =
                    Number(
                      item?.quantidade ??
                        0,
                    );

                  const destacado =
                    documentoEmFoco ===
                    documentoId;

                  const classes = [
                    primeiro
                      ? "compras-inicio-grupo"
                      : "compras-item-continuacao",

                    destacado
                      ? "compras-grupo-destacado"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr
                      key={`${pedido.documento_id}-${item.codigo_item ?? indice}`}
                      data-documento-id={
                        documentoId
                      }
                      className={
                        classes
                      }
                      onMouseEnter={() =>
                        onEntrarDocumento(
                          documentoId,
                        )
                      }
                      onMouseLeave={(
                        evento,
                      ) =>
                        onSairDocumento(
                          evento,
                          documentoId,
                        )
                      }
                    >
                      {primeiro && (
                        <>
                          <td
                            rowSpan={
                              itensVisiveis.length
                            }
                            className="compras-celula-grupo compras-requisicao"
                          >
                            <strong>
                              {pedido.numero_requisicao ||
                                "-"}
                            </strong>
                          </td>

                          <td
                            rowSpan={
                              itensVisiveis.length
                            }
                            className="compras-celula-grupo compras-categoria-requisicao"
                          >
                            {
                              obterNomeCategoria(
                                pedido,
                              )
                            }
                          </td>

                          <td
                            rowSpan={
                              itensVisiveis.length
                            }
                            className="compras-celula-grupo compras-previsao"
                          >
                            <PrevisaoRecebimento
                              pedido={
                                pedido
                              }
                            />
                          </td>
                        </>
                      )}

                      <td className="compras-codigo">
                        {
                          obterCodigoItem(
                            item,
                          )
                        }
                      </td>

                      <td className="compras-produto">
                        <ProdutoComExpansao
                          item={
                            item
                          }
                          primeiro={
                            primeiro
                          }
                          possuiMaisItens={
                            possuiMaisItens
                          }
                          totalItens={
                            todosItens.length
                          }
                          expandido={
                            expandido
                          }
                          onAlternarItens={() =>
                            onAlternarItens(
                              documentoId,
                            )
                          }
                        />
                      </td>

                      <td className="compras-observacao-item">
                        {item?.observacao ||
                          "-"}
                      </td>

                      <td className="compras-numero">
                        {
                          formatarNumero(
                            quantidade,
                            2,
                          )
                        }
                      </td>

                      <td className="compras-unidade">
                        {item?.unidade ||
                          "-"}
                      </td>

                      {primeiro && (
                        <>
                          <td
                            rowSpan={
                              itensVisiveis.length
                            }
                            className="compras-celula-grupo compras-observacoes-requisicao"
                          >
                            {pedido.observacoes ||
                              "-"}
                          </td>

                          <td
                            rowSpan={
                              itensVisiveis.length
                            }
                            className="compras-celula-grupo compras-observacoes-internas"
                          >
                            {pedido.observacoes_internas ||
                              "-"}
                          </td>
                        </>
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
  );
}

function TabelaPedidos({
  pedidos,
  mostrarRequisicao,
  documentosExpandidos,
  onAlternarItens,
  documentoEmFoco,
  onEntrarDocumento,
  onSairDocumento,
}) {
  return (
    <div className="compras-tabela-wrapper">
      <table
        className={`compras-tabela ${
          mostrarRequisicao
            ? "compras-tabela--todos"
            : "compras-tabela--pedidos"
        }`}
      >
        <thead>
          <tr>
            {mostrarRequisicao && (
              <th>
                Requisição
              </th>
            )}

            <th>
              Pedido
            </th>

            <th>
              Fornecedor
            </th>

            <th>
              Data inclusão
            </th>

            <th>
              Previsão
            </th>

            <th>
              Código
            </th>

            <th className="compras-col-produto">
              Produto
            </th>

            <th className="compras-col-numero">
              Qtd.
            </th>

            <th className="compras-col-numero">
              Recebido
            </th>

            <th className="compras-col-numero">
              Saldo
            </th>

            <th>
              Un.
            </th>

            <th className="compras-col-solicitante">
              Solicitante
            </th>

            <th>
              Comprador
            </th>

            <th className="compras-col-valor">
              Valor item
            </th>

            <th className="compras-col-observacoes-pedido">
              Observações
            </th>
          </tr>
        </thead>

        <tbody>
          {pedidos.flatMap(
            (pedido) => {
              const todosItens =
                Array.isArray(
                  pedido?.itens,
                ) &&
                pedido.itens.length
                  ? pedido.itens
                  : [
                      {
                        codigo_item:
                          `vazio-${pedido.documento_id}`,
                      },
                    ];

              const documentoId =
                String(
                  pedido.documento_id,
                );

              const expandido =
                documentosExpandidos.has(
                  documentoId,
                );

              const possuiMaisItens =
                todosItens.length > 1;

              const itensVisiveis =
                expandido
                  ? todosItens
                  : todosItens.slice(
                      0,
                      1,
                    );

              const atrasado =
                pedido
                  .situacao_recebimento ===
                "EM_ATRASO";

              return itensVisiveis.map(
                (
                  item,
                  indice,
                ) => {
                  const primeiro =
                    indice === 0;

                  const quantidade =
                    Number(
                      item?.quantidade ??
                        0,
                    );

                  const recebida =
                    Math.min(
                      Number(
                        item?.quantidade_recebida ??
                          0,
                      ),
                      quantidade,
                    );

                  const saldo =
                    Math.max(
                      quantidade -
                        recebida,
                      0,
                    );

                  const valorItem =
                    obterValorItem(
                      item,
                    );

                  const destacado =
                    documentoEmFoco ===
                    documentoId;

                  const classes = [
                    primeiro
                      ? "compras-inicio-grupo"
                      : "compras-item-continuacao",

                    atrasado
                      ? "compras-linha-atrasada"
                      : "",

                    destacado
                      ? "compras-grupo-destacado"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <tr
                      key={`${pedido.documento_id}-${item.codigo_item ?? indice}`}
                      data-documento-id={
                        documentoId
                      }
                      className={
                        classes
                      }
                      onMouseEnter={() =>
                        onEntrarDocumento(
                          documentoId,
                        )
                      }
                      onMouseLeave={(
                        evento,
                      ) =>
                        onSairDocumento(
                          evento,
                          documentoId,
                        )
                      }
                    >
                      {primeiro && (
                        <>
                          {mostrarRequisicao && (
                            <td
                              rowSpan={
                                itensVisiveis.length
                              }
                              className="compras-celula-grupo compras-requisicao"
                            >
                              <strong>
                                {pedido.numero_requisicao ||
                                  "-"}
                              </strong>
                            </td>
                          )}

                          <td
                            rowSpan={
                              itensVisiveis.length
                            }
                            className="compras-celula-grupo compras-pedido"
                          >
                            <strong>
                              {pedido.numero_pedido ||
                                "-"}
                            </strong>
                          </td>

                          <td
                            rowSpan={
                              itensVisiveis.length
                            }
                            className="compras-celula-grupo compras-fornecedor"
                          >
                            {
                              pedido.fornecedor_nome
                            }
                          </td>

                          <td
                            rowSpan={
                              itensVisiveis.length
                            }
                            className="compras-celula-grupo"
                          >
                            {
                              formatarData(
                                pedido.data_inclusao,
                              )
                            }
                          </td>

                          <td
                            rowSpan={
                              itensVisiveis.length
                            }
                            className="compras-celula-grupo compras-previsao"
                          >
                            <PrevisaoRecebimento
                              pedido={
                                pedido
                              }
                            />
                          </td>
                        </>
                      )}

                      <td className="compras-codigo">
                        {item?.codigo_comercial ||
                          "-"}
                      </td>

                      <td className="compras-produto">
                        <ProdutoComExpansao
                          item={
                            item
                          }
                          primeiro={
                            primeiro
                          }
                          possuiMaisItens={
                            possuiMaisItens
                          }
                          totalItens={
                            todosItens.length
                          }
                          expandido={
                            expandido
                          }
                          onAlternarItens={() =>
                            onAlternarItens(
                              documentoId,
                            )
                          }
                        />
                      </td>

                      <td className="compras-numero">
                        {
                          formatarNumero(
                            quantidade,
                            2,
                          )
                        }
                      </td>

                      <td className="compras-numero">
                        {
                          formatarNumero(
                            recebida,
                            2,
                          )
                        }
                      </td>

                      <td className="compras-numero compras-saldo">
                        {
                          formatarNumero(
                            saldo,
                            2,
                          )
                        }
                      </td>

                      <td>
                        {item?.unidade ||
                          "-"}
                      </td>

                      {primeiro && (
                        <>
                          <td
                            rowSpan={
                              itensVisiveis.length
                            }
                            className="compras-celula-grupo compras-solicitante"
                          >
                            {
                              obterSolicitante(
                                pedido,
                              )
                            }
                          </td>

                          <td
                            rowSpan={
                              itensVisiveis.length
                            }
                            className="compras-celula-grupo compras-comprador"
                          >
                            {
                              pedido.comprador_nome
                            }
                          </td>
                        </>
                      )}

                      <td className="compras-valor compras-valor-item">
                        {
                          formatarMoeda(
                            valorItem,
                          )
                        }
                      </td>

                      {primeiro && (
                        <td
                          rowSpan={
                            itensVisiveis.length
                          }
                          className="compras-celula-grupo compras-observacoes-pedido"
                        >
                          {pedido.observacoes ||
                            "-"}
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
  );
}

export default function PedidosCompraTabela({
  pedidos,
  tipoDocumento,
}) {
  const [
    documentosExpandidos,
    setDocumentosExpandidos,
  ] =
    useState(
      () =>
        new Set(),
    );

  const [
    documentoEmFoco,
    setDocumentoEmFoco,
  ] =
    useState(null);

  const somenteRequisicoes =
    tipoDocumento ===
    TIPOS_DOCUMENTO.REQUISICAO;

  const somentePedidos =
    tipoDocumento ===
    TIPOS_DOCUMENTO.PEDIDO;

  function alternarItens(
    documentoId,
  ) {
    setDocumentosExpandidos(
      (atual) => {
        const proximo =
          new Set(
            atual,
          );

        if (
          proximo.has(
            documentoId,
          )
        ) {
          proximo.delete(
            documentoId,
          );
        } else {
          proximo.add(
            documentoId,
          );
        }

        return proximo;
      },
    );
  }

  function entrarDocumento(
    documentoId,
  ) {
    setDocumentoEmFoco(
      documentoId,
    );
  }

  function sairDocumento(
    evento,
    documentoId,
  ) {
    /*
     * IMPORTANTE:
     *
     * Um pedido expandido possui vários <tr>.
     * Ao mover o mouse de um item para outro
     * do MESMO pedido, não podemos limpar
     * documentoEmFoco.
     *
     * Somente limpamos quando o elemento
     * seguinte não pertence ao mesmo
     * documento.
     */
    const proximoElemento =
      evento.relatedTarget;

    const proximaLinha =
      proximoElemento &&
      typeof proximoElemento.closest ===
        "function"
        ? proximoElemento.closest(
            "tr[data-documento-id]",
          )
        : null;

    const proximoDocumentoId =
      proximaLinha
        ?.dataset
        ?.documentoId;

    if (
      proximoDocumentoId ===
      documentoId
    ) {
      return;
    }

    setDocumentoEmFoco(
      null,
    );
  }

  if (
    somenteRequisicoes
  ) {
    return (
      <>
        <div className="compras-tabela-desktop">
          <TabelaRequisicoes
            pedidos={
              pedidos
            }
            documentosExpandidos={
              documentosExpandidos
            }
            onAlternarItens={
              alternarItens
            }
            documentoEmFoco={
              documentoEmFoco
            }
            onEntrarDocumento={
              entrarDocumento
            }
            onSairDocumento={
              sairDocumento
            }
          />
        </div>

        <div className="compras-cards-mobile">
          {pedidos.map(
            (pedido) => {
              const documentoId =
                String(
                  pedido.documento_id,
                );

              const expandido =
                documentosExpandidos.has(
                  documentoId,
                );

              const todosItens =
                Array.isArray(
                  pedido.itens,
                )
                  ? pedido.itens
                  : [];

              const itensVisiveis =
                expandido
                  ? todosItens
                  : todosItens.slice(
                      0,
                      1,
                    );

              return (
                <article
                  key={
                    pedido.documento_id
                  }
                  className="compras-mobile-card"
                >
                  <div className="compras-mobile-topo">
                    <div>
                      <span>
                        Requisição
                      </span>

                      <strong>
                        {pedido.numero_requisicao ||
                          "-"}
                      </strong>
                    </div>
                  </div>

                  <div className="compras-mobile-grade">
                    <span>
                      <small>
                        Categoria
                      </small>

                      <strong>
                        {
                          obterNomeCategoria(
                            pedido,
                          )
                        }
                      </strong>
                    </span>

                    <span>
                      <small>
                        Previsão
                      </small>

                      <strong>
                        {
                          formatarData(
                            pedido.data_previsao,
                          )
                        }
                      </strong>
                    </span>
                  </div>

                  {pedido.observacoes && (
                    <div className="compras-mobile-observacoes">
                      <small>
                        Observações
                      </small>

                      <span>
                        {
                          pedido.observacoes
                        }
                      </span>
                    </div>
                  )}

                  {pedido.observacoes_internas && (
                    <div className="compras-mobile-observacoes">
                      <small>
                        Observações internas
                      </small>

                      <span>
                        {
                          pedido.observacoes_internas
                        }
                      </span>
                    </div>
                  )}

                  <div className="compras-mobile-itens">
                    {itensVisiveis.map(
                      (
                        item,
                        indice,
                      ) => {
                        const quantidade =
                          Number(
                            item?.quantidade ??
                              0,
                          );

                        return (
                          <div
                            key={`${pedido.documento_id}-${item.codigo_item ?? indice}`}
                            className="compras-mobile-item"
                          >
                            <div>
                              <strong>
                                {
                                  obterCodigoItem(
                                    item,
                                  )
                                }
                              </strong>

                              <div className="compras-mobile-produto-linha">
                                <span>
                                  {
                                    obterDescricaoItem(
                                      item,
                                    )
                                  }
                                </span>

                                {indice === 0 &&
                                  todosItens.length >
                                    1 && (
                                    <BotaoItens
                                      totalItens={
                                        todosItens.length
                                      }
                                      expandido={
                                        expandido
                                      }
                                      onClick={() =>
                                        alternarItens(
                                          documentoId,
                                        )
                                      }
                                    />
                                  )}
                              </div>

                              {item.observacao && (
                                <span className="compras-mobile-item-observacao">
                                  Obs.:{" "}
                                  {
                                    item.observacao
                                  }
                                </span>
                              )}
                            </div>

                            <small>
                              {
                                formatarNumero(
                                  quantidade,
                                  2,
                                )
                              }{" "}
                              {item.unidade ||
                                ""}
                            </small>
                          </div>
                        );
                      },
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

  return (
    <>
      <div className="compras-tabela-desktop">
        <TabelaPedidos
          pedidos={
            pedidos
          }
          mostrarRequisicao={
            !somentePedidos
          }
          documentosExpandidos={
            documentosExpandidos
          }
          onAlternarItens={
            alternarItens
          }
          documentoEmFoco={
            documentoEmFoco
          }
          onEntrarDocumento={
            entrarDocumento
          }
          onSairDocumento={
            sairDocumento
          }
        />
      </div>

      <div className="compras-cards-mobile">
        {pedidos.map(
          (pedido) => {
            const atrasado =
              pedido.situacao_recebimento ===
              "EM_ATRASO";

            const diasAtraso =
              atrasado
                ? calcularDiasAtraso(
                    pedido.data_previsao,
                  )
                : 0;

            const documentoId =
              String(
                pedido.documento_id,
              );

            const expandido =
              documentosExpandidos.has(
                documentoId,
              );

            const todosItens =
              Array.isArray(
                pedido.itens,
              )
                ? pedido.itens
                : [];

            const itensVisiveis =
              expandido
                ? todosItens
                : todosItens.slice(
                    0,
                    1,
                  );

            return (
              <article
                key={
                  pedido.documento_id
                }
                className={`compras-mobile-card${
                  atrasado
                    ? " atrasado"
                    : ""
                }`}
              >
                <div className="compras-mobile-topo">
                  <div>
                    <span>
                      Pedido
                    </span>

                    <strong>
                      {pedido.numero_pedido ||
                        "-"}
                    </strong>
                  </div>

                  <BadgeRecebimento
                    situacao={
                      pedido.situacao_recebimento
                    }
                  />
                </div>

                <h3>
                  {
                    pedido.fornecedor_nome
                  }
                </h3>

                <div className="compras-mobile-grade">
                  <span>
                    <small>
                      Previsão
                    </small>

                    <strong>
                      {
                        formatarData(
                          pedido.data_previsao,
                        )
                      }
                    </strong>

                    {atrasado &&
                      diasAtraso >
                        0 && (
                        <span className="compras-tag-atraso">
                          <AlertTriangle
                            size={12}
                          />

                          {diasAtraso}{" "}
                          {diasAtraso === 1
                            ? "dia"
                            : "dias"}{" "}
                          em atraso
                        </span>
                      )}
                  </span>

                  <span>
                    <small>
                      Valor total
                    </small>

                    <strong>
                      {
                        formatarMoeda(
                          pedido.valorTotal,
                        )
                      }
                    </strong>
                  </span>

                  <span>
                    <small>
                      Solicitante
                    </small>

                    <strong>
                      {
                        obterSolicitante(
                          pedido,
                        )
                      }
                    </strong>
                  </span>

                  <span>
                    <small>
                      Comprador
                    </small>

                    <strong>
                      {
                        pedido.comprador_nome
                      }
                    </strong>
                  </span>
                </div>

                {pedido.observacoes && (
                  <div className="compras-mobile-observacoes">
                    <small>
                      Observações
                    </small>

                    <span>
                      {
                        pedido.observacoes
                      }
                    </span>
                  </div>
                )}

                <div className="compras-mobile-itens">
                  {itensVisiveis.map(
                    (
                      item,
                      indice,
                    ) => (
                      <div
                        key={`${pedido.documento_id}-${item.codigo_item ?? indice}`}
                        className="compras-mobile-item"
                      >
                        <div>
                          <strong>
                            {item.codigo_comercial ||
                              "-"}
                          </strong>

                          <div className="compras-mobile-produto-linha">
                            <span>
                              {item.descricao ||
                                "-"}
                            </span>

                            {indice === 0 &&
                              todosItens.length >
                                1 && (
                                <BotaoItens
                                  totalItens={
                                    todosItens.length
                                  }
                                  expandido={
                                    expandido
                                  }
                                  onClick={() =>
                                    alternarItens(
                                      documentoId,
                                    )
                                  }
                                />
                              )}
                          </div>
                        </div>

                        <small>
                          {
                            formatarNumero(
                              item.quantidade,
                              2,
                            )
                          }{" "}
                          {item.unidade ||
                            ""}

                          <br />

                          <strong>
                            {
                              formatarMoeda(
                                obterValorItem(
                                  item,
                                ),
                              )
                            }
                          </strong>
                        </small>
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