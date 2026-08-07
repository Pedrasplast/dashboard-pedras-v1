/* =====================================================
   OEE - CARGA MAQUINA

   DISPONIBILIDADE
   baseada no calendário real de produção.

   SEGUNDA A SEXTA:
   21h55 programadas por máquina/dia.

   TURNOS:

   TURNO I
   05:00 - 11:00
   12:00 - 14:48
   = 8h48

   TURNO II
   14:48 - 19:00
   20:00 - 23:55
   = 8h07

   TURNO III
   23:55 - 05:10
   intervalo de 15 minutos
   = 5h00

   TOTAL:
   21h55 por máquina/dia útil.

   PARADAS:
   tipo 1 = afeta disponibilidade
   tipo 2 = afeta disponibilidade
   tipo 3 = fora de produção, não afeta

   DISPONIBILIDADE:

   Tempo Programado Total
   =
   dias programados
   ×
   21h55
   ×
   quantidade de injetoras

   Tempo Operacional
   =
   Tempo Programado Total
   -
   Tempo Parado

   Disponibilidade
   =
   Tempo Operacional
   /
   Tempo Programado Total
===================================================== */


/* =====================================================
   CONFIGURAÇÃO DO CALENDÁRIO
===================================================== */

const SEGUNDOS_PROGRAMADOS_DIA_UTIL =
  21 * 60 * 60 +
  55 * 60;


/*
 * Finais de semana com produção especial.
 *
 * Exemplo:
 *
 * "2026-08-08"
 *
 * Sábado e domingo ficam fora do cálculo
 * enquanto não forem adicionados aqui.
 */

const FINAIS_DE_SEMANA_PROGRAMADOS = [
  // "2026-08-08",
  // "2026-08-15",
];


/* =====================================================
   CONVERTER NÚMERO
===================================================== */

function converterNumero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  if (
    typeof valor === "number"
  ) {
    return Number.isFinite(valor)
      ? valor
      : 0;
  }

  let texto =
    String(valor).trim();

  if (!texto) {
    return 0;
  }

  /*
   * Trata:
   *
   * 1.234,56
   * 1234,56
   * 1234.56
   */

  if (
    texto.includes(",") &&
    texto.includes(".")
  ) {
    texto =
      texto
        .replace(/\./g, "")
        .replace(",", ".");
  } else if (
    texto.includes(",")
  ) {
    texto =
      texto.replace(",", ".");
  }

  const numero =
    Number(texto);

  return Number.isFinite(numero)
    ? numero
    : 0;
}


/* =====================================================
   DURAÇÃO PARA SEGUNDOS
===================================================== */

function duracaoParaSegundos(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  if (
    typeof valor === "number"
  ) {
    return Math.max(
      0,
      valor,
    );
  }

  const texto =
    String(valor).trim();

  if (!texto) {
    return 0;
  }

  /*
   * HH:MM:SS
   */

  if (
    /^\d+:\d{2}:\d{2}$/.test(
      texto,
    )
  ) {
    const [
      horas,
      minutos,
      segundos,
    ] =
      texto
        .split(":")
        .map(Number);

    return (
      horas * 3600 +
      minutos * 60 +
      segundos
    );
  }

  /*
   * MM:SS
   */

  if (
    /^\d+:\d{2}$/.test(
      texto,
    )
  ) {
    const [
      minutos,
      segundos,
    ] =
      texto
        .split(":")
        .map(Number);

    return (
      minutos * 60 +
      segundos
    );
  }

  /*
   * Número puro.
   */

  const numero =
    Number(texto);

  return Number.isFinite(numero)
    ? Math.max(
        0,
        numero,
      )
    : 0;
}


/* =====================================================
   SEGUNDOS PARA HH:MM:SS
===================================================== */

export function formatarSegundos(
  segundos,
) {
  const total =
    Math.max(
      0,
      Math.round(
        converterNumero(
          segundos,
        ),
      ),
    );

  const horas =
    Math.floor(
      total / 3600,
    );

  const minutos =
    Math.floor(
      (total % 3600) /
        60,
    );

  const segundosRestantes =
    total % 60;

  return [
    String(horas).padStart(
      2,
      "0",
    ),

    String(minutos).padStart(
      2,
      "0",
    ),

    String(
      segundosRestantes,
    ).padStart(
      2,
      "0",
    ),
  ].join(":");
}


