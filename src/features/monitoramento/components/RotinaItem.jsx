import { useState } from "react";
import { ChevronDown, Pause, Play, Zap } from "lucide-react";

import { ROTULO_SITUACAO } from "../constants/monitoramento.constants";
import { resumirResultado } from "../utils/diagnostico";
import {
  descreverAgenda,
  formatarDataHora,
  proximaExecucao,
  tempoDecorrido,
} from "../utils/monitoramento.utils";
import ErroExplicado from "./ErroExplicado";
import HistoricoRotina from "./HistoricoRotina";
import LinhaDoDia from "./LinhaDoDia";
import PausaFormulario from "./PausaFormulario";

const dois = (n) => String(n).padStart(2, "0");

/* "08:15" se for hoje (Brasília); senão "09/11 07:00". */
function horaCurta(data, agora) {
  if (!data) return "—";
  const local = new Date(data.getTime() - 3 * 60 * 60 * 1000);
  const hoje = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const hm = `${dois(local.getUTCHours())}:${dois(local.getUTCMinutes())}`;
  return local.toISOString().slice(0, 10) === hoje.toISOString().slice(0, 10)
    ? hm
    : formatarDataHora(data);
}

export default function RotinaItem({
  rotina,
  aberta,
  onAlternar,
  agora,
  execucoesHoje,
  definirAtiva,
  rodarAgora,
}) {
  const [pausando, setPausando] = useState(false);

  const ultima = rotina.ultima_chamada ?? rotina.ultima_execucao;
  const alterandoEsta = definirAtiva.isPending && definirAtiva.variables?.rotina === rotina.rotina;
  const rodandoEsta = rodarAgora.isPending && rodarAgora.variables?.rotina === rotina.rotina;
  const respostaRodar = rodarAgora.variables?.rotina === rotina.rotina ? rodarAgora : null;

  const proxima = rotina.ativa ? proximaExecucao(rotina.agenda, agora) : null;
  const textoProxima = !rotina.ativa
    ? rotina.retomar_em
      ? `volta ${horaCurta(new Date(rotina.retomar_em), agora)}`
      : "pausada"
    : proxima
      ? `próxima ${horaCurta(proxima, agora)}`
      : "";

  const resultado = !rotina.mensagem_erro ? resumirResultado(rotina.ultimo_resultado) : null;

  function retomar() {
    definirAtiva.mutate({ rotina: rotina.rotina, ativa: true });
  }

  function confirmarPausa({ motivo, retomarEm }) {
    definirAtiva.mutate(
      { rotina: rotina.rotina, ativa: false, motivo, retomarEm },
      { onSuccess: () => setPausando(false) },
    );
  }

  return (
    <li className={`mon-rotina mon-rotina--${rotina.situacao}`}>
      <div className="mon-rotina__linha">
        <button
          type="button"
          className="mon-rotina__cabecalho"
          aria-expanded={aberta}
          onClick={onAlternar}
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
            <small>
              {tempoDecorrido(ultima)}
              {textoProxima && ` · ${textoProxima}`}
            </small>
          </span>

          <span className="mon-rotina__falhas">
            <small>Falhas 24 h</small>
            <strong className={Number(rotina.falhas_24h) > 0 ? "mon-texto-erro" : ""}>
              {rotina.monitorada ? `${rotina.falhas_24h} de ${rotina.chamadas_24h}` : "—"}
            </strong>
          </span>

          <ChevronDown size={18} aria-hidden="true" className="mon-rotina__seta" />
        </button>

        {/* Pausar só faz sentido para as rotinas que chamam o Omie. */}
        {!rotina.monitorada && <span className="mon-rotina__pausa-espaco" aria-hidden="true" />}
        {rotina.monitorada && (
          <button
            type="button"
            className={
              rotina.ativa ? "mon-rotina__pausa" : "mon-rotina__pausa mon-rotina__pausa--retomar"
            }
            onClick={() => (rotina.ativa ? setPausando((v) => !v) : retomar())}
            disabled={definirAtiva.isPending}
            aria-expanded={rotina.ativa ? pausando : undefined}
            aria-label={`${rotina.ativa ? "Pausar" : "Retomar"} ${rotina.nome}`}
            title={
              rotina.ativa
                ? "Para de rodar até você retomar (ou até o horário escolhido)."
                : "Volta a rodar na agenda normal."
            }
          >
            {rotina.ativa ? (
              <Pause size={14} aria-hidden="true" />
            ) : (
              <Play size={14} aria-hidden="true" />
            )}
            {alterandoEsta && !rotina.ativa ? "Retomando…" : rotina.ativa ? "Pausar" : "Retomar"}
          </button>
        )}
      </div>

      {pausando && rotina.ativa && (
        <PausaFormulario
          nome={rotina.nome}
          processando={alterandoEsta}
          onConfirmar={confirmarPausa}
          onCancelar={() => setPausando(false)}
        />
      )}

      {!rotina.ativa && (rotina.pausada_em || rotina.pausa_motivo) && (
        <p className="mon-rotina__pausa-info">
          Pausada
          {rotina.pausada_por && ` por ${rotina.pausada_por}`}
          {rotina.pausada_em && ` em ${formatarDataHora(rotina.pausada_em)}`}
          {rotina.pausa_motivo && ` · motivo: ${rotina.pausa_motivo}`}
          {rotina.retomar_em
            ? ` · volta sozinha ${formatarDataHora(rotina.retomar_em)}`
            : " · só volta quando alguém retomar"}
        </p>
      )}

      {rotina.monitorada && <LinhaDoDia execucoes={execucoesHoje} />}

      {rotina.mensagem_erro && (
        <div className="mon-rotina__erro">
          <ErroExplicado
            texto={rotina.mensagem_erro}
            statusHttp={rotina.ultimo_status_http}
            complemento={
              rotina.ultimo_sucesso_em
                ? `Último sucesso ${formatarDataHora(rotina.ultimo_sucesso_em)} (${tempoDecorrido(rotina.ultimo_sucesso_em)}).`
                : null
            }
          />
        </div>
      )}

      {resultado && <p className="mon-rotina__resultado">Última execução: {resultado}</p>}

      {aberta && (
        <div className="mon-rotina__detalhe">
          {rotina.descricao && <p className="mon-rotina__descricao">{rotina.descricao}</p>}

          {rotina.monitorada && (
            <div className="mon-rotina__acoes">
              <button
                type="button"
                className="mon-botao"
                onClick={() => rodarAgora.mutate({ rotina: rotina.rotina })}
                disabled={rodarAgora.isPending}
              >
                <Zap size={15} aria-hidden="true" />
                {rodandoEsta ? "Disparando…" : "Rodar agora"}
              </button>
              {respostaRodar?.isSuccess && (
                <span className="mon-rotina__aviso">
                  {respostaRodar.data.disparada
                    ? "Disparada. O resultado aparece aqui em alguns segundos."
                    : "Nada a fazer agora: a rotina não tinha trabalho pendente."}
                </span>
              )}
              {respostaRodar?.isError && (
                <span className="mon-rotina__aviso mon-texto-erro">
                  {respostaRodar.error.message}
                </span>
              )}
            </div>
          )}

          <HistoricoRotina rotina={rotina.rotina} monitorada={rotina.monitorada} />
        </div>
      )}
    </li>
  );
}
