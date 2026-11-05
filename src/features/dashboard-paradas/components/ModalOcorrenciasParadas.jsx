import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";
import { memo, useCallback, useMemo } from "react";

import { Activity, CirclePause, Clock3, Factory, Search, Timer, X } from "lucide-react";

import { formatarDuracaoResumida } from "../dashboardParadas.utils";

import {
  formatarDataInstante,
  formatarDataRegistro,
  formatarHorarioRegistro,
  obterDuracaoSegundos,
  obterInjetoraRegistro,
  obterMotivoRegistro,
} from "../ocorrenciasParadas.utils";

import "./ModalOcorrenciasParadas.css";
import { formatarNumero as formatarNumeroBase } from "@/shared/lib/formatar";

/* =========================================================
   FORMATAÇÕES
========================================================= */

function formatarNumero(valor) {
  return formatarNumeroBase(valor, { maximo: 0 });
}

function formatarDuracaoHHMMSS(segundos) {
  const total = Math.max(0, Math.floor(Number(segundos) || 0));

  const horas = Math.floor(total / 3600);

  const minutos = Math.floor((total % 3600) / 60);

  const segundosRestantes = total % 60;

  return [
    String(horas).padStart(2, "0"),

    String(minutos).padStart(2, "0"),

    String(segundosRestantes).padStart(2, "0"),
  ].join(":");
}

/* =========================================================
   MODAL REUTILIZÁVEL
========================================================= */

