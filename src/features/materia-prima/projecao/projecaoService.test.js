import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabaseClient", () => ({ supabase: {} }));

const { criarResolvedorMaterial } = await import("./projecaoService");

// Vínculos parecidos com os do cadastro: 1 = PP, 2 = RÁFIA, 3 = PP PICADO
const VINCULOS = [
  { fornecedor_id: 4, material_id: 1, padrao: true, ativo: true }, // BERLIMPLAST: PP (padrão)
  { fornecedor_id: 4, material_id: 2, padrao: false, ativo: true }, // BERLIMPLAST: RÁFIA
  { fornecedor_id: 17, material_id: 2, padrao: true, ativo: true }, // BIG PACK: só RÁFIA
  { fornecedor_id: 9, material_id: 1, padrao: false, ativo: false }, // MATERIAL PICADO: PP inativo
  { fornecedor_id: 9, material_id: 3, padrao: true, ativo: true }, // MATERIAL PICADO: PP PICADO
];

describe("criarResolvedorMaterial", () => {
  const resolver = criarResolvedorMaterial(VINCULOS);

  it("usa o material do produto quando o fornecedor tem vínculo com ele", () => {
    expect(resolver(4, 1)).toBe("1");
  });

  it("aceita vínculo inativo com o material do produto", () => {
    expect(resolver(9, 1)).toBe("1");
  });

  it("usa o material padrão quando o fornecedor não fornece o material do produto", () => {
    expect(resolver(17, 1)).toBe("2");
  });

  it("sem vínculo cadastrado, fica com o material do produto", () => {
    expect(resolver(99, 1)).toBe("1");
  });
});
