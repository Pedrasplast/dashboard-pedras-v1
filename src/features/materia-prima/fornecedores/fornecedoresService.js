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


function converterNumeroOpcional(
  valor,
  nomeCampo,
) {
  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ""
  ) {
    return null;
  }


  const numero =
    Number(
      String(valor)
        .trim()
        .replace(
          ",",
          ".",
        ),
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    throw new Error(
      `Informe um valor válido para ${nomeCampo}.`,
    );
  }


  if (
    numero < 0
  ) {
    throw new Error(
      `${nomeCampo} não pode ser negativo.`,
    );
  }


  return numero;
}


function converterInteiroOpcional(
  valor,
  nomeCampo,
) {
  const numero =
    converterNumeroOpcional(
      valor,
      nomeCampo,
    );


  if (
    numero === null
  ) {
    return null;
  }


  if (
    !Number.isInteger(
      numero,
    )
  ) {
    throw new Error(
      `${nomeCampo} precisa ser informado em dias inteiros.`,
    );
  }


  return numero;
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


  const estoqueMinimoKg =
    registro
      ?.estoque_minimo_kg === null ||
    registro
      ?.estoque_minimo_kg === undefined
      ? null
      : Number(
          registro
            .estoque_minimo_kg,
        );

  const estoqueAlvoKg =
    registro
      ?.estoque_alvo_kg === null ||
    registro
      ?.estoque_alvo_kg === undefined
      ? null
      : Number(
          registro
            .estoque_alvo_kg,
        );

  const leadTimeDias =
    registro
      ?.lead_time_dias === null ||
    registro
      ?.lead_time_dias === undefined
      ? null
      : Number(
          registro
            .lead_time_dias,
        );


  return {
    id,

    nome,

    ativo:
      registro
        ?.ativo !==
      false,

    estoqueMinimoKg:
      Number.isFinite(
        estoqueMinimoKg,
      )
        ? estoqueMinimoKg
        : null,

    estoqueAlvoKg:
      Number.isFinite(
        estoqueAlvoKg,
      )
        ? estoqueAlvoKg
        : null,

    leadTimeDias:
      Number.isInteger(
        leadTimeDias,
      )
        ? leadTimeDias
        : null,

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


  if (
    error.code ===
    "23514"
  ) {
    return new Error(
      "Os parâmetros de compra informados são inválidos. Confirme estoque mínimo, estoque alvo e prazo de entrega.",
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
          estoque_minimo_kg,
          estoque_alvo_kg,
          lead_time_dias,
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
  estoqueMinimoKg = null,
  estoqueAlvoKg = null,
  leadTimeDias = null,
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


  const estoqueMinimoFinal =
    converterNumeroOpcional(
      estoqueMinimoKg,
      "o estoque mínimo",
    );

  const estoqueAlvoFinal =
    converterNumeroOpcional(
      estoqueAlvoKg,
      "o estoque alvo",
    );

  const leadTimeFinal =
    converterInteiroOpcional(
      leadTimeDias,
      "o prazo de entrega",
    );


  if (
    estoqueMinimoFinal !== null &&
    estoqueAlvoFinal !== null &&
    estoqueAlvoFinal <
      estoqueMinimoFinal
  ) {
    throw new Error(
      "O estoque alvo deve ser maior ou igual ao estoque mínimo.",
    );
  }


  const agora =
    new Date()
      .toISOString();


  const dadosFornecedor = {
    nome:
      nomeFinal,

    ativo:
      Boolean(
        ativo,
      ),

    estoque_minimo_kg:
      estoqueMinimoFinal,

    estoque_alvo_kg:
      estoqueAlvoFinal,

    lead_time_dias:
      leadTimeFinal,

    atualizado_em:
      agora,
  };


  const colunasRetorno = `
    id,
    nome,
    ativo,
    estoque_minimo_kg,
    estoque_alvo_kg,
    lead_time_dias,
    criado_em,
    atualizado_em
  `;


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
          dadosFornecedor,
        )
        .eq(
          "id",
          id,
        )
        .select(
          colunasRetorno,
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
        dadosFornecedor,
      )
      .select(
        colunasRetorno,
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