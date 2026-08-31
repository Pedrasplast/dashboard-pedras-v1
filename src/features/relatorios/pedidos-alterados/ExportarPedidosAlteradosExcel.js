/* =========================================================
   EXPORTAÇÃO EXCEL - PEDIDOS ALTERADOS

   ABAS:
   1) Resumo Gerencial
   2) Histórico Expandido
========================================================= */


/* =========================================================
   CORES
========================================================= */

const CORES = {
  azulEscuro: "FF1E293B",
  azul: "FF2563EB",
  azulClaro: "FFEFF6FF",
  azulBorda: "FFBFDBFE",

  verde: "FF059669",
  verdeClaro: "FFECFDF5",

  vermelho: "FFDC2626",
  vermelhoClaro: "FFFEF2F2",

  cinzaMuitoClaro: "FFF8FAFC",
  cinzaClaro: "FFF1F5F9",
  cinzaBorda: "FFE2E8F0",
  cinzaTexto: "FF64748B",

  branco: "FFFFFFFF",
  texto: "FF0F172A",
};


/* =========================================================
   DATA
========================================================= */

function formatarFiltroData(valor) {
  if (!valor) {
    return "Sem limite";
  }

  return String(valor)
    .split("-")
    .reverse()
    .join("/");
}


function obterDataHoraEmissao() {
  return new Date().toLocaleString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}


/* =========================================================
   NOME DO ARQUIVO
========================================================= */

function obterNomeArquivo() {
  const data =
    new Date()
      .toISOString()
      .slice(0, 10);

  return `Pedidos_Alterados_${data}.xlsx`;
}


/* =========================================================
   DOWNLOAD
========================================================= */

