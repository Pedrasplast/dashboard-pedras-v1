
/* =========================================================
   CONVERSÃO NUMÉRICA
========================================================= */

export function numeroPreco(valor) {
  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
}

/* =========================================================
   FORMATAÇÃO MONETÁRIA
========================================================= */

export function formatarPreco(valor) {
  if (valor == null || valor === "") {
    return "—";
  }

  return numeroPreco(valor).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }
  );
}

/* =========================================================
   QUANTIDADE
========================================================= */

export function formatarQuantidadePreco(valor) {
  if (valor == null || valor === "") {
    return "—";
  }

  return numeroPreco(valor).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  );
}

/* =========================================================
   DATA
========================================================= */

export function formatarDataPreco(valor) {
  if (!valor) return "—";

  const data = new Date(
    `${String(valor).slice(0, 10)}T12:00:00`
  );

  if (Number.isNaN(data.getTime())) {
    return "—";
  }

  return data.toLocaleDateString("pt-BR");
}

/* =========================================================
   FILTRAR E ORDENAR
========================================================= */

export function filtrarTabelaPrecos(
  dados,
  filtros
) {
  const termo = String(
    filtros.busca ?? ""
  ).trim().toLocaleLowerCase("pt-BR");

  const resultado = (dados ?? []).filter(
    (item) => {
      if (!termo) return true;

      const conteudo = [
        item.codigo_produto,
        item.descricao,
        item.unidade,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return conteudo.includes(termo);
    }
  );

  return resultado.sort((a, b) => {
    switch (filtros.ordenacao) {
      case "ultima_compra":
        return String(b.ultima_compra ?? "")
          .localeCompare(
            String(a.ultima_compra ?? "")
          );

      case "maior_preco":
        return (
          numeroPreco(b.ultimo_preco) -
          numeroPreco(a.ultimo_preco)
        );

      case "menor_preco":
        return (
          numeroPreco(a.ultimo_preco) -
          numeroPreco(b.ultimo_preco)
        );

      default:
        return String(a.descricao ?? "")
          .localeCompare(
            String(b.descricao ?? ""),
            "pt-BR"
          );
    }
  });
}
