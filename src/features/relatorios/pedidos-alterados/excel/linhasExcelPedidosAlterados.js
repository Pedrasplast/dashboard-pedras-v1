/* =========================================================
   CONTEÚDO DO EXCEL DE PEDIDOS ALTERADOS
   ---------------------------------------------------------
   Valores das linhas, sem estilo: Resumo (uma linha por
   pedido) e Histórico Expandido (um bloco por pedido).
========================================================= */

export const CABECALHOS_RESUMO = [
  "Pedido",
  "Cliente",
  "Vendedor",
  "Primeira alteração",
  "Última alteração",
  "Nº alterações",
  "O que foi alterado",
];

export const CABECALHOS_HISTORICO = [
  "Ocorrência",
  "Data da alteração",
  "Campo alterado",
  "Antes",
  "Depois",
];

function obterNumeroPedido(pedido) {
  return pedido?.numero_pedido || pedido?.codigo_pedido_omie || "-";
}

export function montarValoresResumo(pedido, formatarDataHora) {
  const campos = Array.isArray(pedido?.campos_alterados) ? pedido.campos_alterados.join(", ") : "-";

  return [
    obterNumeroPedido(pedido),

    pedido?.cliente || "-",

    pedido?.vendedor || "-",

    formatarDataHora(pedido?.primeira_alteracao),

    formatarDataHora(pedido?.ultima_alteracao),

    Number(pedido?.quantidade_alteracoes ?? 0),

    campos || "-",
  ];
}

/**
 * Bloco de um pedido no Histórico. `linhas` traz, por ocorrência (da mais
 * nova, de número maior, para a mais antiga), uma linha por campo alterado:
 * - "sem-detalhe": pedido sem ocorrências (só o resumo, mesclado);
 * - "sem-mudanca": ocorrência sem campos identificados;
 * - "mudanca": um campo, com antes e depois.
 */
export function montarBlocoHistorico(pedido, extrairMudancas, formatarDataHora) {
  const ocorrencias = Array.isArray(pedido?.detalhes_alteracoes) ? pedido.detalhes_alteracoes : [];

  const linhas = [];

  if (ocorrencias.length === 0) {
    linhas.push({
      tipo: "sem-detalhe",

      texto: pedido?.ultimo_resumo || "Alteração registrada sem detalhamento.",
    });
  }

  ocorrencias.forEach((ocorrencia, indice) => {
    const rotulo = `Alteração #${ocorrencias.length - indice}`;

    const data = formatarDataHora(ocorrencia?.alterado_em);

    const mudancas = extrairMudancas(ocorrencia);

    if (mudancas.length === 0) {
      linhas.push({
        tipo: "sem-mudanca",

        valores: [rotulo, data, ocorrencia?.resumo || "Alteração registrada", "-", "-"],
      });

      return;
    }

    for (const mudanca of mudancas) {
      linhas.push({
        tipo: "mudanca",

        valores: [rotulo, data, mudanca.campo, mudanca.anterior, mudanca.novo],
      });
    }
  });

  return {
    titulo: `PEDIDO ${obterNumeroPedido(pedido)}`,

    informacoes: `Cliente: ${pedido?.cliente || "-"}   |   Vendedor: ${
      pedido?.vendedor || "-"
    }   |   Total de alterações: ${Number(pedido?.quantidade_alteracoes ?? 0)}`,

    linhas,
  };
}
