import { PrevisaoRecebimento, ProdutoComExpansao } from "./CelulasPedidosCompra";

import {
  montarClassesLinha,
  obterCodigoItem,
  obterItensDocumentoTabela,
  obterItensVisiveis,
  obterNomeCategoria,
} from "../../utils/pedidosCompraTabela.utils";

import { formatarNumeroCasasFixas } from "@/shared/lib/formatar";

export default function TabelaRequisicoes({
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
            <th className="compras-col-requisicao">Requisição</th>

            <th className="compras-col-categoria">Categoria</th>

            <th className="compras-col-previsao">Previsão</th>

            <th className="compras-col-codigo">Código</th>

            <th className="compras-col-produto">Produto</th>

            <th className="compras-col-observacao-item">Observação do item</th>

            <th className="compras-col-numero">Qtd.</th>

            <th className="compras-col-unidade">Un.</th>

            <th className="compras-col-observacoes">Observações</th>

            <th className="compras-col-observacoes-internas">Observações internas</th>
          </tr>
        </thead>

        <tbody>
          {pedidos.flatMap((pedido) => {
            const todosItens = obterItensDocumentoTabela(pedido);

            const documentoId = String(pedido.documento_id);

            const expandido = documentosExpandidos.has(documentoId);

            const possuiMaisItens = todosItens.length > 1;

            const itensVisiveis = obterItensVisiveis(todosItens, expandido);

            return itensVisiveis.map((item, indice) => {
              const primeiro = indice === 0;

              const quantidade = Number(item?.quantidade ?? 0);

              return (
                <tr
                  key={`${pedido.documento_id}-${item.codigo_item ?? indice}`}
                  data-documento-id={documentoId}
                  className={montarClassesLinha({
                    primeiro,
                    destacado: documentoEmFoco === documentoId,
                  })}
                  onMouseEnter={() => onEntrarDocumento(documentoId)}
                  onMouseLeave={(evento) => onSairDocumento(evento, documentoId)}
                >
                  {primeiro && (
                    <>
                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-celula-grupo compras-requisicao"
                      >
                        <strong>{pedido.numero_requisicao || "-"}</strong>
                      </td>

                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-celula-grupo compras-categoria-requisicao"
                      >
                        {obterNomeCategoria(pedido)}
                      </td>

                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-celula-grupo compras-previsao"
                      >
                        <PrevisaoRecebimento pedido={pedido} />
                      </td>
                    </>
                  )}

                  <td className="compras-codigo">{obterCodigoItem(item)}</td>

                  <td className="compras-produto">
                    <ProdutoComExpansao
                      item={item}
                      primeiro={primeiro}
                      possuiMaisItens={possuiMaisItens}
                      totalItens={todosItens.length}
                      expandido={expandido}
                      onAlternarItens={() => onAlternarItens(documentoId)}
                    />
                  </td>

                  <td className="compras-observacao-item">{item?.observacao || "-"}</td>

                  <td className="compras-numero">{formatarNumeroCasasFixas(quantidade, 2)}</td>

                  <td className="compras-unidade">{item?.unidade || "-"}</td>

                  {primeiro && (
                    <>
                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-celula-grupo compras-observacoes-requisicao"
                      >
                        {pedido.observacoes || "-"}
                      </td>

                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-celula-grupo compras-observacoes-internas"
                      >
                        {pedido.observacoes_internas || "-"}
                      </td>
                    </>
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
