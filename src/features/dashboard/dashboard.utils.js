import { formatarDataISO } from "@/shared/lib/datas";

export const DESCRICOES_TIPO = Object.freeze({
  1: "Paradas Planejadas",
  2: "Paradas não Planejadas",
  3: "Intervalos e Dias Sem Produção",
});

export const TURNOS_DISPONIVEIS = Object.freeze(["TURNO I", "TURNO II", "TURNO III"]);

export const VALORES_PADRAO_FILTROS_PRODUCAO = Object.freeze({
  dataInicio: "",
  dataFim: "",
  injetora: "Todos",
  turno: "Todos",
  cod_prod: "Todos",
  mp: "Todos",
  // Padrão: Tipos 1 e 2. Tipo 3 só entra quando marcado.
  tipo: ["1", "2"],
});

/* =========================================================
   REGRA OFICIAL DE TURNOS DO DASHBOARD (atualizada em 05/11/2026)

   Turnos corridos, sem recorte de almoço/jantar:
   - TURNO I:   05:00–14:48
   - TURNO II:  14:48–23:55
   - TURNO III: 23:55–05:00

   Almoço e jantar não são descontados pelo relógio: eles são
   apontados como parada Tipo 3 (ex.: "Alimentação") e só entram
   na hora parada quando o Tipo 3 está marcado no filtro.

   Não existe sobreposição entre os turnos e a soma
   TURNO I + TURNO II + TURNO III fecha exatamente com "Todos".
========================================================= */

const FUSO_HORARIO_PRODUCAO = "America/Sao_Paulo";
const MILISSEGUNDOS_MINUTO = 60_000;
const MILISSEGUNDOS_DIA = 86_400_000;

