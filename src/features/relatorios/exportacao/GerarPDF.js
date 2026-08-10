import jsPDF from "jspdf";

import {  obterColunasRelatorio,} from "../config/Colunas.config";

/* =====================================================
   GERADOR DE PDF
===================================================== */

export function gerarPdfRelatorio({
  relatorio,
  dados,
  textoFiltros,
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

  const colunas =
    obterColunasRelatorio(
      relatorio,
    );

  if (colunas.length === 0) {
    alert(
      "Nenhuma coluna configurada para este relatório.",
    );

    return;
  }

  /* =====================================================
     DOCUMENTO
  ===================================================== */

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  const margemEsquerda = 12;
  const margemDireita = 12;
  const margemSuperior = 12;
  const margemInferior = 13;

  const larguraDisponivel =
    pageWidth -
    margemEsquerda -
    margemDireita;

  let y =
    margemSuperior;

  /* =====================================================
     TÍTULO
  ===================================================== */

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
    String(
      relatorio.titulo ||
        "",
    ).toUpperCase(),
    margemEsquerda,
    y,
  );

  y += 6;

  /* =====================================================
     DESCRIÇÃO
  ===================================================== */

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(9);

  doc.setTextColor(
    100,
    116,
    139,
  );

  const descricao =
    doc.splitTextToSize(
      String(
        relatorio.descricao ||
          "",
      ),
      larguraDisponivel,
    );

  doc.text(
    descricao,
    margemEsquerda,
    y,
  );

  y +=
    Math.max(
      4,
      descricao.length * 4,
    );

  /* =====================================================
     DATA DE EMISSÃO
  ===================================================== */

  doc.setFontSize(8.5);

  doc.setTextColor(
    100,
    116,
    139,
  );

  doc.text(
    `Emitido em ${new Date().toLocaleDateString(
      "pt-BR",
    )} às ${new Date().toLocaleTimeString(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    )}`,
    margemEsquerda,
    y,
  );

  y += 8;

  /* =====================================================
     PARÂMETROS
  ===================================================== */

  const textoParametros =
    String(
      textoFiltros ||
        "Sem filtros adicionais",
    );

  const parametrosQuebrados =
    doc.splitTextToSize(
      textoParametros,
      larguraDisponivel -
        10,
    );

  const alturaParametros =
    Math.max(
      17,
      11 +
        parametrosQuebrados.length *
          3.5,
    );

  /* Fundo */

  doc.setFillColor(
    248,
    250,
    252,
  );

  doc.setDrawColor(
    218,
    226,
    236,
  );

  doc.setLineWidth(
    0.2,
  );

  doc.roundedRect(
    margemEsquerda,
    y,
    larguraDisponivel,
    alturaParametros,
    2,
    2,
    "FD",
  );

  /* Título */

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(
    8.5,
  );

  doc.setTextColor(
    71,
    85,
    105,
  );

  doc.text(
    "PARÂMETROS",
    margemEsquerda + 4,
    y + 5,
  );

  /* Conteúdo */

  doc.setFont(
    "helvetica",
    "normal",
  );

  doc.setFontSize(
    8.5,
  );

  doc.setTextColor(
    51,
    65,
    85,
  );

  doc.text(
    parametrosQuebrados,
    margemEsquerda + 4,
    y + 10,
  );

  y +=
    alturaParametros +
    9;

  /* =====================================================
     POSICIONAMENTO DAS COLUNAS
  ===================================================== */

  const larguraTotalConfigurada =
    colunas.reduce(
      (
        total,
        coluna,
      ) =>
        total +
        Number(
          coluna.larguraPdf ||
            20,
        ),
      0,
    );

  const proporcao =
    larguraTotalConfigurada >
    0
      ? larguraDisponivel /
        larguraTotalConfigurada
      : 1;

  let xAtual =
    margemEsquerda;

  const colunasPosicionadas =
    colunas.map(
      (coluna) => {
        const largura =
          Number(
            coluna.larguraPdf ||
              20,
          ) *
          proporcao;

        const resultado = {
          ...coluna,

          x: xAtual,

          largura,
        };

        xAtual +=
          largura;

        return resultado;
      },
    );

  /* =====================================================
     DIMENSÕES DA TABELA
  ===================================================== */

  const alturaCabecalho =
    9;

  const alturaLinha =
    8;

  /* =====================================================
     CABEÇALHO DA TABELA
  ===================================================== */

  const desenharCabecalhoTabela =
    () => {
      /*
       * Primeiro desenhamos TODAS as células.
       *
       * Isso evita o problema de setTextColor
       * mudar a cor usada no próximo preenchimento.
       */

      colunasPosicionadas.forEach(
        (coluna) => {
          doc.setFillColor(
            30,
            41,
            59,
          );

          doc.setDrawColor(
            148,
            163,
            184,
          );

          doc.setLineWidth(
            0.2,
          );

          doc.rect(
            coluna.x,
            y,
            coluna.largura,
            alturaCabecalho,
            "FD",
          );
        },
      );

      /*
       * Depois colocamos os textos.
       */

      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.setFontSize(
        8.2,
      );

      doc.setTextColor(
        255,
        255,
        255,
      );

      colunasPosicionadas.forEach(
        (coluna) => {
          const titulo =
            String(
              coluna.titulo ||
                "",
            );

          const tituloQuebrado =
            doc.splitTextToSize(
              titulo,
              Math.max(
                1,
                coluna.largura -
                  4,
              ),
            );

          const primeiraLinha =
            String(
              tituloQuebrado[0] ||
                "",
            );

          doc.text(
            primeiraLinha,
            coluna.x + 2,
            y + 5.7,
          );
        },
      );

      y +=
        alturaCabecalho;
    };

  /* =====================================================
     PRIMEIRO CABEÇALHO
  ===================================================== */

  desenharCabecalhoTabela();

  /* =====================================================
     LINHAS
  ===================================================== */

  dados.forEach(
    (
      item,
      index,
    ) => {
      /* ===============================================
         NOVA PÁGINA
      =============================================== */

      if (
        y +
          alturaLinha >
        pageHeight -
          margemInferior
      ) {
        doc.addPage();

        y =
          margemSuperior;

        desenharCabecalhoTabela();
      }

      /* ===============================================
         FUNDO DA LINHA

         Primeiro desenhamos TODA a linha.
      =============================================== */

      const linhaPar =
        index % 2 === 0;

      colunasPosicionadas.forEach(
        (coluna) => {
          if (linhaPar) {
            doc.setFillColor(
              248,
              250,
              252,
            );
          } else {
            doc.setFillColor(
              255,
              255,
              255,
            );
          }

          doc.setDrawColor(
            222,
            228,
            236,
          );

          doc.setLineWidth(
            0.15,
          );

          doc.rect(
            coluna.x,
            y,
            coluna.largura,
            alturaLinha,
            "FD",
          );
        },
      );

      /* ===============================================
         TEXTO

         Só depois do fundo pronto,
         desenhamos os valores.
      =============================================== */

      doc.setFont(
        "helvetica",
        "normal",
      );

      doc.setFontSize(
        8.4,
      );

      doc.setTextColor(
        51,
        65,
        85,
      );

      colunasPosicionadas.forEach(
        (coluna) => {
          const valor =
            typeof coluna.valor ===
            "function"
              ? coluna.valor(
                  item,
                )
              : "-";

          const texto =
            valor === null ||
            valor ===
              undefined
              ? "-"
              : String(
                  valor,
                );

          const textoQuebrado =
            doc.splitTextToSize(
              texto,
              Math.max(
                1,
                coluna.largura -
                  4,
              ),
            );

          const textoFinal =
            String(
              textoQuebrado[0] ||
                "-",
            );

          /* ===========================================
             ALINHAMENTO

             Campos numéricos ficam centralizados.
             Texto permanece à esquerda.
          =========================================== */

          const camposCentralizados =
            [
              "ranking",
              "ocorrencias",
              "conforme",
              "danificada",
              "total_produzido",
              "peso",
              "consumo_total",
              "gasto_unidade",
              "peso_total",
              "tempo_total",
              "tempo_medio",
              "percentual_impacto",
            ];

          if (
            camposCentralizados.includes(
              coluna.chave,
            )
          ) {
            doc.text(
              textoFinal,
              coluna.x +
                coluna.largura /
                  2,
              y + 5.25,
              {
                align:
                  "center",
              },
            );
          } else {
            doc.text(
              textoFinal,
              coluna.x + 2,
              y + 5.25,
            );
          }
        },
      );

      y +=
        alturaLinha;
    },
  );

  /* =====================================================
     TOTAL DE REGISTROS
  ===================================================== */

  y += 7;

  if (
    y >
    pageHeight -
      15
  ) {
    doc.addPage();

    y =
      margemSuperior;
  }

  doc.setFont(
    "helvetica",
    "bold",
  );

  doc.setFontSize(
    9,
  );

  doc.setTextColor(
    15,
    23,
    42,
  );

  doc.text(
    `Total de registros: ${dados.length}`,
    margemEsquerda,
    y,
  );

  /* =====================================================
     NUMERAÇÃO DAS PÁGINAS
  ===================================================== */

  const totalPaginas =
    doc.getNumberOfPages();

  for (
    let pagina = 1;
    pagina <=
    totalPaginas;
    pagina += 1
  ) {
    doc.setPage(
      pagina,
    );

    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(
      7.5,
    );

    doc.setTextColor(
      148,
      163,
      184,
    );

    doc.text(
      `Página ${pagina} de ${totalPaginas}`,
      pageWidth -
        margemDireita,
      pageHeight -
        6,
      {
        align:
          "right",
      },
    );
  }

  /* =====================================================
     SALVA
  ===================================================== */

  doc.save(
    `${relatorio.id}_${new Date()
      .toISOString()
      .slice(
        0,
        10,
      )}.pdf`,
  );
}