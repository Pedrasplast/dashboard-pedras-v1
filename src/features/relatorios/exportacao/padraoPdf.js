import { LOGO_PROPORCAO, LOGO_RELATORIO } from "./logoRelatorio";

/* =========================================================
   PADRÃO VISUAL DOS PDFs DE RELATÓRIO — versão 4 (23/10)
   Cabeçalho (logo | categoria + título + informações | data)
   com linha verde, e rodapé com nome do relatório e página.
   Usado pelos exportadores próprios para ficarem iguais ao
   gerador comum (GerarPDF).
========================================================= */

export const COR_PDF = Object.freeze({
  azul: [11, 31, 92],
  azulClaro: [232, 238, 252],
  bordaAzul: [214, 222, 240],
  verde: [22, 163, 74],
  verdeTexto: [21, 128, 61],
  verdeFundo: [240, 253, 244],
  texto: [15, 23, 42],
  texto2: [100, 116, 139],
  linha: [230, 235, 242],
  zebra: [248, 250, 252],
});

function textoEmissao() {
  const agora = new Date();
  return `Gerado em ${agora.toLocaleDateString("pt-BR")} às ${agora.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/**
 * Desenha o cabeçalho padrão na página atual e devolve o y onde
 * o conteúdo começa. `informacoes`: linhas curtas (filtros, período…).
 */
export function desenharCabecalhoPdf(
  doc,
  { titulo, categoria, informacoes = [], margem = 12, y = 12 },
) {
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaLogo = 7;
  const larguraLogo = alturaLogo * LOGO_PROPORCAO;

  try {
    doc.addImage(LOGO_RELATORIO, "PNG", margem, y - 1, larguraLogo, alturaLogo);
  } catch {
    // Sem logo o relatório continua sendo gerado.
  }

  const xTexto = margem + larguraLogo + 6;
  const emissao = textoEmissao();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const larguraTexto = larguraPagina - margem - xTexto - doc.getTextWidth(emissao) - 6;

  if (categoria) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COR_PDF.verde);
    doc.text(String(categoria).toUpperCase(), xTexto, y);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...COR_PDF.texto);
  const linhasTitulo = doc.splitTextToSize(String(titulo || "Relatório"), larguraTexto);
  doc.text(linhasTitulo, xTexto, y + 5.2);
  let yTexto = y + 5.2 + (linhasTitulo.length - 1) * 5.2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COR_PDF.texto2);
  for (const info of informacoes.filter(Boolean)) {
    const linhas = doc.splitTextToSize(String(info), larguraTexto);
    doc.text(linhas, xTexto, yTexto + 4.5);
    yTexto += 4.5 + (linhas.length - 1) * 3.6;
  }

  doc.setFontSize(7.5);
  doc.text(emissao, larguraPagina - margem, y + 5.2, { align: "right" });

  let yFinal = Math.max(yTexto, y + alturaLogo) + 3.5;

  doc.setDrawColor(...COR_PDF.verde);
  doc.setLineWidth(0.7);
  doc.line(margem, yFinal, larguraPagina - margem, yFinal);
  doc.setLineWidth(0.2);

  yFinal += 6;
  return yFinal;
}

/** Rodapé padrão em todas as páginas: nome do relatório e "Página x de y". */
export function desenharRodapePdf(doc, { titulo, margem = 12 }) {
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();

  for (let pagina = 1; pagina <= total; pagina += 1) {
    doc.setPage(pagina);

    doc.setDrawColor(...COR_PDF.linha);
    doc.setLineWidth(0.2);
    doc.line(margem, alturaPagina - 9.5, larguraPagina - margem, alturaPagina - 9.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Pedrasplast · ${titulo || "Relatório"}`, margem, alturaPagina - 6);
    doc.text(`Página ${pagina} de ${total}`, larguraPagina - margem, alturaPagina - 6, {
      align: "right",
    });
  }
}
