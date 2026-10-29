import { Check, ChevronLeft, ChevronRight } from "lucide-react";

import { DIAS_SEMANA, NOMES_MESES, formatarMinutos } from "../programacaoModal.utils";
import { descreverDiaCalendario } from "../programacaoModal.dias";

import { formatarDataISOLocal } from "@/shared/lib/datas";

function ConteudoDia({ situacao, programado, marcado }) {
  const { passado, fechado, feriado, nomeFeriado, hoje, disponibilidadeCard } = situacao;

  if (passado) {
    return (
      <>
        <span className="programacao-calendario-status-passado">Encerrado</span>

        <small>Dia anterior</small>
      </>
    );
  }

  if (fechado) {
    return (
      <>
        <strong className="programacao-calendario-status-fechado">Sem produção</strong>

        <small>{feriado ? nomeFeriado || "Feriado" : "Bloqueado"}</small>
      </>
    );
  }

  if (programado) {
    return (
      <>
        <strong className="programacao-calendario-horas-programadas">
          {Number(programado.minutosSolicitados ?? 0) > 0
            ? formatarMinutos(programado.minutosSolicitados)
            : "Defina horas"}
        </strong>

        {hoje && programado.minutosDescontados > 0 ? (
          <small>{formatarMinutos(programado.minutosEfetivos)} efetivas</small>
        ) : (
          <small>Programado</small>
        )}

        <span
          className={
            programado.receitaId
              ? "programacao-calendario-dia-receita definida"
              : "programacao-calendario-dia-receita pendente"
          }
          title={programado.receitaNome || "Receita pendente"}
        >
          {programado.receitaNome || "Receita pendente"}
        </span>
      </>
    );
  }

  if (marcado) {
    return (
      <>
        <strong className="programacao-calendario-definir">Selecionado</strong>

        <small>Defina a jornada</small>
      </>
    );
  }

  return (
    <>
      <span className="programacao-calendario-disponibilidade">
        {disponibilidadeCard || "Disponível"}
      </span>

      <strong className="programacao-calendario-adicionar">+ Selecionar</strong>
    </>
  );
}

function DiaCalendario({ data, situacao, programado, marcado, desabilitado, onClick }) {
  const { passado, hoje, foraMes, fechado, feriado } = situacao;

  return (
    <button
      type="button"
      className={[
        "programacao-calendario-dia",

        programado ? "programado" : "",

        marcado ? "marcado" : "",

        hoje ? "hoje" : "",

        foraMes ? "fora-mes" : "",

        passado ? "passado" : "",

        fechado ? "indisponivel" : "",

        feriado ? "feriado" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      disabled={passado || fechado || desabilitado}
    >
      <div className="programacao-calendario-dia-topo">
        <strong>{data.getDate()}</strong>

        <div className="programacao-calendario-dia-badges">
          {hoje && <span className="programacao-calendario-hoje-badge">Hoje</span>}

          {feriado && <span className="programacao-calendario-feriado-badge">Feriado</span>}

          {marcado && (
            <span className="programacao-calendario-check">
              <Check size={12} strokeWidth={3} />
            </span>
          )}
        </div>
      </div>

      <div className="programacao-calendario-dia-conteudo">
        <ConteudoDia situacao={situacao} programado={programado} marcado={marcado} />
      </div>
    </button>
  );
}

/** Bloco 02: navegação entre meses, legenda e a grade de dias. */
export default function CalendarioProducao({
  mesReferencia,
  diasGrade,
  hojeISO,
  calendarioPorData,
  diasCalculadosPorData,
  marcadasSet,
  carregandoCalendario,
  onMesAnterior,
  onMesAtual,
  onProximoMes,
  onAlternarDia,
}) {
  return (
    <section className="programacao-calendario-bloco">
      <div className="programacao-calendario-cabecalho">
        <div className="programacao-calendario-cabecalho-texto">
          <span className="programacao-calendario-eyebrow">02 · Calendário de produção</span>

          <strong>
            {NOMES_MESES[mesReferencia.getMonth()]} {mesReferencia.getFullYear()}
          </strong>

          <p>
            Clique nos dias disponíveis. Depois aplique 5h, 17h, 22h, 24h ou uma jornada
            personalizada.
          </p>
        </div>

        <div className="programacao-calendario-navegacao">
          <button type="button" onClick={onMesAnterior} aria-label="Mês anterior">
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            className="programacao-calendario-navegacao-hoje"
            onClick={onMesAtual}
          >
            Hoje
          </button>

          <button type="button" onClick={onProximoMes} aria-label="Próximo mês">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="programacao-calendario-legenda">
        <span>
          <i className="disponivel" />
          Disponível
        </span>

        <span>
          <i className="selecionado" />
          Selecionado
        </span>

        <span>
          <i className="programado" />
          Programado
        </span>

        <span>
          <i className="fechado" />
          Sem produção
        </span>
      </div>

      <div className="programacao-calendario-grade">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="programacao-calendario-semana">
            {dia}
          </div>
        ))}

        {diasGrade.map((data) => {
          const dataISO = formatarDataISOLocal(data);

          return (
            <DiaCalendario
              key={dataISO}
              data={data}
              situacao={descreverDiaCalendario({
                data,
                dataISO,
                configuracao: calendarioPorData.get(dataISO),
                hojeISO,
                mesReferencia,
              })}
              programado={diasCalculadosPorData.get(dataISO)}
              marcado={marcadasSet.has(dataISO)}
              desabilitado={carregandoCalendario}
              onClick={() => onAlternarDia(dataISO)}
            />
          );
        })}
      </div>
    </section>
  );
}
