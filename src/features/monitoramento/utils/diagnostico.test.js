import { describe, expect, it } from "vitest";

import {
  NIVEL_OMIE,
  avaliarOmie,
  calcularRetomarEm,
  explicarErro,
  mapaDaHora,
  minutosNaHora,
  pedidosComErro,
  resumirResultado,
} from "./diagnostico";
import { proximaExecucao } from "./monitoramento.utils";

/* Mensagens reais registradas em 06/11/2026. */
describe("explicarErro", () => {
  it.each([
    ["The signal has been aborted", 500, "O Omie demorou e a função desistiu de esperar"],
    ["Tempo limite excedido", null, "A função não respondeu a tempo"],
    ["Request idle timeout limit (150s) reached", 504, "A função passou do tempo máximo (150 s)"],
    [
      "Function failed due to not having enough compute resources (please check logs)",
      546,
      "A função ficou sem memória ou processamento",
    ],
    ["ListarPosEstoque: tempo limite excedido.", 500, "O Omie avisou que a consulta demorou demais"],
    [
      "ERROR: Já existe uma requisição desse método sendo executada e você pode tentar novamente ",
      500,
      "O Omie estava ocupado com a mesma consulta",
    ],
    ["SOAP-ERROR: Broken response from Application Server (BG)", 500, "O Omie respondeu com erro interno"],
    ["Sem resposta da função (expirou no pg_net)", null, "A função não respondeu"],
    ["algo inesperado", 500, "Erro não reconhecido"],
  ])("%s → título certo", (texto, http, titulo) => {
    expect(explicarErro(texto, http).titulo).toBe(titulo);
  });

  it("sem erro devolve null", () => {
    expect(explicarErro("")).toBe(null);
    expect(explicarErro(null)).toBe(null);
  });

  it("lote interrompido: diz quanto conferiu e quais pedidos falharam", () => {
    const texto = JSON.stringify({
      sucesso: false,
      lote: 6,
      total_lotes: 12,
      pedidos_no_lote: 14,
      pedidos_processados: 9,
      interrompido: true,
      resultados: [
        { numero_pedido: "2837", mudou: false },
        { numero_pedido: "2888", erro: "SOAP-ERROR: timeout" },
      ],
    });
    const r = explicarErro(texto, 500);
    expect(r.titulo).toBe("Parou no meio para não passar do tempo");
    expect(r.dica).toContain("Conferiu 9 de 14 pedidos");
    expect(r.pedidos).toEqual([{ pedido: "2888", erro: "SOAP-ERROR: timeout" }]);
  });

  it("erro dentro de JSON usa o campo erro", () => {
    expect(explicarErro('{"sucesso":false,"erro":"The signal has been aborted"}', 500).titulo).toBe(
      "O Omie demorou e a função desistiu de esperar",
    );
  });

  it("JSON cortado não quebra", () => {
    expect(pedidosComErro('{"resultados":[{"numero_pedido":"1","erro":"x"')).toEqual([]);
    expect(explicarErro('{"sucesso":false,"lote":6,"resultados":[{"num').titulo).toBe(
      "Erro não reconhecido",
    );
  });
});

describe("avaliarOmie", () => {
  it("poucas execuções = sem leitura", () => {
    expect(avaliarOmie({ execucoes: 2, falhas: 2, falhas_omie: 2 }).nivel).toBe(
      NIVEL_OMIE.SEM_DADOS,
    );
    expect(avaliarOmie(null).nivel).toBe(NIVEL_OMIE.SEM_DADOS);
  });

  it("manhã de 06/11 (07:30–08:00): instável", () => {
    // 24 execuções, 14 falhas por demora, 4 lentas
    expect(avaliarOmie({ execucoes: 24, falhas: 14, falhas_omie: 14, lentas: 4 }).nivel).toBe(
      NIVEL_OMIE.INSTAVEL,
    );
  });

  it("agora há pouco (08:15–08:45): 7 erros SOAP do Omie em 24 = com erros", () => {
    const r = avaliarOmie({ execucoes: 24, falhas: 7, falhas_omie: 7, lentas: 1 });
    expect(r.nivel).toBe(NIVEL_OMIE.LENTO);
    expect(r.titulo).toBe("Omie com erros");
  });

  it("algumas lentas = lento", () => {
    expect(avaliarOmie({ execucoes: 20, falhas: 1, falhas_omie: 1, lentas: 4 }).nivel).toBe(
      NIVEL_OMIE.LENTO,
    );
  });

  it("dia normal", () => {
    const r = avaliarOmie({ execucoes: 20, falhas: 1, falhas_omie: 0, lentas: 1 });
    expect(r.nivel).toBe(NIVEL_OMIE.NORMAL);
    expect(r.detalhe).toContain("20 execuções");
  });
});

