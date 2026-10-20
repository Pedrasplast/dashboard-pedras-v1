
import { supabase } from "@/lib/supabaseClient";

/* ============================================================
   NECESSIDADE DE MATÉRIA-PRIMA — SERVIÇO

   Visibilidade controlada por:
   materia_prima_materiais.exibir_necessidade_compra

   Regras:
   - Materiais definidos no Cadastro de Material.
   - Códigos Omie manuais e atuais.
   - Estoque físico exclusivamente do Omie.
   - Compras futuras somente dos materiais selecionados.
   - Preços somente dos materiais selecionados.
   - Pedidos completos para validação dos cadastros.
   - Nenhuma alteração de dados.
============================================================ */

const TAMANHO_PAGINA = 500;

const LOCAL_ESTOQUE = {
  codigo: 2333946061,
  nome: "MATÉRIA PRIMA / PRODUTO",
};

const FONTES = Object.freeze({
  MATERIAIS: "materia_prima_materiais",
  PEDIDOS: "necessidade_mp_pedidos_detalhe",
  CONSUMOS: "necessidade_mp_consumo_resumo",
  VINCULOS: "materia_prima_material_itens_omie",
  ESTOQUES: "estoque_materia_prima_omie_resumo",
  COMPRAS: "compras_futuras_materia_prima_omie",
  PRECOS: "precos_materia_prima_omie",
});

/* ============================================================
   FUNÇÕES AUXILIARES
============================================================ */

function normalizarCodigo(valor) {
  return String(valor ?? "")
    .trim()
    .toUpperCase();
}

