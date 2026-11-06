import { useState } from "react";
import { Pause } from "lucide-react";

import { OPCOES_PAUSA } from "../constants/monitoramento.constants";
import { calcularRetomarEm } from "../utils/diagnostico";

/* Formulário curto da pausa: motivo (opcional) e até quando. */
export default function PausaFormulario({ nome, processando, onConfirmar, onCancelar }) {
  const [motivo, setMotivo] = useState("");
  const [opcaoId, setOpcaoId] = useState(OPCOES_PAUSA[0].id);

  function confirmar(evento) {
    evento.preventDefault();
    const opcao = OPCOES_PAUSA.find((o) => o.id === opcaoId);
    onConfirmar({ motivo: motivo.trim(), retomarEm: calcularRetomarEm(opcao, new Date()) });
  }

  return (
    <form className="mon-pausa-form" onSubmit={confirmar} aria-label={`Pausar ${nome}`}>
      <label className="mon-pausa-form__campo">
        <span>Motivo (opcional)</span>
        <input
          type="text"
          value={motivo}
          maxLength={300}
          placeholder="Ex.: Omie lento"
          onChange={(e) => setMotivo(e.target.value)}
        />
      </label>

      <label className="mon-pausa-form__campo">
        <span>Até quando</span>
        <select value={opcaoId} onChange={(e) => setOpcaoId(e.target.value)}>
          {OPCOES_PAUSA.map((opcao) => (
            <option key={opcao.id} value={opcao.id}>
              {opcao.rotulo}
            </option>
          ))}
        </select>
      </label>

      <div className="mon-pausa-form__botoes">
        <button type="submit" className="mon-botao mon-botao--alerta" disabled={processando}>
          <Pause size={14} aria-hidden="true" />
          {processando ? "Pausando…" : "Pausar"}
        </button>
        <button type="button" className="mon-botao" onClick={onCancelar} disabled={processando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
