import { paraNumero } from "@/shared/lib/numeros";

export function prepararDespesasAcimaPrevisto(dados) {
  const lista = Array.isArray(dados) ? dados : [];

  return lista
    .filter((item) => {
      const tipo = String(item?.tipo_financeiro || item?.tipo || "")
        .trim()
        .toLowerCase();

      const previsto = paraNumero(item?.valor_previsto);

      const realizado = paraNumero(item?.valor_realizado);

      return tipo === "despesa" && realizado > previsto;
    })
    .map((item) => {
      const previsto = paraNumero(item?.valor_previsto);

      const realizado = paraNumero(item?.valor_realizado);

      const excesso = realizado - previsto;

      const excessoPercentual = previsto === 0 ? null : (excesso / Math.abs(previsto)) * 100;

      return {
        ...item,

        excesso_previsto: excesso,

        excesso_percentual: excessoPercentual,
      };
    })
    .sort((a, b) => paraNumero(b?.excesso_previsto) - paraNumero(a?.excesso_previsto));
}

export function obterMaiorExcesso(dados) {
  const lista = Array.isArray(dados) ? dados : [];

  if (lista.length === 0) {
    return null;
  }

  return lista.reduce((maior, item) => {
    if (!maior) {
      return item;
    }

    return paraNumero(item?.excesso_previsto) > paraNumero(maior?.excesso_previsto) ? item : maior;
  }, null);
}