describe("resumirResultado", () => {
  it("pedidos de compra", () => {
    expect(resumirResultado({ novas: 2, alteradas: 1, iguais: 5, paginas_processadas: 1 })).toBe(
      "2 novos · 1 alterado · 1 página lida",
    );
  });

  it("conferência de status em lote", () => {
    expect(
      resumirResultado({ lote: 10, total_lotes: 12, pedidos_processados: 5, pedidos_alterados: 0 }),
    ).toBe("lote 10 de 12 · 0 pedidos alterados · 5 pedidos conferidos");
  });

  it("conferência completa que continua", () => {
    expect(resumirResultado({ paginas_processadas: 6, proxima_pagina: 77, paginas: 138, concluido: false })).toBe(
      "6 páginas lidas · continua na próxima",
    );
  });

  it("financeiro", () => {
    expect(resumirResultado({ ano: 2026, mes: 11, categorias: 188, titulos: 511, lancamentos: 492 })).toBe(
      "492 lançamentos · 511 títulos",
    );
  });

  it("sem números conhecidos = null", () => {
    expect(resumirResultado({ ano: 2026 })).toBe(null);
    expect(resumirResultado(null)).toBe(null);
  });
});

describe("proximaExecucao (agenda em UTC)", () => {
  // 06/11/2026 é sexta-feira.
  it("a cada 5 min, seg a sex, 10–20 UTC", () => {
    const agora = new Date("2026-11-06T11:07:30Z"); // 08:07 em Brasília
    expect(proximaExecucao("*/5 10-20 * * 1-5", agora).toISOString()).toBe("2026-11-06T11:10:00.000Z");
  });

  it("depois do último horário de sexta pula para segunda", () => {
    const agora = new Date("2026-11-06T20:56:00Z"); // 17:56 de sexta
    expect(proximaExecucao("*/5 10-20 * * 1-5", agora).toISOString()).toBe("2026-11-09T10:00:00.000Z");
  });

  it("preço médio: 06:11 e 12:11", () => {
    const agora = new Date("2026-11-06T11:00:00Z");
    expect(proximaExecucao("11 9,15 * * 1-5", agora).toISOString()).toBe("2026-11-06T15:11:00.000Z");
  });

  it("todo dia (inclui domingo = 0 ou 7)", () => {
    const agora = new Date("2026-11-07T04:00:00Z");
    expect(proximaExecucao("30 3 * * *", agora).toISOString()).toBe("2026-11-08T03:30:00.000Z");
    expect(proximaExecucao("15 4 * * 7", agora).toISOString()).toBe("2026-11-08T04:15:00.000Z");
  });

  it("agenda não reconhecida = null", () => {
    expect(proximaExecucao("0 0 1 * *")).toBe(null);
    expect(proximaExecucao("lixo")).toBe(null);
  });
});

describe("mapa de horários (Brasília)", () => {
  const rotinas = [
    { rotina: "pc", nome: "Pedidos de compra", agenda: "*/5 10-20 * * 1-5" },
    { rotina: "req", nome: "Requisições", agenda: "*/10 10-20 * * 1-5" },
    { rotina: "fin", nome: "Financeiro", agenda: "0,10,20,30 8,15 * * 1-5" },
    { rotina: "preco", nome: "Preço médio", agenda: "11 9,15 * * 1-5" },
    { rotina: "limpeza", nome: "Limpeza", agenda: "30 3 * * *" },
    { rotina: "pausada", nome: "Pausada", agenda: "0 15 * * 1-5", ativa: false },
  ];

  it("12h: quem dispara em cada minuto", () => {
    const { linhas, contagem } = mapaDaHora(rotinas, 12);
    expect(linhas.map((l) => l.rotina)).toEqual(["pc", "req", "fin", "preco", "pausada"]);
    expect(contagem[0]).toBe(3); // pc + req + fin (pausada não conta)
    expect(contagem[11]).toBe(1); // só o preço médio
    expect(contagem[12]).toBe(0);
  });

  it("00:30 de Brasília = 03:30 UTC do mesmo dia", () => {
    expect(minutosNaHora("30 3 * * *", 0)).toEqual([30]);
  });

  it("21h de Brasília cai no dia seguinte em UTC", () => {
    // 21h de sexta (5) = 00h UTC de sábado (6): rotina de seg a sex não roda
    expect(minutosNaHora("0 0 * * 1-5", 21, 5)).toEqual([]);
    expect(minutosNaHora("0 0 * * 1-5", 21, 4)).toEqual([0]);
  });
});

describe("pausar até", () => {
  const agora = new Date("2026-11-06T11:10:00Z"); // 08:10 de Brasília

  it("até retomar à mão = null", () => {
    expect(calcularRetomarEm({ id: "manual" }, agora)).toBe(null);
    expect(calcularRetomarEm(null, agora)).toBe(null);
  });

  it("por 2 horas", () => {
    expect(calcularRetomarEm({ id: "2h", horas: 2 }, agora).toISOString()).toBe(
      "2026-11-06T13:10:00.000Z",
    );
  });

  it("próximas 06:00: amanhã se já passou das 6h", () => {
    expect(calcularRetomarEm({ id: "amanha6" }, agora).toISOString()).toBe("2026-11-07T09:00:00.000Z");
  });

  it("próximas 06:00: hoje se ainda é madrugada", () => {
    const madrugada = new Date("2026-11-06T07:30:00Z"); // 04:30 de Brasília
    expect(calcularRetomarEm({ id: "amanha6" }, madrugada).toISOString()).toBe(
      "2026-11-06T09:00:00.000Z",
    );
  });

  it("perto da meia-noite (23:30 de Brasília = 02:30 UTC do dia seguinte)", () => {
    const noite = new Date("2026-11-07T02:30:00Z");
    expect(calcularRetomarEm({ id: "amanha6" }, noite).toISOString()).toBe("2026-11-07T09:00:00.000Z");
  });
});
