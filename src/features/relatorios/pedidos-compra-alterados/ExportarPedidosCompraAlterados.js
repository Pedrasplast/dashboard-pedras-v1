
import {
  extrairMudancasCompra,
} from "./formatarHistoricoCompras";

const hora = (valor) =>
  valor
    ? new Date(valor).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      })
    : "-";

const nome = (extensao) =>
  `Pedidos_de_Compra_Alterados_${new Date()
    .toISOString()
    .slice(0, 10)}.${extensao}`;

export async function exportarPdfPedidosCompraAlterados(
  lista,
  periodo,
  referencias = {}
) {
  if (!lista.length) {
    return;
  }

  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();

  const margem = 12;

  let y = margem;

  function garantir(mm) {
    if (y + mm > altura - margem) {
      doc.addPage();
      y = margem;
    }
  }

  function linha(
    texto,
    negrito = false,
    tamanho = 9,
    recuo = 0
  ) {
    doc.setFont(
      "helvetica",
      negrito ? "bold" : "normal"
    );

    doc.setFontSize(tamanho);

    const quebradas = doc.splitTextToSize(
      String(texto),
      largura - 2 * margem - recuo
    );

    for (const parte of quebradas) {
      garantir(5);

      doc.text(
        parte,
        margem + recuo,
        y
      );

      y += 4.5;
    }
  }

  linha(
    "PEDIDOS DE COMPRA ALTERADOS — HISTÓRICO DETECTADO",
    true,
    15
  );

  y += 2;

  linha(
    `Período: ${periodo} | Pedidos de compra: ${lista.length}`,
    false,
    9
  );

  linha(
    "As datas indicam quando o dashboard detectou mudanças, não a hora exata da edição no Omie.",
    false,
    8
  );

  y += 3;

  for (const req of lista) {
    garantir(15);

    linha(
      `PEDIDO DE COMPRA ${
        req.numero_pedido ||
        req.cod_ped_compra
      } | ${
        req.quantidade_alteracoes
      } ocorrência(s)`,

      true,
      11
    );

    const eventos =
      req.detalhes_alteracoes || [];

    for (const evento of eventos) {
      const mudancas = extrairMudancasCompra(
        evento,
        referencias
      );

      if (!mudancas.length) {
        continue;
      }

      linha(
        `Detectado em ${hora(
          evento.detectado_em
        )}: ${mudancas
          .map((m) => m.campo)
          .join(", ")}`,

        true,
        9,
        4
      );

      for (const mudanca of mudancas) {
        linha(
          `${mudanca.campo}: ${mudanca.anterior}  →  ${mudanca.novo}`,

          false,
          8,
          8
        );
      }
    }

    y += 4;
  }

  const paginas = doc.getNumberOfPages();

  for (
    let pagina = 1;
    pagina <= paginas;
    pagina++
  ) {
    doc.setPage(pagina);

    doc.setFontSize(8);

    doc.text(
      `Página ${pagina} de ${paginas}`,
      largura - margem,
      altura - 5,

      {
        align: "right",
      }
    );
  }

  doc.save(nome("pdf"));
}

export async function exportarExcelPedidosCompraAlterados(
  lista,
  periodo,
  referencias = {}
) {
  if (!lista.length) {
    return;
  }

  const excel = await import("exceljs");

  const ExcelJS =
    excel.default || excel;

  const arquivo =
    new ExcelJS.Workbook();

  arquivo.creator = "Pedrasplast";

  /*
   * Aba 1: Resumo
   */

  const resumo = arquivo.addWorksheet(
    "Resumo"
  );

  resumo.addRow([
    "PEDIDOS DE COMPRA ALTERADOS",
  ]);

  resumo.addRow([
    `Período de detecção: ${periodo}`,
  ]);

  resumo.addRow([
    "Pedido de compra",
    "Primeira detecção",
    "Última detecção",
    "Nº ocorrências",
    "Campos alterados",
  ]);

  for (const req of lista) {
    resumo.addRow([
      String(
        req.numero_pedido ||
          req.cod_ped_compra
      ),

      hora(
        req.primeira_alteracao
      ),

      hora(
        req.ultima_alteracao
      ),

      Number(
        req.quantidade_alteracoes
      ),

      (
        req.campos_alterados || []
      ).join(", "),
    ]);
  }

  resumo.columns = [
    { width: 22 },
    { width: 23 },
    { width: 23 },
    { width: 18 },
    { width: 60 },
  ];

  resumo.getRow(3).font = {
    bold: true,
  };

  /*
   * Aba 2: Histórico expandido
   */

  const detalhes = arquivo.addWorksheet(
    "Histórico Expandido"
  );

  detalhes.addRow([
    "Pedido de compra",
    "Detectado em",
    "Campo",
    "Item Omie",
    "Antes",
    "Depois",
  ]);

  detalhes.getRow(1).font = {
    bold: true,
  };

  for (const req of lista) {
    for (
      const evento of
      req.detalhes_alteracoes || []
    ) {
      const mudancas = extrairMudancasCompra(
        evento,
        referencias
      );

      for (const m of mudancas) {
        detalhes.addRow([
          String(
            req.numero_pedido ||
              req.cod_ped_compra
          ),

          hora(
            evento.detectado_em
          ),

          m.campo,

          m.campo.match(
            /Item (\d+)/
          )?.[1] || "-",

          m.anterior,

          m.novo,
        ]);
      }
    }
  }

  detalhes.columns = [
    22,
    23,
    26,
    20,
    72,
    72,
  ].map((width) => ({
    width,
  }));

  detalhes.eachRow((row) => {
    row.alignment = {
      vertical: "top",
      wrapText: true,
    };
  });

  /*
   * Download do arquivo
   */

  const blob = await arquivo.xlsx.writeBuffer();

  const url = URL.createObjectURL(
    new Blob([blob], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
  );

  const a = document.createElement("a");

  a.href = url;

  a.download = nome("xlsx");

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}