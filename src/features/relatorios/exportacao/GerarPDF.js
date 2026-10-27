import jsPDF from "jspdf";
import { obterColunasRelatorio } from "../config/Colunas.config";
import { COLUNAS_NUMERICAS } from "../utils/Visualizacao";
import { LOGO_PROPORCAO, LOGO_RELATORIO } from "./logoRelatorio";
import { linhaEhTotalGeral } from "@/features/relatorios/exportacao/Comum";
import { formatarDataHoraFrase } from "@/shared/lib/datas";

/* Padrão visual dos PDFs — versão 4 (23/10). Só apresentação. */
const COR = {
  azul: [11, 31, 92],
  azulClaro: [232, 238, 252],
  bordaCabecalho: [214, 222, 240],
  verde: [22, 163, 74],
  verdeTexto: [21, 128, 61],
  verdeFundo: [240, 253, 244],
  texto: [15, 23, 42],
  texto2: [100, 116, 139],
  linha: [230, 235, 242],
  zebra: [248, 250, 252],
};

/* Números à direita (mesmas colunas numéricas da tela e do Excel). */
const COLUNAS_DIREITA = new Set([
  ...COLUNAS_NUMERICAS,
  "valor_previsto",
  "valor_realizado",
  "variacao",
  "variacao_percentual",
  "quantidade_kg",
  "preco",
  "ipi",
  "total",
]);

