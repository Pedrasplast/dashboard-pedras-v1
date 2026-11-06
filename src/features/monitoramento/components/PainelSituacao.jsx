import { Gauge, ListChecks } from "lucide-react";

import { avaliarOmie } from "../utils/diagnostico";
import { formatarDataHora, tempoDecorrido } from "../utils/monitoramento.utils";

/*
 * Topo da tela: termômetro do Omie (últimos 30 min) e progresso da
 * conferência completa de pedidos de compra. Dados de monitor_painel_dia().
 */
export default function PainelSituacao({ painel, carregando }) {
  const omie = avaliarOmie(painel?.termometro);
  const conferencia = painel?.conferencia ?? null;

  return (
    <section className="mon-painel" aria-label="Situação agora">
      <div className={`mon-painel__item mon-omie mon-omie--${omie.nivel}`}>
        <Gauge size={22} aria-hidden="true" className="mon-painel__icone" />
        <div>
          <strong>{carregando && !painel ? "Omie: lendo…" : omie.titulo}</strong>
          <span>{carregando && !painel ? "" : omie.detalhe}</span>
        </div>
      </div>

      <ProgressoConferencia conferencia={conferencia} />
    </section>
  );
}

function ProgressoConferencia({ conferencia }) {
  if (!conferencia) {
    return (
      <div className="mon-painel__item">
        <ListChecks size={22} aria-hidden="true" className="mon-painel__icone" />
        <div>
          <strong>Conferência completa de pedidos de compra</strong>
          <span>Sem informação.</span>
        </div>
      </div>
    );
  }

  const emAndamento = Boolean(conferencia.varredura_iniciada_em);
  const total = Number(conferencia.total_paginas_previstas) || 0;
  const lidas = Math.max(0, (Number(conferencia.pagina_proxima) || 1) - 1);
  const percentual = total > 0 ? Math.min(100, Math.round((lidas / total) * 100)) : 0;
  const comErro = String(conferencia.status ?? "").toLowerCase() === "erro";

  return (
    <div className={`mon-painel__item mon-conferencia ${comErro ? "mon-conferencia--erro" : ""}`}>
      <ListChecks size={22} aria-hidden="true" className="mon-painel__icone" />
      <div className="mon-conferencia__corpo">
        <strong>Conferência completa de pedidos de compra</strong>
        {emAndamento ? (
          <>
            <span>
              {total > 0 ? `Página ${lidas} de ${total} (${percentual}%)` : "Em andamento"} ·
              começou {formatarDataHora(conferencia.varredura_iniciada_em)}
            </span>
            {total > 0 && (
              <span className="mon-conferencia__barra" aria-hidden="true">
                <span style={{ width: `${percentual}%` }} />
              </span>
            )}
          </>
        ) : (
          <span>
            Nenhuma em andamento
            {conferencia.finalizado_em &&
              ` · última terminou ${formatarDataHora(conferencia.finalizado_em)} (${tempoDecorrido(conferencia.finalizado_em)})`}
          </span>
        )}
        {comErro && conferencia.mensagem && (
          <span className="mon-texto-erro">{conferencia.mensagem}</span>
        )}
      </div>
    </div>
  );
}