const PERIODOS_TURNOS_MINUTOS = Object.freeze({
  "TURNO I": Object.freeze([Object.freeze([5 * 60, 14 * 60 + 48])]),

  "TURNO II": Object.freeze([Object.freeze([14 * 60 + 48, 23 * 60 + 55])]),

  "TURNO III": Object.freeze([Object.freeze([0, 5 * 60]), Object.freeze([23 * 60 + 55, 24 * 60])]),
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

export { formatarDataISO };

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

  if (data.getFullYear() !== ano || data.getMonth() !== mes || data.getDate() !== dia) {
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
    registro?.lista_de_data || registro?.inicio || registro?.inicio_dia || registro?.data || null;

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
    registro?.lista_de_data || registro?.inicio || registro?.inicio_dia || registro?.data || null;

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
    partes.filter((parte) => parte.type !== "literal").map((parte) => [parte.type, parte.value]),
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
      ? Date.UTC(partes.ano, partes.mes - 1, partes.dia, partes.hora, partes.minuto, partes.segundo)
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
    ? Date.UTC(partes.ano, partes.mes - 1, partes.dia, partes.hora, partes.minuto, partes.segundo)
    : null;
}

function converterDuracaoParaSegundos(duracao) {
  if (duracao === null || duracao === undefined || duracao === "") {
    return 0;
  }

  if (typeof duracao === "number") {
    return Number.isFinite(duracao) && duracao > 0 ? Math.round(duracao * 3600) : 0;
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

  return Number.isFinite(horasDecimais) && horasDecimais > 0 ? Math.round(horasDecimais * 3600) : 0;
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
  const valorInicio = registro?.inicio ?? registro?.inicio_dia ?? registro?.data_inicio ?? null;

  const valorFim = registro?.fim ?? registro?.fim_dia ?? registro?.data_fim ?? null;

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

  return TURNOS_DISPONIVEIS.flatMap((nomeTurno) => PERIODOS_TURNOS_MINUTOS[nomeTurno]);
}

/**
 * Calcula somente os segundos que realmente pertencem ao turno informado.
 *
 * Em "Todos", a união dos três turnos cobre o dia inteiro, então a
 * duração fica igual à duração real da parada.
 */
function calcularSegundosDentroDosTurnos(intervalo, turno = "Todos") {
  if (!intervalo || intervalo.fim <= intervalo.inicio) {
    return 0;
  }

  const periodos = obterPeriodosParaTurno(turno);

  if (periodos.length === 0) {
    return 0;
  }

  const primeiroDia = Math.floor(intervalo.inicio / MILISSEGUNDOS_DIA) * MILISSEGUNDOS_DIA;

  const ultimoDia = Math.floor((intervalo.fim - 1) / MILISSEGUNDOS_DIA) * MILISSEGUNDOS_DIA;

  let totalMilissegundos = 0;

  for (let inicioDia = primeiroDia; inicioDia <= ultimoDia; inicioDia += MILISSEGUNDOS_DIA) {
    for (const [inicioMinutos, fimMinutos] of periodos) {
      const inicioPeriodo = inicioDia + inicioMinutos * MILISSEGUNDOS_MINUTO;

      const fimPeriodo = inicioDia + fimMinutos * MILISSEGUNDOS_MINUTO;

      const inicioSobreposicao = Math.max(intervalo.inicio, inicioPeriodo);
      const fimSobreposicao = Math.min(intervalo.fim, fimPeriodo);

      if (fimSobreposicao > inicioSobreposicao) {
        totalMilissegundos += fimSobreposicao - inicioSobreposicao;
      }
    }
  }

  return Math.round(totalMilissegundos / 1000);
}

/*
 * Campos de quantidade que são divididos na mesma proporção do tempo
 * quando um registro atravessa a troca de turno e o filtro é de um
 * turno específico (para a soma dos turnos fechar com "Todos").
 */
const CAMPOS_PROPORCIONAIS_TURNO = Object.freeze(["conforme", "danificada"]);

/**
 * Recorta um registro (parada ou produção) pelo turno filtrado.
 *
 * - "Todos": o registro fica como está (os turnos cobrem o dia inteiro).
 * - Turno específico: mantém só o tempo dentro do turno e divide
 *   conforme/danificada na mesma proporção.
 */
function ajustarRegistroAoTurno(registro, turno) {
  const intervalo = obterIntervaloLocalRegistro(registro);

  /*
   * Fallback seguro para registros antigos/incompletos sem início/fim:
   * o registro inteiro vai para o turno em que começou.
   */
  if (!intervalo) {
    if (turno !== "Todos" && identificarTurnoRegistro(registro) !== turno) {
      return null;
    }

    return registro;
  }

  if (turno === "Todos") {
    return registro;
  }

  const segundosConsiderados = calcularSegundosDentroDosTurnos(intervalo, turno);

  if (segundosConsiderados <= 0) {
    return null;
  }

  const segundosTotais = Math.round((intervalo.fim - intervalo.inicio) / 1000);

  if (segundosConsiderados >= segundosTotais) {
    return registro;
  }

  const fracao = segundosConsiderados / segundosTotais;

  const ajustado = {
    ...registro,
    duracao: formatarSegundosComoDuracao(segundosConsiderados),
  };

  for (const campo of CAMPOS_PROPORCIONAIS_TURNO) {
    const valor = registro?.[campo];

    if (valor === null || valor === undefined || valor === "") {
      continue;
    }

    const numero = Number(valor);

    if (Number.isFinite(numero)) {
      ajustado[campo] = numero * fracao;
    }
  }

  return ajustado;
}

/* =========================================================
   TIPOS DE PARADA CONSIDERADOS

   Regra única de "hora parada" do Dashboard de Produção e do
   Dashboard de Paradas:
   - Conta somente as paradas dos tipos marcados no filtro.
   - Nenhum tipo marcado = Tipos 1 e 2.
   - Tipo 3 (intervalos, alimentação, troca de turno, fim de
     semana, feriado, turno reduzido...) só entra quando marcado.
   - Parada sem tipo conta como Tipo 2 (não some dos indicadores
     se uma importação trouxer apontamento sem tipo).
========================================================= */

const TIPOS_PARADA_PADRAO = Object.freeze(["1", "2"]);
const TIPO_PARADA_SEM_TIPO = "2";

export function normalizarTiposParadaSelecionados(tipos) {
  const lista = (Array.isArray(tipos) ? tipos : [tipos])
    .map((tipo) =>
      String(tipo ?? "")
        .trim()
        .replace(/\s+/g, ""),
    )
    .filter(Boolean);

  return new Set(lista.length > 0 ? lista : TIPOS_PARADA_PADRAO);
}

function tipoParadaDoRegistro(registro) {
  const tipo = String(registro?.tipo ?? "")
    .trim()
    .replace(/\s+/g, "");

  return tipo || TIPO_PARADA_SEM_TIPO;
}

/*
 * Devolve a parada com o tipo preenchido (sem tipo → Tipo 2), para que
 * gráficos e listas que agrupam por tipo a enxerguem. Outros registros
 * voltam sem mudança.
 */
export function registroComTipoParada(registro) {
  if (normalizarTextoLocal(registro?.status) !== "indisponivel") {
    return registro;
  }

  const tipo = tipoParadaDoRegistro(registro);

  return registro.tipo === tipo ? registro : { ...registro, tipo };
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
    if (valor instanceof Date || /^\d{4}-\d{2}-\d{2}(?:T|\s)/.test(texto)) {
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

  // Turno I: 05:00–14:48.
  if (minutos >= 300 && minutos < 888) {
    return "TURNO I";
  }

  // Turno II: 14:48–23:55.
  if (minutos >= 888 && minutos < 1435) {
    return "TURNO II";
  }

  // Turno III: 23:55–05:00.
  return "TURNO III";
}

/**
 * Filtro compartilhado do Dashboard de Produção e do Dashboard de Paradas.
 *
 * ajustarParadasPorTurno: recorta os registros (paradas e produção) pelos
 * limites dos turnos. Um registro que cruza dois turnos é dividido: o tempo
 * e as peças (conforme/danificada) vão proporcionalmente para cada turno,
 * e a soma dos turnos fica igual ao total de "Todos".
 *
 * tiposParada: quando informado (array, mesmo vazio), aplica a regra única
 * de tipos de parada (ver normalizarTiposParadaSelecionados). Registros que
 * não são parada (ex.: Produzindo) não são afetados.
 */
export function filtrarRegistrosDashboard(
  registros,
  filtros,
  { ajustarParadasPorTurno = false, tiposParada } = {},
) {
  if (!Array.isArray(registros)) {
    return [];
  }

  const tiposConsiderados =
    tiposParada === undefined ? null : normalizarTiposParadaSelecionados(tiposParada);

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

    const ehParada = normalizarTextoLocal(registro?.status) === "indisponivel";

    if (ehParada && tiposConsiderados && !tiposConsiderados.has(tipoParadaDoRegistro(registro))) {
      continue;
    }

    if (ajustarParadasPorTurno) {
      const registroAjustado = ajustarRegistroAoTurno(registro, filtros.turno || "Todos");

      if (registroAjustado) {
        resultado.push(registroAjustado);
      }

      continue;
    }

    if (filtros.turno !== "Todos" && identificarTurnoRegistro(registro) !== filtros.turno) {
      continue;
    }

    resultado.push(registro);
  }

  return resultado;
}
