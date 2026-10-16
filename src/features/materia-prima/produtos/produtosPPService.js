import { supabase } from "@/lib/supabaseClient";

/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarNumero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const texto = String(valor).trim();

  const normalizado = texto.includes(",")
    ? texto
        .replace(/\./g, "")
        .replace(",", ".")
    : texto;

  const numero = Number(normalizado);

  return Number.isFinite(numero)
    ? numero
    : null;
}

function normalizarInteiro(valor) {
  const numero = normalizarNumero(valor);

  if (numero === null) {
    return null;
  }

  const inteiro = Math.trunc(numero);

  return Number.isFinite(inteiro)
    ? inteiro
    : null;
}

function texto(valor) {
  return String(valor ?? "").trim();
}

/* =========================================================
   NORMALIZAR PRODUTO
========================================================= */

function normalizarProduto(registro) {
  if (!registro) {
    return null;
  }

  const codigoProduto = texto(
    registro?.codigo_produto ??
      registro?.codigoProduto ??
      registro?.codigo ??
      registro?.cod_prod,
  );

  const nomeProduto = texto(
    registro?.nome_produto ??
      registro?.nomeProduto ??
      registro?.produto ??
      registro?.descricao,
  );

  if (!codigoProduto || !nomeProduto) {
    return null;
  }

  const materialId =
    normalizarInteiro(
      registro?.material_id ??
        registro?.materialId,
    );

  const materialNome = texto(
    registro?.material_nome ??
      registro?.materialNome,
  );

  const materialAtivo =
    registro?.material_ativo === true ||
    registro?.materialAtivo === true;

  const pesoKg = normalizarNumero(
    registro?.kg_un ??
      registro?.pesoKg,
  );

  const cicloSegundos = normalizarNumero(
    registro?.ciclo_segundos ??
      registro?.cicloSegundos,
  );

  const cavidadeMolde = normalizarInteiro(
    registro?.cavidade_molde ??
      registro?.cavidadeMolde,
  );

  const ativo =
    registro?.ativo !== false;

  return {
    codigoProduto,
    nomeProduto,

    materialId,
    materialNome,
    materialAtivo,

    pesoKg,
    cicloSegundos,
    cavidadeMolde,

    ativo,

    codigo: codigoProduto,
    produto: nomeProduto,
    descricao: nomeProduto,

    codigo_produto: codigoProduto,
    nome_produto: nomeProduto,

    material_id: materialId,
    material_nome: materialNome,

    peso_kg: pesoKg,
    kg_un: pesoKg,

    ciclo_segundos: cicloSegundos,
    cavidade_molde: cavidadeMolde,

    configuracao: {
      codigoProduto,
      codigo_produto: codigoProduto,

      materialId,
      material_id: materialId,

      materialNome,
      material_nome: materialNome,

      pesoKg,
      peso_kg: pesoKg,
      kg_un: pesoKg,

      cicloSegundos,
      ciclo_segundos: cicloSegundos,

      cavidadeMolde,
      cavidade_molde: cavidadeMolde,

      ativo,
    },

    criadoEm:
      registro?.criado_em ??
      registro?.criadoEm ??
      null,

    atualizadoEm:
      registro?.atualizado_em ??
      registro?.atualizadoEm ??
      registro?.updated_at ??
      null,

    criado_em:
      registro?.criado_em ??
      registro?.criadoEm ??
      null,

    atualizado_em:
      registro?.atualizado_em ??
      registro?.atualizadoEm ??
      registro?.updated_at ??
      null,
  };
}

/* =========================================================
   MATERIAIS
========================================================= */

