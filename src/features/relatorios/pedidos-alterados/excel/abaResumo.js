import { estilizarCabecalhoExcel } from "@/features/relatorios/exportacao/padraoExcel";

import {
  CORES,
  alinhamentoEsquerda,
  bordaInferior,
  criarCabecalhoRelatorio,
  preenchimento,
} from "./estiloExcelPedidosAlterados";
import { CABECALHOS_RESUMO, montarValoresResumo } from "./linhasExcelPedidosAlterados";

const LINHA_CABECALHO = 5;

const LARGURAS = { A: 13, B: 38, C: 24, D: 22, E: 22, F: 15, G: 42 };

/** Aba "Resumo": uma linha por pedido, com zebra e autofiltro. */
export function criarAbaResumo({
  workbook,
  pedidos,
  dataInicial,
  dataFinal,
  pesquisa,
  formatarDataHora,
}) {
  const worksheet = workbook.addWorksheet("Resumo", {
    views: [
      {
        state: "frozen",

        ySplit: 5,

        showGridLines: false,
      },
    ],
  });

  criarCabecalhoRelatorio({
    worksheet,

    titulo: "Pedidos Alterados",

    ultimaColuna: "G",

    dataInicial,

    dataFinal,

    pesquisa,
  });

  CABECALHOS_RESUMO.forEach((titulo, indice) => {
    worksheet.getCell(LINHA_CABECALHO, indice + 1).value = titulo;
  });

  /* Apenas A5:G5 é pintado. */
  estilizarCabecalhoExcel(worksheet, LINHA_CABECALHO, CABECALHOS_RESUMO.length);

  let linhaAtual = LINHA_CABECALHO + 1;

  pedidos.forEach((pedido, indice) => {
    const valores = montarValoresResumo(pedido, formatarDataHora);

    valores.forEach((valor, posicao) => {
      const cell = worksheet.getCell(linhaAtual, posicao + 1);

      cell.value = valor;

      cell.font = {
        size: 9,

        color: {
          argb: CORES.texto,
        },
      };

      cell.alignment = alinhamentoEsquerda();

      cell.border = bordaInferior();

      if (indice % 2 === 1) {
        cell.fill = preenchimento(CORES.cinzaMuitoClaro);
      }
    });

    /* Pedido */
    worksheet.getCell(linhaAtual, 1).font = {
      bold: true,

      color: {
        argb: CORES.azul,
      },

      size: 9,
    };

    /* Cliente */
    worksheet.getCell(linhaAtual, 2).font = {
      bold: true,

      color: {
        argb: CORES.textoForte,
      },

      size: 9,
    };

    /* Nº alterações: vermelho quando o pedido mudou mais de uma vez */
    const quantidade = valores[5];

    const cellQtd = worksheet.getCell(linhaAtual, 6);

    cellQtd.font = {
      bold: true,

      color: {
        argb: quantidade > 1 ? CORES.vermelho : CORES.azul,
      },

      size: 10,
    };

    cellQtd.alignment = {
      horizontal: "center",

      vertical: "middle",
    };

    worksheet.getRow(linhaAtual).height = 22;

    linhaAtual += 1;
  });

  if (pedidos.length > 0) {
    worksheet.autoFilter = {
      from: "A5",

      to: `G${linhaAtual - 1}`,
    };
  }

  for (const [coluna, largura] of Object.entries(LARGURAS)) {
    worksheet.getColumn(coluna).width = largura;
  }

  return worksheet;
}
