import { describe, expect, it } from "vitest";

import { SITUACOES_RECEBIMENTO } from "../constants/pedidosCompra.constants";
import { obterSituacaoRecebimento } from "./pedidosCompra.utils";

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
  it("recebido parcialmente com previsão vencida conta como atraso", () => {
    expect(obterSituacaoRecebimento(pedido(10, 4, -1))).toBe(SITUACOES_RECEBIMENTO.EM_ATRASO);
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
