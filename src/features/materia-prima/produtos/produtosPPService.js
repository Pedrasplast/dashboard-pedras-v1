import { supabase } from "@/lib/supabaseClient";


/* =========================================================
   UTILITÁRIOS
========================================================= */

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


  const texto =
    String(
      valor,
    ).trim();


  const normalizado =
    texto.includes(",")
      ? texto
          .replace(/\./g, "")
          .replace(",", ".")
      : texto;


  const numero =
    Number(
      normalizado,
    );


  return Number.isFinite(
    numero,
  )
    ? numero
    : null;
}


function normalizarInteiro(
  valor,
) {
  const numero =
    normalizarNumero(
      valor,
    );


  if (
    numero === null
  ) {
    return null;
  }


  const inteiro =
    Math.trunc(
      numero,
    );


  return Number.isFinite(
    inteiro,
  )
    ? inteiro
    : null;
}


/* =========================================================
   NORMALIZAR PRODUTO
========================================================= */

function normalizarProduto(
  registro,
) {
  if (!registro) {
    return null;
  }


  const codigoProduto =
    String(
      registro
        ?.codigo_produto ??
        registro
          ?.codigoProduto ??
        registro
          ?.codigo ??
        registro
          ?.cod_prod ??
        "",
    ).trim();


  const nomeProduto =
    String(
      registro
        ?.nome_produto ??
        registro
          ?.nomeProduto ??
        registro
          ?.produto ??
        registro
          ?.descricao ??
        "",
    ).trim();


  const pesoKg =
    normalizarNumero(
      registro
        ?.kg_un ??
      registro
        ?.pesoKg ??
      null,
    );


  const cicloSegundos =
    normalizarNumero(
      registro
        ?.ciclo_segundos ??
      registro
        ?.cicloSegundos ??
      null,
    );


  const cavidadeMolde =
    normalizarInteiro(
      registro
        ?.cavidade_molde ??
      registro
        ?.cavidadeMolde ??
      null,
    );


  const usaPP =
    registro
      ?.usa_pp ===
      true ||
    registro
      ?.usaPP ===
      true;


  const ativo =
    registro
      ?.ativo !==
    false;


  if (
    !codigoProduto ||
    !nomeProduto
  ) {
    return null;
  }


  return {
    codigoProduto,

    nomeProduto,

    pesoKg,

    cicloSegundos,

    cavidadeMolde,

    usaPP,

    ativo,


    codigo:
      codigoProduto,

    produto:
      nomeProduto,

    descricao:
      nomeProduto,


    codigo_produto:
      codigoProduto,

    nome_produto:
      nomeProduto,

    peso_kg:
      pesoKg,

    kg_un:
      pesoKg,

    ciclo_segundos:
      cicloSegundos,

    cavidade_molde:
      cavidadeMolde,

    usa_pp:
      usaPP,


    configuracao: {
      codigoProduto,

      codigo_produto:
        codigoProduto,

      usaPP,

      usa_pp:
        usaPP,

      pesoKg,

      peso_kg:
        pesoKg,

      kg_un:
        pesoKg,

      cicloSegundos,

      ciclo_segundos:
        cicloSegundos,

      cavidadeMolde,

      cavidade_molde:
        cavidadeMolde,

      ativo,
    },


    criadoEm:
      registro
        ?.criado_em ??
        registro
          ?.criadoEm ??
      null,

    atualizadoEm:
      registro
        ?.atualizado_em ??
        registro
          ?.atualizadoEm ??
        registro
          ?.updated_at ??
      null,

    criado_em:
      registro
        ?.criado_em ??
        registro
          ?.criadoEm ??
      null,

    atualizado_em:
      registro
        ?.atualizado_em ??
        registro
          ?.atualizadoEm ??
        registro
          ?.updated_at ??
      null,
  };
}


/* =========================================================
   BUSCAR PRODUTOS PP
========================================================= */

