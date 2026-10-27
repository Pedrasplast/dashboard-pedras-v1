import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabaseClient", () => ({ supabase: {} }));

const { normalizarItemOmie } = await import("./entradasComprasMateriaPrimaService.js");

const base = {
  cod_ped_compra: 1,
  codigo_item: 2,
  numero_pedido: "14926",
  data_inclusao: "2026-10-16",
  data_previsao: "2026-10-30",
  codigo_fornecedor: 99,
  fornecedor_nome: "BERLIMPLAST",
  codigo_produto: "PRD11295",
  descricao: "PP - (PRETO)",
  material_id: 1,
  material_nome: "PP",
  quantidade: 12000,
  quantidade_recebida: 0,
  preco_unitario: 5.4,
  ipi_percentual: null,
  valor_total: 64800,
  data_recebimento: null,
  numeros_nf: null,
  encerrado: false,
};

describe("normalizarItemOmie", () => {
  it("pendente vira uma linha futura com o total do item", () => {
    const [l, ...resto] = normalizarItemOmie(base);
    expect(resto).toEqual([]);
    expect(l).toMatchObject({
      situacao: "FUTURA",
      quantidadeKg: 12000,
      total: 64800,
      material: "PP",
      recebido: "",
    });
  });

  it("recebido inteiro usa a data e o nº da NF", () => {
    const linhas = normalizarItemOmie({
      ...base,
      quantidade_recebida: 12000,
      data_recebimento: "2026-10-20",
      numeros_nf: "123",
    });
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({
      situacao: "RECEBIDA",
      recebido: "2026-10-20",
      numeroNf: "123",
      total: 64800,
    });
  });

  it("parcial divide em recebida e futura, com valores proporcionais", () => {
    const [r, f] = normalizarItemOmie({
      ...base,
      quantidade_recebida: 3000,
      data_recebimento: "2026-10-20",
    });
    expect(r).toMatchObject({ situacao: "RECEBIDA", quantidadeKg: 3000, total: 16200 });
    expect(f).toMatchObject({ situacao: "FUTURA", quantidadeKg: 9000, total: 48600 });
  });

  it("saldo de pedido encerrado vira ENCERRADA, não futura", () => {
    const [e] = normalizarItemOmie({ ...base, encerrado: true });
    expect(e).toMatchObject({
      situacao: "ENCERRADA",
      quantidadeKg: 12000,
      total: 64800,
      recebido: "",
    });
    const linhas = normalizarItemOmie({ ...base, encerrado: true, quantidade_recebida: 3000 });
    expect(linhas.map((l) => l.situacao)).toEqual(["RECEBIDA", "ENCERRADA"]);
  });

  it("recebido sem NF usa a previsão; sem material usa a descrição", () => {
    const [l] = normalizarItemOmie({
      ...base,
      quantidade_recebida: 12000,
      material_id: null,
      material_nome: null,
    });
    expect(l.recebido).toBe("2026-10-30");
    expect(l.material).toBe("PP - (PRETO)");
    expect(l.materialId).toBe("omie-PRD11295");
  });
});
