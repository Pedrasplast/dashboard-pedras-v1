export function normalizarValorOee(valor) {
  return String(valor ?? "").trim();
}

export function obterDataRegistroOee(item) {
  const valor =
    item?.lista_de_data ||
    item?.inicio ||
    item?.inicio_dia ||
    item?.data ||
    null;

  if (!valor) {
    return "";
  }

  const correspondencia = String(valor)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})/);

  return correspondencia
    ? `${correspondencia[1]}-${correspondencia[2]}-${correspondencia[3]}`
    : "";
}

export function registroEhParadaOee(item) {
  const tipo = normalizarValorOee(item?.tipo);
  return tipo === "1" || tipo === "2" || tipo === "3";
}

export function obterTiposDisponiveisOee(dados) {
  if (!Array.isArray(dados)) {
    return [];
  }

  const tipos = new Set();

  for (const item of dados) {
    const tipo = normalizarValorOee(item?.tipo);
    if (tipo === "1" || tipo === "2" || tipo === "3") {
      tipos.add(tipo);
    }
  }

  return [...tipos].sort((a, b) => Number(a) - Number(b));
}

export function obterProdutosDisponiveisOee(dados, filtros = {}) {
  if (!Array.isArray(dados)) {
    return [];
  }

  if (!filtros.injetora || filtros.injetora === "Todos") {
    return [];
  }

  const injetoraSelecionada = normalizarValorOee(
    filtros.injetora,
  ).toLocaleUpperCase("pt-BR");

  const produtos = new Set();

  for (const item of dados) {
    const injetoraRegistro = normalizarValorOee(
      item?.injetora,
    ).toLocaleUpperCase("pt-BR");

    if (injetoraRegistro !== injetoraSelecionada) {
      continue;
    }

    const dataRegistro = obterDataRegistroOee(item);

    if (
      filtros.dataInicio &&
      (!dataRegistro || dataRegistro < filtros.dataInicio)
    ) {
      continue;
    }

    if (
      filtros.dataFim &&
      (!dataRegistro || dataRegistro > filtros.dataFim)
    ) {
      continue;
    }

    const produto = normalizarValorOee(item?.cod_prod);
    if (produto) {
      produtos.add(produto);
    }
  }

  return [...produtos].sort((a, b) =>
    a.localeCompare(b, "pt-BR", {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

export function obterMateriasPrimasDisponiveisOee(dados) {
  if (!Array.isArray(dados)) {
    return [];
  }

  const materiasPrimas = new Set();

  for (const item of dados) {
    const mp = normalizarValorOee(item?.mp);
    if (mp) {
      materiasPrimas.add(mp);
    }
  }

  return [...materiasPrimas].sort((a, b) =>
    String(a).localeCompare(String(b), "pt-BR", {
      sensitivity: "base",
    }),
  );
}

export function filtrarDadosBaseOee(dados, filtros = {}) {
  if (!Array.isArray(dados)) {
    return [];
  }

  const injetoraSelecionada = normalizarValorOee(filtros.injetora);

  return dados.filter((item) => {
    const data = obterDataRegistroOee(item);

    if (filtros.dataInicio && (!data || data < filtros.dataInicio)) {
      return false;
    }

    if (filtros.dataFim && (!data || data > filtros.dataFim)) {
      return false;
    }

    if (
      filtros.injetora &&
      filtros.injetora !== "Todos" &&
      normalizarValorOee(item?.injetora) !== injetoraSelecionada
    ) {
      return false;
    }

    return true;
  });
}

export function filtrarDadosCalculoOee(dadosBaseOee, codigoProduto) {
  if (!Array.isArray(dadosBaseOee)) {
    return [];
  }

  if (!codigoProduto || codigoProduto === "Todos") {
    return dadosBaseOee;
  }

  const produtoSelecionado = normalizarValorOee(codigoProduto);

  return dadosBaseOee.filter(
    (item) =>
      registroEhParadaOee(item) ||
      normalizarValorOee(item?.cod_prod) === produtoSelecionado,
  );
}

export function filtrarHistoricoPerformanceOee(dados, injetora) {
  if (!Array.isArray(dados)) {
    return [];
  }

  if (!injetora || injetora === "Todos") {
    return dados;
  }

  const injetoraSelecionada = normalizarValorOee(injetora);

  return dados.filter(
    (item) => normalizarValorOee(item?.injetora) === injetoraSelecionada,
  );
}
