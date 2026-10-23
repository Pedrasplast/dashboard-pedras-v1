/* =========================================================
   PADRÃO VISUAL DOS EXCELs DE RELATÓRIO — versão 4 (23/10)
   Mesmas cores do gerador comum (GerarExcel).
========================================================= */

export const COR_EXCEL = Object.freeze({
  azul: "FF0B1F5C",
  azulCabecalho: "FFE8EEFC",
  bordaCabecalho: "FFD6DEF0",
  verde: "FF16A34A",
  verdeTexto: "FF15803D",
  verdeFundo: "FFF0FDF4",
  texto: "FF0F172A",
  texto2: "FF64748B",
  zebra: "FFF8FAFC",
  borda: "FFE2E8F0",
});

/** Título (linha 1) e informações (linhas seguintes), mesclados até a última coluna. */
export function escreverTituloExcel(worksheet, { titulo, categoria, informacoes = [], totalColunas }) {
  const ultima = worksheet.getColumn(Math.max(1, totalColunas)).letter;
  let linha = 1;

  worksheet.mergeCells(`A${linha}:${ultima}${linha}`);
  const celTitulo = worksheet.getCell(`A${linha}`);
  celTitulo.value = titulo;
  celTitulo.font = { bold: true, size: 16, color: { argb: COR_EXCEL.azul } };
  celTitulo.alignment = { vertical: "middle", horizontal: "left" };
  worksheet.getRow(linha).height = 28;
  linha += 1;

  if (categoria) {
    worksheet.mergeCells(`A${linha}:${ultima}${linha}`);
    const cel = worksheet.getCell(`A${linha}`);
    cel.value = String(categoria).toUpperCase();
    cel.font = { bold: true, size: 9, color: { argb: COR_EXCEL.verdeTexto } };
    cel.border = { bottom: { style: "medium", color: { argb: COR_EXCEL.verde } } };
    worksheet.getRow(linha).height = 20;
    linha += 1;
  }

  for (const info of informacoes.filter(Boolean)) {
    worksheet.mergeCells(`A${linha}:${ultima}${linha}`);
    const cel = worksheet.getCell(`A${linha}`);
    cel.value = info;
    cel.font = { size: 9, bold: true, color: { argb: COR_EXCEL.texto2 } };
    cel.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    worksheet.getRow(linha).height = 20;
    linha += 1;
  }

  worksheet.getRow(linha).height = 6;
  return linha + 1;
}

/** Linha de títulos das colunas no padrão (azul-claro, texto azul-marinho). */
export function estilizarCabecalhoExcel(worksheet, linha, totalColunas) {
  for (let coluna = 1; coluna <= totalColunas; coluna += 1) {
    const cel = worksheet.getCell(linha, coluna);
    cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_EXCEL.azulCabecalho } };
    cel.font = { bold: true, size: 10, color: { argb: COR_EXCEL.azul } };
    cel.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cel.border = { bottom: { style: "thin", color: { argb: COR_EXCEL.bordaCabecalho } } };
  }
  worksheet.getRow(linha).height = 24;
}

/** Linhas de dados: borda fina e linhas alternadas. */
export function estilizarLinhasExcel(worksheet, primeira, ultima, totalColunas) {
  for (let linha = primeira; linha <= ultima; linha += 1) {
    for (let coluna = 1; coluna <= totalColunas; coluna += 1) {
      const cel = worksheet.getCell(linha, coluna);
      cel.font = { size: 9.5, color: { argb: COR_EXCEL.texto }, ...(cel.font || {}) };
      cel.alignment = { vertical: "top", wrapText: true, ...(cel.alignment || {}) };
      cel.border = { bottom: { style: "thin", color: { argb: COR_EXCEL.borda } } };
      if ((linha - primeira) % 2 === 1) {
        cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COR_EXCEL.zebra } };
      }
    }
  }
}
