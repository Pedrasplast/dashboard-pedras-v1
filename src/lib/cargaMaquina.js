import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";
import { logDesenvolvimento } from "./logger";


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const TAMANHO_PAGINA = 1000;

const DB_NAME = "dashboard-pedras-db";
const DB_VERSION = 1;

const STORE_DADOS = "carga_maquina";
const STORE_META = "meta";

const META_ULTIMA_ATUALIZACAO =
  "carga_maquina_ultima_atualizacao";

const DADOS_VAZIOS = Object.freeze([]);
const DESCRICOES_VAZIAS = Object.freeze({});

export const chaveCargaMaquina = [
  "carga_maquina",
];


/* =========================================================
   NORMALIZAR CÓDIGO DO PRODUTO

   Usado exclusivamente para relacionar
   carga_maquina com parametros_produto.

   Exemplos:

   11.01.0035 -> 11010035
   4179       -> 4179
   09122      -> 9122
   9122.0     -> 9122
   10469      -> 10469
   REUSO3924  -> REUSO3924
========================================================= */

export function normalizarCodigoProduto(
  valor,
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  let texto =
    String(valor)
      .trim()
      .toUpperCase();

  /*
   * Caso o código tenha vindo como
   * número decimal sem necessidade:
   *
   * 9122.0
   * 9122,0
   *
   * converte para:
   *
   * 9122
   */
  if (
    /^\d+[.,]0+$/.test(
      texto,
    )
  ) {
    texto =
      texto.replace(
        /[.,]0+$/,
        "",
      );
  }

  /*
   * Remove pontos,
   * espaços, barras,
   * hífens etc.
   */
  const codigo =
    texto.replace(
      /[^A-Z0-9]/g,
      "",
    );

  if (!codigo) {
    return "";
  }

  /*
   * Se for composto somente
   * por números, remove zeros
   * desnecessários à esquerda.
   *
   * 09122 -> 9122
   */
  if (
    /^\d+$/.test(
      codigo,
    )
  ) {
    return codigo.replace(
      /^0+(?=\d)/,
      "",
    );
  }

  return codigo;
}


/* =========================================================
   ABRIR INDEXEDDB
========================================================= */

function abrirBancoLocal() {
  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION,
        );

      request.onerror =
        () => {
          reject(
            request.error,
          );
        };

      request.onsuccess =
        () => {
          resolve(
            request.result,
          );
        };

      request.onupgradeneeded =
        (
          event,
        ) => {
          const db =
            event.target.result;


          /* STORE DOS DADOS */

          if (
            !db.objectStoreNames.contains(
              STORE_DADOS,
            )
          ) {
            const store =
              db.createObjectStore(
                STORE_DADOS,
                {
                  keyPath:
                    "id",
                },
              );

            store.createIndex(
              "criado_em",
              "criado_em",
              {
                unique:
                  false,
              },
            );
          }


          /* STORE DE METADADOS */

          if (
            !db.objectStoreNames.contains(
              STORE_META,
            )
          ) {
            db.createObjectStore(
              STORE_META,
              {
                keyPath:
                  "chave",
              },
            );
          }
        };
    },
  );
}


/* =========================================================
   LER TODOS OS DADOS DO INDEXEDDB
========================================================= */

async function lerDadosIndexedDB() {
  const db =
    await abrirBancoLocal();

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const transaction =
        db.transaction(
          STORE_DADOS,
          "readonly",
        );

      const store =
        transaction.objectStore(
          STORE_DADOS,
        );

      const request =
        store.getAll();

      request.onsuccess =
        () => {
          resolve(
            request.result ||
              [],
          );
        };

      request.onerror =
        () => {
          reject(
            request.error,
          );
        };

      transaction.oncomplete =
        () => {
          db.close();
        };
    },
  );
}


/* =========================================================
   SALVAR / ATUALIZAR VÁRIOS REGISTROS
========================================================= */

async function salvarDadosIndexedDB(
  dados,
) {
  if (
    !Array.isArray(
      dados,
    ) ||
    dados.length === 0
  ) {
    return;
  }

  const db =
    await abrirBancoLocal();

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const transaction =
        db.transaction(
          STORE_DADOS,
          "readwrite",
        );

      const store =
        transaction.objectStore(
          STORE_DADOS,
        );

      dados.forEach(
        (
          item,
        ) => {
          if (
            item &&
            item.id !==
              undefined &&
            item.id !==
              null
          ) {
            store.put(
              item,
            );
          }
        },
      );

      transaction.oncomplete =
        () => {
          db.close();

          resolve();
        };

      transaction.onerror =
        () => {
          reject(
            transaction.error,
          );
        };

      transaction.onabort =
        () => {
          reject(
            transaction.error,
          );
        };
    },
  );
}