function normalizarId(valor) {
  return String(valor ?? "").trim();
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

/* ============================================================
   CONSULTA PAGINADA

   Paginada para não depender do limite padrão
   de linhas do Supabase.
============================================================ */

async function consultarTabela(
  tabela,
  colunas = "*",
  prepararConsulta
) {
  const registros = [];
  let inicio = 0;

  while (true) {
    let consulta = supabase
      .from(tabela)
      .select(colunas);

    if (prepararConsulta) {
      consulta = prepararConsulta(consulta);
    }

    const { data, error } = await consulta.range(
      inicio,
      inicio + TAMANHO_PAGINA - 1
    );

    if (error) {
      throw new Error(
        `Erro ao consultar ${tabela}: ${error.message}`
      );
    }

    const pagina = data ?? [];
    registros.push(...pagina);

    if (pagina.length < TAMANHO_PAGINA) {
      break;
    }

    inicio += TAMANHO_PAGINA;
  }

  return registros;
}

/* ============================================================
   MATERIAIS SELECIONADOS NO CADASTRO
============================================================ */

function buscarMateriaisHabilitados() {
  return consultarTabela(
    FONTES.MATERIAIS,
    [
      "id",
      "nome",
      "ativo",
      "codigo_omie",
      "exibir_necessidade_compra",
    ].join(","),
    (consulta) =>
      consulta
        .eq("ativo", true)
        .eq("exibir_necessidade_compra", true)
        .order("id", { ascending: true })
  );
}

/* ============================================================
   PEDIDOS

   Não restringir a leitura de pedidos para preservar
   os alertas de produtos sem parâmetros.
============================================================ */

function buscarPedidos() {
  return consultarTabela(FONTES.PEDIDOS);
}

function buscarConsumos() {
  return consultarTabela(FONTES.CONSUMOS);
}

function buscarVinculosHistoricos() {
  return consultarTabela(FONTES.VINCULOS);
}

/* ============================================================
   ESTOQUES
============================================================ */

function buscarEstoques() {
  return consultarTabela(
    FONTES.ESTOQUES,
    [
      "codigo_produto_omie",
      "codigo_produto",
      "fisico",
      "data_posicao",
      "sincronizado_em",
    ].join(",")
  );
}

/* ============================================================
   COMPRAS FUTURAS E PREÇOS
============================================================ */

function buscarComprasFuturas() {
  return consultarTabela(FONTES.COMPRAS);
}

function buscarPrecos() {
  return consultarTabela(FONTES.PRECOS);
}

/* ============================================================
   CÓDIGOS ATUAIS

   Se o usuário mudar o código Omie no cadastro,
   o próximo carregamento utiliza o novo código.
============================================================ */

function criarConjuntoCodigos(materiais) {
  return new Set(
    materiais
      .map((material) =>
        normalizarCodigo(material.codigo_omie)
      )
      .filter(Boolean)
  );
}

function filtrarPorCodigosAtuais(
  registros,
  codigos
) {
  return registros.filter((registro) =>
    codigos.has(
      normalizarCodigo(registro.codigo_produto)
    )
  );
}

/* ============================================================
   RESOLVER VÍNCULOS

   Mantém somente o código atual de cada material.
============================================================ */

function resolverVinculos({
  materiais,
  vinculosHistoricos,
  estoques,
  comprasFuturas,
  precos,
}) {
  const indices = new Map();

  const fontes = [
    ...vinculosHistoricos.filter(
      (item) => item.ativo
    ),
    ...estoques,
    ...comprasFuturas,
    ...precos,
  ];

  for (const registro of fontes) {
    const codigo = normalizarCodigo(
      registro.codigo_produto
    );

    const codigoInterno = normalizarId(
      registro.codigo_produto_omie
    );

    if (!codigo || !codigoInterno) {
      continue;
    }

    if (!indices.has(codigo)) {
      indices.set(codigo, new Set());
    }

    indices.get(codigo).add(codigoInterno);
  }

  const vinculos = [];
  const pendencias = [];

  for (const material of materiais) {
    const codigo = normalizarCodigo(
      material.codigo_omie
    );

    if (!codigo) {
      pendencias.push({
        material_id: material.id,
        material: material.nome,
        codigo_omie: null,
        motivo: "SEM_CODIGO",
      });

      continue;
    }

    const encontrados =
      indices.get(codigo) ?? new Set();

    if (encontrados.size !== 1) {
      pendencias.push({
        material_id: material.id,
        material: material.nome,
        codigo_omie: codigo,
        motivo:
          encontrados.size === 0
            ? "CODIGO_NAO_LOCALIZADO"
            : "CODIGO_AMBIGUO",
      });

      continue;
    }

    const [codigoInterno] = encontrados;

    vinculos.push({
      material_id: material.id,
      codigo_produto_omie: codigoInterno,
      codigo_produto: codigo,
      ativo: true,
    });
  }

  return {
    vinculos,
    pendencias,
  };
}

/* ============================================================
   RESUMO DOS PEDIDOS
============================================================ */

function resumirPedidos(pedidos) {
  const pedidosDistintos = new Set();
  const porSituacao = {};

  let itensCalculaveis = 0;
  let itensPendentes = 0;

  for (const pedido of pedidos) {
    const codigoPedido = normalizarId(
      pedido.codigo_pedido_omie
    );

    if (codigoPedido) {
      pedidosDistintos.add(codigoPedido);
    }

    if (pedido.situacao_cadastro === "OK") {
      itensCalculaveis += 1;
    } else {
      itensPendentes += 1;

      const situacao =
        pedido.situacao_cadastro ??
        "DESCONHECIDO";

      porSituacao[situacao] =
        (porSituacao[situacao] ?? 0) + 1;
    }
  }

  return {
    totalPedidos: pedidosDistintos.size,
    totalItens: pedidos.length,
    itensCalculaveis,
    itensPendentes,
    cadastroCompleto: itensPendentes === 0,
    porSituacao,
  };
}

/* ============================================================
   ESTOQUES

   Estoque 0 é válido.
   Estoque ausente permanece sem dados.
============================================================ */

function verificarSituacaoEstoques(
  materiais,
  estoques
) {
  const codigosComEstoque = new Set(
    estoques
      .filter(
        (item) =>
          numeroOpcional(item.fisico) !== null
      )
      .map((item) =>
        normalizarCodigo(item.codigo_produto)
      )
  );

  return materiais.map((material) => {
    const codigo = normalizarCodigo(
      material.codigo_omie
    );

    const disponivel =
      Boolean(codigo) &&
      codigosComEstoque.has(codigo);

    return {
      material_id: material.id,
      material: material.nome,
      codigo_omie: codigo || null,
      estoqueDisponivel: disponivel,
      situacao: !codigo
        ? "SEM_CODIGO"
        : disponivel
          ? "COM_ESTOQUE"
          : "SEM_ESTOQUE",
    };
  });
}

/* ============================================================
   CONSULTA PRINCIPAL
============================================================ */

export async function buscarNecessidadeMateriaPrima() {
  const materiais = await buscarMateriaisHabilitados();

  /* ========================================================
     Se não houver materiais habilitados,
     a tela retorna vazia sem consultar dados
     desnecessários do planejamento.
  ======================================================== */

  if (materiais.length === 0) {
    return {
      materiais: [],
      pedidosAbertos: [],
      resumoPedidos: resumirPedidos([]),
      consumos: [],
      vinculos: [],
      estoques: [],
      comprasFuturas: [],
      precos: [],
      codigosPorMaterial: {},
      pendenciasCodigos: [],
      situacaoEstoques: [],
      materiaisComEstoque: [],
      materiaisSemEstoque: [],
      localEstoque: LOCAL_ESTOQUE,
      validacao: {
        cadastroCompleto: true,
        codigosCompletos: true,
        estoqueSincronizado: false,
        todosEstoquesDisponiveis: true,
        quantidadePendenteValidada: false,
        calculoHomologado: false,
      },
    };
  }

  const [
    pedidosAbertos,
    todosConsumos,
    vinculosHistoricos,
    todosEstoques,
    todasCompras,
    todosPrecos,
  ] = await Promise.all([
    buscarPedidos(),
    buscarConsumos(),
    buscarVinculosHistoricos(),
    buscarEstoques(),
    buscarComprasFuturas(),
    buscarPrecos(),
  ]);

  /* ========================================================
     IDENTIFICADORES E CÓDIGOS DOS MATERIAIS HABILITADOS
  ======================================================== */

  const idsPermitidos = new Set(
    materiais.map((material) =>
      normalizarId(material.id)
    )
  );

  const codigosPermitidos =
    criarConjuntoCodigos(materiais);

  /* ========================================================
     CONSUMOS

     Somente materiais habilitados.
  ======================================================== */

  const consumos = todosConsumos.filter(
    (item) =>
      idsPermitidos.has(
        normalizarId(item.material_id)
      )
  );

  /* ========================================================
     ESTOQUES
  ======================================================== */

  const estoques = filtrarPorCodigosAtuais(
    todosEstoques,
    codigosPermitidos
  ).filter(
    (item) =>
      numeroOpcional(item.fisico) !== null
  );

  /* ========================================================
     COMPRAS FUTURAS
  ======================================================== */

  const comprasFuturas = filtrarPorCodigosAtuais(
    todasCompras,
    codigosPermitidos
  );

  /* ========================================================
     PREÇOS
  ======================================================== */

  const precos = filtrarPorCodigosAtuais(
    todosPrecos,
    codigosPermitidos
  );

  /* ========================================================
     VÍNCULOS OMIE
  ======================================================== */

  const {
    vinculos,
    pendencias,
  } = resolverVinculos({
    materiais,
    vinculosHistoricos,
    estoques,
    comprasFuturas,
    precos,
  });

  /* ========================================================
     SITUAÇÃO DE ESTOQUE
  ======================================================== */

  const situacaoEstoques =
    verificarSituacaoEstoques(
      materiais,
      estoques
    );

  const materiaisComEstoque =
    situacaoEstoques.filter(
      (item) => item.estoqueDisponivel
    );

  const materiaisSemEstoque =
    situacaoEstoques.filter(
      (item) => !item.estoqueDisponivel
    );

  /* ========================================================
     RESUMO
  ======================================================== */

  const resumoPedidos = resumirPedidos(
    pedidosAbertos
  );

  const codigosPorMaterial =
    Object.fromEntries(
      materiais.map((material) => [
        normalizarId(material.id),
        normalizarCodigo(material.codigo_omie),
      ])
    );

  /* ========================================================
     RETORNO
  ======================================================== */

  return {
    materiais,

    pedidosAbertos,

    resumoPedidos,

    consumos,

    vinculos,

    estoques,

    comprasFuturas,

    precos,

    codigosPorMaterial,

    pendenciasCodigos: pendencias,

    situacaoEstoques,

    materiaisComEstoque,

    materiaisSemEstoque,

    localEstoque: LOCAL_ESTOQUE,

    validacao: {
      cadastroCompleto:
        resumoPedidos.cadastroCompleto,

      codigosCompletos:
        pendencias.length === 0,

      estoqueSincronizado:
        estoques.length > 0,

      todosEstoquesDisponiveis:
        materiaisSemEstoque.length === 0,

      quantidadePendenteValidada: false,

      calculoHomologado: false,
    },
  };
}