export async function buscarProdutosPP() {
  const [
    produtosResultado,
    parametrosResultado,
  ] =
    await Promise.all([
      supabase
        .from(
          "materia_prima_produtos",
        )
        .select(
          `
            codigo_produto,
            nome_produto,
            usa_pp,
            ativo,
            criado_em,
            atualizado_em
          `,
        )
        .eq(
          "usa_pp",
          true,
        )
        .order(
          "nome_produto",
          {
            ascending: true,
          },
        ),

      supabase
        .from(
          "parametros_produto",
        )
        .select(
          `
            cod_prod,
            kg_un,
            ciclo_segundos,
            cavidade_molde,
            ativo,
            created_at,
            updated_at
          `,
        ),
    ]);


  if (
    produtosResultado
      .error
  ) {
    throw produtosResultado
      .error;
  }


  if (
    parametrosResultado
      .error
  ) {
    throw parametrosResultado
      .error;
  }


  const mapaParametros =
    new Map(
      (
        Array.isArray(
          parametrosResultado
            .data,
        )
          ? parametrosResultado
              .data
          : []
      ).map(
        (
          parametro,
        ) => [
          String(
            parametro
              ?.cod_prod ??
              "",
          ).trim(),

          parametro,
        ],
      ),
    );


  return (
    Array.isArray(
      produtosResultado
        .data,
    )
      ? produtosResultado
          .data
      : []
  )
    .map(
      (
        produto,
      ) => {
        const codigo =
          String(
            produto
              ?.codigo_produto ??
              "",
          ).trim();


        const parametros =
          mapaParametros.get(
            codigo,
          ) ??
          {};


        return normalizarProduto({
          ...produto,

          kg_un:
            parametros
              ?.kg_un ??
            null,

          ciclo_segundos:
            parametros
              ?.ciclo_segundos ??
            null,

          cavidade_molde:
            parametros
              ?.cavidade_molde ??
            null,

          updated_at:
            parametros
              ?.updated_at ??
            produto
              ?.atualizado_em ??
            null,
        });
      },
    )
    .filter(
      Boolean,
    );
}


/* =========================================================
   COMPATIBILIDADE COM RECEITAS / PROGRAMAÇÃO
========================================================= */

export async function buscarProdutosPedidos() {
  const produtos =
    await buscarProdutosPP();


  return produtos.map(
    (
      produto,
    ) => ({
      ...produto,

      codigo:
        produto.codigoProduto,

      codigo_produto:
        produto.codigoProduto,

      produto:
        produto.nomeProduto,

      nome_produto:
        produto.nomeProduto,

      descricao:
        produto.nomeProduto,

      usaPP:
        true,

      usa_pp:
        true,

      pesoKg:
        produto.pesoKg,

      peso_kg:
        produto.pesoKg,

      kg_un:
        produto.pesoKg,

      cicloSegundos:
        produto.cicloSegundos,

      ciclo_segundos:
        produto.cicloSegundos,

      cavidadeMolde:
        produto.cavidadeMolde,

      cavidade_molde:
        produto.cavidadeMolde,

      ativo:
        produto.ativo,

      configuracao: {
        codigoProduto:
          produto.codigoProduto,

        codigo_produto:
          produto.codigoProduto,

        usaPP:
          true,

        usa_pp:
          true,

        pesoKg:
          produto.pesoKg,

        peso_kg:
          produto.pesoKg,

        kg_un:
          produto.pesoKg,

        cicloSegundos:
          produto.cicloSegundos,

        ciclo_segundos:
          produto.cicloSegundos,

        cavidadeMolde:
          produto.cavidadeMolde,

        cavidade_molde:
          produto.cavidadeMolde,

        ativo:
          produto.ativo,
      },
    }),
  );
}


/* =========================================================
   SALVAR PRODUTO PP
========================================================= */

