import { RotateCcw } from "lucide-react";

import { PERIODO_EMISSAO, PERIODO_RECEBIDO } from "../utils/entradasUtils";

export default function EntradasPeriodo({
  filtros,
  descricao,
  onChange,
  onLimpar,
  possuiFiltroAtivo,
}) {
  const { periodoPor, dataDe, dataAte } = filtros;

  return (
    <div className="entradas-pp-periodo">
      <label className="entradas-pp-periodo-tipo">
        <span>Filtrar período por</span>

        <select value={periodoPor} onChange={(event) => onChange("periodoPor", event.target.value)}>
          <option value={PERIODO_RECEBIDO}>Data de recebimento</option>
          <option value={PERIODO_EMISSAO}>Data de emissão</option>
        </select>
      </label>

      <div className="entradas-pp-periodo-info">{descricao}</div>

      <div className="entradas-pp-periodo-datas">
        <label>
          <span>De</span>
          <input
            type="date"
            value={dataDe}
            max={dataAte || undefined}
            onChange={(event) => onChange("dataDe", event.target.value)}
          />
        </label>

        <label>
          <span>Até</span>
          <input
            type="date"
            value={dataAte}
            min={dataDe || undefined}
            onChange={(event) => onChange("dataAte", event.target.value)}
          />
        </label>

        <button
          type="button"
          className="entradas-pp-limpar"
          onClick={onLimpar}
          disabled={!possuiFiltroAtivo}
        >
          <RotateCcw size={14} aria-hidden="true" />
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
