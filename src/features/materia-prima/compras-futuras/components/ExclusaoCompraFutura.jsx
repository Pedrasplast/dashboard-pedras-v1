import ConfirmacaoExclusao from "@/components/ConfirmacaoExclusao/ConfirmacaoExclusao";

import { descricaoExclusao, detalhesExclusao } from "../utils/comprasFuturasUtils";

export default function ExclusaoCompraFutura({ compra, erro, processando, onCancelar, onConfirmar }) {
  return (
    <ConfirmacaoExclusao
      aberto={Boolean(compra)}
      titulo="Excluir compra futura?"
      descricao="Esta compra será removida das previsões de recebimento e deixará de participar da projeção de estoque."
      itemTitulo={compra?.fornecedorNome ?? ""}
      itemDescricao={descricaoExclusao(compra)}
      detalhes={detalhesExclusao(compra)}
      erro={erro}
      processando={processando}
      textoConfirmar="Excluir compra"
      onCancelar={onCancelar}
      onConfirmar={onConfirmar}
    />
  );
}
