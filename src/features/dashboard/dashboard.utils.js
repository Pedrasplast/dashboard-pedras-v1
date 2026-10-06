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

/* =========================================================
   REGRA OFICIAL DE TURNOS DO DASHBOARD

   IMPORTANTE:
   - 11:00–12:00 é intervalo e não entra nas horas de parada.
   - 19:00–19:55 é intervalo e não entra nas horas de parada.
   - 05:00–05:10 pertence ao TURNO I.
   - Para o Dashboard, o TURNO III termina efetivamente às 05:00.

   Dessa forma não existe sobreposição entre os turnos e a soma
   TURNO I + TURNO II + TURNO III fecha exatamente com "Todos".
========================================================= */

const FUSO_HORARIO_PRODUCAO = "America/Sao_Paulo";
const MILISSEGUNDOS_MINUTO = 60_000;
const MILISSEGUNDOS_DIA = 86_400_000;

const PERIODOS_TURNOS_MINUTOS = Object.freeze({
  "TURNO I": Object.freeze([
    Object.freeze([5 * 60, 11 * 60]),
    Object.freeze([12 * 60, 14 * 60 + 48]),
  ]),

  "TURNO II": Object.freeze([
    Object.freeze([14 * 60 + 48, 19 * 60]),
    Object.freeze([19 * 60 + 55, 23 * 60 + 55]),
  ]),

  "TURNO III": Object.freeze([
    Object.freeze([0, 5 * 60]),
    Object.freeze([23 * 60 + 55, 24 * 60]),
  ]),
});

const FORMATADOR_DATA_HORA_PRODUCAO = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_HORARIO_PRODUCAO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
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

function normalizarTextoLocal(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function possuiFusoExplicito(texto) {
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(texto);
}

function extrairPartesFormatadasData(data) {
  const partes = FORMATADOR_DATA_HORA_PRODUCAO.formatToParts(data);
  const mapa = Object.fromEntries(
    partes
      .filter((parte) => parte.type !== "literal")
      .map((parte) => [parte.type, parte.value]),
  );

  const ano = Number(mapa.year);
  const mes = Number(mapa.month);
  const dia = Number(mapa.day);
  const hora = Number(mapa.hour);
  const minuto = Number(mapa.minute);
  const segundo = Number(mapa.second);

  if (
    !Number.isFinite(ano) ||
    !Number.isFinite(mes) ||
    !Number.isFinite(dia) ||
    !Number.isFinite(hora) ||
    !Number.isFinite(minuto) ||
    !Number.isFinite(segundo)
  ) {
    return null;
  }

  return {
    ano,
    mes,
    dia,
    hora,
    minuto,
    segundo,
  };
}

/**
 * Converte um timestamp para uma linha do tempo "local" de São Paulo.
 *
 * O valor retornado usa Date.UTC apenas como uma régua numérica. Isso evita
 * que o fuso horário do navegador altere os limites dos turnos.
 */
function converterParaMilissegundosLocais(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) {
      return null;
    }

    const partes = extrairPartesFormatadasData(valor);

    return partes
      ? Date.UTC(
          partes.ano,
          partes.mes - 1,
          partes.dia,
          partes.hora,
          partes.minuto,
          partes.segundo,
        )
      : null;
  }

  const texto = String(valor).trim();

  if (!texto) {
    return null;
  }

  const correspondenciaLocal = texto.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T|\s)(\d{1,2}):(\d{2})(?::(\d{2}))?/,
  );

  /*
   * Timestamp sem offset explícito: tratamos como horário local informado.
   */
  if (correspondenciaLocal && !possuiFusoExplicito(texto)) {
    const ano = Number(correspondenciaLocal[1]);
    const mes = Number(correspondenciaLocal[2]);
    const dia = Number(correspondenciaLocal[3]);
    const hora = Number(correspondenciaLocal[4]);
    const minuto = Number(correspondenciaLocal[5]);
    const segundo = Number(correspondenciaLocal[6] || 0);

    return Date.UTC(ano, mes - 1, dia, hora, minuto, segundo);
  }

  /*
   * Timestamp do Supabase normalmente chega com Z ou +00:00.
   * Convertemos para America/Sao_Paulo antes de comparar com os turnos.
   */
  const data = new Date(texto);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  const partes = extrairPartesFormatadasData(data);

  return partes
    ? Date.UTC(
        partes.ano,
        partes.mes - 1,
        partes.dia,
        partes.hora,
        partes.minuto,
        partes.segundo,
      )
    : null;
}

