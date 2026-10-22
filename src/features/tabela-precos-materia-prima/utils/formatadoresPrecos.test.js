import { describe, expect, it } from "vitest";

import { filtrarTabelaPrecos, obterPrecoReferencia } from "./formatadoresPrecos";

/* Valores reais de 22/10/2026 (view precos_materia_prima_omie). */
const PP = {
  codigo_produto: "PRD11295",
  descricao: "PP - (PRETO)",
  ultimo_preco: 5.4,
  quantidade_30d: 158000,
  preco_medio_30d: 5.7334,
  quantidade_45d: 230000,
  preco_medio_45d: 5.7,
  quantidade_60d: 254000,
  preco_medio_60d: 5.6581,
};

/* 1 compra em 30 dias (view devolve média 0) e 3 em 60 dias. */
const TAMPINHA = {
  codigo_produto: "PRD13023",
  descricao: "PP - (TAMPINHA)",
  ultimo_preco: 2.6,
  quantidade_30d: 1795,
  preco_medio_30d: 0,
  quantidade_45d: 3855,
  preco_medio_45d: 2.6,
  quantidade_60d: 5975,
  preco_medio_60d: 2.6,
};

describe("obterPrecoReferencia por período", () => {
  it("usa 30 dias quando o período não é informado", () => {
    expect(obterPrecoReferencia(PP)).toEqual({ valor: 5.7334, origem: "media_30d" });
  });

  it("troca a média conforme o botão 45 / 60 dias", () => {
    expect(obterPrecoReferencia(PP, 45)).toEqual({ valor: 5.7, origem: "media_45d" });
    expect(obterPrecoReferencia(PP, 60)).toEqual({ valor: 5.6581, origem: "media_60d" });
  });

  it("sem média no período (menos de 2 compras) mostra o último preço", () => {
    expect(obterPrecoReferencia(TAMPINHA, 30)).toEqual({ valor: 2.6, origem: "ultima_compra" });
    expect(obterPrecoReferencia(TAMPINHA, 60)).toEqual({ valor: 2.6, origem: "media_60d" });
  });

  it("sem média e sem último preço fica sem preço", () => {
    expect(obterPrecoReferencia({ preco_medio_45d: 0 }, 45)).toEqual({
      valor: null,
      origem: "sem_preco",
    });
  });
});

describe("ordenação por preço respeita o período", () => {
  it("maior preço usa a média do período escolhido", () => {
    const outro = { descricao: "X", ultimo_preco: 5.68, preco_medio_30d: 0, preco_medio_60d: 0 };
    const em30 = filtrarTabelaPrecos([outro, PP], { ordenacao: "maior_preco", periodo: 30 });
    const em60 = filtrarTabelaPrecos([PP, outro], { ordenacao: "maior_preco", periodo: 60 });
    expect(em30[0].descricao).toBe("PP - (PRETO)"); // 5,73 > 5,68
    expect(em60[0].descricao).toBe("X"); // 5,68 > 5,66
  });
});
