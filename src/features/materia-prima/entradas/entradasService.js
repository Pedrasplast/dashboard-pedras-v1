import { supabase } from "@/lib/supabaseClient";

import {
  buscarFornecedores,
} from "../fornecedores/fornecedoresService";


/* =========================================================
   CAMPOS
========================================================= */

const CAMPOS_ENTRADA = `
  id,
  data_compra,
  data_prevista,
  data_recebimento,
  fornecedor_id,
  material_id,
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


/* =========================================================
   UTILITÁRIOS
========================================================= */

function numeroOuNull(
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
      valor,
    );


  return Number.isFinite(
    numero,
  )
    ? numero
    : null;
}


/* =========================================================
   BUSCAR ENTRADAS
========================================================= */

export async function buscarEntradas() {
  const [
    fornecedores,
    resultadoMateriais,
    resultado,
  ] =
    await Promise.all([
      buscarFornecedores(),

      supabase
        .from(
          "materia_prima_materiais",
        )
        .select(`
          id,
          nome,
          ativo
        `),

      supabase
        .from(
          "materia_prima_compras_futuras",
        )
        .select(
          CAMPOS_ENTRADA,
        )
        .eq(
          "status",
          "RECEBIDA",
        )
        .order(
          "data_recebimento",
          {
            ascending: false,
          },
        )
        .order(
          "id",
          {
            ascending: false,
          },
        ),
    ]);


  if (resultadoMateriais.error) {
    throw resultadoMateriais.error;
  }


  if (resultado.error) {
    throw resultado.error;
  }


  const fornecedoresPorId =
    new Map();


  fornecedores.forEach(
    (
      fornecedor,
    ) =>
      fornecedoresPorId.set(
        String(
          fornecedor.id,
        ),
        fornecedor,
      ),
  );


  const materiaisPorId =
    new Map();


  (
    Array.isArray(
      resultadoMateriais.data,
    )
      ? resultadoMateriais.data
      : []
  ).forEach(
    (
      material,
    ) =>
      materiaisPorId.set(
        String(
          material.id,
        ),
        material,
      ),
  );


  const entradas =
    (
      Array.isArray(
        resultado.data,
      )
        ? resultado.data
        : []
    ).map(
      (
        registro,
      ) => {
        const fornecedor =
          fornecedoresPorId.get(
            String(
              registro
                .fornecedor_id,
            ),
          );


        const material =
          materiaisPorId.get(
            String(
              registro
                .material_id,
            ),
          );


        return {
          id:
            registro.id,

          data:
            registro
              .data_recebimento,

          dataCompra:
            registro
              .data_compra,

          dataPrevista:
            registro
              .data_prevista,

          fornecedorId:
            registro
              .fornecedor_id,

          fornecedorNome:
            fornecedor
              ?.nome ??
            "Fornecedor não encontrado",

          fornecedorAtivo:
            fornecedor
              ?.ativo !==
            false,

          materialId:
            registro
              .material_id,

          materialNome:
            material
              ?.nome ??
            "Material não encontrado",

          materialAtivo:
            material
              ?.ativo !==
            false,

          quantidadeKg:
            Number(
              registro
                .quantidade_kg,
            ),

          numeroPedido:
            registro
              .numero_pedido ??
            "",

          documento:
            registro
              .numero_pedido ??
            "",

          status:
            registro
              .status ??
            "RECEBIDA",

          observacao:
            registro
              .observacao ??
            "",

          ativo:
            registro
              .ativo !==
            false,

          criadoEm:
            registro
              .criado_em ??
            null,

          atualizadoEm:
            registro
              .atualizado_em ??
            null,

          precoUnitario:
            numeroOuNull(
              registro
                .preco_unitario,
            ),

          subtotalProdutos:
            numeroOuNull(
              registro
                .subtotal_produtos,
            ),

          ipiPercentual:
            numeroOuNull(
              registro
                .ipi_percentual,
            ),

          valorIpi:
            numeroOuNull(
              registro
                .valor_ipi,
            ),

          valorFrete:
            numeroOuNull(
              registro
                .valor_frete,
            ),

          tipoFrete:
            registro
              .tipo_frete ??
            "",

          valorDesconto:
            numeroOuNull(
              registro
                .valor_desconto,
            ),

          outrasDespesas:
            numeroOuNull(
              registro
                .outras_despesas,
            ),

          valorTotal:
            numeroOuNull(
              registro
                .valor_total,
            ),

          custoEfetivoKg:
            numeroOuNull(
              registro
                .custo_efetivo_kg,
            ),

          numeroNf:
            registro
              .numero_nf ??
            "",

          condicaoPagamento:
            registro
              .condicao_pagamento ??
            "",

          observacaoFinanceira:
            registro
              .observacao_financeira ??
            "",
        };
      },
    );


  return {
    entradas,

    fornecedores,
  };
}
