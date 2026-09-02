import { supabase } from "@/lib/supabaseClient";

import {
  buscarFornecedores,
} from "../fornecedores/fornecedoresService";


/* =========================================================
   BUSCAR ENTRADAS
========================================================= */

export async function buscarEntradas() {
  const [
    fornecedores,
    resultado,
  ] =
    await Promise.all([
      buscarFornecedores(),

      supabase
        .from(
          "materia_prima_compras_futuras",
        )
        .select(
          `
            id,
            data_compra,
            data_prevista,
            data_recebimento,
            fornecedor_id,
            quantidade_kg,
            numero_pedido,
            status,
            observacao,
            ativo,
            criado_em,
            atualizado_em
          `,
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
        ),
    ]);


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

          quantidadeKg:
            Number(
              registro
                .quantidade_kg,
            ),

          documento:
            registro
              .numero_pedido ??
            "",

          observacao:
            registro
              .observacao ??
            "",

          ativo:
            registro
              .ativo !==
            false,
        };
      },
    );


  return {
    entradas,

    fornecedores,
  };
}