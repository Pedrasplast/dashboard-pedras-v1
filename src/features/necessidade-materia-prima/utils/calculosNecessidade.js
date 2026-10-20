/* ============================================================
   NECESSIDADE DE MATÉRIA-PRIMA — CÁLCULOS
   - Sem formatação: formatadoresNecessidade.js é separado.
   - Preço de referência lido da view de Tabela de Preços.
   - Média 30 dias quando disponível; senão último preço válido.
   - Sem estoque Omie, necessidade não é calculada.
============================================================ */

const CODIGO_PP = "PRD11295";
const TETO_PADRAO_PP = 30000;

export function numero(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function numeroOpcional(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : null;
}

function normalizarCodigo(valor) {
  return String(valor ?? "").trim().toUpperCase();
}

function normalizarId(valor) {
  return String(valor ?? "").trim();
}

function obterAjusteNumerico(ajuste, campo) {
  if (!ajuste || !Object.prototype.hasOwnProperty.call(ajuste, campo)) {
    return null;
  }
  return numeroOpcional(ajuste[campo]);
}

/* ============================================================
   CONSUMO CONSIDERADO = Consumo × (% Compra / 100)
   SALDO PROJETADO = Estoque + Compras futuras - Consumo considerado
   NECESSIDADE = max(0, Estoque de segurança - Saldo projetado)
   VALOR ESTIMADO = Necessidade × Preço de referência da Tabela de Preços
============================================================ */
export function calcularNecessidade({
  consumo,
  percentual,
  estoque,
  comprasFuturas,
  teto,
  preco,
}) {
  const consumoConsiderado = numero(consumo) * (numero(percentual) / 100);
  const estoqueValido = numeroOpcional(estoque);
  const precoValido = numeroOpcional(preco);

  if (estoqueValido === null) {
    return {
      consumoConsiderado,
      saldoProjetado: null,
      necessidade: null,
      valorEstimado: null,
    };
  }

  const saldoProjetado = estoqueValido + numero(comprasFuturas) - consumoConsiderado;
  const necessidade = Math.max(0, numero(teto) - saldoProjetado);

  return {
    consumoConsiderado,
    saldoProjetado,
    necessidade,
    valorEstimado: precoValido !== null && precoValido > 0
      ? necessidade * precoValido
      : null,
  };
}

function criarMapaConsumos(consumos = []) {
  const mapa = new Map();
  for (const item of consumos) {
    const id = normalizarId(item.material_id);
    if (!id) continue;
    mapa.set(id, (mapa.get(id) ?? 0) + numero(item.consumo_total_kg));
  }
  return mapa;
}

function criarMapaEstoques(estoques = []) {
  const mapa = new Map();
  for (const item of estoques) {
    const codigo = normalizarCodigo(item.codigo_produto);
    if (!codigo) continue;
    const fisico = numeroOpcional(item.fisico);
    if (fisico === null) continue;
    const anterior = mapa.get(codigo);
    if (anterior) {
      mapa.set(codigo, { ...anterior, fisico: anterior.fisico + fisico });
    } else {
      mapa.set(codigo, { ...item, fisico });
    }
  }
  return mapa;
}

function criarMapaCompras(compras = []) {
  const mapa = new Map();
  for (const item of compras) {
    const codigo = normalizarCodigo(item.codigo_produto);
    if (!codigo) continue;
    mapa.set(codigo, (mapa.get(codigo) ?? 0) + numero(item.quantidade_futura));
  }
  return mapa;
}

/* ============================================================
   View: precos_materia_prima_omie
   Colunas: codigo_produto, preco_medio_30d, quantidade_30d, ultimo_preco
   O valor 0 com quantidade 0 significa ausência de média,
   não R$ 0,00 de custo médio.
============================================================ */
function criarMapaPrecos(precos = []) {
  const mapa = new Map();
  for (const item of precos) {
    const codigo = normalizarCodigo(item.codigo_produto);
    if (!codigo) continue;

    const media = numeroOpcional(item.preco_medio_30d);
    const quantidadePeriodo = numero(item.quantidade_30d);
    const precoMedio = quantidadePeriodo > 0 && media !== null && media > 0
      ? media
      : null;

    const ultimo = numeroOpcional(item.ultimo_preco);
    const ultimoPreco = ultimo !== null && ultimo > 0 ? ultimo : null;
    const precoReferencia = precoMedio ?? ultimoPreco;
    const origemPreco = precoMedio !== null
      ? "media_30d"
      : ultimoPreco !== null
        ? "ultima_compra"
        : "sem_preco";

    const anterior = mapa.get(codigo);
    if (!anterior || quantidadePeriodo > anterior.quantidadePeriodo) {
      mapa.set(codigo, {
        ...item,
        precoMedio,
        ultimoPreco,
        precoReferencia,
        origemPreco,
        quantidadePeriodo,
      });
    }
  }
  return mapa;
}

export function consolidarNecessidade(dados, ajustes = {}) {
  if (!dados) return [];

  const consumos = criarMapaConsumos(dados.consumos ?? []);
  const estoques = criarMapaEstoques(dados.estoques ?? []);
  const compras = criarMapaCompras(dados.comprasFuturas ?? []);
  const precos = criarMapaPrecos(dados.precos ?? []);

  return (dados.materiais ?? [])
    .filter((material) => material.ativo)
    .map((material) => {
      const id = normalizarId(material.id);
      const codigoOmie = normalizarCodigo(material.codigo_omie);
      const consumo = consumos.get(id) ?? 0;

      const posicaoEstoque = codigoOmie ? estoques.get(codigoOmie) : undefined;
      const estoqueDisponivel = posicaoEstoque !== undefined;
      const estoqueApi = estoqueDisponivel ? posicaoEstoque.fisico : null;

      const comprasFuturas = codigoOmie ? compras.get(codigoOmie) ?? 0 : 0;
      const historicoPreco = codigoOmie ? precos.get(codigoOmie) : undefined;
      const precoMedio = historicoPreco?.precoMedio ?? null;
      // A mesma fonte da Tabela de Preços determina o preço exibido.
      const preco = historicoPreco?.precoReferencia ?? null;

      const ajuste = ajustes[id] ?? {};
      const percentualAjustado = obterAjusteNumerico(ajuste, "percentual");
      const percentual = Math.min(100, Math.max(0, percentualAjustado ?? 100));
      const tetoAjustado = obterAjusteNumerico(ajuste, "teto");
      const tetoPadrao = codigoOmie === CODIGO_PP ? TETO_PADRAO_PP : 0;
      const teto = Math.max(0, tetoAjustado ?? tetoPadrao);

      const calculo = calcularNecessidade({
        consumo,
        percentual,
        estoque: estoqueApi,
        comprasFuturas,
        teto,
        preco,
      });

      let situacaoEstoque;
      if (!codigoOmie) situacaoEstoque = "SEM_CODIGO";
      else if (estoqueDisponivel) situacaoEstoque = "SINCRONIZADO";
      else situacaoEstoque = "SEM_DADOS";

      return {
        id: material.id,
        material: material.nome,
        codigoOmie: codigoOmie || null,
        consumo,
        percentual,
        estoqueApi,
        estoque: estoqueApi,
        estoqueDisponivel,
        situacaoEstoque,
        comprasFuturas,
        teto,
        preco,
        precoMedio,
        precoReferencia: preco,
        origemPreco: historicoPreco?.origemPreco ?? "sem_preco",
        quantidadePrecoMedio: historicoPreco?.quantidadePeriodo ?? 0,
        ultimaCompra: historicoPreco?.ultima_compra ?? null,
        dataEstoque: posicaoEstoque?.data_posicao ?? null,
        sincronizadoEm: posicaoEstoque?.sincronizado_em ?? null,
        ...calculo,
      };
    })
    .sort((a, b) => a.material.localeCompare(b.material, "pt-BR"));
}
