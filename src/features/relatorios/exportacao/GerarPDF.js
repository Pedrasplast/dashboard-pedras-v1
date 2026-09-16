import jsPDF from "jspdf";
import { obterColunasRelatorio } from "../config/Colunas.config";

/* =====================================================
   COLUNAS PARA PDF
   Mantém a configuração dos relatórios e adiciona a
   descrição somente quando necessária em produção-produto.
===================================================== */

function obterColunasPdf(relatorio) {
  const colunas = [...obterColunasRelatorio(relatorio)];

  if (relatorio?.id !== "producao-produto") {
    return colunas;
  }

  if (colunas.some((coluna) => coluna.chave === "descricao_produto")) {
    return colunas;
  }

  const indiceProduto = colunas.findIndex(
    (coluna) => coluna.chave === "produto",
  );

  const colunaDescricao = {
    chave: "descricao_produto",
    titulo: "Descrição do Produto",
    larguraPdf: 48,
    valor: (item) => item.descricao_produto || "-",
  };

  if (indiceProduto !== -1) {
    colunas.splice(indiceProduto + 1, 0, colunaDescricao);
  } else {
    colunas.unshift(colunaDescricao);
  }

  return colunas;
}

/* =====================================================
   IDENTIFICAR LINHA TOTAL GERAL
===================================================== */

function linhaEhTotalGeral(item) {
  return Object.values(item || {}).some(
    (valor) => String(valor ?? "").trim().toUpperCase() === "TOTAL GERAL",
  );
}

/* =====================================================
   GERADOR DE PDF
===================================================== */

