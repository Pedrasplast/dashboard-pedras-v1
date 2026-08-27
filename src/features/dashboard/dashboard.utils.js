export const DESCRICOES_TIPO = Object.freeze({
  1: "Paradas Planejadas",
  2: "Paradas não Planejadas",
  3: "Intervalos e Dias Sem Produção",
});

export const TURNOS_DISPONIVEIS = Object.freeze([
  "TURNO I",
  "TURNO II",
  "TURNO III",
]);

export const VALORES_PADRAO_FILTROS_PRODUCAO = Object.freeze({
  dataInicio: "",
  dataFim: "",
  injetora: "Todos",
  turno: "Todos",
  cod_prod: "Todos",
  mp: "Todos",
  tipo: [],
});

export function obterDescricaoTipo(tipo) {
  return DESCRICOES_TIPO[String(tipo).trim()] || "Tipo sem descrição";
}

export function formatarDataISO(data) {
  if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
    return "";
  }

  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export function converterISOParaData(valorISO) {
  if (!valorISO) {
    return undefined;
  }

  const correspondencia = String(valorISO).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!correspondencia) {
    return undefined;
  }

  const ano = Number(correspondencia[1]);
  const mes = Number(correspondencia[2]) - 1;
  const dia = Number(correspondencia[3]);
  const data = new Date(ano, mes, dia);

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes ||
    data.getDate() !== dia
  ) {
    return undefined;
  }

  return data;
}

/**
 * Versão validada usada pelo seletor de período.
 * Mantém a mesma prioridade de campos do filtro original.
 */
export function extrairDataRegistro(registro) {
  const valorData =
    registro?.lista_de_data ||
    registro?.inicio ||
    registro?.inicio_dia ||
    registro?.data ||
    null;

  if (!valorData) {
    return null;
  }

  const textoData = String(valorData).trim();
  const correspondencia = textoData.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (correspondencia) {
    const dataISO = `${correspondencia[1]}-${correspondencia[2]}-${correspondencia[3]}`;
    return converterISOParaData(dataISO) ? dataISO : null;
  }

  const data = new Date(valorData);
  return Number.isNaN(data.getTime()) ? null : formatarDataISO(data);
}

/**
 * Versão usada na filtragem do Dashboard. Mantém a semântica anterior:
 * quando o valor já começa em YYYY-MM-DD, ele é devolvido diretamente.
 */
export function extrairDataISORegistro(registro) {
  const valorData =
    registro?.lista_de_data ||
    registro?.inicio ||
    registro?.inicio_dia ||
    registro?.data ||
    null;

  if (!valorData) {
    return null;
  }

  const textoData = String(valorData).trim();
  const correspondencia = textoData.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (correspondencia) {
    return `${correspondencia[1]}-${correspondencia[2]}-${correspondencia[3]}`;
  }

  const data = new Date(valorData);
  return Number.isNaN(data.getTime()) ? null : formatarDataISO(data);
}

export function formatarDataVisual(valorISO) {
  const data = converterISOParaData(valorISO);
  return data ? data.toLocaleDateString("pt-BR") : "";
}

export function extrairHorarioMinutosRegistro(registro) {
  const valoresPossiveis = [
    registro?.inicio,
    registro?.hora_inicio,
    registro?.horario_inicio,
    registro?.inicio_dia,
    registro?.hora,
  ];

  for (const valor of valoresPossiveis) {
    if (valor === null || valor === undefined || valor === "") {
      continue;
    }

    if (valor instanceof Date) {
      if (!Number.isNaN(valor.getTime())) {
        return valor.getHours() * 60 + valor.getMinutes();
      }
      continue;
    }

    const texto = String(valor).trim();
    if (!texto) {
      continue;
    }

    const correspondencia = texto.match(/(?:T|\s|^)(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (!correspondencia) {
      continue;
    }

    const hora = Number(correspondencia[1]);
    const minuto = Number(correspondencia[2]);

    if (
      !Number.isFinite(hora) ||
      !Number.isFinite(minuto) ||
      hora < 0 ||
      hora > 23 ||
      minuto < 0 ||
      minuto > 59
    ) {
      continue;
    }

    return hora * 60 + minuto;
  }

  return null;
}

export function identificarTurnoRegistro(registro) {
  const minutos = extrairHorarioMinutosRegistro(registro);

  if (minutos === null) {
    return "SEM TURNO";
  }

  // Turno I: 05:00–10:59 e 12:00–14:29.
  if ((minutos >= 300 && minutos < 660) || (minutos >= 720 && minutos < 870)) {
    return "TURNO I";
  }

  // Turno II: 14:30–18:59 e 20:00–23:44.
  if ((minutos >= 870 && minutos < 1140) || (minutos >= 1200 && minutos < 1425)) {
    return "TURNO II";
  }

  // Turno III: 23:45–04:59.
  if (minutos >= 1425 || minutos < 300) {
    return "TURNO III";
  }

  return "FORA DE PRODUÇÃO";
}

export function filtrarRegistrosDashboard(registros, filtros) {
  if (!Array.isArray(registros)) {
    return [];
  }

  return registros.filter((registro) => {
    if (filtros.injetora !== "Todos" && registro.injetora !== filtros.injetora) {
      return false;
    }

    if (filtros.cod_prod !== "Todos" && registro.cod_prod !== filtros.cod_prod) {
      return false;
    }

    if (
      filtros.turno !== "Todos" &&
      identificarTurnoRegistro(registro) !== filtros.turno
    ) {
      return false;
    }

    if (filtros.dataInicio || filtros.dataFim) {
      const dataRegistro = extrairDataISORegistro(registro);

      if (filtros.dataInicio && (!dataRegistro || dataRegistro < filtros.dataInicio)) {
        return false;
      }

      if (filtros.dataFim && (!dataRegistro || dataRegistro > filtros.dataFim)) {
        return false;
      }
    }

    return true;
  });
}
