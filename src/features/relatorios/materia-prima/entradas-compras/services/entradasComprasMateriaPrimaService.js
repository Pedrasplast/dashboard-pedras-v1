import { supabase } from "@/lib/supabaseClient";


export const SITUACOES_ENTRADAS_COMPRAS = [
  {
    valor: "TODAS",
    nome: "Todas",
  },
  {
    valor: "RECEBIDAS",
    nome: "Recebidas",
  },
  {
    valor: "FUTURAS",
    nome: "Futuras",
  },
];


export const DATAS_REFERENCIA_ENTRADAS_COMPRAS = [
  {
    valor: "EMISSAO",
    nome: "Emissão",
  },
  {
    valor: "PREVISAO",
    nome: "Previsão de recebimento",
  },
  {
    valor: "RECEBIMENTO",
    nome: "Recebimento",
  },
];


const CAMPOS_COMPRA = `
  id,
  numero_pedido,
  data_compra,
  data_prevista,
  data_recebimento,
  fornecedor_id,
  material_id,
  tipo_material,
  tipo_classificacao,
  quantidade_kg,
  preco_unitario,
  ipi_percentual,
  valor_total,
  numero_nf,
  status,
  ativo
`;


function texto(valor) {
  return String(valor ?? "").trim();
}


function numero(valor, padrao = 0) {
  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : padrao;
}


function numeroOpcional(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : null;
}


function normalizarRegistro({
  registro,
  fornecedoresPorId,
  materiaisPorId,
}) {
  const status = texto(
    registro?.status,
  ).toUpperCase();

  const fornecedor = fornecedoresPorId.get(
    String(registro?.fornecedor_id ?? ""),
  );

  const material = materiaisPorId.get(
    String(registro?.material_id ?? ""),
  );

  return {
    id: registro.id,

    pedido:
      texto(registro.numero_pedido),

    recebido:
      texto(registro.data_recebimento),

    emissao:
      texto(registro.data_compra),

    previsaoRecebimento:
      texto(registro.data_prevista),

    fornecedorId:
      registro.fornecedor_id,

    fornecedor:
      texto(fornecedor?.nome) ||
      "Fornecedor não encontrado",

    materialId:
      registro.material_id,

    material:
      texto(material?.nome) ||
      texto(registro.tipo_material) ||
      "Material não encontrado",

    tipo:
      texto(registro.tipo_classificacao) ||
      "-",

    quantidadeKg:
      numero(registro.quantidade_kg),

    preco:
      numeroOpcional(registro.preco_unitario),

    ipiPercentual:
      numeroOpcional(registro.ipi_percentual),

    total:
      numero(registro.valor_total),

    numeroNf:
      texto(registro.numero_nf),

    statusOriginal:
      status,

    situacao:
      status === "RECEBIDA"
        ? "RECEBIDA"
        : "FUTURA",
  };
}


function criarOpcoesUnicas(
  registros,
  campoId,
  campoNome,
) {
  const mapa = new Map();

  registros.forEach((registro) => {
    const id = registro?.[campoId];
    const nome = texto(registro?.[campoNome]);

    if (
      id === null ||
      id === undefined ||
      id === "" ||
      !nome
    ) {
      return;
    }

    mapa.set(
      String(id),
      {
        id,
        nome,
      },
    );
  });

  return [...mapa.values()].sort(
    (a, b) =>
      a.nome.localeCompare(
        b.nome,
        "pt-BR",
        {
          sensitivity: "base",
        },
      ),
  );
}


export function criarResultadoEntradasComprasVazio() {
  return {
    registros: [],
    fornecedores: [],
    materiais: [],
    tipos: [],
  };
}


/* =========================================================
   CONSULTA

   Não cria dados novos.
   Apenas lê as tabelas já existentes do módulo de matéria-prima.
========================================================= */

export async function buscarRelatorioEntradasComprasMateriaPrima() {
  const [
    resultadoCompras,
    resultadoFornecedores,
    resultadoMateriais,
  ] = await Promise.all([
    supabase
      .from("materia_prima_compras_futuras")
      .select(CAMPOS_COMPRA)
      .eq("ativo", true)
      .in(
        "status",
        [
          "RECEBIDA",
          "PREVISTA",
          "CONFIRMADA",
        ],
      )
      .order(
        "data_prevista",
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

    supabase
      .from("materia_prima_fornecedores")
      .select("id, nome")
      .order(
        "nome",
        {
          ascending: true,
        },
      ),

    supabase
      .from("materia_prima_materiais")
      .select("id, nome")
      .order(
        "nome",
        {
          ascending: true,
        },
      ),
  ]);

  if (resultadoCompras.error) {
    throw resultadoCompras.error;
  }

  if (resultadoFornecedores.error) {
    throw resultadoFornecedores.error;
  }

  if (resultadoMateriais.error) {
    throw resultadoMateriais.error;
  }

  const fornecedores = Array.isArray(
    resultadoFornecedores.data,
  )
    ? resultadoFornecedores.data
    : [];

  const materiais = Array.isArray(
    resultadoMateriais.data,
  )
    ? resultadoMateriais.data
    : [];

  const fornecedoresPorId = new Map(
    fornecedores.map((fornecedor) => [
      String(fornecedor.id),
      fornecedor,
    ]),
  );

  const materiaisPorId = new Map(
    materiais.map((material) => [
      String(material.id),
      material,
    ]),
  );

  const registros = (
    Array.isArray(resultadoCompras.data)
      ? resultadoCompras.data
      : []
  )
    .map((registro) =>
      normalizarRegistro({
        registro,
        fornecedoresPorId,
        materiaisPorId,
      }),
    )
    .sort((a, b) => {
      const dataA =
        a.recebido ||
        a.previsaoRecebimento ||
        a.emissao ||
        "";

      const dataB =
        b.recebido ||
        b.previsaoRecebimento ||
        b.emissao ||
        "";

      const comparacao = dataB.localeCompare(dataA);

      if (comparacao !== 0) {
        return comparacao;
      }

      return Number(b.id) - Number(a.id);
    });

  const fornecedoresFiltro = criarOpcoesUnicas(
    registros,
    "fornecedorId",
    "fornecedor",
  );

  const materiaisFiltro = criarOpcoesUnicas(
    registros,
    "materialId",
    "material",
  );

  const tipos = [
    ...new Set(
      registros
        .map((registro) => texto(registro.tipo))
        .filter(
          (tipo) =>
            tipo &&
            tipo !== "-",
        ),
    ),
  ].sort((a, b) =>
    a.localeCompare(
      b,
      "pt-BR",
      {
        sensitivity: "base",
      },
    ),
  );

  return {
    registros,
    fornecedores: fornecedoresFiltro,
    materiais: materiaisFiltro,
    tipos,
  };
}