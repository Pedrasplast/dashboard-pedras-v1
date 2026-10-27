import { describe, expect, it } from "vitest";

import {
  converterNumeroBrOuNull,
  converterNumeroDecimal,
  converterNumeroFlexivel,
  converterNumeroFlexivelOuNull,
  ehNumeroInvalido,
  numeroParaCampo,
  paraNumero,
  paraNumeroOu,
  paraNumeroOuNull,
} from "./numeros";

describe("paraNumero", () => {
  it.each([
    [12.5, 12.5],
    ["7", 7],
    [null, 0],
    [undefined, 0],
    ["", 0],
    ["abc", 0],
    [Infinity, 0],
    ["12,5", 0], // vírgula não é aceita aqui
  ])("%j -> %j", (entrada, esperado) => {
    expect(paraNumero(entrada)).toBe(esperado);
  });
});

describe("paraNumeroOu", () => {
  it("usa o padrão só quando o valor não vira número finito", () => {
    expect(paraNumeroOu("abc", 5)).toBe(5);
    expect(paraNumeroOu(null, 5)).toBe(0); // Number(null) === 0
    expect(paraNumeroOu(undefined)).toBe(0);
    expect(paraNumeroOu("3", 5)).toBe(3);
  });
});

describe("paraNumeroOuNull", () => {
  it.each([
    [null, null],
    [undefined, null],
    ["", null],
    [" ", 0], // espaço não é vazio: Number(" ") === 0
    ["abc", null],
    ["2.5", 2.5],
    [0, 0],
  ])("%j -> %j", (entrada, esperado) => {
    expect(paraNumeroOuNull(entrada)).toBe(esperado);
  });
});

describe("ehNumeroInvalido", () => {
  it("null, undefined e textos não numéricos são inválidos; vazio vale 0", () => {
    expect(ehNumeroInvalido(null)).toBe(true);
    expect(ehNumeroInvalido(undefined)).toBe(true);
    expect(ehNumeroInvalido("abc")).toBe(true);
    expect(ehNumeroInvalido("")).toBe(false);
    expect(ehNumeroInvalido(10)).toBe(false);
  });
});

describe("converterNumeroFlexivel", () => {
  it.each([
    ["1.234,56", 1234.56],
    ["1,234.56", 1.23456], // com vírgula e ponto, o ponto é tratado como milhar
    ["1234,56", 1234.56],
    ["1234.56", 1234.56],
    ["1 234", 1234],
    ["", 0],
    [null, 0],
    ["abc", 0],
  ])("%j -> %j", (entrada, esperado) => {
    expect(converterNumeroFlexivel(entrada)).toBe(esperado);
  });

  it("a versão OuNull devolve null para vazio e inválido", () => {
    expect(converterNumeroFlexivelOuNull("  ")).toBe(null);
    expect(converterNumeroFlexivelOuNull("abc")).toBe(null);
    expect(converterNumeroFlexivelOuNull("1.234,5")).toBe(1234.5);
  });
});

describe("converterNumeroBrOuNull", () => {
  it("com vírgula, pontos são milhar; sem vírgula, lê como está", () => {
    expect(converterNumeroBrOuNull("1.234,5")).toBe(1234.5);
    expect(converterNumeroBrOuNull("1.234")).toBe(1.234);
    expect(converterNumeroBrOuNull("")).toBe(null);
    expect(converterNumeroBrOuNull(NaN)).toBe(null);
  });
});

describe("converterNumeroDecimal", () => {
  it("usa parseFloat: aproveita o início numérico do texto", () => {
    expect(converterNumeroDecimal("12abc")).toBe(12);
    expect(converterNumeroDecimal("7,5")).toBe(7.5);
    expect(converterNumeroDecimal("abc")).toBe(0);
  });
});

describe("numeroParaCampo", () => {
  it("troca o primeiro ponto por vírgula e mantém vazio", () => {
    expect(numeroParaCampo(12.5)).toBe("12,5");
    expect(numeroParaCampo(null)).toBe("");
    expect(numeroParaCampo(0)).toBe("0");
  });
});
