import { describe, expect, it } from "vitest";

import { converterDataIsoParaBrasileira, mapearPedidoParaTela } from "./pedidosOmie.regras";

describe("converterDataIsoParaBrasileira", () => {
  it("converte para o formato brasileiro", () => {
    expect(converterDataIsoParaBrasileira("2026-10-15")).toBe("15/10/2026");
    expect(converterDataIsoParaBrasileira("lixo")).toBe("lixo");
    expect(converterDataIsoParaBrasileira(null)).toBe("");
  });
});

describe("mapearPedidoParaTela", () => {
  it("usa o número de exibição (/1, /2...) quando existe", () => {
    const pedido = mapearPedidoParaTela(
      {
        chave_item: "5:1",
        codigo_pedido_omie: "5",
        numero_pedido: "100",
        data_pedido: "2026-10-15",
      },
      new Map([[5, "100/1"]]),
    );

    expect(pedido).toMatchObject({
      id: "5:1",
      pedidoExibicao: "100/1",
      data: "15/10/2026",
      cliente: "-",
      status: "Pedido",
      quantidade: 0,
    });
  });
});
