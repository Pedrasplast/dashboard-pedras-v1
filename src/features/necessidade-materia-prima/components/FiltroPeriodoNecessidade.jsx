
import { FiRefreshCcw } from "react-icons/fi";

import "@/components/filtros/Filtros.css";

export default function FiltroPeriodoNecessidade({
  dataInicio,
  dataFim,
  setDataInicio,
  setDataFim,
  periodoAtivo,
  periodoInvalido,
  pedidosAbertos = [],
}) {
  const temFiltros = Boolean(dataInicio || dataFim);

  function onLimpar() {
    setDataInicio("");
    setDataFim("");
  }

  const totalPedidos = new Set(
    pedidosAbertos
      .map((pedido) =>
        String(
          pedido.codigo_pedido_omie ??
          pedido.numero_pedido ??
          "",
        ).trim(),
      )
      .filter(Boolean),
  ).size;

  return (
    <section
      className="necessidade-periodo"
      aria-label="Filtrar por previsão de faturamento"
    >
      <div className="necessidade-periodo-titulo">
        <strong>Previsão de faturamento</strong>
        <span>
          Selecione o intervalo para calcular a necessidade
          dos pedidos previstos no período.
        </span>
      </div>

      <div className="necessidade-periodo-campos">
        <label>
          De
          <input
            type="date"
            value={dataInicio || ""}
            max={dataFim || undefined}
            onChange={(evento) =>
              setDataInicio(evento.target.value)
            }
          />
        </label>

        <label>
          Até
          <input
            type="date"
            value={dataFim || ""}
            min={dataInicio || undefined}
            onChange={(evento) =>
              setDataFim(evento.target.value)
            }
          />
        </label>

        <button
          type="button"
          className={`filtros-compartilhados-limpar ${
            temFiltros ? "filtros-limpar-ativo" : ""
          }`}
          onClick={onLimpar}
          disabled={!temFiltros}
          aria-label="Limpar filtros de período"
        >
          <FiRefreshCcw size={15} aria-hidden="true" />
          Limpar filtros
        </button>
      </div>

      {periodoInvalido && (
        <p
          role="alert"
          className="necessidade-periodo-erro"
        >
          A data inicial deve ser anterior ou igual
          à data final.
        </p>
      )}

      {periodoAtivo && !periodoInvalido && (
        <p className="necessidade-periodo-contagem">
          {totalPedidos} pedido(s) com previsão de
          faturamento dentro do intervalo.
        </p>
      )}
    </section>
  );
}
