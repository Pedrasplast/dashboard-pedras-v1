/* =========================================================
   REGRAS DA PROJEÇÃO DE MATÉRIA-PRIMA
   ---------------------------------------------------------
   Cálculo puro, sem acesso ao banco: recebe os saldos, as
   compras e a programação já buscados e devolve as linhas
   de saldo por data e fornecedor.
========================================================= */

import { paraNumero } from "@/shared/lib/numeros";

/* =========================================================
   NÚMEROS
========================================================= */

export function arredondarKg(valor) {
  return Math.round((paraNumero(valor) + Number.EPSILON) * 1000000) / 1000000;
}

/* =========================================================
   DATAS
========================================================= */

function converterDataUTC(valor) {
  if (!valor) {
    return null;
  }

  const [ano, mes, dia] = String(valor).split("-").map(Number);

  if (!ano || !mes || !dia) {
    return null;
  }

  return new Date(Date.UTC(ano, mes - 1, dia));
}

function formatarDataUTC(data) {
  return data.toISOString().slice(0, 10);
}

/** Datas "AAAA-MM-DD" de `inicio` a `fim`, inclusive; vazio se o intervalo for inválido. */
export function listarDatas(inicio, fim) {
  const dataInicio = converterDataUTC(inicio);

  const dataFim = converterDataUTC(fim);

  if (!dataInicio || !dataFim || dataFim < dataInicio) {
    return [];
  }

  const datas = [];

  const atual = new Date(dataInicio);

  while (atual <= dataFim) {
    datas.push(formatarDataUTC(atual));

    atual.setUTCDate(atual.getUTCDate() + 1);
  }

  return datas;
}

/* =========================================================
   HORAS
========================================================= */

function normalizarHora(valor) {
  const hora = String(valor ?? "").trim();

  if (!hora) {
    return null;
  }

  const partes = hora.split(":");

  if (partes.length < 2) {
    return null;
  }

  const horas = Number(partes[0]);

  const minutos = Number(partes[1]);

  const segundos = Number(partes[2] ?? 0);

  if (
    !Number.isInteger(horas) ||
    !Number.isInteger(minutos) ||
    !Number.isInteger(segundos) ||
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59 ||
    segundos < 0 ||
    segundos > 59
  ) {
    return null;
  }

  return {
    horas,
    minutos,
    segundos,
  };
}

function converterDataHoraUTC(data, hora) {
  const dataBase = converterDataUTC(data);

  const horaBase = normalizarHora(hora);

  if (!dataBase || !horaBase) {
    return null;
  }

  return Date.UTC(
    dataBase.getUTCFullYear(),
    dataBase.getUTCMonth(),
    dataBase.getUTCDate(),
    horaBase.horas,
    horaBase.minutos,
    horaBase.segundos,
  );
}

function inicioDiaUTC(data) {
  const dataBase = converterDataUTC(data);

  if (!dataBase) {
    return null;
  }

  return dataBase.getTime();
}

function fimDiaUTC(data) {
  const inicio = inicioDiaUTC(data);

  if (inicio === null) {
    return null;
  }

  return inicio + 24 * 60 * 60 * 1000;
}

/* =========================================================
   NORMALIZAR RESULTADO DA PROGRAMAÇÃO
========================================================= */

function obterProgramacoes(resultado) {
  if (Array.isArray(resultado)) {
    return resultado;
  }

  if (Array.isArray(resultado?.programacoes)) {
    return resultado.programacoes;
  }

  if (Array.isArray(resultado?.programacao)) {
    return resultado.programacao;
  }

  return [];
}

/* =========================================================
   MOVIMENTOS
========================================================= */

function chaveMovimento(data, fornecedorId) {
  return `${data}|${fornecedorId}`;
}

function criarMovimento() {
  return {
    recebidoKg: 0,
    compraFuturaKg: 0,
    consumoKg: 0,
  };
}

function adicionarMovimento(mapa, data, fornecedorId, campo, quantidade) {
  if (!data || fornecedorId === null || fornecedorId === undefined) {
    return;
  }

  const quantidadeFinal = paraNumero(quantidade);

  if (quantidadeFinal === 0) {
    return;
  }

  const chave = chaveMovimento(data, fornecedorId);

  const movimento = mapa.get(chave) || criarMovimento();

  movimento[campo] = arredondarKg(paraNumero(movimento[campo]) + quantidadeFinal);

  mapa.set(chave, movimento);
}

