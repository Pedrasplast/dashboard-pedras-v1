import { numero } from "./calculosNecessidade";

export function normalizarDataPrevisao(valor) {
  if (!valor) return null;
  const texto = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) return texto.slice(0, 10);
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return br ? `${br[3]}-${br[2]}-${br[1]}` : null;
}

export function filtrarPedidosPorPrevisao(pedidos, inicio, fim) {
  if (!inicio && !fim) return pedidos;
  return pedidos.filter((pedido) => {
    const data = normalizarDataPrevisao(pedido.previsao);
    return data && (!inicio || data >= inicio) && (!fim || data <= fim);
  });
}

export function resumirConsumosDoPeriodo(pedidos) {
  const mapa = new Map();
  for (const pedido of pedidos) {
    if (pedido.situacao_cadastro !== "OK" || pedido.material_id == null) continue;
    const id = String(pedido.material_id);
    const consumo = Number(pedido.consumo_kg);
    if (!Number.isFinite(consumo)) continue;
    mapa.set(id, (mapa.get(id) ?? 0) + consumo);
  }
  return [...mapa.entries()].map(([material_id, consumo_total_kg]) => ({
    material_id,
    consumo_total_kg,
  }));
}

export function normalizarCodigo(valor) {
  return String(valor ?? "")
    .trim()
    .toUpperCase();
}

/* ============================================================
   DESCRIÇÃO DAS PENDÊNCIAS
============================================================ */

export function descricaoPendencia(situacao) {
  const descricoes = {
    SEM_PARAMETROS: "Produto sem cadastro ativo",
    SEM_CADASTRO: "Produto sem cadastro",
    SEM_MATERIAL: "Matéria-prima não vinculada",
    SEM_PESO: "Peso KG/UN não cadastrado",
    MATERIAL_INATIVO: "Matéria-prima inativa",
    PRODUTO_INATIVO: "Produto inativo",
  };

  return (
    descricoes[situacao] ??
    String(situacao || "Cadastro incompleto")
      .replaceAll("_", " ")
  );
}

/* ============================================================
   AGRUPAR PENDÊNCIAS POR PRODUTO
============================================================ */

export function agruparPendencias(pedidos = []) {
  const mapa = new Map();

  for (const pedido of pedidos) {
    if (pedido.situacao_cadastro === "OK") {
      continue;
    }

    const codigo = normalizarCodigo(
      pedido.codigo_produto
    );

    if (!codigo) {
      continue;
    }

    const quantidade = numero(pedido.quantidade);
    const existente = mapa.get(codigo);

    if (existente) {
      existente.quantidade += quantidade;
      existente.itens += 1;
      continue;
    }

    mapa.set(codigo, {
      codigo,
      produto: pedido.produto || "Sem descrição",
      quantidade,
      itens: 1,
      situacao: pedido.situacao_cadastro,
    });
  }

  return Array.from(mapa.values()).sort(
    (a, b) =>
      b.quantidade - a.quantidade ||
      a.codigo.localeCompare(b.codigo, "pt-BR")
  );
}

/* ============================================================
   AGRUPAR PRODUTOS VÁLIDOS POR MATÉRIA-PRIMA

   A formatação não interfere na soma.
============================================================ */

export function agruparProdutosPorMaterial(pedidos = []) {
  const agrupamento = new Map();

  for (const pedido of pedidos) {
    if (pedido.situacao_cadastro !== "OK") {
      continue;
    }

    if (pedido.material_id == null) {
      continue;
    }

    const materialId = String(pedido.material_id);
    const codigo = normalizarCodigo(
      pedido.codigo_produto
    );

    const quantidade = Number(pedido.quantidade);
    const consumo = Number(pedido.consumo_kg);
    const peso = Number(pedido.kg_un);

    if (
      !codigo ||
      !Number.isFinite(quantidade) ||
      !Number.isFinite(consumo) ||
      !Number.isFinite(peso) ||
      peso <= 0
    ) {
      continue;
    }

    if (!agrupamento.has(materialId)) {
      agrupamento.set(materialId, new Map());
    }

    const produtos = agrupamento.get(materialId);
    const existente = produtos.get(codigo);

    if (existente) {
      existente.quantidade += quantidade;
      existente.consumo += consumo;
      continue;
    }

    produtos.set(codigo, {
      codigo,
      produto: pedido.produto || "Sem descrição",
      quantidade,
      pesoKgUn: peso,
      consumo,
    });
  }

  const resultado = new Map();

  for (const [id, produtos] of agrupamento) {
    resultado.set(
      id,
      Array.from(produtos.values()).sort(
        (a, b) =>
          b.consumo - a.consumo ||
          a.codigo.localeCompare(b.codigo, "pt-BR")
      )
    );
  }

  return resultado;
}

