import {
  ROTINAS,
  ROTINAS_SO_BANCO,
  SITUACAO,
  ORDEM_SITUACAO,
  NIVEIS_BANCO_ALERTA,
} from "../constants/monitoramento.constants";
import { formatarDataHora as formatarDataHoraPadrao } from "@/shared/lib/datas";

/* =========================================================
   MONITORAMENTO — REGRAS DE EXIBIÇÃO (puras, testadas)
========================================================= */

/* Os crons do Supabase estão em UTC; a empresa usa Brasília (UTC-3). */
const FUSO_HORAS = -3;

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function expandirCampo(campo, minimo, maximo) {
  const valores = new Set();

  for (const parte of String(campo).split(",")) {
    const [faixa, passoTexto] = parte.split("/");
    const passo = passoTexto ? Number(passoTexto) : 1;
    let inicio;
    let fim;

    if (faixa === "*") {
      inicio = minimo;
      fim = maximo;
    } else if (faixa.includes("-")) {
      [inicio, fim] = faixa.split("-").map(Number);
    } else {
      inicio = Number(faixa);
      fim = passoTexto ? maximo : inicio;
    }

    if (![inicio, fim, passo].every(Number.isInteger) || passo < 1) {
      return null;
    }

    for (let v = inicio; v <= fim; v += passo) valores.add(v);
  }

  return [...valores].sort((a, b) => a - b);
}

const dois = (n) => String(n).padStart(2, "0");

function descreverMinutos(minutos) {
  if (minutos.length === 60) return "a cada minuto";
  if (minutos.length === 1) return null;

  const passo = minutos[1] - minutos[0];
  const uniforme = minutos.every((m, i) => i === 0 || m - minutos[i - 1] === passo);

  if (uniforme && minutos[0] < passo && 60 % passo === 0 && minutos.length === 60 / passo) {
    return minutos[0] === 0
      ? `a cada ${passo} min`
      : `a cada ${passo} min, a partir do minuto ${dois(minutos[0])}`;
  }

  return `nos minutos ${minutos.map(dois).join(", ")}`;
}

function descreverDias(campo) {
  if (campo === "*") return "todos os dias";
  if (campo === "1-5") return "seg a sex";

  const dias = expandirCampo(campo, 0, 6);
  if (!dias) return `dias ${campo}`;
  return dias.map((d) => DIAS_SEMANA[d]).join(", ");
}

/**
 * Converte a agenda do cron (UTC) em texto no horário de Brasília.
 * Ex.: "8-59/15 10-20 * * 1-5" → "seg a sex, das 07h às 17h, a cada 15 min".
 */
export function descreverAgenda(agenda) {
  const partes = String(agenda ?? "")
    .trim()
    .split(/\s+/);
  if (partes.length !== 5) return agenda ?? "";

  const [campoMin, campoHora, diaMes, mes, diaSemana] = partes;
  const minutos = expandirCampo(campoMin, 0, 59);
  const horasUtc = expandirCampo(campoHora, 0, 23);

  if (!minutos || !horasUtc || diaMes !== "*" || mes !== "*") return agenda;

  const horas = horasUtc.map((h) => (h + FUSO_HORAS + 24) % 24).sort((a, b) => a - b);

  const dias = descreverDias(diaSemana);

  if (horas.length === 1 && minutos.length === 1) {
    return `${dias}, às ${dois(horas[0])}:${dois(minutos[0])}`;
  }

  const contiguas = horas.every((h, i) => i === 0 || h - horas[i - 1] === 1);
  const textoHoras =
    horas.length === 24
      ? "o dia todo"
      : contiguas && horas.length > 1
        ? `das ${dois(horas[0])}h às ${dois(horas.at(-1))}h`
        : `às ${horas.map((h) => `${dois(h)}h`).join(" e ")}`;

  const textoMin = descreverMinutos(minutos) ?? `de hora em hora, no minuto ${dois(minutos[0])}`;

  return `${dias}, ${textoHoras}, ${textoMin}`;
}

