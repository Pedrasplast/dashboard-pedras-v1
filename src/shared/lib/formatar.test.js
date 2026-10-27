import { describe, expect, it } from "vitest";

import {
  formatarNumeroCasasFixas,
  formatarNumeroFlexivel,
  formatarNumeroPtBR,
  formatarReaisPtBR,
  obterFormatadorNumero,
} from "./formatar";

describe("formatarNumeroPtBR", () => {
  it("dá o mesmo resultado de toLocaleString('pt-BR')", () => {
    const casos = [
      [1234.5678, { maximumFractionDigits: 2 }],
      [0.5, { minimumFractionDigits: 1, maximumFractionDigits: 1 }],
      [-1234.5, undefined],
      [NaN, { maximumFractionDigits: 0 }],
      [1e21, undefined],
      [12, { style: "currency", currency: "BRL" }],
    ];

    for (const [numero, opcoes] of casos) {
      expect(formatarNumeroPtBR(numero, opcoes)).toBe(numero.toLocaleString("pt-BR", opcoes));
    }
  });

  it("reaproveita o formatador para as mesmas opções", () => {
    const a = obterFormatadorNumero({ maximumFractionDigits: 2, minimumFractionDigits: 0 });
    const b = obterFormatadorNumero({ minimumFractionDigits: 0, maximumFractionDigits: 2 });

    expect(a === b).toBe(true);
  });

  it("opções inválidas lançam o mesmo erro de toLocaleString", () => {
    let erroIntl = "";
    let erroNativo = "";

    try {
      formatarNumeroPtBR(1, { maximumFractionDigits: 200 });
    } catch (erro) {
      erroIntl = erro.message;
    }

    try {
      (1).toLocaleString("pt-BR", { maximumFractionDigits: 200 });
    } catch (erro) {
      erroNativo = erro.message;
    }

    expect(erroIntl).toBe(erroNativo);
  });
});

describe("formatadores prontos", () => {
  it("formatarReaisPtBR", () => {
    expect(formatarReaisPtBR(1234.5)).toBe("R$ 1.234,50");
  });

  it("formatarNumeroCasasFixas: inválido vira 0", () => {
    expect(formatarNumeroCasasFixas(1234.5, 1)).toBe("1.234,5");
    expect(formatarNumeroCasasFixas("abc", 2)).toBe("0,00");
  });

  it("formatarNumeroFlexivel aceita texto brasileiro", () => {
    expect(formatarNumeroFlexivel("1.234,567")).toBe("1.234,57");
  });
});
