import { describe, expect, it } from "vitest";

import {
  dataRecebimentoOmie,
  montarFinanceiroOmie,
  normalizarCompraOmie,
  normalizarRecebimentoOmie,
} from "./origemOmie.js";

/* Pedido 14925 (PP, com IPI) recebido parcialmente: 5.000 de 12.000 kg. */
const PARCIAL = {
  cod_ped_compra: 9236233288,
  codigo_item: 1,
  numero_pedido: "14925",
  data_inclusao: "2026-10-15",
  data_previsao: "2026-10-22",
  codigo_fornecedor: 2429376908,
  fornecedor_nome: "BERLIMPLAST RECICLAGEM E COMERCIO LTDA",
  condicao_pagamento: "S01",
  codigo_produto: "PRD11295",
  descricao: "PP - (PRETO)",
  material_id: 1,
  material_nome: "PP",
  quantidade: 12000,
  quantidade_recebida: 5000,
  situacao_recebimento: "PARCIAL",
  preco_unitario: 6.2,
  valor_mercadoria: 74400,
  valor_ipi: 2418,
  ipi_percentual: 3.25,
  valor_desconto: 0,
  valor_frete: 0,
  valor_outras_despesas: 0,
  valor_total: 76818,
  data_recebimento: "2026-10-20",
  numeros_nf: "1301",
};

/* Pedido 14926 pendente (sem nada recebido). */
const PENDENTE = {
  ...PARCIAL,
  cod_ped_compra: 9236233289,
  numero_pedido: "14926",
  quantidade_recebida: 0,
  situacao_recebimento: "PENDENTE",
  valor_mercadoria: 64800,
  valor_ipi: 0,
  ipi_percentual: null,
  valor_total: 64800,
  data_recebimento: null,
  numeros_nf: null,
};

/* Item fora do Cadastro de Material (descrição do Omie). */
const OUTRO = {
  ...PENDENTE,
  cod_ped_compra: 7,
  numero_pedido: "15000",
  codigo_produto: "BIGBAG01",
  descricao: "BIG BAG",
  material_id: null,
  material_nome: null,
};

describe("compra (pedido inteiro)", () => {
  it("usa inclusão, fornecedor do Omie, material do cadastro e IPI separado", () => {
    const c = normalizarCompraOmie(PARCIAL);
    expect(c.dataCompra).toBe("2026-10-15");
    expect(c.fornecedorId).toBe("2429376908");
    expect(c.fornecedorNome).toBe("BERLIMPLAST RECICLAGEM E COMERCIO LTDA");
    expect(c.materialId).toBe(1);
    expect(c.tipoMaterial).toBe("PP");
    expect(c.quantidadeKg).toBe(12000);
    expect(c.subtotalProdutos).toBe(74400);
    expect(c.valorIpi).toBe(2418);
    expect(c.valorTotal).toBe(76818);
    expect(c.custoEfetivoKg).toBeCloseTo(6.4015, 4);
    expect(c.status).toBe("CONFIRMADA"); // parcial ainda está em aberto
    expect(c.numeroNf).toBe("1301");
  });

  it("recebido por completo vira RECEBIDA", () => {
    const c = normalizarCompraOmie({
      ...PARCIAL,
      quantidade_recebida: 12000,
      situacao_recebimento: "RECEBIDO",
    });
    expect(c.status).toBe("RECEBIDA");
  });

  it("item fora do cadastro usa a descrição do Omie", () => {
    const c = normalizarCompraOmie(OUTRO);
    expect(c.materialId).toBe("omie-BIGBAG01");
    expect(c.tipoMaterial).toBe("BIG BAG");
  });
});

describe("recebimento (só o que chegou)", () => {
  it("parcial: quantidade e valores proporcionais", () => {
    const r = normalizarRecebimentoOmie(PARCIAL);
    expect(r.quantidadeKg).toBe(5000);
    expect(r.valorTotal).toBeCloseTo(76818 * (5000 / 12000), 6);
    expect(r.custoEfetivoKg).toBeCloseTo(6.4015, 4);
    expect(r.status).toBe("RECEBIDA");
    expect(r.dataRecebimento).toBe("2026-10-20");
  });

  it("pendente não gera recebimento", () => {
    expect(normalizarRecebimentoOmie(PENDENTE)).toBeNull();
  });

  it("sem NF de entrada usa a previsão de entrega", () => {
    expect(dataRecebimentoOmie({ ...PARCIAL, data_recebimento: null })).toBe("2026-10-22");
    expect(dataRecebimentoOmie(PENDENTE)).toBeNull();
  });
});

describe("montarFinanceiroOmie", () => {
  it("por data da compra: todas as compras e só os recebimentos com quantidade", () => {
    const r = montarFinanceiroOmie([PARCIAL, PENDENTE, OUTRO], {
      dataInicial: "2026-10-01",
      dataFinal: "2026-10-31",
      tipoData: "compra",
    });
    expect(r.compras).toHaveLength(3);
    expect(r.recebimentos).toHaveLength(1);
  });

  it("por data de recebimento: só recebimentos dentro do período", () => {
    const dentro = montarFinanceiroOmie([PARCIAL, PENDENTE], {
      dataInicial: "2026-10-20",
      dataFinal: "2026-10-20",
      tipoData: "recebimento",
    });
    expect(dentro.compras).toHaveLength(1);
    expect(dentro.recebimentos).toHaveLength(1);

    const fora = montarFinanceiroOmie([PARCIAL], {
      dataInicial: "2026-10-21",
      dataFinal: "2026-10-31",
      tipoData: "recebimento",
    });
    expect(fora.recebimentos).toHaveLength(0);
  });
});

describe("pedido encerrado no Omie", () => {
  it("vira ENCERRADA: conta nos totais, mas não como em aberto", async () => {
    const { statusCompraAberta } = await import("./dashboardMateriaPrimaUtils.js");
    const c = normalizarCompraOmie({ ...PARCIAL, encerrado: true });
    expect(c.status).toBe("ENCERRADA");
    expect(statusCompraAberta(c.status)).toBe(false);
    expect(c.valorTotal).toBe(normalizarCompraOmie(PARCIAL).valorTotal);
  });

  it("recebido por completo continua RECEBIDA mesmo encerrado", () => {
    const c = normalizarCompraOmie({ ...PARCIAL, situacao_recebimento: "RECEBIDO", encerrado: true });
    expect(c.status).toBe("RECEBIDA");
  });

  it("não encerrado e não recebido segue em aberto", () => {
    expect(normalizarCompraOmie({ ...PARCIAL, encerrado: false }).status).toBe("CONFIRMADA");
  });
});
