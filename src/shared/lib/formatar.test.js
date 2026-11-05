import { describe, expect, it } from "vitest";

import {
  formatarDataHora,
  formatarDataISOParaBR,
  formatarKg,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  obterFormatadorNumero,
} from "./formatar";

// Intl usa espaço não separável entre "R$" e o valor.
const R = (texto) => texto.replace(/ /g, " ");

describe("formatarNumero", () => {
  it("usa casas fixas ou faixa mínimo/máximo", () => {
    expect(formatarNumero(1234.5678)).toBe("1.235");
    expect(formatarNumero(1234.5678, { casas: 2 })).toBe("1.234,57");
    expect(formatarNumero(1234.5, { maximo: 3 })).toBe("1.234,5");
    expect(formatarNumero(1234, { minimo: 1, maximo: 3 })).toBe("1.234,0");
  });

  it("sem regras de vazio, nulo e inválido viram 0", () => {
    expect(formatarNumero(null, { casas: 2 })).toBe("0,00");
    expect(formatarNumero(undefined)).toBe("0");
    expect(formatarNumero("abc", { casas: 1 })).toBe("0,0");
  });

  it("vazios e inválido têm textos próprios", () => {
    const opcoes = { maximo: 3, vazios: [null, undefined, ""], invalido: "-" };
    expect(formatarNumero(null, opcoes)).toBe("-");
    expect(formatarNumero("", opcoes)).toBe("-");
    expect(formatarNumero("abc", opcoes)).toBe("-");
    expect(formatarNumero(0, opcoes)).toBe("0");
    expect(formatarNumero(null, { casas: 2, invalido: "0" })).toBe("0,00");
    expect(formatarNumero(undefined, { casas: 2, invalido: "0" })).toBe("0");
    expect(formatarNumero(null, { vazios: [null], vazio: "—" })).toBe("—");
  });

  it("lê o valor como Number, flexível ou decimal", () => {
    expect(formatarNumero("1.234,56", { casas: 2 })).toBe("0,00");
    expect(formatarNumero("1.234,56", { casas: 2, ler: "flexivel" })).toBe("1.234,56");
    expect(formatarNumero("1,5", { casas: 1, ler: "decimal" })).toBe("1,5");
    expect(formatarNumero("1.234,56", { maximo: 3, ler: "decimal" })).toBe("1,234");
  });

  it("reaproveita o mesmo Intl.NumberFormat", () => {
    expect(obterFormatadorNumero({ maximumFractionDigits: 2 })).toBe(
      obterFormatadorNumero({ maximumFractionDigits: 2 }),
    );
  });
});

describe("formatarPercentual / formatarKg / formatarMoeda", () => {
  it("acrescentam o sufixo só quando há número", () => {
    expect(formatarPercentual(12.345, { casas: 1 })).toBe("12,3%");
    expect(formatarPercentual(null, { casas: 2, vazios: [null, undefined], invalido: "-" })).toBe(
      "-",
    );
    expect(formatarPercentual("x", { casas: 1, invalido: "0,0%" })).toBe("0,0%");
    expect(formatarKg(1234.5, { casas: 3 })).toBe("1.234,500 kg");
    expect(formatarKg(null, { vazios: [null, undefined] })).toBe("-");
  });

  it("moeda usa 2 casas por padrão", () => {
    expect(formatarMoeda(1234.5)).toBe(R("R$ 1.234,50"));
    expect(formatarMoeda(12.3456, { casas: 3 })).toBe(R("R$ 12,346"));
    expect(formatarMoeda(null)).toBe(R("R$ 0,00"));
    expect(formatarMoeda("", { vazios: [null, undefined, ""], vazio: "—" })).toBe("—");
    expect(formatarMoeda("1.234,5", { ler: "flexivel" })).toBe(R("R$ 1.234,50"));
  });
});

describe("datas", () => {
  it("formatarDataISOParaBR converte AAAA-MM-DD", () => {
    expect(formatarDataISOParaBR("2026-09-28")).toBe("28/09/2026");
    expect(formatarDataISOParaBR("")).toBe("-");
    expect(formatarDataISOParaBR(null)).toBe("-");
    expect(formatarDataISOParaBR("2026-09")).toBe("2026-09");
  });

  it("formatarDataHora com fuso fixo", () => {
    const valor = "2026-11-03T17:07:09Z";
    const sp = { fuso: "America/Sao_Paulo" };
    expect(formatarDataHora(valor, sp)).toBe("03/11/2026, 14:07");
    expect(formatarDataHora(valor, { ...sp, segundos: true })).toBe("03/11/2026, 14:07:09");
    expect(formatarDataHora(valor, { ...sp, ano: false })).toBe("03/11, 14:07");
    expect(formatarDataHora(valor, { ...sp, hour12: false })).toBe("03/11/2026, 14:07");
  });

  it("formatarDataHora: vazio e data inválida usam o texto de vazio", () => {
    expect(formatarDataHora(null)).toBe("-");
    expect(formatarDataHora("abc", { vazio: "—" })).toBe("—");
    expect(formatarDataHora("", { vazio: "Aguardando sincronização" })).toBe(
      "Aguardando sincronização",
    );
  });
});
