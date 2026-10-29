import {
  BadgeRecebimento,
  BotaoItens,
  RecebimentoFisicoResumo,
  TagAtraso,
} from "./CelulasPedidosCompra";

import { formatarData, formatarMoeda, obterValorItem } from "../../utils/pedidosCompra.utils";

import {
  obterDiasAtrasoPedido,
  obterItensVisiveis,
  obterSolicitante,
} from "../../utils/pedidosCompraTabela.utils";

import { formatarNumeroCasasFixas } from "@/shared/lib/formatar";

export default function CardsPedidosMobile({
  pedidos,
  documentosExpandidos,
  onAlternarItens,
  resumosVisuais,
  onAbrirRecebimentoFisico,
}) {
  return (
    <div className="compras-cards-mobile">
      {pedidos.map((pedido) => {
        const atrasado = pedido.situacao_recebimento === "EM_ATRASO";

        const documentoId = String(pedido.documento_id);

        const expandido = documentosExpandidos.has(documentoId);

        const todosItens = Array.isArray(pedido.itens) ? pedido.itens : [];

        const itensVisiveis = obterItensVisiveis(todosItens, expandido);

        const resumoFisico = resumosVisuais.get(pedido);

        return (
          <article
            key={pedido.documento_id}
            className={`compras-mobile-card${atrasado ? " atrasado" : ""}`}
          >
            <div className="compras-mobile-topo">
              <div>
                <span>Pedido</span>

                <strong>{pedido.numero_pedido || "-"}</strong>
              </div>

              <div className="compras-mobile-status-grupo">
                <BadgeRecebimento situacao={pedido.situacao_recebimento} />

                {resumoFisico && (
                  <RecebimentoFisicoResumo
                    resumo={resumoFisico}
                    onClick={() => onAbrirRecebimentoFisico(pedido)}
                  />
                )}
              </div>
            </div>

            <h3>{pedido.fornecedor_nome}</h3>

            <div className="compras-mobile-grade">
              <span>
                <small>Previsão</small>

                <strong>{formatarData(pedido.data_previsao)}</strong>

                <TagAtraso diasAtraso={obterDiasAtrasoPedido(pedido)} />
              </span>

              <span>
                <small>Valor total</small>

                <strong>{formatarMoeda(pedido.valorTotal)}</strong>
              </span>

              <span>
                <small>Solicitante</small>

                <strong>{obterSolicitante(pedido)}</strong>
              </span>

              <span>
                <small>Comprador</small>

                <strong>{pedido.comprador_nome}</strong>
              </span>
            </div>

            {pedido.observacoes && (
              <div className="compras-mobile-observacoes">
                <small>Observações</small>

                <span>{pedido.observacoes}</span>
              </div>
            )}

            <div className="compras-mobile-itens">
              {itensVisiveis.map((item, indice) => (
                <div
                  key={`${pedido.documento_id}-${item.codigo_item ?? indice}`}
                  className="compras-mobile-item"
                >
                  <div>
                    <strong>{item.codigo_comercial || "-"}</strong>

                    <div className="compras-mobile-produto-linha">
                      <span>{item.descricao || "-"}</span>

                      {indice === 0 && todosItens.length > 1 && (
                        <BotaoItens
                          totalItens={todosItens.length}
                          expandido={expandido}
                          onClick={() => onAlternarItens(documentoId)}
                        />
                      )}
                    </div>
                  </div>

                  <small>
                    {formatarNumeroCasasFixas(item.quantidade, 2)} {item.unidade || ""}
                    <br />
                    <strong>{formatarMoeda(obterValorItem(item))}</strong>
                  </small>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
