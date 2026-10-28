import { describe, expect, it } from "vitest";

import {
  criarMapaMetadadosPedidoExibicao,
  criarMapaNumeroPedidoExibicao,
} from "./numeroPedidoExibicao";

const registros = [
  { codigo_pedido_omie: 300, numero_pedido: "10", criado_em: "2026-02-01T10:00:00Z" },
  { codigo_pedido_omie: 100, numero_pedido: "10", criado_em: "2026-01-01T10:00:00Z" },
  // Mesmo horário: desempata pelo código.
  { codigo_pedido_omie: 250, numero_pedido: "10", criado_em: "2026-02-01T10:00:00Z" },
  { codigo_pedido_omie: 400, numero_pedido: " 20 ", criado_em: null },
  // Inválidos: ignorados.
  { codigo_pedido_omie: 0, numero_pedido: "30" },
  { codigo_pedido_omie: 500, numero_pedido: "" },
];

describe("criarMapaNumeroPedidoExibicao", () => {
  it("numera os desdobramentos do mais antigo para o mais novo", () => {
    expect([...criarMapaNumeroPedidoExibicao(registros)]).toEqual([
      [100, "10"],
      [250, "10/1"],
      [300, "10/2"],
      [400, "20"],
    ]);
  });

  it("aceita os nomes de campo usados na tela de Pedidos", () => {
    const mapa = criarMapaNumeroPedidoExibicao([
      { codigoPedidoOmie: 2, pedidoOriginal: "7", criadoEm: "2026-01-02" },
      { codigoPedido: 1, pedido: "7", data_pedido: "2026-01-01" },
    ]);

    expect(mapa.get(1)).toBe("7");
    expect(mapa.get(2)).toBe("7/1");
  });
});

describe("criarMapaMetadadosPedidoExibicao", () => {
  it("descreve o grupo de desdobramento de cada pedido", () => {
    const metadados = criarMapaMetadadosPedidoExibicao(registros).get(250);

    expect(metadados).toMatchObject({
      codigoPedidoOmie: 250,
      numeroOriginal: "10",
      numeroExibicao: "10/1",
      indice: 1,
      total: 3,
      desdobrado: true,
      ehOriginal: false,
      quantidadeDerivados: 2,
    });

    expect(metadados.partes.map((parte) => parte.numero_exibicao)).toEqual(["10", "10/1", "10/2"]);
  });

  it("marca pedido sem desdobramento como original", () => {
    expect(criarMapaMetadadosPedidoExibicao(registros).get(400)).toMatchObject({
      numeroExibicao: "20",
      desdobrado: false,
      ehOriginal: true,
      quantidadeDerivados: 0,
    });
  });
});
