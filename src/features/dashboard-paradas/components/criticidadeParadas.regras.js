/* =========================================================
   CRITICIDADE DAS PARADAS — REGRAS
   ---------------------------------------------------------
   Funções puras e constantes usadas pela tela; movidas do
   componente sem alteração.
========================================================= */

import { formatarNumeroPtBR } from "@/shared/lib/formatar";
import { converterNumeroFlexivel } from "@/shared/lib/numeros";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

export const QUADRANTES = Object.freeze({
  prioridade1: {
    titulo: "Prioridade 1",
    nome: "Atacar primeiro",
    descricao: "Muitas ocorrências + muitas horas paradas",
    cor: "#dc2626",
    fundo: "#fef2f2",
    borda: "#fecaca",
    texto: "#991b1b",
  },

  prioridade2: {
    titulo: "Prioridade 2",
    nome: "Alto impacto",
    descricao: "Poucas ocorrências + muitas horas paradas",
    cor: "#ea580c",
    fundo: "#fff7ed",
    borda: "#fed7aa",
    texto: "#9a3412",
  },

  prioridade3: {
    titulo: "Prioridade 3",
    nome: "Recorrente",
    descricao: "Muitas ocorrências + poucas horas paradas",
    cor: "#2563eb",
    fundo: "#eff6ff",
    borda: "#bfdbfe",
    texto: "#1e40af",
  },

  prioridade4: {
    titulo: "Prioridade 4",
    nome: "Monitorar",
    descricao: "Poucas ocorrências + poucas horas paradas",
    cor: "#64748b",
    fundo: "#f8fafc",
    borda: "#e2e8f0",
    texto: "#475569",
  },
});

/* =========================================================
   FORMATAÇÕES
========================================================= */

export function formatarHoras(valor) {
  return formatarNumeroPtBR(converterNumeroFlexivel(valor), {
    maximumFractionDigits: 1,
  });
}

/* =========================================================
   CLASSIFICAÇÃO
========================================================= */

export function classificarQuadrante({ ocorrencias, horas, mediaOcorrencias, mediaHoras }) {
  const recorrente = ocorrencias >= mediaOcorrencias;

  const altoImpacto = horas >= mediaHoras;

  if (recorrente && altoImpacto) {
    return "prioridade1";
  }

  if (!recorrente && altoImpacto) {
    return "prioridade2";
  }

  if (recorrente && !altoImpacto) {
    return "prioridade3";
  }

  return "prioridade4";
}