/* =====================================================
   DATA DO REGISTRO
===================================================== */

function obterDataRegistro(item) {
  const valor =
    item?.lista_de_data ||
    item?.inicio ||
    item?.inicio_dia ||
    item?.data ||
    null;

  if (!valor) {
    return "";
  }

  const texto =
    String(valor).trim();

  const correspondencia =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );

  if (!correspondencia) {
    return "";
  }

  return [
    correspondencia[1],
    correspondencia[2],
    correspondencia[3],
  ].join("-");
}


/* =====================================================
   DATA ISO PARA DATE
===================================================== */

function converterDataISO(valor) {
  if (!valor) {
    return null;
  }

  const correspondencia =
    String(valor).match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    );

  if (!correspondencia) {
    return null;
  }

  const ano =
    Number(
      correspondencia[1],
    );

  const mes =
    Number(
      correspondencia[2],
    ) - 1;

  const dia =
    Number(
      correspondencia[3],
    );

  /*
   * Meio-dia evita problemas de mudança
   * de data por timezone.
   */

  const data =
    new Date(
      ano,
      mes,
      dia,
      12,
      0,
      0,
    );

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return null;
  }

  return data;
}


/* =====================================================
   DATE PARA ISO
===================================================== */

function formatarDataISO(data) {
  const ano =
    data.getFullYear();

  const mes =
    String(
      data.getMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const dia =
    String(
      data.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${ano}-${mes}-${dia}`;
}


/* =====================================================
   DIA PROGRAMADO?
===================================================== */

function diaEhProgramado(data) {
  /*
   * JavaScript:
   *
   * 0 = Domingo
   * 1 = Segunda
   * 2 = Terça
   * 3 = Quarta
   * 4 = Quinta
   * 5 = Sexta
   * 6 = Sábado
   */

  const diaSemana =
    data.getDay();

  /*
   * Segunda a sexta.
   */

  if (
    diaSemana >= 1 &&
    diaSemana <= 5
  ) {
    return true;
  }

  /*
   * Fim de semana especial.
   */

  const dataISO =
    formatarDataISO(
      data,
    );

  return (
    FINAIS_DE_SEMANA_PROGRAMADOS.includes(
      dataISO,
    )
  );
}


/* =====================================================
   CALCULAR TEMPO PROGRAMADO

   IMPORTANTE:

   Cada máquina possui 21h55 programadas
   por dia útil.

   Portanto:

   tempoProgramado =
   diasProgramados
   ×
   quantidadeMaquinas
   ×
   21h55
===================================================== */

function calcularTempoProgramado(
  dataInicio,
  dataFim,
  quantidadeMaquinas = 1,
) {
  const inicio =
    converterDataISO(
      dataInicio,
    );

  const fim =
    converterDataISO(
      dataFim,
    );

  if (
    !inicio ||
    !fim ||
    inicio > fim
  ) {
    return {
      segundos: 0,

      diasProgramados: 0,

      quantidadeMaquinas: 0,

      maquinaDias: 0,
    };
  }

  const quantidade =
    Math.max(
      1,
      Number(
        quantidadeMaquinas,
      ) || 1,
    );

  let diasProgramados = 0;

  const atual =
    new Date(
      inicio,
    );

  while (
    atual <= fim
  ) {
    if (
      diaEhProgramado(
        atual,
      )
    ) {
      diasProgramados +=
        1;
    }

    atual.setDate(
      atual.getDate() + 1,
    );
  }

  /*
   * Exemplo:
   *
   * 5 dias úteis
   * ×
   * 11 máquinas
   *
   * = 55 máquina-dias
   */

  const maquinaDias =
    diasProgramados *
    quantidade;

  /*
   * Tempo total programado
   * de todas as máquinas.
   */

  const segundos =
    maquinaDias *
    SEGUNDOS_PROGRAMADOS_DIA_UTIL;

  return {
    segundos,

    diasProgramados,

    quantidadeMaquinas:
      quantidade,

    maquinaDias,
  };
}


/* =====================================================
   DESCOBRIR PERÍODO PELOS DADOS

   Usado quando o usuário não seleciona
   Data Inicial e Data Final.
===================================================== */

function obterPeriodoDosDados(dados) {
  if (
    !Array.isArray(dados) ||
    dados.length === 0
  ) {
    return {
      dataInicio: "",
      dataFim: "",
    };
  }

  const datas =
    dados
      .map(
        obterDataRegistro,
      )
      .filter(Boolean)
      .sort();

  if (
    datas.length === 0
  ) {
    return {
      dataInicio: "",
      dataFim: "",
    };
  }

  return {
    dataInicio:
      datas[0],

    dataFim:
      datas[
        datas.length - 1
      ],
  };
}


/* =====================================================
   IDENTIFICA PARADA
===================================================== */

function registroEhParada(item) {
  const tipo =
    String(
      item?.tipo ??
        "",
    ).trim();

  return (
    tipo === "1" ||
    tipo === "2" ||
    tipo === "3"
  );
}


/* =====================================================
   TOTAL PRODUZIDO
===================================================== */

function obterTotalProduzido(item) {
  const conforme =
    converterNumero(
      item?.conforme,
    );

  const danificada =
    converterNumero(
      item?.danificada,
    );

  return (
    conforme +
    danificada
  );
}


/* =====================================================
   CICLO REAL
===================================================== */

function obterCicloReal(item) {
  /*
   * Primeiro tenta utilizar
   * uma coluna ciclo do banco.
   */

  const cicloDireto =
    converterNumero(
      item?.ciclo,
    );

  if (
    cicloDireto > 0
  ) {
    return cicloDireto;
  }

  /*
   * Caso não haja ciclo:
   *
   * duração / quantidade produzida
   */

  const totalProduzido =
    obterTotalProduzido(
      item,
    );

  const duracao =
    duracaoParaSegundos(
      item?.duracao,
    );

  if (
    totalProduzido <= 0 ||
    duracao <= 0
  ) {
    return 0;
  }

  return (
    duracao /
    totalProduzido
  );
}


/* =====================================================
   REFERÊNCIA HISTÓRICA DE CICLO

   Média dos 20% melhores ciclos
   históricos de cada produto.
===================================================== */

export function criarReferenciaHistoricaCiclo(
  dados,
) {
  const referencias =
    new Map();

  if (
    !Array.isArray(dados) ||
    dados.length === 0
  ) {
    return referencias;
  }

  const produtos =
    new Map();

  dados.forEach(
    (item) => {
      /*
       * Paradas não entram
       * na referência de ciclo.
       */

      if (
        registroEhParada(
          item,
        )
      ) {
        return;
      }

      const produto =
        String(
          item?.cod_prod ??
            "",
        ).trim();

      if (!produto) {
        return;
      }

      const ciclo =
        obterCicloReal(
          item,
        );

      if (
        ciclo <= 0 ||
        !Number.isFinite(
          ciclo,
        )
      ) {
        return;
      }

      if (
        !produtos.has(
          produto,
        )
      ) {
        produtos.set(
          produto,
          [],
        );
      }

      produtos
        .get(
          produto,
        )
        .push(
          ciclo,
        );
    },
  );

  produtos.forEach(
    (
      ciclos,
      produto,
    ) => {
      const ordenados =
        [...ciclos].sort(
          (a, b) =>
            a - b,
        );

      /*
       * Melhores 20%.
       */

      const quantidade =
        Math.max(
          1,
          Math.ceil(
            ordenados.length *
              0.2,
          ),
        );

      const melhores =
        ordenados.slice(
          0,
          quantidade,
        );

      const soma =
        melhores.reduce(
          (
            total,
            ciclo,
          ) =>
            total +
            ciclo,
          0,
        );

      const media =
        melhores.length > 0
          ? soma /
            melhores.length
          : 0;

      if (
        media > 0 &&
        Number.isFinite(
          media,
        )
      ) {
        referencias.set(
          produto,
          media,
        );
      }
    },
  );

  return referencias;
}


/* =====================================================
   RESULTADO VAZIO
===================================================== */

function criarResultadoVazio() {
  return {
    disponibilidade: 0,

    performance: 0,

    qualidade: 0,

    oee: 0,

    conforme: 0,

    danificada: 0,

    totalProduzido: 0,

    diasProgramados: 0,

    quantidadeMaquinas: 0,

    maquinaDias: 0,

    tempoProgramadoSegundos:
      0,

    tempoProduzindoSegundos:
      0,

    tempoParadoSegundos:
      0,

    tempoConsideradoSegundos:
      0,

    tempoProgramado:
      "00:00:00",

    tempoProduzindo:
      "00:00:00",

    tempoParado:
      "00:00:00",

    tempoConsiderado:
      "00:00:00",

    performanceEstimada:
      true,

    produtosComReferencia:
      0,

    produtosSemReferencia:
      0,
  };
}


/* =====================================================
   CALCULAR OEE
===================================================== */

export function calcularOeeCargaMaquina(
  dadosFiltrados,
  dadosHistoricos = dadosFiltrados,
  opcoes = {},
) {
  if (
    !Array.isArray(
      dadosFiltrados,
    )
  ) {
    return criarResultadoVazio();
  }

  /* =================================================
     PERÍODO
  ================================================= */

  const periodoDados =
    obterPeriodoDosDados(
      dadosFiltrados,
    );

  const dataInicio =
    opcoes.dataInicio ||
    periodoDados.dataInicio;

  const dataFim =
    opcoes.dataFim ||
    periodoDados.dataFim;


  /* =================================================
     QUANTIDADE DE INJETORAS

     IMPORTANTE:

     O tempo programado precisa existir
     para CADA máquina.

     Preferimos usar dadosHistoricos porque,
     quando um produto é filtrado,
     dadosFiltrados pode conter somente
     algumas máquinas na produção.

     dadosHistoricos representa a base
     das máquinas consideradas no dashboard.
  ================================================= */

  const baseParaInjetoras =
    Array.isArray(
      dadosHistoricos,
    ) &&
    dadosHistoricos.length > 0
      ? dadosHistoricos
      : dadosFiltrados;

  const injetorasConsideradas =
    [
      ...new Set(
        baseParaInjetoras
          .map(
            (item) =>
              String(
                item?.injetora ??
                  "",
              ).trim(),
          )
          .filter(Boolean),
      ),
    ];

  const quantidadeMaquinas =
    Math.max(
      1,
      injetorasConsideradas.length,
    );


  /* =================================================
     TEMPO PROGRAMADO

     Exemplo:

     10 dias úteis
     ×
     11 máquinas
     ×
     21h55
  ================================================= */

  const calendario =
    calcularTempoProgramado(
      dataInicio,
      dataFim,
      quantidadeMaquinas,
    );

  const tempoProgramado =
    calendario.segundos;


  /* =================================================
     REFERÊNCIA HISTÓRICA
  ================================================= */

  const referencias =
    criarReferenciaHistoricaCiclo(
      Array.isArray(
        dadosHistoricos,
      )
        ? dadosHistoricos
        : dadosFiltrados,
    );


  /* =================================================
     ACUMULADORES
  ================================================= */

  let conformeTotal = 0;

  let danificadaTotal = 0;

  let tempoParado = 0;

  let tempoIdeal = 0;

  const produtosComReferencia =
    new Set();

  const produtosSemReferencia =
    new Set();


  /* =================================================
     PERCORRE REGISTROS
  ================================================= */

  dadosFiltrados.forEach(
    (item) => {
      const tipo =
        String(
          item?.tipo ??
            "",
        ).trim();

      const duracao =
        duracaoParaSegundos(
          item?.duracao,
        );


      /* =============================================
         PARADA TIPO 1
         PLANEJADA

         Neste modelo:
         afeta a disponibilidade.
      ============================================= */

      if (
        tipo === "1"
      ) {
        tempoParado +=
          duracao;

        return;
      }


      /* =============================================
         PARADA TIPO 2
         NÃO PLANEJADA

         Afeta disponibilidade.
      ============================================= */

      if (
        tipo === "2"
      ) {
        tempoParado +=
          duracao;

        return;
      }


      /* =============================================
         TIPO 3

         Intervalo / Fora de Produção.

         Não entra como perda
         de disponibilidade.
      ============================================= */

      if (
        tipo === "3"
      ) {
        return;
      }


      /* =============================================
         PRODUÇÃO
      ============================================= */

      const conforme =
        converterNumero(
          item?.conforme,
        );

      const danificada =
        converterNumero(
          item?.danificada,
        );

      const totalProduzido =
        conforme +
        danificada;

      if (
        totalProduzido <= 0
      ) {
        return;
      }

      conformeTotal +=
        conforme;

      danificadaTotal +=
        danificada;


      /* =============================================
         PERFORMANCE
      ============================================= */

      const produto =
        String(
          item?.cod_prod ??
            "",
        ).trim();

      const cicloReferencia =
        referencias.get(
          produto,
        ) || 0;

      if (
        cicloReferencia > 0
      ) {
        tempoIdeal +=
          totalProduzido *
          cicloReferencia;

        if (produto) {
          produtosComReferencia.add(
            produto,
          );
        }
      } else if (
        produto
      ) {
        produtosSemReferencia.add(
          produto,
        );
      }
    },
  );


  /* =====================================================
     PROTEÇÃO DO TEMPO PARADO

     Nunca pode ser maior que
     o tempo programado.
  ===================================================== */

  tempoParado =
    Math.min(
      tempoParado,
      tempoProgramado,
    );


  /* =====================================================
     TEMPO OPERACIONAL

     PROGRAMADO - PARADAS
  ===================================================== */

  const tempoOperacional =
    Math.max(
      0,
      tempoProgramado -
        tempoParado,
    );


  /* =====================================================
     DISPONIBILIDADE

     tempo operacional
     -----------------
     tempo programado
  ===================================================== */

  const disponibilidade =
    tempoProgramado > 0
      ? tempoOperacional /
        tempoProgramado
      : 0;


  /* =====================================================
     QUALIDADE
  ===================================================== */

  const totalProduzido =
    conformeTotal +
    danificadaTotal;

  const qualidade =
    totalProduzido > 0
      ? conformeTotal /
        totalProduzido
      : 0;


  /* =====================================================
     PERFORMANCE

     tempo ideal
     ----------
     tempo operacional

     Ainda é uma estimativa histórica.
  ===================================================== */

  let performance =
    tempoOperacional > 0
      ? tempoIdeal /
        tempoOperacional
      : 0;

  performance =
    Math.max(
      0,
      Math.min(
        1,
        performance,
      ),
    );


  /* =====================================================
     OEE
  ===================================================== */

  const oee =
    disponibilidade *
    performance *
    qualidade;


  /* =====================================================
     RESULTADO
  ===================================================== */

  return {
    disponibilidade:
      disponibilidade *
      100,

    performance:
      performance *
      100,

    qualidade:
      qualidade *
      100,

    oee:
      oee *
      100,

    conforme:
      conformeTotal,

    danificada:
      danificadaTotal,

    totalProduzido,


    /* =================================================
       CALENDÁRIO
    ================================================= */

    diasProgramados:
      calendario.diasProgramados,

    quantidadeMaquinas:
      calendario.quantidadeMaquinas,

    maquinaDias:
      calendario.maquinaDias,


    /* =================================================
       TEMPOS EM SEGUNDOS
    ================================================= */

    tempoProgramadoSegundos:
      tempoProgramado,

    tempoProduzindoSegundos:
      tempoOperacional,

    tempoParadoSegundos:
      tempoParado,

    tempoConsideradoSegundos:
      tempoProgramado,


    /* =================================================
       TEMPOS FORMATADOS
    ================================================= */

    tempoProgramado:
      formatarSegundos(
        tempoProgramado,
      ),

    /*
     * Mantemos o nome tempoProduzindo
     * porque o Dashboard já usa esse campo.
     *
     * Neste novo cálculo ele representa:
     *
     * Tempo Programado - Tempo Parado
     */

    tempoProduzindo:
      formatarSegundos(
        tempoOperacional,
      ),

    tempoParado:
      formatarSegundos(
        tempoParado,
      ),

    tempoConsiderado:
      formatarSegundos(
        tempoProgramado,
      ),


    /* =================================================
       PERFORMANCE
    ================================================= */

    performanceEstimada:
      true,

    produtosComReferencia:
      produtosComReferencia.size,

    produtosSemReferencia:
      produtosSemReferencia.size,
  };
}