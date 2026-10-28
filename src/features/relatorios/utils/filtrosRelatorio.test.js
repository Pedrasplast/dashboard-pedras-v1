import { describe, expect, it } from "vitest";

import {
  associarDescricaoProduto,
  contarRegistrosRelatorio,
  criarFiltrosIniciais,
  filtrarDadosRelatorio,
  listarProdutosDisponiveis,
  listarTiposDisponiveis,
  montarColunasVisualizacao,
} from "./filtrosRelatorio";

const relatorioPedidos = {
  id: "pedidos-teste",
  fonteDados: "pedidos",
  filtros: { status: true, periodo: true, cliente: true },
};

const relatorioProducao = {
  id: "producao-teste",
  fonteDados: "producao",
  filtros: { periodo: true, injetora: true, tipo: true },
};

describe("filtrarDadosRelatorio (pedidos)", () => {
  const pedidos = [
    {
      pedido: "100",
      pedidoExibicao: "100",
      status: "Pedido",
      previsao: "2026-01-10",
      cliente: "ACME",
    },
    {
      pedido: "100",
      pedidoExibicao: "100/1",
      status: "Pedido",
      previsao: "2026-02-10",
      cliente: "ACME",
    },
    {
      pedido: "200",
      pedidoExibicao: "200",
      status: "Faturado",
      previsao: "2026-02-10",
      cliente: "Beta",
    },
  ];

  const filtrar = (filtros) =>
    filtrarDadosRelatorio(pedidos, relatorioPedidos, {
      ...criarFiltrosIniciais("pedidos"),
      status: "todos",
      ...filtros,
    }).map((item) => item.pedidoExibicao);

  it("número sem barra encontra o pedido e os desdobramentos", () => {
    expect(filtrar({ pedidos: "100" })).toEqual(["100", "100/1"]);
  });

  it("número com barra encontra só o desdobramento; aceita vários números", () => {
    expect(filtrar({ pedidos: "100/1; 200" })).toEqual(["100/1", "200"]);
  });

  it("filtra status sem diferenciar maiúsculas, período e cliente", () => {
    expect(filtrar({ status: "PEDIDO" })).toEqual(["100", "100/1"]);
    expect(filtrar({ dataInicio: "2026-02-01" })).toEqual(["100/1", "200"]);
    expect(filtrar({ cliente: "Beta" })).toEqual(["200"]);
  });
});

describe("filtrarDadosRelatorio (produção)", () => {
  const registros = [
    { injetora: "INJ 01", inicio: "2026-01-05 08:00:00", tipo: "1" },
    { injetora: "INJ 02", inicio: "2026-01-06 08:00:00", tipo: "2" },
    { injetora: "INJ 01", inicio: null, tipo: "3" },
  ];

  it("com período informado, descarta registros sem data", () => {
    const filtros = { ...criarFiltrosIniciais(), dataInicio: "2026-01-01" };

    expect(filtrarDadosRelatorio(registros, relatorioProducao, filtros)).toHaveLength(2);
  });

  it("filtra injetora e os tipos marcados", () => {
    const filtros = { ...criarFiltrosIniciais(), injetora: "INJ 01", tipo: ["3"] };

    expect(filtrarDadosRelatorio(registros, relatorioProducao, filtros)).toEqual([registros[2]]);
  });

  it("aplica o filtro fixo do relatório", () => {
    const relatorio = { ...relatorioProducao, filtroFixo: (item) => item.tipo === "2" };

    expect(filtrarDadosRelatorio(registros, relatorio, criarFiltrosIniciais())).toEqual([
      registros[1],
    ]);
  });
});

describe("opções e colunas", () => {
  it("lista produtos da injetora escolhida e os tipos 1, 2 e 3 em ordem", () => {
    const dados = [
      { injetora: "INJ 01", cod_prod: "P2" },
      { injetora: "INJ 02", produto: "P9" },
      { injetora: "INJ 01", cod_prod: "P1", tipo: " 3 " },
      { tipo: "1" },
      { tipo: "7" },
    ];

    // Na ordem em que aparecem nos dados.
    expect(listarProdutosDisponiveis(dados, "INJ 01")).toEqual(["P2", "P1"]);
    expect(listarTiposDisponiveis(dados)).toEqual(["1", "3"]);
  });

  it("insere a descrição logo após o produto no relatório Produção por Produto", () => {
    const colunas = montarColunasVisualizacao({
      id: "producao-produto",
      colunas: ["data", "produto", "pecas"],
    });

    expect(colunas.map((coluna) => coluna.chave)).toEqual([
      "data",
      "produto",
      "descricao_produto",
      "pecas",
    ]);
  });

  it("usa a descrição cadastrada, depois a existente, e '-' na falta das duas", () => {
    const descricoes = new Map([["P1", "Pedra 1"]]);

    expect(
      associarDescricaoProduto(
        [{ produto: "P1" }, { produto: "P2", descricao_produto: "Antiga" }, { produto: "P3" }],
        descricoes,
      ).map((item) => item.descricao_produto),
    ).toEqual(["Pedra 1", "Antiga", "-"]);
  });
});

describe("contarRegistrosRelatorio", () => {
  it("conta pedidos únicos só no relatório de pedidos em aberto", () => {
    const dados = [{ pedido: "1" }, { pedido: "1" }, { pedido: "2" }];

    expect(contarRegistrosRelatorio({ id: "pedidos-abertos" }, dados)).toBe(2);
    expect(contarRegistrosRelatorio({ id: "outro" }, dados)).toBe(3);
  });
});
