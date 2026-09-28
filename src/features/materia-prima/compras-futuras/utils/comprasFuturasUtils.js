import { formatarData, formatarKg, formatarMoeda } from "./formatadores";

/* =========================================================
   CONSTANTES
========================================================= */

export const TODOS = "TODOS";

export const STATUS = {
  PREVISTA: "PREVISTA",
  CONFIRMADA: "CONFIRMADA",
  RECEBIDA: "RECEBIDA",
  CANCELADA: "CANCELADA",
};

const ROTULOS_STATUS = {
  [STATUS.PREVISTA]: "Prevista",
  [STATUS.CONFIRMADA]: "Confirmada",
  [STATUS.RECEBIDA]: "Recebida",
  [STATUS.CANCELADA]: "Cancelada",
};

export const FILTROS_INICIAIS = {
  fornecedor: TODOS,
  material: TODOS,
  tipo: TODOS,
};

/* =========================================================
   STATUS
========================================================= */

/** Status desconhecido é tratado como "Prevista" (igual ao original). */
export function normalizarStatus(status) {
  return ROTULOS_STATUS[status] ? status : STATUS.PREVISTA;
}

export function rotuloStatus(status) {
  return ROTULOS_STATUS[normalizarStatus(status)];
}

/** Compra ainda aguardando chegada (Prevista ou Confirmada). */
export function estaEmAberto(compra) {
  return compra.status === STATUS.PREVISTA || compra.status === STATUS.CONFIRMADA;
}

export function filtrarAbertas(compras) {
  return compras.filter((compra) => compra.ativo && estaEmAberto(compra));
}

/* =========================================================
   OPÇÕES DOS SELECTS
========================================================= */

function ordenarTexto(a, b) {
  return a.localeCompare(b, "pt-BR");
}

/** Lista única de { id, nome } a partir de um campo de id e um de nome. */
export function extrairOpcoes(lista, campoId, campoNome, nomePadrao) {
  const mapa = new Map();

  lista.forEach((item) => {
    const id = item[campoId];

    if (id === null || id === undefined) {
      return;
    }

    mapa.set(String(id), item[campoNome] || nomePadrao);
  });

  return Array.from(mapa, ([id, nome]) => ({ id, nome })).sort((a, b) =>
    ordenarTexto(a.nome, b.nome),
  );
}

export function obterTipo(compra) {
  return String(compra.tipoClassificacao ?? "").trim();
}

export function extrairTipos(lista) {
  return Array.from(new Set(lista.map(obterTipo).filter(Boolean))).sort(ordenarTexto);
}

/* =========================================================
   FILTRO
========================================================= */

export function filtrarCompras(compras, { fornecedor, material, tipo }) {
  return compras.filter(
    (compra) =>
      (fornecedor === TODOS || String(compra.fornecedorId) === fornecedor) &&
      (material === TODOS || String(compra.materialId) === material) &&
      (tipo === TODOS || obterTipo(compra) === tipo),
  );
}

/* =========================================================
   INDICADORES
========================================================= */

export function calcularIndicadores(compras) {
  return {
    abertas: compras.length,
    quantidadeAberta: compras.reduce(
      (total, compra) => total + Number(compra.quantidadeKg ?? 0),
      0,
    ),
    valorAberto: compras.reduce((total, compra) => total + Number(compra.valorTotal ?? 0), 0),
  };
}

/* =========================================================
   DADOS DO MODAL DE EXCLUSÃO
========================================================= */

export function descricaoExclusao(compra) {
  return compra?.numeroPedido
    ? `Pedido ${compra.numeroPedido}`
    : `Compra de ${compra?.materialNome || "matéria-prima"}`;
}

export function detalhesExclusao(compra) {
  return [
    { label: "Material", valor: compra?.materialNome || "-" },
    { label: "Tipo", valor: compra?.tipoClassificacao || "-" },
    { label: "Quantidade", valor: compra ? formatarKg(compra.quantidadeKg) : "-" },
    { label: "Valor total", valor: compra ? formatarMoeda(compra.valorTotal) : "-" },
    { label: "Status", valor: rotuloStatus(compra?.status) },
    { label: "Data da compra", valor: compra ? formatarData(compra.dataCompra) : "-" },
    { label: "Previsão", valor: compra ? formatarData(compra.dataPrevista) : "-" },
  ];
}
