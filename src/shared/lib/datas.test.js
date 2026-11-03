import { afterEach, describe, expect, it, vi } from "vitest";

import { dataHojeLocal, formatarDataISO, obterAnoAtual, obterHoje } from "./datas";

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
