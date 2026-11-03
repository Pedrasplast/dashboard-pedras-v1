export function compararPtBR(a, b, opcoes = {}) {
  return String(a).localeCompare(String(b), "pt-BR", {
    sensitivity: "base",
    ...opcoes,
  });
}

export function valoresUnicos(
  valores,
  {
    filtrar = (valor) => valor !== null && valor !== undefined && String(valor).trim() !== "",
  } = {},
) {
  if (!Array.isArray(valores)) {
    return [];
  }

  return [...new Set(valores.filter(filtrar))];
}

export function valoresUnicosOrdenados(
  valores,
  { filtrar, comparar = (a, b) => compararPtBR(a, b, { numeric: true }) } = {},
) {
  return valoresUnicos(valores, {
    ...(filtrar ? { filtrar } : {}),
  }).sort(comparar);
}

/** Novo Set com `valor` adicionado (se não estava) ou removido (se estava). */
export function alternarNoConjunto(conjunto, valor) {
  const proximo = new Set(conjunto);

  if (proximo.has(valor)) {
    proximo.delete(valor);
  } else {
    proximo.add(valor);
  }

  return proximo;
}
