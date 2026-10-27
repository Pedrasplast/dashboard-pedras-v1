import { describe, expect, it } from "vitest";

import {
  converterData,
  converterDataLocal,
  formatarDataBR,
  formatarDataBROuOriginal,
  formatarDataHora,
  formatarDataHoraBrasilia,
  formatarDataHoraBrasiliaCurta,
  formatarDataISOLocal,
  formatarHora,
  obterHoje,
} from "./datas";

// Os testes valem em qualquer fuso: datas locais são criadas com new Date(ano, mês, dia)
// e as de Brasília partem de instantes UTC fixos.

describe("datas locais", () => {
  it("formatarDataISOLocal usa o calendário local", () => {
    expect(formatarDataISOLocal(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("obterHoje é a meia-noite local", () => {
    const hoje = obterHoje();
    expect(hoje.getHours() + hoje.getMinutes() + hoje.getSeconds()).toBe(0);
  });

  it("converterData aceita DD/MM/AAAA", () => {
    expect(formatarDataISOLocal(converterData("27/10/2026"))).toBe("2026-10-27");
    expect(converterData("")).toBe(null);
    expect(converterData("abc")).toBe(null);
  });

  it("converterDataLocal usa o dia do texto ISO, sem conversão de fuso", () => {
    expect(formatarDataISOLocal(converterDataLocal("2026-10-27T01:15:00Z"))).toBe("2026-10-27");
    expect(converterDataLocal("2026-10-27").getHours()).toBe(0);
  });
});

describe("formatação", () => {
  it("formatarDataBR", () => {
    expect(formatarDataBR("2026-10-27")).toBe("27/10/2026");
    expect(formatarDataBR("")).toBe("-");
    expect(formatarDataBR("27/10/2026")).toBe("27/10/2026");
  });

  it("formatarDataBROuOriginal devolve o próprio valor quando não é AAAA-MM-DD", () => {
    expect(formatarDataBROuOriginal(20261027)).toBe(20261027);
  });

  it("formatarHora e formatarDataHora tratam vazio e inválido", () => {
    expect(formatarHora(null)).toBe("-");
    expect(formatarDataHora("abc")).toBe("-");
    expect(formatarDataHora(new Date(2026, 9, 27, 8, 5))).toBe("27/10/2026, 08:05");
  });

  it("horário de Brasília independe do fuso do navegador", () => {
    expect(formatarDataHoraBrasilia("2026-10-27T13:45:00Z")).toBe("27/10/2026, 10:45:00");
    expect(formatarDataHoraBrasiliaCurta("2026-10-27T13:45:00Z")).toBe("27/10/2026, 10:45");
    expect(formatarDataHoraBrasilia(null)).toBe("-");
  });
});
