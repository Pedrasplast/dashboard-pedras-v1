import { AlertTriangle } from "lucide-react";

import {
  calcularDiasAtraso,
  formatarData,
} from "../utils/date.utils";
import { formatarNumero, normalizarTexto } from "../utils/format.utils";
import {
  formatarTextoAtraso,
  obterClasseStatus,
  obterCodigoPedidoOmie,
  pedidoEhCancelado,
  pedidoEstaAtrasado,
} from "../utils/pedidos.utils";

export default function PedidosTabela({
  pedidosAgrupados,
  notificacoesPorPedido,
  onVisualizarPedido,
}) {
  return (
    <div className="pedidos-tabela-wrapper">
      <table className="pedidos-tabela">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Data</th>
            <th className="pedidos-col-previsao">Previsão faturamento</th>
            <th>Código</th>
            <th className="pedidos-col-produto">Produto</th>
            <th className="pedidos-col-numero">Quantidade</th>
            <th>Un.</th>
            <th>Vendedor</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {pedidosAgrupados.flatMap((grupo) => {
            const quantidadeItens = grupo.itens.length;
            const primeiroPedidoGrupo = grupo.itens[0];
            const codigoPedidoOmie = obterCodigoPedidoOmie(primeiroPedidoGrupo);

            const notificacaoPedido = codigoPedidoOmie
              ? notificacoesPorPedido.get(codigoPedidoOmie)
              : null;

            const pedidoPendente = Boolean(notificacaoPedido);
            const tipoNotificacao = normalizarTexto(notificacaoPedido?.tipo);
            const pedidoNovo = pedidoPendente && tipoNotificacao !== "alterado";
            const pedidoAlterado =
              pedidoPendente && tipoNotificacao === "alterado";

            return grupo.itens.map((pedido, indiceItem) => {
              const primeiroItem = indiceItem === 0;
              const cancelado = pedidoEhCancelado(pedido);
              const diasAtraso = calcularDiasAtraso(pedido.previsao);
              const atrasado = !cancelado && pedidoEstaAtrasado(pedido);

              const classesLinha = [
                primeiroItem
                  ? "pedidos-inicio-grupo"
                  : "pedidos-item-continuacao",
                atrasado ? "pedido-linha-atrasada" : "",
                cancelado ? "pedido-linha-cancelada" : "",
                pedidoNovo ? "pedido-linha-nova" : "",
                pedidoAlterado ? "pedido-linha-alterada" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <tr
                  key={pedido.id}
                  className={classesLinha}
                  onClick={
                    pedidoPendente
                      ? () => onVisualizarPedido(pedido)
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
                  {primeiroItem && (
                    <td
                      rowSpan={quantidadeItens}
                      className={`pedidos-celula-agrupada pedidos-celula-pedido${
                        atrasado ? " pedido-celula-atrasada" : ""
                      }${cancelado ? " pedido-celula-cancelada" : ""}${
                        pedidoNovo ? " pedido-celula-nova" : ""
                      }${pedidoAlterado ? " pedido-celula-alterada" : ""}`}
                    >
                      <div className="pedidos-pedido-agrupado">
                        <strong className="pedidos-numero">
                          {pedido.pedidoExibicao ?? pedido.pedido}
                        </strong>

                        {pedidoNovo && (
                          <span className="pedido-novo-badge">NOVO</span>
                        )}

                        {pedidoAlterado && (
                          <span className="pedido-alterado-badge">ALTERADO</span>
                        )}

                        {quantidadeItens > 1 && (
                          <span className="pedidos-itens-badge">
                            {quantidadeItens} itens
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  {primeiroItem && (
                    <td
                      rowSpan={quantidadeItens}
                      className={`pedidos-celula-agrupada${
                        atrasado ? " pedido-celula-atrasada" : ""
                      }${cancelado ? " pedido-celula-cancelada" : ""}`}
                    >
                      <div className="pedidos-cliente">{pedido.cliente}</div>
                    </td>
                  )}

                  {primeiroItem && (
                    <td
                      rowSpan={quantidadeItens}
                      className={`pedidos-celula-agrupada${
                        atrasado ? " pedido-celula-atrasada" : ""
                      }${cancelado ? " pedido-celula-cancelada" : ""}`}
                    >
                      {formatarData(pedido.data)}
                    </td>
                  )}

                  {primeiroItem && (
                    <td
                      rowSpan={quantidadeItens}
                      className={`pedidos-celula-agrupada pedidos-col-previsao${
                        atrasado ? " pedido-celula-atrasada" : ""
                      }${cancelado ? " pedido-celula-cancelada" : ""}`}
                    >
                      <div className="pedidos-previsao-wrapper">
                        <span className="pedidos-previsao-data">
                          {formatarData(pedido.previsao)}
                        </span>

                        {atrasado && (
                          <span className="pedidos-tag-atraso">
                            <AlertTriangle size={11} />
                            {formatarTextoAtraso(diasAtraso)}
                          </span>
                        )}
                      </div>
                    </td>
                  )}

                  <td>
                    <span className="pedidos-codigo-produto">
                      {pedido.codigoProduto || "-"}
                    </span>
                  </td>

                  <td className="pedidos-col-produto">
                    <div className="pedidos-produto">
                      {!primeiroItem && (
                        <span className="pedidos-item-indicador">↳</span>
                      )}
                      <span>{pedido.produto}</span>
                    </div>
                  </td>

                  <td className="pedidos-col-numero">
                    {formatarNumero(pedido.quantidade)}
                  </td>

                  <td>{pedido.unidade || "-"}</td>

                  {primeiroItem && (
                    <td
                      rowSpan={quantidadeItens}
                      className={`pedidos-celula-agrupada${
                        atrasado ? " pedido-celula-atrasada" : ""
                      }${cancelado ? " pedido-celula-cancelada" : ""}`}
                    >
                      <div className="pedidos-vendedor">{pedido.vendedor}</div>
                    </td>
                  )}

                  {primeiroItem && (
                    <td
                      rowSpan={quantidadeItens}
                      className={`pedidos-celula-agrupada${
                        cancelado ? " pedido-celula-cancelada" : ""
                      }`}
                    >
                      <span
                        className={`pedidos-status ${obterClasseStatus(
                          pedido.status,
                        )}`}
                      >
                        {pedido.status}
                      </span>
                    </td>
                  )}
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
}
