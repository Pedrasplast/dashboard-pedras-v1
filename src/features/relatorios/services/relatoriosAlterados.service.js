import { supabase } from "@/lib/supabaseClient";

import { carregarMapaMetadadosPedidoExibicao } from "@/features/pedidos/numeroPedidoExibicao";

/* =========================================================
   CONSULTAS DOS RELATÓRIOS DE ALTERAÇÕES
   (Pedidos Alterados e Pedidos de Compra Alterados)
========================================================= */

const LIMITE_HISTORICO = 2000;

async function listarAlteracoesPorPeriodo(nomeRpc, dataInicial, dataFinal) {
  const { data, error } = await supabase.rpc(nomeRpc, {
    p_data_inicial: dataInicial || null,
    p_data_final: dataFinal || null,
    p_limite: LIMITE_HISTORICO,
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

/* =========================================================
   PEDIDOS ALTERADOS
========================================================= */

export function buscarPedidosAlterados(dataInicial, dataFinal) {
  return listarAlteracoesPorPeriodo("listar_relatorio_pedidos_alterados", dataInicial, dataFinal);
}

// Numeração /1, /2 dos pedidos desdobrados.
export function buscarMetadadosDesdobramentoPedidos() {
  return carregarMapaMetadadosPedidoExibicao(supabase);
}

/* =========================================================
   PEDIDOS DE COMPRA ALTERADOS
========================================================= */

export function buscarPedidosCompraAlterados(dataInicial, dataFinal) {
  return listarAlteracoesPorPeriodo(
    "listar_relatorio_pedidos_compra_alterados",
    dataInicial,
    dataFinal,
  );
}

export async function buscarSincronizacaoPedidosCompra() {
  const { data, error } = await supabase
    .from("sincronizacao_pedidos_compra_omie")
    .select(["status", "finalizado_em", "atualizado_em", "pagina_proxima", "mensagem"].join(","))
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function buscarNomesFornecedoresPedidosCompra() {
  const { data, error } = await supabase.functions.invoke("nomes-fornecedores-pedidos-compra", {
    body: {},
  });

  if (error) {
    throw error;
  }

  if (
    !data ||
    !data.fornecedores ||
    typeof data.fornecedores !== "object" ||
    Array.isArray(data.fornecedores)
  ) {
    throw new Error("A consulta não retornou os nomes dos fornecedores.");
  }

  return {
    nomes: data.fornecedores,

    pendentes: Number(data.pendentes || 0),

    falhaOmie: data.consulta_omie_falhou === true,
  };
}

// Código do local -> descrição. Sem os locais, o relatório segue sem os nomes.
export async function buscarLocaisEstoquePedidosCompra() {
  const { data, error } = await supabase
    .from("locais_estoque_omie")
    .select("codigo_local_estoque,descricao,codigo");

  if (error) {
    console.warn("Locais de estoque indisponíveis:", error.message);

    return {};
  }

  return Object.fromEntries(
    (data || []).map((local) => [
      String(local.codigo_local_estoque),

      local.descricao || local.codigo || "Local sem descrição",
    ]),
  );
}

// Pedido -> item -> referência do produto. Sem as referências, o relatório segue sem elas.
export async function buscarItensPedidosCompra() {
  const porPedido = {};
  const lote = 500;

  try {
    for (let inicio = 0; inicio < 10000; inicio += lote) {
      const { data, error } = await supabase
        .from("pedidos_compra_itens_front")
        .select("cod_ped_compra,codigo_item,codigo_comercial,descricao,unidade")
        .order("cod_ped_compra", {
          ascending: true,
        })
        .order("codigo_item", {
          ascending: true,
        })
        .range(inicio, inicio + lote - 1);

      if (error) {
        throw error;
      }

      for (const item of data || []) {
        const codigo = String(item.cod_ped_compra);

        if (!porPedido[codigo]) {
          porPedido[codigo] = {};
        }

        porPedido[codigo][String(item.codigo_item)] = item;
      }

      if ((data || []).length < lote) {
        return porPedido;
      }
    }

    console.warn("Limite de referências de produto alcançado.");
  } catch (error) {
    console.warn("Referências de produtos indisponíveis:", error.message);
  }

  return porPedido;
}