/* =========================================================
   LIMPAR SOMENTE DADOS DA CARGA_MAQUINA
========================================================= */

async function limparDadosIndexedDB() {
  const db =
    await abrirBancoLocal();

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const transaction =
        db.transaction(
          STORE_DADOS,
          "readwrite",
        );

      const store =
        transaction.objectStore(
          STORE_DADOS,
        );

      const request =
        store.clear();

      request.onsuccess =
        () => {
          resolve();
        };

      request.onerror =
        () => {
          reject(
            request.error,
          );
        };

      transaction.oncomplete =
        () => {
          db.close();
        };
    },
  );
}


/* =========================================================
   METADADOS
========================================================= */

async function lerMeta(
  chave,
) {
  const db =
    await abrirBancoLocal();

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const transaction =
        db.transaction(
          STORE_META,
          "readonly",
        );

      const store =
        transaction.objectStore(
          STORE_META,
        );

      const request =
        store.get(
          chave,
        );

      request.onsuccess =
        () => {
          resolve(
            request.result
              ?.valor ??
              null,
          );
        };

      request.onerror =
        () => {
          reject(
            request.error,
          );
        };

      transaction.oncomplete =
        () => {
          db.close();
        };
    },
  );
}


async function salvarMeta(
  chave,
  valor,
) {
  const db =
    await abrirBancoLocal();

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      const transaction =
        db.transaction(
          STORE_META,
          "readwrite",
        );

      const store =
        transaction.objectStore(
          STORE_META,
        );

      store.put({
        chave,
        valor,
      });

      transaction.oncomplete =
        () => {
          db.close();

          resolve();
        };

      transaction.onerror =
        () => {
          reject(
            transaction.error,
          );
        };
    },
  );
}


/* =========================================================
   LIMPAR CACHE COMPLETO
========================================================= */

export async function limparCacheCargaMaquina() {
  await limparDadosIndexedDB();

  await salvarMeta(
    META_ULTIMA_ATUALIZACAO,
    null,
  );
}


/* =========================================================
   ÚLTIMA ATUALIZAÇÃO EXISTENTE NO BANCO
========================================================= */

async function buscarUltimaAtualizacaoBanco() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "carga_maquina",
      )
      .select(
        "criado_em",
      )
      .not(
        "criado_em",
        "is",
        null,
      )
      .order(
        "criado_em",
        {
          ascending:
            false,
        },
      )
      .limit(1)
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return (
    data?.criado_em ||
    null
  );
}


/* =========================================================
   BUSCAR TODOS OS REGISTROS DO SUPABASE
========================================================= */

async function buscarTodosOsRegistros() {
  const todosOsDados =
    [];

  let pagina = 0;

  for (;;) {
    const inicioPagina =
      pagina *
      TAMANHO_PAGINA;

    const fimPagina =
      inicioPagina +
      TAMANHO_PAGINA -
      1;

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "carga_maquina",
        )
        .select("*")
        .order(
          "criado_em",
          {
            ascending:
              true,
          },
        )
        .order(
          "id",
          {
            ascending:
              true,
          },
        )
        .range(
          inicioPagina,
          fimPagina,
        );

    if (
      error
    ) {
      throw error;
    }

    if (
      !data ||
      data.length === 0
    ) {
      break;
    }

    todosOsDados.push(
      ...data,
    );

    if (
      data.length <
      TAMANHO_PAGINA
    ) {
      break;
    }

    pagina += 1;
  }

  return todosOsDados;
}


/* =========================================================
   BUSCAR SOMENTE REGISTROS NOVOS
========================================================= */

