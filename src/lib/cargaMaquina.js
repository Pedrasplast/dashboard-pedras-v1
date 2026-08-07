import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const TAMANHO_PAGINA = 1000;

const DB_NAME = "dashboard-pedras-db";
const DB_VERSION = 1;

const STORE_DADOS = "carga_maquina";
const STORE_META = "meta";

const META_ULTIMA_ATUALIZACAO = "carga_maquina_ultima_atualizacao";

export const chaveCargaMaquina = ["carga_maquina"];

/* =========================================================
   ABRIR INDEXEDDB
========================================================= */

function abrirBancoLocal() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      /* STORE DOS DADOS */

      if (!db.objectStoreNames.contains(STORE_DADOS)) {
        const store = db.createObjectStore(STORE_DADOS, {
          keyPath: "id",
        });

        store.createIndex(
          "criado_em",
          "criado_em",
          {
            unique: false,
          },
        );
      }

      /* STORE DE METADADOS */

      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, {
          keyPath: "chave",
        });
      }
    };
  });
}

/* =========================================================
   LER TODOS OS DADOS DO INDEXEDDB
========================================================= */

async function lerDadosIndexedDB() {
  const db = await abrirBancoLocal();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_DADOS,
      "readonly",
    );

    const store = transaction.objectStore(
      STORE_DADOS,
    );

    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/* =========================================================
   SALVAR / ATUALIZAR VÁRIOS REGISTROS
========================================================= */

async function salvarDadosIndexedDB(dados) {
  if (!Array.isArray(dados) || dados.length === 0) {
    return;
  }

  const db = await abrirBancoLocal();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_DADOS,
      "readwrite",
    );

    const store = transaction.objectStore(
      STORE_DADOS,
    );

    dados.forEach((item) => {
      if (
        item &&
        item.id !== undefined &&
        item.id !== null
      ) {
        store.put(item);
      }
    });

    transaction.oncomplete = () => {
      db.close();

      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };

    transaction.onabort = () => {
      reject(transaction.error);
    };
  });
}

/* =========================================================
   LIMPAR SOMENTE DADOS DA CARGA_MAQUINA
========================================================= */

async function limparDadosIndexedDB() {
  const db = await abrirBancoLocal();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_DADOS,
      "readwrite",
    );

    const store = transaction.objectStore(
      STORE_DADOS,
    );

    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/* =========================================================
   METADADOS
========================================================= */

async function lerMeta(chave) {
  const db = await abrirBancoLocal();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_META,
      "readonly",
    );

    const store = transaction.objectStore(
      STORE_META,
    );

    const request = store.get(chave);

    request.onsuccess = () => {
      resolve(request.result?.valor ?? null);
    };

    request.onerror = () => {
      reject(request.error);
    };

    transaction.oncomplete = () => {
      db.close();
    };
  });
}

