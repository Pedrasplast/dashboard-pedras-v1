import { describe, expect, it } from "vitest";

import { filtrarRegistrosDashboard, identificarTurnoRegistro } from "./dashboard.utils";
import { filtrarParadas } from "../dashboard-paradas/dashboardParadas.utils";

/*
 * Regra única de "hora parada" (05/11/2026):
 * - turnos corridos: I 05:00–14:48, II 14:48–23:55, III 23:55–05:00;
 * - nenhum tipo marcado = Tipos 1 e 2;
 * - Tipo 3 só entra quando marcado;
 * - Dashboard de Produção e Dashboard de Paradas dão o mesmo total.
 */

const FILTROS_BASE = Object.freeze({
  dataInicio: "",
  dataFim: "",
  injetora: "Todos",
  turno: "Todos",
  cod_prod: "Todos",
  mp: "Todos",
  motivo: "Todos",
  tipo: [],
});

function parada({ tipo, motivo, inicio, fim, data = "2026-10-15" }) {
  const segundos = (new Date(fim) - new Date(inicio)) / 1000;
  const h = String(Math.floor(segundos / 3600)).padStart(2, "0");
  const m = String(Math.floor((segundos % 3600) / 60)).padStart(2, "0");
  return {
    status: "Indisponível",
    tipo,
    motivo,
    injetora: "INJ 01",
    cod_prod: "P1",
    lista_de_data: data,
    inicio,
    fim,
    duracao: `${h}:${m}:00`,
  };
}

const FALHA_NO_ALMOCO = parada({
  tipo: "2",
  motivo: "Falha Operacional ( MECÂNICA )",
  inicio: "2026-10-15T10:30:00-03:00",
  fim: "2026-10-15T12:30:00-03:00",
});

const ALMOCO = parada({
  tipo: "3",
  motivo: "Alimentação",
  inicio: "2026-10-15T11:00:00-03:00",
  fim: "2026-10-15T12:00:00-03:00",
});

const FIM_DE_SEMANA = parada({
  tipo: "3",
  motivo: "Final de Semana/ sem expediente",
  inicio: "2026-10-18T00:00:00-03:00",
  fim: "2026-10-19T00:00:00-03:00",
  data: "2026-10-18",
});

const SETUP_PLANEJADO = parada({
  tipo: "1",
  motivo: "Troca de Molde (MECÂNICA)",
  inicio: "2026-10-15T14:00:00-03:00",
  fim: "2026-10-15T16:00:00-03:00",
});

const PRODUZINDO_11H30 = {
  status: "Produzindo",
  tipo: "",
  injetora: "INJ 01",
  cod_prod: "P1",
  lista_de_data: "2026-10-15",
  inicio: "2026-10-15T11:30:00-03:00",
  fim: "2026-10-15T13:00:00-03:00",
  duracao: "01:30:00",
};

const TODOS = [FALHA_NO_ALMOCO, ALMOCO, FIM_DE_SEMANA, SETUP_PLANEJADO, PRODUZINDO_11H30];

