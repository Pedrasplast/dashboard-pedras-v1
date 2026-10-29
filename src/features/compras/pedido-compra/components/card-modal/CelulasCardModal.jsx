import { ChevronDown, ChevronUp } from "lucide-react";

import { obterRotuloSituacaoRecebimento } from "../../utils/pedidosCompra.utils";

export function BadgeRecebimentoModal({ situacao }) {
  if (!situacao) {
    return <span className="compras-card-modal-sem-status">-</span>;
  }

  const classe = String(situacao).toLowerCase().replaceAll("_", "-");

  return (
    <span className={`compras-card-modal-badge compras-card-modal-badge--${classe}`}>
      {obterRotuloSituacaoRecebimento(situacao)}
    </span>
  );
}

export function BotaoItensModal({ totalItens, expandido, onClick }) {
  if (totalItens <= 1) {
    return null;
  }

  const itensOcultos = Math.max(totalItens - 1, 0);

  return (
    <button
      type="button"
      className={`compras-btn-itens${expandido ? " compras-btn-itens--aberto" : ""}`}
      onClick={onClick}
      title={expandido ? "Recolher itens" : "Ver todos os itens"}
      aria-expanded={expandido}
    >
      {expandido ? (
        <>
          Recolher
          <ChevronUp size={12} />
        </>
      ) : (
        <>
          +{itensOcultos} {itensOcultos === 1 ? "item" : "itens"}
          <ChevronDown size={12} />
        </>
      )}
    </button>
  );
}

/** Descrição do produto em negrito, com a observação do item logo abaixo. */
export function ProdutoComObservacao({ descricao, observacao }) {
  return (
    <td className="compras-card-modal-produto">
      <strong>{descricao}</strong>

      {observacao && <span className="compras-card-modal-item-observacao">{observacao}</span>}
    </td>
  );
}
