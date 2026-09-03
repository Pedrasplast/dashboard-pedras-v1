import { supabase } from "@/lib/supabaseClient";

import {
  buscarReceitas,
} from "../receitas/receitasService";

import {
  buscarProdutosPP,
} from "../produtos/produtosPPService";


/* =========================================================
   UTILITÁRIOS
========================================================= */

function compararProgramacao(
  itemA,
  itemB,
) {
  const inicioA =
    `${itemA?.dataInicio ?? ""} ${itemA?.horaInicio ?? ""}`;

  const inicioB =
    `${itemB?.dataInicio ?? ""} ${itemB?.horaInicio ?? ""}`;


  const comparacaoInicio =
    inicioA.localeCompare(
      inicioB,
    );


  if (
    comparacaoInicio !== 0
  ) {
    return comparacaoInicio;
  }


  return String(
    itemA?.codigoProduto ?? "",
  ).localeCompare(
    String(
      itemB?.codigoProduto ?? "",
    ),
    "pt-BR",
    {
      numeric: true,
      sensitivity: "base",
    },
  );
}


function normalizarNumero(
  valor,
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }


  const numero =
    Number(
      String(
        valor,
      )
        .trim()
        .replace(
          ",",
          ".",
        ),
    );


  return Number.isFinite(
    numero,
  )
    ? numero
    : null;
}


function arredondarKg(
  valor,
) {
  const numero =
    Number(
      valor,
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return 0;
  }


  return Math.round(
    (
      numero +
      Number.EPSILON
    ) *
      1000000,
  ) / 1000000;
}


function arredondarNumero(
  valor,
  casas = 2,
) {
  const numero =
    Number(
      valor,
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return 0;
  }


  const fator =
    10 ** casas;


  return Math.round(
    (
      numero +
      Number.EPSILON
    ) *
      fator,
  ) / fator;
}


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
    partes.length < 2
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
      partes[2] ?? 0,
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


  return `${String(
    horas,
  ).padStart(
    2,
    "0",
  )}:${String(
    minutos,
  ).padStart(
    2,
    "0",
  )}`;
}


function converterDataParaUTC(
  valor,
) {
  const partes =
    String(
      valor ?? "",
    ).split(
      "-",
    );


  if (
    partes.length !== 3
  ) {
    return null;
  }


  const ano =
    Number(
      partes[0],
    );

  const mes =
    Number(
      partes[1],
    );

  const dia =
    Number(
      partes[2],
    );


  if (
    !Number.isInteger(
      ano,
    ) ||
    !Number.isInteger(
      mes,
    ) ||
    !Number.isInteger(
      dia,
    )
  ) {
    return null;
  }


  return Date.UTC(
    ano,
    mes - 1,
    dia,
  );
}


function converterDataHoraParaUTC(
  data,
  hora,
) {
  const dataBase =
    converterDataParaUTC(
      data,
    );

  const horaNormalizada =
    normalizarHora(
      hora,
    );


  if (
    dataBase === null ||
    !horaNormalizada
  ) {
    return null;
  }


  const [
    horas,
    minutos,
  ] =
    horaNormalizada
      .split(
        ":",
      )
      .map(
        Number,
      );


  return (
    dataBase +
    horas *
      60 *
      60 *
      1000 +
    minutos *
      60 *
      1000
  );
}


/* =========================================================
   DIAS DO PERÍODO
========================================================= */

export function calcularDiasPeriodo(
  dataInicio,
  dataFim,
) {
  const inicio =
    converterDataParaUTC(
      dataInicio,
    );

  const fim =
    converterDataParaUTC(
      dataFim,
    );


  if (
    inicio === null ||
    fim === null ||
    fim < inicio
  ) {
    return 0;
  }


  const DIA_MS =
    24 *
    60 *
    60 *
    1000;


  return (
    Math.floor(
      (
        fim -
        inicio
      ) /
        DIA_MS,
    ) +
    1
  );
}


