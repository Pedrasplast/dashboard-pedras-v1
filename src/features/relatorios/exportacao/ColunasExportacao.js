import { obterColunasRelatorio } from "../config/Colunas.config";

function criarColunaDescricaoProduto(formato) {
  const coluna = {
    chave: "descricao_produto",
    titulo: "Descrição do Produto",
    valor: (item) => item.descricao_produto || "-",
  };

  if (formato === "excel") {
    return {
      ...coluna,
      larguraExcel: 38,
      valorExcel: coluna.valor,
    };
  }

  return {
    ...coluna,
    larguraPdf: 48,
  };
}

export function obterColunasExportacao(relatorio, formato) {
  const colunas = [...obterColunasRelatorio(relatorio)];

  if (relatorio?.id !== "producao-produto") {
    return colunas;
  }

  if (colunas.some((coluna) => coluna.chave === "descricao_produto")) {
    return colunas;
  }

  const colunaDescricao = criarColunaDescricaoProduto(formato);
  const indiceProduto = colunas.findIndex((coluna) => coluna.chave === "produto");

  if (indiceProduto === -1) {
    colunas.unshift(colunaDescricao);
  } else {
    colunas.splice(indiceProduto + 1, 0, colunaDescricao);
  }

  return colunas;
}
