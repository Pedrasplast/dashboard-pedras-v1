/**
 * Regras puras para repetir chamadas ao Omie quando o erro é temporário.
 *
 * O Omie recusa a chamada quando outra chamada do mesmo método está em
 * andamento com a mesma chave ("Já existe uma requisição desse método sendo
 * executada") ou quando a mesma consulta foi feita há pouco ("Consumo
 * redundante detectado. Aguarde N segundos"). Nos dois casos basta esperar
 * e tentar de novo, em vez de perder a atualização até o próximo horário.
 */

export const MAX_TENTATIVAS = 4;
/** Soma máxima de espera entre tentativas (a função tem ~150 s de vida). */
export const ESPERA_TOTAL_MAXIMA_MS = 75000;

function semAcento(texto) {
  return String(texto ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Devolve quanto esperar (ms) antes de tentar de novo, ou null se o erro não é temporário. */
export function esperaParaRepetir(mensagem, tentativa, status = 200) {
  const texto = semAcento(mensagem);
  if (texto.includes('consumo redundante')) {
    const segundos = Number(texto.match(/aguarde\s+(\d+)\s+segundo/)?.[1]);
    const base = Number.isFinite(segundos) && segundos > 0 ? segundos : 60;
    return Math.min(base, 60) * 1000 + 2000;
  }
  if ((texto.includes('requisicao') && texto.includes('sendo executada')) || status === 429) {
    return 5000 * tentativa; // 5 s, 10 s, 15 s
  }
  return null;
}

/**
 * Executa `chamar()` repetindo nos erros temporários do Omie.
 * `esperar(ms)` é injetado para permitir teste sem relógio real.
 */
export async function comRetentativa(chamar, esperar, opcoes = {}) {
  const maxTentativas = opcoes.maxTentativas ?? MAX_TENTATIVAS;
  const esperaMaxima = opcoes.esperaTotalMaxima ?? ESPERA_TOTAL_MAXIMA_MS;
  let esperado = 0;
  for (let tentativa = 1; ; tentativa++) {
    try {
      return await chamar();
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      const espera = esperaParaRepetir(mensagem, tentativa, erro?.status);
      if (espera === null || tentativa >= maxTentativas || esperado + espera > esperaMaxima) throw erro;
      esperado += espera;
      await esperar(espera);
    }
  }
}
