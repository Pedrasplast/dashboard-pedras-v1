/* =========================================================
   REGRAS DOS PEDIDOS DO OMIE
   ---------------------------------------------------------
   Conversões puras: pedido do Omie → linhas da tabela
   pedidos_omie, e linha da tabela → pedido da tela.
========================================================= */

/** Fora de aberto: faturado, cancelado, denegado, devolvido ou encerrado. */
export function pedidoEstaEmAberto(pedido) {
  const info = pedido?.infoCadastro ?? {};

  const cabecalho = pedido?.cabecalho ?? {};

  if (info.faturado === "S") {
    return false;
  }

  if (info.cancelado === "S") {
    return false;
  }

  if (info.denegado === "S") {
    return false;
  }

  if (info.devolvido === "S") {
    return false;
  }

  if (cabecalho.encerrado === "S") {
    return false;
  }

  return true;
}

/** A etapa "Armazenado" do Omie aparece como "Pedido" no dashboard. */
export function normalizarStatusExibicao(statusOriginal) {
  if (!statusOriginal) {
    return "Pedido";
  }

  const texto = String(statusOriginal).trim();

  const normalizado = texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  if (normalizado.includes("armazenado")) {
    return "Pedido";
  }

  return texto;
}

/** "DD/MM/AAAA" ou "AAAA-MM-DD…" → "AAAA-MM-DD"; outro formato → null. */
export function converterDataOmieParaIso(valor) {
  if (!valor) {
    return null;
  }

  const texto = String(valor).trim();

  const brasileiro = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (brasileiro) {
    const [, dia, mes, ano] = brasileiro;

    return `${ano}-${mes}-${dia}`;
  }

  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  return null;
}

/** "AAAA-MM-DD…" → "DD/MM/AAAA"; vazio → ""; outro formato volta como está. */
export function converterDataIsoParaBrasileira(valor) {
  if (!valor) {
    return "";
  }

  const texto = String(valor);

  const partes = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!partes) {
    return texto;
  }

  return `${partes[3]}/${partes[2]}/${partes[1]}`;
}

/** Valor do item: valor_total, senão valor_mercadoria, senão quantidade × unitário. */
function calcularValorItem(produto, quantidade) {
  let valor = Number(produto?.valor_total);

  if (!Number.isFinite(valor)) {
    valor = Number(produto?.valor_mercadoria);
  }

  if (!Number.isFinite(valor)) {
    const unitario = Number(produto?.valor_unitario ?? 0);

    valor = quantidade * unitario;
  }

  return valor;
}

/**
 * Uma linha por item de cada pedido (ou uma linha "sem item"), no formato
 * da tabela pedidos_omie. Pedido sem código válido é ignorado.
 */
export function normalizarPedidosParaBanco({
  pedidos,
  clientes,
  vendedores,
  etapas,
  sincronizadoEm,
}) {
  const linhas = [];

  for (const pedido of pedidos) {
    const cabecalho = pedido?.cabecalho ?? {};

    const info = pedido?.infoCadastro ?? {};

    const frete = pedido?.frete ?? {};

    const informacoes = pedido?.informacoes_adicionais ?? {};

    const codigoPedido = Number(cabecalho?.codigo_pedido);

    if (!Number.isFinite(codigoPedido) || codigoPedido <= 0) {
      continue;
    }

    const codigoCliente = Number(cabecalho?.codigo_cliente);

    const codigoClienteValido =
      Number.isFinite(codigoCliente) && codigoCliente > 0 ? codigoCliente : null;

    const codigoVendedor = Number(informacoes?.codVend);

    const codigoVendedorValido =
      Number.isFinite(codigoVendedor) && codigoVendedor > 0 ? codigoVendedor : null;

    const codigoEtapa = String(cabecalho?.etapa ?? "");

    /* Campos do pedido, iguais em todas as linhas dele (na ordem das colunas). */
    const dadosPedido = {
      codigo_pedido_omie: codigoPedido,

      numero_pedido: String(cabecalho?.numero_pedido ?? codigoPedido),

      codigo_cliente_omie: codigoClienteValido,

      cliente: codigoClienteValido
        ? clientes.get(codigoClienteValido) || `Cliente ${codigoClienteValido}`
        : "Cliente não identificado",

      data_pedido: converterDataOmieParaIso(info?.dInc),

      previsao: converterDataOmieParaIso(frete?.previsao_entrega || cabecalho?.data_previsao),
    };

    const dadosVendedor = {
      codigo_vendedor_omie: codigoVendedorValido,

      vendedor: codigoVendedorValido
        ? vendedores.get(codigoVendedorValido) || `Vendedor ${codigoVendedorValido}`
        : "-",
    };

    const dadosSituacao = {
      codigo_etapa: codigoEtapa,

      status: normalizarStatusExibicao(etapas.get(codigoEtapa) || "Pedido"),

      ativo: true,

      sincronizado_em: sincronizadoEm,

      atualizado_em: sincronizadoEm,
    };

    const itens = Array.isArray(pedido?.det) ? pedido.det : [];

    if (itens.length === 0) {
      linhas.push({
        chave_item: `${codigoPedido}:sem-item`,

        ...dadosPedido,

        item_sequencia: 0,

        codigo_produto: "",

        produto: "Sem item informado",

        quantidade: 0,

        unidade: "",

        ...dadosVendedor,

        valor: Number(pedido?.total_pedido?.valor_total_pedido ?? 0),

        ...dadosSituacao,
      });

      continue;
    }

    itens.forEach((item, indice) => {
      const ide = item?.ide ?? {};

      const produto = item?.produto ?? {};

      /*
       * O codigo_item é o identificador interno do item no Omie e é
       * preferível ao índice da lista.
       */
      const identificadorItem = ide?.codigo_item ?? ide?.codigo_item_integracao ?? indice + 1;

      const quantidade = Number(produto?.quantidade ?? 0);

      const valor = calcularValorItem(produto, quantidade);

      linhas.push({
        chave_item: `${codigoPedido}:${identificadorItem}`,

        ...dadosPedido,

        item_sequencia: indice + 1,

        codigo_produto: String(produto?.codigo_produto ?? ""),

        produto: produto?.descricao?.trim() || "Produto sem descrição",

        quantidade: Number.isFinite(quantidade) ? quantidade : 0,

        unidade: String(produto?.unidade ?? ""),

        ...dadosVendedor,

        valor: Number.isFinite(valor) ? valor : 0,

        ...dadosSituacao,
      });
    });
  }

  return linhas;
}

/** Linha da tabela pedidos_omie no formato usado pela tela de pedidos. */
export function mapearPedidoParaTela(registro, mapaNumeroPedidoExibicao) {
  return {
    id: registro.chave_item,

    codigoPedido: registro.codigo_pedido_omie,

    pedido: registro.numero_pedido,

    pedidoExibicao:
      mapaNumeroPedidoExibicao.get(Number(registro.codigo_pedido_omie)) || registro.numero_pedido,

    cliente: registro.cliente || "-",

    data: converterDataIsoParaBrasileira(registro.data_pedido),

    previsao: converterDataIsoParaBrasileira(registro.previsao),

    codigoProduto: registro.codigo_produto || "",

    produto: registro.produto || "",

    quantidade: Number(registro.quantidade ?? 0),

    unidade: registro.unidade || "",

    vendedor: registro.vendedor || "-",

    valor: Number(registro.valor ?? 0),

    codigoEtapa: registro.codigo_etapa || "",

    status: registro.status || "Pedido",
  };
}
