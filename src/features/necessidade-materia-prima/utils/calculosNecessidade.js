
/* ============================================================
   NECESSIDADE DE MATÉRIA-PRIMA
   CÁLCULOS E CONSOLIDAÇÃO

   REGRAS:
   - Código Omie manual identifica cada material.
   - Estoque físico vem exclusivamente do Omie.
   - Não existe ajuste manual do estoque.
   - Estoque zero é válido.
   - Ausência de estoque impede cálculo definitivo.
   - Percentual de compra é editável.
   - Estoque-teto é editável.
   - PP possui teto padrão de 30.000 kg.
   - Compras futuras são obtidas do Omie.
   - Não utilizar códigos antigos.

   FORMATAÇÃO:
   Agora está em formatadoresNecessidade.js.
============================================================ */

const CODIGO_PP = "PRD11295";
const TETO_PADRAO_PP = 30000;

/* ============================================================
   FUNÇÕES NUMÉRICAS
============================================================ */

export function numero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
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

function normalizarCodigo(valor) {
  return String(valor ?? "")
    .trim()
    .toUpperCase();
}

function normalizarId(valor) {
  return String(valor ?? "").trim();
}

function obterAjusteNumerico(ajuste, campo) {
  if (
    !ajuste ||
    !Object.prototype.hasOwnProperty.call(
      ajuste,
      campo
    )
  ) {
    return null;
  }

  return numeroOpcional(ajuste[campo]);
}

/* ============================================================
   CÁLCULO DA NECESSIDADE

   CONSUMO CONSIDERADO:
   Consumo × (% Compra / 100)

   SALDO PROJETADO:
   Estoque API + Compras futuras - Consumo considerado

   NECESSIDADE:
   Máximo(0, Teto - Saldo projetado)

   VALOR ESTIMADO:
   Necessidade × Último preço

   IMPORTANTE:
   Sem estoque da API, não calcular necessidade
   definitiva nem valor estimado.
============================================================ */

export function calcularNecessidade({
  consumo,
  percentual,
  estoque,
  comprasFuturas,
  teto,
  preco,
}) {
  const consumoConsiderado =
    numero(consumo) *
    (numero(percentual) / 100);

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

  const saldoProjetado =
    estoqueValido +
    numero(comprasFuturas) -
    consumoConsiderado;

  const necessidade = Math.max(
    0,
    numero(teto) - saldoProjetado
  );

  return {
    consumoConsiderado,
    saldoProjetado,
    necessidade,
    valorEstimado:
      precoValido === null
        ? null
        : necessidade * precoValido,
  };
}

/* ============================================================
   CONSUMOS POR MATERIAL

   Origem:
   necessidade_mp_consumo_resumo
============================================================ */

function criarMapaConsumos(consumos = []) {
  const mapa = new Map();

  for (const item of consumos) {
    const id = normalizarId(item.material_id);

    if (!id) {
      continue;
    }

    mapa.set(
      id,
      (mapa.get(id) ?? 0) +
        numero(item.consumo_total_kg)
    );
  }

  return mapa;
}

/* ============================================================
   ESTOQUE POR CÓDIGO OMIE MANUAL

   A origem já é filtrada pelo serviço:
   estoque_materia_prima_omie_resumo

   Não utiliza código antigo de outro material.
============================================================ */

function criarMapaEstoques(estoques = []) {
  const mapa = new Map();

  for (const item of estoques) {
    const codigo = normalizarCodigo(
      item.codigo_produto
    );

    if (!codigo) {
      continue;
    }

    const fisico = numeroOpcional(item.fisico);

    if (fisico === null) {
      continue;
    }

    const anterior = mapa.get(codigo);

    if (anterior) {
      mapa.set(codigo, {
        ...anterior,
        fisico: anterior.fisico + fisico,
      });
    } else {
      mapa.set(codigo, {
        ...item,
        fisico,
      });
    }
  }

  return mapa;
}

/* ============================================================
   COMPRAS FUTURAS POR CÓDIGO OMIE
============================================================ */

function criarMapaCompras(compras = []) {
  const mapa = new Map();

  for (const item of compras) {
    const codigo = normalizarCodigo(
      item.codigo_produto
    );

    if (!codigo) {
      continue;
    }

    mapa.set(
      codigo,
      (mapa.get(codigo) ?? 0) +
        numero(item.quantidade_futura)
    );
  }

  return mapa;
}

/* ============================================================
   PREÇOS POR CÓDIGO OMIE

   Prioriza a última compra mais recente.
============================================================ */

