const TIPOS_INPUT_PRESERVAR = new Set([
  "email",
  "password",
  "url",
  "search",
  "file",
  "number",
  "date",
  "datetime-local",
  "time",
  "month",
  "week",
  "checkbox",
  "radio",
  "range",
  "color",
  "hidden",
]);

function devePreservarCaixa(
  elemento: HTMLInputElement | HTMLTextAreaElement,
): boolean {
  if (elemento.getAttribute("data-preservar-caixa") === "true") {
    return true;
  }

  if (elemento instanceof HTMLTextAreaElement) {
    return false;
  }

  const tipo = (elemento.type || "text").toLowerCase();

  return TIPOS_INPUT_PRESERVAR.has(tipo);
}

function converterValorParaMaiusculo(
  elemento: HTMLInputElement | HTMLTextAreaElement,
): void {
  if (devePreservarCaixa(elemento)) {
    return;
  }

  const valorAtual = elemento.value;
  const valorMaiusculo = valorAtual.toLocaleUpperCase("pt-BR");

  if (valorAtual === valorMaiusculo) {
    return;
  }

  const inicioSelecao = elemento.selectionStart;
  const fimSelecao = elemento.selectionEnd;
  const direcaoSelecao = elemento.selectionDirection;

  elemento.value = valorMaiusculo;

  if (
    inicioSelecao !== null &&
    fimSelecao !== null &&
    typeof elemento.setSelectionRange === "function"
  ) {
    elemento.setSelectionRange(
      inicioSelecao,
      fimSelecao,
      direcaoSelecao ?? undefined,
    );
  }
}

/**
 * Converte automaticamente campos textuais para letras maiúsculas.
 *
 * Campos preservados automaticamente:
 * - email
 * - password
 * - url
 * - search
 * - number
 * - datas/horários
 * - checkbox/radio
 * - file
 *
 * Para preservar manualmente um campo de texto:
 *
 * data-preservar-caixa="true"
 */
export function normalizarCamposMaiusculos(evento: {
  target: EventTarget | null;
}): void {
  const alvo = evento.target;

  if (
    alvo instanceof HTMLInputElement ||
    alvo instanceof HTMLTextAreaElement
  ) {
    converterValorParaMaiusculo(alvo);
  }
}