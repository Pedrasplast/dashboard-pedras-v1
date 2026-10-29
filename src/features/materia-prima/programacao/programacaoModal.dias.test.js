import { describe, expect, it } from "vitest";

import {
  alternarDataMarcada,
  aplicarJornadaNosDias,
  aplicarReceitaNosDias,
  converterHorasOutro,
  descreverDiaCalendario,
  normalizarDiasItem,
  removerDiasMarcados,
  validarJornadaNasDatas,
} from "./programacaoModal.dias";

const FUTURO = "2999-01-10";
const FUTURO_2 = "2999-01-11";
const PASSADO = "2000-01-10";

describe("marcação e campo Outro", () => {
  it("marca em ordem e desmarca", () => {
    expect(alternarDataMarcada([FUTURO_2], FUTURO)).toEqual([FUTURO, FUTURO_2]);
    expect(alternarDataMarcada([FUTURO, FUTURO_2], FUTURO)).toEqual([FUTURO_2]);
  });

  it("converte horas em minutos só entre 0 e 24", () => {
    expect(converterHorasOutro("2.5")).toBe(150);
    expect(converterHorasOutro("0")).toBe(null);
    expect(converterHorasOutro("24.5")).toBe(null);
    expect(converterHorasOutro("abc")).toBe(null);
  });
});

describe("jornada", () => {
  const calendarioPorData = new Map([
    [FUTURO, { minutosProgramados: 1020, perfilCodigo: "17H" }],
    [FUTURO_2, { minutosProgramados: 0 }],
  ]);

  it("recusa jornada maior que o dia ou em dia sem produção", () => {
    expect(validarJornadaNasDatas([FUTURO], calendarioPorData, 1440)).toMatch(
      /não possui disponibilidade suficiente/,
    );
    expect(validarJornadaNasDatas([FUTURO_2], calendarioPorData, 300)).toMatch(
      /está marcado como Sem Produção/,
    );
    expect(validarJornadaNasDatas([FUTURO], calendarioPorData, 0)).toBe(
      "Informe uma quantidade de horas válida entre 0 e 24.",
    );
    expect(validarJornadaNasDatas([FUTURO], calendarioPorData, 300)).toBe("");
  });

  it("aplica a jornada guardando o limite do dia e mantém a receita", () => {
    const dias = [{ data: FUTURO, receitaId: 1, receitaNome: "A", minutosSolicitados: 60 }];

    expect(
      aplicarJornadaNosDias(dias, [FUTURO], calendarioPorData, {
        perfilHoras: "5H",
        minutosSolicitados: 300,
      }),
    ).toEqual([
      {
        data: FUTURO,
        receitaId: 1,
        receitaNome: "A",
        perfilHoras: "5H",
        minutosSolicitados: 300,
        limiteMinutos: 1020,
        limitePerfilCodigo: "17H",
      },
    ]);
  });
});

describe("receita e remoção", () => {
  it("aplica a receita só em dias que não passaram, criando o dia se preciso", () => {
    const resultado = aplicarReceitaNosDias([], [PASSADO, FUTURO], new Map(), {
      id: 2,
      nome: "B",
    });

    expect(resultado).toEqual([
      {
        data: FUTURO,
        perfilHoras: "",
        minutosSolicitados: 0,
        minutosDescontados: 0,
        limiteMinutos: 1440,
        limitePerfilCodigo: "24H",
        receitaId: 2,
        receitaNome: "B",
      },
    ]);
  });

  it("remove os marcados, mas preserva dias que já passaram", () => {
    const dias = [{ data: PASSADO }, { data: FUTURO }, { data: FUTURO_2 }];

    expect(removerDiasMarcados(dias, [PASSADO, FUTURO])).toEqual([
      { data: PASSADO },
      { data: FUTURO_2 },
    ]);
  });
});

describe("normalizarDiasItem", () => {
  it("converte os dias salvos para o formato do modal", () => {
    expect(
      normalizarDiasItem({ diasProgramacao: [{ data: FUTURO, minutosSolicitados: "300" }] }),
    ).toEqual([
      {
        data: FUTURO,
        perfilHoras: undefined,
        minutosSolicitados: 300,
        minutosDescontados: 0,
        receitaId: null,
        receitaNome: "",
        limiteMinutos: 1440,
        limitePerfilCodigo: "24H",
      },
    ]);
  });
});

describe("descreverDiaCalendario", () => {
  const base = {
    data: new Date(2999, 0, 10),
    dataISO: FUTURO,
    hojeISO: "2999-01-01",
    mesReferencia: new Date(2999, 0, 1),
  };

  it("dia fechado com texto de feriado vira feriado", () => {
    expect(
      descreverDiaCalendario({
        ...base,
        configuracao: { minutosProgramados: 0, origem: "FERIADO", observacao: "Natal" },
      }),
    ).toMatchObject({ fechado: true, feriado: true, passado: false, foraMes: false });
  });

  it("24H não aparece no card; outros perfis aparecem", () => {
    expect(
      descreverDiaCalendario({ ...base, configuracao: { minutosProgramados: 1440 } })
        .disponibilidadeCard,
    ).toBe("");
    expect(
      descreverDiaCalendario({
        ...base,
        configuracao: { minutosProgramados: 1020, perfilCodigo: "17H" },
      }).disponibilidadeCard,
    ).toBe("17H");
  });
});
