import {
  buscarProgramacaoDiaria,
} from "@/features/materia-prima/programacao/programacaoDiariaService";

/* =========================================================
   UTILITÁRIOS
========================================================= */

function numero(valor, padrao = 0) {
  const n = Number(String(valor ?? "").replace(",", "."));

  return Number.isFinite(n) ? n : padrao;
}

function arredondar(valor, casas = 6) {
  const fator = 10 ** casas;

  return Math.round((numero(valor) + Number.EPSILON) * fator) / fator;
}

function somar(lista, campo) {
  return arredondar(
    (lista || []).reduce(
      (total, item) =>
        total +
        numero(
          typeof campo === "function"
            ? campo(item)
            : item?.[campo],
        ),
      0,
    ),
  );
}

function ordenarTexto(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
}

/* =========================================================
   RESULTADO VAZIO
========================================================= */

export function criarResultadoConsumoProgramadoVazio({
  dataInicial = "",
  dataFinal = "",
} = {}) {
  return {
    periodo: {
      dataInicial,
      dataFinal,
    },

    resumo: {
      injetorasProgramadas: 0,
      fornecedoresEnvolvidos: 0,
      programacoes: 0,
      diasProgramados: 0,
      horasProgramadas: 0,
      ciclosCompletos: 0,
      pecasPrevistas: 0,
      consumoTotalKg: 0,
      consumoDistribuidoKg: 0,
      consumoSemReceitaKg: 0,
      programacoesSemReceita: 0,
      programacoesLegadas: 0,
      programacoesComParametrosInvalidos: 0,
    },

    programacoes: [],
    porInjetora: [],
    porFornecedor: [],
    semReceita: [],
  };
}

/* =========================================================
   NORMALIZAR UM DIA PARA O FORMATO DOS RELATÓRIOS
========================================================= */

function montarItemRelatorio(dia) {
  const consumosFornecedores = (dia.consumosFornecedores || []).map(
    (fornecedor) => ({
      fornecedorId: fornecedor.fornecedorId,
      fornecedorNome: fornecedor.fornecedorNome,
      percentual: numero(fornecedor.percentual),
      consumoKg: arredondar(
        fornecedor.consumoKg ?? fornecedor.consumoPeriodoKg,
      ),
    }),
  );

  const consumoTotalKg = arredondar(dia.consumoTotalKg);

  return {
    id: `${dia.programacaoId}:${dia.diaId}`,
    programacaoId: dia.programacaoId,
    diaId: dia.diaId,
    injetora: dia.injetora || "-",
    codigoProduto: dia.codigoProduto,
    descricao: dia.descricao || "Sem descrição",

    dataInicioOriginal: dia.data,
    horaInicioOriginal: null,
    dataFimOriginal: dia.data,
    horaFimOriginal: null,

    dataInicioConsiderada: dia.data,
    horaInicioConsiderada: null,
    dataFimConsiderada: dia.data,
    horaFimConsiderada: null,

    perfilHoras: dia.perfilHoras,
    minutosSolicitados: dia.minutosSolicitados,
    minutosDescontados: dia.minutosDescontados,
    minutosEfetivos: dia.minutosEfetivos,
    horasProgramadas: arredondar(dia.horasEfetivas, 4),

    cicloSegundos: dia.cicloSegundos,
    cavidadeMolde: dia.cavidadeMolde,
    pesoKg: dia.pesoKg,
    ciclosCompletos: dia.ciclosCompletos,
    pecasPrevistas: dia.pecasPrevistas,
    consumoTotalKg,

    receitaConfigurada: dia.receitaConfigurada,
    receitaPercentualTotal: dia.receitaPercentualTotal,
    consumosFornecedores,

    consumoDistribuidoKg:
      dia.receitaConfigurada
        ? consumoTotalKg
        : 0,

    consumoSemReceitaKg:
      dia.receitaConfigurada
        ? 0
        : consumoTotalKg,

    calculoLegado: false,
    parametrosValidos: dia.parametrosValidos,
    quantidadeDias: 1,
  };
}

/* =========================================================
   AGRUPAR POR INJETORA
========================================================= */

function agruparPorInjetora(programacoes) {
  const mapa = new Map();

  for (const item of programacoes) {
    const chave = item.injetora;

    if (!mapa.has(chave)) {
      mapa.set(chave, []);
    }

    mapa.get(chave).push(item);
  }

  return [...mapa.entries()]
    .map(([injetora, itens]) => ({
      injetora,
      quantidadeProgramacoes: new Set(
        itens.map((item) => item.programacaoId),
      ).size,
      quantidadeDias: itens.length,
      horasProgramadas: somar(itens, "horasProgramadas"),
      ciclosCompletos: Math.round(somar(itens, "ciclosCompletos")),
      pecasPrevistas: Math.round(somar(itens, "pecasPrevistas")),
      consumoTotalKg: somar(itens, "consumoTotalKg"),
      consumoDistribuidoKg: somar(itens, "consumoDistribuidoKg"),
      consumoSemReceitaKg: somar(itens, "consumoSemReceitaKg"),
      programacoes: [...itens].sort(
        (a, b) =>
          String(a.dataInicioConsiderada).localeCompare(
            String(b.dataInicioConsiderada),
          ) ||
          Number(a.diaId ?? 0) - Number(b.diaId ?? 0),
      ),
    }))
    .sort((a, b) => ordenarTexto(a.injetora, b.injetora));
}

