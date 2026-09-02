import { supabase } from "@/lib/supabaseClient";

import {
  buscarReceitas,
} from "../receitas/receitasService";


/* =========================================================
   UTILITÁRIOS
========================================================= */

function compararProgramacao(
  itemA,
  itemB,
) {
  const inicioA =
    String(
      itemA?.dataInicio ?? "",
    );

  const inicioB =
    String(
      itemB?.dataInicio ?? "",
    );


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
    partes.length !==
    3
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

  const dataFim =
    String(
      registro
        ?.data_fim ??
        "",
    ).trim();

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

    dataFim,

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
   CALCULAR CONSUMO
========================================================= */

export function calcularConsumoProgramacao({
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
    dataInicio &&
    dataFim
      ? calcularDiasPeriodo(
          dataInicio,
          dataFim,
        )
      : 1;


  const consumoDiarioKg =
    Number.isFinite(
      quantidadeNumero,
    ) &&
    Number.isFinite(
      pesoNumero,
    )
      ? arredondarKg(
          quantidadeNumero *
            pesoNumero,
        )
      : 0;


  const consumoPeriodoKg =
    arredondarKg(
      consumoDiarioKg *
        quantidadeDias,
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


        const consumoDiarioFornecedorKg =
          arredondarKg(
            consumoDiarioKg *
              (
                percentual /
                100
              ),
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

          consumoDiarioKg:
            consumoDiarioFornecedorKg,

          consumoPeriodoKg:
            arredondarKg(
              consumoDiarioFornecedorKg *
                quantidadeDias,
            ),
        };
      },
    );


  return {
    quantidadeDias,

    consumoDiarioKg,

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
    resultadoProgramacao,
  ] =
    await Promise.all([
      buscarReceitas(),

      supabase
        .from(
          "materia_prima_programacao",
        )
        .select(
          `
            id,
            data_inicio,
            data_fim,
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


          const pesoKg =
            receita
              ?.pesoKg ??
            null;


          const calculo =
            calcularConsumoProgramacao({
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
              receita
                ?.descricao ??
              "Produto não encontrado",

            pesoKg,

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

            consumoDiarioKg:
              calculo
                .consumoDiarioKg,

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
    receitas.map(
      (
        receita,
      ) => ({
        codigo:
          receita.codigo,

        descricao:
          receita
            .descricao,

        pesoKg:
          receita
            .pesoKg,

        receitaConfigurada:
          receita
            .configurada,

        percentualReceita:
          receita
            .percentualTotal,

        receitaItens:
          receita
            .itens ??
          [],
      }),
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
  dataFim,
  codigoProduto,
  quantidade,
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

  const codigo =
    String(
      codigoProduto ??
        "",
    ).trim();

  const quantidadeNumero =
    normalizarNumero(
      quantidade,
    );

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


  if (!fim) {
    throw new Error(
      "Informe a data final.",
    );
  }


  if (
    calcularDiasPeriodo(
      inicio,
      fim,
    ) <= 0
  ) {
    throw new Error(
      "A data final não pode ser anterior à data inicial.",
    );
  }


  if (!codigo) {
    throw new Error(
      "Selecione o produto.",
    );
  }


  if (
    quantidadeNumero ===
      null ||
    quantidadeNumero <=
      0 ||
    !Number.isInteger(
      quantidadeNumero,
    )
  ) {
    throw new Error(
      "Informe uma quantidade diária inteira maior que zero.",
    );
  }


  const agora =
    new Date()
      .toISOString();


  const dadosSalvar = {
    data_inicio:
      inicio,

    data_fim:
      fim,

    codigo_produto:
      codigo,

    quantidade:
      quantidadeNumero,

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
            data_fim,
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
          data_fim,
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