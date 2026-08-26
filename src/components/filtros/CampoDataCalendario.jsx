import { memo } from "react";
import { DayPicker } from "@daypicker/react";
import { ptBR } from "@daypicker/react/locale";

import "@daypicker/react/style.css";

const MODIFIERS_CLASS_NAMES = Object.freeze({
  comDados: "calendar-day-has-data",
});

function CampoDataCalendario({
  titulo,
  valorVisual,
  aberto,
  desabilitado,
  onAlternar,
  dataSelecionada,
  onSelecionar,
  desabilitarData,
  dataPossuiRegistro,
  mesInicial,
  primeiraData,
  ultimaData,
}) {
  return (
    <div className="calendar-field">
      <button
        type="button"
        className="calendar-trigger"
        disabled={desabilitado}
        onClick={onAlternar}
      >
        <span>{titulo}</span>
        <strong>{valorVisual || "Selecionar"}</strong>
      </button>

      {aberto && (
        <div className="calendar-popover">
          <DayPicker
            mode="single"
            locale={ptBR}
            selected={dataSelecionada}
            onSelect={onSelecionar}
            disabled={desabilitarData}
            modifiers={{ comDados: dataPossuiRegistro }}
            modifiersClassNames={MODIFIERS_CLASS_NAMES}
            defaultMonth={mesInicial}
            startMonth={primeiraData}
            endMonth={ultimaData}
            showOutsideDays={false}
          />

          <small className="calendar-info">
            Somente dias com dados podem ser selecionados.
          </small>
        </div>
      )}
    </div>
  );
}

export default memo(CampoDataCalendario);
