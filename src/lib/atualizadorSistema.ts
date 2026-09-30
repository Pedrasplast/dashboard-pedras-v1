/* =========================================================
   ATUALIZADOR AUTOMÁTICO DO SISTEMA
========================================================= */

const INTERVALO_VERIFICACAO =
  60_000;

const ATRASO_INICIAL =
  3_000;


/* =========================================================
   VERSÃO EMBUTIDA NO BUILD

   Se o Vite disponibilizar VITE_APP_VERSION,
   usamos diretamente.

   Se não disponibilizar, o sistema registra
   automaticamente a versão encontrada em
   version.json na primeira consulta.
========================================================= */

const VERSAO_EMBUTIDA =
  String(
    import.meta.env
      .VITE_APP_VERSION ??
      "",
  ).trim();


let versaoEmExecucao =
  VERSAO_EMBUTIDA ||
  null;


let verificando =
  false;


let recarregando =
  false;


/* =========================================================
   CONSULTAR VERSÃO PUBLICADA
========================================================= */

async function buscarVersaoPublicada() {
  const url =
    new URL(
      "/version.json",
      window.location.origin,
    );


  /*
   * Evita qualquer reaproveitamento
   * do version.json pelo navegador,
   * proxy ou CDN.
   */
  url.searchParams.set(
    "t",
    String(
      Date.now(),
    ),
  );


  const resposta =
    await fetch(
      url.toString(),
      {
        method:
          "GET",

        cache:
          "no-store",

        credentials:
          "same-origin",

        headers: {
          Accept:
            "application/json",

          "Cache-Control":
            "no-cache, no-store, must-revalidate",

          Pragma:
            "no-cache",
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


  const versao =
    String(
      dados?.version ??
      "",
    ).trim();


  return (
    versao ||
    null
  );
}


/* =========================================================
   RECARREGAR SISTEMA
========================================================= */

function recarregarSistema(
  novaVersao: string,
) {
  if (
    recarregando
  ) {
    return;
  }


  recarregando =
    true;


  console.info(
    "[Atualização] Recarregando sistema para nova versão.",
    {
      atual:
        versaoEmExecucao,

      nova:
        novaVersao,
    },
  );


  /*
   * Atualizamos primeiro a referência em memória.
   * Isso evita chamadas duplicadas durante os
   * milissegundos anteriores ao reload.
   */
  versaoEmExecucao =
    novaVersao;


  /*
   * O Vite gera arquivos com hash.
   * Ao recarregar a página, o HTML atualizado
   * aponta para os novos bundles.
   */
  window.location.reload();
}


/* =========================================================
   VERIFICAR ATUALIZAÇÃO
========================================================= */

async function verificarAtualizacao() {
  if (
    verificando ||
    recarregando
  ) {
    return;
  }


  /*
   * Quando já conhecemos a versão executada,
   * não há necessidade de consultar enquanto
   * a aba estiver completamente escondida.
   *
   * Ao usuário voltar para a aba, fazemos
   * a consulta imediatamente.
   */
  if (
    versaoEmExecucao &&
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
      !versaoPublicada
    ) {
      return;
    }


    /*
     * FALLBACK IMPORTANTE
     *
     * Caso VITE_APP_VERSION não tenha sido
     * injetada pelo Vite, usamos a primeira
     * versão publicada encontrada como a
     * versão atualmente executada.
     *
     * Da próxima consulta em diante já será
     * possível detectar novos deployments.
     */
    if (
      !versaoEmExecucao
    ) {
      versaoEmExecucao =
        versaoPublicada;


      console.info(
        "[Atualização] Versão inicial registrada.",
        {
          versao:
            versaoEmExecucao,

          origem:
            "version.json",
        },
      );


      return;
    }


    /*
     * Existe um deploy diferente daquele
     * que esta aba está executando.
     */
    if (
      versaoPublicada !==
      versaoEmExecucao
    ) {
      console.info(
        "[Atualização] Nova versão encontrada.",
        {
          atual:
            versaoEmExecucao,

          nova:
            versaoPublicada,
        },
      );


      recarregarSistema(
        versaoPublicada,
      );
    }
  } catch (
    erro
  ) {
    /*
     * Falha momentânea de internet,
     * Vercel ou version.json não pode
     * interromper a utilização do sistema.
     *
     * Tentaremos novamente posteriormente.
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
   VOLTOU PARA A ABA
========================================================= */

function verificarAoVoltarParaAba() {
  if (
    document
      .visibilityState ===
    "visible"
  ) {
    void verificarAtualizacao();
  }
}


/* =========================================================
   VOLTOU PELO CACHE DO NAVEGADOR
========================================================= */

function verificarAoRestaurarPagina() {
  void verificarAtualizacao();
}


/* =========================================================
   INTERNET VOLTOU
========================================================= */

function verificarAoVoltarInternet() {
  void verificarAtualizacao();
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
      "undefined" ||
    typeof document ===
      "undefined"
  ) {
    return;
  }


  /*
   * Durante npm run dev não queremos
   * refresh automático.
   *
   * O próprio HMR do Vite já cuida disso.
   */
  if (
    import.meta.env.DEV
  ) {
    return;
  }


  console.info(
    "[Atualização] Monitor de versão iniciado.",
    {
      versaoEmbutida:
        VERSAO_EMBUTIDA ||
        null,

      intervaloMs:
        INTERVALO_VERIFICACAO,
    },
  );


  /*
   * Primeira consulta rapidamente após
   * o carregamento.
   */
  window.setTimeout(
    () => {
      void verificarAtualizacao();
    },
    ATRASO_INICIAL,
  );


  /*
   * Consulta periódica.
   */
  window.setInterval(
    () => {
      void verificarAtualizacao();
    },
    INTERVALO_VERIFICACAO,
  );


  /*
   * Usuário voltou para a aba.
   */
  document.addEventListener(
    "visibilitychange",
    verificarAoVoltarParaAba,
  );


  /*
   * Usuário voltou para a janela.
   */
  window.addEventListener(
    "focus",
    verificarAoRestaurarPagina,
  );


  /*
   * Trata inclusive restauração através
   * do back-forward cache do navegador.
   */
  window.addEventListener(
    "pageshow",
    verificarAoRestaurarPagina,
  );


  /*
   * Se estava sem internet e ela voltar,
   * verificamos imediatamente.
   */
  window.addEventListener(
    "online",
    verificarAoVoltarInternet,
  );
}


iniciarAtualizadorSistema();


export {};