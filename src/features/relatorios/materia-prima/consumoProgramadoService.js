import { supabase } from "@/lib/supabaseClient";

const MS_DIA = 24 * 60 * 60 * 1000;

const TOLERANCIA_RECEITA = 0.0001;

/* =========================================================
   NÚMEROS
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
      (total, item) => total + numero(typeof campo === "function" ? campo(item) : item?.[campo]),
      0,
    ),
  );
}

/* =========================================================
   DATA / HORA
========================================================= */

function dataUtc(data, hora = "00:00:00") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data ?? ""))) {
    return null;
  }

  const partesHora = String(hora || "00:00:00")
    .split(":")
    .map(Number);

  const [ano, mes, dia] = data.split("-").map(Number);

  const [h = 0, m = 0, s = 0] = partesHora;

  if ([ano, mes, dia, h, m, s].some((valor) => !Number.isFinite(valor))) {
    return null;
  }

  return Date.UTC(ano, mes - 1, dia, h, m, s);
}

function dataIsoDeMs(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function horaDeMs(ms) {
  return new Date(ms).toISOString().slice(11, 16);
}

function diasInclusivos(inicio, fim) {
  const a = dataUtc(inicio);

  const b = dataUtc(fim);

  if (a === null || b === null || b < a) {
    return 0;
  }

  return Math.floor((b - a) / MS_DIA) + 1;
}

/* =========================================================
   ORDENAÇÃO
========================================================= */

function ordenarTexto(a, b) {
  return String(a ?? "").localeCompare(String(b ?? ""), "pt-BR", {
    numeric: true,

    sensitivity: "base",
  });
}

/* =========================================================
   RECEITA
========================================================= */

function montarReceita(itens, fornecedoresPorId) {
  const lista = (itens || [])
    .filter((item) => item?.ativo !== false)
    .map((item) => {
      const fornecedor = fornecedoresPorId.get(String(item.fornecedor_id));

      return {
        fornecedorId: item.fornecedor_id,

        fornecedorNome: fornecedor?.nome || "Fornecedor não encontrado",

        percentual: arredondar(item.percentual, 4),
      };
    })
    .filter((item) => item.percentual > 0)
    .sort((a, b) => ordenarTexto(a.fornecedorNome, b.fornecedorNome));

  const percentualTotal = arredondar(
    lista.reduce((total, item) => total + item.percentual, 0),
    4,
  );

  return {
    itens: lista,

    percentualTotal,

    configurada: lista.length > 0 && Math.abs(percentualTotal - 100) <= TOLERANCIA_RECEITA,
  };
}

/* =========================================================
   DISTRIBUIR CONSUMO DA RECEITA
========================================================= */

function distribuirReceita(consumoTotalKg, receita) {
  if (!receita?.configurada || receita.itens.length === 0) {
    return [];
  }

  const total = arredondar(consumoTotalKg);

  let acumulado = 0;

  return receita.itens.map((item, indice) => {
    const ultimo = indice === receita.itens.length - 1;

    const consumoKg = ultimo
      ? arredondar(total - acumulado)
      : arredondar(total * (item.percentual / 100));

    acumulado = arredondar(acumulado + consumoKg);

    return {
      ...item,

      consumoKg,
    };
  });
}

/* =========================================================
   PROGRAMAÇÃO COM HORÁRIO
========================================================= */

function calcularComHorario({
  registro,
  parametro,
  produto,
  receita,
  inicioFiltroMs,
  fimFiltroMs,
}) {
  const inicioProg = dataUtc(registro.data_inicio, registro.hora_inicio);

  const fimProg = dataUtc(registro.data_fim, registro.hora_fim);

  if (inicioProg === null || fimProg === null || fimProg <= inicioProg) {
    return null;
  }

  const inicio = Math.max(inicioProg, inicioFiltroMs);

  const fim = Math.min(fimProg, fimFiltroMs);

  if (fim <= inicio) {
    return null;
  }

  const pesoKg = numero(parametro?.kg_un, NaN);

  const cicloSegundos = numero(parametro?.ciclo_segundos, NaN);

  const cavidades = numero(parametro?.cavidade_molde, NaN);

  const parametrosValidos =
    Number.isFinite(pesoKg) &&
    pesoKg > 0 &&
    Number.isFinite(cicloSegundos) &&
    cicloSegundos > 0 &&
    Number.isFinite(cavidades) &&
    cavidades > 0;

  const ciclosAntes = parametrosValidos
    ? Math.floor((inicio - inicioProg) / (cicloSegundos * 1000))
    : 0;

  const ciclosAteFim = parametrosValidos
    ? Math.floor((fim - inicioProg) / (cicloSegundos * 1000))
    : 0;

  const ciclosCompletos = Math.max(0, ciclosAteFim - ciclosAntes);

  const pecasPrevistas = parametrosValidos ? ciclosCompletos * cavidades : 0;

  const consumoTotalKg = parametrosValidos ? arredondar(pecasPrevistas * pesoKg) : 0;

  const consumosFornecedores = distribuirReceita(consumoTotalKg, receita);

  return {
    id: registro.id,

    injetora: String(registro.injetora ?? "").trim() || "-",

    codigoProduto: String(registro.codigo_produto ?? "").trim(),

    descricao: produto?.nome_produto || parametro?.descricao || "Sem descrição",

    dataInicioOriginal: registro.data_inicio,

    horaInicioOriginal: registro.hora_inicio,

    dataFimOriginal: registro.data_fim,

    horaFimOriginal: registro.hora_fim,

    dataInicioConsiderada: dataIsoDeMs(inicio),

    horaInicioConsiderada: horaDeMs(inicio),

    dataFimConsiderada: dataIsoDeMs(fim),

    horaFimConsiderada: horaDeMs(fim),

    horasProgramadas: arredondar((fim - inicio) / 3600000, 4),

    cicloSegundos: parametrosValidos ? cicloSegundos : null,

    cavidadeMolde: parametrosValidos ? cavidades : null,

    pesoKg: parametrosValidos ? pesoKg : null,

    ciclosCompletos,

    pecasPrevistas,

    consumoTotalKg,

    receitaConfigurada: receita.configurada,

    receitaPercentualTotal: receita.percentualTotal,

    consumosFornecedores,

    consumoDistribuidoKg: receita.configurada ? consumoTotalKg : 0,

    consumoSemReceitaKg: receita.configurada ? 0 : consumoTotalKg,

    calculoLegado: false,

    parametrosValidos,
  };
}

/* =========================================================
   PROGRAMAÇÃO LEGADA
========================================================= */

function calcularLegada({ registro, parametro, produto, receita, dataInicial, dataFinal }) {
  const inicio = [registro.data_inicio, dataInicial].sort().at(-1);

  const fim = [registro.data_fim, dataFinal].sort().at(0);

  const dias = diasInclusivos(inicio, fim);

  if (dias <= 0) {
    return null;
  }

  const pesoKg = numero(parametro?.kg_un, NaN);

  const quantidadeDia = numero(registro.quantidade, NaN);

  const parametrosValidos =
    Number.isFinite(pesoKg) && pesoKg > 0 && Number.isFinite(quantidadeDia) && quantidadeDia >= 0;

  const pecasPrevistas = parametrosValidos ? quantidadeDia * dias : 0;

  const consumoTotalKg = parametrosValidos ? arredondar(pecasPrevistas * pesoKg) : 0;

  const consumosFornecedores = distribuirReceita(consumoTotalKg, receita);

  return {
    id: registro.id,

    injetora: String(registro.injetora ?? "").trim() || "-",

    codigoProduto: String(registro.codigo_produto ?? "").trim(),

    descricao: produto?.nome_produto || parametro?.descricao || "Sem descrição",

    dataInicioOriginal: registro.data_inicio,

    horaInicioOriginal: null,

    dataFimOriginal: registro.data_fim,

    horaFimOriginal: null,

    dataInicioConsiderada: inicio,

    horaInicioConsiderada: null,

    dataFimConsiderada: fim,

    horaFimConsiderada: null,

    horasProgramadas: null,

    cicloSegundos: numero(parametro?.ciclo_segundos, null),

    cavidadeMolde: numero(parametro?.cavidade_molde, null),

    pesoKg: parametrosValidos ? pesoKg : null,

    ciclosCompletos: 0,

    pecasPrevistas,

    consumoTotalKg,

    receitaConfigurada: receita.configurada,

    receitaPercentualTotal: receita.percentualTotal,

    consumosFornecedores,

    consumoDistribuidoKg: receita.configurada ? consumoTotalKg : 0,

    consumoSemReceitaKg: receita.configurada ? 0 : consumoTotalKg,

    calculoLegado: true,

    parametrosValidos,
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

      quantidadeProgramacoes: itens.length,

      horasProgramadas: somar(itens, (item) => item.horasProgramadas ?? 0),

      ciclosCompletos: Math.round(somar(itens, "ciclosCompletos")),

      pecasPrevistas: Math.round(somar(itens, "pecasPrevistas")),

      consumoTotalKg: somar(itens, "consumoTotalKg"),

      consumoDistribuidoKg: somar(itens, "consumoDistribuidoKg"),

      consumoSemReceitaKg: somar(itens, "consumoSemReceitaKg"),

      programacoes: [...itens].sort((a, b) =>
        `${a.dataInicioConsiderada} ${a.horaInicioConsiderada || ""}`.localeCompare(
          `${b.dataInicioConsiderada} ${b.horaInicioConsiderada || ""}`,
        ),
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
        programacaoId: programacao.id,

        injetora: programacao.injetora,

        codigoProduto: programacao.codigoProduto,

        descricao: programacao.descricao,

        dataInicioConsiderada: programacao.dataInicioConsiderada,

        horaInicioConsiderada: programacao.horaInicioConsiderada,

        dataFimConsiderada: programacao.dataFimConsiderada,

        horaFimConsiderada: programacao.horaFimConsiderada,

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

      quantidadeInjetoras: new Set(grupo.detalhes.map((item) => item.injetora)).size,

      quantidadeProdutos: new Set(grupo.detalhes.map((item) => item.codigoProduto)).size,

      quantidadeProgramacoes: new Set(grupo.detalhes.map((item) => item.programacaoId)).size,

      consumoKg: somar(grupo.detalhes, "consumoFornecedorKg"),

      detalhes: grupo.detalhes.sort(
        (a, b) =>
          ordenarTexto(a.injetora, b.injetora) || ordenarTexto(a.codigoProduto, b.codigoProduto),
      ),
    }))
    .sort((a, b) => ordenarTexto(a.fornecedorNome, b.fornecedorNome));
}

