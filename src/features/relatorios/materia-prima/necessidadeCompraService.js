import { supabase } from "@/lib/supabaseClient";

import {
  buscarConsumoProgramado,
} from "./consumoProgramadoService";


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const MS_DIA =
  24 * 60 * 60 * 1000;

const MARGEM_ATENCAO =
  0.2;


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


function numeroOpcional(
  valor,
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }


  const convertido =
    Number(
      valor,
    );


  return Number.isFinite(
    convertido,
  )
    ? convertido
    : null;
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

function validarDataISO(
  valor,
) {
  const texto =
    String(
      valor ?? "",
    ).trim();


  const partes =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    );


  if (!partes) {
    return null;
  }


  const ano =
    Number(
      partes[1],
    );

  const mes =
    Number(
      partes[2],
    );

  const dia =
    Number(
      partes[3],
    );


  const ms =
    Date.UTC(
      ano,
      mes - 1,
      dia,
    );


  const conferida =
    new Date(
      ms,
    );


  if (
    conferida.getUTCFullYear() !== ano ||
    conferida.getUTCMonth() !== mes - 1 ||
    conferida.getUTCDate() !== dia
  ) {
    return null;
  }


  return {
    texto,
    ano,
    mes,
    dia,
    ms,
  };
}



function formatarDataMs(
  valorMs,
) {
  const data =
    new Date(
      valorMs,
    );


  const ano =
    data.getUTCFullYear();

  const mes =
    String(
      data.getUTCMonth() + 1,
    ).padStart(
      2,
      "0",
    );

  const dia =
    String(
      data.getUTCDate(),
    ).padStart(
      2,
      "0",
    );


  return `${ano}-${mes}-${dia}`;
}


function adicionarDias(
  data,
  dias,
) {
  const normalizada =
    validarDataISO(
      data,
    );


  if (!normalizada) {
    return null;
  }


  return formatarDataMs(
    normalizada.ms +
      dias * MS_DIA,
  );
}


function listarDatas(
  inicio,
  fim,
) {
  const dataInicio =
    validarDataISO(
      inicio,
    );

  const dataFim =
    validarDataISO(
      fim,
    );


  if (
    !dataInicio ||
    !dataFim ||
    dataFim.ms < dataInicio.ms
  ) {
    return [];
  }


  const datas = [];


  for (
    let atual = dataInicio.ms;
    atual <= dataFim.ms;
    atual += MS_DIA
  ) {
    datas.push(
      formatarDataMs(
        atual,
      ),
    );
  }


  return datas;
}


/* =========================================================
   CHAVES / ORDENAÇÃO
========================================================= */

function chaveFornecedor(
  fornecedorId,
) {
  return String(
    fornecedorId,
  );
}


function chaveMovimento(
  data,
  fornecedorId,
) {
  return `${data}|${chaveFornecedor(
    fornecedorId,
  )}`;
}


function compararFornecedores(
  fornecedorA,
  fornecedorB,
) {
  const prioridade = {
    CRITICO: 1,
    COMPRAR: 2,
    ATENCAO: 3,
    OK: 4,
    CONFIGURAR: 5,
    SEM_SALDO: 6,
  };


  const prioridadeA =
    prioridade[
      fornecedorA?.status
    ] ?? 99;

  const prioridadeB =
    prioridade[
      fornecedorB?.status
    ] ?? 99;


  if (
    prioridadeA !==
    prioridadeB
  ) {
    return prioridadeA -
      prioridadeB;
  }


  return String(
    fornecedorA?.fornecedorNome ?? "",
  ).localeCompare(
    String(
      fornecedorB?.fornecedorNome ?? "",
    ),
    "pt-BR",
    {
      sensitivity: "base",
    },
  );
}


/* =========================================================
   MOVIMENTOS
========================================================= */

function criarMovimento() {
  return {
    recebidoKg: 0,
    compraFuturaKg: 0,
    consumoKg: 0,
  };
}


