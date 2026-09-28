import { supabase } from "@/lib/supabaseClient";

import {
  buscarFornecedores,
} from "../../fornecedores/fornecedoresService";


/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarQuantidade(
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


  const textoNormalizado =
    texto.includes(",")
      ? texto
          .replace(/\./g, "")
          .replace(",", ".")
      : texto;


  const numero =
    Number(
      textoNormalizado,
    );


  return Number.isFinite(numero)
    ? numero
    : null;
}


function normalizarMaterial(
  registro,
) {
  if (!registro) {
    return null;
  }


  return {
    id:
      registro.id,

    nome:
      String(
        registro.nome ??
          "",
      ).trim(),

    ativo:
      registro.ativo !==
      false,
  };
}


function normalizarSaldo(
  registro,
) {
  if (!registro) {
    return null;
  }


  const id =
    registro?.id;

  const fornecedorId =
    registro?.fornecedor_id;

  const materialId =
    registro?.material_id;

  const dataBase =
    String(
      registro?.data_base ??
        "",
    ).trim();

  const quantidadeKg =
    Number(
      registro?.quantidade_kg,
    );


  if (
    id === null ||
    id === undefined ||
    fornecedorId === null ||
    fornecedorId === undefined ||
    materialId === null ||
    materialId === undefined ||
    !dataBase ||
    !Number.isFinite(
      quantidadeKg,
    )
  ) {
    return null;
  }


  return {
    id,

    fornecedorId,

    materialId,

    dataBase,

    quantidadeKg,

    observacao:
      registro?.observacao ??
      "",

    ativo:
      registro?.ativo !==
      false,

    criadoEm:
      registro?.criado_em ??
      null,

    atualizadoEm:
      registro?.atualizado_em ??
      null,
  };
}


async function buscarMateriais() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_materiais",
      )
      .select(`
        id,
        nome,
        ativo
      `)
      .order(
        "nome",
        {
          ascending: true,
        },
      );


  if (error) {
    throw error;
  }


  return (
    Array.isArray(data)
      ? data
      : []
  )
    .map(
      normalizarMaterial,
    )
    .filter(Boolean);
}


/* =========================================================
   ÚLTIMO SALDO POR MATERIAL + FORNECEDOR
========================================================= */

export function obterUltimosSaldosPorFornecedor(
  saldos = [],
  dataReferencia = null,
) {
  const mapa =
    new Map();


  saldos
    .filter(
      (
        saldo,
      ) =>
        saldo?.ativo ===
          true &&
        (
          !dataReferencia ||
          saldo.dataBase <=
            dataReferencia
        ),
    )
    .forEach(
      (
        saldo,
      ) => {
        const chave =
          `${saldo.materialId}|${saldo.fornecedorId}`;

        const atual =
          mapa.get(
            chave,
          );


        if (
          !atual ||
          saldo.dataBase >
            atual.dataBase ||
          (
            saldo.dataBase ===
              atual.dataBase &&
            Number(
              saldo.id,
            ) >
              Number(
                atual.id,
              )
          )
        ) {
          mapa.set(
            chave,
            saldo,
          );
        }
      },
    );


  return Array.from(
    mapa.values(),
  );
}


/* =========================================================
   BUSCAR SALDOS
========================================================= */