/* =========================================================
   HORAS DO PERÍODO
========================================================= */

export function calcularHorasPeriodo({
  dataInicio,
  horaInicio,
  dataFim,
  horaFim,
}) {
  const inicio =
    converterDataHoraParaUTC(
      dataInicio,
      horaInicio,
    );

  const fim =
    converterDataHoraParaUTC(
      dataFim,
      horaFim,
    );


  if (
    inicio === null ||
    fim === null ||
    fim <= inicio
  ) {
    return 0;
  }


  return arredondarNumero(
    (
      fim -
      inicio
    ) /
      (
        60 *
        60 *
        1000
      ),
    4,
  );
}


/* =========================================================
   NORMALIZAR PROGRAMAÇÃO
========================================================= */

function normalizarProgramacao(
  registro,
) {
  if (!registro) {
    return null;
  }


  const id =
    registro?.id;

  const dataInicio =
    String(
      registro
        ?.data_inicio ??
        "",
    ).trim();

  const horaInicio =
    normalizarHora(
      registro
        ?.hora_inicio,
    );

  const dataFim =
    String(
      registro
        ?.data_fim ??
        "",
    ).trim();

  const horaFim =
    normalizarHora(
      registro
        ?.hora_fim,
    );

  const codigoProduto =
    String(
      registro
        ?.codigo_produto ??
        "",
    ).trim();

  const quantidade =
    Number(
      registro
        ?.quantidade,
    );

  const injetora =
    String(
      registro
        ?.injetora ??
        "",
    ).trim();


  if (
    id === null ||
    id === undefined ||
    !dataInicio ||
    !dataFim ||
    !codigoProduto ||
    !Number.isFinite(
      quantidade,
    )
  ) {
    return null;
  }


  return {
    id,

    dataInicio,

    horaInicio,

    dataFim,

    horaFim,

    quantidadeDias:
      calcularDiasPeriodo(
        dataInicio,
        dataFim,
      ),

    codigoProduto,

    quantidade,

    injetora:
      injetora ||
      null,

    ativo:
      registro
        ?.ativo !==
      false,

    criadoEm:
      registro
        ?.criado_em ??
      null,

    atualizadoEm:
      registro
        ?.atualizado_em ??
      null,
  };
}


/* =========================================================
   VERIFICAR CONFLITO DE INJETORA
========================================================= */

export function programacoesSeSobrepoem({
  inicioA,
  fimA,
  inicioB,
  fimB,
}) {
  if (
    inicioA === null ||
    fimA === null ||
    inicioB === null ||
    fimB === null
  ) {
    return false;
  }


  return (
    inicioA <
      fimB &&
    fimA >
      inicioB
  );
}


export function verificarConflitoInjetora({
  programacao = [],
  injetora,
  dataInicio,
  horaInicio,
  dataFim,
  horaFim,
  ignorarId = null,
}) {
  const numeroInjetora =
    String(
      injetora ?? "",
    ).trim();


  if (
    !numeroInjetora ||
    !dataInicio ||
    !horaInicio ||
    !dataFim ||
    !horaFim
  ) {
    return null;
  }


  const inicioNovo =
    converterDataHoraParaUTC(
      dataInicio,
      horaInicio,
    );

  const fimNovo =
    converterDataHoraParaUTC(
      dataFim,
      horaFim,
    );


  if (
    inicioNovo === null ||
    fimNovo === null ||
    fimNovo <= inicioNovo
  ) {
    return null;
  }


  return (
    Array.isArray(
      programacao,
    )
      ? programacao
      : []
  ).find(
    (
      item,
    ) => {
      if (
        item
          ?.ativo ===
        false
      ) {
        return false;
      }


      if (
        String(
          item
            ?.injetora ??
            "",
        ) !==
        numeroInjetora
      ) {
        return false;
      }


      if (
        ignorarId !== null &&
        ignorarId !== undefined &&
        String(
          item
            ?.id,
        ) ===
        String(
          ignorarId,
        )
      ) {
        return false;
      }


      /*
       * Registros antigos sem horário
       * ocupam o dia inteiro.
       */
      const horaInicialExistente =
        item
          ?.horaInicio ||
        "00:00";

      const horaFinalExistente =
        item
          ?.horaFim ||
        "23:59";


      const inicioExistente =
        converterDataHoraParaUTC(
          item
            ?.dataInicio,
          horaInicialExistente,
        );

      const fimExistente =
        converterDataHoraParaUTC(
          item
            ?.dataFim,
          horaFinalExistente,
        );


      return programacoesSeSobrepoem({
        inicioA:
          inicioNovo,

        fimA:
          fimNovo,

        inicioB:
          inicioExistente,

        fimB:
          fimExistente,
      });
    },
  ) ?? null;
}