/* =========================================================
   RECEITA DA PROGRAMAÇÃO
========================================================= */

export function obterItensReceita(programacao) {
  const itens = Array.isArray(programacao?.receitaItens) ? programacao.receitaItens : [];

  return itens
    .filter((item) => item?.ativo !== false)
    .map((item) => ({
      fornecedorId: item?.fornecedorId ?? item?.fornecedor_id ?? null,

      fornecedorNome: item?.fornecedorNome ?? item?.fornecedor_nome ?? "",

      percentual: paraNumero(item?.percentual),
    }))
    .filter(
      (item) =>
        item.fornecedorId !== null && item.fornecedorId !== undefined && item.percentual > 0,
    );
}

/**
 * Divide o consumo pelos percentuais da receita. O último item fica com a
 * sobra do arredondamento, para a soma bater com o total.
 */
export function distribuirConsumoReceita(consumoTotalKg, itensReceita) {
  const itens = Array.isArray(itensReceita) ? itensReceita : [];

  if (itens.length === 0) {
    return [];
  }

  const total = arredondarKg(consumoTotalKg);

  let acumulado = 0;

  return itens.map((item, indice) => {
    const ultimo = indice === itens.length - 1;

    const consumoKg = ultimo
      ? arredondarKg(total - acumulado)
      : arredondarKg((total * item.percentual) / 100);

    acumulado = arredondarKg(acumulado + consumoKg);

    return {
      ...item,
      consumoKg,
    };
  });
}

/* =========================================================
   CONSUMO TOTAL DE UMA PROGRAMAÇÃO
========================================================= */

export function obterConsumoTotalProgramacao(programacao) {
  const consumoPeriodo = paraNumero(
    programacao?.consumoPeriodoKg ?? programacao?.consumo_periodo_kg,
  );

  if (consumoPeriodo > 0) {
    return consumoPeriodo;
  }

  const pesoKg = paraNumero(programacao?.pesoKg ?? programacao?.peso_kg);

  const possuiHorario =
    Boolean(programacao?.horaInicio ?? programacao?.hora_inicio) &&
    Boolean(programacao?.horaFim ?? programacao?.hora_fim);

  if (!possuiHorario) {
    const quantidadeDiaria = paraNumero(programacao?.quantidade);

    const inicio = programacao?.dataInicio ?? programacao?.data_inicio;

    const fim = programacao?.dataFim ?? programacao?.data_fim;

    const dias = listarDatas(inicio, fim).length;

    return arredondarKg(quantidadeDiaria * pesoKg * dias);
  }

  return arredondarKg(paraNumero(programacao?.quantidade) * pesoKg);
}

/* =========================================================
   CONSUMO DIÁRIO DA PROGRAMAÇÃO

   O cálculo é acumulado desde o início da programação.
   Assim ciclos que atravessam a mudança de data não são
   descartados.
========================================================= */

const SEM_CONSUMO_COM_HORARIO = Object.freeze({ ciclos: 0, pecas: 0, consumoKg: 0 });

