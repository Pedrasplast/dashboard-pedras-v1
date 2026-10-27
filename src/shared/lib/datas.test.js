import { describe, expect, it } from "vitest";

import {
  converterData,
  converterDataLocal,
  formatarDataBR,
  formatarDataBROuOriginal,
  formatarDataHora,
  formatarDataHoraComSegundos,
  formatarDataHoraFrase,
  formatarDataISOLocal,
  formatarHora,
  obterHoje,
} from "./datas";

// Os testes valem em qualquer fuso: as datas são criadas com new Date(ano, mês, dia, ...),
// que já estão no fuso local.

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
    expect(formatarDataHora(new Date(2026, 9, 27, 8, 5))).toBe("27/10/2026 08:05");
  });

  it("variações do padrão: frase e com segundos", () => {
    const data = new Date(2026, 9, 27, 8, 5, 9);
    expect(formatarDataHoraFrase(data)).toBe("27/10/2026 às 08:05");
    expect(formatarDataHoraComSegundos(data)).toBe("27/10/2026 08:05:09");
    expect(formatarDataHoraComSegundos(null)).toBe("-");
    expect(formatarDataHoraFrase("abc")).toBe("-");
  });

  it("meia-noite aparece como 00:00, não 24:00", () => {
    expect(formatarDataHora(new Date(2026, 9, 27, 0, 0))).toBe("27/10/2026 00:00");
  });
});
