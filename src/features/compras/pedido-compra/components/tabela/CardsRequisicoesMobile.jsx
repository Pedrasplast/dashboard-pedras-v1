import { BotaoItens } from "./CelulasPedidosCompra";

import { formatarData } from "../../utils/pedidosCompra.utils";

import {
  obterCodigoItem,
  obterDescricaoItem,
  obterItensVisiveis,
  obterNomeCategoria,
} from "../../utils/pedidosCompraTabela.utils";

import { formatarNumeroCasasFixas } from "@/shared/lib/formatar";

export default function CardsRequisicoesMobile({ pedidos, documentosExpandidos, onAlternarItens }) {
  return (
    <div className="compras-cards-mobile">
      {pedidos.map((pedido) => {
        const documentoId = String(pedido.documento_id);

        const expandido = documentosExpandidos.has(documentoId);

        const todosItens = Array.isArray(pedido.itens) ? pedido.itens : [];

        const itensVisiveis = obterItensVisiveis(todosItens, expandido);

        return (
          <article key={pedido.documento_id} className="compras-mobile-card">
            <div className="compras-mobile-topo">
              <div>
                <span>Requisição</span>

                <strong>{pedido.numero_requisicao || "-"}</strong>
              </div>
            </div>

            <div className="compras-mobile-grade">
              <span>
                <small>Categoria</small>

                <strong>{obterNomeCategoria(pedido)}</strong>
              </span>

              <span>
                <small>Previsão</small>

                <strong>{formatarData(pedido.data_previsao)}</strong>
              </span>
            </div>

            {pedido.observacoes && (
              <div className="compras-mobile-observacoes">
                <small>Observações</small>

                <span>{pedido.observacoes}</span>
              </div>
            )}

            {pedido.observacoes_internas && (
              <div className="compras-mobile-observacoes">
                <small>Observações internas</small>

                <span>{pedido.observacoes_internas}</span>
              </div>
            )}

            <div className="compras-mobile-itens">
              {itensVisiveis.map((item, indice) => {
                const quantidade = Number(item?.quantidade ?? 0);

                return (
                  <div
                    key={`${pedido.documento_id}-${item.codigo_item ?? indice}`}
                    className="compras-mobile-item"
                  >
                    <div>
                      <strong>{obterCodigoItem(item)}</strong>

                      <div className="compras-mobile-produto-linha">
                        <span>{obterDescricaoItem(item)}</span>

                        {indice === 0 && todosItens.length > 1 && (
                          <BotaoItens
                            totalItens={todosItens.length}
                            expandido={expandido}
                            onClick={() => onAlternarItens(documentoId)}
                          />
                        )}
                      </div>

                      {item.observacao && (
                        <span className="compras-mobile-item-observacao">
                          Obs.: {item.observacao}
                        </span>
                      )}
                    </div>

                    <small>
                      {formatarNumeroCasasFixas(quantidade, 2)} {item.unidade || ""}
                    </small>
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}