async function salvarMeta(chave, valor) {
  const db = await abrirBancoLocal();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_META,
      "readwrite",
    );

    const store = transaction.objectStore(
      STORE_META,
    );

    store.put({
      chave,
      valor,
    });

    transaction.oncomplete = () => {
      db.close();

      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

/* =========================================================
   LIMPAR CACHE COMPLETO

   Pode ser usado futuramente em um botão
   "Atualizar tudo".
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
  const { data, error } = await supabase
    .from("carga_maquina")
    .select("criado_em")
    .not("criado_em", "is", null)
    .order("criado_em", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.criado_em || null;
}

/* =========================================================
   BUSCAR TODOS OS REGISTROS DO SUPABASE
========================================================= */

async function buscarTodosOsRegistros() {
  const todosOsDados = [];

  let pagina = 0;

  for (;;) {
    const inicioPagina =
      pagina * TAMANHO_PAGINA;

    const fimPagina =
      inicioPagina +
      TAMANHO_PAGINA -
      1;

    const { data, error } = await supabase
      .from("carga_maquina")
      .select("*")
      .order("criado_em", {
        ascending: true,
      })
      .order("id", {
        ascending: true,
      })
      .range(
        inicioPagina,
        fimPagina,
      );

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    todosOsDados.push(...data);

    if (data.length < TAMANHO_PAGINA) {
      break;
    }

    pagina += 1;
  }

  return todosOsDados;
}

/* =========================================================
   BUSCAR SOMENTE REGISTROS NOVOS

   Usa GTE para evitar perda caso vários registros tenham
   exatamente o mesmo criado_em.

   O IndexedDB faz PUT pelo id, então não duplica.
========================================================= */

async function buscarNovosRegistros(
  ultimaAtualizacao,
) {
  const novosDados = [];

  let pagina = 0;

  for (;;) {
    const inicioPagina =
      pagina * TAMANHO_PAGINA;

    const fimPagina =
      inicioPagina +
      TAMANHO_PAGINA -
      1;

    let consulta = supabase
      .from("carga_maquina")
      .select("*")
      .order("criado_em", {
        ascending: true,
      })
      .order("id", {
        ascending: true,
      });

    if (ultimaAtualizacao) {
      consulta = consulta.gte(
        "criado_em",
        ultimaAtualizacao,
      );
    }

    const { data, error } =
      await consulta.range(
        inicioPagina,
        fimPagina,
      );

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    novosDados.push(...data);

    if (data.length < TAMANHO_PAGINA) {
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

  const dadosCache =
    await lerDadosIndexedDB();

  const ultimaAtualizacaoCache =
    await lerMeta(
      META_ULTIMA_ATUALIZACAO,
    );

  /* =====================================================
     2. PRIMEIRA CARGA
  ===================================================== */

  if (dadosCache.length === 0) {
    console.log(
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

    console.log(
      `[Carga Máquina] Primeira carga concluída: ${todosOsDados.length} registros.`,
    );

    return todosOsDados;
  }

  /* =====================================================
     3. JÁ TEM CACHE
  ===================================================== */

  console.log(
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
    console.log(
      "[Carga Máquina] Banco sem novos registros. Usando IndexedDB.",
    );

    return dadosCache;
  }

  /* =====================================================
     5. EXISTEM REGISTROS NOVOS
  ===================================================== */

  console.log(
    "[Carga Máquina] Novos registros detectados. Sincronizando...",
  );

  const novosRegistros =
    await buscarNovosRegistros(
      ultimaAtualizacaoCache,
    );

  if (novosRegistros.length > 0) {
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

  console.log(
    `[Carga Máquina] Sincronização concluída. ${dadosAtualizados.length} registros disponíveis.`,
  );

  return dadosAtualizados;
}

/* =========================================================
   CARREGAMENTO INICIAL DO INDEXEDDB

   Como IndexedDB é assíncrono, não usamos initialData
   da mesma forma que no localStorage.

   O React Query passa a manter o resultado em memória
   enquanto o sistema estiver aberto.
========================================================= */

export function useCargaMaquina(
  opcoes = {},
) {
  const consulta = useQuery({
    queryKey:
      chaveCargaMaquina,

    queryFn:
      buscarCargaMaquina,

    /*
       Enquanto estiver navegando pelo sistema,
       considera os dados válidos por 5 minutos.
    */
    staleTime:
      5 * 60 * 1000,

    /*
       Mantém o cache do React Query em memória
       durante 30 minutos.
    */
    gcTime:
      30 * 60 * 1000,

    refetchOnWindowFocus:
      false,

    /*
       Após F5 ele executa buscarCargaMaquina,
       mas essa função primeiro lê IndexedDB.

       Se criado_em não mudou, NÃO baixa
       a tabela completa.
    */
    refetchOnMount:
      true,

    retry: 1,

    ...opcoes,
  });

  return {
    dados:
      consulta.data ?? [],

    loading:
      consulta.isPending,

    atualizando:
      consulta.isFetching,

    erro:
      consulta.error
        ? consulta.error.message ||
          "Não foi possível carregar os dados de produção."
        : "",

    recarregar:
      consulta.refetch,
  };
}