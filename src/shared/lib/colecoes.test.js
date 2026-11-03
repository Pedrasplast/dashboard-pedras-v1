import { describe, expect, it } from "vitest";

import { alternarNoConjunto } from "./colecoes";

describe("alternarNoConjunto", () => {
  it("adiciona o que não está e remove o que está, sem alterar o original", () => {
    const original = new Set([1, 2]);

    expect([...alternarNoConjunto(original, 3)]).toEqual([1, 2, 3]);
    expect([...alternarNoConjunto(original, 1)]).toEqual([2]);
    expect([...original]).toEqual([1, 2]);
    expect(alternarNoConjunto(original, 3)).not.toBe(original);
  });
});
