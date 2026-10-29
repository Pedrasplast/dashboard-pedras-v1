import { describe, expect, it } from "vitest";

import {
  agruparRecebimentosPorPedido,
  calcularResumoDocumentos,
  calcularResumoRecebimentosFisicos,
  obterCodigoProduto,
  obterDocumentoId,
  obterValorPrincipal,
} from "./pedidosCompraCardModal.utils";

describe("obterValorPrincipal", () => {
  it("lê o indicador de cada card e formata os valores em reais", () => {
    expect(obterValorPrincipal("abertos", { abertos: 4 })).toBe("4");
    expect(obterValorPrincipal("recebimentos-fisicos-7-dias", { pedidos: 2 })).toBe("2");
    expect(obterValorPrincipal("valor-aberto", { valorEmAberto: 1234.5 })).toMatch(/1\.234,50/);
    expect(obterValorPrincipal("hoje", undefined)).toBe("0");
    expect(obterValorPrincipal("desconhecido", { abertos: 4 })).toBe("0");
  });
});

describe("identificação", () => {
  it("código do produto e id do documento usam o primeiro valor preenchido", () => {
    expect(obterCodigoProduto({ codigo_comercial: " ", codigo_produto: 9 })).toBe("9");
    expect(obterCodigoProduto({})).toBe("-");

    expect(obterDocumentoId({ cod_req_compra: 7, numero_pedido: "P1" })).toBe("7");
    expect(obterDocumentoId({})).toBe("");
  });
});

describe("resumos", () => {
  it("soma valores e itens dos documentos", () => {
    expect(
      calcularResumoDocumentos([
        { valorTotal: 10, valorEmAberto: 4, itens: [{}, {}] },
        { valorTotal: "5", quantidade_itens: 3 },
      ]),
    ).toEqual({ valorTotal: 15, valorEmAberto: 4, itens: 5 });
  });

  it("conta pedidos e itens distintos dos recebimentos físicos", () => {
    expect(
      calcularResumoRecebimentosFisicos([
        { cod_ped_compra: 1, codigo_item: 1 },
        { cod_ped_compra: 1, codigo_item: 1 },
        { cod_ped_compra: 1, codigo_item: 2 },
        { cod_ped_compra: null, codigo_item: 3 },
      ]),
    ).toEqual({ pedidos: 1, lancamentos: 4, itens: 3 });
  });

  it("agrupa recebimentos por pedido na ordem de aparição", () => {
    const a = { cod_ped_compra: 2 };
    const b = { numero_pedido: "P9" };
    const c = { cod_ped_compra: 2 };

    expect(agruparRecebimentosPorPedido([a, b, c])).toEqual([
      ["2", [a, c]],
      ["P9", [b]],
    ]);
  });
});