function criarMapaPrecos(precos = []) {
  const mapa = new Map();

  for (const item of precos) {
    const codigo = normalizarCodigo(
      item.codigo_produto
    );

    if (!codigo) {
      continue;
    }

    const anterior = mapa.get(codigo);

    if (!anterior) {
      mapa.set(codigo, item);
      continue;
    }

    const dataAtual = String(
      item.ultima_compra ?? ""
    );

    const dataAnterior = String(
      anterior.ultima_compra ?? ""
    );

    if (dataAtual > dataAnterior) {
      mapa.set(codigo, item);
    }
  }

  return mapa;
}

/* ============================================================
   CONSOLIDAR NECESSIDADE

   Material
     ↓
   Código Omie manual
     ↓
   Consumo dos pedidos
     ↓
   Estoque físico API
     ↓
   Compras futuras
     ↓
   Percentual de compra
     ↓
   Estoque-teto
     ↓
   Necessidade
============================================================ */

export function consolidarNecessidade(
  dados,
  ajustes = {}
) {
  if (!dados) {
    return [];
  }

  const consumos = criarMapaConsumos(
    dados.consumos ?? []
  );

  const estoques = criarMapaEstoques(
    dados.estoques ?? []
  );

  const compras = criarMapaCompras(
    dados.comprasFuturas ?? []
  );

  const precos = criarMapaPrecos(
    dados.precos ?? []
  );

  return (dados.materiais ?? [])
    .filter((material) => material.ativo)
    .map((material) => {
      /* ============================================
         IDENTIFICAÇÃO
      ============================================ */

      const id = normalizarId(material.id);

      const codigoOmie = normalizarCodigo(
        material.codigo_omie
      );

      /* ============================================
         CONSUMO TOTAL
      ============================================ */

      const consumo = consumos.get(id) ?? 0;

      /* ============================================
         ESTOQUE API

         Somente saldo físico real do Omie.
         O usuário não pode modificar esse valor.
      ============================================ */

      const posicaoEstoque = codigoOmie
        ? estoques.get(codigoOmie)
        : undefined;

      const estoqueDisponivel =
        posicaoEstoque !== undefined;

      const estoqueApi = estoqueDisponivel
        ? posicaoEstoque.fisico
        : null;

      /* ============================================
         COMPRAS FUTURAS
      ============================================ */

      const comprasFuturas = codigoOmie
        ? compras.get(codigoOmie) ?? 0
        : 0;

      /* ============================================
         ÚLTIMO PREÇO
      ============================================ */

      const historicoPreco = codigoOmie
        ? precos.get(codigoOmie)
        : undefined;

      const preco = historicoPreco
        ? numeroOpcional(
            historicoPreco.ultimo_preco
          )
        : null;

      /* ============================================
         AJUSTES EDITÁVEIS

         Apenas:
         - Percentual de compra
         - Estoque-teto

         Estoque não aceita ajuste manual.
      ============================================ */

      const ajuste = ajustes[id] ?? {};

      const percentualAjustado =
        obterAjusteNumerico(
          ajuste,
          "percentual"
        );

      const percentual = Math.min(
        100,
        Math.max(
          0,
          percentualAjustado ?? 100
        )
      );

      const tetoAjustado =
        obterAjusteNumerico(
          ajuste,
          "teto"
        );

      const tetoPadrao =
        codigoOmie === CODIGO_PP
          ? TETO_PADRAO_PP
          : 0;

      const teto = Math.max(
        0,
        tetoAjustado ?? tetoPadrao
      );

      /* ============================================
         CÁLCULO

         Nunca utiliza estoque manual.
      ============================================ */

      const calculo = calcularNecessidade({
        consumo,
        percentual,
        estoque: estoqueApi,
        comprasFuturas,
        teto,
        preco,
      });

      /* ============================================
         SITUAÇÃO DO ESTOQUE
      ============================================ */

      let situacaoEstoque;

      if (!codigoOmie) {
        situacaoEstoque = "SEM_CODIGO";
      } else if (estoqueDisponivel) {
        situacaoEstoque = "SINCRONIZADO";
      } else {
        situacaoEstoque = "SEM_DADOS";
      }

      /* ============================================
         RETORNO COMPATÍVEL COM A TELA
      ============================================ */

      return {
        id: material.id,

        material: material.nome,

        codigoOmie: codigoOmie || null,

        consumo,

        percentual,

        estoqueApi,

        // Alias para consumidores existentes.
        // Utiliza exclusivamente o estoque API.
        estoque: estoqueApi,

        estoqueDisponivel,

        situacaoEstoque,

        comprasFuturas,

        teto,

        preco,

        ultimaCompra:
          historicoPreco?.ultima_compra ?? null,

        dataEstoque:
          posicaoEstoque?.data_posicao ?? null,

        sincronizadoEm:
          posicaoEstoque?.sincronizado_em ?? null,

        ...calculo,
      };
    })
    .sort((a, b) =>
      a.material.localeCompare(
        b.material,
        "pt-BR"
      )
    );
}
