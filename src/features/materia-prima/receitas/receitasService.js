import { supabase } from "@/lib/supabaseClient";

import {
  buscarFornecedores,
} from "../fornecedores/fornecedoresService";

import {
  buscarProdutosPP,
} from "../produtos/produtosPPService";


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const TOLERANCIA_PERCENTUAL =
  0.0001;


/* =========================================================
   UTILITÁRIOS
========================================================= */

function compararCodigos(
  codigoA,
  codigoB,
) {
  return String(
    codigoA ?? "",
  ).localeCompare(
    String(
      codigoB ?? "",
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
      ).replace(
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


function arredondarPercentual(
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
      10000,
  ) / 10000;
}


function normalizarItemReceita(
  registro,
) {
  if (!registro) {
    return null;
  }


  const id =
    registro?.id;


  const codigoProduto =
    String(
      registro
        ?.codigo_produto ??
        "",
    ).trim();


  const fornecedorId =
    registro
      ?.fornecedor_id;


  const percentual =
    normalizarNumero(
      registro
        ?.percentual,
    );


  if (
    id === null ||
    id === undefined ||
    !codigoProduto ||
    fornecedorId === null ||
    fornecedorId === undefined ||
    percentual === null
  ) {
    return null;
  }


  return {
    id,

    codigoProduto,

    fornecedorId,

    percentual:
      arredondarPercentual(
        percentual,
      ),

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


function calcularTotal(
  itens,
) {
  return arredondarPercentual(
    (
      Array.isArray(
        itens,
      )
        ? itens
        : []
    ).reduce(
      (
        total,
        item,
      ) =>
        total +
        Number(
          item
            ?.percentual ??
            0,
        ),
      0,
    ),
  );
}


function totalIgualCem(
  total,
) {
  return (
    Math.abs(
      Number(
        total,
      ) -
        100,
    ) <=
    TOLERANCIA_PERCENTUAL
  );
}


/* =========================================================
   BUSCAR ITENS DAS RECEITAS
========================================================= */

async function buscarItensReceitas() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_receitas_itens",
      )
      .select(
        `
          id,
          codigo_produto,
          fornecedor_id,
          percentual,
          ativo,
          criado_em,
          atualizado_em
        `,
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
      (
        registro,
      ) =>
        normalizarItemReceita(
          registro,
        ),
    )
    .filter(
      Boolean,
    );
}


/* =========================================================
   BUSCAR RECEITA DE UM PRODUTO
========================================================= */

export async function buscarReceitaProduto(
  codigoProduto,
) {
  const codigo =
    String(
      codigoProduto ??
        "",
    ).trim();


  if (!codigo) {
    throw new Error(
      "Código do produto não informado.",
    );
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_receitas_itens",
      )
      .select(
        `
          id,
          codigo_produto,
          fornecedor_id,
          percentual,
          ativo,
          criado_em,
          atualizado_em
        `,
      )
      .eq(
        "codigo_produto",
        codigo,
      )
      .eq(
        "ativo",
        true,
      )
      .order(
        "id",
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
      (
        registro,
      ) =>
        normalizarItemReceita(
          registro,
        ),
    )
    .filter(
      Boolean,
    );
}


/* =========================================================
   BUSCAR DADOS COMPLETOS DAS RECEITAS
========================================================= */

export async function buscarReceitas() {
  const [
    produtos,
    fornecedores,
    itensReceitas,
  ] =
    await Promise.all([
      buscarProdutosPP(),

      buscarFornecedores(),

      buscarItensReceitas(),
    ]);


  /* =======================================================
     MAPA DE FORNECEDORES
  ======================================================= */

  const fornecedoresPorId =
    new Map();


  fornecedores.forEach(
    (
      fornecedor,
    ) => {
      fornecedoresPorId.set(
        String(
          fornecedor.id,
        ),
        fornecedor,
      );
    },
  );


  /* =======================================================
     AGRUPAR RECEITAS POR PRODUTO
  ======================================================= */

  const receitasPorProduto =
    new Map();


  itensReceitas
    .filter(
      (
        item,
      ) =>
        item.ativo,
    )
    .forEach(
      (
        item,
      ) => {
        if (
          !receitasPorProduto.has(
            item.codigoProduto,
          )
        ) {
          receitasPorProduto.set(
            item.codigoProduto,
            [],
          );
        }


        const fornecedor =
          fornecedoresPorId.get(
            String(
              item.fornecedorId,
            ),
          );


        receitasPorProduto
          .get(
            item.codigoProduto,
          )
          .push({
            ...item,

            fornecedorNome:
              fornecedor
                ?.nome ??
              "Fornecedor não encontrado",

            fornecedorAtivo:
              fornecedor
                ?.ativo !==
              false,
          });
      },
    );


  /* =======================================================
     PRODUTOS PP ATIVOS
  ======================================================= */

  const produtosPP =
    produtos.filter(
      (
        produto,
      ) =>
        produto
          ?.usaPP ===
          true &&
        produto
          ?.ativo !==
          false,
    );


  /* =======================================================
     MONTAR RECEITAS
  ======================================================= */

  const receitas =
    produtosPP.map(
      (
        produto,
      ) => {
        const codigoProduto =
          String(
            produto
              ?.codigoProduto ??
            produto
              ?.codigo ??
            "",
          ).trim();


        const nomeProduto =
          String(
            produto
              ?.nomeProduto ??
            produto
              ?.descricao ??
            produto
              ?.produto ??
            "",
          ).trim();


        const itens =
          receitasPorProduto.get(
            codigoProduto,
          ) ??
          [];


        const itensOrdenados =
          [...itens].sort(
            (
              itemA,
              itemB,
            ) =>
              String(
                itemA
                  ?.fornecedorNome ??
                  "",
              ).localeCompare(
                String(
                  itemB
                    ?.fornecedorNome ??
                    "",
                ),
                "pt-BR",
                {
                  sensitivity:
                    "base",
                },
              ),
          );


        const percentualTotal =
          calcularTotal(
            itensOrdenados,
          );


        return {
          codigo:
            codigoProduto,

          descricao:
            nomeProduto,

          pesoKg:
            produto
              ?.pesoKg ??
            null,

          itens:
            itensOrdenados,

          quantidadeFornecedores:
            itensOrdenados.length,

          percentualTotal,

          configurada:
            itensOrdenados.length >
              0 &&
            totalIgualCem(
              percentualTotal,
            ),

          possuiItens:
            itensOrdenados.length >
            0,
        };
      },
    );


  receitas.sort(
    (
      receitaA,
      receitaB,
    ) =>
      compararCodigos(
        receitaA.codigo,
        receitaB.codigo,
      ),
  );


  return {
    receitas,

    fornecedores,
  };
}


/* =========================================================
   VALIDAR RECEITA
========================================================= */

function validarReceita({
  codigoProduto,
  itens,
}) {
  const codigo =
    String(
      codigoProduto ??
        "",
    ).trim();


  if (!codigo) {
    throw new Error(
      "Código do produto não informado.",
    );
  }


  if (
    !Array.isArray(
      itens,
    ) ||
    itens.length ===
      0
  ) {
    throw new Error(
      "Adicione pelo menos um fornecedor à receita.",
    );
  }


  const fornecedoresUsados =
    new Set();


  const itensNormalizados =
    itens.map(
      (
        item,
      ) => {
        const fornecedorId =
          item
            ?.fornecedorId;


        if (
          fornecedorId ===
            null ||
          fornecedorId ===
            undefined ||
          fornecedorId ===
            ""
        ) {
          throw new Error(
            "Existe um item da receita sem fornecedor informado.",
          );
        }


        const chaveFornecedor =
          String(
            fornecedorId,
          );


        if (
          fornecedoresUsados.has(
            chaveFornecedor,
          )
        ) {
          throw new Error(
            "O mesmo fornecedor não pode aparecer duas vezes na receita.",
          );
        }


        fornecedoresUsados.add(
          chaveFornecedor,
        );


        const percentual =
          normalizarNumero(
            item
              ?.percentual,
          );


        if (
          percentual ===
            null ||
          percentual <=
            0 ||
          percentual >
            100
        ) {
          throw new Error(
            "Todos os percentuais devem ser maiores que 0 e menores ou iguais a 100.",
          );
        }


        return {
          fornecedorId,

          percentual:
            arredondarPercentual(
              percentual,
            ),
        };
      },
    );


  const total =
    calcularTotal(
      itensNormalizados,
    );


  if (
    !totalIgualCem(
      total,
    )
  ) {
    throw new Error(
      `A soma da receita precisa ser 100%. Total atual: ${total.toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits:
            0,

          maximumFractionDigits:
            4,
        },
      )}%.`,
    );
  }


  return {
    codigo,

    itens:
      itensNormalizados,

    total,
  };
}


/* =========================================================
   RESTAURAR RECEITA ANTERIOR
========================================================= */

async function restaurarReceitaAnterior({
  codigoProduto,
  itensAnteriores,
}) {
  const agora =
    new Date()
      .toISOString();


  const idsAnteriores =
    new Set(
      itensAnteriores.map(
        (
          item,
        ) =>
          String(
            item.id,
          ),
      ),
    );


  /* =======================================================
     BUSCAR ESTADO ATUAL
  ======================================================= */

  const {
    data:
      dadosAtuais,
    error:
      erroLeitura,
  } =
    await supabase
      .from(
        "materia_prima_receitas_itens",
      )
      .select(
        `
          id,
          codigo_produto,
          fornecedor_id,
          percentual,
          ativo,
          criado_em,
          atualizado_em
        `,
      )
      .eq(
        "codigo_produto",
        codigoProduto,
      );


  if (erroLeitura) {
    throw erroLeitura;
  }


  const atuais =
    (
      Array.isArray(
        dadosAtuais,
      )
        ? dadosAtuais
        : []
    )
      .map(
        normalizarItemReceita,
      )
      .filter(
        Boolean,
      );


  /* =======================================================
     RESTAURAR ITENS QUE JÁ EXISTIAM
  ======================================================= */

  for (
    const itemAnterior
    of itensAnteriores
  ) {
    const {
      error,
    } =
      await supabase
        .from(
          "materia_prima_receitas_itens",
        )
        .update({
          percentual:
            itemAnterior
              .percentual,

          ativo:
            itemAnterior
              .ativo,

          atualizado_em:
            itemAnterior
              .atualizadoEm ??
            agora,
        })
        .eq(
          "id",
          itemAnterior.id,
        );


    if (error) {
      throw error;
    }
  }


  /* =======================================================
     DESATIVAR ITENS NOVOS DA TENTATIVA
  ======================================================= */

  const itensNovos =
    atuais.filter(
      (
        item,
      ) =>
        !idsAnteriores.has(
          String(
            item.id,
          ),
        ),
    );


  if (
    itensNovos.length >
    0
  ) {
    const idsNovos =
      itensNovos.map(
        (
          item,
        ) =>
          item.id,
      );


    const {
      error,
    } =
      await supabase
        .from(
          "materia_prima_receitas_itens",
        )
        .update({
          ativo:
            false,

          atualizado_em:
            agora,
        })
        .in(
          "id",
          idsNovos,
        );


    if (error) {
      throw error;
    }
  }
}


/* =========================================================
   SALVAR RECEITA
========================================================= */

export async function salvarReceita({
  codigoProduto,
  itens,
}) {
  const receitaValidada =
    validarReceita({
      codigoProduto,
      itens,
    });


  const {
    codigo,
    itens:
      itensNormalizados,
  } =
    receitaValidada;


  /* =======================================================
     GUARDAR ESTADO ANTERIOR PARA ROLLBACK
  ======================================================= */

  const {
    data:
      dadosAnteriores,
    error:
      erroEstadoAnterior,
  } =
    await supabase
      .from(
        "materia_prima_receitas_itens",
      )
      .select(
        `
          id,
          codigo_produto,
          fornecedor_id,
          percentual,
          ativo,
          criado_em,
          atualizado_em
        `,
      )
      .eq(
        "codigo_produto",
        codigo,
      );


  if (
    erroEstadoAnterior
  ) {
    throw erroEstadoAnterior;
  }


  const itensAnteriores =
    (
      Array.isArray(
        dadosAnteriores,
      )
        ? dadosAnteriores
        : []
    )
      .map(
        normalizarItemReceita,
      )
      .filter(
        Boolean,
      );


  const agora =
    new Date()
      .toISOString();


  try {
    /* =====================================================
       ATIVAR / INSERIR ITENS DA NOVA RECEITA
    ===================================================== */

    const registros =
      itensNormalizados.map(
        (
          item,
        ) => ({
          codigo_produto:
            codigo,

          fornecedor_id:
            item
              .fornecedorId,

          percentual:
            item
              .percentual,

          ativo:
            true,

          atualizado_em:
            agora,
        }),
      );


    const {
      error:
        erroUpsert,
    } =
      await supabase
        .from(
          "materia_prima_receitas_itens",
        )
        .upsert(
          registros,
          {
            onConflict:
              "codigo_produto,fornecedor_id",
          },
        );


    if (
      erroUpsert
    ) {
      throw erroUpsert;
    }


    /* =====================================================
       DESATIVAR FORNECEDORES RETIRADOS DA RECEITA
    ===================================================== */

    const fornecedoresAtuais =
      new Set(
        itensNormalizados.map(
          (
            item,
          ) =>
            String(
              item
                .fornecedorId,
            ),
        ),
      );


    const itensParaDesativar =
      itensAnteriores.filter(
        (
          item,
        ) =>
          item.ativo &&
          !fornecedoresAtuais.has(
            String(
              item
                .fornecedorId,
            ),
          ),
      );


    if (
      itensParaDesativar.length >
      0
    ) {
      const ids =
        itensParaDesativar.map(
          (
            item,
          ) =>
            item.id,
        );


      const {
        error:
          erroDesativacao,
      } =
        await supabase
          .from(
            "materia_prima_receitas_itens",
          )
          .update({
            ativo:
              false,

            atualizado_em:
              agora,
          })
          .in(
            "id",
            ids,
          );


      if (
        erroDesativacao
      ) {
        throw erroDesativacao;
      }
    }


    /* =====================================================
       CONFIRMAR RECEITA GRAVADA
    ===================================================== */

    const receitaSalva =
      await buscarReceitaProduto(
        codigo,
      );


    const totalSalvo =
      calcularTotal(
        receitaSalva,
      );


    if (
      !totalIgualCem(
        totalSalvo,
      )
    ) {
      throw new Error(
        "A receita foi gravada, mas a confirmação não totalizou 100%.",
      );
    }


    return {
      codigoProduto:
        codigo,

      itens:
        receitaSalva,

      percentualTotal:
        totalSalvo,
    };
  } catch (error) {
    /* =====================================================
       TENTATIVA DE ROLLBACK
    ===================================================== */

    try {
      await restaurarReceitaAnterior({
        codigoProduto:
          codigo,

        itensAnteriores,
      });
    } catch (
      rollbackError
    ) {
      console.error(
        "Erro ao restaurar receita anterior:",
        rollbackError,
      );


      throw new Error(
        "Ocorreu um erro ao salvar a receita e também não foi possível restaurar automaticamente o estado anterior. A operação precisa ser conferida no banco.",
      );
    }


    throw error;
  }
}


/* =========================================================
   EXCLUIR RECEITA

   Exclusão lógica:
   - desativa todos os itens ativos da receita;
   - mantém o Produto PP;
   - o produto volta para "A configurar".
========================================================= */

export async function excluirReceita(
  codigoProduto,
) {
  const codigo =
    String(
      codigoProduto ??
        "",
    ).trim();


  if (!codigo) {
    throw new Error(
      "Código do produto não informado.",
    );
  }


  const agora =
    new Date()
      .toISOString();


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_receitas_itens",
      )
      .update({
        ativo:
          false,

        atualizado_em:
          agora,
      })
      .eq(
        "codigo_produto",
        codigo,
      )
      .eq(
        "ativo",
        true,
      )
      .select(
        "id",
      );


  if (error) {
    throw error;
  }


  const itensExcluidos =
    Array.isArray(
      data,
    )
      ? data.length
      : 0;


  if (
    itensExcluidos ===
    0
  ) {
    throw new Error(
      "Esta receita não possui itens ativos para excluir.",
    );
  }


  return {
    codigoProduto:
      codigo,

    itensExcluidos,

    excluida:
      true,
  };
}


/* =========================================================
   EXPORTAÇÕES AUXILIARES
========================================================= */

export {
  calcularTotal,
  totalIgualCem,
};