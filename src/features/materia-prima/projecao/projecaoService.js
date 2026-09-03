import {
  buscarComprasFuturas,
} from "../compras-futuras/comprasFuturasService";

import {
  buscarProgramacao,
} from "../programacao/programacaoService";

import {
  buscarSaldosIniciais,
} from "./saldo-inicial/saldoInicialService";


/* =========================================================
   NÚMEROS
========================================================= */

function numero(
  valor,
) {
  const convertido =
    Number(
      valor,
    );


  return Number.isFinite(
    convertido,
  )
    ? convertido
    : 0;
}


function arredondarKg(
  valor,
) {
  return Math.round(
    (
      numero(
        valor,
      ) +
      Number.EPSILON
    ) *
      1000000,
  ) /
    1000000;
}


/* =========================================================
   DATAS
========================================================= */

function converterDataUTC(
  valor,
) {
  if (!valor) {
    return null;
  }


  const [
    ano,
    mes,
    dia,
  ] =
    String(
      valor,
    )
      .split("-")
      .map(Number);


  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return null;
  }


  return new Date(
    Date.UTC(
      ano,
      mes - 1,
      dia,
    ),
  );
}


function formatarDataUTC(
  data,
) {
  return data
    .toISOString()
    .slice(
      0,
      10,
    );
}


function listarDatas(
  inicio,
  fim,
) {
  const dataInicio =
    converterDataUTC(
      inicio,
    );

  const dataFim =
    converterDataUTC(
      fim,
    );


  if (
    !dataInicio ||
    !dataFim ||
    dataFim <
      dataInicio
  ) {
    return [];
  }


  const datas = [];

  const atual =
    new Date(
      dataInicio,
    );


  while (
    atual <=
    dataFim
  ) {
    datas.push(
      formatarDataUTC(
        atual,
      ),
    );


    atual.setUTCDate(
      atual.getUTCDate() +
        1,
    );
  }


  return datas;
}


/* =========================================================
   HORAS
========================================================= */

