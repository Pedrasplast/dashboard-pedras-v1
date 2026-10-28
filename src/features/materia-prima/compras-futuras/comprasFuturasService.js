import { supabase } from "@/lib/supabaseClient";

import { buscarFornecedores } from "../fornecedores/fornecedoresService";
import {
  montarDadosCompraFutura,
  normalizarCompra,
  validarCompraParaChegada,
  validarDataChegada,
  validarIdentificacaoCompra,
} from "./comprasFuturas.regras";

const CAMPOS_COMPRA_FUTURA = `

  id,

  data_compra,

  data_prevista,

  data_recebimento,

  fornecedor_id,

  material_id,

  tipo_material,

  tipo_classificacao,

  quantidade_kg,

  numero_pedido,

  status,

  observacao,

  ativo,

  criado_em,

  atualizado_em,

  preco_unitario,

  subtotal_produtos,

  ipi_percentual,

  valor_ipi,

  valor_frete,

  tipo_frete,

  valor_desconto,

  outras_despesas,

  valor_total,

  custo_efetivo_kg,

  numero_nf,

  condicao_pagamento,

  observacao_financeira

`;

async function buscarMateriaisCompra() {
  const {
    data,

    error,
  } = await supabase

    .from("materia_prima_materiais")

    .select(
      `

        id,

        nome,

        ativo

      `,
    )

    .order(
      "nome",

      {
        ascending: true,
      },
    );

  if (error) {
    throw error;
  }

  return (Array.isArray(data) ? data : []).map((material) => ({
    id: material.id,

    nome: String(material.nome ?? "").trim(),

    ativo: material.ativo !== false,
  }));
}

async function buscarFornecedorMateriaisCompra() {
  const {
    data,

    error,
  } = await supabase

    .from("materia_prima_fornecedor_materiais")

    .select(
      `

        id,

        fornecedor_id,

        material_id,

        padrao,

        ativo

      `,
    )

    .eq(
      "ativo",

      true,
    )

    .order(
      "fornecedor_id",

      {
        ascending: true,
      },
    );

  if (error) {
    throw error;
  }

  return (Array.isArray(data) ? data : []).map((vinculo) => ({
    id: vinculo.id,

    fornecedorId: vinculo.fornecedor_id,

    materialId: vinculo.material_id,

    padrao: vinculo.padrao === true,

    ativo: vinculo.ativo !== false,
  }));
}

export async function buscarComprasFuturas() {
  const [fornecedores, materiais, fornecedorMateriais, resultadoCompras] = await Promise.all([
    buscarFornecedores(),

    buscarMateriaisCompra(),

    buscarFornecedorMateriaisCompra(),

    supabase

      .from("materia_prima_compras_futuras")

      .select(CAMPOS_COMPRA_FUTURA)

      .eq(
        "ativo",

        true,
      )

      .order(
        "data_prevista",

        {
          ascending: true,
        },
      )

      .order(
        "id",

        {
          ascending: false,
        },
      ),
  ]);

  if (resultadoCompras.error) {
    throw resultadoCompras.error;
  }

  const fornecedoresPorId = new Map(
    fornecedores.map((fornecedor) => [String(fornecedor.id), fornecedor]),
  );

  const materiaisPorId = new Map(materiais.map((material) => [String(material.id), material]));

  const compras = (Array.isArray(resultadoCompras.data) ? resultadoCompras.data : [])

    .map(normalizarCompra)

    .filter(Boolean)

    .map((compra) => {
      const fornecedor = fornecedoresPorId.get(String(compra.fornecedorId));

      const material = materiaisPorId.get(String(compra.materialId));

      return {
        ...compra,

        fornecedorNome: fornecedor?.nome ?? "Fornecedor não encontrado",

        fornecedorAtivo: fornecedor?.ativo !== false,

        materialNome: material?.nome ?? compra.tipoMaterial ?? "Material não encontrado",

        materialAtivo: material?.ativo !== false,
      };
    });

  return {
    compras,

    fornecedores,

    materiais,

    fornecedorMateriais,
  };
}