/* =========================================================
   CALCULAR CONSUMO PELO PERÍODO REAL
========================================================= */

export function calcularConsumoProgramacao({
  dataInicio = null,
  horaInicio = null,
  dataFim = null,
  horaFim = null,
  cicloSegundos = null,
  cavidadeMolde = null,
  pesoKg = null,
  receitaItens = [],
}) {
  const inicio =
    converterDataHoraParaUTC(
      dataInicio,
      horaInicio,
    );

  const fim =
    converterDataHoraParaUTC(
      dataFim,
      horaFim,
    );

  const ciclo =
    normalizarNumero(
      cicloSegundos,
    );

  const cavidades =
    normalizarNumero(
      cavidadeMolde,
    );

  const peso =
    normalizarNumero(
      pesoKg,
    );


  const periodoValido =
    inicio !== null &&
    fim !== null &&
    fim > inicio;


  const parametrosValidos =
    ciclo !== null &&
    ciclo > 0 &&
    cavidades !== null &&
    Number.isInteger(
      cavidades,
    ) &&
    cavidades > 0 &&
    peso !== null &&
    peso > 0;


  if (
    !periodoValido ||
    !parametrosValidos
  ) {
    return {
      periodoValido,

      parametrosValidos,

      quantidadeDias:
        calcularDiasPeriodo(
          dataInicio,
          dataFim,
        ),

      horasPeriodo: 0,

      segundosPeriodo: 0,

      ciclosCompletos: 0,

      pecasPorHora: 0,

      pecasPrevistas: 0,

      consumoPorHoraKg: 0,

      consumoPeriodoKg: 0,

      consumosFornecedores: [],
    };
  }


  const segundosPeriodo =
    Math.floor(
      (
        fim -
        inicio
      ) /
        1000,
    );


  const horasPeriodo =
    arredondarNumero(
      segundosPeriodo /
        3600,
      4,
    );


  const ciclosCompletos =
    Math.floor(
      segundosPeriodo /
        ciclo,
    );


  const pecasPrevistas =
    ciclosCompletos *
    cavidades;


  const pecasPorHora =
    arredondarNumero(
      (
        3600 /
        ciclo
      ) *
        cavidades,
      2,
    );


  const consumoPorHoraKg =
    arredondarKg(
      pecasPorHora *
        peso,
    );


  const consumoPeriodoKg =
    arredondarKg(
      pecasPrevistas *
        peso,
    );


  const consumosFornecedores =
    (
      Array.isArray(
        receitaItens,
      )
        ? receitaItens
        : []
    ).map(
      (
        item,
      ) => {
        const percentual =
          Number(
            item
              ?.percentual ??
              0,
          );


        return {
          fornecedorId:
            item
              ?.fornecedorId,

          fornecedorNome:
            item
              ?.fornecedorNome ??
            "Fornecedor",

          percentual,

          consumoPeriodoKg:
            arredondarKg(
              consumoPeriodoKg *
                (
                  percentual /
                  100
                ),
            ),
        };
      },
    );


  return {
    periodoValido,

    parametrosValidos,

    quantidadeDias:
      calcularDiasPeriodo(
        dataInicio,
        dataFim,
      ),

    horasPeriodo,

    segundosPeriodo,

    ciclosCompletos,

    pecasPorHora,

    pecasPrevistas,

    consumoPorHoraKg,

    consumoPeriodoKg,

    consumosFornecedores,
  };
}


