/* =========================================================
   EVOLUÇÃO DAS PARADAS — REGRAS
   ---------------------------------------------------------
   Funções puras e constantes usadas pela tela; movidas do
   componente sem alteração.
========================================================= */

import { formatarDataCurta } from "../dashboardParadas.utils";

/* =========================================================
   MODOS
========================================================= */

export const MODO_TEMPO = "tempo";

export const MODO_OCORRENCIAS = "ocorrencias";

/* =========================================================
   DATA
========================================================= */

export function criarDataUTC(dataISO) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dataISO || ""))) {
    return null;
  }

  const [ano, mes, dia] = dataISO.split("-").map(Number);

  const data = new Date(Date.UTC(ano, mes - 1, dia));

  return Number.isNaN(data.getTime()) ? null : data;
}

export function dataParaISO(data) {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    return "";
  }

  return data.toISOString().slice(0, 10);
}

export function adicionarDiasUTC(dataISO, quantidade) {
  const data = criarDataUTC(dataISO);

  if (!data) {
    return "";
  }

  data.setUTCDate(data.getUTCDate() + quantidade);

  return dataParaISO(data);
}

export function formatarDataCompletaISO(dataISO) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dataISO || ""))) {
    return "";
  }

  const [ano, mes, dia] = dataISO.split("-");

  return `${dia}/${mes}/${ano}`;
}

/* =========================================================
   INÍCIO DA SEMANA
========================================================= */

export function obterInicioSemana(dataISO) {
  const data = criarDataUTC(dataISO);

  if (!data) {
    return "";
  }

  const diaSemana = data.getUTCDay();

  const deslocamento = (diaSemana + 6) % 7;

  data.setUTCDate(data.getUTCDate() - deslocamento);

  return dataParaISO(data);
}

/* =========================================================
   FIM DO MÊS
========================================================= */

export function obterFimMes(anoMes) {
  if (!/^\d{4}-\d{2}$/.test(String(anoMes || ""))) {
    return "";
  }

  const [ano, mes] = anoMes.split("-").map(Number);

  const data = new Date(Date.UTC(ano, mes, 0));

  return dataParaISO(data);
}

/* =========================================================
   AGRUPAMENTO AUTOMÁTICO
========================================================= */

export function definirGranularidade(quantidadeDatas) {
  if (quantidadeDatas <= 45) {
    return "dia";
  }

  if (quantidadeDatas <= 120) {
    return "semana";
  }

  return "mes";
}

/* =========================================================
   AGRUPAR EVOLUÇÃO
========================================================= */

export function agruparEvolucao(dados) {
  const lista = Array.isArray(dados)
    ? dados
        .filter((item) => item?.data)
        .sort((a, b) => String(a.data).localeCompare(String(b.data)))
    : [];

  const granularidade = definirGranularidade(lista.length);

  const mapa = new Map();

  for (const item of lista) {
    const dataISO = String(item.data || "");

    let chave = dataISO;

    let label = formatarDataCurta(dataISO);

    let labelCompleto = label;

    let dataInicio = dataISO;

    let dataFim = dataISO;

    /* =====================================================
       SEMANA
    ===================================================== */

    if (granularidade === "semana") {
      const inicioSemana = obterInicioSemana(dataISO);

      chave = inicioSemana;

      dataInicio = inicioSemana;

      dataFim = adicionarDiasUTC(inicioSemana, 6);

      label = formatarDataCurta(inicioSemana);

      labelCompleto = `Semana de ${label}`;
    }

    /* =====================================================
       MÊS
    ===================================================== */

    if (granularidade === "mes") {
      chave = dataISO.slice(0, 7);

      const [ano, mes] = chave.split("-");

      dataInicio = `${chave}-01`;

      dataFim = obterFimMes(chave);

      label = `${mes}/${String(ano).slice(-2)}`;

      labelCompleto = `${mes}/${ano}`;
    }

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        chave,

        label,

        labelCompleto,

        dataInicio,

        dataFim,

        duracao_segundos: 0,

        ocorrencias: 0,
      });
    }

    const grupo = mapa.get(chave);

    grupo.duracao_segundos += Number(item.duracao_segundos || 0);

    grupo.ocorrencias += Number(item.ocorrencias || 0);
  }

  return {
    granularidade,

    dados: Array.from(mapa.values()),
  };
}

/* =========================================================
   MÉDIA
========================================================= */

