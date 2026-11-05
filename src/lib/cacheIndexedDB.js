/*
 * Cache simples chave → valor no IndexedDB do navegador.
 *
 * Uso típico: guardar uma resposta grande do Supabase junto com a
 * "versão" dos dados, para não baixar de novo quando nada mudou.
 *
 * Nunca lança erro: se o IndexedDB não existir (testes, aba anônima
 * restrita, navegador antigo) ou falhar, as funções apenas devolvem
 * null / não gravam. Quem usa deve sempre ter o caminho "sem cache".
 */

const NOME_BANCO = "pedrasplast-cache";
const VERSAO_BANCO = 1;
const STORE = "entradas";

function indexedDBDisponivel() {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

function abrirBanco() {
  return new Promise((resolve, reject) => {
    const requisicao = indexedDB.open(NOME_BANCO, VERSAO_BANCO);

    requisicao.onupgradeneeded = () => {
      const db = requisicao.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };

    requisicao.onsuccess = () => resolve(requisicao.result);
    requisicao.onerror = () => reject(requisicao.error);
    requisicao.onblocked = () => reject(new Error("IndexedDB bloqueado"));
  });
}

export async function lerCache(chave) {
  if (!indexedDBDisponivel()) return null;

  try {
    const db = await abrirBanco();

    return await new Promise((resolve) => {
      const transacao = db.transaction(STORE, "readonly");
      const requisicao = transacao.objectStore(STORE).get(chave);

      requisicao.onsuccess = () => resolve(requisicao.result ?? null);
      requisicao.onerror = () => resolve(null);
      transacao.oncomplete = () => db.close();
      transacao.onabort = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function gravarCache(chave, valor) {
  if (!indexedDBDisponivel()) return false;

  try {
    const db = await abrirBanco();

    return await new Promise((resolve) => {
      const transacao = db.transaction(STORE, "readwrite");
      transacao.objectStore(STORE).put(valor, chave);

      transacao.oncomplete = () => {
        db.close();
        resolve(true);
      };
      transacao.onerror = () => resolve(false);
      transacao.onabort = () => {
        db.close();
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}

export async function apagarCache(chave) {
  if (!indexedDBDisponivel()) return false;

  try {
    const db = await abrirBanco();

    return await new Promise((resolve) => {
      const transacao = db.transaction(STORE, "readwrite");
      transacao.objectStore(STORE).delete(chave);

      transacao.oncomplete = () => {
        db.close();
        resolve(true);
      };
      transacao.onerror = () => resolve(false);
      transacao.onabort = () => {
        db.close();
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}