/* =========================================================
   CÁLCULO LEGADO
========================================================= */

function calcularConsumoLegado({
  quantidade,
  pesoKg,
  receitaItens = [],
  dataInicio = null,
  dataFim = null,
}) {
  const quantidadeNumero =
    Number(
      quantidade,
    );

  const pesoNumero =
    Number(
      pesoKg,
    );

  const quantidadeDias =
    calcularDiasPeriodo(
      dataInicio,
      dataFim,
    );


  const pecasPrevistas =
    Number.isFinite(
      quantidadeNumero,
    )
      ? quantidadeNumero *
        quantidadeDias
      : 0;


  const consumoPeriodoKg =
    Number.isFinite(
      pesoNumero,
    )
      ? arredondarKg(
          pecasPrevistas *
            pesoNumero,
        )
      : 0;


  const consumosFornecedores =
    (
      Array.isArray(
        receitaItens,
      )
        ? receitaItens
        : []
    ).map(
      (
        item,
      ) => {
        const percentual =
          Number(
            item
              ?.percentual ??
              0,
          );


        return {
          fornecedorId:
            item
              ?.fornecedorId,

          fornecedorNome:
            item
              ?.fornecedorNome ??
            "Fornecedor",

          percentual,

          consumoPeriodoKg:
            arredondarKg(
              consumoPeriodoKg *
                (
                  percentual /
                  100
                ),
            ),
        };
      },
    );


  return {
    quantidadeDias,

    horasPeriodo: null,

    segundosPeriodo: null,

    ciclosCompletos: null,

    pecasPorHora: null,

    pecasPrevistas,

    consumoPorHoraKg: null,

    consumoPeriodoKg,

    consumosFornecedores,
  };
}


/* =========================================================
   BUSCAR PROGRAMAÇÃO
========================================================= */

