import { describe, expect, it } from "vitest";

import { SITUACOES_RECEBIMENTO } from "../constants/pedidosCompra.constants";
import {
  atendeFiltroRecebimento,
  calcularResumoItens,
  estaEmAtraso,
  obterSituacaoRecebimento,
} from "./pedidosCompra.utils";

function dataBr(deslocamentoDias) {
  const data = new Date();
  data.setDate(data.getDate() + deslocamentoDias);
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${data.getFullYear()}`;
}

function pedido(quantidade, recebida, deslocamentoDias) {
  return {
    tipo_documento: "PEDIDO",
    data_previsao: dataBr(deslocamentoDias),
    itens: [{ quantidade, quantidade_recebida: recebida, preco_unitario: 1 }],
  };
}

describe("obterSituacaoRecebimento", () => {
  it("recebido parcialmente com previsão vencida é parcial em atraso", () => {
    expect(obterSituacaoRecebimento(pedido(10, 4, -1))).toBe(SITUACOES_RECEBIMENTO.PARCIAL_EM_ATRASO);
  });

  it("recebido parcialmente dentro do prazo continua parcial", () => {
    expect(obterSituacaoRecebimento(pedido(10, 4, 0))).toBe(SITUACOES_RECEBIMENTO.RECEBIDO_PARCIALMENTE);
    expect(obterSituacaoRecebimento(pedido(10, 4, 3))).toBe(SITUACOES_RECEBIMENTO.RECEBIDO_PARCIALMENTE);
  });

  it("sem recebimento e previsão vencida é atraso; previsão hoje está em aberto", () => {
    expect(obterSituacaoRecebimento(pedido(10, 0, -5))).toBe(SITUACOES_RECEBIMENTO.EM_ATRASO);
    expect(obterSituacaoRecebimento(pedido(10, 0, 0))).toBe(SITUACOES_RECEBIMENTO.EM_ABERTO);
  });

  it("totalmente recebido nunca é atraso", () => {
    expect(obterSituacaoRecebimento(pedido(10, 10, -5))).toBe(SITUACOES_RECEBIMENTO.RECEBIDO);
  });

  it("requisição não tem situação de recebimento", () => {
    expect(obterSituacaoRecebimento({ tipo_documento: "REQUISICAO", itens: [] })).toBeNull();
  });
});

function enriquecido(quantidade, recebida, deslocamentoDias) {
  const p = pedido(quantidade, recebida, deslocamentoDias);
  return { ...p, situacao_recebimento: obterSituacaoRecebimento(p), ...calcularResumoItens(p.itens) };
}

describe("atendeFiltroRecebimento", () => {
  const parcialAtrasado = enriquecido(10, 4, -1);
  const parcialNoPrazo = enriquecido(10, 4, 2);
  const atrasadoSemRecebimento = enriquecido(10, 0, -1);
  const recebido = enriquecido(10, 10, -1);

  it("filtro Recebido parcialmente traz parciais, inclusive os atrasados", () => {
    const filtro = SITUACOES_RECEBIMENTO.RECEBIDO_PARCIALMENTE;
    expect(atendeFiltroRecebimento(parcialAtrasado, filtro)).toBe(true);
    expect(atendeFiltroRecebimento(parcialNoPrazo, filtro)).toBe(true);
    expect(atendeFiltroRecebimento(atrasadoSemRecebimento, filtro)).toBe(false);
    expect(atendeFiltroRecebimento(recebido, filtro)).toBe(false);
  });

  it("filtro Em atraso traz só o atrasado sem recebimento (igual ao Omie)", () => {
    const filtro = SITUACOES_RECEBIMENTO.EM_ATRASO;
    expect(atendeFiltroRecebimento(atrasadoSemRecebimento, filtro)).toBe(true);
    expect(atendeFiltroRecebimento(parcialAtrasado, filtro)).toBe(false);
    expect(atendeFiltroRecebimento(parcialNoPrazo, filtro)).toBe(false);
  });

  it("filtro Parcial em atraso traz só o parcial com previsão vencida", () => {
    const filtro = SITUACOES_RECEBIMENTO.PARCIAL_EM_ATRASO;
    expect(atendeFiltroRecebimento(parcialAtrasado, filtro)).toBe(true);
    expect(atendeFiltroRecebimento(parcialNoPrazo, filtro)).toBe(false);
    expect(atendeFiltroRecebimento(atrasadoSemRecebimento, filtro)).toBe(false);
  });

  it("filtro Todos traz tudo", () => {
    expect(atendeFiltroRecebimento(recebido, SITUACOES_RECEBIMENTO.TODOS)).toBe(true);
  });
});

describe("estaEmAtraso", () => {
  it("vale para atrasado com e sem recebimento parcial", () => {
    expect(estaEmAtraso(SITUACOES_RECEBIMENTO.EM_ATRASO)).toBe(true);
    expect(estaEmAtraso(SITUACOES_RECEBIMENTO.PARCIAL_EM_ATRASO)).toBe(true);
    expect(estaEmAtraso(SITUACOES_RECEBIMENTO.RECEBIDO_PARCIALMENTE)).toBe(false);
    expect(estaEmAtraso(SITUACOES_RECEBIMENTO.EM_ABERTO)).toBe(false);
  });
});
