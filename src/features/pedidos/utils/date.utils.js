function extrairPartesDataCalendario(valor) {
  if (!valor) {
    return null;
  }

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) {
      return null;
    }

    return {
      ano: valor.getFullYear(),
      mes: valor.getMonth() + 1,
      dia: valor.getDate(),
    };
  }

  const texto = String(valor).trim();

  const formatoBR = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (formatoBR) {
    return {
      dia: Number(formatoBR[1]),
      mes: Number(formatoBR[2]),
      ano: Number(formatoBR[3]),
    };
  }

  /*
   * data_pedido e previsao representam datas de calendário.
   * Para valores ISO vindos do Supabase/Omie, usamos somente AAAA-MM-DD.
   * Isso evita que "2026-09-21" seja interpretado como UTC e apareça
   * como 20/09/2026 em fusos negativos.
   */
  const formatoISO = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (formatoISO) {
    return {
      ano: Number(formatoISO[1]),
      mes: Number(formatoISO[2]),
      dia: Number(formatoISO[3]),
    };
  }

  return null;
}

function criarDataLocal(partes) {
  if (!partes) {
    return null;
  }

  const { ano, mes, dia } = partes;
  const data = new Date(ano, mes - 1, dia, 0, 0, 0, 0);

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null;
  }

  return data;
}

export function converterDataCalendario(valor) {
  if (!valor) {
    return null;
  }

  const partes = extrairPartesDataCalendario(valor);
  const dataLocal = criarDataLocal(partes);

  if (dataLocal) {
    return dataLocal;
  }

  /*
   * Mantém a compatibilidade da implementação anterior para formatos
   * eventualmente diferentes de DD/MM/AAAA e AAAA-MM-DD.
   */
  const data = valor instanceof Date ? valor : new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

export function obterHoje() {
  const agora = new Date();

  return new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    0,
    0,
    0,
    0,
  );
}

export function formatarData(valor) {
  if (!valor) {
    return "-";
  }

  const partes = extrairPartesDataCalendario(valor);

  if (partes) {
    const dia = String(partes.dia).padStart(2, "0");
    const mes = String(partes.mes).padStart(2, "0");

    return `${dia}/${mes}/${partes.ano}`;
  }

  const data = converterDataCalendario(valor);

  return data ? data.toLocaleDateString("pt-BR") : "-";
}

export function calcularDiasAtraso(previsao) {
  const dataPrevisao = converterDataCalendario(previsao);

  if (!dataPrevisao) {
    return 0;
  }

  const hoje = obterHoje();

  dataPrevisao.setHours(0, 0, 0, 0);

  const diferencaMs = hoje.getTime() - dataPrevisao.getTime();

  if (diferencaMs <= 0) {
    return 0;
  }

  return Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
}