export async function buscarProgramacao() {
  const [
    dadosReceitas,
    produtosPP,
    resultadoProgramacao,
  ] =
    await Promise.all([
      buscarReceitas(),

      buscarProdutosPP(),

      supabase
        .from(
          "materia_prima_programacao",
        )
        .select(
          `
            id,
            data_inicio,
            hora_inicio,
            data_fim,
            hora_fim,
            codigo_produto,
            quantidade,
            injetora,
            ativo,
            criado_em,
            atualizado_em
          `,
        )
        .order(
          "data_inicio",
          {
            ascending: true,
          },
        )
        .order(
          "hora_inicio",
          {
            ascending: true,
            nullsFirst: true,
          },
        )
        .order(
          "id",
          {
            ascending: true,
          },
        ),
    ]);


  if (
    resultadoProgramacao
      .error
  ) {
    throw resultadoProgramacao
      .error;
  }


  const receitas =
    Array.isArray(
      dadosReceitas
        ?.receitas,
    )
      ? dadosReceitas
          .receitas
      : [];


  const receitasPorProduto =
    new Map();


  receitas.forEach(
    (
      receita,
    ) => {
      receitasPorProduto.set(
        String(
          receita.codigo,
        ),
        receita,
      );
    },
  );


  const produtosTecnicos =
    Array.isArray(
      produtosPP,
    )
      ? produtosPP
      : [];


  const produtosPorCodigo =
    new Map();


  produtosTecnicos.forEach(
    (
      produto,
    ) => {
      const codigo =
        String(
          produto
            ?.codigoProduto ??
          produto
            ?.codigo ??
          "",
        ).trim();


      if (!codigo) {
        return;
      }


      produtosPorCodigo.set(
        codigo,
        produto,
      );
    },
  );


  const programacao =
    (
      Array.isArray(
        resultadoProgramacao
          .data,
      )
        ? resultadoProgramacao
            .data
        : []
    )
      .map(
        (
          registro,
        ) => {
          const item =
            normalizarProgramacao(
              registro,
            );


          if (!item) {
            return null;
          }


          const receita =
            receitasPorProduto.get(
              item.codigoProduto,
            );


          const produtoTecnico =
            produtosPorCodigo.get(
              item.codigoProduto,
            );


          const pesoKg =
            normalizarNumero(
              produtoTecnico
                ?.pesoKg,
            );


          const cicloSegundos =
            normalizarNumero(
              produtoTecnico
                ?.cicloSegundos,
            );


          const cavidadeMolde =
            normalizarNumero(
              produtoTecnico
                ?.cavidadeMolde,
            );


          const possuiHorario =
            Boolean(
              item.horaInicio &&
              item.horaFim,
            );


          const calculo =
            possuiHorario
              ? calcularConsumoProgramacao({
                  dataInicio:
                    item.dataInicio,

                  horaInicio:
                    item.horaInicio,

                  dataFim:
                    item.dataFim,

                  horaFim:
                    item.horaFim,

                  cicloSegundos,

                  cavidadeMolde,

                  pesoKg,

                  receitaItens:
                    receita
                      ?.itens ??
                    [],
                })
              : calcularConsumoLegado({
                  quantidade:
                    item.quantidade,

                  pesoKg,

                  receitaItens:
                    receita
                      ?.itens ??
                    [],

                  dataInicio:
                    item.dataInicio,

                  dataFim:
                    item.dataFim,
                });


          return {
            ...item,

            descricao:
              produtoTecnico
                ?.nomeProduto ??
              produtoTecnico
                ?.descricao ??
              receita
                ?.descricao ??
              "Produto não encontrado",

            pesoKg,

            cicloSegundos,

            cavidadeMolde,

            receitaConfigurada:
              receita
                ?.configurada ===
              true,

            percentualReceita:
              receita
                ?.percentualTotal ??
              0,

            receitaItens:
              receita
                ?.itens ??
              [],

            calculoLegado:
              !possuiHorario,

            horasPeriodo:
              calculo
                .horasPeriodo,

            ciclosCompletos:
              calculo
                .ciclosCompletos,

            pecasPorHora:
              calculo
                .pecasPorHora,

            pecasPrevistas:
              calculo
                .pecasPrevistas,

            consumoPorHoraKg:
              calculo
                .consumoPorHoraKg,

            consumoPeriodoKg:
              calculo
                .consumoPeriodoKg,

            consumosFornecedores:
              calculo
                .consumosFornecedores,
          };
        },
      )
      .filter(
        Boolean,
      )
      .sort(
        compararProgramacao,
      );


  const produtos =
    produtosTecnicos
      .filter(
        (
          produto,
        ) =>
          produto
            ?.usaPP ===
            true &&
          produto
            ?.ativo !==
            false,
      )
      .map(
        (
          produto,
        ) => {
          const codigo =
            String(
              produto
                ?.codigoProduto ??
              produto
                ?.codigo ??
              "",
            ).trim();


          const receita =
            receitasPorProduto.get(
              codigo,
            );


          return {
            codigo,

            descricao:
              produto
                ?.nomeProduto ??
              produto
                ?.descricao ??
              "Sem descrição",

            pesoKg:
              normalizarNumero(
                produto
                  ?.pesoKg,
              ),

            cicloSegundos:
              normalizarNumero(
                produto
                  ?.cicloSegundos,
              ),

            cavidadeMolde:
              normalizarNumero(
                produto
                  ?.cavidadeMolde,
              ),

            receitaConfigurada:
              receita
                ?.configurada ===
              true,

            percentualReceita:
              receita
                ?.percentualTotal ??
              0,

            receitaItens:
              receita
                ?.itens ??
              [],
          };
        },
      );


  return {
    programacao,

    produtos,
  };
}


/* =========================================================
   SALVAR PROGRAMAÇÃO
========================================================= */

