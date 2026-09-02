import {
  formatarData,
  formatarKg,
  formatarNumero,
} from "./relatorioConsumo.utils";


function nomeArquivo(prefixo, extensao) {
  return `${prefixo}_${new Date().toISOString().slice(0, 10)}.${extensao}`;
}


/* =========================================================
   EXCEL
========================================================= */

async function carregarExcelJS() {
  const modulo = await import("exceljs");

  return modulo.default || modulo;
}


async function baixarWorkbook(workbook, arquivo) {
  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = arquivo;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}


const CORES_EXCEL = {
  azulEscuro: "FF1E293B",
  azul: "FF2563EB",
  ambar: "FFD97706",
  ambarClaro: "FFFFFBEB",
  ambarTexto: "FF92400E",

  cinzaMuitoClaro: "FFF8FAFC",
  cinzaBorda: "FFE2E8F0",
  cinzaTexto: "FF64748B",

  branco: "FFFFFFFF",
  texto: "FF0F172A",
};


function criarCabecalhoExcel({ worksheet, titulo, periodo, totalColunas }) {
  const ultimaColuna = worksheet.getColumn(totalColunas).letter;

  worksheet.mergeCells(`A1:${ultimaColuna}1`);

  const tituloCell = worksheet.getCell("A1");

  tituloCell.value = titulo;

  tituloCell.font = { bold: true, size: 16, color: { argb: CORES_EXCEL.texto } };

  tituloCell.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.getRow(1).height = 28;

  worksheet.mergeCells(`A2:${ultimaColuna}2`);

  const faixa = worksheet.getCell("A2");

  faixa.value = "MATÉRIA-PRIMA";

  faixa.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES_EXCEL.azul } };

  faixa.font = { bold: true, color: { argb: CORES_EXCEL.branco }, size: 9 };

  faixa.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.getRow(2).height = 21;

  worksheet.mergeCells(`A3:${ultimaColuna}3`);

  const info = worksheet.getCell("A3");

  info.value = `Período: ${formatarData(periodo.dataInicial)} até ${formatarData(periodo.dataFinal)}   •   Emitido em: ${new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;

  info.font = { size: 9, bold: true, color: { argb: CORES_EXCEL.cinzaTexto } };

  info.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.getRow(3).height = 21;

  worksheet.getRow(4).height = 8;

  return 5;
}


function escreverCabecalhoTabelaExcel({ worksheet, linha, colunas }) {
  colunas.forEach((coluna, indice) => {
    const cell = worksheet.getCell(linha, indice + 1);

    cell.value = coluna.titulo;

    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES_EXCEL.azulEscuro } };

    cell.font = { bold: true, color: { argb: CORES_EXCEL.branco }, size: 10 };

    cell.alignment = {
      vertical: "middle",
      horizontal: coluna.numerica ? "right" : "left",
    };

    cell.border = { bottom: { style: "thin", color: { argb: "FF334155" } } };
  });

  worksheet.getRow(linha).height = 22;
}


function escreverLinhasTabelaExcel({ worksheet, linhaInicial, colunas, dados }) {
  let linhaAtual = linhaInicial;

  dados.forEach((item, indice) => {
    colunas.forEach((coluna, indiceColuna) => {
      const cell = worksheet.getCell(linhaAtual, indiceColuna + 1);

      cell.value = coluna.valor(item);

      cell.font = { size: 9.5, color: { argb: CORES_EXCEL.texto } };

      cell.alignment = {
        vertical: "middle",
        horizontal: coluna.numerica ? "right" : "left",
      };

      cell.border = { bottom: { style: "thin", color: { argb: CORES_EXCEL.cinzaBorda } } };

      if (indice % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES_EXCEL.cinzaMuitoClaro } };
      }
    });

    worksheet.getRow(linhaAtual).height = 20;

    linhaAtual += 1;
  });

  return linhaAtual;
}


function escreverLinhaTotalExcel({ worksheet, linha, colunas, valores }) {
  colunas.forEach((coluna, indice) => {
    const cell = worksheet.getCell(linha, indice + 1);

    cell.value = valores[indice] ?? "";

    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };

    cell.font = { bold: true, color: { argb: CORES_EXCEL.azul }, size: 10 };

    cell.alignment = {
      vertical: "middle",
      horizontal: coluna.numerica ? "right" : "left",
    };

    cell.border = { top: { style: "thin", color: { argb: "FFBFDBFE" } } };
  });

  worksheet.getRow(linha).height = 22;
}


function escreverNotaExcel({ worksheet, linha, texto, totalColunas }) {
  const ultimaColuna = worksheet.getColumn(totalColunas).letter;

  worksheet.mergeCells(`A${linha}:${ultimaColuna}${linha}`);

  const cell = worksheet.getCell(`A${linha}`);

  cell.value = texto;

  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES_EXCEL.ambarClaro } };

  cell.font = { bold: true, color: { argb: CORES_EXCEL.ambarTexto }, size: 9 };

  cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };

  worksheet.getRow(linha).height = 20;
}


/* =========================================================
   EXCEL - FORNECEDORES
========================================================= */

export async function exportarExcelConsumoFornecedor({ dados, dataInicial, dataFinal }) {
  if (!dados?.porFornecedor?.length) {
    window.alert("Não existem dados para exportar.");

    return;
  }

  const ExcelJS = await carregarExcelJS();

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Pedrasplast";
  workbook.company = "Pedrasplast";
  workbook.subject = "Consumo Programado por Fornecedor";
  workbook.title = "Consumo Programado por Fornecedor";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Consumo por Fornecedor", {
    views: [{ showGridLines: false }],
  });

  const colunas = [
    { titulo: "Fornecedor", largura: 34, numerica: false, valor: (g) => g.fornecedorNome },
    { titulo: "Injetoras", largura: 14, numerica: true, valor: (g) => formatarNumero(g.quantidadeInjetoras) },
    { titulo: "Produtos", largura: 14, numerica: true, valor: (g) => formatarNumero(g.quantidadeProdutos) },
    { titulo: "Programações", largura: 16, numerica: true, valor: (g) => formatarNumero(g.quantidadeProgramacoes) },
    { titulo: "Consumo PP", largura: 20, numerica: true, valor: (g) => formatarKg(g.consumoKg) },
  ];

  worksheet.columns = colunas.map((coluna) => ({ width: coluna.largura }));

  const linhaTabela = criarCabecalhoExcel({
    worksheet,
    titulo: "Consumo Programado por Fornecedor",
    periodo: { dataInicial, dataFinal },
    totalColunas: colunas.length,
  });

  escreverCabecalhoTabelaExcel({ worksheet, linha: linhaTabela, colunas });

  let linhaAtual = escreverLinhasTabelaExcel({
    worksheet,
    linhaInicial: linhaTabela + 1,
    colunas,
    dados: dados.porFornecedor,
  });

  escreverLinhaTotalExcel({
    worksheet,
    linha: linhaAtual,
    colunas,
    valores: [
      "TOTAL",
      "",
      "",
      formatarNumero(dados.resumo.programacoes),
      formatarKg(dados.resumo.consumoDistribuidoKg),
    ],
  });

  linhaAtual += 1;

  worksheet.autoFilter = {
    from: { row: linhaTabela, column: 1 },
    to: { row: linhaAtual - 2, column: colunas.length },
  };

  if (dados.resumo.consumoSemReceitaKg > 0) {
    linhaAtual += 1;

    escreverNotaExcel({
      worksheet,
      linha: linhaAtual,
      totalColunas: colunas.length,
      texto: `Consumo sem receita configurada: ${formatarKg(dados.resumo.consumoSemReceitaKg)} — ainda não distribuído entre fornecedores.`,
    });
  }

  worksheet.views = [{ state: "frozen", ySplit: linhaTabela, showGridLines: false }];

  await baixarWorkbook(workbook, nomeArquivo("Consumo_Programado_por_Fornecedor", "xlsx"));
}


/* =========================================================
   EXCEL - INJETORAS
========================================================= */

export async function exportarExcelConsumoInjetora({ dados, dataInicial, dataFinal }) {
  if (!dados?.porInjetora?.length) {
    window.alert("Não existem dados para exportar.");

    return;
  }

  const ExcelJS = await carregarExcelJS();

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Pedrasplast";
  workbook.company = "Pedrasplast";
  workbook.subject = "Consumo Programado por Injetora";
  workbook.title = "Consumo Programado por Injetora";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Consumo por Injetora", {
    views: [{ showGridLines: false }],
  });

  const colunas = [
    { titulo: "Injetora", largura: 16, numerica: false, valor: (g) => `Injetora ${g.injetora}` },
    { titulo: "Programações", largura: 16, numerica: true, valor: (g) => formatarNumero(g.quantidadeProgramacoes) },
    { titulo: "Horas", largura: 14, numerica: true, valor: (g) => formatarNumero(g.horasProgramadas, 2) },
    { titulo: "Ciclos", largura: 14, numerica: true, valor: (g) => formatarNumero(g.ciclosCompletos) },
    { titulo: "Peças", largura: 14, numerica: true, valor: (g) => formatarNumero(g.pecasPrevistas) },
    { titulo: "Consumo PP", largura: 20, numerica: true, valor: (g) => formatarKg(g.consumoTotalKg) },
  ];

  worksheet.columns = colunas.map((coluna) => ({ width: coluna.largura }));

  const linhaTabela = criarCabecalhoExcel({
    worksheet,
    titulo: "Consumo Programado por Injetora",
    periodo: { dataInicial, dataFinal },
    totalColunas: colunas.length,
  });

  escreverCabecalhoTabelaExcel({ worksheet, linha: linhaTabela, colunas });

  let linhaAtual = escreverLinhasTabelaExcel({
    worksheet,
    linhaInicial: linhaTabela + 1,
    colunas,
    dados: dados.porInjetora,
  });

  escreverLinhaTotalExcel({
    worksheet,
    linha: linhaAtual,
    colunas,
    valores: [
      "TOTAL",
      formatarNumero(dados.resumo.programacoes),
      formatarNumero(dados.resumo.horasProgramadas, 2),
      formatarNumero(dados.resumo.ciclosCompletos),
      formatarNumero(dados.resumo.pecasPrevistas),
      formatarKg(dados.resumo.consumoTotalKg),
    ],
  });

  linhaAtual += 1;

  worksheet.autoFilter = {
    from: { row: linhaTabela, column: 1 },
    to: { row: linhaAtual - 2, column: colunas.length },
  };

  if (dados.resumo.programacoesSemReceita > 0) {
    linhaAtual += 1;

    escreverNotaExcel({
      worksheet,
      linha: linhaAtual,
      totalColunas: colunas.length,
      texto: `${formatarNumero(dados.resumo.programacoesSemReceita)} programação(ões) com receita pendente — ${formatarKg(dados.resumo.consumoSemReceitaKg)} ainda não distribuído entre fornecedores.`,
    });
  }

  worksheet.views = [{ state: "frozen", ySplit: linhaTabela, showGridLines: false }];

  await baixarWorkbook(workbook, nomeArquivo("Consumo_Programado_por_Injetora", "xlsx"));
}


/* =========================================================
   PDF
========================================================= */

async function carregarJsPdf() {
  const modulo = await import("jspdf");

  return modulo.jsPDF || modulo.default;
}


function iniciarDocumentoPdf(JsPDF, { titulo, dataInicial, dataFinal }) {
  const doc = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const margem = 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(titulo.toUpperCase(), margem, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Período: ${formatarData(dataInicial)} até ${formatarData(dataFinal)}   •   Emitido em ${new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    margem,
    20,
  );

  return { doc, margem, y: 28 };
}


function desenharTabelaPdf(contexto, { colunas, dados, valoresTotal }) {
  const { doc, margem } = contexto;

  let xAtual = margem;

  const colunasPosicionadas = colunas.map((coluna) => {
    const posicionada = { ...coluna, x: xAtual };

    xAtual += coluna.largura;

    return posicionada;
  });

  const alturaCabecalho = 8;
  const alturaLinha = 7;
  const pageHeight = doc.internal.pageSize.getHeight();

  const desenharCabecalho = () => {
    colunasPosicionadas.forEach((coluna) => {
      doc.setFillColor(30, 41, 59);
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.2);
      doc.rect(coluna.x, contexto.y, coluna.largura, alturaCabecalho, "FD");
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);

    colunasPosicionadas.forEach((coluna) => {
      const alinhamento = coluna.numerica ? "right" : "left";
      const x = coluna.numerica ? coluna.x + coluna.largura - 2 : coluna.x + 2;

      doc.text(coluna.titulo, x, contexto.y + 5.5, { align: alinhamento });
    });

    contexto.y += alturaCabecalho;
  };

  desenharCabecalho();

  dados.forEach((item, indice) => {
    if (contexto.y + alturaLinha > pageHeight - 18) {
      doc.addPage();

      contexto.y = 14;

      desenharCabecalho();
    }

    const linhaPar = indice % 2 === 0;

    colunasPosicionadas.forEach((coluna) => {
      doc.setFillColor(...(linhaPar ? [248, 250, 252] : [255, 255, 255]));
      doc.setDrawColor(222, 228, 236);
      doc.setLineWidth(0.15);
      doc.rect(coluna.x, contexto.y, coluna.largura, alturaLinha, "FD");
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.4);
    doc.setTextColor(51, 65, 85);

    colunasPosicionadas.forEach((coluna) => {
      const alinhamento = coluna.numerica ? "right" : "left";
      const x = coluna.numerica ? coluna.x + coluna.largura - 2 : coluna.x + 2;

      doc.text(String(coluna.valor(item)), x, contexto.y + 4.8, { align: alinhamento });
    });

    contexto.y += alturaLinha;
  });

  if (contexto.y + alturaLinha > pageHeight - 18) {
    doc.addPage();

    contexto.y = 14;
  }

  colunasPosicionadas.forEach((coluna, indice) => {
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.2);
    doc.rect(coluna.x, contexto.y, coluna.largura, alturaLinha, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.4);
    doc.setTextColor(29, 78, 216);

    const alinhamento = coluna.numerica ? "right" : "left";
    const x = coluna.numerica ? coluna.x + coluna.largura - 2 : coluna.x + 2;

    doc.text(String(valoresTotal[indice] ?? ""), x, contexto.y + 4.8, { align: alinhamento });
  });

  contexto.y += alturaLinha + 7;
}


function desenharNotaPdf(contexto, texto) {
  const { doc, margem } = contexto;

  const largura = doc.internal.pageSize.getWidth() - margem * 2;

  const linhas = doc.splitTextToSize(texto, largura - 8);

  const altura = Math.max(10, linhas.length * 4 + 6);

  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(253, 230, 138);
  doc.setLineWidth(0.2);
  doc.roundedRect(margem, contexto.y, largura, altura, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(146, 64, 14);
  doc.text(linhas, margem + 4, contexto.y + 5.5);

  contexto.y += altura + 4;
}


function finalizarPdf(doc) {
  const totalPaginas = doc.getNumberOfPages();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${pagina} de ${totalPaginas}`, pageWidth - 12, pageHeight - 6, {
      align: "right",
    });
  }
}