function ModalOcorrenciasParadas({
  aberto = false,
  titulo = "",
  subtitulo = "Dados conforme os filtros atuais",
  eyebrow = "Análise detalhada",
  ocorrencias = [],
  onFechar,
  icone,
}) {
  const Icone = icone || CirclePause;

  /* =======================================================
     FECHAR
  ======================================================= */

  const fechar = useCallback(() => {
    if (typeof onFechar === "function") {
      onFechar();
    }
  }, [onFechar]);

  /* =======================================================
     BASE
  ======================================================= */

  const lista = useMemo(() => (Array.isArray(ocorrencias) ? ocorrencias : []), [ocorrencias]);

  /* =======================================================
     RESUMO
  ======================================================= */

  const resumo = useMemo(() => {
    let totalSegundos = 0;

    const injetoras = new Set();

    for (const registro of lista) {
      totalSegundos += obterDuracaoSegundos(registro);

      const injetora = obterInjetoraRegistro(registro);

      if (injetora) {
        injetoras.add(injetora);
      }
    }

    return {
      total: lista.length,

      totalSegundos,

      mediaSegundos: lista.length > 0 ? totalSegundos / lista.length : 0,

      injetoras: injetoras.size,
    };
  }, [lista]);

  if (!aberto) {
    return null;
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Modal
      asChild
      aberto={aberto}
      onFechar={fechar}
      bloqueado={false}
      tamanho="amplo"
      overlayClassName="dp-ocorrencias-overlay-tela"
      fecharAoClicarFora={true}
    >
      <section
        className="dp-ocorrencias-modal dp-ocorrencias-modal--novo"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dp-ocorrencias-titulo"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* ===============================================
            CABEÇALHO
        =============================================== */}

        <header className="dp-ocorrencias-header dp-ocorrencias-header--novo" data-modal-header="">
          <div className="dp-ocorrencias-header-conteudo">
            <div className="dp-ocorrencias-header-icon" data-modal-icone="">
              <Icone size={20} strokeWidth={2} aria-hidden="true" />
            </div>

            <div>
              <span className="dp-ocorrencias-eyebrow">{eyebrow}</span>

              <ModalTitulo>
                <h3 id="dp-ocorrencias-titulo">{titulo}</h3>
              </ModalTitulo>

              <div className="dp-ocorrencias-header-meta">
                <span>{formatarNumero(resumo.total)} ocorrência(s)</span>

                <i />

                <span>{subtitulo}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="dp-ocorrencias-fechar"
            onClick={fechar}
            aria-label="Fechar"
            data-modal-fechar=""
          >
            <X size={19} />
          </button>
        </header>

        {/* ===============================================
            INDICADORES
        =============================================== */}

        <div className="dp-ocorrencias-resumo dp-ocorrencias-resumo--novo">
          <article className="dp-ocorrencias-kpi dp-ocorrencias-kpi--ocorrencias">
            <div className="dp-ocorrencias-kpi__icon" data-modal-icone="">
              <Activity size={18} strokeWidth={2} aria-hidden="true" />
            </div>

            <div className="dp-ocorrencias-kpi__conteudo">
              <span>Total de ocorrências</span>

              <strong>{formatarNumero(resumo.total)}</strong>

              <small>registros no recorte atual</small>
            </div>
          </article>

          <article className="dp-ocorrencias-kpi dp-ocorrencias-kpi--tempo">
            <div className="dp-ocorrencias-kpi__icon" data-modal-icone="">
              <Clock3 size={18} strokeWidth={2} aria-hidden="true" />
            </div>

            <div className="dp-ocorrencias-kpi__conteudo">
              <span>Tempo total parado</span>

              <strong>{formatarDuracaoResumida(resumo.totalSegundos)}</strong>

              <small>impacto acumulado</small>
            </div>
          </article>

          <article className="dp-ocorrencias-kpi dp-ocorrencias-kpi--media">
            <div className="dp-ocorrencias-kpi__icon" data-modal-icone="">
              <Timer size={18} strokeWidth={2} aria-hidden="true" />
            </div>

            <div className="dp-ocorrencias-kpi__conteudo">
              <span>Tempo médio</span>

              <strong>{formatarDuracaoResumida(resumo.mediaSegundos)}</strong>

              <small>média por ocorrência</small>
            </div>
          </article>

          <article className="dp-ocorrencias-kpi dp-ocorrencias-kpi--maquinas">
            <div className="dp-ocorrencias-kpi__icon" data-modal-icone="">
              <Factory size={18} strokeWidth={2} aria-hidden="true" />
            </div>

            <div className="dp-ocorrencias-kpi__conteudo">
              <span>Injetoras afetadas</span>

              <strong>{resumo.injetoras}</strong>

              <small>máquinas diferentes</small>
            </div>
          </article>
        </div>

        {/* ===============================================
            TABELA COMPLETA COM ROLAGEM
        =============================================== */}

        <div className="dp-ocorrencias-tabela-wrap">
          <table className="dp-ocorrencias-tabela dp-ocorrencias-tabela--novo">
            <thead>
              <tr>
                <th className="dp-ocorrencias-col-numero">#</th>

                <th>Data início</th>
                <th>Data fim</th>
                <th>Injetora</th>
                <th>Motivo</th>
                <th>Descrição / justificativa</th>
                <th>OP</th>
                <th>Operador</th>
                <th>Hora início</th>
                <th>Hora fim</th>
                <th>Duração</th>
              </tr>
            </thead>

            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan={11} className="dp-ocorrencias-vazio">
                    <Search size={22} />

                    <strong>Nenhuma ocorrência encontrada</strong>

                    <span>Não há registros para os filtros atuais.</span>
                  </td>
                </tr>
              ) : (
                lista.map((registro, indice) => {
                  const justificativa = String(
                    registro?.justificativa || registro?.descricao || "",
                  ).trim();

                  const injetora = obterInjetoraRegistro(registro);

                  const duracao = obterDuracaoSegundos(registro);

                  return (
                    <tr key={registro?.id ?? `${titulo}-${indice}`}>
                      <td className="dp-ocorrencias-col-numero">{indice + 1}</td>

                      <td>{formatarDataRegistro(registro)}</td>

                      <td>{formatarDataInstante(registro?.fim || registro?.fim_dia)}</td>

                      <td>
                        <span className="dp-ocorrencias-injetora">{injetora || "—"}</span>
                      </td>

                      <td className="dp-ocorrencias-motivo">{obterMotivoRegistro(registro)}</td>

                      <td className="dp-ocorrencias-descricao">{justificativa || "—"}</td>

                      <td>{registro?.op || "—"}</td>

                      <td>{registro?.operador || "—"}</td>

                      <td>{formatarHorarioRegistro(registro?.inicio || registro?.inicio_dia)}</td>

                      <td>{formatarHorarioRegistro(registro?.fim || registro?.fim_dia)}</td>

                      <td className="dp-ocorrencias-duracao-cell">
                        <strong className="dp-ocorrencias-duracao">
                          {duracao > 0 ? formatarDuracaoHHMMSS(duracao) : "00:00:00"}
                        </strong>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Modal>
  );
}

export default memo(ModalOcorrenciasParadas);
