export function contarRegistrosRelatorio(relatorio, dados = []) {
  if (!Array.isArray(dados)) return 0;
  if (relatorio?.id !== "pedidos-abertos") return dados.length;

  const numeros = new Set();
  for (const item of dados) {
    const numero = String(
      item?.pedido ?? item?.numero_pedido ?? item?.codigoPedido ?? item?.codigo_pedido ?? ""
    ).trim();
    if (numero) numeros.add(numero);
  }
  return numeros.size;
}

export function deveMostrarContagem(relatorio) {
  return relatorio?.exibicao?.mostrarContagem !== false;
}

function formatarDataFiltro(valor) {
  return String(valor).split("-").reverse().join("/");
}

export function montarTextoFiltros(relatorio, filtros) {
  if (relatorio?.tipoRelatorio === "custom" || relatorio?.fonteDados === "custom") {
    return "Filtros internos do relatório";
  }

  const lista = [];
  const configuracao = relatorio?.filtros || {};
  const pedidos = relatorio?.fonteDados === "pedidos";

  if (pedidos) {
    if (configuracao.cliente && filtros.cliente && filtros.cliente !== "todos") {
      lista.push(`Cliente: ${filtros.cliente}`);
    }
    if (configuracao.vendedor && filtros.vendedor && filtros.vendedor !== "todos") {
      lista.push(`Vendedor: ${filtros.vendedor}`);
    }
    if (configuracao.produto && filtros.cod_prod && filtros.cod_prod !== "Todos") {
      lista.push(`Produto: ${filtros.cod_prod}`);
    }
    if (configuracao.status && filtros.status) {
      lista.push(`Status: ${filtros.status === "todos" ? "Todos" : filtros.status}`);
    }
  } else {
    if (configuracao.injetora && filtros.injetora && filtros.injetora !== "Todos") {
      lista.push(`Injetora: ${filtros.injetora}`);
    }
    if (configuracao.produto && filtros.cod_prod && filtros.cod_prod !== "Todos") {
      lista.push(`Produto: ${filtros.cod_prod}`);
    }
    if (configuracao.mp && filtros.mp && filtros.mp !== "Todos") {
      lista.push(`MP: ${filtros.mp}`);
    }
    if (configuracao.tipo && Array.isArray(filtros.tipo) && filtros.tipo.length) {
      lista.push(`Tipo: ${filtros.tipo.join(", ")}`);
    }
  }

  if (configuracao.periodo && filtros.dataInicio) {
    lista.push(`De: ${formatarDataFiltro(filtros.dataInicio)}`);
  }
  if (configuracao.periodo && filtros.dataFim) {
    lista.push(`Até: ${formatarDataFiltro(filtros.dataFim)}`);
  }

  return lista.length ? lista.join(" | ") : "Sem filtros adicionais";
}
