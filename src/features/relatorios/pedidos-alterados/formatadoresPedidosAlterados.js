import { normalizarTexto } from "@/shared/lib/texto";
import { formatarDataISOLocal } from "@/shared/lib/datas";

/** "AAAA-MM-DD" → "DD/MM/AAAA" no texto dos filtros; vazio vira "Sem limite". */
export function formatarFiltroData(valor) {
  if (!valor) {
    return "Sem limite";
  }

  return String(valor).split("-").reverse().join("/");
}

/* =====================================================
   FORMATAR DATA E HORA
===================================================== */

export function formatarDataSemFuso(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  const texto = String(valor).trim();

  // Data no formato YYYY-MM-DD: não converter para UTC.
  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);

  if (correspondencia) {
    const [, ano, mes, dia] = correspondencia;

    return `${dia}/${mes}/${ano}`;
  }

  // Data que já está no formato brasileiro.
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    return texto;
  }

  return texto;
}

/* =====================================================
   PERÍODO PADRÃO

   Primeiro dia do mês até hoje.
===================================================== */

export function obterPeriodoPadrao() {
  const hoje = new Date();

  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  return {
    inicio: formatarDataISOLocal(inicio),
    fim: formatarDataISOLocal(hoje),
  };
}

/* =====================================================
   RÓTULOS DOS CAMPOS
===================================================== */

export const ROTULOS_DETALHES = Object.freeze({
  numero_pedido: "Número do pedido",
  cliente: "Cliente",
  data_pedido: "Data do pedido",
  previsao: "Previsão de faturamento",
  codigo_produto: "Código do produto",
  produto: "Produto",
  quantidade: "Quantidade",
  unidade: "Unidade",
  vendedor: "Vendedor",
  valor: "Valor",
  item_adicionado: "Item adicionado",
});

export function obterRotuloCampo(chave) {
  return (
    ROTULOS_DETALHES[chave] ||
    String(chave ?? "")
      .replace(/_/g, " ")
      .replace(/^\w/, (letra) => letra.toUpperCase())
  );
}

/* =====================================================
   FORMATAR VALORES DO HISTÓRICO
===================================================== */

export function formatarValorGenerico(valor, chave = "") {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  const chaveNormalizada = normalizarTexto(chave);

  // Somente campos realmente identificados como data podem ser formatados como data.
  // Isso evita que números como 20240, 10120 ou 20000 sejam interpretados pelo
  // JavaScript como anos (01/01/20240, 01/01/10120, etc.).
  if (chaveNormalizada.includes("data") || chaveNormalizada.includes("previsao")) {
    return formatarDataSemFuso(valor);
  }

  if (chaveNormalizada === "valor" && Number.isFinite(Number(valor))) {
    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (chaveNormalizada === "quantidade" && Number.isFinite(Number(valor))) {
    return Number(valor).toLocaleString("pt-BR", {
      maximumFractionDigits: 3,
    });
  }

  if (typeof valor === "object") {
    return JSON.stringify(valor);
  }

  return String(valor);
}

/* =====================================================
   EXTRAIR ALTERAÇÕES DE UMA OCORRÊNCIA
===================================================== */

export function extrairMudancas(ocorrencia) {
  const detalhes = ocorrencia?.detalhes;

  if (!detalhes || typeof detalhes !== "object") {
    return [];
  }

  return Object.entries(detalhes).map(([chave, valor]) => {
    /* ITEM ADICIONADO */

    if (chave === "item_adicionado" && valor && typeof valor === "object") {
      const descricao = [
        valor.codigo_produto,

        valor.produto,

        valor.quantidade !== undefined ? `${valor.quantidade} ${valor.unidade || ""}`.trim() : null,
      ]
        .filter(Boolean)
        .join(" • ");

      return {
        chave,
        campo: "Item adicionado",
        anterior: "-",
        novo: descricao || "Novo item incluído",
      };
    }

    /* ALTERAÇÃO NORMAL */

    const anterior = valor && typeof valor === "object" ? valor.anterior : null;

    const novo = valor && typeof valor === "object" ? valor.novo : valor;

    return {
      chave,

      campo: obterRotuloCampo(chave),

      anterior: formatarValorGenerico(anterior, chave),

      novo: formatarValorGenerico(novo, chave),
    };
  });
}

/* =====================================================
   NUMERAÇÃO VISUAL / DESDOBRAMENTO

   Enquanto o mapa auxiliar não chega, mantém os dados
   da RPC como vieram. A troca do número acontece só em
   memória: Supabase e Omie seguem com o número original.
===================================================== */

export function aplicarDesdobramentoPedidos(relatorioBase, mapaMetadados) {
  const mapa = mapaMetadados instanceof Map ? mapaMetadados : new Map();

  return relatorioBase.map((pedido) => {
    const codigoPedidoOmie = Number(pedido?.codigo_pedido_omie);

    const numeroOriginal = String(pedido?.numero_pedido ?? codigoPedidoOmie ?? "").trim();

    const metadadosDesdobramento = mapa.get(codigoPedidoOmie);

    const numeroExibicao = metadadosDesdobramento?.numeroExibicao ?? numeroOriginal;

    return {
      ...pedido,

      numero_pedido_original: numeroOriginal,

      numero_pedido: numeroExibicao,

      // Metadados visuais do desdobramento.
      // Isso NÃO aumenta a contagem de alterações.
      pedido_desdobrado: Boolean(metadadosDesdobramento?.desdobrado),

      pedido_desdobramento_original: Boolean(metadadosDesdobramento?.ehOriginal),

      pedido_desdobramento_indice: Number(metadadosDesdobramento?.indice ?? 0),

      pedido_desdobramento_total: Number(metadadosDesdobramento?.total ?? 1),

      pedido_desdobramento_quantidade_derivados: Number(
        metadadosDesdobramento?.quantidadeDerivados ?? 0,
      ),

      pedido_desdobramento_partes: Array.isArray(metadadosDesdobramento?.partes)
        ? metadadosDesdobramento.partes
        : [],
    };
  });
}

/* =====================================================
   PESQUISA LOCAL
===================================================== */

export function pesquisarPedidosAlterados(pedidos, pesquisa) {
  const termo = normalizarTexto(pesquisa);

  if (!termo) {
    return pedidos;
  }

  return pedidos.filter((pedido) => {
    const campos = Array.isArray(pedido?.campos_alterados) ? pedido.campos_alterados.join(" ") : "";

    return [
      pedido?.numero_pedido,
      pedido?.numero_pedido_original,
      pedido?.pedido_desdobrado ? "desdobrado desdobramento" : "",
      pedido?.cliente,
      pedido?.vendedor,
      campos,
      pedido?.ultimo_resumo,
    ].some((valor) => normalizarTexto(valor).includes(termo));
  });
}
