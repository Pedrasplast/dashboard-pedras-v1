import { describe, expect, it } from "vitest";

import {
  calcularResumoFinanceiroCompra,
  montarDadosCompraFutura,
  normalizarCompra,
  validarCompraParaChegada,
  validarDataChegada,
  validarIdentificacaoCompra,
} from "./comprasFuturas.regras";

describe("calcularResumoFinanceiroCompra", () => {
  it("calcula subtotal, IPI, frete, desconto, total e custo por kg", () => {
    expect(
      calcularResumoFinanceiroCompra({
        quantidadeKg: "1000",
        precoUnitario: "8,50",
        ipiPercentual: "10",
        valorFrete: "200",
        tipoFrete: "cif",
        valorDesconto: "50",
        outrasDespesas: "25",
      }),
    ).toEqual({
      precoUnitario: 8.5,
      subtotalProdutos: 8500,
      ipiPercentual: 10,
      valorIpi: 850,
      valorFrete: 200,
      tipoFrete: "CIF",
      valorDesconto: 50,
      outrasDespesas: 25,
      valorTotal: 9525,
      custoEfetivoKg: 9.525,
    });
  });

  it("sem frete zera o valor do frete; sem preço não calcula total", () => {
    expect(
      calcularResumoFinanceiroCompra({
        quantidadeKg: 10,
        precoUnitario: 2,
        valorFrete: 99,
        tipoFrete: "SEM_FRETE",
      }),
    ).toMatchObject({ valorFrete: 0, valorTotal: 20 });

    expect(calcularResumoFinanceiroCompra({ quantidadeKg: 10 })).toMatchObject({
      valorTotal: null,
      custoEfetivoKg: null,
    });
  });
});

describe("validações ao salvar", () => {
  const identificacao = {
    dataCompra: "2026-01-05",
    dataPrevista: "2026-01-20",
    fornecedorId: 3,
    materialId: "2",
  };

  it("confere datas, fornecedor e material antes de ir ao banco", () => {
    expect(validarIdentificacaoCompra(identificacao)).toEqual({
      dataCompraFinal: "2026-01-05",
      dataPrevistaFinal: "2026-01-20",
      materialIdFinal: 2,
    });

    expect(() =>
      validarIdentificacaoCompra({ ...identificacao, dataPrevista: "2026-01-01" }),
    ).toThrow("A data prevista não pode ser anterior à data da compra.");

    expect(() => validarIdentificacaoCompra({ ...identificacao, fornecedorId: "" })).toThrow(
      "Selecione o fornecedor.",
    );
  });

  const entrada = {
    dataCompraFinal: "2026-01-05",
    dataPrevistaFinal: "2026-01-20",
    materialIdFinal: 2,
    fornecedorId: 3,
    quantidadeKg: "500",
    tipoClassificacao: "tipo sp",
    status: "confirmada",
    precoUnitario: "4",
    dataRecebimento: "2026-01-21",
    numeroPedido: "  ",
    ativo: true,
  };

  it("monta o registro a gravar, normalizando textos e descartando a data de recebimento", () => {
    expect(montarDadosCompraFutura(entrada)).toMatchObject({
      tipo_classificacao: "TIPO SP",
      status: "CONFIRMADA",
      quantidade_kg: 500,
      data_recebimento: null,
      numero_pedido: null,
      valor_total: 2000,
      atualizado_em: expect.any(String),
    });
  });

  it("exige a data de recebimento quando o status é Recebida", () => {
    expect(() =>
      montarDadosCompraFutura({ ...entrada, status: "RECEBIDA", dataRecebimento: "" }),
    ).toThrow("Informe a data real de recebimento.");
  });

  it("recusa valores negativos e total negativo", () => {
    expect(() => montarDadosCompraFutura({ ...entrada, valorFrete: "-1" })).toThrow(
      "O valor de frete não pode ser negativo.",
    );

    expect(() => montarDadosCompraFutura({ ...entrada, valorDesconto: "5000" })).toThrow(
      "O valor total da compra não pode ser negativo. Revise o desconto informado.",
    );
  });
});

describe("confirmar chegada", () => {
  it("não aceita data futura nem compra já recebida", () => {
    expect(() => validarDataChegada(5, "2999-01-01")).toThrow(
      "A data da chegada não pode ser futura.",
    );

    expect(() =>
      validarCompraParaChegada({ status: "recebida", data_compra: "2026-01-01" }, "2026-01-10"),
    ).toThrow("A chegada desta compra já foi confirmada.");
  });

  it("aceita compra prevista com chegada depois da compra", () => {
    expect(validarDataChegada(5, " 2026-01-10 ")).toBe("2026-01-10");

    expect(
      validarCompraParaChegada({ status: "prevista", data_compra: "2026-01-05" }, "2026-01-10"),
    ).toBe("PREVISTA");
  });
});

describe("normalizarCompra", () => {
  it("descarta registros incompletos ou com status desconhecido", () => {
    const registro = {
      id: 1,
      data_compra: "2026-01-05",
      data_prevista: "2026-01-20",
      fornecedor_id: 3,
      material_id: 2,
      quantidade_kg: "500",
      status: "prevista",
      valor_total: "123.4",
    };

    expect(normalizarCompra(registro)).toMatchObject({
      status: "PREVISTA",
      quantidadeKg: 500,
      valorTotal: 123.4,
      ativo: true,
    });

    expect(normalizarCompra({ ...registro, status: "outro" })).toBeNull();
    expect(normalizarCompra(null)).toBeNull();
  });
});