export async function salvarCompraFutura({
  id = null,

  dataCompra,

  dataPrevista,

  dataRecebimento = null,

  fornecedorId,

  materialId,

  quantidadeKg,

  numeroPedido = "",

  tipoClassificacao = "",

  status = "CONFIRMADA",

  observacao = "",

  ativo = true,

  precoUnitario = null,

  ipiPercentual = null,

  valorFrete = null,

  tipoFrete = "",

  valorDesconto = null,

  outrasDespesas = null,

  numeroNf = "",

  condicaoPagamento = "",

  observacaoFinanceira = "",
}) {
  const { dataCompraFinal, dataPrevistaFinal, materialIdFinal } = validarIdentificacaoCompra({
    dataCompra,
    dataPrevista,
    fornecedorId,
    materialId,
  });

  const [materialResultado, vinculoResultado] = await Promise.all([
    supabase

      .from("materia_prima_materiais")

      .select("id, ativo")

      .eq(
        "id",

        materialIdFinal,
      )

      .eq(
        "ativo",

        true,
      )

      .maybeSingle(),

    supabase

      .from("materia_prima_fornecedor_materiais")

      .select("id")

      .eq(
        "fornecedor_id",

        fornecedorId,
      )

      .eq(
        "material_id",

        materialIdFinal,
      )

      .eq(
        "ativo",

        true,
      )

      .maybeSingle(),
  ]);

  if (materialResultado.error) {
    throw materialResultado.error;
  }

  if (vinculoResultado.error) {
    throw vinculoResultado.error;
  }

  if (!materialResultado.data) {
    throw new Error("O material selecionado está inativo ou não existe.");
  }

  if (!vinculoResultado.data) {
    throw new Error("O material selecionado não está vinculado a este fornecedor.");
  }

  const dadosSalvar = montarDadosCompraFutura({
    dataCompraFinal,
    dataPrevistaFinal,
    materialIdFinal,
    dataRecebimento,
    fornecedorId,
    quantidadeKg,
    numeroPedido,
    tipoClassificacao,
    status,
    observacao,
    ativo,
    precoUnitario,
    ipiPercentual,
    valorFrete,
    tipoFrete,
    valorDesconto,
    outrasDespesas,
    numeroNf,
    condicaoPagamento,
    observacaoFinanceira,
  });

  const consulta = supabase.from("materia_prima_compras_futuras");

  const {
    data,

    error,
  } =
    id !== null && id !== undefined
      ? await consulta

          .update(dadosSalvar)

          .eq(
            "id",

            id,
          )

          .select(CAMPOS_COMPRA_FUTURA)

          .single()
      : await consulta

          .insert(dadosSalvar)

          .select(CAMPOS_COMPRA_FUTURA)

          .single();

  if (error) {
    throw error;
  }

  return normalizarCompra(data);
}

export async function confirmarChegadaCompraFutura(
  id,

  dataRecebimento,
) {
  const dataRecebimentoFinal = validarDataChegada(id, dataRecebimento);

  const {
    data: compraAtual,

    error: erroBusca,
  } = await supabase

    .from("materia_prima_compras_futuras")

    .select("id, data_compra, status, ativo")

    .eq(
      "id",

      id,
    )

    .eq(
      "ativo",

      true,
    )

    .maybeSingle();

  if (erroBusca) {
    throw erroBusca;
  }

  const statusAtual = validarCompraParaChegada(compraAtual, dataRecebimentoFinal);

  const {
    data,

    error,
  } = await supabase

    .from("materia_prima_compras_futuras")

    .update({
      status: "RECEBIDA",

      data_recebimento: dataRecebimentoFinal,

      atualizado_em: new Date().toISOString(),
    })

    .eq(
      "id",

      id,
    )

    .eq(
      "ativo",

      true,
    )

    .eq(
      "status",

      statusAtual,
    )

    .select(CAMPOS_COMPRA_FUTURA);

  if (error) {
    throw error;
  }

  if (!Array.isArray(data) || data.length !== 1) {
    throw new Error("A compra foi alterada por outro processo. Atualize a tela e tente novamente.");
  }

  return normalizarCompra(data[0]);
}

export async function excluirCompraFutura(id) {
  if (id === null || id === undefined) {
    throw new Error("Compra futura não informada.");
  }

  const {
    data,

    error,
  } = await supabase

    .from("materia_prima_compras_futuras")

    .update({
      ativo: false,

      atualizado_em: new Date().toISOString(),
    })

    .eq(
      "id",

      id,
    )

    .eq(
      "ativo",

      true,
    )

    .select("id");

  if (error) {
    throw error;
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("A compra futura não foi encontrada ou já foi excluída.");
  }

  return {
    id,

    excluida: true,
  };
}
