import { supabase } from "@/lib/supabaseClient";

/* =========================================================
   UTILITÁRIOS
========================================================= */

function numero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const convertido =
    Number(valor);

  return Number.isFinite(
    convertido,
  )
    ? convertido
    : null;
}

function texto(valor) {
  return String(
    valor ?? "",
  ).trim();
}

/* =========================================================
   PRODUTOS
========================================================= */

export async function buscarProdutosCadastro() {
  const [
    produtosResultado,
    parametrosResultado,
  ] = await Promise.all([
    supabase
      .from("materia_prima_produtos")
      .select(`
        codigo_produto,
        nome_produto,
        usa_pp,
        peso_kg,
        ativo,
        criado_em,
        atualizado_em
      `)
      .order(
        "codigo_produto",
        {
          ascending: true,
        },
      ),

    supabase
      .from("parametros_produto")
      .select(`
        id,
        cod_prod,
        descricao,
        cavidade_molde,
        tempo_resfriamento_segundos,
        ciclo_segundos,
        tempo_injecao_segundos,
        kg_un,
        kg_haste,
        ativo,
        created_at,
        updated_at
      `)
      .order(
        "cod_prod",
        {
          ascending: true,
        },
      ),
  ]);

  if (
    produtosResultado.error
  ) {
    throw new Error(
      `Erro ao carregar produtos: ${produtosResultado.error.message}`,
    );
  }

  if (
    parametrosResultado.error
  ) {
    throw new Error(
      `Erro ao carregar parâmetros dos produtos: ${parametrosResultado.error.message}`,
    );
  }

  const produtos =
    Array.isArray(
      produtosResultado.data,
    )
      ? produtosResultado.data
      : [];

  const parametros =
    Array.isArray(
      parametrosResultado.data,
    )
      ? parametrosResultado.data
      : [];

  const parametrosPorProduto =
    new Map();

  for (
    const parametro
    of parametros
  ) {
    parametrosPorProduto.set(
      texto(
        parametro.cod_prod,
      ),
      parametro,
    );
  }

  return produtos.map(
    (produto) => {
      const codigoProduto =
        texto(
          produto.codigo_produto,
        );

      const parametro =
        parametrosPorProduto.get(
          codigoProduto,
        ) ?? null;

      return {
        codigoProduto,

        nomeProduto:
          texto(
            produto.nome_produto,
          ),

        usaPp:
          produto.usa_pp === true,

        pesoKg:
          numero(
            produto.peso_kg,
          ),

        ativo:
          produto.ativo === true,

        criadoEm:
          produto.criado_em ??
          null,

        atualizadoEm:
          produto.atualizado_em ??
          null,

        temParametros:
          Boolean(parametro),

        parametroAtivo:
          parametro?.ativo ===
          true,

        descricaoParametro:
          texto(
            parametro?.descricao,
          ),

        cavidadeMolde:
          numero(
            parametro?.cavidade_molde,
          ),

        tempoResfriamentoSegundos:
          numero(
            parametro?.tempo_resfriamento_segundos,
          ),

        cicloSegundos:
          numero(
            parametro?.ciclo_segundos,
          ),

        tempoInjecaoSegundos:
          numero(
            parametro?.tempo_injecao_segundos,
          ),

        kgUn:
          numero(
            parametro?.kg_un,
          ),

        kgHaste:
          numero(
            parametro?.kg_haste,
          ),
      };
    },
  );
}

/* =========================================================
   SALVAR PRODUTO
========================================================= */

export async function salvarProdutoCadastro({
  codigoProduto,
  codigoOriginal,
  nomeProduto,
  usaPp,
  pesoKg,
  ativo,
  cavidadeMolde,
  cicloSegundos,
  tempoInjecaoSegundos,
  tempoResfriamentoSegundos,
  kgUn,
  kgHaste,
}) {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "salvar_cadastro_produto",
      {
        p_codigo_produto:
          codigoProduto,

        p_nome_produto:
          nomeProduto,

        p_usa_pp:
          usaPp,

        p_peso_kg:
          pesoKg,

        p_ativo:
          ativo,

        p_cavidade_molde:
          cavidadeMolde,

        p_ciclo_segundos:
          cicloSegundos,

        p_tempo_injecao_segundos:
          tempoInjecaoSegundos,

        p_tempo_resfriamento_segundos:
          tempoResfriamentoSegundos,

        p_kg_un:
          kgUn,

        p_kg_haste:
          kgHaste,

        p_codigo_original:
          codigoOriginal ||
          null,
      },
    );

  if (error) {
    throw new Error(
      error.message ||
        "Erro ao salvar produto.",
    );
  }

  return data;
}

/* =========================================================
   FORNECEDORES
========================================================= */

export async function buscarFornecedoresCadastro() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_fornecedores",
      )
      .select(`
        id,
        nome,
        ativo,
        estoque_minimo_kg,
        estoque_alvo_kg,
        lead_time_dias,
        criado_em,
        atualizado_em
      `)
      .order(
        "nome",
        {
          ascending: true,
        },
      );

  if (error) {
    throw new Error(
      `Erro ao carregar fornecedores: ${error.message}`,
    );
  }

  const fornecedores =
    Array.isArray(data)
      ? data
      : [];

  return fornecedores.map(
    (fornecedor) => ({
      id:
        fornecedor.id,

      nome:
        texto(
          fornecedor.nome,
        ),

      ativo:
        fornecedor.ativo ===
        true,

      estoqueMinimoKg:
        numero(
          fornecedor.estoque_minimo_kg,
        ),

      estoqueAlvoKg:
        numero(
          fornecedor.estoque_alvo_kg,
        ),

      leadTimeDias:
        numero(
          fornecedor.lead_time_dias,
        ),

      criadoEm:
        fornecedor.criado_em ??
        null,

      atualizadoEm:
        fornecedor.atualizado_em ??
        null,
    }),
  );
}

/* =========================================================
   SALVAR FORNECEDOR
========================================================= */

export async function salvarFornecedorCadastro({
  id,
  nome,
  ativo,
  estoqueMinimoKg,
  estoqueAlvoKg,
  leadTimeDias,
}) {
  const payload = {
    nome:
      String(
        nome ?? "",
      ).trim(),

    ativo:
      ativo === true,

    estoque_minimo_kg:
      estoqueMinimoKg,

    estoque_alvo_kg:
      estoqueAlvoKg,

    lead_time_dias:
      leadTimeDias,

    atualizado_em:
      new Date()
        .toISOString(),
  };

  if (id) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "materia_prima_fornecedores",
        )
        .update(
          payload,
        )
        .eq(
          "id",
          id,
        )
        .select(`
          id,
          nome,
          ativo,
          estoque_minimo_kg,
          estoque_alvo_kg,
          lead_time_dias
        `)
        .single();

    if (error) {
      throw new Error(
        error.message ||
          "Erro ao atualizar fornecedor.",
      );
    }

    return {
      acao:
        "atualizado",

      fornecedor:
        data,
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_fornecedores",
      )
      .insert({
        ...payload,

        criado_em:
          new Date()
            .toISOString(),
      })
      .select(`
        id,
        nome,
        ativo,
        estoque_minimo_kg,
        estoque_alvo_kg,
        lead_time_dias
      `)
      .single();

  if (error) {
    throw new Error(
      error.message ||
        "Erro ao cadastrar fornecedor.",
    );
  }

  return {
    acao:
      "criado",

    fornecedor:
      data,
  };
}