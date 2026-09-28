/* =========================================================
   ATUALIZADOR AUTOMÁTICO DO SISTEMA
========================================================= */

const INTERVALO_VERIFICACAO =
  60_000;

const ATRASO_INICIAL =
  10_000;


/*
 * Esta versão foi inserida pelo Vite
 * durante o build.
 */


const VERSAO_ATUAL = import.meta.env.VITE_APP_VERSION;


let verificando =
  false;


/* =========================================================
   CONSULTAR VERSÃO PUBLICADA
========================================================= */

async function buscarVersaoPublicada() {
  const resposta =
    await fetch(
      `/version.json?t=${Date.now()}`,
      {
        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
        },
      },
    );


  if (
    !resposta.ok
  ) {
    return null;
  }


  const dados =
    await resposta.json();


  return (
    dados?.version ||
    null
  );
}


/* =========================================================
   VERIFICAR ATUALIZAÇÃO
========================================================= */

async function verificarAtualizacao() {
  if (
    verificando ||
    document
      .visibilityState ===
      "hidden"
  ) {
    return;
  }


  verificando =
    true;


  try {
    const versaoPublicada =
      await buscarVersaoPublicada();


    if (
      !versaoPublicada ||
      !VERSAO_ATUAL
    ) {
      return;
    }


    if (
      versaoPublicada !==
      VERSAO_ATUAL
    ) {
      console.info(
        "[Atualização] Nova versão encontrada.",
        {
          atual:
            VERSAO_ATUAL,

          nova:
            versaoPublicada,
        },
      );


      /*
       * O novo deploy já está disponível.
       * Recarregamos para baixar os novos
       * arquivos gerados pelo Vite.
       */
      window.location.reload();
    }
  } catch (
    erro
  ) {
    /*
     * Falha de internet ou indisponibilidade
     * momentânea não deve afetar o sistema.
     *
     * Na próxima verificação tentamos novamente.
     */
    console.debug(
      "[Atualização] Não foi possível verificar a versão.",
      erro,
    );
  } finally {
    verificando =
      false;
  }
}


/* =========================================================
   QUANDO O USUÁRIO VOLTAR PARA A ABA
========================================================= */

function verificarAoVoltarParaAba() {
  if (
    document
      .visibilityState ===
    "visible"
  ) {
    verificarAtualizacao();
  }
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

function iniciarAtualizadorSistema() {
  /*
   * Não executa durante SSR.
   */
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }


  /*
   * Durante npm run dev não queremos
   * recarregamentos automáticos.
   *
   * O HMR do Vite já cuida disso.
   */
  if (
    import.meta.env.DEV
  ) {
    return;
  }


  /*
   * Primeira verificação após 10 segundos.
   */
  window.setTimeout(
    verificarAtualizacao,
    ATRASO_INICIAL,
  );


  /*
   * Depois verifica a cada 60 segundos.
   */
  window.setInterval(
    verificarAtualizacao,
    INTERVALO_VERIFICACAO,
  );


  /*
   * Se o usuário estava em outra aba
   * e voltar ao sistema, verifica na hora.
   */
  document.addEventListener(
    "visibilitychange",
    verificarAoVoltarParaAba,
  );


  /*
   * Também verifica quando a janela
   * recebe foco novamente.
   */
  window.addEventListener(
    "focus",
    verificarAtualizacao,
  );
}


iniciarAtualizadorSistema();


export {};