function normalizarHora(
  valor,
) {
  const hora =
    String(
      valor ?? "",
    ).trim();


  if (!hora) {
    return null;
  }


  const partes =
    hora.split(
      ":",
    );


  if (
    partes.length <
    2
  ) {
    return null;
  }


  const horas =
    Number(
      partes[0],
    );

  const minutos =
    Number(
      partes[1],
    );

  const segundos =
    Number(
      partes[2] ??
      0,
    );


  if (
    !Number.isInteger(
      horas,
    ) ||
    !Number.isInteger(
      minutos,
    ) ||
    !Number.isInteger(
      segundos,
    ) ||
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


function converterDataHoraUTC(
  data,
  hora,
) {
  const dataBase =
    converterDataUTC(
      data,
    );

  const horaBase =
    normalizarHora(
      hora,
    );


  if (
    !dataBase ||
    !horaBase
  ) {
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


function inicioDiaUTC(
  data,
) {
  const dataBase =
    converterDataUTC(
      data,
    );


  if (!dataBase) {
    return null;
  }


  return dataBase.getTime();
}


function fimDiaUTC(
  data,
) {
  const inicio =
    inicioDiaUTC(
      data,
    );


  if (
    inicio === null
  ) {
    return null;
  }


  return (
    inicio +
    24 *
      60 *
      60 *
      1000
  );
}


/* =========================================================
   NORMALIZAR RESULTADO DA PROGRAMAÇÃO
========================================================= */

function obterProgramacoes(
  resultado,
) {
  if (
    Array.isArray(
      resultado,
    )
  ) {
    return resultado;
  }


  if (
    Array.isArray(
      resultado
        ?.programacoes,
    )
  ) {
    return resultado
      .programacoes;
  }


  if (
    Array.isArray(
      resultado
        ?.programacao,
    )
  ) {
    return resultado
      .programacao;
  }


  return [];
}


/* =========================================================
   MOVIMENTOS
========================================================= */

function chaveMovimento(
  data,
  fornecedorId,
) {
  return `${data}|${fornecedorId}`;
}


function criarMovimento() {
  return {
    recebidoKg: 0,

    compraFuturaKg: 0,

    consumoKg: 0,
  };
}


function adicionarMovimento(
  mapa,
  data,
  fornecedorId,
  campo,
  quantidade,
) {
  if (
    !data ||
    fornecedorId ===
      null ||
    fornecedorId ===
      undefined
  ) {
    return;
  }


  const quantidadeFinal =
    numero(
      quantidade,
    );


  if (
    quantidadeFinal ===
    0
  ) {
    return;
  }


  const chave =
    chaveMovimento(
      data,
      fornecedorId,
    );


  const movimento =
    mapa.get(
      chave,
    ) ||
    criarMovimento();


  movimento[campo] =
    arredondarKg(
      numero(
        movimento[campo],
      ) +
        quantidadeFinal,
    );


  mapa.set(
    chave,
    movimento,
  );
}


/* =========================================================
   RECEITA DA PROGRAMAÇÃO
========================================================= */

function obterItensReceita(
  programacao,
) {
  const itens =
    Array.isArray(
      programacao
        ?.receitaItens,
    )
      ? programacao
          .receitaItens
      : [];


  return itens
    .filter(
      (
        item,
      ) =>
        item?.ativo !==
        false,
    )
    .map(
      (
        item,
      ) => ({
        fornecedorId:
          item
            ?.fornecedorId ??
          item
            ?.fornecedor_id ??
          null,

        fornecedorNome:
          item
            ?.fornecedorNome ??
          item
            ?.fornecedor_nome ??
          "",

        percentual:
          numero(
            item
              ?.percentual,
          ),
      }),
    )
    .filter(
      (
        item,
      ) =>
        item.fornecedorId !==
          null &&
        item.fornecedorId !==
          undefined &&
        item.percentual >
          0,
    );
}


/* =========================================================
   CONSUMO TOTAL DE UMA PROGRAMAÇÃO
========================================================= */

function obterConsumoTotalProgramacao(
  programacao,
) {
  const consumoPeriodo =
    numero(
      programacao
        ?.consumoPeriodoKg ??
      programacao
        ?.consumo_periodo_kg,
    );


  if (
    consumoPeriodo >
    0
  ) {
    return consumoPeriodo;
  }


  const pesoKg =
    numero(
      programacao
        ?.pesoKg ??
      programacao
        ?.peso_kg,
    );


  /*
   * Para registros antigos sem horário,
   * quantidade continua representando
   * quantidade diária.
   */
  const possuiHorario =
    Boolean(
      programacao
        ?.horaInicio ??
      programacao
        ?.hora_inicio,
    ) &&
    Boolean(
      programacao
        ?.horaFim ??
      programacao
        ?.hora_fim,
    );


  if (!possuiHorario) {
    const quantidadeDiaria =
      numero(
        programacao
          ?.quantidade,
      );


    const inicio =
      programacao
        ?.dataInicio ??
      programacao
        ?.data_inicio;

    const fim =
      programacao
        ?.dataFim ??
      programacao
        ?.data_fim;


    const dias =
      listarDatas(
        inicio,
        fim,
      ).length;


    return arredondarKg(
      quantidadeDiaria *
        pesoKg *
        dias,
    );
  }


  /*
   * Nos registros novos, quantidade
   * representa o total de peças previstas
   * para o período inteiro.
   */
  return arredondarKg(
    numero(
      programacao
        ?.quantidade,
    ) *
      pesoKg,
  );
}


/* =========================================================
   CONSUMO DIÁRIO DA PROGRAMAÇÃO

   IMPORTANTE:

   Não fazemos:

   floor(segundos_do_dia / ciclo)

   isoladamente para cada dia.

   Fazemos o cálculo acumulado desde o início
   da programação para não perder ciclos que
   atravessam a mudança de data.
========================================================= */

function calcularConsumoProgramacaoNaData(
  programacao,
  data,
) {
  const dataInicio =
    programacao
      ?.dataInicio ??
    programacao
      ?.data_inicio;

  const dataFim =
    programacao
      ?.dataFim ??
    programacao
      ?.data_fim;

  const horaInicio =
    programacao
      ?.horaInicio ??
    programacao
      ?.hora_inicio;

  const horaFim =
    programacao
      ?.horaFim ??
    programacao
      ?.hora_fim;


  const pesoKg =
    numero(
      programacao
        ?.pesoKg ??
      programacao
        ?.peso_kg,
    );


  /* =======================================================
     REGISTRO ANTIGO

     Sem hora inicial/final:
     mantém o comportamento anterior.
  ======================================================= */

  if (
    !horaInicio ||
    !horaFim
  ) {
    if (
      !dataInicio ||
      !dataFim ||
      data <
        dataInicio ||
      data >
        dataFim
    ) {
      return {
        ciclos: null,

        pecas: 0,

        consumoKg: 0,
      };
    }


    const quantidadeDiaria =
      numero(
        programacao
          ?.quantidade,
      );


    return {
      ciclos: null,

      pecas:
        quantidadeDiaria,

      consumoKg:
        arredondarKg(
          quantidadeDiaria *
            pesoKg,
        ),
    };
  }


  /* =======================================================
     REGISTRO NOVO
  ======================================================= */

  const cicloSegundos =
    numero(
      programacao
        ?.cicloSegundos ??
      programacao
        ?.ciclo_segundos,
    );

  const cavidadeMolde =
    numero(
      programacao
        ?.cavidadeMolde ??
      programacao
        ?.cavidade_molde,
    );


  if (
    !dataInicio ||
    !dataFim ||
    pesoKg <= 0 ||
    cicloSegundos <= 0 ||
    cavidadeMolde <= 0
  ) {
    return {
      ciclos: 0,

      pecas: 0,

      consumoKg: 0,
    };
  }


  const inicioProgramacao =
    converterDataHoraUTC(
      dataInicio,
      horaInicio,
    );

  const fimProgramacao =
    converterDataHoraUTC(
      dataFim,
      horaFim,
    );

  const inicioDia =
    inicioDiaUTC(
      data,
    );

  const fimDia =
    fimDiaUTC(
      data,
    );


  if (
    inicioProgramacao ===
      null ||
    fimProgramacao ===
      null ||
    inicioDia ===
      null ||
    fimDia ===
      null ||
    fimProgramacao <=
      inicioProgramacao
  ) {
    return {
      ciclos: 0,

      pecas: 0,

      consumoKg: 0,
    };
  }


  /*
   * Não existe interseção entre
   * o dia e a programação.
   */
  if (
    fimDia <=
      inicioProgramacao ||
    inicioDia >=
      fimProgramacao
  ) {
    return {
      ciclos: 0,

      pecas: 0,

      consumoKg: 0,
    };
  }


  const marcoInicio =
    Math.max(
      inicioDia,
      inicioProgramacao,
    );

  const marcoFim =
    Math.min(
      fimDia,
      fimProgramacao,
    );


  if (
    marcoFim <=
    marcoInicio
  ) {
    return {
      ciclos: 0,

      pecas: 0,

      consumoKg: 0,
    };
  }


  /*
   * Segundos acumulados desde o início
   * real da programação até os limites
   * daquele dia.
   */
  const segundosAteInicio =
    Math.max(
      0,
      (
        marcoInicio -
        inicioProgramacao
      ) /
        1000,
    );


  const segundosAteFim =
    Math.max(
      0,
      (
        marcoFim -
        inicioProgramacao
      ) /
        1000,
    );


  /*
   * Ciclos completos acumulados.
   */
  const ciclosAntes =
    Math.floor(
      segundosAteInicio /
        cicloSegundos,
    );


  const ciclosAteFim =
    Math.floor(
      segundosAteFim /
        cicloSegundos,
    );


  /*
   * Ciclos atribuídos especificamente
   * a este dia.
   */
  const ciclosDia =
    Math.max(
      ciclosAteFim -
        ciclosAntes,
      0,
    );


  const pecasDia =
    ciclosDia *
    cavidadeMolde;


  const consumoKg =
    arredondarKg(
      pecasDia *
        pesoKg,
    );


  return {
    ciclos:
      ciclosDia,

    pecas:
      pecasDia,

    consumoKg,
  };
}


/* =========================================================
   FORNECEDORES
========================================================= */

function registrarFornecedor(
  mapa,
  fornecedorId,
  nome = "",
  ativo = true,
) {
  if (
    fornecedorId ===
      null ||
    fornecedorId ===
      undefined
  ) {
    return;
  }


  const chave =
    String(
      fornecedorId,
    );

  const existente =
    mapa.get(
      chave,
    );


  mapa.set(
    chave,
    {
      id:
        fornecedorId,

      nome:
        nome ||
        existente
          ?.nome ||
        `Fornecedor ${fornecedorId}`,

      ativo:
        existente
          ?.ativo ??
        ativo,
    },
  );
}


/* =========================================================
   PROJEÇÃO
========================================================= */

export async function buscarProjecao({
  dataInicio,
  dataFim,
}) {
  if (!dataInicio) {
    throw new Error(
      "Informe a data inicial da projeção.",
    );
  }


  if (!dataFim) {
    throw new Error(
      "Informe a data final da projeção.",
    );
  }


  if (
    dataFim <
    dataInicio
  ) {
    throw new Error(
      "A data final não pode ser anterior à data inicial.",
    );
  }


  /* =======================================================
     FONTES
  ======================================================= */

  const [
    resultadoSaldos,
    resultadoCompras,
    resultadoProgramacao,
  ] =
    await Promise.all([
      buscarSaldosIniciais(),

      buscarComprasFuturas(),

      buscarProgramacao(),
    ]);


  const saldos =
    Array.isArray(
      resultadoSaldos
        ?.saldos,
    )
      ? resultadoSaldos
          .saldos
      : [];


  const compras =
    Array.isArray(
      resultadoCompras
        ?.compras,
    )
      ? resultadoCompras
          .compras
      : [];


  const programacoes =
    obterProgramacoes(
      resultadoProgramacao,
    );


  /* =======================================================
     MAPA DOS FORNECEDORES
  ======================================================= */

  const fornecedoresMapa =
    new Map();


  (
    resultadoSaldos
      ?.fornecedores ??
    []
  ).forEach(
    (
      fornecedor,
    ) => {
      registrarFornecedor(
        fornecedoresMapa,
        fornecedor.id,
        fornecedor.nome,
        fornecedor.ativo,
      );
    },
  );


  (
    resultadoCompras
      ?.fornecedores ??
    []
  ).forEach(
    (
      fornecedor,
    ) => {
      registrarFornecedor(
        fornecedoresMapa,
        fornecedor.id,
        fornecedor.nome,
        fornecedor.ativo,
      );
    },
  );


  saldos.forEach(
    (
      saldo,
    ) => {
      registrarFornecedor(
        fornecedoresMapa,
        saldo.fornecedorId,
        saldo.fornecedorNome,
        saldo.fornecedorAtivo,
      );
    },
  );


  compras.forEach(
    (
      compra,
    ) => {
      registrarFornecedor(
        fornecedoresMapa,
        compra.fornecedorId,
        compra.fornecedorNome,
        compra.fornecedorAtivo,
      );
    },
  );


  /*
   * Também registramos fornecedores
   * existentes nas receitas da programação.
   */
  programacoes.forEach(
    (
      programacao,
    ) => {
      obterItensReceita(
        programacao,
      ).forEach(
        (
          item,
        ) => {
          registrarFornecedor(
            fornecedoresMapa,
            item.fornecedorId,
            item.fornecedorNome,
            true,
          );
        },
      );
    },
  );


  /* =======================================================
     SALDOS ATIVOS
  ======================================================= */

  const saldosAtivos =
    saldos
      .filter(
        (
          saldo,
        ) =>
          saldo.ativo ===
            true &&
          saldo.dataBase <=
            dataFim,
      )
      .sort(
        (
          a,
          b,
        ) =>
          a.dataBase
            .localeCompare(
              b.dataBase,
            ),
      );


  /*
   * Para calcular corretamente o primeiro
   * dia solicitado, precisamos voltar até
   * o saldo-base mais recente de cada
   * fornecedor anterior ao início.
   */
  const ultimaBaseAntesInicio =
    new Map();


  saldosAtivos.forEach(
    (
      saldo,
    ) => {
      if (
        saldo.dataBase >
        dataInicio
      ) {
        return;
      }


      const chave =
        String(
          saldo.fornecedorId,
        );

      const atual =
        ultimaBaseAntesInicio.get(
          chave,
        );


      if (
        !atual ||
        saldo.dataBase >
          atual.dataBase ||
        (
          saldo.dataBase ===
            atual.dataBase &&
          Number(
            saldo.id,
          ) >
            Number(
              atual.id,
            )
        )
      ) {
        ultimaBaseAntesInicio.set(
          chave,
          saldo,
        );
      }
    },
  );


  let inicioCalculo =
    dataInicio;


  ultimaBaseAntesInicio.forEach(
    (
      saldo,
    ) => {
      if (
        saldo.dataBase <
        inicioCalculo
      ) {
        inicioCalculo =
          saldo.dataBase;
      }
    },
  );


  /* =======================================================
     SALDO POR DATA / FORNECEDOR
  ======================================================= */

  const basesMapa =
    new Map();


  saldosAtivos.forEach(
    (
      saldo,
    ) => {
      if (
        saldo.dataBase <
          inicioCalculo ||
        saldo.dataBase >
          dataFim
      ) {
        return;
      }


      basesMapa.set(
        chaveMovimento(
          saldo.dataBase,
          saldo.fornecedorId,
        ),
        saldo,
      );
    },
  );


  /* =======================================================
     MOVIMENTOS
  ======================================================= */

  const movimentosMapa =
    new Map();


  /* =======================================================
     COMPRAS
  ======================================================= */

  compras.forEach(
    (
      compra,
    ) => {
      if (
        compra.ativo ===
          false ||
        compra.status ===
          "CANCELADA"
      ) {
        return;
      }


      registrarFornecedor(
        fornecedoresMapa,
        compra.fornecedorId,
        compra.fornecedorNome,
        compra.fornecedorAtivo,
      );


      /* ===================================================
         MATERIAL JÁ RECEBIDO
      =================================================== */

      if (
        compra.status ===
        "RECEBIDA"
      ) {
        if (
          compra.dataRecebimento &&
          compra.dataRecebimento >=
            inicioCalculo &&
          compra.dataRecebimento <=
            dataFim
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


      /* ===================================================
         COMPRA FUTURA
      =================================================== */

      if (
        (
          compra.status ===
            "PREVISTA" ||
          compra.status ===
            "CONFIRMADA"
        ) &&
        compra.dataPrevista &&
        compra.dataPrevista >=
          inicioCalculo &&
        compra.dataPrevista <=
          dataFim
      ) {
        adicionarMovimento(
          movimentosMapa,
          compra.dataPrevista,
          compra.fornecedorId,
          "compraFuturaKg",
          compra.quantidadeKg,
        );
      }
    },
  );


  /* =======================================================
     PROGRAMAÇÃO / CONSUMO
  ======================================================= */

  const programacoesSemReceita =
    [];


  programacoes.forEach(
    (
      programacao,
    ) => {
      if (
        programacao.ativo ===
          false
      ) {
        return;
      }


      const inicio =
        programacao
          .dataInicio ??
        programacao
          .data_inicio;

      const fim =
        programacao
          .dataFim ??
        programacao
          .data_fim;


      if (
        !inicio ||
        !fim ||
        fim <
          inicioCalculo ||
        inicio >
          dataFim
      ) {
        return;
      }


      const itensReceita =
        obterItensReceita(
          programacao,
        );


      const receitaConfigurada =
        programacao
          ?.receitaConfigurada ===
          true;


      /* ===================================================
         PROGRAMAÇÃO SEM RECEITA
      =================================================== */

      if (
        !receitaConfigurada ||
        itensReceita.length ===
          0
      ) {
        const consumoTotal =
          obterConsumoTotalProgramacao(
            programacao,
          );


        if (
          consumoTotal >
          0
        ) {
          programacoesSemReceita.push({
            id:
              programacao.id,

            codigoProduto:
              programacao
                .codigoProduto ??
              programacao
                .codigo_produto ??
              "",

            produto:
              programacao
                .descricao ??
              programacao
                .produto ??
              programacao
                .descricaoProduto ??
              "",
          });
        }


        return;
      }


      /* ===================================================
         REGISTRAR FORNECEDORES DA RECEITA
      =================================================== */

      itensReceita.forEach(
        (
          item,
        ) => {
          registrarFornecedor(
            fornecedoresMapa,
            item.fornecedorId,
            item.fornecedorNome,
            true,
          );
        },
      );


      /* ===================================================
         INTERVALO QUE PRECISA SER PROJETADO
      =================================================== */

      const inicioAplicado =
        inicio <
          inicioCalculo
          ? inicioCalculo
          : inicio;

      const fimAplicado =
        fim >
          dataFim
          ? dataFim
          : fim;


      const datasProgramacao =
        listarDatas(
          inicioAplicado,
          fimAplicado,
        );


      /* ===================================================
         CONSUMO REAL POR DIA
      =================================================== */

      datasProgramacao.forEach(
        (
          data,
        ) => {
          const consumoDia =
            calcularConsumoProgramacaoNaData(
              programacao,
              data,
            );


          if (
            consumoDia
              .consumoKg <=
            0
          ) {
            return;
          }


          /* ===============================================
             DISTRIBUIÇÃO PELA RECEITA
          =============================================== */

          itensReceita.forEach(
            (
              item,
            ) => {
              const consumoFornecedorKg =
                arredondarKg(
                  consumoDia
                    .consumoKg *
                    item.percentual /
                    100,
                );


              adicionarMovimento(
                movimentosMapa,
                data,
                item.fornecedorId,
                "consumoKg",
                consumoFornecedorKg,
              );
            },
          );
        },
      );
    },
  );


  /* =======================================================
     FORNECEDORES ENVOLVIDOS
  ======================================================= */

  const fornecedoresEnvolvidos =
    new Set();


  saldosAtivos.forEach(
    (
      saldo,
    ) => {
      fornecedoresEnvolvidos.add(
        String(
          saldo.fornecedorId,
        ),
      );
    },
  );


  movimentosMapa.forEach(
    (
      movimento,
      chave,
    ) => {
      void movimento;


      const partes =
        chave.split("|");


      if (
        partes.length ===
        2
      ) {
        fornecedoresEnvolvidos.add(
          partes[1],
        );
      }
    },
  );


  /* =======================================================
     DATAS DO CÁLCULO
  ======================================================= */

  const datasCalculo =
    listarDatas(
      inicioCalculo,
      dataFim,
    );


  const estadoFornecedores =
    new Map();

  const linhas = [];


  datasCalculo.forEach(
    (
      data,
    ) => {
      fornecedoresEnvolvidos.forEach(
        (
          fornecedorChave,
        ) => {
          const fornecedor =
            fornecedoresMapa.get(
              fornecedorChave,
            ) || {
              id:
                fornecedorChave,

              nome:
                `Fornecedor ${fornecedorChave}`,
            };


          const base =
            basesMapa.get(
              chaveMovimento(
                data,
                fornecedor.id,
              ),
            );


          const estadoAnterior =
            estadoFornecedores.get(
              fornecedorChave,
            );


          let possuiSaldoBase =
            estadoAnterior
              ?.possuiSaldoBase ===
            true;

          let saldoInicioKg =
            possuiSaldoBase
              ? numero(
                  estadoAnterior
                    ?.saldoFinalKg,
                )
              : null;

          let saldoBaseAplicado =
            null;


          /*
           * Quando existe uma nova contagem
           * física nessa data, ela passa a ser
           * o novo ponto de partida.
           */
          if (base) {
            possuiSaldoBase =
              true;

            saldoInicioKg =
              numero(
                base.quantidadeKg,
              );

            saldoBaseAplicado =
              base;
          }


          const movimento =
            movimentosMapa.get(
              chaveMovimento(
                data,
                fornecedor.id,
              ),
            ) ||
            criarMovimento();


          let saldoFinalKg =
            null;


          if (
            possuiSaldoBase
          ) {
            saldoFinalKg =
              arredondarKg(
                numero(
                  saldoInicioKg,
                ) +
                  numero(
                    movimento
                      .recebidoKg,
                  ) +
                  numero(
                    movimento
                      .compraFuturaKg,
                  ) -
                  numero(
                    movimento
                      .consumoKg,
                  ),
              );
          }


          estadoFornecedores.set(
            fornecedorChave,
            {
              possuiSaldoBase,

              saldoFinalKg,
            },
          );


          if (
            data <
            dataInicio
          ) {
            return;
          }


          linhas.push({
            data,

            fornecedorId:
              fornecedor.id,

            fornecedorNome:
              fornecedor.nome,

            possuiSaldoBase,

            saldoBaseAplicado:
              Boolean(
                saldoBaseAplicado,
              ),

            quantidadeSaldoBaseKg:
              saldoBaseAplicado
                ? numero(
                    saldoBaseAplicado
                      .quantidadeKg,
                  )
                : null,

            saldoInicioKg,

            recebidoKg:
              arredondarKg(
                movimento
                  .recebidoKg,
              ),

            compraFuturaKg:
              arredondarKg(
                movimento
                  .compraFuturaKg,
              ),

            consumoKg:
              arredondarKg(
                movimento
                  .consumoKg,
              ),

            saldoFinalKg,
          });
        },
      );
    },
  );


  /* =======================================================
     FORNECEDORES SEM SALDO
  ======================================================= */

  const fornecedoresSemSaldo =
    [];


  fornecedoresEnvolvidos.forEach(
    (
      chave,
    ) => {
      const existeSaldo =
        saldosAtivos.some(
          (
            saldo,
          ) =>
            String(
              saldo.fornecedorId,
            ) ===
              chave &&
            saldo.dataBase <=
              dataFim,
        );


      if (!existeSaldo) {
        const fornecedor =
          fornecedoresMapa.get(
            chave,
          );


        fornecedoresSemSaldo.push({
          id:
            fornecedor
              ?.id ??
            chave,

          nome:
            fornecedor
              ?.nome ??
            `Fornecedor ${chave}`,
        });
      }
    },
  );


  /* =======================================================
     FORNECEDORES
  ======================================================= */

  const fornecedores =
    Array.from(
      fornecedoresEnvolvidos,
    )
      .map(
        (
          chave,
        ) =>
          fornecedoresMapa.get(
            chave,
          ) || {
            id:
              chave,

            nome:
              `Fornecedor ${chave}`,
          },
      )
      .sort(
        (
          a,
          b,
        ) =>
          String(
            a.nome,
          ).localeCompare(
            String(
              b.nome,
            ),
            "pt-BR",
          ),
      );


  /* =======================================================
     RESULTADO
  ======================================================= */

  return {
    dataInicio,

    dataFim,

    inicioCalculo,

    linhas,

    fornecedores,

    fornecedoresSemSaldo,

    programacoesSemReceita,
  };
}