/* =========================================================
   PDF - FORNECEDORES
========================================================= */

export async function exportarPdfConsumoFornecedor({ dados, dataInicial, dataFinal }) {
  if (!dados?.porFornecedor?.length) {
    window.alert("Não existem dados para exportar.");

    return;
  }

  const JsPDF = await carregarJsPdf();

  const contexto = iniciarDocumentoPdf(JsPDF, {
    titulo: "Consumo Programado por Fornecedor",
    dataInicial,
    dataFinal,
  });

  const colunas = [
    { titulo: "Fornecedor", largura: 85, numerica: false, valor: (g) => g.fornecedorNome },
    { titulo: "Injetoras", largura: 32, numerica: true, valor: (g) => formatarNumero(g.quantidadeInjetoras) },
    { titulo: "Produtos", largura: 32, numerica: true, valor: (g) => formatarNumero(g.quantidadeProdutos) },
    { titulo: "Programações", largura: 38, numerica: true, valor: (g) => formatarNumero(g.quantidadeProgramacoes) },
    { titulo: "Consumo PP", largura: 42, numerica: true, valor: (g) => formatarKg(g.consumoKg) },
  ];

  desenharTabelaPdf(contexto, {
    colunas,
    dados: dados.porFornecedor,
    valoresTotal: [
      "TOTAL",
      "",
      "",
      formatarNumero(dados.resumo.programacoes),
      formatarKg(dados.resumo.consumoDistribuidoKg),
    ],
  });

  if (dados.resumo.consumoSemReceitaKg > 0) {
    desenharNotaPdf(
      contexto,
      `Consumo sem receita configurada: ${formatarKg(dados.resumo.consumoSemReceitaKg)} — ainda não distribuído entre fornecedores.`,
    );
  }

  finalizarPdf(contexto.doc);

  contexto.doc.save(nomeArquivo("Consumo_Programado_por_Fornecedor", "pdf"));
}


