import { describe, expect, it } from "vitest";

import { normalizarCodigo, normalizarTexto } from "./texto";

describe("normalizarTexto", () => {
  it("remove acentos, espaços nas pontas e deixa minúsculo", () => {
    expect(normalizarTexto("  Ação Única ")).toBe("acao unica");
    expect(normalizarTexto("PEÇA  Nº 1")).toBe("peca  nº 1");
  });

  it("trata nulo e não-texto", () => {
    expect(normalizarTexto(null)).toBe("");
    expect(normalizarTexto(undefined)).toBe("");
    expect(normalizarTexto(123)).toBe("123");
  });

  it("compacta espaços internos só quando pedido", () => {
    expect(normalizarTexto("a   b\t c")).toBe("a   b\t c");
    expect(normalizarTexto(" a   b\t c ", { compactarEspacos: true })).toBe("a b c");
  });
});

describe("normalizarCodigo", () => {
  it("tira espaços nas pontas e deixa maiúsculo", () => {
    expect(normalizarCodigo("  mp-001a ")).toBe("MP-001A");
    expect(normalizarCodigo(null)).toBe("");
    expect(normalizarCodigo(42)).toBe("42");
  });
});
