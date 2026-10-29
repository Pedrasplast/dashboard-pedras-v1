import { criarAbaHistorico } from "./excel/abaHistorico";
import { criarAbaResumo } from "./excel/abaResumo";

/* =========================================================
   EXPORTAÇÃO EXCEL - PEDIDOS ALTERADOS

   ABAS (pasta excel/):
   1) Resumo Gerencial
   2) Histórico Expandido
========================================================= */

function obterNomeArquivo() {
  const data = new Date().toISOString().slice(0, 10);

  return `Pedidos_Alterados_${data}.xlsx`;
}

function baixarArquivo(buffer, nomeArquivo) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = nomeArquivo;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);
}

export async function exportarExcelPedidosAlterados({
  pedidos,
  dataInicial,
  dataFinal,
  pesquisa,
  extrairMudancas,
  formatarDataHora,
}) {
  if (!Array.isArray(pedidos) || pedidos.length === 0) {
    window.alert("Não existem dados para exportar.");

    return;
  }

  try {
    const moduloExcel = await import("exceljs");

    const ExcelJS = moduloExcel.default || moduloExcel;

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Pedrasplast";

    workbook.company = "Pedrasplast";

    workbook.subject = "Relatório de Pedidos Alterados";

    workbook.title = "Pedidos Alterados";

    workbook.created = new Date();

    const parametros = { workbook, pedidos, dataInicial, dataFinal, pesquisa, formatarDataHora };

    criarAbaResumo(parametros);

    criarAbaHistorico({ ...parametros, extrairMudancas });

    const buffer = await workbook.xlsx.writeBuffer();

    baixarArquivo(buffer, obterNomeArquivo());
  } catch (erro) {
    /* Mostra o erro verdadeiro no console, para diagnóstico. */
    console.error("ERRO AO GERAR EXCEL:", erro);

    window.alert(`Não foi possível gerar o Excel.\n\n${erro?.message || "Erro desconhecido"}`);
  }
}