function baixarArquivo(
  buffer,
  nomeArquivo,
) {
  const blob =
    new Blob(
      [buffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    );


  const url =
    window.URL.createObjectURL(
      blob,
    );


  const link =
    document.createElement("a");


  link.href =
    url;

  link.download =
    nomeArquivo;


  document.body.appendChild(
    link,
  );


  link.click();

  link.remove();


  window.URL.revokeObjectURL(
    url,
  );
}


/* =========================================================
   BORDA PADRÃO
========================================================= */

function bordaPadrao() {
  return {
    top: {
      style: "thin",

      color: {
        argb:
          CORES.cinzaBorda,
      },
    },

    left: {
      style: "thin",

      color: {
        argb:
          CORES.cinzaBorda,
      },
    },

    bottom: {
      style: "thin",

      color: {
        argb:
          CORES.cinzaBorda,
      },
    },

    right: {
      style: "thin",

      color: {
        argb:
          CORES.cinzaBorda,
      },
    },
  };
}


/* =========================================================
   CABEÇALHO DA TABELA

   PINTA SOMENTE AS CÉLULAS UTILIZADAS
========================================================= */

function estilizarCabecalho(
  worksheet,
  linha,
  colunaInicial,
  colunaFinal,
) {
  for (
    let coluna =
      colunaInicial;

    coluna <=
    colunaFinal;

    coluna += 1
  ) {
    const cell =
      worksheet.getCell(
        linha,
        coluna,
      );


    cell.fill = {
      type: "pattern",

      pattern: "solid",

      fgColor: {
        argb:
          CORES.azulEscuro,
      },
    };


    cell.font = {
      bold: true,

      color: {
        argb:
          CORES.branco,
      },

      size: 10,
    };


    cell.alignment = {
      vertical:
        "middle",

      horizontal:
        "left",

      wrapText:
        true,
    };


    cell.border = {
      bottom: {
        style:
          "thin",

        color: {
          argb:
            "FF334155",
        },
      },
    };
  }


  worksheet.getRow(
    linha,
  ).height =
    24;
}


/* =========================================================
   ESTILIZAR INFORMAÇÕES SUPERIORES
========================================================= */

function estilizarInfo(
  cell,
) {
  cell.font = {
    size: 9,

    color: {
      argb:
        CORES.cinzaTexto,
    },

    bold: true,
  };


  cell.alignment = {
    vertical:
      "middle",

    horizontal:
      "left",

    wrapText:
      true,
  };
}


/* =========================================================
   CABEÇALHO DO RELATÓRIO
========================================================= */

function criarCabecalhoRelatorio({
  worksheet,
  titulo,
  ultimaColuna,
  dataInicial,
  dataFinal,
  pesquisa,
}) {
  /* =======================================================
     TÍTULO
  ======================================================= */

  worksheet.mergeCells(
    `A1:${ultimaColuna}1`,
  );


  const tituloCell =
    worksheet.getCell(
      "A1",
    );


  tituloCell.value =
    titulo;


  tituloCell.font = {
    bold: true,

    size: 16,

    color: {
      argb:
        CORES.texto,
    },
  };


  tituloCell.alignment = {
    vertical:
      "middle",

    horizontal:
      "left",
  };


  worksheet.getRow(
    1,
  ).height =
    28;


  /* =======================================================
     FAIXA AZUL
  ======================================================= */

  worksheet.mergeCells(
    `A2:${ultimaColuna}2`,
  );


  const faixa =
    worksheet.getCell(
      "A2",
    );


  faixa.value =
    "AUDITORIA DE ALTERAÇÕES EM PEDIDOS";


  faixa.fill = {
    type: "pattern",

    pattern: "solid",

    fgColor: {
      argb:
        CORES.azul,
    },
  };


  faixa.font = {
    bold: true,

    color: {
      argb:
        CORES.branco,
    },

    size: 9,
  };


  faixa.alignment = {
    vertical:
      "middle",

    horizontal:
      "left",
  };


  worksheet.getRow(
    2,
  ).height =
    21;


  /* =======================================================
     INFORMAÇÕES

     IMPORTANTE:
     Resumo vai até G.
     Histórico vai até E.

     Os merges precisam ser diferentes.
  ======================================================= */

  if (
    ultimaColuna ===
    "G"
  ) {
    worksheet.mergeCells(
      "A3:C3",
    );

    worksheet.mergeCells(
      "D3:E3",
    );

    worksheet.mergeCells(
      "F3:G3",
    );


    const periodo =
      worksheet.getCell(
        "A3",
      );

    const emissao =
      worksheet.getCell(
        "D3",
      );

    const filtro =
      worksheet.getCell(
        "F3",
      );


    periodo.value =
      `Período: ${formatarFiltroData(
        dataInicial,
      )} até ${formatarFiltroData(
        dataFinal,
      )}`;


    emissao.value =
      `Emitido em: ${obterDataHoraEmissao()}`;


    filtro.value =
      pesquisa
        ? `Filtro: ${pesquisa}`
        : "Filtro: Todos";


    estilizarInfo(
      periodo,
    );

    estilizarInfo(
      emissao,
    );

    estilizarInfo(
      filtro,
    );

  } else {
    /*
     * Histórico possui somente A:E.
     */

    worksheet.mergeCells(
      "A3:B3",
    );

    worksheet.mergeCells(
      "C3:D3",
    );


    const periodo =
      worksheet.getCell(
        "A3",
      );

    const emissao =
      worksheet.getCell(
        "C3",
      );

    const filtro =
      worksheet.getCell(
        "E3",
      );


    periodo.value =
      `Período: ${formatarFiltroData(
        dataInicial,
      )} até ${formatarFiltroData(
        dataFinal,
      )}`;


    emissao.value =
      `Emitido em: ${obterDataHoraEmissao()}`;


    filtro.value =
      pesquisa
        ? `Filtro: ${pesquisa}`
        : "Filtro: Todos";


    estilizarInfo(
      periodo,
    );

    estilizarInfo(
      emissao,
    );

    estilizarInfo(
      filtro,
    );
  }


  worksheet.getRow(
    3,
  ).height =
    21;


  worksheet.getRow(
    4,
  ).height =
    8;
}


/* =========================================================
   ABA RESUMO
========================================================= */

function criarAbaResumo({
  workbook,
  pedidos,
  dataInicial,
  dataFinal,
  pesquisa,
  formatarDataHora,
}) {
  const worksheet =
    workbook.addWorksheet(
      "Resumo",
      {
        views: [
          {
            state:
              "frozen",

            ySplit:
              5,

            showGridLines:
              false,
          },
        ],
      },
    );


  criarCabecalhoRelatorio({
    worksheet,

    titulo:
      "RELATÓRIO DE PEDIDOS ALTERADOS",

    ultimaColuna:
      "G",

    dataInicial,

    dataFinal,

    pesquisa,
  });


  /* =======================================================
     CABEÇALHO DA TABELA
  ======================================================= */

  const cabecalhos = [
    "Pedido",
    "Cliente",
    "Vendedor",
    "Primeira alteração",
    "Última alteração",
    "Nº alterações",
    "O que foi alterado",
  ];


  for (
    let coluna = 1;
    coluna <= 7;
    coluna += 1
  ) {
    worksheet.getCell(
      5,
      coluna,
    ).value =
      cabecalhos[
        coluna - 1
      ];
  }


  /*
   * Apenas A5:G5 é pintado.
   */
  estilizarCabecalho(
    worksheet,
    5,
    1,
    7,
  );


  /* =======================================================
     DADOS
  ======================================================= */

  let linhaAtual =
    6;


  pedidos.forEach(
    (
      pedido,
      indice,
    ) => {
      const campos =
        Array.isArray(
          pedido
            ?.campos_alterados,
        )
          ? pedido
              .campos_alterados
              .join(
                ", ",
              )
          : "-";


      const valores = [
        pedido
          ?.numero_pedido ||
          pedido
            ?.codigo_pedido_omie ||
          "-",

        pedido
          ?.cliente ||
          "-",

        pedido
          ?.vendedor ||
          "-",

        formatarDataHora(
          pedido
            ?.primeira_alteracao,
        ),

        formatarDataHora(
          pedido
            ?.ultima_alteracao,
        ),

        Number(
          pedido
            ?.quantidade_alteracoes ??
            0,
        ),

        campos ||
          "-",
      ];


      for (
        let coluna = 1;
        coluna <= 7;
        coluna += 1
      ) {
        const cell =
          worksheet.getCell(
            linhaAtual,
            coluna,
          );


        cell.value =
          valores[
            coluna - 1
          ];


        cell.font = {
          size: 9,

          color: {
            argb:
              CORES.texto,
          },
        };


        cell.alignment = {
          vertical:
            "middle",

          horizontal:
            "left",

          wrapText:
            true,
        };


        cell.border = {
          bottom: {
            style:
              "thin",

            color: {
              argb:
                CORES.cinzaBorda,
            },
          },
        };


        if (
          indice % 2 ===
          1
        ) {
          cell.fill = {
            type: "pattern",

            pattern: "solid",

            fgColor: {
              argb:
                CORES.cinzaMuitoClaro,
            },
          };
        }
      }


      /* ===================================================
         PEDIDO
      =================================================== */

      worksheet.getCell(
        linhaAtual,
        1,
      ).font = {
        bold: true,

        color: {
          argb:
            CORES.azul,
        },

        size: 9,
      };


      /* ===================================================
         CLIENTE
      =================================================== */

      worksheet.getCell(
        linhaAtual,
        2,
      ).font = {
        bold: true,

        color: {
          argb:
            "FF334155",
        },

        size: 9,
      };


      /* ===================================================
         Nº ALTERAÇÕES
      =================================================== */

      const quantidade =
        Number(
          pedido
            ?.quantidade_alteracoes ??
            0,
        );


      const cellQtd =
        worksheet.getCell(
          linhaAtual,
          6,
        );


      cellQtd.font = {
        bold: true,

        color: {
          argb:
            quantidade >
            1
              ? CORES.vermelho
              : CORES.azul,
        },

        size: 10,
      };


      cellQtd.alignment = {
        horizontal:
          "center",

        vertical:
          "middle",
      };


      worksheet.getRow(
        linhaAtual,
      ).height =
        22;


      linhaAtual +=
        1;
    },
  );


  /* =======================================================
     AUTOFILTRO
  ======================================================= */

  if (
    pedidos.length >
    0
  ) {
    worksheet.autoFilter = {
      from:
        "A5",

      to:
        `G${linhaAtual - 1}`,
    };
  }


  /* =======================================================
     LARGURAS
  ======================================================= */

  worksheet.getColumn(
    "A",
  ).width =
    13;


  worksheet.getColumn(
    "B",
  ).width =
    38;


  worksheet.getColumn(
    "C",
  ).width =
    24;


  worksheet.getColumn(
    "D",
  ).width =
    22;


  worksheet.getColumn(
    "E",
  ).width =
    22;


  worksheet.getColumn(
    "F",
  ).width =
    15;


  worksheet.getColumn(
    "G",
  ).width =
    42;


  return worksheet;
}


/* =========================================================
   ABA HISTÓRICO
========================================================= */

function criarAbaHistorico({
  workbook,
  pedidos,
  dataInicial,
  dataFinal,
  pesquisa,
  extrairMudancas,
  formatarDataHora,
}) {
  const worksheet =
    workbook.addWorksheet(
      "Histórico Expandido",
      {
        views: [
          {
            showGridLines:
              false,
          },
        ],
      },
    );


  criarCabecalhoRelatorio({
    worksheet,

    titulo:
      "HISTÓRICO DE ALTERAÇÕES POR PEDIDO",

    ultimaColuna:
      "E",

    dataInicial,

    dataFinal,

    pesquisa,
  });


  let linhaAtual =
    5;


  /* =======================================================
     PEDIDOS
  ======================================================= */

  for (
    const pedido
    of pedidos
  ) {
    const numeroPedido =
      pedido
        ?.numero_pedido ||
      pedido
        ?.codigo_pedido_omie ||
      "-";


    const cliente =
      pedido
        ?.cliente ||
      "-";


    const vendedor =
      pedido
        ?.vendedor ||
      "-";


    const quantidadeAlteracoes =
      Number(
        pedido
          ?.quantidade_alteracoes ??
          0,
      );


    /* =====================================================
       NÚMERO DO PEDIDO
    ===================================================== */

    worksheet.mergeCells(
      `A${linhaAtual}:E${linhaAtual}`,
    );


    const cabecalhoPedido =
      worksheet.getCell(
        `A${linhaAtual}`,
      );


    cabecalhoPedido.value =
      `PEDIDO ${numeroPedido}`;


    cabecalhoPedido.fill = {
      type: "pattern",

      pattern: "solid",

      fgColor: {
        argb:
          CORES.azulClaro,
      },
    };


    cabecalhoPedido.font = {
      bold: true,

      size: 12,

      color: {
        argb:
          CORES.azul,
      },
    };


    cabecalhoPedido.alignment = {
      vertical:
        "middle",

      horizontal:
        "left",
    };


    cabecalhoPedido.border =
      bordaPadrao();


    worksheet.getRow(
      linhaAtual,
    ).height =
      25;


    linhaAtual +=
      1;


    /* =====================================================
       INFORMAÇÕES
    ===================================================== */

    worksheet.mergeCells(
      `A${linhaAtual}:E${linhaAtual}`,
    );


    const info =
      worksheet.getCell(
        `A${linhaAtual}`,
      );


    info.value =
      `Cliente: ${cliente}   |   Vendedor: ${vendedor}   |   Total de alterações: ${quantidadeAlteracoes}`;


    info.font = {
      size: 9,

      bold: true,

      color: {
        argb:
          "FF475569",
      },
    };


    info.fill = {
      type:
        "pattern",

      pattern:
        "solid",

      fgColor: {
        argb:
          "FFFBFDFF",
      },
    };


    info.alignment = {
      vertical:
        "middle",

      horizontal:
        "left",

      wrapText:
        true,
    };


    worksheet.getRow(
      linhaAtual,
    ).height =
      21;


    linhaAtual +=
      1;


    /* =====================================================
       CABEÇALHO DA TABELA
    ===================================================== */

    const cabecalhos = [
      "Ocorrência",
      "Data da alteração",
      "Campo alterado",
      "Antes",
      "Depois",
    ];


    for (
      let coluna = 1;
      coluna <= 5;
      coluna += 1
    ) {
      worksheet.getCell(
        linhaAtual,
        coluna,
      ).value =
        cabecalhos[
          coluna - 1
        ];
    }


    estilizarCabecalho(
      worksheet,
      linhaAtual,
      1,
      5,
    );


    linhaAtual +=
      1;


    /* =====================================================
       OCORRÊNCIAS
    ===================================================== */

    const ocorrencias =
      Array.isArray(
        pedido
          ?.detalhes_alteracoes,
      )
        ? pedido
            .detalhes_alteracoes
        : [];


    if (
      ocorrencias.length ===
      0
    ) {
      worksheet.mergeCells(
        `A${linhaAtual}:E${linhaAtual}`,
      );


      const cell =
        worksheet.getCell(
          `A${linhaAtual}`,
        );


      cell.value =
        pedido
          ?.ultimo_resumo ||
        "Alteração registrada sem detalhamento.";


      cell.font = {
        italic: true,

        color: {
          argb:
            CORES.cinzaTexto,
        },

        size: 9,
      };


      cell.fill = {
        type:
          "pattern",

        pattern:
          "solid",

        fgColor: {
          argb:
            CORES.cinzaMuitoClaro,
        },
      };


      linhaAtual +=
        1;
    }


    for (
      let indice = 0;
      indice <
      ocorrencias.length;
      indice += 1
    ) {
      const ocorrencia =
        ocorrencias[
          indice
        ];


      const numeroOcorrencia =
        ocorrencias.length -
        indice;


      const mudancas =
        extrairMudancas(
          ocorrencia,
        );


      if (
        mudancas.length ===
        0
      ) {
        const valores = [
          `Alteração #${numeroOcorrencia}`,

          formatarDataHora(
            ocorrencia
              ?.alterado_em,
          ),

          ocorrencia
            ?.resumo ||
            "Alteração registrada",

          "-",

          "-",
        ];


        for (
          let coluna = 1;
          coluna <= 5;
          coluna += 1
        ) {
          const cell =
            worksheet.getCell(
              linhaAtual,
              coluna,
            );


          cell.value =
            valores[
              coluna - 1
            ];


          cell.border =
            bordaPadrao();


          cell.alignment = {
            vertical:
              "middle",

            horizontal:
              "left",

            wrapText:
              true,
          };
        }


        linhaAtual +=
          1;

        continue;
      }


      /* ===================================================
         CAMPOS ALTERADOS
      =================================================== */

      for (
        let indiceMudanca = 0;
        indiceMudanca <
        mudancas.length;
        indiceMudanca += 1
      ) {
        const mudanca =
          mudancas[
            indiceMudanca
          ];


        const valores = [
          `Alteração #${numeroOcorrencia}`,

          formatarDataHora(
            ocorrencia
              ?.alterado_em,
          ),

          mudanca.campo,

          mudanca.anterior,

          mudanca.novo,
        ];


        for (
          let coluna = 1;
          coluna <= 5;
          coluna += 1
        ) {
          const cell =
            worksheet.getCell(
              linhaAtual,
              coluna,
            );


          cell.value =
            valores[
              coluna - 1
            ];


          cell.font = {
            size: 9,

            color: {
              argb:
                CORES.texto,
            },
          };


          cell.alignment = {
            vertical:
              "top",

            horizontal:
              "left",

            wrapText:
              true,
          };


          cell.border =
            bordaPadrao();
        }


        /* ===============================================
           OCORRÊNCIA
        =============================================== */

        worksheet.getCell(
          linhaAtual,
          1,
        ).font = {
          bold: true,

          color: {
            argb:
              "FF334155",
          },

          size: 9,
        };


        /* ===============================================
           CAMPO
        =============================================== */

        worksheet.getCell(
          linhaAtual,
          3,
        ).font = {
          bold: true,

          color: {
            argb:
              CORES.texto,
          },

          size: 9,
        };


        /* ===============================================
           ANTES
        =============================================== */

        const antes =
          worksheet.getCell(
            linhaAtual,
            4,
          );


        antes.fill = {
          type:
            "pattern",

          pattern:
            "solid",

          fgColor: {
            argb:
              CORES.vermelhoClaro,
          },
        };


        antes.font = {
          color: {
            argb:
              "FF991B1B",
          },

          size: 9,
        };


        /* ===============================================
           DEPOIS
        =============================================== */

        const depois =
          worksheet.getCell(
            linhaAtual,
            5,
          );


        depois.fill = {
          type:
            "pattern",

          pattern:
            "solid",

          fgColor: {
            argb:
              CORES.verdeClaro,
          },
        };


        depois.font = {
          bold: true,

          color: {
            argb:
              "FF047857",
          },

          size: 9,
        };


        worksheet.getRow(
          linhaAtual,
        ).height =
          25;


        linhaAtual +=
          1;
      }
    }


    /*
     * Espaço entre pedidos.
     */
    worksheet.getRow(
      linhaAtual,
    ).height =
      10;


    linhaAtual +=
      1;
  }


  /* =======================================================
     LARGURAS
  ======================================================= */

  worksheet.getColumn(
    "A",
  ).width =
    19;


  worksheet.getColumn(
    "B",
  ).width =
    23;


  worksheet.getColumn(
    "C",
  ).width =
    32;


  worksheet.getColumn(
    "D",
  ).width =
    46;


  worksheet.getColumn(
    "E",
  ).width =
    46;


  return worksheet;
}


/* =========================================================
   EXPORTAR
========================================================= */

export async function exportarExcelPedidosAlterados({
  pedidos,
  dataInicial,
  dataFinal,
  pesquisa,
  extrairMudancas,
  formatarDataHora,
}) {
  if (
    !Array.isArray(
      pedidos,
    ) ||
    pedidos.length ===
      0
  ) {
    window.alert(
      "Não existem dados para exportar.",
    );

    return;
  }


  try {
    const moduloExcel =
      await import(
        "exceljs"
      );


    const ExcelJS =
      moduloExcel.default ||
      moduloExcel;


    const workbook =
      new ExcelJS.Workbook();


    workbook.creator =
      "Pedrasplast";

    workbook.company =
      "Pedrasplast";

    workbook.subject =
      "Relatório de Pedidos Alterados";

    workbook.title =
      "Pedidos Alterados";

    workbook.created =
      new Date();


    /* =====================================================
       RESUMO
    ===================================================== */

    criarAbaResumo({
      workbook,

      pedidos,

      dataInicial,

      dataFinal,

      pesquisa,

      formatarDataHora,
    });


    /* =====================================================
       HISTÓRICO
    ===================================================== */

    criarAbaHistorico({
      workbook,

      pedidos,

      dataInicial,

      dataFinal,

      pesquisa,

      extrairMudancas,

      formatarDataHora,
    });


    /* =====================================================
       GERAR
    ===================================================== */

    const buffer =
      await workbook.xlsx
        .writeBuffer();


    baixarArquivo(
      buffer,
      obterNomeArquivo(),
    );

  } catch (erro) {
    /*
     * IMPORTANTE PARA DEBUG:
     * agora mostra o erro verdadeiro no console.
     */
    console.error(
      "ERRO AO GERAR EXCEL:",
      erro,
    );


    window.alert(
      `Não foi possível gerar o Excel.\n\n${erro?.message || "Erro desconhecido"}`,
    );
  }
}