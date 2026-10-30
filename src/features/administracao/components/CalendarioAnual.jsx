import { memo, useMemo } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  DIAS_SEMANA,
  NOMES_MESES,
  descreverDiaCalendario,
  obterDiasDoMes,
} from "../calendarioIndustrial.regras";

// memo: cada mês tem até 42 células, e a tela muda por motivos que não afetam o calendário
// (mensagem de retorno, modal do dia aberto).
const MesCalendario = memo(function MesCalendario({
  nomeMes,
  ano,
  mes,
  mapaCalendario,
  hojeIso,
  onAbrirDia,
}) {
  const dias = useMemo(() => obterDiasDoMes(ano, mes), [ano, mes]);

  return (
    <article className="administracao-mes-card">
      <header className="administracao-mes-header">
        <h3>{nomeMes}</h3>
      </header>

      <div className="administracao-semana-header" aria-hidden="true">
        {DIAS_SEMANA.map((dia, indice) => (
          <span key={`${dia}-${indice}`}>{dia}</span>
        ))}
      </div>

      <div className="administracao-dias-grid">
        {dias.map((dia, indice) => {
          if (!dia) {
            return (
              <span
                key={`vazio-${indice}`}
                className="administracao-dia-vazio"
                aria-hidden="true"
              />
            );
          }

          const { temExcecao, perfil, automatico, classes, titulo } = descreverDiaCalendario(
            dia,
            mapaCalendario.get(dia.data),
            hojeIso,
          );

          return (
            <button
              key={dia.data}
              type="button"
              className={classes}
              onClick={() => onAbrirDia(dia.data)}
              title={titulo}
            >
              <span className="administracao-dia-numero">{dia.dia}</span>

              {automatico && <span className="administracao-dia-marca">F</span>}

              {temExcecao && !automatico && (
                <span className="administracao-dia-marca">
                  {perfil === "SEM_PRODUCAO" ? "×" : perfil}
                </span>
              )}

              {!temExcecao && perfil === "24H" && (
                <span className="administracao-dia-marca administracao-dia-marca-padrao">24H</span>
              )}
            </button>
          );
        })}
      </div>
    </article>
  );
});

export default function CalendarioAnual({
  ano,
  setAno,
  loading,
  mapaCalendario,
  hojeIso,
  onAbrirDia,
}) {
  return (
    <section className="administracao-calendario-section">
      <div className="administracao-section-header">
        <div>
          <span className="administracao-section-eyebrow">Planejamento anual</span>
          <h2>Calendário {ano}</h2>
          <p>Clique em qualquer dia para bloquear, reduzir horas ou liberar uma exceção.</p>
        </div>

        <div className="administracao-ano-controle" aria-label="Selecionar ano">
          <button
            type="button"
            onClick={() => setAno((valor) => valor - 1)}
            aria-label="Ano anterior"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>

          <strong>{ano}</strong>

          <button
            type="button"
            onClick={() => setAno((valor) => valor + 1)}
            aria-label="Próximo ano"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="administracao-legenda">
        <span>
          <i className="legenda-dot padrao" />
          Padrão 24h
        </span>
        <span>
          <i className="legenda-dot bloqueado" />
          Sem produção
        </span>
        <span>
          <i className="legenda-dot parcial" />
          Jornada especial
        </span>
        <span>
          <i className="legenda-dot liberado" />
          Liberação 24h
        </span>
        <span>
          <i className="legenda-dot feriado" />
          Feriado nacional
        </span>
      </div>

      {loading ? (
        <div className="administracao-loading">Carregando calendário industrial...</div>
      ) : (
        <div className="administracao-meses-grid">
          {NOMES_MESES.map((nomeMes, mes) => (
            <MesCalendario
              key={nomeMes}
              nomeMes={nomeMes}
              ano={ano}
              mes={mes}
              mapaCalendario={mapaCalendario}
              hojeIso={hojeIso}
              onAbrirDia={onAbrirDia}
            />
          ))}
        </div>
      )}
    </section>
  );
}
