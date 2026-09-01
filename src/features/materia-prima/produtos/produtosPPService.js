import { supabase } from "@/lib/supabaseClient";


/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarPeso(
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


  const pesoOriginal =
    registro
      ?.peso_kg ??
    registro
      ?.pesoKg ??
    null;


  const pesoNumero =
    pesoOriginal ===
        null ||
    pesoOriginal ===
        undefined
      ? null
      : Number(
          pesoOriginal,
        );


  const pesoKg =
    Number.isFinite(
      pesoNumero,
    )
      ? pesoNumero
      : null;


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
    /* =====================================================
       FORMATO NOVO
    ===================================================== */

    codigoProduto,

    nomeProduto,

    pesoKg,

    usaPP,

    ativo,


    /* =====================================================
       COMPATIBILIDADE COM TELAS ANTIGAS
    ===================================================== */

    codigo:
      codigoProduto,

    produto:
      nomeProduto,

    descricao:
      nomeProduto,


    /* =====================================================
       COMPATIBILIDADE SNAKE_CASE
    ===================================================== */

    codigo_produto:
      codigoProduto,

    nome_produto:
      nomeProduto,

    peso_kg:
      pesoKg,

    usa_pp:
      usaPP,


    /* =====================================================
       CONFIGURAÇÃO
    ===================================================== */

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

      ativo,
    },


    /* =====================================================
       DATAS
    ===================================================== */

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
      null,
  };
}


/* =========================================================
   BUSCAR PRODUTOS PP
========================================================= */

export async function buscarProdutosPP() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_produtos",
      )
      .select(
        `
          codigo_produto,
          nome_produto,
          usa_pp,
          peso_kg,
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
      );


  if (error) {
    throw error;
  }


  return (
    Array.isArray(
      data,
    )
      ? data
      : []
  )
    .map(
      normalizarProduto,
    )
    .filter(
      Boolean,
    );
}


/* =========================================================
   COMPATIBILIDADE COM RECEITAS / PROGRAMAÇÃO
========================================================= */

/*
 * O nome da função é mantido porque Receitas
 * e outras partes antigas do módulo ainda
 * podem importá-la.
 *
 * Porém ela NÃO consulta mais pedidos_omie.
 *
 * Agora retorna exclusivamente os produtos
 * cadastrados em materia_prima_produtos.
 */
export async function buscarProdutosPedidos() {
  const produtos =
    await buscarProdutosPP();


  return produtos.map(
    (
      produto,
    ) => ({
      ...produto,

      /*
       * Reforça o formato esperado pelas
       * telas antigas.
       */
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
    normalizarPeso(
      pesoKg,
    );


  /* =======================================================
     VALIDAÇÕES
  ======================================================= */

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


  const agora =
    new Date()
      .toISOString();


  const dadosSalvar = {
    codigo_produto:
      codigoFinal,

    nome_produto:
      nomeFinal,

    usa_pp:
      true,

    peso_kg:
      pesoFinal,

    ativo:
      Boolean(
        ativo,
      ),

    atualizado_em:
      agora,
  };


  /* =======================================================
     EDIÇÃO
  ======================================================= */

  if (
    codigoProdutoOriginal !==
      null &&
    codigoProdutoOriginal !==
      undefined &&
    String(
      codigoProdutoOriginal,
    ).trim()
  ) {
    const codigoOriginal =
      String(
        codigoProdutoOriginal,
      ).trim();


    const {
      data,
      error,
    } =
      await supabase
        .from(
          "materia_prima_produtos",
        )
        .update(
          dadosSalvar,
        )
        .eq(
          "codigo_produto",
          codigoOriginal,
        )
        .select(
          `
            codigo_produto,
            nome_produto,
            usa_pp,
            peso_kg,
            ativo,
            criado_em,
            atualizado_em
          `,
        )
        .single();


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


    return normalizarProduto(
      data,
    );
  }


  /* =======================================================
     NOVO CADASTRO
  ======================================================= */

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_produtos",
      )
      .insert({
        ...dadosSalvar,

        criado_em:
          agora,
      })
      .select(
        `
          codigo_produto,
          nome_produto,
          usa_pp,
          peso_kg,
          ativo,
          criado_em,
          atualizado_em
        `,
      )
      .single();


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


  return normalizarProduto(
    data,
  );
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

    ativo,
  });
}