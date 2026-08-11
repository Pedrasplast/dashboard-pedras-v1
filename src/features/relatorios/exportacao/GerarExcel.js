import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import {
  obterColunasRelatorio,
} from "../config/Colunas.config";


/* =====================================================
   COLUNAS PARA EXPORTAÇÃO

   Produção por Produto recebe apenas uma coluna extra:

   Produto
   Descrição do Produto
   Injetora
   ...
===================================================== */

function obterColunasExcel(
  relatorio,
) {
  const colunas = [
    ...obterColunasRelatorio(
      relatorio,
    ),
  ];

  if (
    relatorio?.id !==
    "producao-produto"
  ) {
    return colunas;
  }

  /*
   * Evita duplicação caso futuramente
   * a coluna seja adicionada no config.
   */
  const jaExiste =
    colunas.some(
      (
        coluna,
      ) =>
        coluna.chave ===
        "descricao_produto",
    );

  if (jaExiste) {
    return colunas;
  }

  const indiceProduto =
    colunas.findIndex(
      (
        coluna,
      ) =>
        coluna.chave ===
        "produto",
    );

  const colunaDescricao = {
    chave:
      "descricao_produto",

    titulo:
      "Descrição do Produto",

    larguraExcel:
      38,

    valor:
      (
        item,
      ) =>
        item.descricao_produto ||
        "-",

    valorExcel:
      (
        item,
      ) =>
        item.descricao_produto ||
        "-",
  };

  if (
    indiceProduto !==
    -1
  ) {
    colunas.splice(
      indiceProduto + 1,
      0,
      colunaDescricao,
    );
  } else {
    colunas.unshift(
      colunaDescricao,
    );
  }

  return colunas;
}


/* =====================================================
   GERADOR DE EXCEL
===================================================== */

export async function gerarExcelRelatorio({
  relatorio,
  dados,
}) {
  if (!relatorio) {
    return;
  }

  if (
    !Array.isArray(dados) ||
    dados.length === 0
  ) {
    alert(
      "Nenhum dado encontrado com os filtros selecionados.",
    );

    return;
  }

  try {
    const colunas =
      obterColunasExcel(
        relatorio,
      );

    if (
      colunas.length ===
      0
    ) {
      alert(
        "Nenhuma coluna configurada para este relatório.",
      );

      return;
    }

    const workbook =
      new ExcelJS.Workbook();

    workbook.creator =
      "Pedrasplast";

    workbook.created =
      new Date();

    const worksheet =
      workbook.addWorksheet(
        "Relatório",
        {
          views: [
            {
              state:
                "frozen",

              ySplit:
                1,
            },
          ],
        },
      );


    /* =================================================
       CABEÇALHOS
    ================================================= */

    const cabecalhos =
      colunas.map(
        (
          coluna,
        ) =>
          String(
            coluna.titulo ||
              coluna.chave,
          ),
      );


    /* =================================================
       DADOS
    ================================================= */

    const linhas =
      dados.map(
        (
          item,
        ) =>
          colunas.map(
            (
              coluna,
            ) => {
              if (
                typeof coluna.valorExcel ===
                "function"
              ) {
                return coluna.valorExcel(
                  item,
                );
              }

              if (
                typeof coluna.valor ===
                "function"
              ) {
                return coluna.valor(
                  item,
                );
              }

              return "";
            },
          ),
      );


    /* =================================================
       TABELA ESTRUTURADA
    ================================================= */

    worksheet.addTable({
      name:
        "TabelaRelatorio",

      ref:
        "A1",

      headerRow:
        true,

      totalsRow:
        false,

      style: {
        theme:
          "TableStyleMedium2",

        showRowStripes:
          true,

        showColumnStripes:
          false,
      },

      columns:
        cabecalhos.map(
          (
            cabecalho,
          ) => ({
            name:
              cabecalho,

            filterButton:
              true,
          }),
        ),

      rows:
        linhas,
    });


    /* =================================================
       LARGURAS
    ================================================= */

    worksheet.columns =
      colunas.map(
        (
          coluna,
        ) => ({
          width:
            Number(
              coluna.larguraExcel ||
                20,
            ),
        }),
      );


    /* =================================================
       FORMATOS NUMÉRICOS
    ================================================= */

    colunas.forEach(
      (
        coluna,
        index,
      ) => {
        if (
          coluna.formatoExcel
        ) {
          worksheet.getColumn(
            index + 1,
          ).numFmt =
            coluna.formatoExcel;
        }
      },
    );


    /* =================================================
       ALINHAMENTO
    ================================================= */

    /* =================================================
   ALINHAMENTO

   Todas as células ficam alinhadas à esquerda.
================================================= */

worksheet.eachRow(
  (
    row,
    rowNumber,
  ) => {
    row.eachCell(
      (
        cell,
      ) => {
        cell.alignment = {
          ...cell.alignment,

          vertical:
            "middle",

          horizontal:
            "left",
        };
      },
    );

    if (
      rowNumber === 1
    ) {
      row.height =
        24;
    }
  },
);


    /* =================================================
       DOWNLOAD
    ================================================= */

    const buffer =
      await workbook.xlsx.writeBuffer();

    const nomeArquivo =
      `${relatorio.id}_${new Date()
        .toISOString()
        .slice(
          0,
          10,
        )}.xlsx`;

    const blob =
      new Blob(
        [
          buffer,
        ],
        {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      );

    saveAs(
      blob,
      nomeArquivo,
    );
  } catch (erro) {
    console.error(
      "Erro ao gerar Excel:",
      erro,
    );

    alert(
      "Não foi possível gerar o arquivo Excel.",
    );
  }
}