/* =========================================================
   AGRUPAR POR FORNECEDOR
========================================================= */

function agruparPorFornecedor(programacoes) {
  const mapa = new Map();

  for (const programacao of programacoes) {
    for (const fornecedor of programacao.consumosFornecedores || []) {
      const chave = String(fornecedor.fornecedorId);

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          fornecedorId: fornecedor.fornecedorId,
          fornecedorNome: fornecedor.fornecedorNome,
          detalhes: [],
        });
      }

      mapa.get(chave).detalhes.push({
        programacaoId: programacao.programacaoId,
        diaId: programacao.diaId,
        injetora: programacao.injetora,
        codigoProduto: programacao.codigoProduto,
        descricao: programacao.descricao,
        dataInicioConsiderada: programacao.dataInicioConsiderada,
        horaInicioConsiderada: null,
        dataFimConsiderada: programacao.dataFimConsiderada,
        horaFimConsiderada: null,
        pecasPrevistas: programacao.pecasPrevistas,
        consumoProgramaKg: programacao.consumoTotalKg,
        percentual: fornecedor.percentual,
        consumoFornecedorKg: fornecedor.consumoKg,
      });
    }
  }

  return [...mapa.values()]
    .map((grupo) => ({
      ...grupo,
      quantidadeInjetoras: new Set(
        grupo.detalhes.map((item) => item.injetora),
      ).size,
      quantidadeProdutos: new Set(
        grupo.detalhes.map((item) => item.codigoProduto),
      ).size,
      quantidadeProgramacoes: new Set(
        grupo.detalhes.map((item) => item.programacaoId),
      ).size,
      quantidadeDias: grupo.detalhes.length,
      consumoKg: somar(grupo.detalhes, "consumoFornecedorKg"),
      detalhes: grupo.detalhes.sort(
        (a, b) =>
          String(a.dataInicioConsiderada).localeCompare(
            String(b.dataInicioConsiderada),
          ) ||
          ordenarTexto(a.injetora, b.injetora) ||
          ordenarTexto(a.codigoProduto, b.codigoProduto),
      ),
    }))
    .sort((a, b) => ordenarTexto(a.fornecedorNome, b.fornecedorNome));
}

/* =========================================================
   BUSCAR CONSUMO PROGRAMADO
========================================================= */

export async function buscarConsumoProgramado({
  dataInicial,
  dataFinal,
}) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dataInicial || "") ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dataFinal || "")
  ) {
    throw new Error("Informe um período válido.");
  }

  if (dataFinal < dataInicial) {
    throw new Error("A data final não pode ser anterior à data inicial.");
  }

  const vazio = criarResultadoConsumoProgramadoVazio({
    dataInicial,
    dataFinal,
  });

  const dias = await buscarProgramacaoDiaria({
    dataInicio: dataInicial,
    dataFim: dataFinal,
    apenasAtivas: true,
  });

  if (!dias.length) {
    return vazio;
  }

  const programacoes = dias.map(montarItemRelatorio);
  const porInjetora = agruparPorInjetora(programacoes);
  const porFornecedor = agruparPorFornecedor(programacoes);
  const semReceita = programacoes.filter(
    (item) => item.consumoSemReceitaKg > 0,
  );

  return {
    periodo: {
      dataInicial,
      dataFinal,
    },

    resumo: {
      injetorasProgramadas: porInjetora.length,
      fornecedoresEnvolvidos: porFornecedor.length,
      programacoes: new Set(
        programacoes.map((item) => item.programacaoId),
      ).size,
      diasProgramados: programacoes.length,
      horasProgramadas: somar(programacoes, "horasProgramadas"),
      ciclosCompletos: Math.round(somar(programacoes, "ciclosCompletos")),
      pecasPrevistas: Math.round(somar(programacoes, "pecasPrevistas")),
      consumoTotalKg: somar(programacoes, "consumoTotalKg"),
      consumoDistribuidoKg: somar(programacoes, "consumoDistribuidoKg"),
      consumoSemReceitaKg: somar(programacoes, "consumoSemReceitaKg"),
      programacoesSemReceita: new Set(
        semReceita.map((item) => item.programacaoId),
      ).size,
      programacoesLegadas: 0,
      programacoesComParametrosInvalidos: programacoes.filter(
        (item) => !item.parametrosValidos,
      ).length,
    },

    programacoes,
    porInjetora,
    porFornecedor,
    semReceita,
  };
}