function obterColunasPdf(relatorio) {
  const colunas = [...obterColunasRelatorio(relatorio)];

  if (relatorio?.id !== "producao-produto") {
    return colunas;
  }

  if (colunas.some((coluna) => coluna.chave === "descricao_produto")) {
    return colunas;
  }

  const indiceProduto = colunas.findIndex((coluna) => coluna.chave === "produto");

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

export function gerarPdfRelatorio({ relatorio, dados, textoFiltros }) {
  if (!relatorio) return;

  if (!Array.isArray(dados) || dados.length === 0) {
    alert("Nenhum dado encontrado com os filtros selecionados.");
    return;
  }

  const relatorioProdutosPorData = relatorio.id === "pedidos-produto-data";

  const colunas = obterColunasPdf(relatorio);

  if (colunas.length === 0) {
    alert("Nenhuma coluna configurada para este relatório.");
    return;
  }

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

  const larguraDisponivel = pageWidth - margemEsquerda - margemDireita;

  const limiteInferior = pageHeight - margemInferior;

  let y = margemSuperior;

  // CABEÇALHO: logo | título + filtros | data de geração; linha verde

  const textoEmissao = `Gerado em ${formatarDataHoraFrase(new Date())}`;

  const alturaLogo = 7;
  const larguraLogo = alturaLogo * LOGO_PROPORCAO;

  try {
    doc.addImage(LOGO_RELATORIO, "PNG", margemEsquerda, y - 1, larguraLogo, alturaLogo);
  } catch {
    // Sem logo o relatório continua sendo gerado.
  }

  const xTexto = margemEsquerda + larguraLogo + 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const larguraEmissao = doc.getTextWidth(textoEmissao);
  const larguraTexto = pageWidth - margemDireita - xTexto - larguraEmissao - 6;

  if (relatorio.categoria) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COR.verde);
    doc.text(String(relatorio.categoria).toUpperCase(), xTexto, y);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COR.texto);

  const tituloRelatorio = doc.splitTextToSize(String(relatorio.titulo || ""), larguraTexto);

  doc.text(tituloRelatorio, xTexto, y + 5.2);
  let yTexto = y + 5.2 + (tituloRelatorio.length - 1) * 5.2;

  const textoParametros = String(textoFiltros || "Sem filtros adicionais");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COR.texto2);

  const parametrosQuebrados = doc.splitTextToSize(`Filtros: ${textoParametros}`, larguraTexto);

  doc.text(parametrosQuebrados, xTexto, yTexto + 4.5);
  yTexto += 4.5 + (parametrosQuebrados.length - 1) * 3.6;

  doc.setFontSize(7.5);
  doc.text(textoEmissao, pageWidth - margemDireita, y + 5.2, { align: "right" });

  y = Math.max(yTexto, y + alturaLogo) + 3.5;

  doc.setDrawColor(...COR.verde);
  doc.setLineWidth(0.7);
  doc.line(margemEsquerda, y, pageWidth - margemDireita, y);

  y += 6;

  // POSICIONAMENTO DAS COLUNAS

  const larguraTotalConfigurada = colunas.reduce(
    (total, coluna) => total + Number(coluna.larguraPdf || 20),
    0,
  );

  const proporcao = larguraTotalConfigurada > 0 ? larguraDisponivel / larguraTotalConfigurada : 1;

  let xAtual = margemEsquerda;

  const colunasPosicionadas = colunas.map((coluna) => {
    const largura = Number(coluna.larguraPdf || 20) * proporcao;

    const resultado = {
      ...coluna,
      x: xAtual,
      largura,
    };

    xAtual += largura;

    return resultado;
  });

  const entrelinhaCabecalho = 3.5;
  const entrelinhaDados = 3.5;

  const paddingHorizontal = 2;

  const baselineCabecalho = 5;
  const baselineDados = 5.2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);

  const cabecalhosQuebrados = colunasPosicionadas.map((coluna) =>
    doc.splitTextToSize(
      String(coluna.titulo || " "),
      Math.max(1, coluna.largura - 2 * paddingHorizontal),
    ),
  );

  const maiorCabecalho = Math.max(1, ...cabecalhosQuebrados.map((linhas) => linhas.length));

  const alturaCabecalho = Math.max(9, 5 + maiorCabecalho * entrelinhaCabecalho);

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

  // CABEÇALHO DA TABELA

  const desenharCabecalhoTabela = () => {
    colunasPosicionadas.forEach((coluna) => {
      doc.setFillColor(...COR.azulClaro);
      doc.setDrawColor(...COR.bordaCabecalho);
      doc.setLineWidth(0.2);

      doc.rect(coluna.x, y, coluna.largura, alturaCabecalho, "FD");
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(...COR.azul);

    colunasPosicionadas.forEach((coluna, indice) => {
      const direita = COLUNAS_DIREITA.has(coluna.chave) && !camposCentralizados.has(coluna.chave);
      const centro = camposCentralizados.has(coluna.chave);
      cabecalhosQuebrados[indice].forEach((linha, indiceLinha) => {
        const yLinha = y + baselineCabecalho + indiceLinha * entrelinhaCabecalho;
        if (centro) {
          doc.text(linha, coluna.x + coluna.largura / 2, yLinha, { align: "center" });
        } else if (direita) {
          doc.text(linha, coluna.x + coluna.largura - paddingHorizontal, yLinha, {
            align: "right",
          });
        } else {
          doc.text(linha, coluna.x + paddingHorizontal, yLinha);
        }
      });
    });

    y += alturaCabecalho;
  };

  const novaPaginaTabela = () => {
    doc.addPage();

    y = margemSuperior;

    desenharCabecalhoTabela();
  };

  if (y + alturaCabecalho > limiteInferior) {
    doc.addPage();
    y = margemSuperior;
  }

  desenharCabecalhoTabela();

  // LINHAS DA TABELA

  dados.forEach((item, index) => {
    const totalGeral = linhaEhTotalGeral(item);

    const linhaPar = index % 2 === 0;

    doc.setFont("helvetica", totalGeral ? "bold" : "normal");

    doc.setFontSize(8.4);

    const celulasQuebradas = colunasPosicionadas.map((coluna) => {
      const valor = typeof coluna.valor === "function" ? coluna.valor(item) : "-";

      const texto = valor === null || valor === undefined || valor === "" ? "-" : String(valor);

      return doc.splitTextToSize(texto, Math.max(1, coluna.largura - 2 * paddingHorizontal));
    });

    const totalLinhas = Math.max(1, ...celulasQuebradas.map((linhas) => linhas.length));

    const alturaLinhaCompleta = Math.max(8, 4.5 + totalLinhas * entrelinhaDados);

    const alturaUtilPaginaTabela = limiteInferior - (margemSuperior + alturaCabecalho);

    if (y + alturaLinhaCompleta > limiteInferior && alturaLinhaCompleta <= alturaUtilPaginaTabela) {
      novaPaginaTabela();
    }

    let inicioLinhas = 0;

    while (inicioLinhas < totalLinhas) {
      const linhasQueCabem = Math.floor((limiteInferior - y - 4.5) / entrelinhaDados);

      if (linhasQueCabem < 1) {
        novaPaginaTabela();
        continue;
      }

      const quantidadeLinhas = Math.min(totalLinhas - inicioLinhas, linhasQueCabem);

      const alturaTrecho = Math.max(8, 4.5 + quantidadeLinhas * entrelinhaDados);

      // FUNDO DAS CÉLULAS

      colunasPosicionadas.forEach((coluna) => {
        if (totalGeral) {
          doc.setFillColor(...COR.verdeFundo);
        } else if (linhaPar) {
          doc.setFillColor(255, 255, 255);
        } else {
          doc.setFillColor(...COR.zebra);
        }

        doc.setDrawColor(...COR.linha);
        doc.setLineWidth(0.15);

        doc.rect(coluna.x, y, coluna.largura, alturaTrecho, "FD");
      });

      // TEXTO DAS CÉLULAS

      doc.setFont("helvetica", totalGeral ? "bold" : "normal");

      doc.setFontSize(8.4);

      if (totalGeral) {
        doc.setTextColor(...COR.verdeTexto);
      } else {
        doc.setTextColor(51, 65, 85);
      }

      colunasPosicionadas.forEach((coluna, indice) => {
        const trecho = celulasQuebradas[indice].slice(
          inicioLinhas,
          inicioLinhas + quantidadeLinhas,
        );

        const centralizado = camposCentralizados.has(coluna.chave);

        const direita = !centralizado && COLUNAS_DIREITA.has(coluna.chave);

        trecho.forEach((linha, indiceLinha) => {
          const posicaoY = y + baselineDados + indiceLinha * entrelinhaDados;

          if (centralizado) {
            doc.text(linha, coluna.x + coluna.largura / 2, posicaoY, {
              align: "center",
            });
          } else if (direita) {
            doc.text(linha, coluna.x + coluna.largura - paddingHorizontal, posicaoY, {
              align: "right",
            });
          } else {
            doc.text(linha, coluna.x + paddingHorizontal, posicaoY);
          }
        });
      });

      y += alturaTrecho;

      inicioLinhas += quantidadeLinhas;

      if (inicioLinhas < totalLinhas) {
        novaPaginaTabela();
      }
    }
  });

  // TOTAL GERAL — PRODUTOS POR DATA DE FATURAMENTO

  if (relatorioProdutosPorData) {
    const totaisPorUnidade = new Map();

    dados.forEach((item) => {
      if (linhaEhTotalGeral(item)) return;

      const unidade = String(item?.unidade ?? item?.un ?? "")
        .trim()
        .toUpperCase();

      const quantidade = Number(item?.quantidade);

      if (!Number.isFinite(quantidade)) return;

      totaisPorUnidade.set(unidade, (totaisPorUnidade.get(unidade) || 0) + quantidade);
    });

    for (const [unidade, quantidade] of totaisPorUnidade) {
      const alturaTotal = 10;

      if (y + alturaTotal > limiteInferior) {
        novaPaginaTabela();
      }

      // FUNDO AZUL CLARO NA LINHA DO TOTAL

      colunasPosicionadas.forEach((coluna) => {
        doc.setFillColor(...COR.verdeFundo);
        doc.setDrawColor(...COR.verde);
        doc.setLineWidth(0.2);

        doc.rect(coluna.x, y, coluna.largura, alturaTotal, "FD");
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...COR.verdeTexto);

      const quantidadeFormatada = quantidade.toLocaleString("pt-BR", {
        maximumFractionDigits: 3,
      });

      const textoQuantidade = `${quantidadeFormatada}${unidade ? ` ${unidade}` : ""}`;

      // IDENTIFICAR A PRIMEIRA COLUNA E A COLUNA QUANTIDADE

      const primeiraColuna = colunasPosicionadas[0];

      const colunaQuantidade = colunasPosicionadas.find((coluna) => coluna.chave === "quantidade");

      // TOTAL GERAL NA PRIMEIRA COLUNA, ALINHADO À ESQUERDA

      doc.text("TOTAL GERAL", (primeiraColuna?.x ?? margemEsquerda) + paddingHorizontal, y + 6.5, {
        align: "left",
      });

      // VALOR NA COLUNA QUANTIDADE, ALINHADO À ESQUERDA

      if (colunaQuantidade) {
        doc.text(textoQuantidade, colunaQuantidade.x + paddingHorizontal, y + 6.5, {
          align: "left",
        });
      }

      y += alturaTotal;
    }
  } else {
    // MANTER COMPORTAMENTO DOS OUTROS RELATÓRIOS

    y += 7;

    if (y > pageHeight - 15) {
      doc.addPage();
      y = margemSuperior;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
  }

  // NUMERAÇÃO DAS PÁGINAS

  const totalPaginas = doc.getNumberOfPages();

  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);

    doc.setDrawColor(...COR.linha);
    doc.setLineWidth(0.2);
    doc.line(margemEsquerda, pageHeight - 9.5, pageWidth - margemDireita, pageHeight - 9.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.text(`Pedrasplast · ${relatorio.titulo || "Relatório"}`, margemEsquerda, pageHeight - 6);

    doc.text(`Página ${pagina} de ${totalPaginas}`, pageWidth - margemDireita, pageHeight - 6, {
      align: "right",
    });
  }

  // SALVAR PDF

  doc.save(`${relatorio.id}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
