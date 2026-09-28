import { formatarData } from "./formatadores";

/* =========================================================
   CONSTANTES
========================================================= */

export const TODOS = "TODOS";

export const PERIODO_RECEBIDO = "RECEBIDO";

export const PERIODO_EMISSAO = "EMISSAO";

export const FILTROS_INICIAIS = {
  fornecedor: TODOS,
  material: TODOS,
  tipo: TODOS,
  periodoPor: PERIODO_RECEBIDO,
  dataDe: "",
  dataAte: "",
};

/* =========================================================
   OPÇÕES DOS SELECTS
========================================================= */

function ordenarTexto(a, b) {
  return a.localeCompare(b, "pt-BR");
}

/** Lista única de { id, nome } a partir de um campo de id e um de nome. */
export function extrairOpcoes(entradas, campoId, campoNome, nomePadrao) {
  const mapa = new Map();

  entradas.forEach((entrada) => {
    const id = entrada[campoId];

    if (id === null || id === undefined) {
      return;
    }

    mapa.set(String(id), entrada[campoNome] || nomePadrao);
  });

  return Array.from(mapa, ([id, nome]) => ({ id, nome })).sort((a, b) =>
    ordenarTexto(a.nome, b.nome),
  );
}

export function obterTipo(entrada) {
  return String(entrada.tipoClassificacao ?? "").trim();
}

export function extrairTipos(entradas) {
  return Array.from(new Set(entradas.map(obterTipo).filter(Boolean))).sort(ordenarTexto);
}

/* =========================================================
   FILTRO + ORDENAÇÃO
========================================================= */

function atendeFiltros(entrada, filtros) {
  const { fornecedor, material, tipo, periodoPor, dataDe, dataAte } = filtros;

  const fornecedorOk = fornecedor === TODOS || String(entrada.fornecedorId) === fornecedor;

  const materialOk = material === TODOS || String(entrada.materialId) === material;

  const tipoOk = tipo === TODOS || obterTipo(entrada) === tipo;

  const dataReferencia =
    periodoPor === PERIODO_EMISSAO ? String(entrada.dataCompra ?? "") : String(entrada.data ?? "");

  const periodoOk =
    (!dataDe || (dataReferencia && dataReferencia >= dataDe)) &&
    (!dataAte || (dataReferencia && dataReferencia <= dataAte));

  return fornecedorOk && materialOk && tipoOk && periodoOk;
}

/** Mais recentes primeiro (data de emissão), depois nº do pedido decrescente. */
function compararEntradas(a, b) {
  const comparacaoData = String(b.dataCompra ?? "").localeCompare(String(a.dataCompra ?? ""));

  if (comparacaoData !== 0) {
    return comparacaoData;
  }

  return String(b.numeroPedido ?? "").localeCompare(String(a.numeroPedido ?? ""), "pt-BR", {
    numeric: true,
  });
}

export function filtrarEntradas(entradas, filtros) {
  return entradas.filter((entrada) => atendeFiltros(entrada, filtros)).sort(compararEntradas);
}

/* =========================================================
   DESCRIÇÃO DO PERÍODO
========================================================= */

export function descreverPeriodo({ periodoPor, dataDe, dataAte }) {
  const campo = periodoPor === PERIODO_EMISSAO ? "data de emissão" : "data de recebimento";

  if (!dataDe && !dataAte) {
    return `Sem período definido: considerando todo o histórico pela ${campo}.`;
  }

  if (dataDe && dataAte) {
    return `Período de ${formatarData(dataDe)} até ${formatarData(dataAte)}, considerando a ${campo}.`;
  }

  if (dataDe) {
    return `Considerando registros a partir de ${formatarData(dataDe)}, pela ${campo}.`;
  }

  return `Considerando registros até ${formatarData(dataAte)}, pela ${campo}.`;
}

/* =========================================================
   INDICADORES
========================================================= */

export function calcularIndicadores(entradas) {
  const ativas = entradas.filter((entrada) => entrada.ativo);

  return {
    recebimentos: ativas.length,
    totalKg: ativas.reduce((total, entrada) => total + Number(entrada.quantidadeKg ?? 0), 0),
    totalValor: ativas.reduce((total, entrada) => total + Number(entrada.valorTotal ?? 0), 0),
  };
}
