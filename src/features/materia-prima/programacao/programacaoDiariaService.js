import { supabase } from "@/lib/supabaseClient";

/* =========================================================
   UTILITÁRIOS
========================================================= */

function numero(valor, fallback = 0) {
  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : fallback;
}

function arredondar(valor, casas = 6) {
  const fator = 10 ** casas;

  return Math.round((numero(valor) + Number.EPSILON) * fator) / fator;
}

function normalizarReceitaItens(valor) {
  return (Array.isArray(valor) ? valor : [])
    .map((item) => ({
      fornecedorId: item?.fornecedorId ?? null,
      fornecedorNome: String(item?.fornecedorNome ?? "Fornecedor").trim(),
      percentual: numero(item?.percentual),
    }))
    .filter((item) => item.fornecedorId !== null && item.percentual > 0);
}

function distribuirConsumoReceita(consumoTotalKg, itens, configurada) {
  if (!configurada || itens.length === 0) {
    return [];
  }

  const total = arredondar(consumoTotalKg);
  let acumulado = 0;

  return itens.map((item, indice) => {
    const ultimo = indice === itens.length - 1;

    const consumoPeriodoKg = ultimo
      ? arredondar(total - acumulado)
      : arredondar(total * (item.percentual / 100));

    acumulado = arredondar(acumulado + consumoPeriodoKg);

    return {
      ...item,
      consumoPeriodoKg,
      consumoKg: consumoPeriodoKg,
    };
  });
}

function normalizarDia(registro) {
  const receitaItens = normalizarReceitaItens(registro?.receita_itens);
  const receitaConfigurada = registro?.receita_configurada === true;
  const consumoTotalKg = numero(registro?.consumo_total_kg);

  return {
    programacaoId: registro?.programacao_id ?? null,
    diaId: registro?.dia_id ?? null,
    data: String(registro?.data ?? "").trim(),
    codigoProduto: String(registro?.codigo_produto ?? "").trim(),
    descricao: String(registro?.produto ?? "").trim(),
    injetora: String(registro?.injetora ?? "").trim(),
    ativo: registro?.ativo !== false,
    perfilHoras: String(registro?.perfil_horas ?? "").trim(),
    minutosSolicitados: numero(registro?.minutos_solicitados),
    minutosDescontados: numero(registro?.minutos_descontados),
    minutosEfetivos: numero(registro?.minutos_efetivos),
    horasEfetivas: numero(registro?.horas_efetivas),
    cicloSegundos: numero(registro?.ciclo_segundos, null),
    cavidadeMolde: numero(registro?.cavidade_molde, null),
    pesoKg: numero(registro?.peso_kg, null),
    ciclosCompletos: Math.trunc(numero(registro?.ciclos_completos)),
    pecasPrevistas: Math.trunc(numero(registro?.pecas_previstas)),
    consumoTotalKg,
    receitaPercentualTotal: numero(registro?.receita_percentual_total),
    receitaConfigurada,
    receitaItens,
    consumosFornecedores: distribuirConsumoReceita(
      consumoTotalKg,
      receitaItens,
      receitaConfigurada,
    ),
    parametrosValidos:
      numero(registro?.ciclo_segundos) > 0 &&
      Number.isInteger(numero(registro?.cavidade_molde)) &&
      numero(registro?.cavidade_molde) > 0 &&
      numero(registro?.peso_kg) > 0,
  };
}

/* =========================================================
   FONTE CANÔNICA DO BANCO
========================================================= */

export async function buscarProgramacaoDiaria({
  dataInicio = null,
  dataFim = null,
  apenasAtivas = true,
} = {}) {
  const { data, error } = await supabase.rpc(
    "listar_programacao_diaria",
    {
      p_data_inicio: dataInicio || null,
      p_data_fim: dataFim || null,
      p_apenas_ativas: Boolean(apenasAtivas),
    },
  );

  if (error) {
    throw error;
  }

  return (Array.isArray(data) ? data : []).map(normalizarDia);
}

/* =========================================================
   AGRUPAR PARA A TELA DE PROGRAMAÇÃO
========================================================= */

