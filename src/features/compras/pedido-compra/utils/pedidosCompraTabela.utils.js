/* =========================================================
   REGRAS DA TABELA DE PEDIDOS DE COMPRA
   ---------------------------------------------------------
   Textos de célula, itens visíveis e o resumo do recebimento
   físico mostrado no botão "Recebido físico". Sem React.
========================================================= */

import { calcularDiasAtraso } from "./pedidosCompra.utils";
import { formatarDataHoraFrase } from "@/shared/lib/datas";
import { formatarNumeroCasasFixas } from "@/shared/lib/formatar";

export function obterNomeCategoria(pedido) {
  return (
    String(pedido?.categoria_nome ?? "").trim() || String(pedido?.categoria ?? "").trim() || "-"
  );
}

export function obterSolicitante(pedido) {
  const valor = pedido?.solicitante ?? pedido?.contato ?? pedido?.snapshot?.contato ?? "";

  return String(valor).trim() || "-";
}

export function obterCodigoItem(item) {
  const codigo = String(item?.codigo_comercial ?? "").trim();

  if (codigo) {
    return codigo;
  }

  const codigoOmie = String(item?.codigo_produto ?? "").trim();

  return codigoOmie ? `OMIE ${codigoOmie}` : "-";
}

export function obterDescricaoItem(item) {
  const descricao = String(item?.descricao ?? "").trim();

  if (descricao) {
    return descricao;
  }

  return "Produto não identificado";
}

/**
 * Itens de uma linha da tabela desktop. Documento sem itens ganha um item
 * vazio, para que a linha do documento continue aparecendo.
 */
export function obterItensDocumentoTabela(pedido) {
  return Array.isArray(pedido?.itens) && pedido.itens.length
    ? pedido.itens
    : [
        {
          codigo_item: `vazio-${pedido.documento_id}`,
        },
      ];
}

/** Dias em atraso do pedido; 0 quando ele não está em atraso. */
export function obterDiasAtrasoPedido(pedido) {
  return pedido.situacao_recebimento === "EM_ATRASO" ? calcularDiasAtraso(pedido.data_previsao) : 0;
}

/** Recolhido, mostra só o primeiro item; expandido, todos. */
export function obterItensVisiveis(itens, expandido) {
  return expandido ? itens : itens.slice(0, 1);
}

/** Classes de um <tr> da tabela desktop: início do grupo, atraso e destaque do mouse. */
export function montarClassesLinha({ primeiro, atrasado = false, destacado }) {
  return [
    primeiro ? "compras-inicio-grupo" : "compras-item-continuacao",

    atrasado ? "compras-linha-atrasada" : "",

    destacado ? "compras-grupo-destacado" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function calcularResumoRecebimentoFisicoVisual(pedido, resumoManual) {
  const itens = Array.isArray(pedido?.itens) ? pedido.itens : [];

  let totalItens = itens.length;
  let itensCompletosOmie = 0;
  let algumRecebimentoOmie = false;
  let quantidadeOmieRecebida = 0;
  let quantidadeOmiePedida = 0;

  for (const item of itens) {
    const quantidade = Math.max(Number(item?.quantidade ?? 0), 0);
    const recebidaOmie = Math.min(Math.max(Number(item?.quantidade_recebida ?? 0), 0), quantidade);
    const saldoOmie = Math.max(quantidade - recebidaOmie, 0);

    quantidadeOmiePedida += quantidade;
    quantidadeOmieRecebida += recebidaOmie;

    if (recebidaOmie > 0) {
      algumRecebimentoOmie = true;
    }

    if (quantidade > 0 && saldoOmie <= 0) {
      itensCompletosOmie += 1;
    }
  }

  const situacaoManual = resumoManual?.situacao_recebimento_fisico || "NAO_RECEBIDO";

  const completoOmie = totalItens > 0 && itensCompletosOmie === totalItens;

  const completoManual = situacaoManual === "COMPLETO";

  const parcialManual = situacaoManual === "PARCIAL";

  let situacao = "NAO_RECEBIDO";

  if (completoOmie || completoManual) {
    situacao = "COMPLETO";
  } else if (algumRecebimentoOmie || parcialManual) {
    situacao = "PARCIAL";
  }

  const origem = completoOmie
    ? "OMIE"
    : completoManual
      ? "MANUAL"
      : algumRecebimentoOmie && parcialManual
        ? "OMIE_E_MANUAL"
        : algumRecebimentoOmie
          ? "OMIE"
          : parcialManual
            ? "MANUAL"
            : "NENHUMA";

  return {
    ...(resumoManual || {}),
    situacao_recebimento_fisico: situacao,
    origem_recebimento_visual: origem,
    total_itens: totalItens || resumoManual?.total_itens || 0,
    itens_completos:
      situacao === "COMPLETO" && completoOmie
        ? totalItens
        : Math.max(itensCompletosOmie, Number(resumoManual?.itens_completos ?? 0)),
    omie_quantidade_recebida: quantidadeOmieRecebida,
    omie_quantidade_pedida: quantidadeOmiePedida,
  };
}

/** Texto do `title` do botão de recebimento físico, uma informação por linha. */
export function montarTituloRecebimentoFisico(resumo) {
  const situacao = resumo?.situacao_recebimento_fisico || "NAO_RECEBIDO";

  const origem = resumo?.origem_recebimento_visual;

  const linhasTitulo = [];

  if (origem === "OMIE" || origem === "OMIE_E_MANUAL") {
    linhasTitulo.push(
      situacao === "COMPLETO"
        ? "Recebimento confirmado pelo Omie"
        : "Recebimento parcial identificado no Omie",
    );

    if (Number(resumo?.omie_quantidade_pedida ?? 0) > 0) {
      linhasTitulo.push(
        `Omie: ${formatarNumeroCasasFixas(resumo.omie_quantidade_recebida, 2)} de ${formatarNumeroCasasFixas(
          resumo.omie_quantidade_pedida,
          2,
        )}`,
      );
    }
  }

  if (resumo?.ultima_movimentacao_em) {
    linhasTitulo.push(
      `Última movimentação física: ${formatarDataHoraFrase(resumo.ultima_movimentacao_em)}`,
      `Por: ${resumo.ultima_movimentacao_usuario || "-"}`,
    );

    if (resumo.ultima_movimentacao_produto) {
      linhasTitulo.push(`Item: ${resumo.ultima_movimentacao_produto}`);
    }
  }

  if (!linhasTitulo.length) {
    linhasTitulo.push("Nenhum recebimento registrado");
  }

  return linhasTitulo.join("\n");
}
