import { supabase } from "@/lib/supabaseClient";


/* =========================================================
   UTILITÁRIOS
========================================================= */

function compararNomes(
  nomeA,
  nomeB,
) {
  return String(
    nomeA ?? "",
  ).localeCompare(
    String(
      nomeB ?? "",
    ),
    "pt-BR",
    {
      sensitivity: "base",
    },
  );
}


function normalizarFornecedor(
  registro,
) {
  if (
    !registro
  ) {
    return null;
  }


  const id =
    registro
      ?.id;

  const nome =
    String(
      registro
        ?.nome ??
        "",
    ).trim();


  if (
    id === null ||
    id === undefined ||
    !nome
  ) {
    return null;
  }


  return {
    id,

    nome,

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
   TRATAR ERRO DO BANCO
========================================================= */

function tratarErroFornecedor(
  error,
) {
  if (!error) {
    return new Error(
      "Não foi possível concluir a operação.",
    );
  }


  if (
    error.code ===
    "23505"
  ) {
    return new Error(
      "Já existe um fornecedor cadastrado com este nome.",
    );
  }


  return new Error(
    error.message ||
      "Não foi possível salvar o fornecedor.",
  );
}


/* =========================================================
   BUSCAR FORNECEDORES
========================================================= */

export async function buscarFornecedores() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_fornecedores",
      )
      .select(
        `
          id,
          nome,
          ativo,
          criado_em,
          atualizado_em
        `,
      );


  if (error) {
    throw error;
  }


  const fornecedores =
    (
      Array.isArray(
        data,
      )
        ? data
        : []
    )
      .map(
        (
          registro,
        ) =>
          normalizarFornecedor(
            registro,
          ),
      )
      .filter(
        Boolean,
      );


  return fornecedores.sort(
    (
      fornecedorA,
      fornecedorB,
    ) =>
      compararNomes(
        fornecedorA.nome,
        fornecedorB.nome,
      ),
  );
}


/* =========================================================
   SALVAR FORNECEDOR
========================================================= */

export async function salvarFornecedor({
  id = null,
  nome,
  ativo = true,
}) {
  const nomeFinal =
    String(
      nome ?? "",
    ).trim();


  if (!nomeFinal) {
    throw new Error(
      "Informe o nome do fornecedor.",
    );
  }


  const agora =
    new Date()
      .toISOString();


  /* =======================================================
     EDITAR FORNECEDOR EXISTENTE
  ======================================================= */

  if (
    id !== null &&
    id !== undefined
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "materia_prima_fornecedores",
        )
        .update(
          {
            nome:
              nomeFinal,

            ativo:
              Boolean(
                ativo,
              ),

            atualizado_em:
              agora,
          },
        )
        .eq(
          "id",
          id,
        )
        .select(
          `
            id,
            nome,
            ativo,
            criado_em,
            atualizado_em
          `,
        )
        .single();


    if (error) {
      throw tratarErroFornecedor(
        error,
      );
    }


    const fornecedor =
      normalizarFornecedor(
        data,
      );


    if (!fornecedor) {
      throw new Error(
        "O fornecedor foi atualizado, mas não foi possível confirmar o resultado.",
      );
    }


    return fornecedor;
  }


  /* =======================================================
     NOVO FORNECEDOR
  ======================================================= */

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_fornecedores",
      )
      .insert(
        {
          nome:
            nomeFinal,

          ativo:
            Boolean(
              ativo,
            ),

          atualizado_em:
            agora,
        },
      )
      .select(
        `
          id,
          nome,
          ativo,
          criado_em,
          atualizado_em
        `,
      )
      .single();


  if (error) {
    throw tratarErroFornecedor(
      error,
    );
  }


  const fornecedor =
    normalizarFornecedor(
      data,
    );


  if (!fornecedor) {
    throw new Error(
      "O fornecedor foi salvo, mas não foi possível confirmar o resultado.",
    );
  }


  return fornecedor;
}