export function agruparProgramacaoDiaria(dias = []) {
  const mapa = new Map();

  for (const dia of Array.isArray(dias) ? dias : []) {
    const chave = String(dia.programacaoId ?? "");

    if (!chave) {
      continue;
    }

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        id: dia.programacaoId,
        codigoProduto: dia.codigoProduto,
        descricao: dia.descricao,
        injetora: dia.injetora,
        ativo: dia.ativo,
        tipoProgramacao: "CALENDARIO",
        cicloSegundos: dia.cicloSegundos,
        cavidadeMolde: dia.cavidadeMolde,
        pesoKg: dia.pesoKg,
        receitaConfigurada: dia.receitaConfigurada,
        receitaPercentualTotal: dia.receitaPercentualTotal,
        receitaItens: dia.receitaItens,
        diasProgramacao: [],
      });
    }

    mapa.get(chave).diasProgramacao.push({
      id: dia.diaId,
      programacaoId: dia.programacaoId,
      data: dia.data,
      perfilHoras: dia.perfilHoras,
      minutosSolicitados: dia.minutosSolicitados,
      minutosDescontados: dia.minutosDescontados,
      minutosEfetivos: dia.minutosEfetivos,
      horasEfetivas: dia.horasEfetivas,
      ciclosCompletos: dia.ciclosCompletos,
      pecasPrevistas: dia.pecasPrevistas,
      consumoTotalKg: dia.consumoTotalKg,
    });
  }

  return [...mapa.values()]
    .map((item) => {
      const diasOrdenados = [...item.diasProgramacao].sort((a, b) =>
        a.data.localeCompare(b.data),
      );

      const minutosEfetivos = diasOrdenados.reduce(
        (total, dia) => total + numero(dia.minutosEfetivos),
        0,
      );

      const ciclosCompletos = diasOrdenados.reduce(
        (total, dia) => total + numero(dia.ciclosCompletos),
        0,
      );

      const pecasPrevistas = diasOrdenados.reduce(
        (total, dia) => total + numero(dia.pecasPrevistas),
        0,
      );

      const consumoPeriodoKg = arredondar(
        diasOrdenados.reduce(
          (total, dia) => total + numero(dia.consumoTotalKg),
          0,
        ),
      );

      return {
        ...item,
        diasProgramacao: diasOrdenados,
        quantidadeDias: diasOrdenados.length,
        dataInicio: diasOrdenados[0]?.data ?? null,
        dataFim: diasOrdenados.at(-1)?.data ?? null,
        horaInicio: null,
        horaFim: null,
        horasPeriodo: arredondar(minutosEfetivos / 60, 4),
        minutosEfetivos,
        ciclosCompletos: Math.trunc(ciclosCompletos),
        pecasPrevistas: Math.trunc(pecasPrevistas),
        quantidade: Math.trunc(pecasPrevistas),
        pecasPorHora:
          numero(item.cicloSegundos) > 0 && numero(item.cavidadeMolde) > 0
            ? arredondar((3600 / item.cicloSegundos) * item.cavidadeMolde, 2)
            : 0,
        consumoPorHoraKg:
          numero(item.cicloSegundos) > 0 &&
          numero(item.cavidadeMolde) > 0 &&
          numero(item.pesoKg) > 0
            ? arredondar(
                (3600 / item.cicloSegundos) *
                  item.cavidadeMolde *
                  item.pesoKg,
              )
            : 0,
        consumoPeriodoKg,
        consumosFornecedores: distribuirConsumoReceita(
          consumoPeriodoKg,
          item.receitaItens,
          item.receitaConfigurada,
        ),
        calculoLegado: false,
      };
    })
    .sort(
      (a, b) =>
        String(a.dataInicio ?? "").localeCompare(String(b.dataInicio ?? "")) ||
        String(a.injetora ?? "").localeCompare(String(b.injetora ?? ""), "pt-BR", {
          numeric: true,
        }) ||
        Number(a.id ?? 0) - Number(b.id ?? 0),
    );
}

export async function buscarProgramacaoAgrupada({
  dataInicio = null,
  dataFim = null,
  apenasAtivas = false,
} = {}) {
  const dias = await buscarProgramacaoDiaria({
    dataInicio,
    dataFim,
    apenasAtivas,
  });

  return agruparProgramacaoDiaria(dias);
}

/* =========================================================
   ADAPTADOR PARA A PROJEÇÃO EXISTENTE
========================================================= */

export function converterDiasParaProjecao(dias = []) {
  return (Array.isArray(dias) ? dias : []).map((dia) => ({
    id: `${dia.programacaoId}:${dia.diaId}`,
    programacaoId: dia.programacaoId,
    diaId: dia.diaId,
    codigoProduto: dia.codigoProduto,
    codigo_produto: dia.codigoProduto,
    descricao: dia.descricao,
    injetora: dia.injetora,
    ativo: dia.ativo,
    dataInicio: dia.data,
    data_inicio: dia.data,
    dataFim: dia.data,
    data_fim: dia.data,
    horaInicio: null,
    hora_inicio: null,
    horaFim: null,
    hora_fim: null,
    quantidade: dia.pecasPrevistas,
    pesoKg: dia.pesoKg,
    peso_kg: dia.pesoKg,
    cicloSegundos: dia.cicloSegundos,
    ciclo_segundos: dia.cicloSegundos,
    cavidadeMolde: dia.cavidadeMolde,
    cavidade_molde: dia.cavidadeMolde,
    consumoPeriodoKg: dia.consumoTotalKg,
    consumo_periodo_kg: dia.consumoTotalKg,
    receitaConfigurada: dia.receitaConfigurada,
    receitaPercentualTotal: dia.receitaPercentualTotal,
    receitaItens: dia.receitaItens,
    consumosFornecedores: dia.consumosFornecedores,
    minutosEfetivos: dia.minutosEfetivos,
    horasPeriodo: dia.horasEfetivas,
    calculoLegado: false,
  }));
}

export async function buscarProgramacaoParaProjecao({ dataInicio, dataFim }) {
  const dias = await buscarProgramacaoDiaria({
    dataInicio,
    dataFim,
    apenasAtivas: true,
  });

  return {
    programacao: converterDiasParaProjecao(dias),
  };
}
