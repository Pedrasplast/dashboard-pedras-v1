import { SITUACOES_RECEBIMENTO } from "../constants/pedidosCompra.constants";
import { paraNumero } from "@/shared/lib/numeros";
import { obterHoje, converterDataLocal } from "@/shared/lib/datas";
import { formatarNumeroPtBR } from "@/shared/lib/formatar";

export function formatarData(valor) {
  const data = converterDataLocal(valor);

  return data ? data.toLocaleDateString("pt-BR") : "-";
}

export function formatarMoeda(valor) {
  return formatarNumeroPtBR(paraNumero(valor), {
    style: "currency",
    currency: "BRL",
  });
}

export function calcularResumoItens(itens = []) {
  return itens.reduce(
    (acumulado, item) => {
      const quantidade = paraNumero(item?.quantidade);

      const recebida = Math.min(
        paraNumero(item?.quantidade_recebida),

        quantidade,
      );

      const saldo = Math.max(
        quantidade - recebida,

        0,
      );

      const precoUnitario = paraNumero(item?.preco_unitario);

      const valorTotalInformado = paraNumero(item?.valor_total);

      const valorTotal = valorTotalInformado || quantidade * precoUnitario;

      acumulado.quantidade += quantidade;

      acumulado.recebida += recebida;

      acumulado.saldo += saldo;

      acumulado.valorTotal += valorTotal;

      acumulado.valorEmAberto += saldo * precoUnitario;

      return acumulado;
    },

    {
      quantidade: 0,
      recebida: 0,
      saldo: 0,
      valorTotal: 0,
      valorEmAberto: 0,
    },
  );
}

export function obterSituacaoRecebimento(pedido) {
  if (pedido?.tipo_documento === "REQUISICAO") {
    return null;
  }

  const resumo = calcularResumoItens(pedido?.itens ?? []);

  if (resumo.quantidade > 0 && resumo.saldo <= 0) {
    return SITUACOES_RECEBIMENTO.RECEBIDO;
  }

  if (resumo.recebida > 0 && resumo.saldo > 0) {
    return SITUACOES_RECEBIMENTO.RECEBIDO_PARCIALMENTE;
  }

  const previsao = converterDataLocal(pedido?.data_previsao);

  const hoje = obterHoje();

  if (resumo.saldo > 0 && previsao && previsao < hoje) {
    return SITUACOES_RECEBIMENTO.EM_ATRASO;
  }

  return SITUACOES_RECEBIMENTO.EM_ABERTO;
}

export function obterRotuloSituacaoRecebimento(situacao) {
  if (!situacao) {
    return "-";
  }

  switch (situacao) {
    case SITUACOES_RECEBIMENTO.EM_ATRASO:
      return "Em atraso";

    case SITUACOES_RECEBIMENTO.RECEBIDO_PARCIALMENTE:
      return "Recebido parcialmente";

    case SITUACOES_RECEBIMENTO.RECEBIDO:
      return "Recebido";

    default:
      return "Em aberto";
  }
}

export function calcularDiasAtraso(valor) {
  const previsao = converterDataLocal(valor);

  if (!previsao) {
    return 0;
  }

  const diferenca = obterHoje().getTime() - previsao.getTime();

  return diferenca > 0 ? Math.floor(diferenca / 86400000) : 0;
}

export function enriquecerPedido(
  pedido,
  itens = [],
  fornecedores = new Map(),
  compradores = new Map(),
) {
  const requisicao = pedido?.tipo_documento === "REQUISICAO";

  const codigoFornecedor = String(pedido?.codigo_fornecedor ?? "").trim();

  const codigoComprador = String(pedido?.codigo_comprador ?? "").trim();

  const resumo = calcularResumoItens(itens);

  const situacaoRecebimento = obterSituacaoRecebimento({
    ...pedido,
    itens,
  });

  const fornecedorNome = String(fornecedores.get(codigoFornecedor) ?? "").trim();

  const compradorNome = String(compradores.get(codigoComprador) ?? "").trim();

  return {
    ...pedido,

    itens,

    fornecedor_nome: requisicao ? "-" : fornecedorNome || "Fornecedor não identificado",

    comprador_nome: requisicao ? "-" : compradorNome || "Comprador não identificado",

    situacao_recebimento: situacaoRecebimento,

    ...resumo,
  };
}

export function ordenarPedidos(pedidos = []) {
  const pesoSituacao = {
    [SITUACOES_RECEBIMENTO.EM_ATRASO]: 0,

    [SITUACOES_RECEBIMENTO.EM_ABERTO]: 1,

    [SITUACOES_RECEBIMENTO.RECEBIDO_PARCIALMENTE]: 2,

    [SITUACOES_RECEBIMENTO.RECEBIDO]: 3,
  };

  return [...pedidos].sort((a, b) => {
    const requisicaoA = a?.tipo_documento === "REQUISICAO";

    const requisicaoB = b?.tipo_documento === "REQUISICAO";

    const pesoA = requisicaoA ? 4 : (pesoSituacao[a?.situacao_recebimento] ?? 9);

    const pesoB = requisicaoB ? 4 : (pesoSituacao[b?.situacao_recebimento] ?? 9);

    if (pesoA !== pesoB) {
      return pesoA - pesoB;
    }

    const numeroA = String(a?.numero_documento ?? "");

    const numeroB = String(b?.numero_documento ?? "");

    return numeroB.localeCompare(numeroA, "pt-BR", {
      numeric: true,
    });
  });
}

/* =========================================================
   PEDIDO / ITEM
========================================================= */

/** Código do pedido de compra no Omie (número > 0) ou null. */
export function obterCodigoPedidoCompra(pedido) {
  const codigo = Number(
    pedido?.cod_ped_compra ?? pedido?.codigo_pedido_compra ?? pedido?.codigoPedidoCompra ?? null,
  );

  return Number.isFinite(codigo) && codigo > 0 ? codigo : null;
}

/** Valor do item: valor_total quando informado; senão quantidade × preço unitário. */
export function obterValorItem(item) {
  const valorTotal = Number(item?.valor_total);

  if (Number.isFinite(valorTotal)) {
    return valorTotal;
  }

  const quantidade = Number(item?.quantidade ?? 0);
  const precoUnitario = Number(item?.preco_unitario ?? 0);

  return quantidade * precoUnitario;
}

/** "joao.silva@empresa" → "Joao Silva". Vazio vira "-". */
export function formatarNomeUsuario(usuario) {
  const texto = String(usuario ?? "").trim();

  if (!texto) {
    return "-";
  }

  const usuarioSemDominio = texto.includes("@") ? texto.split("@")[0] : texto;

  return usuarioSemDominio
    .split(/[._-]+/)
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase())
    .join(" ");
}