/* =========================================================
   RESULTADO VAZIO
========================================================= */

export function criarResultadoConsumoProgramadoVazio({ dataInicial = "", dataFinal = "" } = {}) {
  return {
    periodo: {
      dataInicial,
      dataFinal,
    },

    resumo: {
      injetorasProgramadas: 0,

      fornecedoresEnvolvidos: 0,

      programacoes: 0,

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
   BUSCAR CONSUMO PROGRAMADO
========================================================= */

export async function buscarConsumoProgramado({ dataInicial, dataFinal }) {
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

  /* =======================================================
     PROGRAMAÇÕES
  ======================================================= */

  const {
    data: programacao,

    error: erroProgramacao,
  } = await supabase
    .from("materia_prima_programacao")
    .select(
      `
          id,
          codigo_produto,
          quantidade,
          injetora,
          ativo,
          data_inicio,
          hora_inicio,
          data_fim,
          hora_fim
        `,
    )
    .eq("ativo", true)
    .lte("data_inicio", dataFinal)
    .gte("data_fim", dataInicial)
    .order("data_inicio", {
      ascending: true,
    })
    .order("id", {
      ascending: true,
    });

  if (erroProgramacao) {
    throw erroProgramacao;
  }

  if (!programacao?.length) {
    return vazio;
  }

  const codigos = [
    ...new Set(programacao.map((item) => String(item.codigo_produto ?? "").trim()).filter(Boolean)),
  ];

  /* =======================================================
     DADOS AUXILIARES
  ======================================================= */

  const [parametros, produtos, receitas, fornecedores] = await Promise.all([
    supabase
      .from("parametros_produto")
      .select(
        `
            cod_prod,
            descricao,
            kg_un,
            ciclo_segundos,
            cavidade_molde,
            ativo
          `,
      )
      .in("cod_prod", codigos),

    supabase
      .from("materia_prima_produtos")
      .select(
        `
            codigo_produto,
            nome_produto,
            ativo
          `,
      )
      .in("codigo_produto", codigos),

    supabase
      .from("materia_prima_receitas_itens")
      .select(
        `
            id,
            codigo_produto,
            fornecedor_id,
            percentual,
            ativo
          `,
      )
      .in("codigo_produto", codigos)
      .eq("ativo", true),

    supabase.from("materia_prima_fornecedores").select(
      `
            id,
            nome,
            ativo
          `,
    ),
  ]);

  for (const resultado of [parametros, produtos, receitas, fornecedores]) {
    if (resultado.error) {
      throw resultado.error;
    }
  }

  /* =======================================================
     MAPAS
  ======================================================= */

  const parametrosPorCodigo = new Map(
    (parametros.data || []).map((item) => [String(item.cod_prod), item]),
  );

  const produtosPorCodigo = new Map(
    (produtos.data || []).map((item) => [String(item.codigo_produto), item]),
  );

  const fornecedoresPorId = new Map(
    (fornecedores.data || []).map((item) => [String(item.id), item]),
  );

  const receitaBrutaPorCodigo = new Map();

  for (const item of receitas.data || []) {
    const codigo = String(item.codigo_produto);

    if (!receitaBrutaPorCodigo.has(codigo)) {
      receitaBrutaPorCodigo.set(codigo, []);
    }

    receitaBrutaPorCodigo.get(codigo).push(item);
  }

  const receitaPorCodigo = new Map(
    codigos.map((codigo) => [
      codigo,

      montarReceita(
        receitaBrutaPorCodigo.get(codigo) || [],

        fornecedoresPorId,
      ),
    ]),
  );

  /* =======================================================
     PERÍODO DO FILTRO

     A data final é inclusiva.
  ======================================================= */

  const inicioFiltroMs = dataUtc(dataInicial);

  const fimFiltroMs = dataUtc(dataFinal) + MS_DIA;

  /* =======================================================
     CALCULAR PROGRAMAÇÕES
  ======================================================= */

  const programacoes = programacao
    .map((registro) => {
      const codigo = String(registro.codigo_produto ?? "").trim();

      const parametrosProduto = parametrosPorCodigo.get(codigo) || null;

      const produto = produtosPorCodigo.get(codigo) || null;

      const receita = receitaPorCodigo.get(codigo) || {
        itens: [],

        percentualTotal: 0,

        configurada: false,
      };

      const possuiHorario = Boolean(registro.hora_inicio && registro.hora_fim);

      return possuiHorario
        ? calcularComHorario({
            registro,

            parametro: parametrosProduto,

            produto,

            receita,

            inicioFiltroMs,

            fimFiltroMs,
          })
        : calcularLegada({
            registro,

            parametro: parametrosProduto,

            produto,

            receita,

            dataInicial,

            dataFinal,
          });
    })
    .filter(Boolean);

  if (!programacoes.length) {
    return vazio;
  }

  /* =======================================================
     AGRUPAMENTOS
  ======================================================= */

  const porInjetora = agruparPorInjetora(programacoes);

  const porFornecedor = agruparPorFornecedor(programacoes);

  const semReceita = programacoes.filter((item) => item.consumoSemReceitaKg > 0);

  /* =======================================================
     RESULTADO
  ======================================================= */

  return {
    periodo: {
      dataInicial,
      dataFinal,
    },

    resumo: {
      injetorasProgramadas: porInjetora.length,

      fornecedoresEnvolvidos: porFornecedor.length,

      programacoes: programacoes.length,

      horasProgramadas: somar(programacoes, (item) => item.horasProgramadas ?? 0),

      ciclosCompletos: Math.round(somar(programacoes, "ciclosCompletos")),

      pecasPrevistas: Math.round(somar(programacoes, "pecasPrevistas")),

      consumoTotalKg: somar(programacoes, "consumoTotalKg"),

      consumoDistribuidoKg: somar(programacoes, "consumoDistribuidoKg"),

      consumoSemReceitaKg: somar(programacoes, "consumoSemReceitaKg"),

      programacoesSemReceita: semReceita.length,

      programacoesLegadas: programacoes.filter((item) => item.calculoLegado).length,

      programacoesComParametrosInvalidos: programacoes.filter((item) => !item.parametrosValidos)
        .length,
    },

    programacoes,

    porInjetora,

    porFornecedor,

    semReceita,
  };
}