export async function buscarMateriaisProdutos() {
  const { data, error } = await supabase
    .from("materia_prima_materiais")
    .select(`
      id,
      nome,
      ativo,
      criado_em,
      atualizado_em
    `)
    .order("nome", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (Array.isArray(data) ? data : [])
    .map((material) => ({
      id: material.id,
      nome: texto(material.nome),
      ativo: material.ativo === true,
      criadoEm:
        material.criado_em ?? null,
      atualizadoEm:
        material.atualizado_em ?? null,
    }))
    .filter(
      (material) =>
        material.id !== null &&
        material.id !== undefined &&
        material.nome,
    );
}

/* =========================================================
   BUSCAR PRODUTOS POR MATERIAL

   O nome buscarProdutosPP é mantido temporariamente
   somente para não quebrar imports existentes.
========================================================= */

export async function buscarProdutosPP() {
  const [
    produtosResultado,
    parametrosResultado,
  ] = await Promise.all([
    supabase
      .from(
        "materia_prima_produtos_cadastro_v2",
      )
      .select(`
        codigo_produto,
        nome_produto,
        material_id,
        material_nome,
        material_ativo,
        peso_kg,
        ativo,
        criado_em,
        atualizado_em
      `)
      .not(
        "material_id",
        "is",
        null,
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
      .select(`
        cod_prod,
        kg_un,
        ciclo_segundos,
        cavidade_molde,
        tempo_injecao_segundos,
        tempo_resfriamento_segundos,
        kg_haste,
        ativo,
        created_at,
        updated_at
      `),
  ]);

  if (
    produtosResultado.error
  ) {
    throw produtosResultado.error;
  }

  if (
    parametrosResultado.error
  ) {
    throw parametrosResultado.error;
  }

  const mapaParametros =
    new Map(
      (
        Array.isArray(
          parametrosResultado.data,
        )
          ? parametrosResultado.data
          : []
      ).map((parametro) => [
        texto(
          parametro?.cod_prod,
        ),
        parametro,
      ]),
    );

  return (
    Array.isArray(
      produtosResultado.data,
    )
      ? produtosResultado.data
      : []
  )
    .map((produto) => {
      const codigo =
        texto(
          produto?.codigo_produto,
        );

      const parametros =
        mapaParametros.get(
          codigo,
        ) ?? {};

      return normalizarProduto({
        ...produto,

        kg_un:
          parametros?.kg_un ??
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
    })
    .filter(Boolean);
}

/* =========================================================
   ADAPTADOR PARA RECEITAS / PROGRAMAÇÃO

   Mantém os aliases esperados pelos módulos atuais,
   sem depender de campos legados específicos de material.
========================================================= */

export async function buscarProdutosPedidos() {
  const produtos =
    await buscarProdutosPP();

  return produtos.map(
    (produto) => ({
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

      materialId:
        produto.materialId,

      material_id:
        produto.materialId,

      materialNome:
        produto.materialNome,

      material_nome:
        produto.materialNome,

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

        materialId:
          produto.materialId,

        material_id:
          produto.materialId,

        materialNome:
          produto.materialNome,

        material_nome:
          produto.materialNome,

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
   BUSCAR DADOS TÉCNICOS ATUAIS

   Necessário para preservar campos que esta tela não edita.
========================================================= */

async function buscarDadosAtuaisProduto(
  codigoProduto,
) {
  if (!codigoProduto) {
    return {
      produto: null,
      parametros: null,
    };
  }

  const [
    produtoResultado,
    parametrosResultado,
  ] = await Promise.all([
    supabase
      .from(
        "materia_prima_produtos",
      )
      .select(`
        codigo_produto,
        peso_kg,
        material_id,
        ativo
      `)
      .eq(
        "codigo_produto",
        codigoProduto,
      )
      .maybeSingle(),

    supabase
      .from(
        "parametros_produto",
      )
      .select(`
        cod_prod,
        tempo_injecao_segundos,
        tempo_resfriamento_segundos,
        kg_haste
      `)
      .eq(
        "cod_prod",
        codigoProduto,
      )
      .maybeSingle(),
  ]);

  if (
    produtoResultado.error
  ) {
    throw produtoResultado.error;
  }

  if (
    parametrosResultado.error
  ) {
    throw parametrosResultado.error;
  }

  return {
    produto:
      produtoResultado.data ??
      null,

    parametros:
      parametrosResultado.data ??
      null,
  };
}

/* =========================================================
   SALVAR PRODUTO POR MATERIAL

   Usa a RPC central v3, sem depender de campos legados.
========================================================= */

export async function salvarProdutoPP({
  codigoProdutoOriginal = null,
  codigoProduto,
  nomeProduto,
  materialId,
  pesoKg,
  cicloSegundos,
  cavidadeMolde,
  ativo = true,
}) {
  const codigoFinal =
    texto(
      codigoProduto,
    );

  const nomeFinal =
    texto(
      nomeProduto,
    );

  const materialFinal =
    normalizarInteiro(
      materialId,
    );

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
    materialFinal === null ||
    materialFinal <= 0
  ) {
    throw new Error(
      "Selecione o material do produto.",
    );
  }

  if (
    pesoFinal === null ||
    pesoFinal <= 0
  ) {
    throw new Error(
      "Informe um peso por peça maior que zero.",
    );
  }

  if (
    cicloFinal === null ||
    cicloFinal <= 0
  ) {
    throw new Error(
      "Informe um ciclo maior que zero.",
    );
  }

  if (
    cavidadeFinal === null ||
    cavidadeFinal <= 0
  ) {
    throw new Error(
      "Informe uma quantidade de cavidades maior que zero.",
    );
  }

  const codigoOriginalFinal =
    codigoProdutoOriginal === null ||
    codigoProdutoOriginal === undefined ||
    !texto(
      codigoProdutoOriginal,
    )
      ? null
      : texto(
          codigoProdutoOriginal,
        );

  const dadosAtuais =
    await buscarDadosAtuaisProduto(
      codigoOriginalFinal,
    );

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "salvar_cadastro_produto_v3",
      {
        p_codigo_produto:
          codigoFinal,

        p_nome_produto:
          nomeFinal,

        /*
         * Campo separado de kg_un.
         * Em edição preservamos o valor atual.
         */
        p_peso_kg:
          dadosAtuais
            .produto
            ?.peso_kg ??
          null,

        p_ativo:
          Boolean(
            ativo,
          ),

        p_cavidade_molde:
          cavidadeFinal,

        p_ciclo_segundos:
          cicloFinal,

        /*
         * Estes campos não são editados
         * nesta tela.
         *
         * Portanto nunca devem ser apagados
         * ao salvar.
         */
        p_tempo_injecao_segundos:
          dadosAtuais
            .parametros
            ?.tempo_injecao_segundos ??
          null,

        p_tempo_resfriamento_segundos:
          dadosAtuais
            .parametros
            ?.tempo_resfriamento_segundos ??
          null,

        p_kg_un:
          pesoFinal,

        p_kg_haste:
          dadosAtuais
            .parametros
            ?.kg_haste ??
          null,

        p_codigo_original:
          codigoOriginalFinal,

        p_material_id:
          materialFinal,
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

    throw new Error(
      error.message ||
        "Não foi possível salvar o produto.",
    );
  }

  return data;
}

/* =========================================================
   EXCLUIR PRODUTO

   O nome da função exportada é mantido temporariamente
   para não quebrar imports existentes.
   A exclusão no banco já é genérica.
========================================================= */

export async function excluirProdutoPP(
  codigoProduto,
) {
  const codigo =
    texto(
      codigoProduto,
    );

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
      "excluir_produto_v2",
      {
        p_codigo_produto:
          codigo,
      },
    );

  if (error) {
    throw new Error(
      error.message ||
        "Não foi possível excluir o produto.",
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
  materialId = null,
  pesoKg,
  cicloSegundos,
  cavidadeMolde,
  ativo = true,
}) {
  return salvarProdutoPP({
    codigoProdutoOriginal:
      codigoProduto,

    codigoProduto,

    nomeProduto:
      nomeProduto ||
      produto ||
      codigoProduto,

    materialId,

    pesoKg,
    cicloSegundos,
    cavidadeMolde,
    ativo,
  });
}