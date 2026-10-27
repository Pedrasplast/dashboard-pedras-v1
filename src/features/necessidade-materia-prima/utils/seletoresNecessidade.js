import { normalizarCodigo } from "@/shared/lib/texto";
import { paraNumero } from "@/shared/lib/numeros";

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

  return descricoes[situacao] ?? String(situacao || "Cadastro incompleto").replaceAll("_", " ");
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

    const codigo = normalizarCodigo(pedido.codigo_produto);

    if (!codigo) {
      continue;
    }

    const quantidade = paraNumero(pedido.quantidade);
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
    (a, b) => b.quantidade - a.quantidade || a.codigo.localeCompare(b.codigo, "pt-BR"),
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
    const codigo = normalizarCodigo(pedido.codigo_produto);

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
        (a, b) => b.consumo - a.consumo || a.codigo.localeCompare(b.codigo, "pt-BR"),
      ),
    );
  }

  return resultado;
}

/* Produção: consolida pedidos por SKU ANTES de descontar estoque.
   Sem registro de estoque = não calcular consumo definitivo. */
export function planejarProducaoPorProduto(pedidos = [], estoqueProdutos = []) {
  const estoquePorCodigo = new Map();
  for (const item of estoqueProdutos) {
    const codigo = normalizarCodigo(item.codigo_produto);
    if (!codigo) continue;
    const fisico = item.fisico == null ? null : Number(item.fisico);
    const minimo = item.estoque_minimo == null ? 0 : Number(item.estoque_minimo);
    if (fisico === null || !Number.isFinite(fisico) || !Number.isFinite(minimo)) continue;
    const anterior = estoquePorCodigo.get(codigo);
    // A consulta já limita o depósito; defensivo para duplicações eventuais.
    estoquePorCodigo.set(codigo, {
      estoqueAtual: (anterior?.estoqueAtual ?? 0) + fisico,
      estoqueMinimo: Math.max(anterior?.estoqueMinimo ?? 0, minimo),
    });
  }
  const pedidoPorCodigo = new Map();
  for (const item of pedidos) {
    const codigo = normalizarCodigo(item.codigo_produto);
    const quantidade = Number(item.quantidade);
    if (!codigo || !Number.isFinite(quantidade)) continue;
    pedidoPorCodigo.set(codigo, (pedidoPorCodigo.get(codigo) ?? 0) + quantidade);
  }
  const resultado = new Map();
  for (const [codigo, quantidadePedidos] of pedidoPorCodigo) {
    const estoque = estoquePorCodigo.get(codigo);
    resultado.set(codigo, {
      quantidadePedidos,
      estoqueAtual: estoque?.estoqueAtual ?? null,
      estoqueMinimo: estoque?.estoqueMinimo ?? null,
      quantidadeProduzir: estoque
        ? Math.max(0, quantidadePedidos + estoque.estoqueMinimo - estoque.estoqueAtual)
        : null,
      semEstoque: !estoque,
    });
  }
  return resultado;
}

export function agruparProducaoPorMaterial(pedidos = [], estoqueProdutos = []) {
  const planejamento = planejarProducaoPorProduto(pedidos, estoqueProdutos);
  const produtos = agruparProdutosPorMaterial(pedidos);
  const resultado = new Map();
  for (const [materialId, linhas] of produtos) {
    resultado.set(
      materialId,
      linhas.map((produto) => {
        const plano = planejamento.get(normalizarCodigo(produto.codigo));
        return {
          ...produto,
          quantidadePedidos: produto.quantidade,
          estoqueAtual: plano?.estoqueAtual ?? null,
          estoqueMinimo: plano?.estoqueMinimo ?? null,
          quantidadeProduzir: plano?.quantidadeProduzir ?? null,
          consumo:
            plano?.quantidadeProduzir == null ? null : plano.quantidadeProduzir * produto.pesoKgUn,
        };
      }),
    );
  }
  return resultado;
}

export function resumirConsumoDaProducao(produtosPorMaterial) {
  const consumos = [];
  for (const [material_id, produtos] of produtosPorMaterial) {
    const pendentes = produtos.some((p) => p.consumo === null);
    consumos.push({
      material_id,
      consumo_total_kg: produtos.reduce((t, p) => t + (p.consumo ?? 0), 0),
      pendenteEstoqueProduto: pendentes,
    });
  }
  return consumos;
}
