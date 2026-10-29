import { formatarKg, formatarMinutos, formatarNumero } from "../programacaoModal.utils";

/** Bloco 03: dias, horas efetivas, peças e consumo previstos. */
export default function ResumoProgramacao({ quantidadeDias, calculo }) {
  const plural = quantidadeDias === 1 ? "" : "S";

  return (
    <section className="programacao-calendario-resumo-bloco">
      <div className="programacao-calendario-resumo-cabecalho">
        <div>
          <span className="programacao-calendario-eyebrow">03 · Resultado da programação</span>

          <strong>Resumo operacional</strong>
        </div>

        <span className="programacao-calendario-resumo-situacao">
          {quantidadeDias > 0
            ? `${quantidadeDias} DIA${plural} PROGRAMADO${plural}`
            : "AGUARDANDO PROGRAMAÇÃO"}
        </span>
      </div>

      <div className="programacao-calendario-resumo">
        <div className="dias">
          <span>Dias programados</span>

          <strong>{quantidadeDias}</strong>

          <small>dias de produção</small>
        </div>

        <div className="horas">
          <span>Horas efetivas</span>

          <strong>{formatarMinutos(calculo.minutosEfetivos)}</strong>

          <small>tempo produtivo</small>
        </div>

        <div className="pecas">
          <span>Peças previstas</span>

          <strong>{formatarNumero(calculo.pecasPrevistas)}</strong>

          <small>produção estimada</small>
        </div>

        <div className="pp">
          <span>Consumo previsto</span>

          <strong>{formatarKg(calculo.consumoPeriodoKg)}</strong>

          <small>consumo projetado</small>
        </div>
      </div>
    </section>
  );
}
