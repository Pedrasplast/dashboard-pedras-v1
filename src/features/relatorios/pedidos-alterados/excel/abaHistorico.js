import { estilizarCabecalhoExcel } from "@/features/relatorios/exportacao/padraoExcel";

import {
  CORES,
  alinhamentoEsquerda,
  bordaPadrao,
  criarCabecalhoRelatorio,
  preenchimento,
} from "./estiloExcelPedidosAlterados";
import { CABECALHOS_HISTORICO, montarBlocoHistorico } from "./linhasExcelPedidosAlterados";

const LARGURAS = { A: 19, B: 23, C: 32, D: 46, E: 46 };

function escreverTituloPedido(worksheet, linha, titulo) {
  worksheet.mergeCells(`A${linha}:E${linha}`);

  const cell = worksheet.getCell(`A${linha}`);

  cell.value = titulo;

  cell.fill = preenchimento(CORES.azulClaro);

  cell.font = {
    bold: true,

    size: 12,

    color: {
      argb: CORES.azul,
    },
  };

  cell.alignment = alinhamentoEsquerda({ quebrar: false });

  cell.border = bordaPadrao();

  worksheet.getRow(linha).height = 25;
}

function escreverInformacoesPedido(worksheet, linha, texto) {
  worksheet.mergeCells(`A${linha}:E${linha}`);

  const cell = worksheet.getCell(`A${linha}`);

  cell.value = texto;

  cell.font = {
    size: 9,

    bold: true,

    color: {
      argb: CORES.textoInfo,
    },
  };

  cell.fill = preenchimento(CORES.fundoInfo);

  cell.alignment = alinhamentoEsquerda();

  worksheet.getRow(linha).height = 21;
}

function escreverSemDetalhe(worksheet, linha, texto) {
  worksheet.mergeCells(`A${linha}:E${linha}`);

  const cell = worksheet.getCell(`A${linha}`);

  cell.value = texto;

  cell.font = {
    italic: true,

    color: {
      argb: CORES.cinzaTexto,
    },

    size: 9,
  };

  cell.fill = preenchimento(CORES.cinzaMuitoClaro);
}

/* Ocorrência sem campos identificados: só valores, borda e alinhamento. */
function escreverSemMudanca(worksheet, linha, valores) {
  valores.forEach((valor, posicao) => {
    const cell = worksheet.getCell(linha, posicao + 1);

    cell.value = valor;

    cell.border = bordaPadrao();

    cell.alignment = alinhamentoEsquerda();
  });
}

/* Um campo alterado: "Antes" em vermelho claro, "Depois" em verde claro. */
function escreverMudanca(worksheet, linha, valores) {
  valores.forEach((valor, posicao) => {
    const cell = worksheet.getCell(linha, posicao + 1);

    cell.value = valor;

    cell.font = {
      size: 9,

      color: {
        argb: CORES.texto,
      },
    };

    cell.alignment = alinhamentoEsquerda({ vertical: "top" });

    cell.border = bordaPadrao();
  });

  worksheet.getCell(linha, 1).font = {
    bold: true,

    color: {
      argb: CORES.textoForte,
    },

    size: 9,
  };

  worksheet.getCell(linha, 3).font = {
    bold: true,

    color: {
      argb: CORES.texto,
    },

    size: 9,
  };

  const antes = worksheet.getCell(linha, 4);

  antes.fill = preenchimento(CORES.vermelhoClaro);

  antes.font = {
    color: {
      argb: CORES.vermelhoTexto,
    },

    size: 9,
  };

  const depois = worksheet.getCell(linha, 5);

  depois.fill = preenchimento(CORES.verdeClaro);

  depois.font = {
    bold: true,

    color: {
      argb: CORES.verdeEscuro,
    },

    size: 9,
  };

  worksheet.getRow(linha).height = 25;
}

/** Aba "Histórico Expandido": um bloco por pedido, com cada campo alterado. */
export function criarAbaHistorico({
  workbook,
  pedidos,
  dataInicial,
  dataFinal,
  pesquisa,
  extrairMudancas,
  formatarDataHora,
}) {
  const worksheet = workbook.addWorksheet("Histórico Expandido", {
    views: [
      {
        showGridLines: false,
      },
    ],
  });

  criarCabecalhoRelatorio({
    worksheet,

    titulo: "Pedidos Alterados — histórico expandido",

    ultimaColuna: "E",

    dataInicial,

    dataFinal,

    pesquisa,
  });

  let linhaAtual = 5;

  for (const pedido of pedidos) {
    const bloco = montarBlocoHistorico(pedido, extrairMudancas, formatarDataHora);

    escreverTituloPedido(worksheet, linhaAtual, bloco.titulo);

    linhaAtual += 1;

    escreverInformacoesPedido(worksheet, linhaAtual, bloco.informacoes);

    linhaAtual += 1;

    CABECALHOS_HISTORICO.forEach((titulo, indice) => {
      worksheet.getCell(linhaAtual, indice + 1).value = titulo;
    });

    estilizarCabecalhoExcel(worksheet, linhaAtual, CABECALHOS_HISTORICO.length);

    linhaAtual += 1;

    for (const linha of bloco.linhas) {
      if (linha.tipo === "sem-detalhe") {
        escreverSemDetalhe(worksheet, linhaAtual, linha.texto);
      } else if (linha.tipo === "sem-mudanca") {
        escreverSemMudanca(worksheet, linhaAtual, linha.valores);
      } else {
        escreverMudanca(worksheet, linhaAtual, linha.valores);
      }

      linhaAtual += 1;
    }

    /* Espaço entre pedidos. */
    worksheet.getRow(linhaAtual).height = 10;

    linhaAtual += 1;
  }

  for (const [coluna, largura] of Object.entries(LARGURAS)) {
    worksheet.getColumn(coluna).width = largura;
  }

  return worksheet;
}
