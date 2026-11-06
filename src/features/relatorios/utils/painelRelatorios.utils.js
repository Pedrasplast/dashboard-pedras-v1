import { normalizarTexto } from "@/shared/lib/texto";

/* =========================================================
   TELA INICIAL DOS RELATÓRIOS — regras da lista
   Favoritos e recentes ficam no navegador (localStorage),
   por usuário do computador.
========================================================= */

export const GRUPO_FAVORITOS = "__favoritos";
export const GRUPO_RECENTES = "__recentes";
export const GRUPO_TODOS = "Todos";

export const MAX_RECENTES = 8;

/** Lê uma lista do localStorage; qualquer problema = lista vazia. */
export function lerLista(chave, armazenamento = globalThis.localStorage) {
  try {
    const valor = JSON.parse(armazenamento?.getItem(chave) || "[]");
    return Array.isArray(valor) ? valor : [];
  } catch {
    return [];
  }
}

export function gravarLista(chave, lista, armazenamento = globalThis.localStorage) {
  try {
    armazenamento?.setItem(chave, JSON.stringify(lista));
  } catch {
    // Sem armazenamento: só não guarda.
  }
  return lista;
}

/** Liga/desliga um favorito, mantendo a ordem em que foram marcados. */
export function alternarFavorito(favoritos, id) {
  return favoritos.includes(id) ? favoritos.filter((item) => item !== id) : [...favoritos, id];
}

/** Põe o relatório no topo dos recentes ({ id, em }), sem repetir. */
export function registrarRecente(recentes, id, agora = Date.now()) {
  return [{ id, em: agora }, ...recentes.filter((item) => item?.id !== id)].slice(0, MAX_RECENTES);
}

/** "hoje", "ontem" ou "dd/mm". */
export function quando(ms, hoje = new Date()) {
  const data = new Date(ms);
  if (Number.isNaN(data.getTime())) return "";
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  if (data.toDateString() === hoje.toDateString()) return "hoje";
  if (data.toDateString() === ontem.toDateString()) return "ontem";
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function combinaBusca(relatorio, termo) {
  return normalizarTexto(
    [relatorio.categoria, relatorio.titulo, relatorio.descricao].join(" "),
  ).includes(termo);
}

/**
 * Relatórios que aparecem na coluna da direita.
 * - Com busca: procura em todos, ignorando o grupo escolhido.
 * - Favoritos/Recentes: na ordem guardada, só os que o usuário pode abrir.
 * - "Todos" ou uma categoria: como vieram (já filtrados por permissão).
 * Cada item volta como { relatorio, em? }.
 */
export function montarLista({ relatorios = [], grupo, busca = "", favoritos = [], recentes = [] }) {
  const termo = normalizarTexto(busca).trim();
  if (termo) {
    return relatorios.filter((relatorio) => combinaBusca(relatorio, termo)).map((relatorio) => ({ relatorio }));
  }

  const porId = new Map(relatorios.map((relatorio) => [relatorio.id, relatorio]));

  if (grupo === GRUPO_FAVORITOS) {
    return favoritos.filter((id) => porId.has(id)).map((id) => ({ relatorio: porId.get(id) }));
  }

  if (grupo === GRUPO_RECENTES) {
    return recentes
      .filter((item) => porId.has(item?.id))
      .map((item) => ({ relatorio: porId.get(item.id), em: item.em }));
  }

  const lista = grupo && grupo !== GRUPO_TODOS
    ? relatorios.filter((relatorio) => relatorio.categoria === grupo)
    : relatorios;
  return lista.map((relatorio) => ({ relatorio }));
}

/** Separa por categoria (para "Todos" e para a busca), mantendo a ordem. */
export function agruparPorCategoria(itens) {
  const grupos = [];
  for (const item of itens) {
    const nome = item.relatorio.categoria || "Outros";
    let grupo = grupos.find((g) => g.nome === nome);
    if (!grupo) {
      grupo = { nome, itens: [] };
      grupos.push(grupo);
    }
    grupo.itens.push(item);
  }
  return grupos;
}
