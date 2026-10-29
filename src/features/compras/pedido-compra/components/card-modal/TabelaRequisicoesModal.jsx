import { ESTILO_CABECALHO_CELULA } from "./cardModal.config";
import { BotaoItensModal, ProdutoComObservacao } from "./CelulasCardModal";

import { formatarData, formatarMoeda, obterValorItem } from "../../utils/pedidosCompra.utils";
import { obterCodigoProduto, obterDocumentoId } from "../../utils/pedidosCompraCardModal.utils";
import {
  obterDescricaoItem,
  obterItensVisiveis,
  obterNomeCategoria,
} from "../../utils/pedidosCompraTabela.utils";

import { formatarNumeroCasasFixas } from "@/shared/lib/formatar";

export default function TabelaRequisicoesModal({
  requisicoes,
  documentosExpandidos,
  onAlternarItens,
}) {
  return (
    <div className="compras-card-modal-tabela-wrapper">
      <table className="compras-card-modal-tabela compras-card-modal-tabela--requisicoes">
        <thead>
          <tr>
            <th>Requisição</th>

            <th>Categoria</th>

            <th>Previsão</th>

            <th>Código</th>

            <th className="compras-card-modal-col-produto">Produto</th>

            <th className="compras-card-modal-col-numero">Qtd.</th>

            <th>Un.</th>

            <th className="compras-card-modal-col-valor">Preço Unit.</th>

            <th className="compras-card-modal-col-valor">Valor Item</th>
          </tr>
        </thead>

        <tbody>
          {requisicoes.flatMap((requisicao) => {
            const itens =
              Array.isArray(requisicao?.itens) && requisicao.itens.length > 0
                ? requisicao.itens
                : [
                    {
                      codigo_item: `sem-item-${requisicao.documento_id}`,
                    },
                  ];

            const documentoId = obterDocumentoId(requisicao);

            const expandido = documentosExpandidos.has(documentoId);

            const possuiMaisItens = itens.length > 1;

            const itensVisiveis = obterItensVisiveis(itens, expandido);

            return itensVisiveis.map((item, indice) => {
              const primeiro = indice === 0;

              const quantidade = Number(item?.quantidade ?? 0);

              const precoUnitario = Number(item?.preco_unitario ?? 0);

              return (
                <tr
                  key={`${documentoId}-${item.codigo_item ?? indice}`}
                  className={primeiro ? "" : "compras-card-modal-item-continuacao"}
                >
                  {primeiro && (
                    <>
                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-card-modal-celula-grupo"
                      >
                        <div style={ESTILO_CABECALHO_CELULA}>
                          <strong className="compras-card-modal-requisicao">
                            {requisicao.numero_requisicao || requisicao.numero_documento || "-"}
                          </strong>

                          {possuiMaisItens && (
                            <BotaoItensModal
                              totalItens={itens.length}
                              expandido={expandido}
                              onClick={() => onAlternarItens(documentoId)}
                            />
                          )}
                        </div>
                      </td>

                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-card-modal-celula-grupo compras-card-modal-categoria"
                      >
                        {obterNomeCategoria(requisicao)}
                      </td>

                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-card-modal-celula-grupo"
                      >
                        {formatarData(requisicao.data_previsao)}
                      </td>
                    </>
                  )}

                  <td className="compras-card-modal-codigo">{obterCodigoProduto(item)}</td>

                  <ProdutoComObservacao
                    descricao={obterDescricaoItem(item)}
                    observacao={item?.observacao}
                  />

                  <td className="compras-card-modal-numero">
                    {formatarNumeroCasasFixas(quantidade, 2)}
                  </td>

                  <td>{item?.unidade || "-"}</td>

                  <td className="compras-card-modal-valor">{formatarMoeda(precoUnitario)}</td>

                  <td className="compras-card-modal-valor compras-card-modal-valor--requisicao">
                    {formatarMoeda(obterValorItem(item))}
                  </td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
}