export function calcularConsumoProgramacaoNaData(programacao, data) {
  const dataInicio = programacao?.dataInicio ?? programacao?.data_inicio;

  const dataFim = programacao?.dataFim ?? programacao?.data_fim;

  const horaInicio = programacao?.horaInicio ?? programacao?.hora_inicio;

  const horaFim = programacao?.horaFim ?? programacao?.hora_fim;

  const pesoKg = paraNumero(programacao?.pesoKg ?? programacao?.peso_kg);

  /* =======================================================
     REGISTRO SEM HORÁRIO
  ======================================================= */

  if (!horaInicio || !horaFim) {
    if (!dataInicio || !dataFim || data < dataInicio || data > dataFim) {
      return {
        ciclos: null,
        pecas: 0,
        consumoKg: 0,
      };
    }

    const quantidadeDiaria = paraNumero(programacao?.quantidade);

    return {
      ciclos: null,

      pecas: quantidadeDiaria,

      consumoKg: arredondarKg(quantidadeDiaria * pesoKg),
    };
  }

  /* =======================================================
     REGISTRO COM HORÁRIO
  ======================================================= */

  const cicloSegundos = paraNumero(programacao?.cicloSegundos ?? programacao?.ciclo_segundos);

  const cavidadeMolde = paraNumero(programacao?.cavidadeMolde ?? programacao?.cavidade_molde);

  if (!dataInicio || !dataFim || pesoKg <= 0 || cicloSegundos <= 0 || cavidadeMolde <= 0) {
    return { ...SEM_CONSUMO_COM_HORARIO };
  }

  const inicioProgramacao = converterDataHoraUTC(dataInicio, horaInicio);

  const fimProgramacao = converterDataHoraUTC(dataFim, horaFim);

  const inicioDia = inicioDiaUTC(data);

  const fimDia = fimDiaUTC(data);

  if (
    inicioProgramacao === null ||
    fimProgramacao === null ||
    inicioDia === null ||
    fimDia === null ||
    fimProgramacao <= inicioProgramacao
  ) {
    return { ...SEM_CONSUMO_COM_HORARIO };
  }

  if (fimDia <= inicioProgramacao || inicioDia >= fimProgramacao) {
    return { ...SEM_CONSUMO_COM_HORARIO };
  }

  const marcoInicio = Math.max(inicioDia, inicioProgramacao);

  const marcoFim = Math.min(fimDia, fimProgramacao);

  if (marcoFim <= marcoInicio) {
    return { ...SEM_CONSUMO_COM_HORARIO };
  }

  const segundosAteInicio = Math.max(0, (marcoInicio - inicioProgramacao) / 1000);

  const segundosAteFim = Math.max(0, (marcoFim - inicioProgramacao) / 1000);

  const ciclosAntes = Math.floor(segundosAteInicio / cicloSegundos);

  const ciclosAteFim = Math.floor(segundosAteFim / cicloSegundos);

  const ciclosDia = Math.max(ciclosAteFim - ciclosAntes, 0);

  const pecasDia = ciclosDia * cavidadeMolde;

  const consumoKg = arredondarKg(pecasDia * pesoKg);

  return {
    ciclos: ciclosDia,

    pecas: pecasDia,

    consumoKg,
  };
}

/* =========================================================
   FORNECEDORES
========================================================= */

function registrarFornecedor(mapa, fornecedorId, nome = "", ativo = true) {
  if (fornecedorId === null || fornecedorId === undefined) {
    return;
  }

  const chave = String(fornecedorId);

  const existente = mapa.get(chave);

  mapa.set(chave, {
    id: fornecedorId,

    nome: nome || existente?.nome || `Fornecedor ${fornecedorId}`,

    ativo: existente?.ativo ?? ativo,
  });
}

function obterFornecedor(fornecedoresMapa, chave) {
  return (
    fornecedoresMapa.get(chave) || {
      id: chave,

      nome: `Fornecedor ${chave}`,
    }
  );
}

/* =========================================================
   ETAPAS DO CÁLCULO
========================================================= */

/**
 * Materiais disponíveis e as três fontes filtradas pelo material.
 * Lança erro quando o material não está entre os cadastrados.
 */
function filtrarFontesPorMaterial(
  { resultadoSaldos, resultadoCompras, resultadoProgramacao },
  materialId,
) {
  const materiais = Array.isArray(resultadoCompras?.materiais)
    ? resultadoCompras.materiais
    : Array.isArray(resultadoSaldos?.materiais)
      ? resultadoSaldos.materiais
      : [];

  const materialExiste = materiais.some((material) => String(material.id) === String(materialId));

  if (materiais.length > 0 && !materialExiste) {
    throw new Error("O material selecionado não foi encontrado.");
  }

  const saldos = (Array.isArray(resultadoSaldos?.saldos) ? resultadoSaldos.saldos : []).filter(
    (saldo) => String(saldo.materialId) === String(materialId),
  );

  const compras = (Array.isArray(resultadoCompras?.compras) ? resultadoCompras.compras : []).filter(
    (compra) => String(compra.materialId) === String(materialId),
  );

  /*
   * Antes havia uma regra específica para PP.
   * Agora qualquer material cadastrado pode participar
   * da projeção.
   */
  const programacoes = obterProgramacoes(resultadoProgramacao).filter(
    (programacao) =>
      String(programacao?.materialId ?? programacao?.material_id ?? "") === String(materialId),
  );

  return { materiais, saldos, compras, programacoes };
}

