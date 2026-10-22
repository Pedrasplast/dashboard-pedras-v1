import { useMemo, useState } from "react";
import { Activity, ChevronDown, RefreshCw } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";

import HistoricoRotina from "./components/HistoricoRotina";
import { useBancoDados, useRotinas } from "./hooks/useMonitoramento";
import {
  descreverAgenda,
  formatarDataHora,
  formatarMegabytes,
  tempoDecorrido,
} from "./utils/monitoramento.utils";
import {
  ROTULO_NIVEL_BANCO,
  ROTULO_SITUACAO,
  SITUACAO,
} from "./constants/monitoramento.constants";

import "./Monitoramento.css";

/* =========================================================
   MONITORAMENTO DAS ROTINAS (somente administradores)
========================================================= */

export default function MonitoramentoPage() {
  const { data: rotinas = [], isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useRotinas();
  const { data: banco } = useBancoDados();
  const [soProblemas, setSoProblemas] = useState(false);
  const [aberta, setAberta] = useState(null);

  const resumo = useMemo(() => ({
    total: rotinas.length,
    comErro: rotinas.filter((r) => r.situacao === SITUACAO.ERRO).length,
    falhas24h: rotinas.reduce((soma, r) => soma + Number(r.falhas_24h ?? 0), 0),
    chamadas24h: rotinas.reduce((soma, r) => soma + Number(r.chamadas_24h ?? 0), 0),
  }), [rotinas]);

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
          actions={(
            <button
              type="button"
              className="mon-botao"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw size={16} aria-hidden="true" className={isFetching ? "mon-girando" : ""} />
              {isFetching ? "Atualizando…" : "Atualizar agora"}
            </button>
          )}
        />

        <section className="mon-resumo" aria-label="Resumo">
          <div className={`mon-resumo__item ${resumo.comErro ? "mon-resumo__item--erro" : "mon-resumo__item--ok"}`}>
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
              <strong>{Number(banco.percentual).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</strong>
              <span>
                do banco usado · {formatarMegabytes(banco.tamanho_bytes)} de {formatarMegabytes(banco.limite_bytes)}
                {banco.nivel !== "OK" && ` · ${ROTULO_NIVEL_BANCO[banco.nivel] ?? banco.nivel}`}
              </span>
              <span className="mon-banco__barra" aria-hidden="true">
                <span style={{ width: `${Math.min(100, Math.max(0, Number(banco.percentual) || 0))}%` }} />
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
            {dataUpdatedAt > 0 && (
              <span className="mon-card__atualizado">
                Consultado às {formatarDataHora(dataUpdatedAt).slice(-5)}
              </span>
            )}
          </div>

          {isLoading && <p className="mon-vazio">Carregando rotinas…</p>}
          {isError && <p className="mon-vazio mon-texto-erro">{error.message}</p>}
          {!isLoading && !isError && visiveis.length === 0 && (
            <p className="mon-vazio">Nenhuma rotina com problema. Tudo certo.</p>
          )}

          <ul className="mon-lista">
            {visiveis.map((rotina) => {
              const estaAberta = aberta === rotina.rotina;
              const ultima = rotina.ultima_chamada ?? rotina.ultima_execucao;
              return (
                <li key={rotina.rotina} className={`mon-rotina mon-rotina--${rotina.situacao}`}>
                  <button
                    type="button"
                    className="mon-rotina__cabecalho"
                    aria-expanded={estaAberta}
                    onClick={() => setAberta(estaAberta ? null : rotina.rotina)}
                  >
                    <span className={`mon-selo mon-selo--${rotina.situacao}`}>
                      {ROTULO_SITUACAO[rotina.situacao]}
                    </span>

                    <span className="mon-rotina__nome">
                      <strong>{rotina.nome}</strong>
                      <small>{descreverAgenda(rotina.agenda)}</small>
                    </span>

                    <span className="mon-rotina__ultima">
                      <small>Última execução</small>
                      <strong>{ultima ? formatarDataHora(ultima) : "—"}</strong>
                      <small>{tempoDecorrido(ultima)}</small>
                    </span>

                    <span className="mon-rotina__falhas">
                      <small>Falhas 24 h</small>
                      <strong className={Number(rotina.falhas_24h) > 0 ? "mon-texto-erro" : ""}>
                        {rotina.monitorada
                          ? `${rotina.falhas_24h} de ${rotina.chamadas_24h}`
                          : "—"}
                      </strong>
                    </span>

                    <ChevronDown size={18} aria-hidden="true" className="mon-rotina__seta" />
                  </button>

                  {rotina.mensagem_erro && (
                    <p className="mon-rotina__erro">
                      <strong>Erro:</strong> {rotina.mensagem_erro}
                      {rotina.ultimo_sucesso_em && (
                        <span> · último sucesso {formatarDataHora(rotina.ultimo_sucesso_em)} ({tempoDecorrido(rotina.ultimo_sucesso_em)})</span>
                      )}
                    </p>
                  )}

                  {estaAberta && (
                    <div className="mon-rotina__detalhe">
                      {rotina.descricao && <p className="mon-rotina__descricao">{rotina.descricao}</p>}
                      <HistoricoRotina rotina={rotina.rotina} monitorada={rotina.monitorada} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
