import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { obterColunasExportacao } from "./ColunasExportacao";
import { COLUNAS_NUMERICAS } from "../utils/Visualizacao";


/* =========================================================
   CORES
========================================================= */

const CORES = {
  azulEscuro: "FF1E293B",
  azul: "FF2563EB",
  azulClaro: "FFEFF6FF",

  cinzaMuitoClaro: "FFF8FAFC",
  cinzaBorda: "FFE2E8F0",
  cinzaTexto: "FF64748B",

  branco: "FFFFFFFF",
  texto: "FF0F172A",
};

/*
 * Colunas cujo conteúdo é numérico/monetário/percentual.
 * Além das já usadas na pré-visualização em tela, inclui as
 * colunas financeiras (Previsto x Realizado por Categoria).
 */
const COLUNAS_ALINHADAS_DIREITA = new Set([
  ...COLUNAS_NUMERICAS,
  "valor_previsto",
  "valor_realizado",
  "variacao",
  "variacao_percentual",
]);

const COLUNAS_LARGAS = new Set([
  "descricao",
  "descricao_produto",
  "motivo",
  "justificativa",
  "categoria_financeira",
  "produto_pedido",
  "cliente",
  "pedidos_atendidos",
]);


/* =========================================================
   AUXILIARES
========================================================= */

function obterDataHoraEmissao() {
  return new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calcularLarguraColuna(coluna) {
  if (coluna.larguraExcel) {
    return Number(coluna.larguraExcel);
  }

  if (COLUNAS_LARGAS.has(coluna.chave)) {
    return 38;
  }

  const titulo = String(coluna.titulo || coluna.chave || "");

  return Math.max(14, Math.min(32, titulo.length + 10));
}

function obterValorCelula(coluna, item) {
  if (typeof coluna.valorExcel === "function") {
    return coluna.valorExcel(item);
  }

  if (typeof coluna.valor === "function") {
    return coluna.valor(item);
  }

  return "";
}


/* =========================================================
   CABEÇALHO DO RELATÓRIO
   (título + faixa + período/filtros/emissão)
========================================================= */

function criarCabecalhoRelatorio({ worksheet, relatorio, textoFiltros, totalColunas }) {
  const ultimaColuna = worksheet.getColumn(totalColunas).letter;

  /* TÍTULO */

  worksheet.mergeCells(`A1:${ultimaColuna}1`);

  const tituloCell = worksheet.getCell("A1");

  tituloCell.value = relatorio?.titulo || "Relatório";

  tituloCell.font = { bold: true, size: 16, color: { argb: CORES.texto } };

  tituloCell.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.getRow(1).height = 28;

  /* FAIXA DA CATEGORIA */

  worksheet.mergeCells(`A2:${ultimaColuna}2`);

  const faixa = worksheet.getCell("A2");

  faixa.value = String(relatorio?.categoria || "Relatório").toUpperCase();

  faixa.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES.azul } };

  faixa.font = { bold: true, color: { argb: CORES.branco }, size: 9 };

  faixa.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.getRow(2).height = 21;

  /* INFORMAÇÕES */

  worksheet.mergeCells(`A3:${ultimaColuna}3`);

  const info = worksheet.getCell("A3");

  info.value = `Filtros: ${textoFiltros || "Sem filtros adicionais"}   •   Emitido em: ${obterDataHoraEmissao()}`;

  info.font = { size: 9, bold: true, color: { argb: CORES.cinzaTexto } };

  info.alignment = { vertical: "middle", horizontal: "left", wrapText: true };

  worksheet.getRow(3).height = 21;

  worksheet.getRow(4).height = 8;

  return 5;
}


/* =========================================================
   CABEÇALHO DA TABELA
========================================================= */

function escreverCabecalhoTabela({ worksheet, linha, colunas }) {
  colunas.forEach((coluna, indice) => {
    const cell = worksheet.getCell(linha, indice + 1);

    cell.value = coluna.titulo || coluna.chave;

    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES.azulEscuro } };

    cell.font = { bold: true, color: { argb: CORES.branco }, size: 10 };

    cell.alignment = {
      vertical: "middle",
      horizontal: COLUNAS_ALINHADAS_DIREITA.has(coluna.chave) ? "right" : "left",
      wrapText: true,
    };

    cell.border = { bottom: { style: "thin", color: { argb: "FF334155" } } };
  });

  worksheet.getRow(linha).height = 24;
}


/* =========================================================
   LINHAS DE DADOS
========================================================= */