/** Situação atual da rotina para o selo colorido. */
export function situacaoDaRotina(rotina) {
  if (!rotina?.ativa) return SITUACAO.DESATIVADA;

  if (rotina.ultima_status_cron === "failed") return SITUACAO.ERRO;

  // Rotinas que chamam funções: vale o resultado da última chamada.
  if (rotina.ultima_chamada) {
    if (rotina.ultimo_sucesso === false) return SITUACAO.ERRO;
    if (rotina.ultimo_sucesso === null || rotina.ultimo_sucesso === undefined) {
      return SITUACAO.RODANDO;
    }
    return SITUACAO.OK;
  }

  if (rotina.ultima_status_cron === "succeeded") return SITUACAO.OK;
  if (rotina.ultima_status_cron === "running") return SITUACAO.RODANDO;

  return SITUACAO.SEM_DADOS;
}

/** Mensagem de erro mais útil para a rotina (função ou cron). */
export function mensagemErro(rotina) {
  if (rotina?.ultima_status_cron === "failed" && rotina.ultimo_erro_cron) {
    return rotina.ultimo_erro_cron;
  }
  return rotina?.ultimo_sucesso === false ? rotina.ultimo_erro || "Erro sem mensagem." : null;
}

export function infoRotina(nomeCron) {
  return ROTINAS[nomeCron] ?? { nome: nomeCron, descricao: "" };
}

export function prepararRotinas(lista) {
  return (lista ?? [])
    .map((rotina) => ({
      ...rotina,
      ...infoRotina(rotina.rotina),
      situacao: situacaoDaRotina(rotina),
      mensagem_erro: mensagemErro(rotina),
      monitorada: !ROTINAS_SO_BANCO.has(rotina.rotina),
    }))
    .sort(
      (a, b) =>
        ORDEM_SITUACAO[a.situacao] - ORDEM_SITUACAO[b.situacao] ||
        a.nome.localeCompare(b.nome, "pt-BR"),
    );
}

/* ---------------------------------------------------------
   Datas
--------------------------------------------------------- */

/** Padrão do sistema; vazio ou inválido aparece como "—" nesta tela. */
export function formatarDataHora(valor) {
  const texto = formatarDataHoraPadrao(valor);
  return texto === "-" ? "—" : texto;
}

export function tempoDecorrido(valor, agora = new Date()) {
  if (!valor) return "";
  const minutos = Math.round((agora.getTime() - new Date(valor).getTime()) / 60000);
  if (!Number.isFinite(minutos)) return "";
  if (minutos < 1) return "agora há pouco";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
}

/** Duração informada pela própria função (duracao_ms), quando houver. */
export function formatarDuracao(ms) {
  const valor = Number(ms);
  if (ms === null || ms === undefined || !Number.isFinite(valor) || valor < 0) return "—";
  const segundos = Math.round(valor / 1000);
  if (segundos < 60) return `${segundos} s`;
  return `${Math.floor(segundos / 60)} min ${dois(segundos % 60)} s`;
}

/* ---------------------------------------------------------
   Banco de dados e aviso do menu
--------------------------------------------------------- */

export function formatarMegabytes(bytes) {
  if (bytes === null || bytes === undefined || bytes === "") return "—";
  const valor = Number(bytes);
  if (!Number.isFinite(valor) || valor < 0) return "—";
  return `${Math.round(valor / (1024 * 1024))} MB`;
}

/** Rotinas com erro + 1 se o banco passou de 80% do limite. */
export function quantidadeAvisos(resumo) {
  const erros = Math.max(0, Number(resumo?.rotinas_com_erro) || 0);
  const banco = NIVEIS_BANCO_ALERTA.has(resumo?.banco_nivel) ? 1 : 0;
  return erros + banco;
}
