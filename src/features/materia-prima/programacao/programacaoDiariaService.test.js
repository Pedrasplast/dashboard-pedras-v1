import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabaseClient", () => ({ supabase: {} }));

const { agruparProgramacaoDiaria } = await import("./programacaoDiariaService");

function dia(programacaoId, data, extra = {}) {
  return {
    programacaoId,
    diaId: `${programacaoId}-${data}`,
    data,
    codigoProduto: "8147",
    injetora: "05",
    ativo: true,
    cicloSegundos: 65,
    cavidadeMolde: 1,
    pesoKg: 0.71,
    minutosEfetivos: 1320,
    pecasPrevistas: 1218,
    consumoTotalKg: 864.78,
    receitaId: 1,
    receitaNome: "9R/10P",
    receitaConfigurada: true,
    consumosFornecedores: [],
    ...extra,
  };
}

describe("agruparProgramacaoDiaria", () => {
  const HOJE = "2026-11-04";

  it("conta período e totais só de hoje em diante", () => {
    const [item] = agruparProgramacaoDiaria(
      [
        dia(1, "2026-10-16"),
        dia(1, "2026-11-03"),
        dia(1, "2026-11-04"),
        dia(1, "2026-11-05"),
        dia(1, "2026-11-07"),
      ],
      HOJE,
    );

    expect(item.dataInicio).toBe("2026-11-04");
    expect(item.dataFim).toBe("2026-11-07");
    expect(item.quantidadeDias).toBe(3);
    expect(item.pecasPrevistas).toBe(3 * 1218);
    expect(item.horasPeriodo).toBe(66);
    expect(item.encerrada).toBe(false);
  });

  it("mantém todos os dias gravados para o modal", () => {
    const [item] = agruparProgramacaoDiaria([dia(1, "2026-10-16"), dia(1, "2026-11-05")], HOJE);

    expect(item.diasProgramacao.map((d) => d.data)).toEqual(["2026-10-16", "2026-11-05"]);
  });

  it("marca como encerrada a programação sem dias de hoje em diante", () => {
    const [item] = agruparProgramacaoDiaria([dia(2, "2026-10-20"), dia(2, "2026-11-03")], HOJE);

    expect(item.encerrada).toBe(true);
    expect(item.dataInicio).toBeNull();
    expect(item.pecasPrevistas).toBe(0);
  });
});