function adicionarMovimento({
  mapa,
  data,
  fornecedorId,
  campo,
  quantidadeKg,
}) {
  if (
    !data ||
    fornecedorId === null ||
    fornecedorId === undefined
  ) {
    return;
  }


  const quantidade =
    numero(
      quantidadeKg,
    );


  if (
    quantidade === 0
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
        quantidade,
    );


  mapa.set(
    chave,
    movimento,
  );
}


/* =========================================================
   CONSUMO DIÁRIO EXATO

   A programação nova já chega uma linha por dia, com o
   consumo calculado pela fonte canônica do banco.
========================================================= */

function obterPercentuaisReceita(
  programacao,
) {
  if (
    !programacao?.receitaConfigurada ||
    !Array.isArray(
      programacao?.consumosFornecedores,
    ) ||
    programacao.consumosFornecedores.length === 0
  ) {
    return [];
  }


  return programacao.consumosFornecedores
    .map(
      (
        item,
      ) => ({
        fornecedorId:
          item?.fornecedorId ??
          null,

        fornecedorNome:
          item?.fornecedorNome ??
          "Fornecedor",

        percentual:
          numero(
            item?.percentual,
          ),
      }),
    )
    .filter(
      (
        item,
      ) =>
        item.fornecedorId !== null &&
        item.fornecedorId !== undefined &&
        item.percentual > 0,
    );
}


function calcularConsumoDiaProgramacao({
  programacao,
  data,
}) {
  const dataProgramada =
    programacao?.dataInicioConsiderada ??
    programacao?.dataInicioOriginal;


  if (
    !dataProgramada ||
    data !== dataProgramada
  ) {
    return 0;
  }


  return arredondarKg(
    programacao?.consumoTotalKg,
  );
}


/* =========================================================
   STATUS
========================================================= */

function calcularStatus({
  possuiSaldo,
  estoqueMinimoKg,
  estoqueAlvoKg,
  leadTimeDias,
  menorSaldoProjetadoKg,
  primeiraDataAbaixoMinimo,
  dataLimiteCompra,
  dataInicio,
}) {
  if (!possuiSaldo) {
    return "SEM_SALDO";
  }


  if (
    estoqueMinimoKg === null ||
    estoqueAlvoKg === null ||
    leadTimeDias === null
  ) {
    return "CONFIGURAR";
  }


  if (
    menorSaldoProjetadoKg !== null &&
    menorSaldoProjetadoKg <= 0
  ) {
    return "CRITICO";
  }


  if (
    primeiraDataAbaixoMinimo
  ) {
    if (
      dataLimiteCompra &&
      dataLimiteCompra <
        dataInicio
    ) {
      return "CRITICO";
    }


    return "COMPRAR";
  }


  const limiteAtencao =
    estoqueMinimoKg *
    (
      1 +
      MARGEM_ATENCAO
    );


  if (
    menorSaldoProjetadoKg !== null &&
    menorSaldoProjetadoKg <=
      limiteAtencao
  ) {
    return "ATENCAO";
  }


  return "OK";
}


/* =========================================================
   RESULTADO VAZIO
========================================================= */

export function criarResultadoNecessidadeCompraVazio({
  dataInicial = "",
  dataFinal = "",
} = {}) {
  return {
    periodo: {
      dataInicial,
      dataFinal,
    },

    resumo: {
      fornecedoresAnalisados: 0,
      fornecedoresComprar: 0,
      fornecedoresCriticos: 0,
      fornecedoresAtencao: 0,
      fornecedoresSemSaldo: 0,
      fornecedoresSemParametros: 0,
      comprasFuturasKg: 0,
      consumoProgramadoKg: 0,
      necessidadeCompraKg: 0,
      consumoSemReceitaKg: 0,
    },

    fornecedores: [],
  };
}


/* =========================================================
   BUSCAR NECESSIDADE DE COMPRA
========================================================= */