export async function salvarProgramacao({
  id = null,
  dataInicio,
  horaInicio,
  dataFim,
  horaFim,
  codigoProduto,
  injetora = null,
  ativo = true,
}) {
  const inicio =
    String(
      dataInicio ?? "",
    ).trim();

  const fim =
    String(
      dataFim ?? "",
    ).trim();

  const horaInicial =
    normalizarHora(
      horaInicio,
    );

  const horaFinal =
    normalizarHora(
      horaFim,
    );

  const codigo =
    String(
      codigoProduto ??
        "",
    ).trim();

  const injetoraFinal =
    String(
      injetora ??
        "",
    ).trim();


  if (!inicio) {
    throw new Error(
      "Informe a data inicial.",
    );
  }


  if (!horaInicial) {
    throw new Error(
      "Informe a hora inicial.",
    );
  }


  if (!fim) {
    throw new Error(
      "Informe a data final.",
    );
  }


  if (!horaFinal) {
    throw new Error(
      "Informe a hora final.",
    );
  }


  if (!codigo) {
    throw new Error(
      "Selecione o produto.",
    );
  }


  const inicioMs =
    converterDataHoraParaUTC(
      inicio,
      horaInicial,
    );

  const fimMs =
    converterDataHoraParaUTC(
      fim,
      horaFinal,
    );


  if (
    inicioMs === null ||
    fimMs === null ||
    fimMs <= inicioMs
  ) {
    throw new Error(
      "A data e hora final precisam ser posteriores à data e hora inicial.",
    );
  }


  /* =======================================================
     VERIFICAR CONFLITO NO BANCO ANTES DE SALVAR
  ======================================================= */

  if (injetoraFinal) {
    let consultaConflito =
      supabase
        .from(
          "materia_prima_programacao",
        )
        .select(
          `
            id,
            data_inicio,
            hora_inicio,
            data_fim,
            hora_fim,
            injetora,
            ativo
          `,
        )
        .eq(
          "ativo",
          true,
        )
        .eq(
          "injetora",
          injetoraFinal,
        );


    if (
      id !== null &&
      id !== undefined
    ) {
      consultaConflito =
        consultaConflito.neq(
          "id",
          id,
        );
    }


    const {
      data:
        programacoesInjetora,
      error:
        erroConflito,
    } =
      await consultaConflito;


    if (erroConflito) {
      throw erroConflito;
    }


    const conflito =
      verificarConflitoInjetora({
        programacao:
          (
            Array.isArray(
              programacoesInjetora,
            )
              ? programacoesInjetora
              : []
          ).map(
            (
              registro,
            ) => ({
              id:
                registro.id,

              dataInicio:
                registro
                  .data_inicio,

              horaInicio:
                normalizarHora(
                  registro
                    .hora_inicio,
                ),

              dataFim:
                registro
                  .data_fim,

              horaFim:
                normalizarHora(
                  registro
                    .hora_fim,
                ),

              injetora:
                registro
                  .injetora,

              ativo:
                registro
                  .ativo !==
                false,
            }),
          ),

        injetora:
          injetoraFinal,

        dataInicio:
          inicio,

        horaInicio:
          horaInicial,

        dataFim:
          fim,

        horaFim:
          horaFinal,

        ignorarId:
          id,
      });


    if (conflito) {
      throw new Error(
        `A Injetora ${injetoraFinal} já possui uma programação ativa neste período.`,
      );
    }
  }


  /* =======================================================
     BUSCAR PRODUTO
  ======================================================= */

  const produtosPP =
    await buscarProdutosPP();


  const produto =
    (
      Array.isArray(
        produtosPP,
      )
        ? produtosPP
        : []
    ).find(
      (
        registro,
      ) =>
        String(
          registro
            ?.codigoProduto ??
          registro
            ?.codigo ??
          "",
        ).trim() ===
        codigo,
    );


  if (!produto) {
    throw new Error(
      "Produto PP não encontrado.",
    );
  }


  const pesoKg =
    normalizarNumero(
      produto
        ?.pesoKg,
    );

  const cicloSegundos =
    normalizarNumero(
      produto
        ?.cicloSegundos,
    );

  const cavidadeMolde =
    normalizarNumero(
      produto
        ?.cavidadeMolde,
    );


  if (
    pesoKg === null ||
    pesoKg <= 0
  ) {
    throw new Error(
      "O produto selecionado não possui peso por peça válido.",
    );
  }


  if (
    cicloSegundos === null ||
    cicloSegundos <= 0
  ) {
    throw new Error(
      "O produto selecionado não possui ciclo válido.",
    );
  }


  if (
    cavidadeMolde === null ||
    !Number.isInteger(
      cavidadeMolde,
    ) ||
    cavidadeMolde <= 0
  ) {
    throw new Error(
      "O produto selecionado não possui quantidade de cavidades válida.",
    );
  }


  const calculo =
    calcularConsumoProgramacao({
      dataInicio:
        inicio,

      horaInicio:
        horaInicial,

      dataFim:
        fim,

      horaFim:
        horaFinal,

      cicloSegundos,

      cavidadeMolde,

      pesoKg,
    });


  if (
    !calculo.periodoValido
  ) {
    throw new Error(
      "O período informado é inválido.",
    );
  }


  if (
    !calculo.parametrosValidos
  ) {
    throw new Error(
      "Os parâmetros técnicos do produto são inválidos.",
    );
  }


  if (
    calculo.ciclosCompletos <= 0 ||
    calculo.pecasPrevistas <= 0
  ) {
    throw new Error(
      "O período informado não é suficiente para completar um ciclo de produção.",
    );
  }


  const agora =
    new Date()
      .toISOString();


  const dadosSalvar = {
    data_inicio:
      inicio,

    hora_inicio:
      horaInicial,

    data_fim:
      fim,

    hora_fim:
      horaFinal,

    codigo_produto:
      codigo,

    quantidade:
      calculo
        .pecasPrevistas,

    injetora:
      injetoraFinal ||
      null,

    ativo:
      Boolean(
        ativo,
      ),

    atualizado_em:
      agora,
  };


  /* =======================================================
     EDITAR
  ======================================================= */

  if (
    id !== null &&
    id !== undefined
  ) {
    const {
      data:
        registroSalvo,
      error,
    } =
      await supabase
        .from(
          "materia_prima_programacao",
        )
        .update(
          dadosSalvar,
        )
        .eq(
          "id",
          id,
        )
        .select(
          `
            id,
            data_inicio,
            hora_inicio,
            data_fim,
            hora_fim,
            codigo_produto,
            quantidade,
            injetora,
            ativo,
            criado_em,
            atualizado_em
          `,
        )
        .single();


    if (error) {
      throw error;
    }


    return normalizarProgramacao(
      registroSalvo,
    );
  }


  /* =======================================================
     NOVO
  ======================================================= */

  const {
    data:
      registroSalvo,
    error,
  } =
    await supabase
      .from(
        "materia_prima_programacao",
      )
      .insert(
        dadosSalvar,
      )
      .select(
        `
          id,
          data_inicio,
          hora_inicio,
          data_fim,
          hora_fim,
          codigo_produto,
          quantidade,
          injetora,
          ativo,
          criado_em,
          atualizado_em
        `,
      )
      .single();


  if (error) {
    throw error;
  }


  return normalizarProgramacao(
    registroSalvo,
  );
}


/* =========================================================
   EXCLUIR PROGRAMAÇÃO
========================================================= */

export async function excluirProgramacao(
  id,
) {
  if (
    id === null ||
    id === undefined
  ) {
    throw new Error(
      "Programação não informada.",
    );
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_programacao",
      )
      .delete()
      .eq(
        "id",
        id,
      )
      .select(
        "id",
      )
      .single();


  if (error) {
    throw error;
  }


  return data;
}