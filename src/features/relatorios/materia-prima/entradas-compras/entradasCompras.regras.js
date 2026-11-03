/* =========================================================
   ENTRADAS E COMPRAS DE MATÉRIA-PRIMA — REGRAS DA TELA
   ---------------------------------------------------------
   Formatadores, filtros e texto do resumo. Funções puras.
========================================================= */

import { formatarNumeroPtBR, formatarDuasCasas } from "@/shared/lib/formatar";
import {
  DATAS_REFERENCIA_ENTRADAS_COMPRAS,
  SITUACOES_ENTRADAS_COMPRAS,
} from "./services/entradasComprasMateriaPrimaService";

/* =========================================================
   FORMATADORES
========================================================= */

export function formatarData(valor) {
  if (!valor) {
    return "-";
  }

  const partes = String(valor).split("-");

  if (partes.length !== 3) {
    return String(valor);
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function formatarNumero(valor, casas = 0) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0";
  }

  return formatarNumeroPtBR(numero, {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function formatarKg(valor) {
  return `${formatarNumero(valor, 2)} kg`;
}

export function formatarMoeda(valor, casas = 2) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "-";
  }

  return formatarNumeroPtBR(numero, {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function formatarPreco(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  return `${formatarMoeda(valor, 3)}/kg`;
}

export function formatarPercentual(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "-";
  }

  return `${formatarDuasCasas(numero)}%`;
}

/* =========================================================
   FILTROS
========================================================= */

export function criarFiltrosIniciais() {
  return {
    dataInicio: "",
    dataFim: "",
    dataReferencia: "PREVISAO",
    situacao: "TODAS",
    fornecedorId: "TODOS",
    materialId: "TODOS",
    busca: "",
  };
}

export const SITUACAO_POR_FILTRO = {
  RECEBIDAS: "RECEBIDA",
  FUTURAS: "FUTURA",
  ENCERRADAS: "ENCERRADA",
};

export function combinaSituacao(registro, situacao) {
  const esperada = SITUACAO_POR_FILTRO[situacao];
  return !esperada || registro.situacao === esperada;
}

export function opcoesUnicas(registros, campoId, campoNome) {
  const mapa = new Map();
  for (const registro of registros) {
    const id = registro?.[campoId];
    const nome = String(registro?.[campoNome] ?? "").trim();
    if (id === null || id === undefined || id === "" || !nome) continue;
    mapa.set(String(id), { id, nome });
  }
  return [...mapa.values()].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
  );
}

export function obterDataReferencia(registro, referencia) {
  if (referencia === "EMISSAO") {
    return registro.emissao;
  }

  if (referencia === "RECEBIMENTO") {
    return registro.recebido;
  }

  return registro.previsaoRecebimento;
}

export function obterNomeOpcao(opcoes, valor) {
  return opcoes.find((opcao) => opcao.valor === valor)?.nome || valor;
}

export function montarTextoFiltros(filtros, dados) {
  const partes = [];

  const nomeReferencia = obterNomeOpcao(DATAS_REFERENCIA_ENTRADAS_COMPRAS, filtros.dataReferencia);

  if (filtros.dataInicio || filtros.dataFim) {
    partes.push(
      `${nomeReferencia}: ${
        filtros.dataInicio ? formatarData(filtros.dataInicio) : "sem início"
      } até ${filtros.dataFim ? formatarData(filtros.dataFim) : "sem fim"}`,
    );
  } else {
    partes.push(`${nomeReferencia}: todos os períodos`);
  }

  partes.push(`Situação: ${obterNomeOpcao(SITUACOES_ENTRADAS_COMPRAS, filtros.situacao)}`);

  if (filtros.fornecedorId !== "TODOS") {
    const fornecedor = dados.fornecedores.find(
      (item) => String(item.id) === String(filtros.fornecedorId),
    );

    partes.push(`Fornecedor: ${fornecedor?.nome || filtros.fornecedorId}`);
  }

  if (filtros.materialId !== "TODOS") {
    const material = dados.materiais.find((item) => String(item.id) === String(filtros.materialId));

    partes.push(`Material: ${material?.nome || filtros.materialId}`);
  }

  if (String(filtros.busca).trim()) {
    partes.push(`Busca: ${String(filtros.busca).trim()}`);
  }

  return partes.join(" | ");
}
