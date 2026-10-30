import { formatarNumeroPtBR } from "@/shared/lib/formatar";

import { TIPOS_FRETE } from "../comprasFuturas.regras";

import CampoNumeroCompra from "./CampoNumeroCompra";

function formatarMoeda(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return formatarNumeroPtBR(Number(valor), {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarPrecoKg(valor) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return `${formatarNumeroPtBR(Number(valor), {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  })}/kg`;
}

export default function SecaoValoresCompra({
  formulario,
  resumoFinanceiro,
  salvando,
  alterarCampo,
  alterarTipoFrete,
}) {
  return (
    <section className="compra-futura-modal-secao compra-futura-modal-secao-financeira">
      <div className="compra-futura-modal-secao-titulo">
        <strong>Valores e custos</strong>

        <span>Preencha o que estiver disponível. Os totais são calculados automaticamente.</span>
      </div>

      <div className="compra-futura-modal-grid compra-futura-modal-grid-3">
        <CampoNumeroCompra
          titulo="Preço unitário"
          value={formulario.precoUnitario}
          onChange={(valor) => alterarCampo("precoUnitario", valor)}
          placeholder="Ex.: 4,25"
          sufixo="R$/kg"
          disabled={salvando}
        />

        <CampoNumeroCompra
          titulo="IPI"
          value={formulario.ipiPercentual}
          onChange={(valor) => alterarCampo("ipiPercentual", valor)}
          placeholder="Ex.: 5"
          sufixo="%"
          disabled={salvando}
        />

        <label className="compra-futura-modal-campo">
          <span>Tipo de frete</span>

          <select
            value={formulario.tipoFrete}
            onChange={(event) => alterarTipoFrete(event.target.value)}
            disabled={salvando}
          >
            {TIPOS_FRETE.map((tipo) => (
              <option key={tipo.valor || "NAO_INFORMADO"} value={tipo.valor}>
                {tipo.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="compra-futura-modal-grid compra-futura-modal-grid-3">
        <CampoNumeroCompra
          titulo="Valor do frete"
          value={formulario.valorFrete}
          onChange={(valor) => alterarCampo("valorFrete", valor)}
          placeholder="Ex.: 1200,00"
          sufixo="R$"
          disabled={salvando || formulario.tipoFrete === "SEM_FRETE"}
        />

        <CampoNumeroCompra
          titulo="Desconto"
          value={formulario.valorDesconto}
          onChange={(valor) => alterarCampo("valorDesconto", valor)}
          placeholder="Ex.: 500,00"
          sufixo="R$"
          disabled={salvando}
        />

        <CampoNumeroCompra
          titulo="Outras despesas"
          value={formulario.outrasDespesas}
          onChange={(valor) => alterarCampo("outrasDespesas", valor)}
          placeholder="Ex.: 0,00"
          sufixo="R$"
          disabled={salvando}
        />
      </div>

      <div className="compra-futura-modal-resumo">
        <div>
          <span>Subtotal</span>

          <strong>{formatarMoeda(resumoFinanceiro.subtotalProdutos)}</strong>
        </div>

        <div>
          <span>Valor do IPI</span>

          <strong>{formatarMoeda(resumoFinanceiro.valorIpi)}</strong>
        </div>

        <div className="compra-futura-modal-resumo-destaque">
          <span>Total da compra</span>

          <strong>{formatarMoeda(resumoFinanceiro.valorTotal)}</strong>
        </div>

        <div>
          <span>Custo efetivo</span>

          <strong>{formatarPrecoKg(resumoFinanceiro.custoEfetivoKg)}</strong>
        </div>
      </div>

      {!resumoFinanceiro.precoUnitario && (
        <p className="compra-futura-modal-ajuda">
          Informe o preço unitário para calcular subtotal, total e custo efetivo por kg.
        </p>
      )}

      <div className="compra-futura-modal-grid">
        <label className="compra-futura-modal-campo">
          <span>Número da NF</span>

          <input
            type="text"
            value={formulario.numeroNf}
            onChange={(event) => alterarCampo("numeroNf", event.target.value)}
            placeholder="Ex.: 123456"
            disabled={salvando}
          />
        </label>

        <label className="compra-futura-modal-campo">
          <span>Condição de pagamento</span>

          <input
            type="text"
            value={formulario.condicaoPagamento}
            onChange={(event) => alterarCampo("condicaoPagamento", event.target.value)}
            placeholder="Ex.: 30/60 dias"
            disabled={salvando}
          />
        </label>
      </div>

      <label className="compra-futura-modal-campo">
        <span>Observação financeira</span>

        <textarea
          rows={3}
          value={formulario.observacaoFinanceira}
          onChange={(event) => alterarCampo("observacaoFinanceira", event.target.value)}
          placeholder="Condições comerciais, ajustes, créditos ou informações fiscais..."
          disabled={salvando}
        />
      </label>
    </section>
  );
}
