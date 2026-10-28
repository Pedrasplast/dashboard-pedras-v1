import { describe, expect, it } from "vitest";

import {
  aplicarDesdobramentoPedidos,
  extrairMudancas,
  formatarDataSemFuso,
  formatarValorGenerico,
  pesquisarPedidosAlterados,
} from "./formatadoresPedidosAlterados";

describe("formatação do histórico", () => {
  it("formata data sem passar por fuso e mantém o resto como está", () => {
    expect(formatarDataSemFuso("2026-01-05")).toBe("05/01/2026");
    expect(formatarDataSemFuso("05/01/2026")).toBe("05/01/2026");
    expect(formatarDataSemFuso("")).toBe("-");
  });

  it("só trata como data os campos de data/previsão (20240 não vira ano)", () => {
    expect(formatarValorGenerico(20240, "quantidade")).toBe("20.240");
    expect(formatarValorGenerico("2026-03-01", "previsao")).toBe("01/03/2026");
    expect(formatarValorGenerico(1234.5, "valor")).toMatch(/R\$\s1\.234,50/);
  });

  it("descreve item adicionado e alterações com rótulo", () => {
    expect(
      extrairMudancas({
        detalhes: {
          item_adicionado: { codigo_produto: "P1", produto: "Pedra", quantidade: 2, unidade: "UN" },
          previsao: { anterior: "2026-01-05", novo: "2026-01-10" },
        },
      }),
    ).toEqual([
      {
        chave: "item_adicionado",
        campo: "Item adicionado",
        anterior: "-",
        novo: "P1 • Pedra • 2 UN",
      },
      {
        chave: "previsao",
        campo: "Previsão de faturamento",
        anterior: "05/01/2026",
        novo: "10/01/2026",
      },
    ]);

    expect(extrairMudancas({ detalhes: null })).toEqual([]);
  });
});

describe("desdobramento e pesquisa", () => {
  const base = [
    { codigo_pedido_omie: 1, numero_pedido: "100", cliente: "ACME" },
    { codigo_pedido_omie: 2, numero_pedido: "100", cliente: "Ação Ltda" },
  ];

  const mapa = new Map([
    [1, { numeroExibicao: "100", desdobrado: true, ehOriginal: true, indice: 0, total: 2 }],
    [2, { numeroExibicao: "100/1", desdobrado: true, ehOriginal: false, indice: 1, total: 2 }],
  ]);

  it("troca só o número exibido e guarda o original", () => {
    const [, derivado] = aplicarDesdobramentoPedidos(base, mapa);

    expect(derivado).toMatchObject({
      numero_pedido: "100/1",
      numero_pedido_original: "100",
      pedido_desdobrado: true,
      pedido_desdobramento_original: false,
      pedido_desdobramento_indice: 1,
    });
  });

  it("sem o mapa, mantém os pedidos como vieram", () => {
    expect(aplicarDesdobramentoPedidos(base, undefined)[1].numero_pedido).toBe("100");
  });

  it("pesquisa sem acento e encontra pedidos desdobrados", () => {
    const pedidos = aplicarDesdobramentoPedidos(base, mapa);

    expect(pesquisarPedidosAlterados(pedidos, "acao").map((p) => p.codigo_pedido_omie)).toEqual([
      2,
    ]);
    expect(pesquisarPedidosAlterados(pedidos, "desdobr")).toHaveLength(2);
    expect(pesquisarPedidosAlterados(pedidos, "")).toBe(pedidos);
  });
});
