/* =====================================================
   UTILITÁRIOS DE DURAÇÃO
===================================================== */

/*
 * Converte:
 *
 * 01:30:00
 * 12:45:20
 * 72:10:35
 *
 * para segundos.
 */

export function converterDuracaoParaSegundos(duracao) {
  if (!duracao) {
    return 0;
  }

  const texto = String(duracao).trim();

  if (!texto) {
    return 0;
  }

  const partes = texto.split(":").map(Number);

  if (partes.some((parte) => Number.isNaN(parte))) {
    return 0;
  }

  if (partes.length === 3) {
    const [horas, minutos, segundos] = partes;

    return (
      horas * 3600 +
      minutos * 60 +
      segundos
    );
  }

  if (partes.length === 2) {
    const [minutos, segundos] = partes;

    return minutos * 60 + segundos;
  }

  if (partes.length === 1) {
    return partes[0] || 0;
  }

  return 0;
}

/*
 * Faz o caminho inverso.
 *
 * Exemplo:
 *
 * 9000 segundos
 *
 * vira:
 *
 * 02:30:00
 *
 * Também aceita mais de 24 horas.
 */

export function formatarSegundosComoDuracao(
  totalSegundos,
) {
  const segundosValidos = Math.max(
    0,
    Number(totalSegundos) || 0,
  );

  const horas = Math.floor(
    segundosValidos / 3600,
  );

  const minutos = Math.floor(
    (segundosValidos % 3600) / 60,
  );

  const segundos = Math.floor(
    segundosValidos % 60,
  );

  return [
    String(horas).padStart(2, "0"),
    String(minutos).padStart(2, "0"),
    String(segundos).padStart(2, "0"),
  ].join(":");
}