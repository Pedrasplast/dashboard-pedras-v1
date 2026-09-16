import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabaseClient";
import { logDesenvolvimento } from "./logger";

/* =====================================================
   CONFIGURAÇÕES
===================================================== */

const TAMANHO_PAGINA = 1000;

const DB_NAME = "dashboard-pedras-db";
const DB_VERSION = 1;

const STORE_DADOS = "carga_maquina";
const STORE_META = "meta";

const META_ULTIMA_ATUALIZACAO =
  "carga_maquina_ultima_atualizacao";

const DADOS_VAZIOS = Object.freeze([]);
const DESCRICOES_VAZIAS = Object.freeze({});

export const chaveCargaMaquina = ["carga_maquina"];

/* =====================================================
   NORMALIZAR CÓDIGO DO PRODUTO

   Exemplos:

   11.01.0035 -> 11010035
   09122      -> 9122
   9122.0     -> 9122
   REUSO3924  -> REUSO3924
===================================================== */

export function normalizarCodigoProduto(valor) {
  if (valor === null || valor === undefined) {
    return "";
  }

  let texto = String(valor).trim().toUpperCase();

  // Remove decimal desnecessário.
  if (/^\d+[.,]0+$/.test(texto)) {
    texto = texto.replace(/[.,]0+$/, "");
  }

  // Remove pontuação.
  const codigo = texto.replace(/[^A-Z0-9]/g, "");

  if (!codigo) {
    return "";
  }

  // Remove zeros à esquerda apenas em códigos numéricos.
  if (/^\d+$/.test(codigo)) {
    return codigo.replace(/^0+(?=\d)/, "");
  }

  return codigo;
}

/* =====================================================
   ABRIR INDEXEDDB
===================================================== */

function abrirBancoLocal() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION,
    );

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
        const store = db.createObjectStore(
          STORE_DADOS,
          {
            keyPath: "id",
          },
        );

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
        db.createObjectStore(
          STORE_META,
          {
            keyPath: "chave",
          },
        );
      }
    };
  });
}

/* =====================================================
   LER DADOS DO INDEXEDDB
===================================================== */

async function lerDadosIndexedDB() {
  const db = await abrirBancoLocal();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_DADOS,
      "readonly",
    );

    const store = transaction.objectStore(STORE_DADOS);

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

/* =====================================================
   SALVAR REGISTROS NO INDEXEDDB
===================================================== */

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

    const store = transaction.objectStore(STORE_DADOS);

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

/* =====================================================
   LIMPAR DADOS DO INDEXEDDB
===================================================== */

async function limparDadosIndexedDB() {
  const db = await abrirBancoLocal();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_DADOS,
      "readwrite",
    );

    const store = transaction.objectStore(STORE_DADOS);

    const request = store.clear();

    request.onerror = () => {
      reject(request.error);
    };

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

/* =====================================================
   LER METADADOS
===================================================== */

async function lerMeta(chave) {
  const db = await abrirBancoLocal();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_META,
      "readonly",
    );

    const store = transaction.objectStore(STORE_META);

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

/* =====================================================
   SALVAR METADADOS
===================================================== */

async function salvarMeta(chave, valor) {
  const db = await abrirBancoLocal();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      STORE_META,
      "readwrite",
    );

    const store = transaction.objectStore(STORE_META);

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

    transaction.onabort = () => {
      reject(transaction.error);
    };
  });
}

/* =====================================================
   LIMPAR CACHE DA CARGA MÁQUINA
===================================================== */

export async function limparCacheCargaMaquina() {
  await limparDadosIndexedDB();

  await salvarMeta(
    META_ULTIMA_ATUALIZACAO,
    null,
  );
}

/* =====================================================
   ÚLTIMA ATUALIZAÇÃO NO SUPABASE
===================================================== */

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

/* =====================================================
   BUSCAR TODOS OS REGISTROS
===================================================== */

