import { Ban, CalendarDays, CheckCircle2, Clock3 } from "lucide-react";

export default function ResumoCalendario({ indicadores }) {
  return (
    <section className="administracao-resumo-grid" aria-label="Resumo do calendário">
      <article className="administracao-resumo-card">
        <span className="administracao-resumo-icone vermelho">
          <Ban size={18} aria-hidden="true" />
        </span>
        <div>
          <span className="administracao-resumo-label">Dias bloqueados</span>
          <strong>{indicadores.bloqueados}</strong>
        </div>
      </article>

      <article className="administracao-resumo-card">
        <span className="administracao-resumo-icone azul">
          <CalendarDays size={18} aria-hidden="true" />
        </span>
        <div>
          <span className="administracao-resumo-label">Feriados nacionais</span>
          <strong>{indicadores.feriadosAutomaticos}</strong>
        </div>
      </article>

      <article className="administracao-resumo-card">
        <span className="administracao-resumo-icone amarelo">
          <Clock3 size={18} aria-hidden="true" />
        </span>
        <div>
          <span className="administracao-resumo-label">Exceções manuais</span>
          <strong>{indicadores.manuais}</strong>
        </div>
      </article>

      <article className="administracao-resumo-card">
        <span className="administracao-resumo-icone verde">
          <CheckCircle2 size={18} aria-hidden="true" />
        </span>
        <div>
          <span className="administracao-resumo-label">Liberações 24h</span>
          <strong>{indicadores.liberacoes}</strong>
        </div>
      </article>
    </section>
  );
}
