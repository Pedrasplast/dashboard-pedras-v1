import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Info,
} from "lucide-react";

import { TIPOS_DOCUMENTO } from "../../constants/pedidosCompra.constants";

import { formatarData, obterRotuloSituacaoRecebimento } from "../../utils/pedidosCompra.utils";

import {
  montarTituloRecebimentoFisico,
  obterDescricaoItem,
  obterDiasAtrasoPedido,
} from "../../utils/pedidosCompraTabela.utils";

const CONFIGURACOES_RECEBIMENTO_FISICO = {
  COMPLETO: {
    classe: "completo",
    rotulo: "Completo",
    Icone: CheckCircle2,
  },
  PARCIAL: {
    classe: "parcial",
    rotulo: "Parcial",
    Icone: CircleDashed,
  },
  NAO_RECEBIDO: {
    classe: "nao-recebido",
    rotulo: "Não recebido",
    Icone: CircleDashed,
  },
};

export function RecebimentoFisicoResumo({ resumo, onClick }) {
  const situacao = resumo?.situacao_recebimento_fisico || "NAO_RECEBIDO";

  const configuracao = Object.hasOwn(CONFIGURACOES_RECEBIMENTO_FISICO, situacao)
    ? CONFIGURACOES_RECEBIMENTO_FISICO[situacao]
    : CONFIGURACOES_RECEBIMENTO_FISICO.NAO_RECEBIDO;

  const { Icone } = configuracao;

  return (
    <button
      type="button"
      className={`compras-recebimento-fisico compras-recebimento-fisico--${configuracao.classe}`}
      onClick={onClick}
      title={montarTituloRecebimentoFisico(resumo)}
    >
      <Icone size={15} />
      <span>{configuracao.rotulo}</span>

      {situacao === "PARCIAL" && resumo?.total_itens > 0 && (
        <small>
          {resumo.itens_completos || 0}/{resumo.total_itens} itens
        </small>
      )}

      <Info size={13} aria-hidden="true" />
    </button>
  );
}

export function BadgeRecebimento({ situacao }) {
  if (!situacao) {
    return <span className="compras-sem-status">-</span>;
  }

  const classe = String(situacao).toLowerCase().replaceAll("_", "-");

  return (
    <span className={`compras-badge compras-badge--${classe}`}>
      {obterRotuloSituacaoRecebimento(situacao)}
    </span>
  );
}

export function TagAtraso({ diasAtraso }) {
  if (!(diasAtraso > 0)) {
    return null;
  }

  return (
    <span className="compras-tag-atraso">
      <AlertTriangle size={12} />
      {diasAtraso} {diasAtraso === 1 ? "dia" : "dias"} em atraso
    </span>
  );
}

export function PrevisaoRecebimento({ pedido }) {
  if (pedido?.tipo_documento === TIPOS_DOCUMENTO.REQUISICAO) {
    return (
      <div className="compras-previsao-conteudo">
        <strong>{formatarData(pedido.data_previsao)}</strong>
      </div>
    );
  }

  return (
    <div className="compras-previsao-conteudo">
      <strong>{formatarData(pedido.data_previsao)}</strong>

      <TagAtraso diasAtraso={obterDiasAtrasoPedido(pedido)} />
    </div>
  );
}

export function BotaoItens({ totalItens, expandido, onClick }) {
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
    >
      {expandido ? (
        <>
          Recolher
          <ChevronUp size={13} />
        </>
      ) : (
        <>
          +{itensOcultos} {itensOcultos === 1 ? "item" : "itens"}
          <ChevronDown size={13} />
        </>
      )}
    </button>
  );
}

export function ProdutoComExpansao({
  item,
  primeiro,
  possuiMaisItens,
  totalItens,
  expandido,
  onAlternarItens,
}) {
  return (
    <div className="compras-produto-linha">
      <span className="compras-produto-descricao">{obterDescricaoItem(item)}</span>

      {primeiro && possuiMaisItens && (
        <BotaoItens totalItens={totalItens} expandido={expandido} onClick={onAlternarItens} />
      )}
    </div>
  );
}
