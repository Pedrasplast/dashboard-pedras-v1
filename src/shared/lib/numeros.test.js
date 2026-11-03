import { describe, expect, it } from "vitest";

import { converterNumeroFlexivel, numeroOuNull } from "./numeros";

describe("numeroOuNull", () => {
  it("retorna null para vazio e inválido", () => {
    for (const valor of [null, undefined, "", "abc", "1,5", Number.NaN, Infinity]) {
      expect(numeroOuNull(valor)).toBeNull();
    }
  });

  it("converte números e textos numéricos com ponto", () => {
    expect(numeroOuNull(0)).toBe(0);
    expect(numeroOuNull("12.5")).toBe(12.5);
    expect(numeroOuNull(" 7 ")).toBe(7);
    expect(numeroOuNull(-3)).toBe(-3);
  });
});

describe("converterNumeroFlexivel", () => {
  it("entende vírgula decimal e milhar com ponto", () => {
    expect(converterNumeroFlexivel("1.234,56")).toBe(1234.56);
    expect(converterNumeroFlexivel("1,5")).toBe(1.5);
    expect(converterNumeroFlexivel("12.5")).toBe(12.5);
  });

  it("retorna 0 para vazio e inválido", () => {
    for (const valor of [null, undefined, "", "abc", Number.NaN]) {
      expect(converterNumeroFlexivel(valor)).toBe(0);
    }
  });
});
