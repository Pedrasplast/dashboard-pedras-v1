import { describe, expect, it } from "vitest";

import {
  converterDataIsoParaBrasileira,
  converterDataOmieParaIso,
  mapearPedidoParaTela,
  normalizarPedidosParaBanco,
  normalizarStatusExibicao,
  pedidoEstaEmAberto,
} from "./pedidosOmie.regras";

describe("pedidoEstaEmAberto", () => {
  it("faturado, cancelado, devolvido ou encerrado não estão em aberto", () => {
    expect(pedidoEstaEmAberto({ infoCadastro: { faturado: "N" }, cabecalho: {} })).toBe(true);
    expect(pedidoEstaEmAberto({ infoCadastro: { faturado: "S" } })).toBe(false);
    expect(pedidoEstaEmAberto({ infoCadastro: { cancelado: "S" } })).toBe(false);
    expect(pedidoEstaEmAberto({ cabecalho: { encerrado: "S" } })).toBe(false);
    expect(pedidoEstaEmAberto(null)).toBe(true);
  });
});

describe("textos e datas", () => {
  it("Armazenado aparece como Pedido", () => {
    expect(normalizarStatusExibicao(" Armazenado ")).toBe("Pedido");
    expect(normalizarStatusExibicao("Separação")).toBe("Separação");
    expect(normalizarStatusExibicao("")).toBe("Pedido");
  });

  it("converte datas do Omie e de volta para o formato brasileiro", () => {
    expect(converterDataOmieParaIso("15/10/2026")).toBe("2026-10-15");
    expect(converterDataOmieParaIso("2026-10-15T08:00:00")).toBe("2026-10-15");
    expect(converterDataOmieParaIso("15-10-2026")).toBe(null);
    expect(converterDataIsoParaBrasileira("2026-10-15")).toBe("15/10/2026");
    expect(converterDataIsoParaBrasileira("lixo")).toBe("lixo");
    expect(converterDataIsoParaBrasileira(null)).toBe("");
  });
});

describe("normalizarPedidosParaBanco", () => {
  const base = {
    clientes: new Map([[10, "ACME"]]),
    vendedores: new Map([[7, "Ana"]]),
    etapas: new Map([["10", "Armazenado"]]),
    sincronizadoEm: "2026-10-29T12:00:00.000Z",
  };

  it("uma linha por item, com o valor do item pela ordem de preferência", () => {
    const linhas = normalizarPedidosParaBanco({
      ...base,
      pedidos: [
        {
          cabecalho: { codigo_pedido: 5, numero_pedido: "100", codigo_cliente: 10, etapa: "10" },
          infoCadastro: { dInc: "15/10/2026" },
          informacoes_adicionais: { codVend: 7 },
          det: [
            { ide: { codigo_item: 900 }, produto: { quantidade: 2, valor_mercadoria: 30 } },
            { produto: { quantidade: 3, valor_unitario: 4, descricao: " Tampa " } },
          ],
        },
      ],
    });

    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toMatchObject({
      chave_item: "5:900",
      numero_pedido: "100",
      cliente: "ACME",
      vendedor: "Ana",
      data_pedido: "2026-10-15",
      status: "Pedido",
      valor: 30,
      produto: "Produto sem descrição",
    });
    expect(linhas[1]).toMatchObject({
      chave_item: "5:2",
      item_sequencia: 2,
      valor: 12,
      produto: "Tampa",
    });
  });

  it("pedido sem itens vira uma linha 'sem item'; código inválido é ignorado", () => {
    const linhas = normalizarPedidosParaBanco({
      ...base,
      pedidos: [
        { cabecalho: { codigo_pedido: 6 }, total_pedido: { valor_total_pedido: "50.5" } },
        { cabecalho: { codigo_pedido: 0 } },
      ],
    });

    expect(linhas).toEqual([
      expect.objectContaining({
        chave_item: "6:sem-item",
        numero_pedido: "6",
        cliente: "Cliente não identificado",
        vendedor: "-",
        produto: "Sem item informado",
        valor: 50.5,
      }),
    ]);
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