/* =========================================================
   PDF - INJETORAS
========================================================= */

export async function exportarPdfConsumoInjetora({ dados, dataInicial, dataFinal }) {
  if (!dados?.porInjetora?.length) {
    window.alert("Não existem dados para exportar.");

    return;
  }

  const JsPDF = await carregarJsPdf();

  const contexto = iniciarDocumentoPdf(JsPDF, {
    titulo: "Consumo Programado por Injetora",
    dataInicial,
    dataFinal,
  });

  const colunas = [
    { titulo: "Injetora", largura: 42, numerica: false, valor: (g) => `Injetora ${g.injetora}` },
    { titulo: "Programações", largura: 38, numerica: true, valor: (g) => formatarNumero(g.quantidadeProgramacoes) },
    { titulo: "Horas", largura: 32, numerica: true, valor: (g) => formatarNumero(g.horasProgramadas, 2) },
    { titulo: "Ciclos", largura: 32, numerica: true, valor: (g) => formatarNumero(g.ciclosCompletos) },
    { titulo: "Peças", largura: 32, numerica: true, valor: (g) => formatarNumero(g.pecasPrevistas) },
    { titulo: "Consumo PP", largura: 42, numerica: true, valor: (g) => formatarKg(g.consumoTotalKg) },
  ];

  desenharTabelaPdf(contexto, {
    colunas,
    dados: dados.porInjetora,
    valoresTotal: [
      "TOTAL",
      formatarNumero(dados.resumo.programacoes),
      formatarNumero(dados.resumo.horasProgramadas, 2),
      formatarNumero(dados.resumo.ciclosCompletos),
      formatarNumero(dados.resumo.pecasPrevistas),
      formatarKg(dados.resumo.consumoTotalKg),
    ],
  });

  if (dados.resumo.programacoesSemReceita > 0) {
    desenharNotaPdf(
      contexto,
      `${formatarNumero(dados.resumo.programacoesSemReceita)} programação(ões) com receita pendente — ${formatarKg(dados.resumo.consumoSemReceitaKg)} ainda não distribuído entre fornecedores.`,
    );
  }

  finalizarPdf(contexto.doc);

  contexto.doc.save(nomeArquivo("Consumo_Programado_por_Injetora", "pdf"));
}
