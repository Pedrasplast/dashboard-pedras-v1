import { describe, expect, it } from "vitest";

import {
  calcularMinutosPassadosEmPeriodos,
  calcularProducaoProgramacao,
  criarDiasGrade,
  existeConflito,
  formatarMinutos,
  perfilBasePorLimite,
  resumirNomeFeriado,
  validarProgramacao,
} from "./programacaoModal.utils";

describe("grade e formatação", () => {
  it("monta semanas completas de segunda a domingo", () => {
    // Outubro/2026 começa numa quinta e termina num sábado.
    const dias = criarDiasGrade(new Date(2026, 9, 15));

    expect(dias).toHaveLength(35);
    expect(dias[0].getDay()).toBe(1);
    expect(dias[0].getDate()).toBe(28);
    expect(dias.at(-1).getDay()).toBe(0);
    expect(dias.at(-1).getDate()).toBe(1);
  });

  it("formata minutos como horas", () => {
    expect(formatarMinutos(300)).toBe("5h");
    expect(formatarMinutos(95)).toBe("1h35");
    expect(formatarMinutos(-10)).toBe("0h");
  });

  it("escolhe o perfil de turno pelo limite do dia", () => {
    expect(perfilBasePorLimite(1440)).toBe("24H");
    expect(perfilBasePorLimite(1100)).toBe("17H");
    expect(perfilBasePorLimite(299)).toBeNull();
  });

  it("resume o nome dos feriados para caber na grade", () => {
    expect(resumirNomeFeriado("Confraternização Universal")).toBe("ANO NOVO");
    expect(resumirNomeFeriado("Feriado municipal - Aniversário da cidade")).toBe(
      "ANIVERSÁRIO DA CIDADE",
    );
    expect(resumirNomeFeriado("")).toBe("");
  });
});

describe("calcularMinutosPassadosEmPeriodos", () => {
  const periodo = { horaInicio: "07:00", horaFim: "12:00", duracaoMinutos: 300 };

  it("conta só o que já passou dentro do período", () => {
    expect(calcularMinutosPassadosEmPeriodos([periodo], 6 * 60)).toBe(0);
    expect(calcularMinutosPassadosEmPeriodos([periodo], 9 * 60)).toBe(120);
    expect(calcularMinutosPassadosEmPeriodos([periodo], 13 * 60)).toBe(300);
  });

  it("trata período que cruza a meia-noite e desconta o intervalo ao terminar", () => {
    const noturno = {
      horaInicio: "22:00",
      horaFim: "06:00",
      duracaoMinutos: 420,
      descontoIntervaloMinutos: 60,
    };

    expect(calcularMinutosPassadosEmPeriodos([noturno], 2 * 60)).toBe(240);
    expect(calcularMinutosPassadosEmPeriodos([noturno], 23 * 60)).toBe(60);
    expect(calcularMinutosPassadosEmPeriodos([noturno], 21 * 60)).toBe(0);
  });
});

describe("calcularProducaoProgramacao", () => {
  const produto = { cicloSegundos: 30, cavidadeMolde: 4, pesoKg: 0.25 };

  it("conta só ciclos completos e calcula o consumo", () => {
    const resultado = calcularProducaoProgramacao(
      [{ minutosEfetivos: 60 }, { minutosEfetivos: 0.25 }],
      produto,
    );

    // 3615 s / 30 s = 120 ciclos completos x 4 cavidades.
    expect(resultado).toEqual({
      minutosEfetivos: 60.25,
      pecasPrevistas: 480,
      pecasPorHora: 480,
      consumoPeriodoKg: 120,
      consumoPorHoraKg: 120,
    });
  });

  it("não calcula com cavidade fracionada ou sem produto", () => {
    const dias = [{ minutosEfetivos: 60 }];

    expect(
      calcularProducaoProgramacao(dias, { ...produto, cavidadeMolde: 2.5 }).pecasPrevistas,
    ).toBe(0);
    expect(calcularProducaoProgramacao(dias, null).pecasPrevistas).toBe(0);
  });
});

describe("conflitos e validação", () => {
  const programacao = [
    {
      id: 1,
      injetora: "01",
      tipoProgramacao: "CALENDARIO",
      diasProgramacao: [{ data: "2099-01-10" }],
    },
    { id: 2, injetora: "02", dataInicio: "2099-01-01", dataFim: "2099-01-31" },
    { id: 3, injetora: "01", ativo: false, dataInicio: "2099-01-01", dataFim: "2099-12-31" },
  ];

  it("encontra conflito no calendário e em período, ignorando inativos e a própria programação", () => {
    const dias = [{ data: "2099-01-10" }];

    expect(existeConflito({ programacao, injetora: "01", dias })?.id).toBe(1);
    expect(existeConflito({ programacao, injetora: "01", dias, ignorarId: 1 })).toBeNull();
    expect(existeConflito({ programacao, injetora: "02", dias })?.id).toBe(2);
  });

  const diaValido = {
    data: "2099-02-10",
    perfilHoras: "5H",
    minutosSolicitados: 300,
    limiteMinutos: 1440,
    minutosEfetivos: 300,
    receitaId: 7,
  };

  const entradaValida = {
    item: null,
    itemLegado: false,
    injetora: "01",
    codigoProduto: "P1",
    produtoSelecionado: { codigo: "P1" },
    diasCalculados: [diaValido],
    programacao,
    calculo: { pecasPrevistas: 100 },
  };

  it("aceita uma programação completa", () => {
    expect(validarProgramacao(entradaValida)).toBeNull();
  });

  it("aponta o primeiro problema encontrado", () => {
    expect(validarProgramacao({ ...entradaValida, injetora: "" })).toBe("Selecione a injetora.");

    expect(
      validarProgramacao({
        ...entradaValida,
        diasCalculados: [{ ...diaValido, receitaId: "" }],
      }),
    ).toBe("Selecione a receita de 10/02/2099.");

    expect(
      validarProgramacao({
        ...entradaValida,
        diasCalculados: [{ ...diaValido, data: "2099-01-10" }],
      }),
    ).toBe("A Injetora 01 já possui programação em um dos dias selecionados.");

    expect(validarProgramacao({ ...entradaValida, calculo: { pecasPrevistas: 0 } })).toBe(
      "As horas selecionadas não são suficientes para completar um ciclo.",
    );
  });
});
