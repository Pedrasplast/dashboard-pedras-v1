const ambienteDesenvolvimento = Boolean(import.meta.env?.DEV);

export function logDesenvolvimento(...argumentos) {
  if (ambienteDesenvolvimento) {
    console.log(...argumentos);
  }
}
