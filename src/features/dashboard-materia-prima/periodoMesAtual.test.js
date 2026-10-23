import { describe, expect, it } from "vitest";

import { periodoMesAtual } from "./dashboardMateriaPrimaUtils.js";

describe("periodoMesAtual", () => {
  it("do 1º ao último dia do mês", () => {
    expect(periodoMesAtual(new Date(2026, 9, 23))).toEqual({ dataInicial: "2026-10-01", dataFinal: "2026-10-31" });
    expect(periodoMesAtual(new Date(2026, 10, 1))).toEqual({ dataInicial: "2026-11-01", dataFinal: "2026-11-30" });
  });

  it("fevereiro e virada de ano", () => {
    expect(periodoMesAtual(new Date(2028, 1, 10))).toEqual({ dataInicial: "2028-02-01", dataFinal: "2028-02-29" });
    expect(periodoMesAtual(new Date(2026, 11, 31))).toEqual({ dataInicial: "2026-12-01", dataFinal: "2026-12-31" });
  });
});
