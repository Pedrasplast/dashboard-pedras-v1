import { buscarComprasFuturas } from "../compras-futuras/comprasFuturasService";

import { buscarProgramacaoParaProjecao } from "../programacao/programacaoDiariaService";

import { buscarSaldosIniciais } from "./saldo-inicial/saldoInicialService";

import { calcularProjecao } from "./projecao.regras";

const MATERIAL_PADRAO_ID = 1;

/* =========================================================
   PROJEÇÃO

   Valida o pedido, busca saldos, compras e programação e
   entrega o cálculo para projecao.regras.js.
========================================================= */

export async function buscarProjecao({ dataInicio, dataFim, materialId = MATERIAL_PADRAO_ID }) {
  if (!dataInicio) {
    throw new Error("Informe a data inicial da projeção.");
  }

  if (!dataFim) {
    throw new Error("Informe a data final da projeção.");
  }

  if (dataFim < dataInicio) {
    throw new Error("A data final não pode ser anterior à data inicial.");
  }

  const materialIdFinal = Number(materialId);

  if (!Number.isFinite(materialIdFinal) || materialIdFinal <= 0) {
    throw new Error("Selecione um material válido para a projeção.");
  }

  const [resultadoSaldos, resultadoCompras, resultadoProgramacao] = await Promise.all([
    buscarSaldosIniciais({
      materialId: materialIdFinal,
    }),

    buscarComprasFuturas(),

    buscarProgramacaoParaProjecao({
      dataInicio: null,
      dataFim,
    }),
  ]);

  return calcularProjecao({
    dataInicio,
    dataFim,
    materialId: materialIdFinal,
    resultadoSaldos,
    resultadoCompras,
    resultadoProgramacao,
  });
}
