/* =========================================================
   NÚMERO SEGURO
========================================================= */

function numeroSeguro(valor) {
  const numero =
    Number(valor ?? 0);

  return Number.isFinite(numero)
    ? numero
    : 0;
}


/* =========================================================
   IDENTIFICAR TIPO
========================================================= */

function identificarTipo(registro) {
  const tipo =
    String(
      registro?.tipo ?? "",
    ).trim();


  if (
    tipo === "Receita" ||
    tipo === "Despesa"
  ) {
    return tipo;
  }


  const codigo =
    String(
      registro?.codigo_categoria ?? "",
    ).trim();


  if (
    codigo === "1" ||
    codigo.startsWith("1.")
  ) {
    return "Receita";
  }


  if (
    codigo === "2" ||
    codigo.startsWith("2.")
  ) {
    return "Despesa";
  }


  return "Outro";
}


/* =========================================================
   CALCULAR VARIAÇÃO
========================================================= */

export function calcularVariacao(
  previsto,
  realizado,
) {
  const valorPrevisto =
    numeroSeguro(previsto);

  const valorRealizado =
    numeroSeguro(realizado);


  const variacao =
    valorRealizado -
    valorPrevisto;


  const percentual =
    valorPrevisto !== 0
      ? (
          variacao /
          Math.abs(valorPrevisto)
        ) * 100
      : null;


  return {
    previsto:
      valorPrevisto,

    realizado:
      valorRealizado,

    variacao,

    percentual,
  };
}


/* =========================================================
   CRIAR RESUMO
========================================================= */

function criarResumo(
  previsto,
  realizado,
) {
  return calcularVariacao(
    previsto,
    realizado,
  );
}


/* =========================================================
   PROCESSAR FINANCEIRO

   O Omie trabalha com estrutura hierárquica:

   1
   1.01
   1.01.01

   Portanto:

   - não somamos níveis diferentes;
   - Receita total vem do código 1;
   - Despesa total vem do código 2;
   - identificamos categorias que possuem filhos.
========================================================= */

export function processarFinanceiro(
  registros,
) {
  const dados =
    Array.isArray(registros)
      ? registros
      : [];


  const linhas = [];

  const receitas = [];

  const despesas = [];

  const outros = [];


  /* =======================================================
     IDENTIFICAR CATEGORIAS AGRUPADORAS
  ======================================================= */

  const codigosAgrupadores =
    new Set();


  for (const registro of dados) {
    const codigo =
      String(
        registro
          ?.codigo_categoria ??
          "",
      ).trim();


    if (!codigo) {
      continue;
    }


    const partes =
      codigo.split(".");


    if (
      partes.length <= 1
    ) {
      continue;
    }


    for (
      let indice = 1;
      indice < partes.length;
      indice += 1
    ) {
      const codigoPai =
        partes
          .slice(
            0,
            indice,
          )
          .join(".");


      codigosAgrupadores.add(
        codigoPai,
      );
    }
  }


  /* =======================================================
     LINHAS RAIZ
  ======================================================= */

  let receitaRaiz =
    null;

  let despesaRaiz =
    null;


  /* =======================================================
     PROCESSAR LINHAS
  ======================================================= */

  for (const registro of dados) {
    const tipo =
      identificarTipo(
        registro,
      );


    const codigo =
      String(
        registro
          ?.codigo_categoria ??
          "",
      ).trim();


    const valores =
      calcularVariacao(
        registro
          ?.valor_previsto,

        registro
          ?.valor_realizado,
      );


    const linha = {
      ...registro,

      tipo,

      tem_filhos:
        codigosAgrupadores.has(
          codigo,
        ),

      valor_previsto:
        valores.previsto,

      valor_realizado:
        valores.realizado,

      variacao_valor:
        valores.variacao,

      variacao_percentual:
        valores.percentual,
    };


    linhas.push(
      linha,
    );


    /* =====================================================
       SEPARAÇÃO POR TIPO
    ===================================================== */

    if (
      tipo ===
      "Receita"
    ) {
      receitas.push(
        linha,
      );
    } else if (
      tipo ===
      "Despesa"
    ) {
      despesas.push(
        linha,
      );
    } else {
      outros.push(
        linha,
      );
    }


    /* =====================================================
       TOTAL RAIZ DE RECEITAS
    ===================================================== */

    if (
      codigo ===
      "1"
    ) {
      receitaRaiz =
        linha;
    }


    /* =====================================================
       TOTAL RAIZ DE DESPESAS
    ===================================================== */

    if (
      codigo ===
      "2"
    ) {
      despesaRaiz =
        linha;
    }
  }


  /* =======================================================
     RECEITAS

     Usamos somente a categoria raiz:

     1 = RECEITAS
  ======================================================= */

  const receitasResumo =
    criarResumo(
      receitaRaiz
        ?.valor_previsto ??
        0,

      receitaRaiz
        ?.valor_realizado ??
        0,
    );


  /* =======================================================
     DESPESAS

     Usamos somente:

     2 = DESPESAS
  ======================================================= */

  const despesasResumo =
    criarResumo(
      despesaRaiz
        ?.valor_previsto ??
        0,

      despesaRaiz
        ?.valor_realizado ??
        0,
    );


  /* =======================================================
     SALDO

     Receita - Despesa
  ======================================================= */

  const saldoPrevisto =
    receitasResumo.previsto -
    despesasResumo.previsto;


  const saldoRealizado =
    receitasResumo.realizado -
    despesasResumo.realizado;


  const saldoResumo =
    criarResumo(
      saldoPrevisto,
      saldoRealizado,
    );


  return {
    linhas,

    receitas,

    despesas,

    outros,

    resumo: {
      receitas:
        receitasResumo,

      despesas:
        despesasResumo,

      saldo:
        saldoResumo,
    },
  };
}


