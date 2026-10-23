import { describe, expect, it } from "vitest";

import { aplicarEstruturaOmie, criarMapaMateriais, mesmoPeso } from "./estruturaOmie.js";

const estrutura = {
  produtos: [
    { codigo_produto: "11234", total_itens: 3 },
    { codigo_produto: "3924", total_itens: 1 },
    { codigo_produto: "11.01.0035", total_itens: 1 },
    { codigo_produto: "11217", total_itens: 0 },
    { codigo_produto: "ZERO", total_itens: 1 },
    { codigo_produto: "ERRO", total_itens: 0, erro: "falha" },
  ],
  itens: [
    { codigo_produto: "11234", codigo_mp: "PRD11295", quantidade: "2.78", percentual_perda: 0 },
    { codigo_produto: "3924", codigo_mp: "PRD11295", quantidade: "1860", percentual_perda: 0 },
    { codigo_produto: "11.01.0035", codigo_mp: "PRD00006", quantidade: "0.22" },
    { codigo_produto: "ZERO", codigo_mp: "PRD11295", quantidade: "0" },
  ],
};
const vinculos = [{ material_id: 1, codigo_produto: "PRD11295", ativo: true }];
const estoqueProdutos = ["11234", "3924", "11.01.0035", "ZERO", "ERRO", "NOVO"].map((c) => ({
  codigo_produto: c, fisico: 10, estoque_minimo: 100,
}));
estoqueProdutos.push({ codigo_produto: "11217", fisico: 375, estoque_minimo: 0 });

const pedido = (c, q = 10) => ({ codigo_produto: c, produto: `Produto ${c}`, quantidade: q });
const motivos = (r, c) => r.pendencias.find((p) => p.codigo === c)?.motivos.map((m) => m.tipo) ?? [];

describe("aplicarEstruturaOmie", () => {
  it("produto completo entra no consumo com o kg da estrutura", () => {
    const r = aplicarEstruturaOmie([pedido("11234", 100)], { estrutura, vinculos, estoqueProdutos });
    expect(r.pendencias).toEqual([]);
    expect(r.pedidos).toHaveLength(1);
    expect(r.pedidos[0]).toMatchObject({ material_id: "1", kg_un: 2.78, situacao_cadastro: "OK" });
    expect(r.pedidos[0].consumo_kg).toBeCloseTo(278);
  });

  it("perda da estrutura aumenta o kg/un", () => {
    const e = { produtos: [{ codigo_produto: "P" }], itens: [{ codigo_produto: "P", codigo_mp: "PRD11295", quantidade: 2, percentual_perda: 10 }] };
    const r = aplicarEstruturaOmie([pedido("P")], { estrutura: e, vinculos, estoqueProdutos: [{ codigo_produto: "P", fisico: 0, estoque_minimo: 1 }] });
    expect(r.pedidos[0].kg_un).toBeCloseTo(2.2);
  });

  it("cada falta vira um motivo e o produto sai do consumo", () => {
    const r = aplicarEstruturaOmie(
      ["3924", "11.01.0035", "11217", "ZERO", "ERRO", "NOVO"].map((c) => pedido(c)),
      { estrutura, vinculos, estoqueProdutos },
    );
    expect(r.pedidos).toEqual([]);
    expect(motivos(r, "3924")).toEqual(["PESO_SUSPEITO"]);
    expect(motivos(r, "11.01.0035")).toEqual(["MP_SEM_MATERIAL"]);
    expect(motivos(r, "11217")).toEqual(["SEM_ESTRUTURA", "SEM_ESTOQUE_MINIMO"]);
    expect(motivos(r, "ZERO")).toEqual(["PESO_ZERADO"]);
    expect(motivos(r, "ERRO")).toEqual(["ERRO_LEITURA"]);
    expect(motivos(r, "NOVO")).toEqual(["ESTRUTURA_NAO_LIDA"]);
  });

  it("sem cadastro de estoque é pendência", () => {
    const r = aplicarEstruturaOmie([pedido("11234")], { estrutura, vinculos, estoqueProdutos: [] });
    expect(motivos(r, "11234")).toEqual(["SEM_ESTOQUE"]);
  });

  it("peso suspeito aceito entra; recusado continua pendente", () => {
    const aceito = aplicarEstruturaOmie([pedido("3924")], {
      estrutura, vinculos, estoqueProdutos,
      decisoes: [{ codigo_produto: "3924", codigo_mp: "PRD11295", quantidade: "1860", decisao: "ACEITO" }],
    });
    expect(aceito.pendencias).toEqual([]);
    expect(aceito.pedidos[0].kg_un).toBe(1860);
    expect(aceito.pesosAceitos).toHaveLength(1);

    const recusado = aplicarEstruturaOmie([pedido("3924")], {
      estrutura, vinculos, estoqueProdutos,
      decisoes: [{ codigo_produto: "3924", codigo_mp: "PRD11295", quantidade: 1860, decisao: "RECUSADO" }],
    });
    expect(motivos(recusado, "3924")).toEqual(["PESO_RECUSADO"]);
  });

  it("aceite de outro peso não vale (peso mudou no Omie)", () => {
    const r = aplicarEstruturaOmie([pedido("3924")], {
      estrutura, vinculos, estoqueProdutos,
      decisoes: [{ codigo_produto: "3924", codigo_mp: "PRD11295", quantidade: 18.6, decisao: "ACEITO" }],
    });
    expect(motivos(r, "3924")).toEqual(["PESO_SUSPEITO"]);
  });

  it("até 5 kg não é suspeito", () => {
    const e = { produtos: [{ codigo_produto: "P" }], itens: [{ codigo_produto: "P", codigo_mp: "PRD11295", quantidade: 5 }] };
    const r = aplicarEstruturaOmie([pedido("P")], { estrutura: e, vinculos, estoqueProdutos: [{ codigo_produto: "P", fisico: 0, estoque_minimo: 1 }] });
    expect(r.pendencias).toEqual([]);
  });
});

describe("apoio", () => {
  it("mapa de materiais usa vínculos ativos e o código do material", () => {
    const m = criarMapaMateriais({
      vinculos: [{ material_id: 1, codigo_produto: "prd11295", ativo: true }, { material_id: 9, codigo_produto: "X", ativo: false }],
      materiais: [{ id: 6, codigo_omie: "1394" }],
    });
    expect(m.get("PRD11295")).toBe("1");
    expect(m.has("X")).toBe(false);
    expect(m.get("1394")).toBe("6");
  });

  it("mesmoPeso compara texto e número", () => {
    expect(mesmoPeso("1860", 1860)).toBe(true);
    expect(mesmoPeso("2.78", 2.7800001)).toBe(false);
  });
});
