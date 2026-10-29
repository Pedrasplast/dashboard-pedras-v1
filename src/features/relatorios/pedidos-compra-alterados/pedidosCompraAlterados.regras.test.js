import { afterEach, describe, expect, it, vi } from "vitest";

import {
  dataBR,
  dataHoje,
  descreverSincronizacao,
  filtrarPedidosCompra,
  inicioDoMes,
  prepararPedido,
} from "./pedidosCompraAlterados.regras";

afterEach(() => {
  vi.useRealTimers();
});

describe("datas", () => {
  it("hoje segue o fuso de Brasília, não o UTC", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-01T02:00:00.000Z"));

    expect(dataHoje()).toBe("2026-10-31");
    expect(inicioDoMes("2026-10-31")).toBe("2026-10-01");
    expect(dataBR("2026-10-31")).toBe("31/10/2026");
    expect(dataBR("")).toBe("Sem limite");
  });
});

describe("prepararPedido", () => {
  const referencias = { fornecedores: {}, locais: {}, itensPorPedido: {} };

  it("pedido sem mudanças relevantes é descartado", () => {
    expect(prepararPedido({ cod_ped_compra: 1, detalhes_alteracoes: [] }, referencias)).toBe(null);
  });

  it("numera os eventos do mais novo para o mais antigo", () => {
    const pedido = prepararPedido(
      {
        cod_ped_compra: 1,
        numero_pedido: "PC1",
        detalhes_alteracoes: [
          {
            id: 1,
            detectado_em: "2026-10-01T10:00:00Z",
            detalhes: { previsao: { anterior: "2026-10-01", novo: "2026-10-05" } },
          },
          {
            id: 2,
            detectado_em: "2026-10-03T10:00:00Z",
            detalhes: { previsao: { anterior: "2026-10-05", novo: "2026-10-09" } },
          },
        ],
      },
      referencias,
    );

    expect(pedido.detalhes_alteracoes.map((evento) => [evento.id, evento.numeroAlteracao])).toEqual(
      [
        [2, 2],
        [1, 1],
      ],
    );
    expect(pedido).toMatchObject({
      quantidade_alteracoes: 2,
      primeira_alteracao: "2026-10-01T10:00:00Z",
      ultima_alteracao: "2026-10-03T10:00:00Z",
    });
  });
});

describe("filtrarPedidosCompra", () => {
  it("encontra pelo nome do fornecedor, sem diferenciar acento", () => {
    const pedidos = [
      { numero_pedido: "PC1", fornecedor_codigo: 5, campos_alterados: [], detalhes_alteracoes: [] },
      { numero_pedido: "PC2", fornecedor_codigo: 6, campos_alterados: [], detalhes_alteracoes: [] },
    ];

    expect(filtrarPedidosCompra(pedidos, " joao ", { 6: "João Plásticos" })).toEqual([pedidos[1]]);
    expect(filtrarPedidosCompra(pedidos, "  ", {})).toBe(pedidos);
  });
});

describe("descreverSincronizacao", () => {
  it("concluída só no sucesso da última página; erro usa a mensagem do status", () => {
    expect(descreverSincronizacao({ status: "sucesso", pagina_proxima: 1 }, null)).toMatchObject({
      concluida: true,
      andamento: false,
      cor: "#15803d",
    });
    expect(descreverSincronizacao({ status: "sucesso", pagina_proxima: 3 }, null)).toMatchObject({
      concluida: false,
      andamento: true,
    });
    expect(
      descreverSincronizacao({ status: "erro", mensagem: "Omie fora", atualizado_em: "t" }, null),
    ).toMatchObject({ falha: true, mensagem: "Omie fora", instante: "t", cor: "#b91c1c" });
  });
});
