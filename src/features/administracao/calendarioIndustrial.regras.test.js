import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabaseClient", () => ({ supabase: {} }));

import {
  calcularIndicadores,
  classePerfil,
  criarDiaSelecionado,
  descreverDiaCalendario,
  montarObservacaoDia,
  obterDiasDoMes,
} from "./calendarioIndustrial.regras";

const FERIADO = {
  origem: "EXCECAO",
  perfil_codigo: "SEM_PRODUCAO",
  perfil_nome: "Sem produção",
  observacao: "FERIADO NACIONAL — NATAL",
};

describe("obterDiasDoMes", () => {
  it("começa na segunda e completa semanas inteiras", () => {
    // Outubro de 2026 começa numa quinta: 3 vazios antes do dia 1.
    const dias = obterDiasDoMes(2026, 9);

    expect(dias.slice(0, 4)).toEqual([null, null, null, { dia: 1, data: "2026-10-01" }]);
    expect(dias.length % 7).toBe(0);
    expect(dias.filter(Boolean)).toHaveLength(31);
  });
});

describe("classePerfil", () => {
  it.each([
    ["SEM_PRODUCAO", "bloqueado"],
    ["24H", "liberado"],
    ["5H", "parcial"],
    ["OUTRO", "padrao"],
  ])("%s vira %s", (perfil, classe) => {
    expect(classePerfil(perfil)).toBe(classe);
  });
});

describe("calcularIndicadores", () => {
  it("separa feriados automáticos de exceções manuais", () => {
    expect(
      calcularIndicadores([
        FERIADO,
        { perfil_codigo: "SEM_PRODUCAO", observacao: "MANUTENÇÃO" },
        { perfil_codigo: "24H", observacao: "" },
      ]),
    ).toEqual({ bloqueados: 2, feriadosAutomaticos: 1, manuais: 2, liberacoes: 1 });
  });
});

describe("criarDiaSelecionado", () => {
  it("só marca feriado automático quando há exceção", () => {
    expect(criarDiaSelecionado("2026-12-25", FERIADO)).toMatchObject({
      temExcecao: true,
      ehFeriadoAutomatico: true,
    });
    expect(criarDiaSelecionado("2026-12-26", undefined)).toMatchObject({
      temExcecao: false,
      ehFeriadoAutomatico: false,
    });
  });
});

describe("descreverDiaCalendario", () => {
  const dia = { dia: 25, data: "2026-12-25" };

  it("dia sem exceção é padrão 24h", () => {
    const { classes, titulo } = descreverDiaCalendario(dia, undefined, "2026-12-25");

    expect(classes).toBe("administracao-dia padrao-24h liberado hoje");
    expect(titulo).toBe("25/12/2026 — padrão 24 horas");
  });

  it("feriado mostra perfil e observação no título", () => {
    const { classes, titulo, automatico } = descreverDiaCalendario(dia, FERIADO, "2026-01-01");

    expect(automatico).toBe(true);
    expect(classes).toBe("administracao-dia com-excecao bloqueado feriado-automatico");
    expect(titulo).toBe("25/12/2026 — Sem produção — FERIADO NACIONAL — NATAL");
  });
});

describe("montarObservacaoDia", () => {
  it("preenche o texto padrão quando vazio", () => {
    expect(montarObservacaoDia("  ", "SEM_PRODUCAO", false)).toBe(
      "SEM PRODUÇÃO — AJUSTE MANUAL DO CALENDÁRIO INDUSTRIAL",
    );
    expect(montarObservacaoDia("", "24H", false)).toBe("AJUSTE MANUAL DO CALENDÁRIO INDUSTRIAL");
  });

  it("feriado importado alterado passa a ser decisão manual", () => {
    expect(montarObservacaoDia(FERIADO.observacao, "24H", true)).toBe(
      "AJUSTE MANUAL — FERIADO NACIONAL — NATAL",
    );
    expect(montarObservacaoDia(FERIADO.observacao, "SEM_PRODUCAO", true)).toBe(FERIADO.observacao);
    expect(montarObservacaoDia(FERIADO.observacao, "24H", false)).toBe(FERIADO.observacao);
  });
});