export async function buscarSaldosIniciais({
  materialId = null,
} = {}) {
  const materialIdFinal =
    materialId === null ||
    materialId === undefined ||
    materialId === ""
      ? null
      : Number(
          materialId,
        );


  if (
    materialIdFinal !== null &&
    !Number.isFinite(
      materialIdFinal,
    )
  ) {
    throw new Error(
      "Material inválido.",
    );
  }


  let consultaSaldos =
    supabase
      .from(
        "materia_prima_saldo_inicial",
      )
      .select(`
        id,
        fornecedor_id,
        material_id,
        data_base,
        quantidade_kg,
        observacao,
        ativo,
        criado_em,
        atualizado_em
      `);


  if (
    materialIdFinal !== null
  ) {
    consultaSaldos =
      consultaSaldos.eq(
        "material_id",
        materialIdFinal,
      );
  }


  consultaSaldos =
    consultaSaldos
      .order(
        "data_base",
        {
          ascending: false,
        },
      )
      .order(
        "id",
        {
          ascending: false,
        },
      );


  const [
    fornecedores,
    materiais,
    resultadoSaldos,
  ] =
    await Promise.all([
      buscarFornecedores(),
      buscarMateriais(),
      consultaSaldos,
    ]);


  if (
    resultadoSaldos.error
  ) {
    throw resultadoSaldos.error;
  }


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


  const materiaisPorId =
    new Map();


  materiais.forEach(
    (
      material,
    ) => {
      materiaisPorId.set(
        String(
          material.id,
        ),
        material,
      );
    },
  );


  const saldos =
    (
      Array.isArray(
        resultadoSaldos.data,
      )
        ? resultadoSaldos.data
        : []
    )
      .map(
        (
          registro,
        ) => {
          const saldo =
            normalizarSaldo(
              registro,
            );


          if (!saldo) {
            return null;
          }


          const fornecedor =
            fornecedoresPorId.get(
              String(
                saldo.fornecedorId,
              ),
            );

          const material =
            materiaisPorId.get(
              String(
                saldo.materialId,
              ),
            );


          return {
            ...saldo,

            fornecedorNome:
              fornecedor?.nome ??
              "Fornecedor não encontrado",

            fornecedorAtivo:
              fornecedor?.ativo !==
              false,

            materialNome:
              material?.nome ??
              "Material não encontrado",

            materialAtivo:
              material?.ativo !==
              false,
          };
        },
      )
      .filter(Boolean);


  return {
    saldos,

    fornecedores,

    materiais,
  };
}


/* =========================================================
   SALVAR SALDO
========================================================= */

export async function salvarSaldoInicial({
  id = null,
  fornecedorId,
  materialId,
  dataBase,
  quantidadeKg,
  observacao = "",
  ativo = true,
}) {
  const dataBaseFinal =
    String(
      dataBase ?? "",
    ).trim();

  const materialIdFinal =
    Number(
      materialId,
    );

  const quantidadeFinal =
    normalizarQuantidade(
      quantidadeKg,
    );

  const observacaoFinal =
    String(
      observacao ?? "",
    ).trim();


  if (
    !Number.isFinite(
      materialIdFinal,
    )
  ) {
    throw new Error(
      "Selecione o material.",
    );
  }


  if (
    fornecedorId === null ||
    fornecedorId === undefined ||
    fornecedorId === ""
  ) {
    throw new Error(
      "Selecione o fornecedor.",
    );
  }


  if (!dataBaseFinal) {
    throw new Error(
      "Informe a data-base do saldo.",
    );
  }


  if (
    quantidadeFinal ===
      null ||
    quantidadeFinal < 0
  ) {
    throw new Error(
      "Informe uma quantidade válida em kg.",
    );
  }


  const dadosSalvar = {
    fornecedor_id:
      fornecedorId,

    material_id:
      materialIdFinal,

    data_base:
      dataBaseFinal,

    quantidade_kg:
      quantidadeFinal,

    observacao:
      observacaoFinal ||
      null,

    ativo:
      Boolean(
        ativo,
      ),

    atualizado_em:
      new Date()
        .toISOString(),
  };


  const campos = `
    id,
    fornecedor_id,
    material_id,
    data_base,
    quantidade_kg,
    observacao,
    ativo,
    criado_em,
    atualizado_em
  `;


  /* =======================================================
     EDITAR
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
          "materia_prima_saldo_inicial",
        )
        .update(
          dadosSalvar,
        )
        .eq(
          "id",
          id,
        )
        .select(
          campos,
        )
        .single();


    if (error) {
      if (
        error.code ===
        "23505"
      ) {
        throw new Error(
          "Já existe um saldo para este fornecedor, material e data-base.",
        );
      }


      throw error;
    }


    return normalizarSaldo(
      data,
    );
  }


  /* =======================================================
     NOVO
  ======================================================= */

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "materia_prima_saldo_inicial",
      )
      .insert(
        dadosSalvar,
      )
      .select(
        campos,
      )
      .single();


  if (error) {
    if (
      error.code ===
      "23505"
    ) {
      throw new Error(
        "Já existe um saldo para este fornecedor, material e data-base.",
      );
    }


    throw error;
  }


  return normalizarSaldo(
    data,
  );
}
