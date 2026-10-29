import {
  PrevisaoRecebimento,
  ProdutoComExpansao,
  RecebimentoFisicoResumo,
} from "./CelulasPedidosCompra";

import { formatarData, formatarMoeda, obterValorItem } from "../../utils/pedidosCompra.utils";

import {
  montarClassesLinha,
  obterItensDocumentoTabela,
  obterItensVisiveis,
  obterSolicitante,
} from "../../utils/pedidosCompraTabela.utils";

import { formatarNumeroCasasFixas } from "@/shared/lib/formatar";

export default function TabelaPedidos({
  pedidos,
  mostrarRequisicao,
  documentosExpandidos,
  onAlternarItens,
  documentoEmFoco,
  onEntrarDocumento,
  onSairDocumento,
  resumosVisuais,
  onAbrirRecebimentoFisico,
}) {
  return (
    <div className="compras-tabela-wrapper">
      <table
        className={`compras-tabela ${
          mostrarRequisicao ? "compras-tabela--todos" : "compras-tabela--pedidos"
        }`}
      >
        <thead>
          <tr>
            {mostrarRequisicao && <th>Requisição</th>}

            <th>Pedido</th>

            <th>Fornecedor</th>

            <th>Data inclusão</th>

            <th>Previsão</th>

            <th>Código</th>

            <th className="compras-col-produto">Produto</th>

            <th className="compras-col-numero">Qtd.</th>

            <th className="compras-col-numero">Recebido</th>

            <th className="compras-col-numero">Saldo</th>

            <th className="compras-col-recebimento-fisico">Recebido físico</th>

            <th>Un.</th>

            <th className="compras-col-solicitante">Solicitante</th>

            <th>Comprador</th>

            <th className="compras-col-valor">Valor item</th>

            <th className="compras-col-observacoes-pedido">Observações</th>
          </tr>
        </thead>

        <tbody>
          {pedidos.flatMap((pedido) => {
            const todosItens = obterItensDocumentoTabela(pedido);

            const documentoId = String(pedido.documento_id);

            const expandido = documentosExpandidos.has(documentoId);

            const possuiMaisItens = todosItens.length > 1;

            const itensVisiveis = obterItensVisiveis(todosItens, expandido);

            const atrasado = pedido.situacao_recebimento === "EM_ATRASO";

            const resumoFisico = resumosVisuais.get(pedido);

            return itensVisiveis.map((item, indice) => {
              const primeiro = indice === 0;

              const quantidade = Number(item?.quantidade ?? 0);

              const recebida = Math.min(Number(item?.quantidade_recebida ?? 0), quantidade);

              const saldo = Math.max(quantidade - recebida, 0);

              return (
                <tr
                  key={`${pedido.documento_id}-${item.codigo_item ?? indice}`}
                  data-documento-id={documentoId}
                  className={montarClassesLinha({
                    primeiro,
                    atrasado,
                    destacado: documentoEmFoco === documentoId,
                  })}
                  onMouseEnter={() => onEntrarDocumento(documentoId)}
                  onMouseLeave={(evento) => onSairDocumento(evento, documentoId)}
                >
                  {primeiro && (
                    <>
                      {mostrarRequisicao && (
                        <td
                          rowSpan={itensVisiveis.length}
                          className="compras-celula-grupo compras-requisicao"
                        >
                          <strong>{pedido.numero_requisicao || "-"}</strong>
                        </td>
                      )}

                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-celula-grupo compras-pedido"
                      >
                        <strong>{pedido.numero_pedido || "-"}</strong>
                      </td>

                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-celula-grupo compras-fornecedor"
                      >
                        {pedido.fornecedor_nome}
                      </td>

                      <td rowSpan={itensVisiveis.length} className="compras-celula-grupo">
                        {formatarData(pedido.data_inclusao)}
                      </td>

                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-celula-grupo compras-previsao"
                      >
                        <PrevisaoRecebimento pedido={pedido} />
                      </td>
                    </>
                  )}

                  <td className="compras-codigo">{item?.codigo_comercial || "-"}</td>

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

                  <td className="compras-numero">{formatarNumeroCasasFixas(quantidade, 2)}</td>

                  <td className="compras-numero">{formatarNumeroCasasFixas(recebida, 2)}</td>

                  <td className="compras-numero compras-saldo">
                    {formatarNumeroCasasFixas(saldo, 2)}
                  </td>

                  {primeiro && (
                    <td
                      rowSpan={itensVisiveis.length}
                      className="compras-celula-grupo compras-col-recebimento-fisico"
                    >
                      {resumoFisico ? (
                        <RecebimentoFisicoResumo
                          resumo={resumoFisico}
                          onClick={() => onAbrirRecebimentoFisico(pedido)}
                        />
                      ) : (
                        <span className="compras-sem-status">-</span>
                      )}
                    </td>
                  )}

                  <td>{item?.unidade || "-"}</td>

                  {primeiro && (
                    <>
                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-celula-grupo compras-solicitante"
                      >
                        {obterSolicitante(pedido)}
                      </td>

                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-celula-grupo compras-comprador"
                      >
                        {pedido.comprador_nome}
                      </td>
                    </>
                  )}

                  <td className="compras-valor compras-valor-item">
                    {formatarMoeda(obterValorItem(item))}
                  </td>

                  {primeiro && (
                    <td
                      rowSpan={itensVisiveis.length}
                      className="compras-celula-grupo compras-observacoes-pedido"
                    >
                      {pedido.observacoes || "-"}
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
