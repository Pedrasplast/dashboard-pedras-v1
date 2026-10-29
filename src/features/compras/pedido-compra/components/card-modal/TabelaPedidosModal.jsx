import { AlertTriangle } from "lucide-react";

import { ESTILO_CABECALHO_CELULA } from "./cardModal.config";
import { BadgeRecebimentoModal, BotaoItensModal, ProdutoComObservacao } from "./CelulasCardModal";

import { formatarData, formatarMoeda, obterValorItem } from "../../utils/pedidosCompra.utils";
import { obterCodigoProduto, obterDocumentoId } from "../../utils/pedidosCompraCardModal.utils";
import { obterDescricaoItem, obterDiasAtrasoPedido } from "../../utils/pedidosCompraTabela.utils";

import { formatarNumeroCasasFixas } from "@/shared/lib/formatar";

function LinhaItensPedido({ documentoId, itens }) {
  return (
    <tr>
      <td
        colSpan={7}
        style={{
          padding: 0,
        }}
      >
        <div className="compras-card-modal-tabela-wrapper">
          <table className="compras-card-modal-tabela compras-card-modal-tabela--requisicoes">
            <thead>
              <tr>
                <th>Código</th>

                <th className="compras-card-modal-col-produto">Produto</th>

                <th className="compras-card-modal-col-numero">Qtd.</th>

                <th className="compras-card-modal-col-numero">Recebido</th>

                <th className="compras-card-modal-col-numero">Saldo</th>

                <th>Un.</th>

                <th className="compras-card-modal-col-valor">Valor item</th>
              </tr>
            </thead>

            <tbody>
              {itens.map((item, indice) => {
                const quantidade = Number(item?.quantidade ?? 0);

                const recebida = Math.min(Number(item?.quantidade_recebida ?? 0), quantidade);

                const saldo = Math.max(quantidade - recebida, 0);

                return (
                  <tr key={`${documentoId}-${item?.codigo_item ?? indice}`}>
                    <td className="compras-card-modal-codigo">{obterCodigoProduto(item)}</td>

                    <ProdutoComObservacao
                      descricao={obterDescricaoItem(item)}
                      observacao={item?.observacao}
                    />

                    <td className="compras-card-modal-numero">
                      {formatarNumeroCasasFixas(quantidade, 2)}
                    </td>

                    <td className="compras-card-modal-numero">
                      {formatarNumeroCasasFixas(recebida, 2)}
                    </td>

                    <td className="compras-card-modal-numero">
                      {formatarNumeroCasasFixas(saldo, 2)}
                    </td>

                    <td>{item?.unidade || "-"}</td>

                    <td className="compras-card-modal-valor">
                      {formatarMoeda(obterValorItem(item))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );
}

export default function TabelaPedidosModal({ pedidos, documentosExpandidos, onAlternarItens }) {
  return (
    <div className="compras-card-modal-tabela-wrapper">
      <table className="compras-card-modal-tabela compras-card-modal-tabela--pedidos">
        <thead>
          <tr>
            <th>Pedido</th>

            <th>Fornecedor</th>

            <th>Comprador</th>

            <th>Previsão</th>

            <th>Recebimento</th>

            <th className="compras-card-modal-col-valor">Valor pedido</th>

            <th className="compras-card-modal-col-valor">Em aberto</th>
          </tr>
        </thead>

        <tbody>
          {pedidos.flatMap((pedido) => {
            const diasAtraso = obterDiasAtrasoPedido(pedido);

            const documentoId = obterDocumentoId(pedido);

            const todosItens = Array.isArray(pedido?.itens) ? pedido.itens : [];

            const possuiMaisItens = todosItens.length > 1;

            const expandido = documentosExpandidos.has(documentoId);

            const linhaPrincipal = (
              <tr key={`pedido-${documentoId}`}>
                <td>
                  <div className="compras-card-modal-pedido">
                    <div style={ESTILO_CABECALHO_CELULA}>
                      <strong>{pedido.numero_pedido || "-"}</strong>

                      {possuiMaisItens && (
                        <BotaoItensModal
                          totalItens={todosItens.length}
                          expandido={expandido}
                          onClick={() => onAlternarItens(documentoId)}
                        />
                      )}
                    </div>

                    {diasAtraso > 0 && (
                      <span>
                        <AlertTriangle size={11} />
                        {diasAtraso} {diasAtraso === 1 ? "dia" : "dias"} em atraso
                      </span>
                    )}
                  </div>
                </td>

                <td>
                  <strong className="compras-card-modal-fornecedor">
                    {pedido.fornecedor_nome || "Fornecedor não identificado"}
                  </strong>
                </td>

                <td>{pedido.comprador_nome || "Comprador não identificado"}</td>

                <td>{formatarData(pedido.data_previsao)}</td>

                <td>
                  <BadgeRecebimentoModal situacao={pedido.situacao_recebimento} />
                </td>

                <td className="compras-card-modal-valor">{formatarMoeda(pedido.valorTotal)}</td>

                <td className="compras-card-modal-valor compras-card-modal-valor--aberto">
                  {formatarMoeda(pedido.valorEmAberto)}
                </td>
              </tr>
            );

            if (!expandido || todosItens.length === 0) {
              return [linhaPrincipal];
            }

            return [
              linhaPrincipal,
              <LinhaItensPedido
                key={`pedido-itens-${documentoId}`}
                documentoId={documentoId}
                itens={todosItens}
              />,
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