/** Fornecedores dos saldos, das compras e das receitas das programações. */
function montarMapaFornecedores(saldos, compras, programacoes, itensReceitaPorProgramacao) {
  const fornecedoresMapa = new Map();

  saldos.forEach((saldo) => {
    registrarFornecedor(
      fornecedoresMapa,
      saldo.fornecedorId,
      saldo.fornecedorNome,
      saldo.fornecedorAtivo,
    );
  });

  compras.forEach((compra) => {
    registrarFornecedor(
      fornecedoresMapa,
      compra.fornecedorId,
      compra.fornecedorNome,
      compra.fornecedorAtivo,
    );
  });

  programacoes.forEach((programacao) => {
    itensReceitaPorProgramacao.get(programacao).forEach((item) => {
      registrarFornecedor(fornecedoresMapa, item.fornecedorId, item.fornecedorNome, true);
    });
  });

  return fornecedoresMapa;
}

/**
 * Saldos-base ativos até o fim e a data em que o cálculo começa: para acertar
 * o primeiro dia pedido, volta até o saldo-base mais recente de cada
 * fornecedor anterior ao início.
 */
function calcularBasesSaldo(saldos, dataInicio, dataFim) {
  const saldosAtivos = saldos
    .filter((saldo) => saldo.ativo === true && saldo.dataBase <= dataFim)
    .sort((a, b) => a.dataBase.localeCompare(b.dataBase));

  const ultimaBaseAntesInicio = new Map();

  saldosAtivos.forEach((saldo) => {
    if (saldo.dataBase > dataInicio) {
      return;
    }

    const chave = String(saldo.fornecedorId);

    const atual = ultimaBaseAntesInicio.get(chave);

    if (
      !atual ||
      saldo.dataBase > atual.dataBase ||
      (saldo.dataBase === atual.dataBase && Number(saldo.id) > Number(atual.id))
    ) {
      ultimaBaseAntesInicio.set(chave, saldo);
    }
  });

  let inicioCalculo = dataInicio;

  ultimaBaseAntesInicio.forEach((saldo) => {
    if (saldo.dataBase < inicioCalculo) {
      inicioCalculo = saldo.dataBase;
    }
  });

  const basesMapa = new Map();

  saldosAtivos.forEach((saldo) => {
    if (saldo.dataBase < inicioCalculo || saldo.dataBase > dataFim) {
      return;
    }

    basesMapa.set(chaveMovimento(saldo.dataBase, saldo.fornecedorId), saldo);
  });

  return { saldosAtivos, inicioCalculo, basesMapa };
}

/** Recebimentos e compras futuras do período, somados por data e fornecedor. */
function adicionarMovimentosCompras(
  movimentosMapa,
  fornecedoresMapa,
  compras,
  inicioCalculo,
  dataFim,
) {
  compras.forEach((compra) => {
    if (compra.ativo === false || compra.status === "CANCELADA") {
      return;
    }

    registrarFornecedor(
      fornecedoresMapa,
      compra.fornecedorId,
      compra.fornecedorNome,
      compra.fornecedorAtivo,
    );

    /* Material já recebido */
    if (compra.status === "RECEBIDA") {
      if (
        compra.dataRecebimento &&
        compra.dataRecebimento >= inicioCalculo &&
        compra.dataRecebimento <= dataFim
      ) {
        adicionarMovimento(
          movimentosMapa,
          compra.dataRecebimento,
          compra.fornecedorId,
          "recebidoKg",
          compra.quantidadeKg,
        );
      }

      return;
    }

    /* Compra futura */
    if (
      (compra.status === "PREVISTA" || compra.status === "CONFIRMADA") &&
      compra.dataPrevista &&
      compra.dataPrevista >= inicioCalculo &&
      compra.dataPrevista <= dataFim
    ) {
      adicionarMovimento(
        movimentosMapa,
        compra.dataPrevista,
        compra.fornecedorId,
        "compraFuturaKg",
        compra.quantidadeKg,
      );
    }
  });
}

/**
 * Consumo diário das programações, distribuído pela receita. Programações
 * com consumo e sem receita voltam na lista `programacoesSemReceita`.
 */
