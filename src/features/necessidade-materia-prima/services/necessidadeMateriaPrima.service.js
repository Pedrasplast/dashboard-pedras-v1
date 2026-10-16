
import { supabase } from "@/lib/supabaseClient";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const CONFIG = Object.freeze({
  TAMANHO_PAGINA: 500,

  TABELAS: Object.freeze({
    MATERIAIS: "materia_prima_materiais",

    PEDIDOS: "necessidade_mp_pedidos_detalhe",

    CONSUMO: "necessidade_mp_consumo_resumo",

    VINCULOS: "materia_prima_material_itens_omie",

    ESTOQUE: "estoque_materia_prima_omie_resumo",

    COMPRAS: "compras_futuras_materia_prima_omie",

    PRECOS: "precos_materia_prima_omie",
  }),
});

/* =========================================================
   CONSULTA PAGINADA
========================================================= */

async function consultarTabela(
  tabela,
  campos = "*"
) {
  const registros = [];

  let inicio = 0;

  while (true) {
    const fim =
      inicio + CONFIG.TAMANHO_PAGINA - 1;

    const { data, error } = await supabase
      .from(tabela)
      .select(campos)
      .range(inicio, fim);

    if (error) {
      throw new Error(
        `Erro ao consultar ${tabela}: ${error.message}`
      );
    }

    const pagina = data ?? [];

    registros.push(...pagina);

    if (pagina.length < CONFIG.TAMANHO_PAGINA) {
      break;
    }

    inicio += CONFIG.TAMANHO_PAGINA;
  }

  return registros;
}

/* =========================================================
   MATERIAIS
========================================================= */

async function buscarMateriais() {
  return consultarTabela(
    CONFIG.TABELAS.MATERIAIS,
    "id,nome,ativo"
  );
}

/* =========================================================
   PEDIDOS EM ABERTO

   Origem: pedidos_omie
   Filtro aplicado na view:
   ativo = true
   status = 'Pedido'

   Inclui os itens sem cadastro de peso.
========================================================= */

async function buscarPedidosAbertos() {
  return consultarTabela(
    CONFIG.TABELAS.PEDIDOS,
    [
      "pedido_item_id",
      "codigo_pedido_omie",
      "numero_pedido",
      "item_sequencia",
      "codigo_produto",
      "produto",
      "quantidade",
      "kg_un",
      "material_id",
      "material",
      "consumo_kg",
      "situacao_cadastro",
    ].join(",")
  );
}

/* =========================================================
   CONSUMO POR MATERIAL
========================================================= */

async function buscarConsumos() {
  return consultarTabela(
    CONFIG.TABELAS.CONSUMO,
    [
      "material_id",
      "material",
      "consumo_total_kg",
      "total_pedidos",
      "total_itens",
    ].join(",")
  );
}

/* =========================================================
   VÍNCULOS OMIE
========================================================= */

async function buscarVinculos() {
  return consultarTabela(
    CONFIG.TABELAS.VINCULOS,
    [
      "material_id",
      "codigo_produto_omie",
      "ativo",
    ].join(",")
  );
}

/* =========================================================
   ESTOQUE
========================================================= */

async function buscarEstoque() {
  return consultarTabela(
    CONFIG.TABELAS.ESTOQUE,
    [
      "codigo_produto_omie",
      "fisico",
      "data_posicao",
      "sincronizado_em",
    ].join(",")
  );
}

/* =========================================================
   COMPRAS FUTURAS
========================================================= */

async function buscarComprasFuturas() {
  return consultarTabela(
    CONFIG.TABELAS.COMPRAS,
    [
      "codigo_produto_omie",
      "quantidade_futura",
    ].join(",")
  );
}

/* =========================================================
   PREÇOS
========================================================= */

async function buscarPrecos() {
  return consultarTabela(
    CONFIG.TABELAS.PRECOS,
    [
      "codigo_produto_omie",
      "ultimo_preco",
      "preco_medio_30d",
      "ultima_compra",
    ].join(",")
  );
}

/* =========================================================
   RESUMO DOS PEDIDOS

   Usa IDs distintos para evitar contabilizar
   um pedido mais de uma vez.
========================================================= */

function calcularResumoPedidos(pedidos) {
  const codigosPedidos = new Set();

  let itensCalculaveis = 0;
  let itensPendentes = 0;

  const pendencias = {};

  for (const item of pedidos) {
    codigosPedidos.add(
      String(item.codigo_pedido_omie)
    );

    if (item.situacao_cadastro === "OK") {
      itensCalculaveis += 1;
    } else {
      itensPendentes += 1;

      const situacao =
        item.situacao_cadastro || "DESCONHECIDO";

      pendencias[situacao] =
        (pendencias[situacao] ?? 0) + 1;
    }
  }

  return {
    totalPedidos: codigosPedidos.size,

    totalItens: pedidos.length,

    itensCalculaveis,

    itensPendentes,

    pendencias,

    cadastroCompleto: itensPendentes === 0,
  };
}

/* =========================================================
   CONSULTA CONSOLIDADA

   Mantém os dados compatíveis com
   os componentes atuais da Necessidade.
========================================================= */

export async function buscarNecessidadeMateriaPrima() {
  const [
    materiais,
    pedidosAbertos,
    consumosOriginais,
    vinculos,
    estoques,
    comprasFuturas,
    precos,
  ] = await Promise.all([
    buscarMateriais(),
    buscarPedidosAbertos(),
    buscarConsumos(),
    buscarVinculos(),
    buscarEstoque(),
    buscarComprasFuturas(),
    buscarPrecos(),
  ]);

  const resumoPedidos =
    calcularResumoPedidos(pedidosAbertos);

  const consumos = consumosOriginais.map(
    (item) => ({
      ...item,

      pedidos: item.total_pedidos,

      itens: item.total_itens,
    })
  );

  const estoqueSincronizado =
    estoques.length > 0;

  const calculoHomologado =
    resumoPedidos.cadastroCompleto &&
    estoqueSincronizado &&
    false; // Saldo pendente ainda não validado.

  return {
    materiais,

    pedidosAbertos,

    resumoPedidos,

    consumos,

    vinculos,

    estoques,

    comprasFuturas,

    precos,

    validacao: {
      cadastroCompleto:
        resumoPedidos.cadastroCompleto,

      estoqueSincronizado,

      quantidadePendenteValidada: false,

      calculoHomologado,
    },
  };
}