/* =========================================================
   FORMATAR MOEDA
========================================================= */

const formatadorMoeda =
  new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    },
  );


export function formatarMoeda(
  valor,
) {
  return formatadorMoeda.format(
    numeroSeguro(valor),
  );
}


/* =========================================================
   FORMATAR PERCENTUAL
========================================================= */

const formatadorPercentual =
  new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits:
        1,

      maximumFractionDigits:
        1,
    },
  );


export function formatarPercentual(
  valor,
) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(valor),
    )
  ) {
    return "-";
  }


  return `${formatadorPercentual.format(
    Number(valor),
  )}%`;
}


/* =========================================================
   FORMATAR DATA
========================================================= */

export function formatarData(
  valor,
) {
  if (!valor) {
    return "-";
  }


  const texto =
    String(valor);


  const partes =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );


  if (partes) {
    return `${partes[3]}/${partes[2]}/${partes[1]}`;
  }


  const data =
    new Date(valor);


  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "-";
  }


  return data.toLocaleDateString(
    "pt-BR",
  );
}


/* =========================================================
   FORMATAR DATA/HORA
========================================================= */

const formatadorDataHora =
  new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",

      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );


export function formatarDataHora(
  valor,
) {
  if (!valor) {
    return "-";
  }


  const data =
    new Date(valor);


  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "-";
  }


  return formatadorDataHora.format(
    data,
  );
}


/* =========================================================
   MESES
========================================================= */

export const mesesFinanceiro = [
  {
    valor: 1,
    nome: "Janeiro",
  },

  {
    valor: 2,
    nome: "Fevereiro",
  },

  {
    valor: 3,
    nome: "Março",
  },

  {
    valor: 4,
    nome: "Abril",
  },

  {
    valor: 5,
    nome: "Maio",
  },

  {
    valor: 6,
    nome: "Junho",
  },

  {
    valor: 7,
    nome: "Julho",
  },

  {
    valor: 8,
    nome: "Agosto",
  },

  {
    valor: 9,
    nome: "Setembro",
  },

  {
    valor: 10,
    nome: "Outubro",
  },

  {
    valor: 11,
    nome: "Novembro",
  },

  {
    valor: 12,
    nome: "Dezembro",
  },
];