async function buscarNovosRegistros(
  ultimaAtualizacao,
) {
  const novosDados =
    [];

  let pagina = 0;

  for (;;) {
    const inicioPagina =
      pagina *
      TAMANHO_PAGINA;

    const fimPagina =
      inicioPagina +
      TAMANHO_PAGINA -
      1;

    let consulta =
      supabase
        .from(
          "carga_maquina",
        )
        .select("*")
        .order(
          "criado_em",
          {
            ascending:
              true,
          },
        )
        .order(
          "id",
          {
            ascending:
              true,
          },
        );

    if (
      ultimaAtualizacao
    ) {
      consulta =
        consulta.gte(
          "criado_em",
          ultimaAtualizacao,
        );
    }

    const {
      data,
      error,
    } =
      await consulta.range(
        inicioPagina,
        fimPagina,
      );

    if (
      error
    ) {
      throw error;
    }

    if (
      !data ||
      data.length === 0
    ) {
      break;
    }

    novosDados.push(
      ...data,
    );

    if (
      data.length <
      TAMANHO_PAGINA
    ) {
      break;
    }

    pagina += 1;
  }

  return novosDados;
}


/* =========================================================
   SINCRONIZAÇÃO PRINCIPAL
========================================================= */

export async function buscarCargaMaquina() {

  /* =====================================================
     1. LÊ O INDEXEDDB
  ===================================================== */

  const [
    dadosCache,
    ultimaAtualizacaoCache,
  ] = await Promise.all([
    lerDadosIndexedDB(),
    lerMeta(META_ULTIMA_ATUALIZACAO),
  ]);


  /* =====================================================
     2. PRIMEIRA CARGA
  ===================================================== */

  if (
    dadosCache.length ===
    0
  ) {
    logDesenvolvimento(
      "[Carga Máquina] IndexedDB vazio. Fazendo primeira carga completa...",
    );

    const todosOsDados =
      await buscarTodosOsRegistros();

    await salvarDadosIndexedDB(
      todosOsDados,
    );

    const ultimaAtualizacaoBanco =
      await buscarUltimaAtualizacaoBanco();

    await salvarMeta(
      META_ULTIMA_ATUALIZACAO,
      ultimaAtualizacaoBanco,
    );

    logDesenvolvimento(
      `[Carga Máquina] Primeira carga concluída: ${todosOsDados.length} registros.`,
    );

    return todosOsDados;
  }


  /* =====================================================
     3. JÁ TEM CACHE
  ===================================================== */

  logDesenvolvimento(
    `[Carga Máquina] IndexedDB encontrado: ${dadosCache.length} registros.`,
  );

  const ultimaAtualizacaoBanco =
    await buscarUltimaAtualizacaoBanco();


  /* =====================================================
     4. NÃO HOUVE ALTERAÇÃO
  ===================================================== */

  if (
    ultimaAtualizacaoBanco ===
    ultimaAtualizacaoCache
  ) {
    logDesenvolvimento(
      "[Carga Máquina] Banco sem novos registros. Usando IndexedDB.",
    );

    return dadosCache;
  }


  /* =====================================================
     5. EXISTEM REGISTROS NOVOS
  ===================================================== */

  logDesenvolvimento(
    "[Carga Máquina] Novos registros detectados. Sincronizando...",
  );

  const novosRegistros =
    await buscarNovosRegistros(
      ultimaAtualizacaoCache,
    );

  if (
    novosRegistros.length >
    0
  ) {
    await salvarDadosIndexedDB(
      novosRegistros,
    );
  }

  await salvarMeta(
    META_ULTIMA_ATUALIZACAO,
    ultimaAtualizacaoBanco,
  );


  /* =====================================================
     6. LÊ A BASE ATUALIZADA
  ===================================================== */

  const dadosAtualizados =
    await lerDadosIndexedDB();

  logDesenvolvimento(
    `[Carga Máquina] Sincronização concluída. ${dadosAtualizados.length} registros disponíveis.`,
  );

  return dadosAtualizados;
}


/* =========================================================
   DESCRIÇÕES DOS PRODUTOS

   SOMENTE:

   carga_maquina.cod_prod
            ↓
   parametros_produto.cod_prod
            ↓
   parametros_produto.descricao
========================================================= */

/*
 * Nova chave para garantir que nenhum
 * cache da consulta anterior seja utilizado.
 */
export const chaveDescricoesProdutos = [
  "descricoes_parametros_produto_v3",
];


/* =========================================================
   BUSCAR DESCRIÇÕES EM PARAMETROS_PRODUTO
========================================================= */