function escreverLinhasDados({ worksheet, linhaInicial, colunas, dados }) {
  let linhaAtual = linhaInicial;

  dados.forEach((item, indice) => {
    colunas.forEach((coluna, indiceColuna) => {
      const cell = worksheet.getCell(linhaAtual, indiceColuna + 1);

      cell.value = obterValorCelula(coluna, item);

      cell.font = { size: 9.5, color: { argb: CORES.texto } };

      cell.alignment = {
        vertical: "middle",
        horizontal: COLUNAS_ALINHADAS_DIREITA.has(coluna.chave) ? "right" : "left",
      };

      cell.border = { bottom: { style: "thin", color: { argb: CORES.cinzaBorda } } };

      if (indice % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES.cinzaMuitoClaro } };
      }
    });

    worksheet.getRow(linhaAtual).height = 20;

    linhaAtual += 1;
  });

  return linhaAtual;
}


/* =========================================================
   FAIXA DE GRUPO
   (usada quando o relatório separa os dados em blocos,
   como Receitas / Despesas no Financeiro)
========================================================= */

function escreverFaixaGrupo({ worksheet, linha, titulo, quantidade, totalColunas }) {
  const ultimaColuna = worksheet.getColumn(totalColunas).letter;

  worksheet.mergeCells(`A${linha}:${ultimaColuna}${linha}`);

  const cell = worksheet.getCell(`A${linha}`);

  cell.value = `${String(titulo || "").toUpperCase()}  (${quantidade} registro${quantidade === 1 ? "" : "s"})`;

  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CORES.azulClaro } };

  cell.font = { bold: true, color: { argb: CORES.azul }, size: 10 };

  cell.alignment = { vertical: "middle", horizontal: "left" };

  worksheet.getRow(linha).height = 22;
}


/* =====================================================
   GERADOR DE EXCEL
===================================================== */

export async function gerarExcelRelatorio({ relatorio, dados, textoFiltros, grupos }) {
  if (!relatorio) {
    return;
  }

  if (!Array.isArray(dados) || dados.length === 0) {
    alert("Nenhum dado encontrado com os filtros selecionados.");

    return;
  }

  try {
    const colunas = obterColunasExportacao(relatorio, "excel");

    if (colunas.length === 0) {
      alert("Nenhuma coluna configurada para este relatório.");

      return;
    }

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Pedrasplast";
    workbook.company = "Pedrasplast";
    workbook.subject = relatorio.titulo;
    workbook.title = relatorio.titulo;
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Relatório", {
      views: [{ showGridLines: false }],
    });

    worksheet.columns = colunas.map((coluna) => ({ width: calcularLarguraColuna(coluna) }));

    const linhaCabecalhoTabela = criarCabecalhoRelatorio({
      worksheet,
      relatorio,
      textoFiltros,
      totalColunas: colunas.length,
    });

    /* =================================================
       GRUPOS (ex.: Receitas / Despesas no Financeiro)
    ================================================= */

    const gruposValidos = Array.isArray(grupos)
      ? grupos.filter((grupo) => Array.isArray(grupo?.dados) && grupo.dados.length > 0)
      : [];

    if (gruposValidos.length > 0) {
      let linhaAtual = linhaCabecalhoTabela;

      gruposValidos.forEach((grupo) => {
        escreverFaixaGrupo({
          worksheet,
          linha: linhaAtual,
          titulo: grupo.titulo,
          quantidade: grupo.dados.length,
          totalColunas: colunas.length,
        });

        linhaAtual += 1;

        escreverCabecalhoTabela({ worksheet, linha: linhaAtual, colunas });

        linhaAtual += 1;

        linhaAtual = escreverLinhasDados({
          worksheet,
          linhaInicial: linhaAtual,
          colunas,
          dados: grupo.dados,
        });

        worksheet.getRow(linhaAtual).height = 10;

        linhaAtual += 1;
      });

      worksheet.views = [
        { state: "frozen", ySplit: linhaCabecalhoTabela - 1, showGridLines: false },
      ];
    } else {
      escreverCabecalhoTabela({ worksheet, linha: linhaCabecalhoTabela, colunas });

      const ultimaLinha = escreverLinhasDados({
        worksheet,
        linhaInicial: linhaCabecalhoTabela + 1,
        colunas,
        dados,
      }) - 1;

      worksheet.autoFilter = {
        from: { row: linhaCabecalhoTabela, column: 1 },
        to: { row: ultimaLinha, column: colunas.length },
      };

      worksheet.views = [
        { state: "frozen", ySplit: linhaCabecalhoTabela, showGridLines: false },
      ];
    }

    /* =================================================
       DOWNLOAD
    ================================================= */

    const buffer = await workbook.xlsx.writeBuffer();

    const nomeArquivo = `${relatorio.id}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, nomeArquivo);
  } catch (erro) {
    console.error("Erro ao gerar Excel:", erro);

    alert("Não foi possível gerar o arquivo Excel.");
  }
}
