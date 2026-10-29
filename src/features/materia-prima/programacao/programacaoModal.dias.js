/* =========================================================
   DIAS DO MODAL DE PROGRAMAÇÃO
   ---------------------------------------------------------
   Marcação, jornada, receita e remoção dos dias escolhidos
   no calendário, e a situação de cada dia da grade. Funções
   puras: recebem a lista atual e devolvem a nova.
========================================================= */

import { dataEhPassada, formatarDataVisual, resumirNomeFeriado } from "./programacaoModal.utils";

const MINUTOS_DIA = 1440;

const REGEX_FERIADO =
  /FERIADO|NATAL|TIRADENTES|FINADOS|INDEPEND[ÊE]NCIA|CONSCI[ÊE]NCIA|REP[ÚU]BLICA|APARECIDA|P[ÁA]SCOA|CARNAVAL|CORPUS|PAIX[ÃA]O|TRABALHO/i;

function ordenarPorData(dias) {
  return dias.sort((a, b) => a.data.localeCompare(b.data));
}

/** Dias de uma programação salva no formato usado pelo modal. */
export function normalizarDiasItem(item) {
  return (item?.diasProgramacao ?? []).map((dia) => ({
    data: dia.data,

    perfilHoras: dia.perfilHoras,

    minutosSolicitados: Number(dia.minutosSolicitados ?? 0),

    minutosDescontados: Number(dia.minutosDescontados ?? 0),

    receitaId: dia.receitaId ?? null,

    receitaNome: dia.receitaNome ?? "",

    limiteMinutos: MINUTOS_DIA,

    limitePerfilCodigo: "24H",
  }));
}

/** Marca ou desmarca a data, mantendo a lista em ordem. */
export function alternarDataMarcada(datasMarcadas, dataISO) {
  if (datasMarcadas.includes(dataISO)) {
    return datasMarcadas.filter((data) => data !== dataISO);
  }

  return [...datasMarcadas, dataISO].sort();
}

/** Uma data só pode ser marcada se não passou e tem minutos no calendário. */
export function podeMarcarData(dataISO, calendarioPorData) {
  if (dataEhPassada(dataISO)) {
    return false;
  }

  return Number(calendarioPorData.get(dataISO)?.minutosProgramados ?? 0) > 0;
}

/** Minutos do campo "Outro" (horas); `null` fora de 0 < horas ≤ 24. */
export function converterHorasOutro(horasTexto) {
  const horas = Number(horasTexto);

  if (!Number.isFinite(horas) || horas <= 0 || horas > 24) {
    return null;
  }

  return Math.round(horas * 60);
}

/** Mensagem de erro se a jornada não cabe em alguma data marcada; senão "". */
export function validarJornadaNasDatas(datasMarcadas, calendarioPorData, minutosSolicitados) {
  if (
    !Number.isFinite(minutosSolicitados) ||
    minutosSolicitados <= 0 ||
    minutosSolicitados > MINUTOS_DIA
  ) {
    return "Informe uma quantidade de horas válida entre 0 e 24.";
  }

  for (const data of datasMarcadas) {
    const limite = Number(calendarioPorData.get(data)?.minutosProgramados ?? MINUTOS_DIA);

    if (limite <= 0) {
      return `${formatarDataVisual(data)} está marcado como Sem Produção.`;
    }

    if (minutosSolicitados > limite) {
      return `${formatarDataVisual(data)} não possui disponibilidade suficiente.`;
    }
  }

  return "";
}

/** Aplica a jornada às datas marcadas, guardando o limite de cada dia. */
export function aplicarJornadaNosDias(
  dias,
  datasMarcadas,
  calendarioPorData,
  { perfilHoras, minutosSolicitados },
) {
  const mapa = new Map(dias.map((dia) => [dia.data, dia]));

  for (const data of datasMarcadas) {
    const configuracao = calendarioPorData.get(data);

    mapa.set(data, {
      ...(mapa.get(data) || {}),

      data,

      perfilHoras,

      minutosSolicitados,

      limiteMinutos: Number(configuracao?.minutosProgramados ?? MINUTOS_DIA),

      limitePerfilCodigo: configuracao?.perfilCodigo ?? "24H",
    });
  }

  return ordenarPorData([...mapa.values()]);
}

/** Aplica a receita às datas marcadas que não passaram; dia novo entra sem jornada. */
export function aplicarReceitaNosDias(dias, datasMarcadas, calendarioPorData, receita) {
  const mapa = new Map(dias.map((dia) => [dia.data, dia]));

  for (const data of datasMarcadas) {
    if (dataEhPassada(data)) {
      continue;
    }

    const configuracao = calendarioPorData.get(data);

    const atual = mapa.get(data) ?? {
      data,

      perfilHoras: "",

      minutosSolicitados: 0,

      minutosDescontados: 0,

      limiteMinutos: Number(configuracao?.minutosProgramados ?? MINUTOS_DIA),

      limitePerfilCodigo: configuracao?.perfilCodigo ?? "24H",
    };

    mapa.set(data, {
      ...atual,

      receitaId: receita.id,

      receitaNome: receita.nome,
    });
  }

  return ordenarPorData([...mapa.values()]);
}

/** Tira da programação as datas marcadas; dias que já passaram ficam. */
export function removerDiasMarcados(dias, datasMarcadas) {
  const remover = new Set(datasMarcadas);

  return dias.filter((dia) => {
    if (dataEhPassada(dia.data)) {
      return true;
    }

    return !remover.has(dia.data);
  });
}

/**
 * Situação de um dia da grade: passado, hoje, fora do mês, sem produção,
 * feriado (pelo texto do calendário) e o perfil mostrado no card. 24H é o
 * padrão normal e não aparece no card.
 */
export function descreverDiaCalendario({ data, dataISO, configuracao, hojeISO, mesReferencia }) {
  const limite = Number(configuracao?.minutosProgramados ?? 0);

  const fechado = limite <= 0;

  const observacaoCalendario = String(configuracao?.observacao ?? "").trim();

  const textoFeriado = `${String(configuracao?.origem ?? "")} ${observacaoCalendario}`;

  const feriado = fechado && REGEX_FERIADO.test(textoFeriado);

  const disponibilidade = configuracao?.perfilCodigo || (limite >= MINUTOS_DIA ? "24H" : "");

  return {
    passado: dataISO < hojeISO,

    hoje: dataISO === hojeISO,

    foraMes: data.getMonth() !== mesReferencia.getMonth(),

    fechado,

    feriado,

    nomeFeriado: feriado ? resumirNomeFeriado(observacaoCalendario) : "",

    disponibilidadeCard: disponibilidade === "24H" ? "" : disponibilidade,
  };
}
