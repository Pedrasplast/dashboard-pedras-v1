import { test } from "node:test";
import assert from "node:assert/strict";
import {
  codigosProdutos,
  ehMateriaPrima,
  extrairEstrutura,
  falhaTemporaria,
  ordemLeitura,
  semEstrutura,
} from "./estrutura-core.mjs";

// Resposta real do produto 11234 (23/10), resumida.
const R11234 = {
  ident: { codProduto: "11234", descrProduto: "REFORÇO 1310", idProduto: 8924701652 },
  itens: [
    {
      codProdMalha: "11217",
      descrFamMalha: "Produto Acabado",
      idMalha: 9162219545,
      idProdMalha: 8923640873,
      quantProdMalha: 1,
      tipoProdMalha: "04",
      unidProdMalha: "UN",
      percPerdaProdMalha: 0,
    },
    {
      codProdMalha: "8147",
      descrFamMalha: "Produto Acabado",
      idMalha: 9162219594,
      idProdMalha: 8572636228,
      quantProdMalha: 1,
      tipoProdMalha: "04",
      unidProdMalha: "UN",
      percPerdaProdMalha: 0,
    },
    {
      codProdMalha: "PRD11295",
      descrFamMalha: "Matéria Prima",
      descrProdMalha: "PP - (PRETO)",
      idMalha: 9237560167,
      idProdMalha: 8953878292,
      quantProdMalha: 2.78,
      tipoProdMalha: "01",
      unidProdMalha: "KG",
      percPerdaProdMalha: 0,
    },
  ],
};

test("só a matéria-prima do primeiro nível entra", () => {
  const { produto, itens } = extrairEstrutura("11234", R11234);
  assert.equal(produto.total_itens, 3);
  assert.equal(produto.id_produto_omie, 8924701652);
  assert.equal(itens.length, 1);
  assert.equal(itens[0].codigo_mp, "PRD11295");
  assert.equal(itens[0].codigo_mp_omie, 8953878292);
  assert.equal(itens[0].quantidade, 2.78);
});

test("família Matéria Prima conta mesmo sem tipo 01", () => {
  assert.equal(ehMateriaPrima({ tipoProdMalha: "", descrFamMalha: "MATERIA PRIMA" }), true);
  assert.equal(ehMateriaPrima({ tipoProdMalha: "04", descrFamMalha: "Produto Acabado" }), false);
});

test("produto sem estrutura gera registro sem itens", () => {
  const { produto, itens } = extrairEstrutura("10465", { ident: {}, itens: [] });
  assert.equal(produto.total_itens, 0);
  assert.equal(itens.length, 0);
  const comErro = extrairEstrutura("X", null, "Estrutura não encontrada");
  assert.equal(comErro.produto.erro, "Estrutura não encontrada");
});

test("códigos distintos e ordem de leitura (nunca lidos primeiro)", () => {
  assert.deepEqual(
    codigosProdutos([
      { codigo_produto: " 3924 " },
      { codigo_produto: "3924" },
      { codigo_produto: "11234" },
      {},
    ]),
    ["3924", "11234"],
  );
  const ordem = ordemLeitura(
    ["A", "B", "C"],
    [
      { codigo_produto: "A", sincronizado_em: "2026-10-23T10:00:00Z" },
      { codigo_produto: "B", sincronizado_em: "2026-10-22T10:00:00Z" },
    ],
  );
  assert.deepEqual(ordem, ["C", "B", "A"]);
});

test("classificação das falhas do Omie", () => {
  assert.equal(semEstrutura("Estrutura do produto não encontrada!"), true);
  assert.equal(falhaTemporaria("Consumo redundante detectado"), true);
  assert.equal(falhaTemporaria("ERROR: Tipo de Dado 38041"), true);
  assert.equal(semEstrutura("Consumo redundante"), false);
});