async function buscarTodosOsRegistros() {
  const todosOsDados = [];

  let pagina = 0;

  for (;;) {
    const inicioPagina = pagina * TAMANHO_PAGINA;

    const fimPagina =
      inicioPagina + TAMANHO_PAGINA - 1;

    const { data, error } = await supabase
      .from("carga_maquina")
      .select("*")
      .order("criado_em", {
        ascending: true,
      })
      .order("id", {
        ascending: true,
      })
      .range(inicioPagina, fimPagina);

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

/* =====================================================
   BUSCAR REGISTROS NOVOS
===================================================== */

async function buscarNovosRegistros(ultimaAtualizacao) {
  const novosDados = [];

  let pagina = 0;

  for (;;) {
    const inicioPagina = pagina * TAMANHO_PAGINA;

    const fimPagina =
      inicioPagina + TAMANHO_PAGINA - 1;

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

    const { data, error } = await consulta.range(
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

/* =====================================================
   SINCRONIZAÇÃO PRINCIPAL

   Mantém:
   - IndexedDB
   - Sincronização incremental
   - Consulta paginada
   - Atualização completa
===================================================== */

export async function buscarCargaMaquina() {
  /* 1. LER CACHE */

  const [
    dadosCache,
    ultimaAtualizacaoCache,
  ] = await Promise.all([
    lerDadosIndexedDB(),
    lerMeta(META_ULTIMA_ATUALIZACAO),
  ]);

  /* 2. PRIMEIRA CARGA */

  if (dadosCache.length === 0) {
    logDesenvolvimento(
      "[Carga Máquina] IndexedDB vazio. Fazendo primeira carga completa...",
    );

    const todosOsDados =
      await buscarTodosOsRegistros();

    await salvarDadosIndexedDB(todosOsDados);

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

  /* 3. CACHE EXISTENTE */

  logDesenvolvimento(
    `[Carga Máquina] IndexedDB encontrado: ${dadosCache.length} registros.`,
  );

  const ultimaAtualizacaoBanco =
    await buscarUltimaAtualizacaoBanco();

  /* 4. SEM NOVOS REGISTROS */

  if (
    ultimaAtualizacaoBanco ===
    ultimaAtualizacaoCache
  ) {
    logDesenvolvimento(
      "[Carga Máquina] Banco sem novos registros. Usando IndexedDB.",
    );

    return dadosCache;
  }

  /* 5. SINCRONIZAÇÃO INCREMENTAL */

  logDesenvolvimento(
    "[Carga Máquina] Novos registros detectados. Sincronizando...",
  );

  const novosRegistros =
    await buscarNovosRegistros(ultimaAtualizacaoCache);

  if (novosRegistros.length > 0) {
    await salvarDadosIndexedDB(novosRegistros);
  }

  await salvarMeta(
    META_ULTIMA_ATUALIZACAO,
    ultimaAtualizacaoBanco,
  );

  /* 6. DADOS ATUALIZADOS */

  const dadosAtualizados =
    await lerDadosIndexedDB();

  logDesenvolvimento(
    `[Carga Máquina] Sincronização concluída. ${dadosAtualizados.length} registros disponíveis.`,
  );

  return dadosAtualizados;
}

/* =====================================================
   DESCRIÇÕES DOS PRODUTOS

   FONTE 1:
   estoque_produto_acabado_omie

   FONTE 2:
   parametros_produto

   RELACIONAMENTO:

   carga_maquina.cod_prod
              ↓
   estoque_produto_acabado_omie.codigo_produto
              ↓
   estoque_produto_acabado_omie.descricao

   Se não encontrar, busca em parametros_produto.

   A consulta é separada para não duplicar
   os apontamentos de produção.
===================================================== */

/*
 * Nova chave para invalidar o cache antigo
 * que consultava somente parâmetros.
 */

export const chaveDescricoesProdutos = [
  "descricoes_produtos_estoque_parametros_v4",
];

/* =====================================================
   BUSCAR DESCRIÇÕES PAGINADAS
===================================================== */

async function buscarRegistrosDescricoes(
  tabela,
  campoCodigo,
) {
  const registros = [];

  let pagina = 0;

  for (;;) {
    const inicioPagina = pagina * TAMANHO_PAGINA;

    const fimPagina =
      inicioPagina + TAMANHO_PAGINA - 1;

    const { data, error } = await supabase
      .from(tabela)
      .select(`${campoCodigo}, descricao`)
      .order(campoCodigo, {
        ascending: true,
      })
      .order("descricao", {
        ascending: true,
      })
      .range(inicioPagina, fimPagina);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    registros.push(...data);

    if (data.length < TAMANHO_PAGINA) {
      break;
    }

    pagina += 1;
  }

  return registros;
}

/* =====================================================
   CONSTRUIR MAPA DE DESCRIÇÕES

   Mantém a primeira descrição válida.

   Como o estoque é processado primeiro,
   possui prioridade sobre os parâmetros.

   Não duplica registros de produção.
===================================================== */

function adicionarDescricoesAoMapa(
  mapa,
  registros,
  campoCodigo,
) {
  for (const item of registros) {
    const codigo = normalizarCodigoProduto(
      item?.[campoCodigo],
    );

    const descricao = String(
      item?.descricao ?? "",
    ).trim();

    if (
      !codigo ||
      !descricao ||
      descricao === "-"
    ) {
      continue;
    }

    if (
      !Object.prototype.hasOwnProperty.call(
        mapa,
        codigo,
      )
    ) {
      mapa[codigo] = descricao;
    }
  }
}

/* =====================================================
   BUSCAR DESCRIÇÕES NAS DUAS FONTES
===================================================== */

async function buscarDescricoesProdutos() {
  const [
    resultadoEstoque,
    resultadoParametros,
  ] = await Promise.allSettled([
    buscarRegistrosDescricoes(
      "estoque_produto_acabado_omie",
      "codigo_produto",
    ),

    buscarRegistrosDescricoes(
      "parametros_produto",
      "cod_prod",
    ),
  ]);

  /* =================================================
     VERIFICAR FALHAS
  ================================================= */

  if (
    resultadoEstoque.status === "rejected" &&
    resultadoParametros.status === "rejected"
  ) {
    console.error(
      "[Descrições Produtos] Falha ao consultar as duas fontes:",
      resultadoEstoque.reason,
      resultadoParametros.reason,
    );

    throw new Error(
      "Não foi possível consultar as descrições dos produtos.",
    );
  }

  const descricoes = Object.create(null);

  /* =================================================
     PRIMEIRA FONTE: ESTOQUE OMIE
  ================================================= */

  if (resultadoEstoque.status === "fulfilled") {
    adicionarDescricoesAoMapa(
      descricoes,
      resultadoEstoque.value,
      "codigo_produto",
    );

    logDesenvolvimento(
      `[Descrições Produtos] Estoque OMIE: ${resultadoEstoque.value.length} registros consultados.`,
    );
  } else {
    console.warn(
      "[Descrições Produtos] Estoque indisponível; usando parâmetros:",
      resultadoEstoque.reason,
    );
  }

  /* =================================================
     SEGUNDA FONTE: PARÂMETROS
  ================================================= */

  if (resultadoParametros.status === "fulfilled") {
    adicionarDescricoesAoMapa(
      descricoes,
      resultadoParametros.value,
      "cod_prod",
    );

    logDesenvolvimento(
      `[Descrições Produtos] Parâmetros: ${resultadoParametros.value.length} registros consultados.`,
    );
  } else {
    console.warn(
      "[Descrições Produtos] Parâmetros indisponíveis; usando estoque:",
      resultadoParametros.reason,
    );
  }

  logDesenvolvimento(
    `[Descrições Produtos] ${Object.keys(descricoes).length} códigos com descrição.`,
  );

  return descricoes;
}

/* =====================================================
   HOOK DAS DESCRIÇÕES
===================================================== */

export function useDescricoesProdutos(opcoes = {}) {
  const consulta = useQuery({
    queryKey: chaveDescricoesProdutos,

    queryFn: buscarDescricoesProdutos,

    staleTime: 0,

    gcTime: 30 * 60 * 1000,

    refetchOnWindowFocus: false,

    refetchOnMount: "always",

    retry: 1,

    ...opcoes,
  });

  return {
    descricoesProdutos:
      consulta.data ?? DESCRICOES_VAZIAS,

    loadingDescricoes: consulta.isPending,

    atualizandoDescricoes: consulta.isFetching,

    erroDescricoes: consulta.error
      ? consulta.error.message ||
        "Não foi possível carregar as descrições dos produtos."
      : "",

    recarregarDescricoes: consulta.refetch,
  };
}

/* =====================================================
   HOOK PRINCIPAL DA CARGA MÁQUINA
===================================================== */

export function useCargaMaquina(opcoes = {}) {
  const consulta = useQuery({
    queryKey: chaveCargaMaquina,

    queryFn: buscarCargaMaquina,

    staleTime: 5 * 60 * 1000,

    gcTime: 30 * 60 * 1000,

    refetchOnWindowFocus: false,

    refetchOnMount: true,

    retry: 1,

    ...opcoes,
  });

  /* =================================================
     ATUALIZAÇÃO COMPLETA

     1. Limpa cache local.
     2. Limpa marcador de sincronização.
     3. Executa consulta.
     4. Recarrega toda a tabela.
  ================================================= */

  async function recarregarCompleto() {
    logDesenvolvimento(
      "[Carga Máquina] Atualização completa solicitada. Limpando cache local...",
    );

    await limparCacheCargaMaquina();

    logDesenvolvimento(
      "[Carga Máquina] Cache local limpo. Buscando base completa novamente...",
    );

    const resultado = await consulta.refetch();

    logDesenvolvimento(
      "[Carga Máquina] Atualização completa finalizada.",
    );

    return resultado;
  }

  return {
    dados: consulta.data ?? DADOS_VAZIOS,

    loading: consulta.isPending,

    atualizando: consulta.isFetching,

    erro: consulta.error
      ? consulta.error.message ||
        "Não foi possível carregar os dados de produção."
      : "",

    recarregar: consulta.refetch,

    recarregarCompleto,
  };
}