import { describe, expect, it } from "vitest";

import {
  GRUPO_FAVORITOS,
  GRUPO_RECENTES,
  GRUPO_TODOS,
  MAX_RECENTES,
  agruparPorCategoria,
  alternarFavorito,
  gravarLista,
  lerLista,
  montarLista,
  quando,
  registrarRecente,
} from "./painelRelatorios.utils";

const relatorios = [
  { id: "prod-inj", categoria: "Produção", titulo: "Produção por Injetora", descricao: "Resumo por injetora" },
  { id: "ped-aberto", categoria: "Pedidos", titulo: "Pedidos em Aberto", descricao: "Previsão de faturamento" },
  { id: "ped-atraso", categoria: "Pedidos", titulo: "Pedidos Atrasados", descricao: "Previsão vencida" },
  { id: "fin-prev", categoria: "Financeiro", titulo: "Previsto x Realizado", descricao: "Desvios por categoria" },
];
const ids = (lista) => lista.map((item) => item.relatorio.id);

describe("montarLista", () => {
  it("Todos: todos, na ordem em que vieram", () => {
    expect(ids(montarLista({ relatorios, grupo: GRUPO_TODOS }))).toEqual([
      "prod-inj",
      "ped-aberto",
      "ped-atraso",
      "fin-prev",
    ]);
  });

  it("categoria: só os dela", () => {
    expect(ids(montarLista({ relatorios, grupo: "Pedidos" }))).toEqual(["ped-aberto", "ped-atraso"]);
  });

  it("favoritos: na ordem marcada e sem os que o usuário não pode abrir", () => {
    const lista = montarLista({ relatorios, grupo: GRUPO_FAVORITOS, favoritos: ["fin-prev", "sem-permissao", "prod-inj"] });
    expect(ids(lista)).toEqual(["fin-prev", "prod-inj"]);
  });

  it("recentes: guarda quando foi aberto", () => {
    const lista = montarLista({ relatorios, grupo: GRUPO_RECENTES, recentes: [{ id: "ped-atraso", em: 5 }, { id: "x", em: 4 }] });
    expect(lista).toEqual([{ relatorio: relatorios[2], em: 5 }]);
  });

  it("busca: procura em todos, sem acento e ignorando o grupo", () => {
    expect(ids(montarLista({ relatorios, grupo: GRUPO_FAVORITOS, busca: "previsao" }))).toEqual([
      "ped-aberto",
      "ped-atraso",
    ]);
    expect(ids(montarLista({ relatorios, grupo: "Produção", busca: "  FINANCEIRO " }))).toEqual(["fin-prev"]);
  });
});

describe("favoritos e recentes", () => {
  it("alternarFavorito liga e desliga", () => {
    expect(alternarFavorito(["a"], "b")).toEqual(["a", "b"]);
    expect(alternarFavorito(["a", "b"], "a")).toEqual(["b"]);
  });

  it("registrarRecente põe no topo, sem repetir e com limite", () => {
    const r = registrarRecente([{ id: "a", em: 1 }, { id: "b", em: 2 }], "b", 9);
    expect(r).toEqual([{ id: "b", em: 9 }, { id: "a", em: 1 }]);
    let muitos = [];
    for (let i = 0; i < 20; i++) muitos = registrarRecente(muitos, `r${i}`, i);
    expect(muitos).toHaveLength(MAX_RECENTES);
    expect(muitos[0].id).toBe("r19");
  });

  it("lerLista/gravarLista aguentam armazenamento com erro", () => {
    const quebrado = { getItem: () => "{x", setItem: () => { throw new Error("cheio"); } };
    expect(lerLista("k", quebrado)).toEqual([]);
    expect(gravarLista("k", ["a"], quebrado)).toEqual(["a"]);
    expect(lerLista("k", null)).toEqual([]);
  });

  it("quando: hoje, ontem ou dia/mês", () => {
    const hoje = new Date(2026, 10, 6, 16, 0);
    expect(quando(new Date(2026, 10, 6, 8, 0).getTime(), hoje)).toBe("hoje");
    expect(quando(new Date(2026, 10, 5, 23, 0).getTime(), hoje)).toBe("ontem");
    expect(quando(new Date(2026, 10, 3, 10, 0).getTime(), hoje)).toBe("03/11");
    expect(quando("x", hoje)).toBe("");
  });
});

describe("agruparPorCategoria", () => {
  it("mantém a ordem das categorias e dos itens", () => {
    const grupos = agruparPorCategoria(montarLista({ relatorios, grupo: GRUPO_TODOS }));
    expect(grupos.map((g) => [g.nome, g.itens.length])).toEqual([
      ["Produção", 1],
      ["Pedidos", 2],
      ["Financeiro", 1],
    ]);
  });
});