async function buscarDescricoesProdutos() {
  const registros =
    [];

  let pagina = 0;


  for (;;) {
    const inicioPagina =
      pagina *
      TAMANHO_PAGINA;

    const fimPagina =
      inicioPagina +
      TAMANHO_PAGINA -
      1;


    const {
      data,
      error,
    } =
      await supabase
        .from(
          "parametros_produto",
        )
        .select(
          "cod_prod, descricao",
        )
        .range(
          inicioPagina,
          fimPagina,
        );


    if (
      error
    ) {
      console.error(
        "[Descrições Produtos] Erro ao consultar parametros_produto:",
        error,
      );

      throw error;
    }


    if (
      !data ||
      data.length === 0
    ) {
      break;
    }


    registros.push(
      ...data,
    );


    if (
      data.length <
      TAMANHO_PAGINA
    ) {
      break;
    }


    pagina += 1;
  }


  /* =====================================================
     MONTA O MAPA DE DESCRIÇÕES
  ===================================================== */

  const descricoes =
    {};


  registros.forEach(
    (
      item,
    ) => {

      const codigoOriginal =
        String(
          item.cod_prod ??
            "",
        ).trim();


      const codigoNormalizado =
        normalizarCodigoProduto(
          codigoOriginal,
        );


      const descricao =
        String(
          item.descricao ??
            "",
        ).trim();


      if (
        !codigoNormalizado ||
        !descricao
      ) {
        return;
      }


      /*
       * Chave principal:
       * código normalizado.
       */
      descricoes[
        codigoNormalizado
      ] =
        descricao;


      /*
       * Segurança:
       * também mantém exatamente
       * como veio do cadastro.
       */
      if (
        codigoOriginal
      ) {
        descricoes[
          codigoOriginal
        ] =
          descricao;
      }


      /*
       * Segurança adicional:
       * código original em maiúsculas.
       */
      const codigoOriginalMaiusculo =
        codigoOriginal.toUpperCase();


      if (
        codigoOriginalMaiusculo
      ) {
        descricoes[
          codigoOriginalMaiusculo
        ] =
          descricao;
      }
    },
  );


  logDesenvolvimento(
    "[Descrições Produtos] parametros_produto carregado:",
    registros.length,
  );


  logDesenvolvimento(
    "[Descrições Produtos] códigos disponíveis:",
    Object.keys(
      descricoes,
    ).length,
  );


  return descricoes;
}


/* =========================================================
   HOOK DAS DESCRIÇÕES DOS PRODUTOS
========================================================= */

export function useDescricoesProdutos(
  opcoes = {},
) {
  const consulta =
    useQuery({
      queryKey:
        chaveDescricoesProdutos,

      queryFn:
        buscarDescricoesProdutos,


      /*
       * Durante a validação,
       * consulta novamente ao abrir
       * o relatório.
       */
      staleTime:
        0,


      gcTime:
        30 *
        60 *
        1000,


      refetchOnWindowFocus:
        false,


      refetchOnMount:
        "always",


      retry:
        1,


      ...opcoes,
    });


  return {
    descricoesProdutos:
      consulta.data ??
      DESCRICOES_VAZIAS,


    loadingDescricoes:
      consulta.isPending,


    atualizandoDescricoes:
      consulta.isFetching,


    erroDescricoes:
      consulta.error
        ? consulta.error
            .message ||
          "Não foi possível carregar as descrições dos produtos."
        : "",


    recarregarDescricoes:
      consulta.refetch,
  };
}


/* =========================================================
   HOOK PRINCIPAL DA CARGA MÁQUINA
========================================================= */

export function useCargaMaquina(
  opcoes = {},
) {
  const consulta =
    useQuery({
      queryKey:
        chaveCargaMaquina,

      queryFn:
        buscarCargaMaquina,


      /*
       * Enquanto estiver navegando pelo sistema,
       * considera os dados válidos por 5 minutos.
       */
      staleTime:
        5 *
        60 *
        1000,


      /*
       * Mantém o cache do React Query em memória
       * durante 30 minutos.
       */
      gcTime:
        30 *
        60 *
        1000,


      refetchOnWindowFocus:
        false,


      /*
       * Após F5 executa buscarCargaMaquina,
       * mas primeiro consulta o IndexedDB.
       */
      refetchOnMount:
        true,


      retry:
        1,


      ...opcoes,
    });


  return {
    dados:
      consulta.data ??
      DADOS_VAZIOS,


    loading:
      consulta.isPending,


    atualizando:
      consulta.isFetching,


    erro:
      consulta.error
        ? consulta.error
            .message ||
          "Não foi possível carregar os dados de produção."
        : "",


    recarregar:
      consulta.refetch,
  };
}