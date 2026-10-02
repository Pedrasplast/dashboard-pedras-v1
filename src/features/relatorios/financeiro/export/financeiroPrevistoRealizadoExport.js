export function criarRelatorioFinanceiroExportacao(
  relatorio,
) {
  return {
    ...relatorio,

    colunas: Array.isArray(
      relatorio?.colunas,
    )
      ? relatorio.colunas.filter(
          (chave) =>
            chave !== "tipo_financeiro",
        )
      : [],
  };
}


export async function exportarFinanceiroPDF({
  relatorio,
  dados,
  textoFiltros,
  grupos,
}) {
  const {
    gerarPdfRelatorio,
  } = await import(
    "../../exportacao/GerarPDF"
  );

  return gerarPdfRelatorio({
    relatorio,
    dados,
    textoFiltros,
    grupos,
  });
}


export async function exportarFinanceiroExcel({
  relatorio,
  dados,
  textoFiltros,
  grupos,
}) {
  const {
    gerarExcelRelatorio,
  } = await import(
    "../../exportacao/GerarExcel"
  );

  return gerarExcelRelatorio({
    relatorio,
    dados,
    textoFiltros,
    grupos,
  });
}