function adicionarMovimentosConsumo(
  movimentosMapa,
  fornecedoresMapa,
  programacoes,
  itensReceitaPorProgramacao,
  inicioCalculo,
  dataFim,
) {
  const programacoesSemReceita = [];

  programacoes.forEach((programacao) => {
    if (programacao.ativo === false) {
      return;
    }

    const inicio = programacao.dataInicio ?? programacao.data_inicio;

    const fim = programacao.dataFim ?? programacao.data_fim;

    if (!inicio || !fim || fim < inicioCalculo || inicio > dataFim) {
      return;
    }

    const itensReceita = itensReceitaPorProgramacao.get(programacao);

    const receitaConfigurada = programacao?.receitaConfigurada === true;

    /* Programação sem receita */
    if (!receitaConfigurada || itensReceita.length === 0) {
      const consumoTotal = obterConsumoTotalProgramacao(programacao);

      if (consumoTotal > 0) {
        programacoesSemReceita.push({
          id: programacao.id,

          codigoProduto: programacao.codigoProduto ?? programacao.codigo_produto ?? "",

          produto:
            programacao.descricao ?? programacao.produto ?? programacao.descricaoProduto ?? "",

          materialId: programacao?.materialId ?? programacao?.material_id ?? null,

          materialNome: programacao?.materialNome ?? programacao?.material_nome ?? "",
        });
      }

      return;
    }

    /*
     * Registra de novo os fornecedores da receita: depois das compras,
     * o nome da receita volta a valer para quem aparece nos dois.
     */
    itensReceita.forEach((item) => {
      registrarFornecedor(fornecedoresMapa, item.fornecedorId, item.fornecedorNome, true);
    });

    /* Intervalo que precisa ser projetado */
    const inicioAplicado = inicio < inicioCalculo ? inicioCalculo : inicio;

    const fimAplicado = fim > dataFim ? dataFim : fim;

    listarDatas(inicioAplicado, fimAplicado).forEach((data) => {
      const consumoDia = calcularConsumoProgramacaoNaData(programacao, data);

      if (consumoDia.consumoKg <= 0) {
        return;
      }

      distribuirConsumoReceita(consumoDia.consumoKg, itensReceita).forEach((item) => {
        adicionarMovimento(movimentosMapa, data, item.fornecedorId, "consumoKg", item.consumoKg);
      });
    });
  });

  return programacoesSemReceita;
}

/** Chaves (texto) dos fornecedores com saldo-base ou com algum movimento. */
function listarFornecedoresEnvolvidos(saldosAtivos, movimentosMapa) {
  const fornecedoresEnvolvidos = new Set();

  saldosAtivos.forEach((saldo) => {
    fornecedoresEnvolvidos.add(String(saldo.fornecedorId));
  });

  movimentosMapa.forEach((_movimento, chave) => {
    const partes = chave.split("|");

    if (partes.length === 2) {
      fornecedoresEnvolvidos.add(partes[1]);
    }
  });

  return fornecedoresEnvolvidos;
}

/**
 * Saldo dia a dia de cada fornecedor: parte do saldo-base e soma recebimentos
 * e compras futuras, menos o consumo. Dias antes de `dataInicio` só servem
 * para chegar ao saldo do primeiro dia e não viram linha.
 */