export async function salvarProdutoPP({
  codigoProdutoOriginal = null,
  codigoProduto,
  nomeProduto,
  pesoKg,
  cicloSegundos,
  cavidadeMolde,
  ativo = true,
}) {
  const codigoFinal =
    String(
      codigoProduto ??
        "",
    ).trim();

  const nomeFinal =
    String(
      nomeProduto ??
        "",
    ).trim();

  const pesoFinal =
    normalizarNumero(
      pesoKg,
    );

  const cicloFinal =
    normalizarNumero(
      cicloSegundos,
    );

  const cavidadeFinal =
    normalizarInteiro(
      cavidadeMolde,
    );


  if (!codigoFinal) {
    throw new Error(
      "Informe o código do produto.",
    );
  }


  if (!nomeFinal) {
    throw new Error(
      "Informe o nome do produto.",
    );
  }


  if (
    pesoFinal ===
      null ||
    pesoFinal <=
      0
  ) {
    throw new Error(
      "Informe um peso por peça maior que zero.",
    );
  }


  if (
    cicloFinal ===
      null ||
    cicloFinal <=
      0
  ) {
    throw new Error(
      "Informe um ciclo maior que zero.",
    );
  }


  if (
    cavidadeFinal ===
      null ||
    cavidadeFinal <=
      0
  ) {
    throw new Error(
      "Informe uma quantidade de cavidades maior que zero.",
    );
  }


  const codigoOriginalFinal =
    codigoProdutoOriginal ===
        null ||
    codigoProdutoOriginal ===
        undefined ||
    !String(
      codigoProdutoOriginal,
    ).trim()
      ? null
      : String(
          codigoProdutoOriginal,
        ).trim();


  const {
    data,
    error,
  } =
    await supabase.rpc(
      "salvar_produto_pp",
      {
        p_codigo_produto_original:
          codigoOriginalFinal,

        p_codigo_produto:
          codigoFinal,

        p_nome_produto:
          nomeFinal,

        p_kg_un:
          pesoFinal,

        p_ciclo_segundos:
          cicloFinal,

        p_cavidade_molde:
          cavidadeFinal,

        p_ativo:
          Boolean(
            ativo,
          ),
      },
    );


  if (error) {
    if (
      error.code ===
      "23505"
    ) {
      throw new Error(
        "Já existe um produto cadastrado com este código.",
      );
    }


    throw error;
  }


  const registro =
    Array.isArray(
      data,
    )
      ? data[0]
      : data;


  return normalizarProduto(
    registro,
  );
}


/* =========================================================
   EXCLUIR PRODUTO PP
========================================================= */

export async function excluirProdutoPP(
  codigoProduto,
) {
  const codigo =
    String(
      codigoProduto ??
        "",
    ).trim();


  if (!codigo) {
    throw new Error(
      "Produto não informado.",
    );
  }


  const {
    data,
    error,
  } =
    await supabase.rpc(
      "excluir_produto_pp",
      {
        p_codigo_produto:
          codigo,
      },
    );


  if (error) {
    throw new Error(
      error.message ||
      "Não foi possível excluir o Produto PP.",
    );
  }


  return data;
}


/* =========================================================
   COMPATIBILIDADE COM CÓDIGO ANTIGO
========================================================= */

export async function salvarConfiguracaoProdutoPP({
  codigoProduto,
  nomeProduto = null,
  produto = null,
  usaPP = true,
  pesoKg,
  cicloSegundos,
  cavidadeMolde,
  ativo = true,
}) {
  if (!usaPP) {
    throw new Error(
      "A tela Produtos PP aceita somente produtos que utilizam PP.",
    );
  }


  return salvarProdutoPP({
    codigoProdutoOriginal:
      codigoProduto,

    codigoProduto,

    nomeProduto:
      nomeProduto ||
      produto ||
      codigoProduto,

    pesoKg,

    cicloSegundos,

    cavidadeMolde,

    ativo,
  });
}