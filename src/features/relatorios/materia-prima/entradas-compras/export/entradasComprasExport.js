export function criarDadosExportacaoEntradasCompras(
  registros,
  resumo,
) {
  const linhas = registros.map((registro) => ({
    pedido:
      registro.pedido || "-",

    recebido:
      registro.situacao === "FUTURA"
        ? "A receber"
        : registro.recebido || "",

    emissao:
      registro.emissao || "",

    previsao_recebimento:
      registro.previsaoRecebimento || "",

    fornecedor_mp:
      registro.fornecedor || "-",

    material_mp:
      registro.material || "-",

    tipo:
      registro.tipo || "-",

    quantidade_kg:
      Number(registro.quantidadeKg ?? 0),

    preco:
      registro.preco,

    ipi:
      registro.ipiPercentual,

    total:
      Number(registro.total ?? 0),
  }));

  linhas.push({
    pedido:
      "TOTAL GERAL",

    recebido:
      "",

    emissao:
      "",

    previsao_recebimento:
      "",

    fornecedor_mp:
      "",

    material_mp:
      "",

    tipo:
      "",

    quantidade_kg:
      Number(resumo?.quantidadeKg ?? 0),

    preco:
      null,

    ipi:
      null,

    total:
      Number(resumo?.valorTotal ?? 0),
  });

  return linhas;
}


export async function exportarEntradasComprasPDF({
  relatorio,
  dados,
  textoFiltros,
}) {
  const {
    gerarPdfRelatorio,
  } = await import(
    "../../../exportacao/GerarPDF"
  );

  return gerarPdfRelatorio({
    relatorio,
    dados,
    textoFiltros,
  });
}


export async function exportarEntradasComprasExcel({
  relatorio,
  dados,
  textoFiltros,
}) {
  const {
    gerarExcelRelatorio,
  } = await import(
    "../../../exportacao/GerarExcel"
  );

  return gerarExcelRelatorio({
    relatorio,
    dados,
    textoFiltros,
  });
}