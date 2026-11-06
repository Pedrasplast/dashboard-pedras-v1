import { useMemo, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";

import MapaHorarios from "./components/MapaHorarios";
import PainelSituacao from "./components/PainelSituacao";
import RotinaItem from "./components/RotinaItem";
import {
  useBancoDados,
  useDefinirRotinaAtiva,
  usePainelDia,
  useRodarAgora,
  useRotinas,
} from "./hooks/useMonitoramento";
import { formatarDataHora, formatarMegabytes } from "./utils/monitoramento.utils";
import { ROTULO_NIVEL_BANCO, SITUACAO } from "./constants/monitoramento.constants";

import "./Monitoramento.css";

/* =========================================================
   MONITORAMENTO DAS ROTINAS (somente administradores)
========================================================= */

export default function MonitoramentoPage() {
  const {
    data: rotinas = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useRotinas();
  const { data: banco } = useBancoDados();
  const { data: painel, isLoading: carregandoPainel, refetch: atualizarPainel } = usePainelDia();
  const definirAtiva = useDefinirRotinaAtiva();
  const rodarAgora = useRodarAgora();
  const [soProblemas, setSoProblemas] = useState(false);
  const [aberta, setAberta] = useState(null);

  // "Próxima execução" é calculada a partir da hora da última consulta.
  const agora = useMemo(() => new Date(dataUpdatedAt || Date.now()), [dataUpdatedAt]);
  const rotinasOmie = useMemo(() => rotinas.filter((r) => r.monitorada), [rotinas]);

  const resumo = useMemo(
    () => ({
      total: rotinas.length,
      comErro: rotinas.filter((r) => r.situacao === SITUACAO.ERRO).length,
      falhas24h: rotinas.reduce((soma, r) => soma + Number(r.falhas_24h ?? 0), 0),
      chamadas24h: rotinas.reduce((soma, r) => soma + Number(r.chamadas_24h ?? 0), 0),
    }),
    [rotinas],
  );

  const visiveis = soProblemas
    ? rotinas.filter((r) => r.situacao === SITUACAO.ERRO || Number(r.falhas_24h) > 0)
    : rotinas;

  return (
    <div className="mon-page">
      <div className="mon-container">
        <PageHeader
          eyebrow="Administração"
          title="Monitoramento das rotinas"
          description="Rotinas automáticas que buscam dados do Omie e mantêm o sistema. Atualiza sozinha a cada 5 minutos."
          icon={Activity}
          actions={
            <button
              type="button"
              className="mon-botao"
              onClick={() => {
                refetch();
                atualizarPainel();
              }}
              disabled={isFetching}
            >
              <RefreshCw size={16} aria-hidden="true" className={isFetching ? "girando" : ""} />
              {isFetching ? "Atualizando…" : "Atualizar agora"}
            </button>
          }
        />

        <PainelSituacao painel={painel} carregando={carregandoPainel} />

        <section className="mon-resumo" aria-label="Resumo">
          <div
            className={`mon-resumo__item ${resumo.comErro ? "mon-resumo__item--erro" : "mon-resumo__item--ok"}`}
          >
            <strong>{resumo.comErro}</strong>
            <span>{resumo.comErro === 1 ? "rotina com erro agora" : "rotinas com erro agora"}</span>
          </div>
          <div className={`mon-resumo__item ${resumo.falhas24h ? "mon-resumo__item--alerta" : ""}`}>
            <strong>{resumo.falhas24h}</strong>
            <span>falhas nas últimas 24 h</span>
          </div>
          <div className="mon-resumo__item">
            <strong>{resumo.chamadas24h}</strong>
            <span>execuções registradas em 24 h</span>
          </div>
          <div className="mon-resumo__item">
            <strong>{resumo.total}</strong>
            <span>rotinas automáticas</span>
          </div>
          {banco && (
            <div
              className={`mon-resumo__item mon-banco mon-banco--${String(banco.nivel).toLowerCase()}`}
              title={`Medido ${formatarDataHora(banco.atualizado_em)}. Limite do plano free: ${formatarMegabytes(banco.limite_bytes)}.`}
            >
              <strong>
                {Number(banco.percentual).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
              </strong>
              <span>
                do banco usado · {formatarMegabytes(banco.tamanho_bytes)} de{" "}
                {formatarMegabytes(banco.limite_bytes)}
                {banco.nivel !== "OK" && ` · ${ROTULO_NIVEL_BANCO[banco.nivel] ?? banco.nivel}`}
              </span>
              <span className="mon-banco__barra" aria-hidden="true">
                <span
                  style={{ width: `${Math.min(100, Math.max(0, Number(banco.percentual) || 0))}%` }}
                />
              </span>
            </div>
          )}
        </section>

        <section className="mon-card">
          <div className="mon-card__topo">
            <label className="mon-filtro">
              <input
                type="checkbox"
                checked={soProblemas}
                onChange={(e) => setSoProblemas(e.target.checked)}
              />
              Mostrar só rotinas com erro ou falhas em 24 h
            </label>
            <span className="mon-legenda" aria-label="Legenda da linha do dia">
              Hoje:
              <span className="mon-linha-dia__marca mon-linha-dia__marca--o" /> ok
              <span className="mon-linha-dia__marca mon-linha-dia__marca--l" /> lenta
              <span className="mon-linha-dia__marca mon-linha-dia__marca--e" /> erro
            </span>
            {dataUpdatedAt > 0 && (
              <span className="mon-card__atualizado">
                Consultado às {formatarDataHora(dataUpdatedAt).slice(-5)}
              </span>
            )}
          </div>

          {isLoading && <p className="mon-vazio">Carregando rotinas…</p>}
          {isError && <p className="mon-vazio mon-texto-erro">{error.message}</p>}
          {definirAtiva.isError && (
            <p className="mon-vazio mon-texto-erro" role="alert">
              {definirAtiva.error.message}
            </p>
          )}
          {!isLoading && !isError && visiveis.length === 0 && (
            <p className="mon-vazio">Nenhuma rotina com problema. Tudo certo.</p>
          )}

          <ul className="mon-lista">
            {visiveis.map((rotina) => (
              <RotinaItem
                key={rotina.rotina}
                rotina={rotina}
                aberta={aberta === rotina.rotina}
                onAlternar={() => setAberta(aberta === rotina.rotina ? null : rotina.rotina)}
                agora={agora}
                execucoesHoje={painel?.linha?.[rotina.rotina]}
                definirAtiva={definirAtiva}
                rodarAgora={rodarAgora}
              />
            ))}
          </ul>
        </section>

        <details className="mon-card mon-mapa-card">
          <summary>
            <strong>Mapa de horários</strong>
            <span>Quais rotinas do Omie disparam em cada minuto, para achar horários livres.</span>
          </summary>
          <MapaHorarios rotinas={rotinasOmie} />
        </details>
      </div>
    </div>
  );
}