function montarLinhasSaldo({
  dataInicio,
  dataFim,
  inicioCalculo,
  fornecedoresEnvolvidos,
  fornecedoresMapa,
  basesMapa,
  movimentosMapa,
}) {
  const estadoFornecedores = new Map();

  const linhas = [];

  listarDatas(inicioCalculo, dataFim).forEach((data) => {
    fornecedoresEnvolvidos.forEach((fornecedorChave) => {
      const fornecedor = obterFornecedor(fornecedoresMapa, fornecedorChave);

      const base = basesMapa.get(chaveMovimento(data, fornecedor.id));

      const estadoAnterior = estadoFornecedores.get(fornecedorChave);

      let possuiSaldoBase = estadoAnterior?.possuiSaldoBase === true;

      let saldoInicioKg = possuiSaldoBase ? paraNumero(estadoAnterior?.saldoFinalKg) : null;

      let saldoBaseAplicado = null;

      if (base) {
        possuiSaldoBase = true;

        saldoInicioKg = paraNumero(base.quantidadeKg);

        saldoBaseAplicado = base;
      }

      const movimento = movimentosMapa.get(chaveMovimento(data, fornecedor.id)) || criarMovimento();

      let saldoFinalKg = null;

      if (possuiSaldoBase) {
        saldoFinalKg = arredondarKg(
          paraNumero(saldoInicioKg) +
            paraNumero(movimento.recebidoKg) +
            paraNumero(movimento.compraFuturaKg) -
            paraNumero(movimento.consumoKg),
        );
      }

      estadoFornecedores.set(fornecedorChave, {
        possuiSaldoBase,
        saldoFinalKg,
      });

      if (data < dataInicio) {
        return;
      }

      linhas.push({
        data,

        fornecedorId: fornecedor.id,

        fornecedorNome: fornecedor.nome,

        possuiSaldoBase,

        saldoBaseAplicado: Boolean(saldoBaseAplicado),

        quantidadeSaldoBaseKg: saldoBaseAplicado
          ? paraNumero(saldoBaseAplicado.quantidadeKg)
          : null,

        saldoInicioKg,

        recebidoKg: arredondarKg(movimento.recebidoKg),

        compraFuturaKg: arredondarKg(movimento.compraFuturaKg),

        consumoKg: arredondarKg(movimento.consumoKg),

        saldoFinalKg,
      });
    });
  });

  return linhas;
}

/* =========================================================
   PROJEÇÃO
========================================================= */

/**
 * Calcula a projeção a partir das três fontes já buscadas.
 * `materialId` deve ser o número já validado.
 */
export function calcularProjecao({
  dataInicio,
  dataFim,
  materialId,
  resultadoSaldos,
  resultadoCompras,
  resultadoProgramacao,
}) {
  const { materiais, saldos, compras, programacoes } = filtrarFontesPorMaterial(
    { resultadoSaldos, resultadoCompras, resultadoProgramacao },
    materialId,
  );

  const itensReceitaPorProgramacao = new Map(
    programacoes.map((programacao) => [programacao, obterItensReceita(programacao)]),
  );

  const fornecedoresMapa = montarMapaFornecedores(
    saldos,
    compras,
    programacoes,
    itensReceitaPorProgramacao,
  );

  const { saldosAtivos, inicioCalculo, basesMapa } = calcularBasesSaldo(
    saldos,
    dataInicio,
    dataFim,
  );

  const movimentosMapa = new Map();

  adicionarMovimentosCompras(movimentosMapa, fornecedoresMapa, compras, inicioCalculo, dataFim);

  const programacoesSemReceita = adicionarMovimentosConsumo(
    movimentosMapa,
    fornecedoresMapa,
    programacoes,
    itensReceitaPorProgramacao,
    inicioCalculo,
    dataFim,
  );

  const fornecedoresEnvolvidos = listarFornecedoresEnvolvidos(saldosAtivos, movimentosMapa);

  const linhas = montarLinhasSaldo({
    dataInicio,
    dataFim,
    inicioCalculo,
    fornecedoresEnvolvidos,
    fornecedoresMapa,
    basesMapa,
    movimentosMapa,
  });

  /* Fornecedores sem nenhum saldo-base até o fim do período */
  const fornecedoresComSaldo = new Set(saldosAtivos.map((saldo) => String(saldo.fornecedorId)));

  const fornecedoresSemSaldo = [];

  fornecedoresEnvolvidos.forEach((chave) => {
    if (!fornecedoresComSaldo.has(chave)) {
      const fornecedor = fornecedoresMapa.get(chave);

      fornecedoresSemSaldo.push({
        id: fornecedor?.id ?? chave,

        nome: fornecedor?.nome ?? `Fornecedor ${chave}`,
      });
    }
  });

  const fornecedores = Array.from(fornecedoresEnvolvidos)
    .map((chave) => obterFornecedor(fornecedoresMapa, chave))
    .sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));

  return {
    dataInicio,
    dataFim,

    materialId,

    materiais,

    consumoProgramadoDisponivel: true,

    inicioCalculo,

    linhas,

    fornecedores,

    fornecedoresSemSaldo,

    programacoesSemReceita,
  };
}
