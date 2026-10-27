import { paraNumero } from "@/shared/lib/numeros";
import { paraTexto, normalizarTexto } from "@/shared/lib/texto";
import { formatarNumeroPtBR } from "@/shared/lib/formatar";

/* =========================================================
   ESTOQUE - UTILITÁRIOS

   Este arquivo não conhece:
   - React
   - Supabase
   - React Query

   Apenas transforma valores e objetos.
========================================================= */

/* =========================================================
   FORMATAR NÚMERO
========================================================= */

export function formatarNumero(valor, casasMaximas = 3) {
  return formatarNumeroPtBR(paraNumero(valor), {
    minimumFractionDigits: 0,

    maximumFractionDigits: casasMaximas,
  });
}

/* =========================================================
   FORMATAR DATA/HORA
========================================================= */

export function formatarDataHora(valor) {
  if (!valor) {
    return "Aguardando sincronização";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Aguardando sincronização";
  }

  return data.toLocaleString("pt-BR", {
    day: "2-digit",

    month: "2-digit",

    hour: "2-digit",

    minute: "2-digit",
  });
}

/* =========================================================
   MODO DA SINCRONIZAÇÃO
========================================================= */

export function obterModoSincronizacao(status) {
  const etapa = normalizarTexto(status?.etapa);

  if (etapa.startsWith("rapido")) {
    return "Rápida";
  }

  if (etapa === "concluido") {
    return "Completa";
  }

  if (normalizarTexto(status?.status) === "sincronizando") {
    return "Sincronizando";
  }

  return "Automática";
}

/* =========================================================
   NORMALIZAR ESTOQUE DO SUPABASE
========================================================= */

export function normalizarEstoque(registro) {
  return {
    id: registro?.id ?? null,

    codigoProdutoOmie: paraNumero(registro?.codigo_produto_omie),

    codigoIntegracao: paraTexto(registro?.codigo_integracao),

    codigoProduto: paraTexto(registro?.codigo_produto),

    descricao: paraTexto(registro?.descricao),

    tipoItem: paraTexto(registro?.tipo_item),

    codigoLocalEstoque: paraNumero(registro?.codigo_local_estoque),

    precoUnitario: paraNumero(registro?.preco_unitario),

    saldo: paraNumero(registro?.saldo),

    cmc: paraNumero(registro?.cmc),

    pendente: paraNumero(registro?.pendente),

    estoqueMinimo: paraNumero(registro?.estoque_minimo),

    reservado: paraNumero(registro?.reservado),

    fisico: paraNumero(registro?.fisico),

    dataPosicao: registro?.data_posicao ?? null,

    ativo: registro?.ativo === true,

    sincronizadoEm: registro?.sincronizado_em ?? null,

    atualizadoEm: registro?.atualizado_em ?? null,
  };
}

/* =========================================================
   NORMALIZAR LOCAL
========================================================= */

export function normalizarLocalEstoque(registro) {
  return {
    codigoLocalEstoque: paraNumero(registro?.codigo_local_estoque),

    codigo: paraTexto(registro?.codigo),

    descricao: paraTexto(registro?.descricao),

    padrao: registro?.padrao === true,
  };
}

/* =========================================================
   CONSOLIDAR ESTOQUE DE TODOS OS LOCAIS
========================================================= */

export function consolidarEstoque(registros = []) {
  const mapa = new Map();

  for (const item of registros) {
    const chave = String(item.codigoProdutoOmie);

    const atual = mapa.get(chave);

    if (!atual) {
      mapa.set(chave, {
        ...item,

        codigoLocalEstoque: null,

        saldo: paraNumero(item.saldo),

        fisico: paraNumero(item.fisico),

        reservado: paraNumero(item.reservado),

        pendente: paraNumero(item.pendente),

        estoqueMinimo: paraNumero(item.estoqueMinimo),
      });

      continue;
    }

    atual.saldo += paraNumero(item.saldo);

    atual.fisico += paraNumero(item.fisico);

    atual.reservado += paraNumero(item.reservado);

    atual.pendente += paraNumero(item.pendente);

    atual.estoqueMinimo += paraNumero(item.estoqueMinimo);

    if (
      item.sincronizadoEm &&
      (!atual.sincronizadoEm ||
        new Date(item.sincronizadoEm).getTime() > new Date(atual.sincronizadoEm).getTime())
    ) {
      atual.sincronizadoEm = item.sincronizadoEm;
    }
  }

  return Array.from(mapa.values());
}

/* =========================================================
   AGRUPAR PEDIDOS EM ABERTO POR PRODUTO
========================================================= */

export function agruparPedidosPorProduto(registros = []) {
  const porProduto = new Map();

  const pedidosDistintos = new Set();

  let quantidadeTotal = 0;

  for (const registro of registros) {
    const codigoProduto = paraTexto(registro?.codigo_produto);

    const quantidade = paraNumero(registro?.quantidade);

    const codigoPedido = registro?.codigo_pedido_omie;

    if (codigoPedido !== null && codigoPedido !== undefined) {
      pedidosDistintos.add(String(codigoPedido));
    }

    quantidadeTotal += quantidade;

    if (!codigoProduto) {
      continue;
    }

    const quantidadeAtual = porProduto.get(codigoProduto) ?? 0;

    porProduto.set(
      codigoProduto,

      quantidadeAtual + quantidade,
    );
  }

  const itens = Array.from(porProduto.entries()).map(([codigoProduto, quantidade]) => ({
    codigoProduto,
    quantidade,
  }));

  return {
    itens,

    quantidadeTotal,

    pedidosDistintos: pedidosDistintos.size,

    linhas: registros.length,
  };
}
