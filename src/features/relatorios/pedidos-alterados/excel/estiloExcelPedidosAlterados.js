/* =========================================================
   ESTILO DO EXCEL DE PEDIDOS ALTERADOS
   ---------------------------------------------------------
   Cores do padrão dos relatórios (COR_EXCEL) mais as cores
   próprias deste relatório, e o cabeçalho das duas abas.
   Cada helper devolve um objeto novo por célula.
========================================================= */

import { obterDataHoraEmissao } from "@/features/relatorios/exportacao/Comum";
import { COR_EXCEL } from "@/features/relatorios/exportacao/padraoExcel";
import { formatarFiltroData } from "@/features/relatorios/pedidos-alterados/formatadoresPedidosAlterados";

export const CORES = Object.freeze({
  azul: COR_EXCEL.azul,
  azulClaro: COR_EXCEL.azulCabecalho,
  verdeTexto: COR_EXCEL.verdeTexto,
  verdeMarca: COR_EXCEL.verde,
  cinzaMuitoClaro: COR_EXCEL.zebra,
  cinzaBorda: COR_EXCEL.borda,
  cinzaTexto: COR_EXCEL.texto2,
  texto: COR_EXCEL.texto,

  textoForte: "FF334155",
  textoInfo: "FF475569",
  fundoInfo: "FFFBFDFF",
  vermelho: "FFDC2626",
  vermelhoClaro: "FFFEF2F2",
  vermelhoTexto: "FF991B1B",
  verdeClaro: "FFECFDF5",
  verdeEscuro: "FF047857",
});

export function preenchimento(argb) {
  return {
    type: "pattern",

    pattern: "solid",

    fgColor: {
      argb,
    },
  };
}

export function bordaInferior(argb = CORES.cinzaBorda) {
  return {
    bottom: {
      style: "thin",

      color: {
        argb,
      },
    },
  };
}

export function bordaPadrao() {
  const lado = () => ({ style: "thin", color: { argb: CORES.cinzaBorda } });

  return {
    top: lado(),

    left: lado(),

    bottom: lado(),

    right: lado(),
  };
}

export function alinhamentoEsquerda({ vertical = "middle", quebrar = true } = {}) {
  return quebrar
    ? { vertical, horizontal: "left", wrapText: true }
    : { vertical, horizontal: "left" };
}

/*
 * Linha 3 de informações: o Resumo vai até G e o Histórico até E,
 * por isso os merges são diferentes.
 */
const LAYOUT_INFORMACOES = {
  G: { merges: ["A3:C3", "D3:E3", "F3:G3"], celulas: ["A3", "D3", "F3"] },
  E: { merges: ["A3:B3", "C3:D3"], celulas: ["A3", "C3", "E3"] },
};

function estilizarInfo(cell) {
  cell.font = {
    size: 9,

    color: {
      argb: CORES.cinzaTexto,
    },

    bold: true,
  };

  cell.alignment = alinhamentoEsquerda();
}

/** Título (linha 1), faixa "PEDIDOS" (linha 2) e período/emissão/filtro (linha 3). */
export function criarCabecalhoRelatorio({
  worksheet,
  titulo,
  ultimaColuna,
  dataInicial,
  dataFinal,
  pesquisa,
}) {
  worksheet.mergeCells(`A1:${ultimaColuna}1`);

  const tituloCell = worksheet.getCell("A1");

  tituloCell.value = titulo;

  tituloCell.font = {
    bold: true,

    size: 16,

    color: {
      argb: CORES.azul,
    },
  };

  tituloCell.alignment = alinhamentoEsquerda({ quebrar: false });

  worksheet.getRow(1).height = 28;

  worksheet.mergeCells(`A2:${ultimaColuna}2`);

  const faixa = worksheet.getCell("A2");

  faixa.value = "PEDIDOS";

  faixa.border = {
    bottom: { style: "medium", color: { argb: CORES.verdeMarca } },
  };

  faixa.font = {
    bold: true,

    color: {
      argb: CORES.verdeTexto,
    },

    size: 9,
  };

  faixa.alignment = alinhamentoEsquerda({ quebrar: false });

  worksheet.getRow(2).height = 21;

  const layout = ultimaColuna === "G" ? LAYOUT_INFORMACOES.G : LAYOUT_INFORMACOES.E;

  layout.merges.forEach((intervalo) => worksheet.mergeCells(intervalo));

  const [periodo, emissao, filtro] = layout.celulas.map((endereco) => worksheet.getCell(endereco));

  periodo.value = `Período: ${formatarFiltroData(dataInicial)} até ${formatarFiltroData(
    dataFinal,
  )}`;

  emissao.value = `Emitido em: ${obterDataHoraEmissao()}`;

  filtro.value = pesquisa ? `Filtro: ${pesquisa}` : "Filtro: Todos";

  estilizarInfo(periodo);

  estilizarInfo(emissao);

  estilizarInfo(filtro);

  worksheet.getRow(3).height = 21;

  worksheet.getRow(4).height = 8;
}
