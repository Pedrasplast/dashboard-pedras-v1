
import {
  extrairMudancasCompra,
  protegerDadosPagamento,
} from "./formatarHistoricoCompras";

const FUSO = "America/Sao_Paulo";

/* =========================================================
   DATAS
========================================================= */

function dataHora(valor) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "-";
  }

  return data.toLocaleString("pt-BR", {
    timeZone: FUSO,

    day: "2-digit",
    month: "2-digit",
    year: "numeric",

    hour: "2-digit",
    minute: "2-digit",

    hour12: false,
  });
}

function nomeArquivo(extensao) {
  const partes = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: FUSO,

      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const pegar = (tipo) =>
    partes.find(
      (p) => p.type === tipo
    )?.value || "00";

  return (
    "Pedidos_de_Compra_Alterados_" +
    `${pegar("year")}-` +
    `${pegar("month")}-` +
    `${pegar("day")}.` +
    extensao
  );
}

/* =========================================================
   PROTEÇÃO DOS TEXTOS
========================================================= */

function textoSeguro(valor) {
  return protegerDadosPagamento(
    String(valor ?? "-")
  ).replace(
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,
    " "
  );
}

function celulaTexto(valor) {
  const conteudo =
    textoSeguro(valor);

  return (
    conteudo !== "-" &&
    /^[\s]*[=+@\-]/.test(conteudo)
  )
    ? `'${conteudo}`
    : conteudo;
}

/* =========================================================
   MUDANÇAS DE UM EVENTO
========================================================= */

function mudancasEvento(
  evento,
  pedido,
  referencias
) {
  if (
    Array.isArray(
      evento.mudancas
    )
  ) {
    return evento.mudancas;
  }

  const refsPedido = {
    ...referencias,

    itens:
      referencias.itensPorPedido?.[
        String(
          pedido.cod_ped_compra
        )
      ] || {},
  };

  return extrairMudancasCompra(
    evento,
    refsPedido
  );
}

/* =========================================================
   PDF
========================================================= */

