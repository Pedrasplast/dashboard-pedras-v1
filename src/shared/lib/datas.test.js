import { afterEach, describe, expect, it, vi } from "vitest";

import { dataHojeLocal, diaSemanaCurto, formatarDataISO, obterAnoAtual, obterHoje } from "./datas";

afterEach(() => {
  vi.useRealTimers();
});

describe("formatarDataISO", () => {
  it("usa o fuso do computador e completa com zeros", () => {
    expect(formatarDataISO(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(formatarDataISO(new Date(2026, 10, 30))).toBe("2026-11-30");
  });

  it("retorna vazio para data inválida ou não-Date", () => {
    expect(formatarDataISO(new Date("x"))).toBe("");
    expect(formatarDataISO("2026-01-05")).toBe("");
    expect(formatarDataISO(null)).toBe("");
  });
});

describe("datas de hoje", () => {
  it("obterHoje é hoje à meia-noite; dataHojeLocal e obterAnoAtual batem com ele", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 9, 15, 30, 12));

    const hoje = obterHoje();
    expect(hoje.getFullYear()).toBe(2026);
    expect(hoje.getMonth()).toBe(2);
    expect(hoje.getDate()).toBe(9);
    expect([hoje.getHours(), hoje.getMinutes(), hoje.getSeconds()]).toEqual([0, 0, 0]);
    expect(dataHojeLocal()).toBe("2026-03-09");
    expect(obterAnoAtual()).toBe(2026);
  });
});

describe("diaSemanaCurto", () => {
  it("devolve o dia da semana abreviado", () => {
    expect(diaSemanaCurto("2026-11-06")).toBe("sex");
    expect(diaSemanaCurto("2026-11-07")).toBe("sáb");
    expect(diaSemanaCurto("2026-11-08")).toBe("dom");
    expect(diaSemanaCurto("2026-11-09")).toBe("seg");
    expect(diaSemanaCurto("2026-11-10")).toBe("ter");
    expect(diaSemanaCurto("2026-11-11")).toBe("qua");
    expect(diaSemanaCurto("2026-11-12")).toBe("qui");
  });

  it("aceita data com hora e ignora fuso", () => {
    expect(diaSemanaCurto("2026-11-06T23:30:00-03:00")).toBe("sex");
  });

  it("vazio ou inválido = vazio", () => {
    expect(diaSemanaCurto("")).toBe("");
    expect(diaSemanaCurto(null)).toBe("");
    expect(diaSemanaCurto("2026-02-30")).toBe("");
    expect(diaSemanaCurto("06/11/2026")).toBe("");
  });
});
