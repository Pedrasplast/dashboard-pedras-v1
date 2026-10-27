import { describe, expect, it } from "vitest";

import {
  normalizarCodigo,
  normalizarTexto,
  normalizarTextoCompacto,
  normalizarTextoSemAparar,
  ordenarTexto,
  paraTexto,
} from "./texto";

describe("texto", () => {
  it("paraTexto apara e trata null/undefined", () => {
    expect(paraTexto("  abc  ")).toBe("abc");
    expect(paraTexto(null)).toBe("");
    expect(paraTexto(12)).toBe("12");
  });

  it("normalizarTexto: apara, minúsculo e sem acentos", () => {
    expect(normalizarTexto("  Ação Café  ")).toBe("acao cafe");
    expect(normalizarTexto("São   Paulo")).toBe("sao   paulo");
    expect(normalizarTexto(undefined)).toBe("");
  });

  it("normalizarTextoCompacto também reduz espaços repetidos", () => {
    expect(normalizarTextoCompacto("São   Paulo\tSP")).toBe("sao paulo sp");
  });

  it("normalizarTextoSemAparar preserva os espaços das pontas", () => {
    expect(normalizarTextoSemAparar("  Ação ")).toBe("  acao ");
  });

  it("normalizarCodigo apara e põe em maiúsculas", () => {
    expect(normalizarCodigo(" pp-12a ")).toBe("PP-12A");
  });

  it("ordenarTexto ordena em pt-BR", () => {
    expect(["Óleo", "abacate", "Banana"].sort(ordenarTexto)).toEqual(["abacate", "Banana", "Óleo"]);
  });
});