export async function exportarPdfPedidosCompraAlterados(
  pedidos,
  periodo,
  referencias = {}
) {
  if (
    !Array.isArray(pedidos) ||
    pedidos.length === 0
  ) {
    return;
  }

  const { default: jsPDF } = await import(
    "jspdf"
  );

  const doc = new jsPDF({
    orientation: "landscape",

    unit: "mm",

    format: "a4",
  });

  const largura =
    doc.internal.pageSize.getWidth();

  const altura =
    doc.internal.pageSize.getHeight();

  const margem = 12;

  let y = margem;

  /* CONTROLE DE PÁGINA */

  function espaco(mm) {
    if (
      y + mm >
      altura - margem - 7
    ) {
      doc.addPage();

      y = margem;
    }
  }

  /* ESCREVER TEXTO */

  function escrever(
    valor,
    {
      negrito = false,
      tamanho = 9,
      recuo = 0,
    } = {}
  ) {
    doc.setFont(
      "helvetica",
      negrito
        ? "bold"
        : "normal"
    );

    doc.setFontSize(
      tamanho
    );

    const texto =
      textoSeguro(valor);

    const linhas =
      doc.splitTextToSize(
        texto,

        Math.max(
          25,
          largura -
            2 * margem -
            recuo
        )
      );

    for (const linha of linhas) {
      espaco(5);

      doc.text(
        linha || " ",

        margem + recuo,

        y
      );

      y += 4.5;
    }
  }

  /* CABEÇALHO */

  escrever(
    "PEDIDOS DE COMPRA ALTERADOS",
    {
      negrito: true,
      tamanho: 15,
    }
  );

  y += 2;

  escrever(
    `Período: ${periodo} | Pedidos: ${pedidos.length}`
  );

  escrever(
    "Data e hora indicam a detecção da alteração pelo dashboard.",
    {
      tamanho: 8,
    }
  );

  y += 5;

  /* PEDIDOS */

  for (const pedido of pedidos) {
    espaco(18);

    escrever(
      `PEDIDO DE COMPRA ${
        pedido.numero_pedido ||
        pedido.cod_ped_compra
      }`,

      {
        negrito: true,
        tamanho: 11,
      }
    );

    for (
      const evento of
      pedido.detalhes_alteracoes || []
    ) {
      const mudancas =
        mudancasEvento(
          evento,
          pedido,
          referencias
        );

      if (!mudancas.length) {
        continue;
      }

      y += 2;

      escrever(
        `Alteração #${
          evento.numeroAlteracao ||
          "-"
        } — ${dataHora(
          evento.detectado_em
        )}`,

        {
          negrito: true,
          tamanho: 9,
          recuo: 4,
        }
      );

      for (
        const mudanca of mudancas
      ) {
        espaco(12);

        escrever(
          mudanca.campo,

          {
            negrito: true,
            tamanho: 8,
            recuo: 8,
          }
        );

        escrever(
          `Antes: ${mudanca.anterior}`,

          {
            tamanho: 8,
            recuo: 12,
          }
        );

        escrever(
          `Depois: ${mudanca.novo}`,

          {
            tamanho: 8,
            recuo: 12,
          }
        );

        if (mudanca.variacao) {
          escrever(
            mudanca.variacao,

            {
              negrito: true,
              tamanho: 8,
              recuo: 12,
            }
          );
        }

        y += 2;
      }
    }

    y += 5;
  }

  /* NUMERAÇÃO DE PÁGINAS */

  const paginas =
    doc.getNumberOfPages();

  for (
    let pagina = 1;
    pagina <= paginas;
    pagina++
  ) {
    doc.setPage(
      pagina
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(
      8
    );

    doc.text(
      `Página ${pagina} de ${paginas}`,

      largura - margem,

      altura - 5,

      {
        align: "right",
      }
    );
  }

  doc.save(
    nomeArquivo("pdf")
  );
}

/* =========================================================
   EXCEL
========================================================= */

export async function exportarExcelPedidosCompraAlterados(
  pedidos,
  periodo,
  referencias = {}
) {
  if (
    !Array.isArray(pedidos) ||
    pedidos.length === 0
  ) {
    return;
  }

  const modulo = await import(
    "exceljs"
  );

  const ExcelJS =
    modulo.default ||
    modulo;

  const workbook =
    new ExcelJS.Workbook();

  workbook.creator =
    "Pedrasplast";

  /* =====================================================
     ABA RESUMO
  ===================================================== */

  const resumo =
    workbook.addWorksheet(
      "Resumo"
    );

  resumo.addRow([
    "PEDIDOS DE COMPRA ALTERADOS",
  ]);

  resumo.addRow([
    celulaTexto(
      `Período: ${periodo}`
    ),
  ]);

  resumo.addRow([
    "Pedido de compra",
    "Primeira detecção",
    "Última alteração",
    "Nº alterações",
    "O que foi alterado",
  ]);

  resumo.getRow(3).font = {
    bold: true,
  };

  resumo.views = [
    {
      state: "frozen",
      ySplit: 3,
    },
  ];

  resumo.columns = [
    22,
    23,
    23,
    18,
    65,
  ].map((width) => ({
    width,
  }));

  /* =====================================================
     ABA HISTÓRICO
  ===================================================== */

  const historico =
    workbook.addWorksheet(
      "Histórico Expandido"
    );

  historico.addRow([
    "Pedido de compra",
    "Alteração",
    "Detectado em",
    "Produto",
    "Código do produto",
    "O que mudou",
    "Antes",
    "Depois",
    "Diferença",
  ]);

  historico.getRow(1).font = {
    bold: true,
  };

  historico.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  historico.columns = [
    20,
    14,
    23,
    52,
    20,
    38,
    35,
    35,
    42,
  ].map((width) => ({
    width,
  }));

  /* =====================================================
     PREENCHER AS DUAS ABAS
  ===================================================== */

  for (const pedido of pedidos) {
    resumo.addRow([
      celulaTexto(
        pedido.numero_pedido ||
          pedido.cod_ped_compra
      ),

      dataHora(
        pedido.primeira_alteracao
      ),

      dataHora(
        pedido.ultima_alteracao
      ),

      Number(
        pedido.quantidade_alteracoes ||
          0
      ),

      celulaTexto(
        (
          pedido.campos_alterados ||
          []
        ).join(", ")
      ),
    ]);

    for (
      const evento of
      pedido.detalhes_alteracoes || []
    ) {
      for (
        const mudanca of
        mudancasEvento(
          evento,
          pedido,
          referencias
        )
      ) {
        historico.addRow([
          celulaTexto(
            pedido.numero_pedido ||
              pedido.cod_ped_compra
          ),

          celulaTexto(
            evento.numeroAlteracao ||
              "-"
          ),

          dataHora(
            evento.detectado_em
          ),

          celulaTexto(
            mudanca.produto?.descricao ||
              "Informação geral do pedido"
          ),

          celulaTexto(
            mudanca.produto?.codigoComercial ||
              "-"
          ),

          celulaTexto(
            mudanca.tituloCurto ||
              mudanca.campo
          ),

          celulaTexto(
            mudanca.anterior
          ),

          celulaTexto(
            mudanca.novo
          ),

          celulaTexto(
            mudanca.variacao ||
              "-"
          ),
        ]);
      }
    }
  }

  /* =====================================================
     AJUSTES VISUAIS DO EXCEL
  ===================================================== */

  resumo.autoFilter = {
    from: "A3",
    to: "E3",
  };

  historico.autoFilter = {
    from: "A1",
    to: "I1",
  };

  historico.eachRow((linha) => {
    linha.alignment = {
      vertical: "top",

      wrapText: true,
    };
  });

  /* =====================================================
     GERAR ARQUIVO
  ===================================================== */

  const buffer =
    await workbook.xlsx.writeBuffer();

  const blob = new Blob(
    [buffer],

    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  );

  const url =
    URL.createObjectURL(blob);

  try {
    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      nomeArquivo("xlsx");

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();
  } finally {
    setTimeout(
      () =>
        URL.revokeObjectURL(url),

      15000
    );
  }
}