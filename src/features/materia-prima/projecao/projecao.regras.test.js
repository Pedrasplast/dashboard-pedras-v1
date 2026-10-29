import { describe, expect, it } from "vitest";

import {
  calcularConsumoProgramacaoNaData,
  calcularProjecao,
  distribuirConsumoReceita,
  listarDatas,
  obterConsumoTotalProgramacao,
  obterItensReceita,
} from "./projecao.regras";

describe("listarDatas", () => {
  it("lista o intervalo inclusive, atravessando o mês", () => {
    expect(listarDatas("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
    expect(listarDatas("2026-10-05", "2026-10-01")).toEqual([]);
    expect(listarDatas("", "2026-10-01")).toEqual([]);
  });
});

describe("receita", () => {
  it("ignora itens inativos, sem fornecedor ou sem percentual", () => {
    expect(
      obterItensReceita({
        receitaItens: [
          { fornecedor_id: 1, fornecedor_nome: "A", percentual: "60" },
          { fornecedorId: 2, percentual: 40, ativo: false },
          { fornecedorId: null, percentual: 40 },
          { fornecedorId: 3, percentual: 0 },
        ],
      }),
    ).toEqual([{ fornecedorId: 1, fornecedorNome: "A", percentual: 60 }]);
  });

  it("o último item fica com a sobra do arredondamento", () => {
    const itens = distribuirConsumoReceita(100, [
      { fornecedorId: 1, percentual: 33.3333333 },
      { fornecedorId: 2, percentual: 33.3333333 },
      { fornecedorId: 3, percentual: 33.3333333 },
    ]);

    expect(itens.map((item) => item.consumoKg)).toEqual([33.333333, 33.333333, 33.333334]);
  });
});

describe("consumo da programação", () => {
  it("sem horário: quantidade diária × peso, só dentro do período", () => {
    const programacao = {
      dataInicio: "2026-10-01",
      dataFim: "2026-10-03",
      quantidade: 10,
      pesoKg: 2,
    };

    expect(calcularConsumoProgramacaoNaData(programacao, "2026-10-02")).toEqual({
      ciclos: null,
      pecas: 10,
      consumoKg: 20,
    });
    expect(calcularConsumoProgramacaoNaData(programacao, "2026-10-04").consumoKg).toBe(0);
    expect(obterConsumoTotalProgramacao(programacao)).toBe(60);
  });

  it("com horário: ciclos que atravessam a meia-noite contam no dia em que terminam", () => {
    const programacao = {
      dataInicio: "2026-10-01",
      dataFim: "2026-10-02",
      horaInicio: "23:00",
      horaFim: "01:00",
      cicloSegundos: 2400,
      cavidadeMolde: 2,
      pesoKg: 0.5,
    };

    // 23:00 → 00:00 = 3600 s: 1 ciclo completo; 00:00 → 01:00 completa mais 2 (4800 e 7200 s).
    expect(calcularConsumoProgramacaoNaData(programacao, "2026-10-01")).toEqual({
      ciclos: 1,
      pecas: 2,
      consumoKg: 1,
    });
    expect(calcularConsumoProgramacaoNaData(programacao, "2026-10-02")).toEqual({
      ciclos: 2,
      pecas: 4,
      consumoKg: 2,
    });
  });
});

describe("calcularProjecao", () => {
  const base = {
    dataInicio: "2026-10-02",
    dataFim: "2026-10-03",
    materialId: 1,
  };

  it("parte do saldo-base anterior ao início e soma compras menos consumo", () => {
    const resultado = calcularProjecao({
      ...base,
      resultadoSaldos: {
        saldos: [
          {
            id: 1,
            materialId: 1,
            fornecedorId: 7,
            fornecedorNome: "Fornecedor A",
            ativo: true,
            dataBase: "2026-10-01",
            quantidadeKg: 100,
          },
        ],
      },
      resultadoCompras: {
        materiais: [{ id: 1 }],
        compras: [
          {
            materialId: 1,
            fornecedorId: 7,
            status: "PREVISTA",
            dataPrevista: "2026-10-03",
            quantidadeKg: 50,
          },
        ],
      },
      resultadoProgramacao: [
        {
          materialId: 1,
          dataInicio: "2026-10-01",
          dataFim: "2026-10-03",
          quantidade: 5,
          pesoKg: 2,
          receitaConfigurada: true,
          receitaItens: [{ fornecedorId: 7, percentual: 100 }],
        },
      ],
    });

    expect(resultado.inicioCalculo).toBe("2026-10-01");
    expect(
      resultado.linhas.map(({ data, saldoInicioKg, compraFuturaKg, consumoKg, saldoFinalKg }) => ({
        data,
        saldoInicioKg,
        compraFuturaKg,
        consumoKg,
        saldoFinalKg,
      })),
    ).toEqual([
      { data: "2026-10-02", saldoInicioKg: 90, compraFuturaKg: 0, consumoKg: 10, saldoFinalKg: 80 },
      {
        data: "2026-10-03",
        saldoInicioKg: 80,
        compraFuturaKg: 50,
        consumoKg: 10,
        saldoFinalKg: 120,
      },
    ]);
    expect(resultado.fornecedoresSemSaldo).toEqual([]);
  });

  it("lista programações sem receita e fornecedores sem saldo", () => {
    const resultado = calcularProjecao({
      ...base,
      resultadoSaldos: { saldos: [] },
      resultadoCompras: {
        compras: [
          {
            materialId: 1,
            fornecedorId: 8,
            fornecedorNome: "B",
            status: "RECEBIDA",
            dataRecebimento: "2026-10-02",
            quantidadeKg: 30,
          },
        ],
      },
      resultadoProgramacao: {
        programacoes: [
          {
            id: 9,
            materialId: 1,
            dataInicio: "2026-10-02",
            dataFim: "2026-10-02",
            quantidade: 1,
            pesoKg: 1,
            codigoProduto: "P9",
          },
        ],
      },
    });

    expect(resultado.programacoesSemReceita).toMatchObject([{ id: 9, codigoProduto: "P9" }]);
    expect(resultado.fornecedoresSemSaldo).toEqual([{ id: 8, nome: "B" }]);
    expect(resultado.linhas[0]).toMatchObject({ recebidoKg: 30, saldoFinalKg: null });
  });

  it("recusa material fora da lista de materiais", () => {
    expect(() =>
      calcularProjecao({
        ...base,
        resultadoCompras: { materiais: [{ id: 2 }] },
      }),
    ).toThrow("O material selecionado não foi encontrado.");
  });
});