export function gerarPdfRelatorio({ relatorio, dados, textoFiltros }) {
  if (!relatorio) return;

  if (!Array.isArray(dados) || dados.length === 0) {
    alert("Nenhum dado encontrado com os filtros selecionados.");
    return;
  }

  const colunas = obterColunasPdf(relatorio);

  if (colunas.length === 0) {
    alert("Nenhuma coluna configurada para este relatório.");
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

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margemEsquerda = 12;
  const margemDireita = 12;
  const margemSuperior = 12;
  const margemInferior = 13;

  const larguraDisponivel =
    pageWidth - margemEsquerda - margemDireita;

  const limiteInferior = pageHeight - margemInferior;

  let y = margemSuperior;

  /* =====================================================
     TÍTULO E DESCRIÇÃO DO RELATÓRIO
     Também permite títulos longos em mais de uma linha.
  ===================================================== */

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);

  const tituloRelatorio = doc.splitTextToSize(
    String(relatorio.titulo || "").toUpperCase(),
    larguraDisponivel,
  );

  if (tituloRelatorio.length > 0) {
    doc.text(tituloRelatorio, margemEsquerda, y);
    y += 6 * tituloRelatorio.length;
  } else {
    y += 6;
  }

  /* =====================================================
     DESCRIÇÃO DO RELATÓRIO
  ===================================================== */

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  const descricao = doc.splitTextToSize(
    String(relatorio.descricao || ""),
    larguraDisponivel,
  );

  if (descricao.length > 0 && descricao.some((linha) => linha.trim())) {
    doc.text(descricao, margemEsquerda, y);
    y += Math.max(4, descricao.length * 4);
  } else {
    y += 4;
  }

  /* =====================================================
     DATA DE EMISSÃO
  ===================================================== */

  const agora = new Date();

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);

  doc.text(
    `Emitido em ${agora.toLocaleDateString("pt-BR")} às ${agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    margemEsquerda,
    y,
  );

  y += 8;

  /* =====================================================
     PARÂMETROS
  ===================================================== */

  const textoParametros = String(
    textoFiltros || "Sem filtros adicionais"
  );

  const parametrosQuebrados = doc.splitTextToSize(
    textoParametros,
    larguraDisponivel - 10,
  );

  const alturaParametros = Math.max(
    17,
    11 + parametrosQuebrados.length * 3.5,
  );

  if (y + alturaParametros > limiteInferior) {
    doc.addPage();
    y = margemSuperior;
  }

  /* Fundo */

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(218, 226, 236);
  doc.setLineWidth(0.2);

  doc.roundedRect(
    margemEsquerda,
    y,
    larguraDisponivel,
    alturaParametros,
    2,
    2,
    "FD",
  );

  /* Título dos parâmetros */

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text(
    "PARÂMETROS",
    margemEsquerda + 4,
    y + 5,
  );

  /* Conteúdo */

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.text(
    parametrosQuebrados,
    margemEsquerda + 4,
    y + 10,
  );

  y += alturaParametros + 9;

  /* =====================================================
     POSICIONAMENTO DAS COLUNAS
     Mantém a proporção original.
  ===================================================== */

  const larguraTotalConfigurada = colunas.reduce(
    (total, coluna) =>
      total + Number(coluna.larguraPdf || 20),
    0,
  );

  const proporcao =
    larguraTotalConfigurada > 0
      ? larguraDisponivel / larguraTotalConfigurada
      : 1;

  let xAtual = margemEsquerda;

  const colunasPosicionadas = colunas.map((coluna) => {
    const largura =
      Number(coluna.larguraPdf || 20) * proporcao;

    const resultado = {
      ...coluna,
      x: xAtual,
      largura,
    };

    xAtual += largura;

    return resultado;
  });

  /* =====================================================
     CABEÇALHO DINÂMICO

     CORREÇÃO:
     Antes o código utilizava tituloQuebrado[0],
     descartando a segunda linha e todas as demais.

     Agora o cabeçalho utiliza todas as linhas e
     calcula automaticamente a altura necessária.
  ===================================================== */

  const entrelinhaCabecalho = 3.5;
  const entrelinhaDados = 3.5;

  const paddingHorizontal = 2;

  const baselineCabecalho = 5;
  const baselineDados = 5.2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);

  /* Quebrar todos os títulos */

  const cabecalhosQuebrados = colunasPosicionadas.map(
    (coluna) =>
      doc.splitTextToSize(
        String(coluna.titulo || " "),
        Math.max(
          1,
          coluna.largura - 2 * paddingHorizontal,
        ),
      ),
  );

  /* Encontrar o cabeçalho com maior quantidade de linhas */

  const maiorCabecalho = Math.max(
    1,
    ...cabecalhosQuebrados.map(
      (linhas) => linhas.length
    ),
  );

  /* Altura automática */

  const alturaCabecalho = Math.max(
    9,
    5 + maiorCabecalho * entrelinhaCabecalho,
  );

  /* =====================================================
     DESENHAR CABEÇALHO
  ===================================================== */

  const desenharCabecalhoTabela = () => {

    /* Fundo das células */

    colunasPosicionadas.forEach((coluna) => {
      doc.setFillColor(30, 41, 59);
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.2);

      doc.rect(
        coluna.x,
        y,
        coluna.largura,
        alturaCabecalho,
        "FD",
      );
    });

    /* Fonte do cabeçalho */

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(255, 255, 255);

    /* Desenhar TODAS as linhas de cada título */

    colunasPosicionadas.forEach((coluna, indice) => {

      cabecalhosQuebrados[indice].forEach(
        (linha, indiceLinha) => {

          doc.text(
            linha,
            coluna.x + paddingHorizontal,
            y +
              baselineCabecalho +
              indiceLinha * entrelinhaCabecalho,
          );

        },
      );

    });

    y += alturaCabecalho;
  };

  /* =====================================================
     CRIAR NOVA PÁGINA DA TABELA
  ===================================================== */

  const novaPaginaTabela = () => {
    doc.addPage();

    y = margemSuperior;

    desenharCabecalhoTabela();
  };

  /* =====================================================
     PRIMEIRO CABEÇALHO
  ===================================================== */

  if (y + alturaCabecalho > limiteInferior) {
    doc.addPage();
    y = margemSuperior;
  }

  desenharCabecalhoTabela();

  /* =====================================================
     CAMPOS CENTRALIZADOS
     Mantém os alinhamentos anteriores.
  ===================================================== */

  const camposCentralizados = new Set([
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
  ]);

  /* =====================================================
     LINHAS DA TABELA

     CORREÇÃO:
     - Altura variável.
     - Descrição completa.
     - Quebra automática de linha.
     - Continuação na página seguinte quando necessário.
     - Mantém a identificação de TOTAL GERAL.
  ===================================================== */

  dados.forEach((item, index) => {

    const totalGeral = linhaEhTotalGeral(item);

    const linhaPar = index % 2 === 0;

    doc.setFont(
      "helvetica",
      totalGeral ? "bold" : "normal",
    );

    doc.setFontSize(8.4);

    /* =====================================================
       PREPARAR TEXTOS DAS CÉLULAS
    ===================================================== */

    const celulasQuebradas = colunasPosicionadas.map(
      (coluna) => {

        const valor =
          typeof coluna.valor === "function"
            ? coluna.valor(item)
            : "-";

        const texto =
          valor === null ||
          valor === undefined ||
          valor === ""
            ? "-"
            : String(valor);

        return doc.splitTextToSize(
          texto,
          Math.max(
            1,
            coluna.largura - 2 * paddingHorizontal,
          ),
        );

      },
    );

    /* =====================================================
       CALCULAR ALTURA DA LINHA
    ===================================================== */

    const totalLinhas = Math.max(
      1,
      ...celulasQuebradas.map(
        (linhas) => linhas.length,
      ),
    );

    const alturaLinhaCompleta = Math.max(
      8,
      4.5 + totalLinhas * entrelinhaDados,
    );

    const alturaUtilPaginaTabela =
      limiteInferior -
      (margemSuperior + alturaCabecalho);

    /* Manter a linha inteira na mesma página, se possível */

    if (
      y + alturaLinhaCompleta > limiteInferior &&
      alturaLinhaCompleta <= alturaUtilPaginaTabela
    ) {
      novaPaginaTabela();
    }

    let inicioLinhas = 0;

    /* =====================================================
       PERMITIR QUE UMA LINHA LONGA CONTINUE EM OUTRA PÁGINA
    ===================================================== */

    while (inicioLinhas < totalLinhas) {

      const linhasQueCabem = Math.floor(
        (limiteInferior - y - 4.5) /
          entrelinhaDados,
      );

      if (linhasQueCabem < 1) {
        novaPaginaTabela();
        continue;
      }

      const quantidadeLinhas = Math.min(
        totalLinhas - inicioLinhas,
        linhasQueCabem,
      );

      const alturaTrecho = Math.max(
        8,
        4.5 + quantidadeLinhas * entrelinhaDados,
      );

      /* =====================================================
         FUNDO DAS CÉLULAS
      ===================================================== */

      colunasPosicionadas.forEach((coluna) => {

        if (totalGeral) {
          doc.setFillColor(241, 245, 249);
        } else if (linhaPar) {
          doc.setFillColor(248, 250, 252);
        } else {
          doc.setFillColor(255, 255, 255);
        }

        doc.setDrawColor(222, 228, 236);
        doc.setLineWidth(0.15);

        doc.rect(
          coluna.x,
          y,
          coluna.largura,
          alturaTrecho,
          "FD",
        );

      });

      /* =====================================================
         TEXTO DAS CÉLULAS
      ===================================================== */

      doc.setFont(
        "helvetica",
        totalGeral ? "bold" : "normal",
      );

      doc.setFontSize(8.4);

      doc.setTextColor(
        totalGeral ? 15 : 51,
        totalGeral ? 23 : 65,
        totalGeral ? 42 : 85,
      );

      colunasPosicionadas.forEach(
        (coluna, indice) => {

          /* Selecionar as linhas deste trecho */

          const trecho = celulasQuebradas[indice].slice(
            inicioLinhas,
            inicioLinhas + quantidadeLinhas,
          );

          const centralizado =
            camposCentralizados.has(coluna.chave);

          /* Desenhar todas as linhas do texto */

          trecho.forEach((linha, indiceLinha) => {

            const posicaoY =
              y +
              baselineDados +
              indiceLinha * entrelinhaDados;

            if (centralizado) {

              doc.text(
                linha,
                coluna.x + coluna.largura / 2,
                posicaoY,
                {
                  align: "center",
                },
              );

            } else {

              doc.text(
                linha,
                coluna.x + paddingHorizontal,
                posicaoY,
              );

            }

          });

        },
      );

      /* Avançar posição */

      y += alturaTrecho;

      inicioLinhas += quantidadeLinhas;

      /* Se ainda houver texto, continuar na próxima página */

      if (inicioLinhas < totalLinhas) {
        novaPaginaTabela();
      }

    }

  });

  /* =====================================================
     TOTAL DE REGISTROS
  ===================================================== */

  y += 7;

  if (y > pageHeight - 15) {
    doc.addPage();
    y = margemSuperior;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  doc.text(
    `Total de registros: ${dados.length}`,
    margemEsquerda,
    y,
  );

  /* =====================================================
     NUMERAÇÃO DAS PÁGINAS
  ===================================================== */

  const totalPaginas = doc.getNumberOfPages();

  for (
    let pagina = 1;
    pagina <= totalPaginas;
    pagina += 1
  ) {

    doc.setPage(pagina);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.text(
      `Página ${pagina} de ${totalPaginas}`,
      pageWidth - margemDireita,
      pageHeight - 6,
      {
        align: "right",
      },
    );

  }

  /* =====================================================
     SALVAR PDF
  ===================================================== */

  doc.save(
    `${relatorio.id}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`,
  );
}