function converterDuracaoParaSegundos(duracao) {
  if (duracao === null || duracao === undefined || duracao === "") {
    return 0;
  }

  if (typeof duracao === "number") {
    return Number.isFinite(duracao) && duracao > 0
      ? Math.round(duracao * 3600)
      : 0;
  }

  const texto = String(duracao).trim();
  const correspondencia = texto.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);

  if (correspondencia) {
    const horas = Number(correspondencia[1]);
    const minutos = Number(correspondencia[2]);
    const segundos = Number(correspondencia[3] || 0);

    if (minutos >= 60 || segundos >= 60) {
      return 0;
    }

    return horas * 3600 + minutos * 60 + segundos;
  }

  const horasDecimais = Number.parseFloat(texto.replace(",", "."));

  return Number.isFinite(horasDecimais) && horasDecimais > 0
    ? Math.round(horasDecimais * 3600)
    : 0;
}

function formatarSegundosComoDuracao(segundos) {
  const total = Math.max(0, Math.round(Number(segundos) || 0));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundosRestantes = total % 60;

  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(
    2,
    "0",
  )}:${String(segundosRestantes).padStart(2, "0")}`;
}

function obterIntervaloLocalRegistro(registro) {
  const valorInicio =
    registro?.inicio ??
    registro?.inicio_dia ??
    registro?.data_inicio ??
    null;

  const valorFim =
    registro?.fim ??
    registro?.fim_dia ??
    registro?.data_fim ??
    null;

  const inicio = converterParaMilissegundosLocais(valorInicio);

  if (inicio === null) {
    return null;
  }

  let fim = converterParaMilissegundosLocais(valorFim);

  if (fim === null || fim <= inicio) {
    const segundosDuracao = converterDuracaoParaSegundos(registro?.duracao);

    if (segundosDuracao <= 0) {
      return null;
    }

    fim = inicio + segundosDuracao * 1000;
  }

  return { inicio, fim };
}

function obterPeriodosParaTurno(turno) {
  if (turno && turno !== "Todos") {
    return PERIODOS_TURNOS_MINUTOS[turno] || [];
  }

  return TURNOS_DISPONIVEIS.flatMap(
    (nomeTurno) => PERIODOS_TURNOS_MINUTOS[nomeTurno],
  );
}

/**
 * Calcula somente os segundos que realmente pertencem ao turno informado.
 *
 * Em "Todos", usa a união dos três turnos, portanto os intervalos
 * 11:00–12:00 e 19:00–19:55 são automaticamente descontados.
 */
function calcularSegundosDentroDosTurnos(intervalo, turno = "Todos") {
  if (!intervalo || intervalo.fim <= intervalo.inicio) {
    return 0;
  }

  const periodos = obterPeriodosParaTurno(turno);

  if (periodos.length === 0) {
    return 0;
  }

  const primeiroDia =
    Math.floor(intervalo.inicio / MILISSEGUNDOS_DIA) * MILISSEGUNDOS_DIA;

  const ultimoDia =
    Math.floor((intervalo.fim - 1) / MILISSEGUNDOS_DIA) * MILISSEGUNDOS_DIA;

  let totalMilissegundos = 0;

  for (
    let inicioDia = primeiroDia;
    inicioDia <= ultimoDia;
    inicioDia += MILISSEGUNDOS_DIA
  ) {
    for (const [inicioMinutos, fimMinutos] of periodos) {
      const inicioPeriodo =
        inicioDia + inicioMinutos * MILISSEGUNDOS_MINUTO;

      const fimPeriodo =
        inicioDia + fimMinutos * MILISSEGUNDOS_MINUTO;

      const inicioSobreposicao = Math.max(intervalo.inicio, inicioPeriodo);
      const fimSobreposicao = Math.min(intervalo.fim, fimPeriodo);

      if (fimSobreposicao > inicioSobreposicao) {
        totalMilissegundos += fimSobreposicao - inicioSobreposicao;
      }
    }
  }

  return Math.round(totalMilissegundos / 1000);
}

function ajustarParadaAoTurno(registro, turno) {
  const intervalo = obterIntervaloLocalRegistro(registro);

  /*
   * Fallback seguro para registros antigos/incompletos sem início/fim.
   * Mantém a regra anterior em vez de apagar o registro.
   */
  if (!intervalo) {
    if (turno !== "Todos" && identificarTurnoRegistro(registro) !== turno) {
      return null;
    }

    return registro;
  }

  const segundosConsiderados = calcularSegundosDentroDosTurnos(
    intervalo,
    turno,
  );

  if (segundosConsiderados <= 0) {
    return null;
  }

  return {
    ...registro,
    duracao: formatarSegundosComoDuracao(segundosConsiderados),
  };
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

    const texto = String(valor).trim();

    /*
     * Timestamp completo: respeita o fuso de produção.
     */
    if (
      valor instanceof Date ||
      /^\d{4}-\d{2}-\d{2}(?:T|\s)/.test(texto)
    ) {
      const milissegundosLocais = converterParaMilissegundosLocais(valor);

      if (milissegundosLocais !== null) {
        const dataLocal = new Date(milissegundosLocais);
        return dataLocal.getUTCHours() * 60 + dataLocal.getUTCMinutes();
      }
    }

    /*
     * Campo contendo apenas horário.
     */
    const correspondencia = texto.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);

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

  // Turno I: 05:00–11:00 e 12:00–14:48.
  if ((minutos >= 300 && minutos < 660) || (minutos >= 720 && minutos < 888)) {
    return "TURNO I";
  }

  // Turno II: 14:48–19:00 e 19:55–23:55.
  if (
    (minutos >= 888 && minutos < 1140) ||
    (minutos >= 1195 && minutos < 1435)
  ) {
    return "TURNO II";
  }

  // Turno III: 23:55–05:00. 05:00–05:10 pertence ao Turno I.
  if (minutos >= 1435 || minutos < 300) {
    return "TURNO III";
  }

  return "FORA DE PRODUÇÃO";
}

/**
 * Filtro compartilhado do Dashboard.
 *
 * A opção ajustarParadasPorTurno é usada somente pela Home de Produção.
 * Ela recorta a duração das paradas pelos limites reais dos turnos para que:
 *
 * - intervalos não sejam contados como parada;
 * - uma parada que cruza dois turnos seja dividida corretamente;
 * - a soma dos turnos seja igual ao total de "Todos".
 *
 * Outras telas que já usam esta função continuam com o comportamento anterior
 * porque a opção é false por padrão.
 */
export function filtrarRegistrosDashboard(
  registros,
  filtros,
  { ajustarParadasPorTurno = false } = {},
) {
  if (!Array.isArray(registros)) {
    return [];
  }

  const resultado = [];

  for (const registro of registros) {
    if (filtros.injetora !== "Todos" && registro.injetora !== filtros.injetora) {
      continue;
    }

    if (filtros.cod_prod !== "Todos" && registro.cod_prod !== filtros.cod_prod) {
      continue;
    }

    if (filtros.dataInicio || filtros.dataFim) {
      const dataRegistro = extrairDataISORegistro(registro);

      if (filtros.dataInicio && (!dataRegistro || dataRegistro < filtros.dataInicio)) {
        continue;
      }

      if (filtros.dataFim && (!dataRegistro || dataRegistro > filtros.dataFim)) {
        continue;
      }
    }

    const ehParada =
      normalizarTextoLocal(registro?.status) === "indisponivel";

    if (ajustarParadasPorTurno && ehParada) {
      const registroAjustado = ajustarParadaAoTurno(
        registro,
        filtros.turno || "Todos",
      );

      if (registroAjustado) {
        resultado.push(registroAjustado);
      }

      continue;
    }

    if (
      filtros.turno !== "Todos" &&
      identificarTurnoRegistro(registro) !== filtros.turno
    ) {
      continue;
    }

    resultado.push(registro);
  }

  return resultado;
}