export async function buscarNecessidadeCompra({
  dataInicial,
  dataFinal,
}) {
  const inicio =
    validarDataISO(
      dataInicial,
    );

  const fim =
    validarDataISO(
      dataFinal,
    );


  if (!inicio) {
    throw new Error(
      "Informe uma data inicial válida.",
    );
  }


  if (!fim) {
    throw new Error(
      "Informe uma data final válida.",
    );
  }


  if (
    fim.ms <
    inicio.ms
  ) {
    throw new Error(
      "A data final não pode ser anterior à data inicial.",
    );
  }


  /* =======================================================
     FONTES BÁSICAS
  ======================================================= */

  const [
    resultadoFornecedores,
    resultadoSaldos,
    resultadoCompras,
  ] =
    await Promise.all([
      supabase
        .from(
          "materia_prima_fornecedores",
        )
        .select(
          `
            id,
            nome,
            ativo,
            estoque_minimo_kg,
            estoque_alvo_kg,
            lead_time_dias
          `,
        )
        .eq(
          "ativo",
          true,
        ),

      supabase
        .from(
          "materia_prima_saldo_inicial",
        )
        .select(
          `
            id,
            fornecedor_id,
            data_base,
            quantidade_kg,
            ativo
          `,
        )
        .eq(
          "ativo",
          true,
        )
        .lte(
          "data_base",
          fim.texto,
        )
        .order(
          "data_base",
          {
            ascending: true,
          },
        )
        .order(
          "id",
          {
            ascending: true,
          },
        ),

      supabase
        .from(
          "materia_prima_compras_futuras",
        )
        .select(
          `
            id,
            fornecedor_id,
            data_prevista,
            data_recebimento,
            quantidade_kg,
            status,
            ativo
          `,
        )
        .eq(
          "ativo",
          true,
        ),
    ]);


  if (
    resultadoFornecedores.error
  ) {
    throw resultadoFornecedores.error;
  }


  if (
    resultadoSaldos.error
  ) {
    throw resultadoSaldos.error;
  }


  if (
    resultadoCompras.error
  ) {
    throw resultadoCompras.error;
  }


  const fornecedores =
    Array.isArray(
      resultadoFornecedores.data,
    )
      ? resultadoFornecedores.data
      : [];

  const saldos =
    Array.isArray(
      resultadoSaldos.data,
    )
      ? resultadoSaldos.data
      : [];

  const compras =
    Array.isArray(
      resultadoCompras.data,
    )
      ? resultadoCompras.data
      : [];


  if (
    fornecedores.length === 0
  ) {
    return criarResultadoNecessidadeCompraVazio({
      dataInicial:
        inicio.texto,
      dataFinal:
        fim.texto,
    });
  }


  /* =======================================================
     SALDO-BASE RELEVANTE POR FORNECEDOR
  ======================================================= */

  const saldosPorFornecedor =
    new Map();


  for (
    const saldo
    of saldos
  ) {
    const chave =
      chaveFornecedor(
        saldo.fornecedor_id,
      );


    if (
      !saldosPorFornecedor.has(
        chave,
      )
    ) {
      saldosPorFornecedor.set(
        chave,
        [],
      );
    }


    saldosPorFornecedor
      .get(
        chave,
      )
      .push(
        saldo,
      );
  }


  const saldoInicialSelecionadoPorFornecedor =
    new Map();

  let inicioCalculo =
    inicio.texto;


  for (
    const fornecedor
    of fornecedores
  ) {
    const chave =
      chaveFornecedor(
        fornecedor.id,
      );

    const lista =
      saldosPorFornecedor.get(
        chave,
      ) || [];


    const anteriores =
      lista.filter(
        (
          saldo,
        ) =>
          saldo.data_base <=
          inicio.texto,
      );


    const selecionado =
      anteriores.length > 0
        ? anteriores[
            anteriores.length - 1
          ]
        : lista[0] ||
          null;


    if (
      selecionado
    ) {
      saldoInicialSelecionadoPorFornecedor.set(
        chave,
        selecionado,
      );


      if (
        selecionado.data_base <
        inicioCalculo
      ) {
        inicioCalculo =
          selecionado.data_base;
      }
    }
  }


  /* =======================================================
     CONSUMO PROGRAMADO EXATO
  ======================================================= */

  const consumoProgramado =
    await buscarConsumoProgramado({
      dataInicial:
        inicioCalculo,
      dataFinal:
        fim.texto,
    });


  const movimentos =
    new Map();

  const consumoSemReceitaPorData =
    new Map();

  const datasCalculo =
    listarDatas(
      inicioCalculo,
      fim.texto,
    );


  for (
    const programacao
    of consumoProgramado.programacoes || []
  ) {
    const receita =
      obterPercentuaisReceita(
        programacao,
      );


    for (
      const data
      of datasCalculo
    ) {
      const consumoDiaKg =
        calcularConsumoDiaProgramacao({
          programacao,
          data,
        });


      if (
        consumoDiaKg <= 0
      ) {
        continue;
      }


      if (
        receita.length === 0
      ) {
        consumoSemReceitaPorData.set(
          data,
          arredondarKg(
            numero(
              consumoSemReceitaPorData.get(
                data,
              ),
            ) +
              consumoDiaKg,
          ),
        );

        continue;
      }


      let distribuido =
        0;


      receita.forEach(
        (
          item,
          indice,
        ) => {
          const ultimo =
            indice ===
            receita.length - 1;


          const quantidadeKg =
            ultimo
              ? arredondarKg(
                  consumoDiaKg -
                    distribuido,
                )
              : arredondarKg(
                  consumoDiaKg *
                    item.percentual /
                    100,
                );


          distribuido =
            arredondarKg(
              distribuido +
                quantidadeKg,
            );


          adicionarMovimento({
            mapa:
              movimentos,
            data,
            fornecedorId:
              item.fornecedorId,
            campo:
              "consumoKg",
            quantidadeKg,
          });
        },
      );
    }
  }


  /* =======================================================
     COMPRAS / RECEBIMENTOS
  ======================================================= */

  for (
    const compra
    of compras
  ) {
    const status =
      String(
        compra?.status ?? "",
      )
        .trim()
        .toUpperCase();


    if (
      status === "CANCELADA"
    ) {
      continue;
    }


    if (
      status === "RECEBIDA"
    ) {
      const data =
        compra?.data_recebimento;


      if (
        data &&
        data >= inicioCalculo &&
        data <= fim.texto
      ) {
        adicionarMovimento({
          mapa:
            movimentos,
          data,
          fornecedorId:
            compra.fornecedor_id,
          campo:
            "recebidoKg",
          quantidadeKg:
            compra.quantidade_kg,
        });
      }


      continue;
    }


    if (
      status !== "PREVISTA" &&
      status !== "CONFIRMADA"
    ) {
      continue;
    }


    const data =
      compra?.data_prevista;


    if (
      data &&
      data >= inicioCalculo &&
      data <= fim.texto
    ) {
      adicionarMovimento({
        mapa:
          movimentos,
        data,
        fornecedorId:
          compra.fornecedor_id,
        campo:
          "compraFuturaKg",
        quantidadeKg:
          compra.quantidade_kg,
      });
    }
  }


  /* =======================================================
     BASES QUE DEVEM SER APLICADAS
  ======================================================= */

  const basesPorDataFornecedor =
    new Map();


  for (
    const fornecedor
    of fornecedores
  ) {
    const chave =
      chaveFornecedor(
        fornecedor.id,
      );

    const baseInicial =
      saldoInicialSelecionadoPorFornecedor.get(
        chave,
      );


    if (!baseInicial) {
      continue;
    }


    const lista =
      saldosPorFornecedor.get(
        chave,
      ) || [];


    for (
      const saldo
      of lista
    ) {
      if (
        saldo.data_base <
          baseInicial.data_base ||
        saldo.data_base >
          fim.texto
      ) {
        continue;
      }


      basesPorDataFornecedor.set(
        chaveMovimento(
          saldo.data_base,
          fornecedor.id,
        ),
        saldo,
      );
    }
  }


  /* =======================================================
     PROJEÇÃO DIÁRIA / RESUMO POR FORNECEDOR
  ======================================================= */

  const resultadoFornecedoresFinal =
    [];


  for (
    const fornecedor
    of fornecedores
  ) {
    const estoqueMinimoKg =
      numeroOpcional(
        fornecedor.estoque_minimo_kg,
      );

    const estoqueAlvoKg =
      numeroOpcional(
        fornecedor.estoque_alvo_kg,
      );

    const leadTimeDias =
      fornecedor.lead_time_dias === null ||
      fornecedor.lead_time_dias === undefined
        ? null
        : Number(
            fornecedor.lead_time_dias,
          );


    const chave =
      chaveFornecedor(
        fornecedor.id,
      );

    const possuiAlgumaBase =
      saldoInicialSelecionadoPorFornecedor.has(
        chave,
      );


    let possuiSaldo =
      false;

    let saldoAnteriorKg =
      null;

    let estoqueAtualKg =
      null;

    let comprasFuturasKg =
      0;

    let consumoProgramadoKg =
      0;

    let menorSaldoProjetadoKg =
      null;

    let dataMenorSaldo =
      null;

    let primeiraDataAbaixoMinimo =
      null;

    let dataRuptura =
      null;

    const detalhes = [];


    for (
      const data
      of datasCalculo
    ) {
      const base =
        basesPorDataFornecedor.get(
          chaveMovimento(
            data,
            fornecedor.id,
          ),
        );


      if (base) {
        possuiSaldo =
          true;

        saldoAnteriorKg =
          arredondarKg(
            base.quantidade_kg,
          );
      }


      const movimento =
        movimentos.get(
          chaveMovimento(
            data,
            fornecedor.id,
          ),
        ) ||
        criarMovimento();


      const saldoInicioKg =
        possuiSaldo
          ? arredondarKg(
              saldoAnteriorKg,
            )
          : null;


      let saldoFinalKg =
        null;


      if (
        possuiSaldo
      ) {
        saldoFinalKg =
          arredondarKg(
            saldoInicioKg +
              numero(
                movimento.recebidoKg,
              ) +
              numero(
                movimento.compraFuturaKg,
              ) -
              numero(
                movimento.consumoKg,
              ),
          );


        saldoAnteriorKg =
          saldoFinalKg;
      }


      if (
        data <
        inicio.texto
      ) {
        continue;
      }


      if (
        data ===
        inicio.texto
      ) {
        estoqueAtualKg =
          saldoInicioKg;
      }


      comprasFuturasKg =
        arredondarKg(
          comprasFuturasKg +
            numero(
              movimento.compraFuturaKg,
            ),
        );

      consumoProgramadoKg =
        arredondarKg(
          consumoProgramadoKg +
            numero(
              movimento.consumoKg,
            ),
        );


      if (
        saldoFinalKg !== null &&
        (
          menorSaldoProjetadoKg === null ||
          saldoFinalKg <
            menorSaldoProjetadoKg
        )
      ) {
        menorSaldoProjetadoKg =
          saldoFinalKg;

        dataMenorSaldo =
          data;
      }


      if (
        saldoFinalKg !== null &&
        estoqueMinimoKg !== null &&
        saldoFinalKg <
          estoqueMinimoKg &&
        !primeiraDataAbaixoMinimo
      ) {
        primeiraDataAbaixoMinimo =
          data;
      }


      if (
        saldoFinalKg !== null &&
        saldoFinalKg <= 0 &&
        !dataRuptura
      ) {
        dataRuptura =
          data;
      }


      detalhes.push({
        data,

        saldoBaseAplicado:
          Boolean(
            base,
          ),

        saldoInicioKg,

        recebidoKg:
          arredondarKg(
            movimento.recebidoKg,
          ),

        compraFuturaKg:
          arredondarKg(
            movimento.compraFuturaKg,
          ),

        consumoKg:
          arredondarKg(
            movimento.consumoKg,
          ),

        saldoFinalKg,
      });
    }


    const dataLimiteCompra =
      primeiraDataAbaixoMinimo &&
      Number.isInteger(
        leadTimeDias,
      )
        ? adicionarDias(
            primeiraDataAbaixoMinimo,
            -leadTimeDias,
          )
        : null;


    const necessidadeCompraKg =
      primeiraDataAbaixoMinimo &&
      estoqueAlvoKg !== null &&
      menorSaldoProjetadoKg !== null
        ? arredondarKg(
            Math.max(
              0,
              estoqueAlvoKg -
                menorSaldoProjetadoKg,
            ),
          )
        : 0;


    const status =
      calcularStatus({
        possuiSaldo:
          possuiAlgumaBase &&
          estoqueAtualKg !== null,

        estoqueMinimoKg,

        estoqueAlvoKg,

        leadTimeDias:
          Number.isInteger(
            leadTimeDias,
          )
            ? leadTimeDias
            : null,

        menorSaldoProjetadoKg,

        primeiraDataAbaixoMinimo,

        dataLimiteCompra,

        dataInicio:
          inicio.texto,
      });


    resultadoFornecedoresFinal.push({
      fornecedorId:
        fornecedor.id,

      fornecedorNome:
        fornecedor.nome,

      estoqueAtualKg,

      comprasFuturasKg,

      consumoProgramadoKg,

      menorSaldoProjetadoKg,

      dataMenorSaldo,

      estoqueMinimoKg,

      estoqueAlvoKg,

      leadTimeDias:
        Number.isInteger(
          leadTimeDias,
        )
          ? leadTimeDias
          : null,

      necessidadeCompraKg,

      primeiraDataAbaixoMinimo,

      dataLimiteCompra,

      dataRuptura,

      status,

      detalhes,
    });
  }


  resultadoFornecedoresFinal.sort(
    compararFornecedores,
  );


  /* =======================================================
     RESUMO GERAL
  ======================================================= */

  const consumoSemReceitaKg =
    arredondarKg(
      Array.from(
        consumoSemReceitaPorData.entries(),
      ).reduce(
        (
          total,
          [
            data,
            quantidadeKg,
          ],
        ) => {
          if (
            data < inicio.texto ||
            data > fim.texto
          ) {
            return total;
          }


          return total +
            numero(
              quantidadeKg,
            );
        },
        0,
      ),
    );


  const resumo = {
    fornecedoresAnalisados:
      resultadoFornecedoresFinal.length,

    fornecedoresComprar:
      resultadoFornecedoresFinal.filter(
        (
          item,
        ) =>
          item.status === "COMPRAR" ||
          item.status === "CRITICO",
      ).length,

    fornecedoresCriticos:
      resultadoFornecedoresFinal.filter(
        (
          item,
        ) =>
          item.status === "CRITICO",
      ).length,

    fornecedoresAtencao:
      resultadoFornecedoresFinal.filter(
        (
          item,
        ) =>
          item.status === "ATENCAO",
      ).length,

    fornecedoresSemSaldo:
      resultadoFornecedoresFinal.filter(
        (
          item,
        ) =>
          item.status === "SEM_SALDO",
      ).length,

    fornecedoresSemParametros:
      resultadoFornecedoresFinal.filter(
        (
          item,
        ) =>
          item.status === "CONFIGURAR",
      ).length,

    comprasFuturasKg:
      arredondarKg(
        resultadoFornecedoresFinal.reduce(
          (
            total,
            item,
          ) =>
            total +
            numero(
              item.comprasFuturasKg,
            ),
          0,
        ),
      ),

    consumoProgramadoKg:
      arredondarKg(
        resultadoFornecedoresFinal.reduce(
          (
            total,
            item,
          ) =>
            total +
            numero(
              item.consumoProgramadoKg,
            ),
          0,
        ),
      ),

    necessidadeCompraKg:
      arredondarKg(
        resultadoFornecedoresFinal.reduce(
          (
            total,
            item,
          ) =>
            total +
            numero(
              item.necessidadeCompraKg,
            ),
          0,
        ),
      ),

    consumoSemReceitaKg,
  };


  return {
    periodo: {
      dataInicial:
        inicio.texto,

      dataFinal:
        fim.texto,

      inicioCalculo,
    },

    resumo,

    fornecedores:
      resultadoFornecedoresFinal,
  };
}