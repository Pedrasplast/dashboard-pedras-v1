import { useMemo, useState } from "react";

import { mapaDaHora } from "../utils/diagnostico";

/*
 * Mapa de horários de um dia útil: para a hora escolhida, quais rotinas
 * disparam em cada minuto. Colunas com 3 ou mais rotinas juntas ficam
 * destacadas (horário cheio). Tudo calculado das agendas, sem consulta.
 */
const HORAS = Array.from({ length: 24 }, (_, h) => h);
const MINUTOS = Array.from({ length: 60 }, (_, m) => m);
const LIMITE_CHEIO = 3;

const dois = (n) => String(n).padStart(2, "0");

function horaAtualBrasilia() {
  return (new Date().getUTCHours() + 21) % 24;
}

export default function MapaHorarios({ rotinas }) {
  const [hora, setHora] = useState(horaAtualBrasilia);

  const { linhas, contagem } = useMemo(() => mapaDaHora(rotinas, hora), [rotinas, hora]);

  return (
    <div className="mon-mapa">
      <div className="mon-mapa__topo">
        <label className="mon-mapa__hora">
          Hora (dia útil)
          <select value={hora} onChange={(e) => setHora(Number(e.target.value))}>
            {HORAS.map((h) => (
              <option key={h} value={h}>
                {dois(h)}:00 – {dois(h)}:59
              </option>
            ))}
          </select>
        </label>
        <span className="mon-mapa__legenda">
          <span className="mon-mapa__cel mon-mapa__cel--sim" /> roda
          <span className="mon-mapa__cel mon-mapa__cel--cheio" /> 3 ou mais juntas
          <span className="mon-mapa__cel mon-mapa__cel--pausada" /> pausada
        </span>
      </div>

      {linhas.length === 0 ? (
        <p className="mon-historico__vazio">Nenhuma rotina roda nesta hora em dia útil.</p>
      ) : (
        <div className="mon-mapa__rolagem">
          <table className="mon-mapa__tabela">
            <thead>
              <tr>
                <th scope="col">Rotina</th>
                {MINUTOS.map((m) => (
                  <th
                    key={m}
                    scope="col"
                    className={contagem[m] >= LIMITE_CHEIO ? "mon-mapa__col--cheio" : ""}
                  >
                    {m % 5 === 0 ? dois(m) : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => (
                <tr key={linha.rotina}>
                  <th scope="row" title={linha.nome}>
                    {linha.nome}
                  </th>
                  {MINUTOS.map((m) => {
                    const roda = linha.minutos.has(m);
                    const classe = !roda
                      ? ""
                      : !linha.ativa
                        ? "mon-mapa__cel--pausada"
                        : contagem[m] >= LIMITE_CHEIO
                          ? "mon-mapa__cel--cheio"
                          : "mon-mapa__cel--sim";
                    return (
                      <td
                        key={m}
                        className={classe}
                        title={roda ? `${dois(hora)}:${dois(m)} · ${linha.nome}` : undefined}
                      />
                    );
                  })}
                </tr>
              ))}
              <tr className="mon-mapa__total">
                <th scope="row">Juntas no minuto</th>
                {MINUTOS.map((m) => (
                  <td key={m} className={contagem[m] >= LIMITE_CHEIO ? "mon-mapa__col--cheio" : ""}>
                    {contagem[m] || ""}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