function segundos(duracao) {
  const [h, m, s] = String(duracao).split(":").map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

function horasParadasProducao(filtros) {
  return (
    filtrarRegistrosDashboard(TODOS, filtros, {
      ajustarParadasPorTurno: true,
      tiposParada: filtros.tipo,
    })
      .filter((r) => r.status === "Indisponível")
      .reduce((total, r) => total + segundos(r.duracao), 0) / 3600
  );
}

function horasParadasDashboardParadas(filtros) {
  return filtrarParadas(TODOS, filtros).reduce((total, r) => total + segundos(r.duracao), 0) / 3600;
}

describe("regra única de hora parada", () => {
  it("nenhum tipo marcado = Tipos 1 e 2 (Tipo 3 fora)", () => {
    // falha 2 h + setup 2 h; almoço e fim de semana ficam fora
    expect(horasParadasProducao({ ...FILTROS_BASE, tipo: [] })).toBe(4);
  });

  it("parada que atravessa o almoço conta inteira (sem desconto de intervalo)", () => {
    expect(horasParadasProducao({ ...FILTROS_BASE, tipo: ["2"] })).toBe(2);
  });

  it("Tipo 3 só entra quando marcado", () => {
    expect(horasParadasProducao({ ...FILTROS_BASE, tipo: ["1", "2"] })).toBe(4);
    // + almoço 1 h + fim de semana 24 h
    expect(horasParadasProducao({ ...FILTROS_BASE, tipo: ["1", "2", "3"] })).toBe(29);
    expect(horasParadasProducao({ ...FILTROS_BASE, tipo: ["3"] })).toBe(25);
  });

  it("Dashboard de Produção e Dashboard de Paradas dão o mesmo total", () => {
    for (const tipo of [[], ["1"], ["2"], ["3"], ["1", "2"], ["1", "2", "3"]]) {
      for (const turno of ["Todos", "TURNO I", "TURNO II", "TURNO III"]) {
        const filtros = { ...FILTROS_BASE, tipo, turno };
        expect(horasParadasDashboardParadas(filtros), `${tipo}/${turno}`).toBe(
          horasParadasProducao(filtros),
        );
      }
    }
  });

  it("soma dos turnos fecha com 'Todos'", () => {
    const tipo = ["1", "2", "3"];
    const soma = ["TURNO I", "TURNO II", "TURNO III"]
      .map((turno) => horasParadasProducao({ ...FILTROS_BASE, tipo, turno }))
      .reduce((a, b) => a + b, 0);
    const total = horasParadasProducao({ ...FILTROS_BASE, tipo, turno: "Todos" });
    expect(Math.round(soma * 3600)).toBe(Math.round(total * 3600));
  });

  it("parada que cruza a troca de turno 14:48 é dividida entre os turnos", () => {
    const tipo = ["1"];
    expect(horasParadasProducao({ ...FILTROS_BASE, tipo, turno: "TURNO I" })).toBe(0.8);
    expect(horasParadasProducao({ ...FILTROS_BASE, tipo, turno: "TURNO II" })).toBe(1.2);
  });

  it("turnos corridos: 11:30 e 19:30 pertencem a um turno (não somem do filtro)", () => {
    expect(identificarTurnoRegistro({ inicio: "2026-10-15T11:30:00-03:00" })).toBe("TURNO I");
    expect(identificarTurnoRegistro({ inicio: "2026-10-15T19:30:00-03:00" })).toBe("TURNO II");
    expect(identificarTurnoRegistro({ inicio: "2026-10-15T23:58:00-03:00" })).toBe("TURNO III");
    expect(identificarTurnoRegistro({ inicio: "2026-10-15T04:59:00-03:00" })).toBe("TURNO III");

    const turnoI = filtrarRegistrosDashboard(
      TODOS,
      { ...FILTROS_BASE, turno: "TURNO I" },
      { ajustarParadasPorTurno: true, tiposParada: [] },
    );
    expect(turnoI).toContain(PRODUZINDO_11H30);
  });

  it("registros que não são parada não são afetados pelo filtro de tipo", () => {
    const resultado = filtrarRegistrosDashboard(TODOS, FILTROS_BASE, {
      ajustarParadasPorTurno: true,
      tiposParada: ["3"],
    });
    expect(resultado).toContain(PRODUZINDO_11H30);
  });
});

describe("produção dividida entre turnos", () => {
  const PRODUCAO_CRUZA_TURNO = {
    status: "Produzindo",
    tipo: "",
    injetora: "INJ 02",
    cod_prod: "P2",
    lista_de_data: "2026-10-15",
    // 4 h: 1 h no Turno I (13:48–14:48) e 3 h no Turno II (14:48–17:48)
    inicio: "2026-10-15T13:48:00-03:00",
    fim: "2026-10-15T17:48:00-03:00",
    duracao: "04:00:00",
    conforme: 400,
    danificada: 8,
  };

  const filtrar = (turno) =>
    filtrarRegistrosDashboard([PRODUCAO_CRUZA_TURNO], { ...FILTROS_BASE, turno }, {
      ajustarParadasPorTurno: true,
      tiposParada: [],
    });

  it("divide tempo e peças na mesma proporção", () => {
    const [turnoI] = filtrar("TURNO I");
    const [turnoII] = filtrar("TURNO II");

    expect(turnoI.duracao).toBe("01:00:00");
    expect(turnoI.conforme).toBe(100);
    expect(turnoI.danificada).toBe(2);

    expect(turnoII.duracao).toBe("03:00:00");
    expect(turnoII.conforme).toBe(300);
    expect(turnoII.danificada).toBe(6);

    expect(filtrar("TURNO III")).toHaveLength(0);
  });

  it("em 'Todos' o registro não muda", () => {
    const [todos] = filtrar("Todos");
    expect(todos).toBe(PRODUCAO_CRUZA_TURNO);
  });
});
