/* =========================================================
   EXPORTAÇÃO PDF - PEDIDOS ALTERADOS

   Histórico sempre expandido:

   PEDIDO
     -> ALTERAÇÃO
        -> CAMPO
        -> ANTES
        -> DEPOIS
========================================================= */


function formatarFiltroData(
  valor,
) {
  if (!valor) {
    return "Sem limite";
  }

  return String(valor)
    .split("-")
    .reverse()
    .join("/");
}


function obterNomeArquivo() {
  const data =
    new Date()
      .toISOString()
      .slice(0, 10);

  return `Pedidos_Alterados_${data}.pdf`;
}


export async function exportarPdfPedidosAlterados({
  pedidos,
  dataInicial,
  dataFinal,
  pesquisa,
  extrairMudancas,
  formatarDataHora,
}) {
  if (
    !Array.isArray(pedidos) ||
    pedidos.length === 0
  ) {
    window.alert(
      "Não existem dados para exportar.",
    );

    return;
  }


  /* =======================================================
     CARREGA JSPDF
  ======================================================= */

  const moduloJsPdf =
    await import("jspdf");


  const jsPDF =
    moduloJsPdf.default ||
    moduloJsPdf.jsPDF;


  const doc =
    new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });


  /* =======================================================
     DIMENSÕES
  ======================================================= */

  const larguraPagina =
    doc.internal.pageSize.getWidth();


  const alturaPagina =
    doc.internal.pageSize.getHeight();


  const margem = 12;


  const larguraUtil =
    larguraPagina -
    margem * 2;


  let y = margem;


  /* =======================================================
     AUXILIARES
  ======================================================= */

  function novaPagina() {
    doc.addPage();

    y = margem;
  }


  function garantirEspaco(
    alturaNecessaria,
  ) {
    if (
      y + alturaNecessaria >
      alturaPagina - 14
    ) {
      novaPagina();
    }
  }


  function textoQuebrado(
    texto,
    largura,
  ) {
    return doc.splitTextToSize(
      String(
        texto ?? "-",
      ),
      largura,
    );
  }


  /* =======================================================
     CABEÇALHO
  ======================================================= */

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(16);

  doc.setTextColor(
    15,
    23,
    42,
  );


  doc.text(
    "RELATÓRIO DE PEDIDOS ALTERADOS",
    margem,
    y,
  );


  y += 7;


  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(8.5);

  doc.setTextColor(
    100,
    116,
    139,
  );


  doc.text(
    `Período: ${formatarFiltroData(
      dataInicial,
    )} até ${formatarFiltroData(
      dataFinal,
    )}`,
    margem,
    y,
  );


  y += 5;


  if (pesquisa) {
    const linhasPesquisa =
      textoQuebrado(
        `Pesquisa: ${pesquisa}`,
        larguraUtil,
      );


    doc.text(
      linhasPesquisa,
      margem,
      y,
    );


    y +=
      linhasPesquisa.length *
      4;
  }


  doc.text(
    `Emitido em ${new Date().toLocaleString(
      "pt-BR",
    )}`,
    margem,
    y,
  );


  y += 9;


  /* =======================================================
     PEDIDOS
  ======================================================= */

  for (const pedido of pedidos) {
    garantirEspaco(25);


    const numeroPedido =
      pedido?.numero_pedido ||
      pedido?.codigo_pedido_omie ||
      "-";


    /* =====================================================
       CABEÇALHO DO PEDIDO
    ===================================================== */

    doc.setFillColor(
      239,
      246,
      255,
    );

    doc.setDrawColor(
      191,
      219,
      254,
    );


    doc.roundedRect(
      margem,
      y,
      larguraUtil,
      16,
      2,
      2,
      "FD",
    );


    doc.setFont(
      "helvetica",
      "bold",
    );

    doc.setFontSize(10);

    doc.setTextColor(
      29,
      78,
      216,
    );


    doc.text(
      `Pedido ${numeroPedido}`,
      margem + 4,
      y + 5,
    );


    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(7.5);

    doc.setTextColor(
      71,
      85,
      105,
    );


    const infoPedido =
      `Cliente: ${pedido?.cliente || "-"} | ` +
      `Vendedor: ${pedido?.vendedor || "-"} | ` +
      `Alterações: ${Number(
        pedido?.quantidade_alteracoes ??
          0,
      )} | ` +
      `Última: ${formatarDataHora(
        pedido?.ultima_alteracao,
      )}`;


    const linhasInfo =
      textoQuebrado(
        infoPedido,
        larguraUtil - 8,
      );


    doc.text(
      linhasInfo,
      margem + 4,
      y + 10,
    );


    y += 20;


    /* =====================================================
       HISTÓRICO DO PEDIDO
    ===================================================== */

    const ocorrencias =
      Array.isArray(
        pedido?.detalhes_alteracoes,
      )
        ? pedido.detalhes_alteracoes
        : [];


    if (ocorrencias.length === 0) {
      garantirEspaco(10);


      doc.setFont(
        "helvetica",
        "italic",
      );

      doc.setFontSize(8);

      doc.setTextColor(
        100,
        116,
        139,
      );


      doc.text(
        pedido?.ultimo_resumo ||
          "Alteração registrada sem detalhamento.",
        margem + 4,
        y,
      );


      y += 9;

      continue;
    }


    /* =====================================================
       OCORRÊNCIAS
    ===================================================== */

    for (
      let indice = 0;
      indice < ocorrencias.length;
      indice += 1
    ) {
      const ocorrencia =
        ocorrencias[indice];


      const numeroOcorrencia =
        ocorrencias.length -
        indice;


      garantirEspaco(15);


      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.setFontSize(8.5);

      doc.setTextColor(
        30,
        41,
        59,
      );


      doc.text(
        `Alteração #${numeroOcorrencia}`,
        margem + 4,
        y,
      );


      doc.setFont(
        "helvetica",
        "normal",
      );

      doc.setTextColor(
        100,
        116,
        139,
      );


      doc.text(
        formatarDataHora(
          ocorrencia?.alterado_em,
        ),
        margem + 42,
        y,
      );


      y += 6;


      const mudancas =
        extrairMudancas(
          ocorrencia,
        );


      /* ===================================================
         SEM DETALHAMENTO
      =================================================== */

      if (mudancas.length === 0) {
        garantirEspaco(9);


        doc.setFont(
          "helvetica",
          "normal",
        );

        doc.setFontSize(8);

        doc.setTextColor(
          71,
          85,
          105,
        );


        const linhas =
          textoQuebrado(
            ocorrencia?.resumo ||
              "Alteração registrada sem detalhamento.",
            larguraUtil - 12,
          );


        doc.text(
          linhas,
          margem + 8,
          y,
        );


        y +=
          linhas.length *
            4 +
          3;


        continue;
      }


      /* ===================================================
         CAMPOS ALTERADOS
      =================================================== */

      for (const mudanca of mudancas) {
        const larguraCampo = 48;


        const larguraAntes =
          (
            larguraUtil -
            larguraCampo -
            12
          ) /
          2;


        const larguraDepois =
          larguraAntes;


        doc.setFontSize(7.5);


        const linhasCampo =
          textoQuebrado(
            mudanca.campo || "-",
            larguraCampo - 4,
          );


        const linhasAntes =
          textoQuebrado(
            `Antes: ${
              mudanca.anterior ??
              "-"
            }`,
            larguraAntes - 4,
          );


        const linhasDepois =
          textoQuebrado(
            `Depois: ${
              mudanca.novo ??
              "-"
            }`,
            larguraDepois - 4,
          );


        const quantidadeLinhas =
          Math.max(
            linhasCampo.length,
            linhasAntes.length,
            linhasDepois.length,
          );


        const alturaBloco =
          Math.max(
            10,
            quantidadeLinhas *
              3.5 +
              5,
          );


        garantirEspaco(
          alturaBloco + 3,
        );


        /* =================================================
           FUNDO
        ================================================= */

        doc.setFillColor(
          248,
          250,
          252,
        );

        doc.setDrawColor(
          226,
          232,
          240,
        );


        doc.roundedRect(
          margem + 6,
          y - 3,
          larguraUtil - 12,
          alturaBloco,
          1.5,
          1.5,
          "FD",
        );


        /* =================================================
           CAMPO
        ================================================= */

        doc.setFont(
          "helvetica",
          "bold",
        );

        doc.setTextColor(
          30,
          41,
          59,
        );


        doc.text(
          linhasCampo,
          margem + 9,
          y + 1,
        );


        /* =================================================
           ANTES
        ================================================= */

        doc.setFont(
          "helvetica",
          "normal",
        );

        doc.setTextColor(
          71,
          85,
          105,
        );


        doc.text(
          linhasAntes,
          margem +
            9 +
            larguraCampo,
          y + 1,
        );


        /* =================================================
           DEPOIS
        ================================================= */

        doc.setFont(
          "helvetica",
          "bold",
        );

        doc.setTextColor(
          29,
          78,
          216,
        );


        doc.text(
          linhasDepois,
          margem +
            9 +
            larguraCampo +
            larguraAntes,
          y + 1,
        );


        y +=
          alturaBloco +
          3;
      }


      y += 2;
    }


    /*
     * Espaço entre os pedidos.
     */
    y += 5;
  }


  /* =======================================================
     PAGINAÇÃO
  ======================================================= */

  const totalPaginas =
    doc.getNumberOfPages();


  for (
    let pagina = 1;
    pagina <= totalPaginas;
    pagina += 1
  ) {
    doc.setPage(pagina);


    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(7);

    doc.setTextColor(
      148,
      163,
      184,
    );


    doc.text(
      `Página ${pagina} de ${totalPaginas}`,
      larguraPagina - margem,
      alturaPagina - 6,
      {
        align: "right",
      },
    );
  }


  /* =======================================================
     DOWNLOAD
  ======================================================= */

  doc.save(
    obterNomeArquivo(),
  );
}