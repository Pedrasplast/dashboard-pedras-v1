/* =========================================================
   TABELA DE PREÇOS — FORMATAÇÃO E ORDENAÇÃO

   Preço de referência (período = 30, 45 ou 60 dias):
   - Média ponderada do período, quando disponível.
   - Caso contrário, último preço válido de compra.
   - Se ambos não existirem, preço indisponível.

   Nunca modifica os valores originais retornados pela API.
========================================================= */

export function numeroPreco(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

export function precoValido(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }
  const convertido = Number(valor);
  return Number.isFinite(convertido) && convertido > 0 ? convertido : null;
}

export function obterPrecoReferencia(item, dias = 30) {
  const media = precoValido(item?.[`preco_medio_${dias}d`] ?? item?.[`precoMedio${dias}d`]);
  const quantidade = numeroPreco(item?.[`quantidade_${dias}d`] ?? item?.[`quantidade${dias}d`]);
  const ultimo = precoValido(item?.ultimo_preco ?? item?.ultimoPreco);

  if (media !== null && quantidade > 0) {
    return { valor: media, origem: `media_${dias}d` };
  }
  if (ultimo !== null) {
    return { valor: ultimo, origem: "ultima_compra" };
  }
  return { valor: null, origem: "sem_preco" };
}


export function formatarPreco(valor) {
  if (valor == null || valor === "") {
    return "—";
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "—";
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}


export function formatarQuantidadePreco(valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  const valorNumerico = Number(valor);
  if (!Number.isFinite(valorNumerico)) return "—";
  return valorNumerico.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatarDataPreco(valor) {
  if (!valor) return "—";
  const dataTexto = String(valor).slice(0, 10);
  const data = /^\d{4}-\d{2}-\d{2}$/.test(dataTexto)
    ? new Date(`${dataTexto}T12:00:00`)
    : new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("pt-BR");
}

export function filtrarTabelaPrecos(dados, filtros = {}) {
  const dias = filtros.periodo ?? 30;
  const termo = String(filtros.busca ?? "").trim().toLocaleLowerCase("pt-BR");
  const registros = (Array.isArray(dados) ? dados : []).filter((item) => {
    if (!termo) return true;
    const conteudo = [item.codigo_produto, item.codigo_produto_omie, item.descricao, item.unidade]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return conteudo.includes(termo);
  });

  return registros.sort((a, b) => {
    switch (filtros.ordenacao) {
      case "ultima_compra":
        return String(b.ultima_compra ?? "").localeCompare(String(a.ultima_compra ?? ""));
      case "maior_preco":
        return numeroPreco(obterPrecoReferencia(b, dias).valor) - numeroPreco(obterPrecoReferencia(a, dias).valor);
      case "menor_preco":
        return numeroPreco(obterPrecoReferencia(a, dias).valor) - numeroPreco(obterPrecoReferencia(b, dias).valor);
      default:
        return String(a.descricao ?? "").localeCompare(String(b.descricao ?? ""), "pt-BR");
    }
  });
}
