import { useMemo } from "react";

import { ESTILO_CABECALHO_CELULA } from "./cardModal.config";
import { BotaoItensModal } from "./CelulasCardModal";

import { formatarNomeUsuario } from "../../utils/pedidosCompra.utils";
import { agruparRecebimentosPorPedido } from "../../utils/pedidosCompraCardModal.utils";

import { formatarDataHora } from "@/shared/lib/datas";
import { formatarNumeroCasasFixas } from "@/shared/lib/formatar";

function LinhaRecebimento({
  recebimento,
  mostrarPedido = true,
  totalItens = 1,
  expandido = false,
  chavePedido = "",
  onAlternarItens,
}) {
  return (
    <tr>
      <td>{formatarDataHora(recebimento.registrado_em)}</td>

      <td>
        {mostrarPedido ? (
          <div style={ESTILO_CABECALHO_CELULA}>
            <strong className="compras-card-modal-requisicao">
              {recebimento.numero_pedido || "-"}
            </strong>

            <BotaoItensModal
              totalItens={totalItens}
              expandido={expandido}
              onClick={() => onAlternarItens(chavePedido)}
            />
          </div>
        ) : (
          <span className="compras-card-modal-sem-status">-</span>
        )}
      </td>

      <td className="compras-card-modal-codigo">
        {recebimento.codigo_comercial || recebimento.codigo_produto || "-"}
      </td>

      <td className="compras-card-modal-produto">
        <strong>{recebimento.descricao_produto || "Produto não identificado"}</strong>
      </td>

      <td className="compras-card-modal-numero">
        {formatarNumeroCasasFixas(Number(recebimento.quantidade_movimentada ?? 0), 2)}
      </td>

      <td>{recebimento.unidade || "-"}</td>

      <td title={recebimento.usuario_nome || undefined}>
        {formatarNomeUsuario(recebimento.usuario_nome)}
      </td>
    </tr>
  );
}

function chaveRecebimento(recebimento, chavePedido) {
  return recebimento.id ?? `${chavePedido}-${recebimento.codigo_item}-${recebimento.registrado_em}`;
}

export default function TabelaRecebimentosFisicosModal({
  recebimentos,
  documentosExpandidos,
  onAlternarItens,
}) {
  const grupos = useMemo(() => agruparRecebimentosPorPedido(recebimentos), [recebimentos]);

  return (
    <div className="compras-card-modal-tabela-wrapper">
      <table className="compras-card-modal-tabela compras-card-modal-tabela--requisicoes">
        <thead>
          <tr>
            <th>Data / hora</th>

            <th>Pedido</th>

            <th>Código</th>

            <th className="compras-card-modal-col-produto">Produto</th>

            <th className="compras-card-modal-col-numero">Qtd. recebida</th>

            <th>Un.</th>

            <th>Recebido por</th>
          </tr>
        </thead>

        <tbody>
          {grupos.flatMap(([chavePedido, itensPedido]) => {
            const primeiro = itensPedido[0];

            if (!primeiro) {
              return [];
            }

            const expandido = documentosExpandidos.has(chavePedido);

            const linhaPrincipal = (
              <LinhaRecebimento
                key={chaveRecebimento(primeiro, chavePedido)}
                recebimento={primeiro}
                mostrarPedido
                totalItens={itensPedido.length}
                expandido={expandido}
                chavePedido={chavePedido}
                onAlternarItens={onAlternarItens}
              />
            );

            if (!expandido || itensPedido.length <= 1) {
              return [linhaPrincipal];
            }

            const linhasAdicionais = itensPedido
              .slice(1)
              .map((recebimento) => (
                <LinhaRecebimento
                  key={chaveRecebimento(recebimento, chavePedido)}
                  recebimento={recebimento}
                  mostrarPedido={false}
                  totalItens={itensPedido.length}
                  expandido={expandido}
                  chavePedido={chavePedido}
                  onAlternarItens={onAlternarItens}
                />
              ));

            return [linhaPrincipal, ...linhasAdicionais];
          })}
        </tbody>
      </table>
    </div>
  );
}
