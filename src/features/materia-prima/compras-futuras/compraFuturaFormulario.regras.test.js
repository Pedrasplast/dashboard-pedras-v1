import { describe, expect, it } from "vitest";

import {
  FORMULARIO_VAZIO,
  criarFormulario,
  descreverStatusCompra,
  filtrarVinculosDoFornecedor,
  listarMateriaisDisponiveis,
  montarCompraDoFormulario,
  obterMaterialInicial,
  validarFormulario,
} from "./compraFuturaFormulario.regras";

const VALIDO = {
  ...FORMULARIO_VAZIO,
  dataCompra: "2026-10-01",
  dataPrevista: "2026-10-10",
  fornecedorId: "1",
  materialId: "2",
  tipoClassificacao: "A",
  quantidadeKg: "1000",
};

const RESUMO = { valorTotal: 100 };

describe("criarFormulario", () => {
  it("compra nova começa vazia, com as datas de hoje", () => {
    expect(criarFormulario(null, "2026-10-30")).toEqual({
      ...FORMULARIO_VAZIO,
      dataCompra: "2026-10-30",
      dataPrevista: "2026-10-30",
    });
  });

  it("edição respeita ativo=false e usa hoje quando falta data", () => {
    const formulario = criarFormulario({ ativo: false, fornecedorId: 7 }, "2026-10-30");

    expect(formulario.ativo).toBe(false);
    expect(formulario.fornecedorId).toBe("7");
    expect(formulario.dataCompra).toBe("2026-10-30");
    expect(formulario.materialId).toBe("");
  });
});

describe("materiais do fornecedor", () => {
  const vinculos = [
    { fornecedorId: 1, materialId: 10, padrao: false },
    { fornecedorId: 1, materialId: 11, padrao: true },
    { fornecedorId: 1, materialId: 12, ativo: false, padrao: true },
    { fornecedorId: 2, materialId: 13, padrao: true },
  ];

  it("ignora vínculos inativos e de outros fornecedores", () => {
    expect(filtrarVinculosDoFornecedor(vinculos, "1").map((v) => v.materialId)).toEqual([10, 11]);
  });

  it("escolhe o padrão, depois o primeiro, e vazio quando não há vínculo", () => {
    expect(obterMaterialInicial(filtrarVinculosDoFornecedor(vinculos, "1"))).toBe("11");
    expect(obterMaterialInicial([{ materialId: 10 }, { materialId: 11 }])).toBe("10");
    expect(obterMaterialInicial([])).toBe("");
  });

  it("material inativo só aparece se já estiver selecionado", () => {
    const materiais = [{ id: 10, ativo: false }, { id: 11 }];
    const ativos = filtrarVinculosDoFornecedor(vinculos, "1");

    expect(listarMateriaisDisponiveis(ativos, materiais, "").map((m) => m.id)).toEqual([11]);
    expect(listarMateriaisDisponiveis(ativos, materiais, "10")).toEqual([
      { id: 10, ativo: false, padrao: false },
      { id: 11, padrao: true },
    ]);
  });
});

describe("validarFormulario", () => {
  it.each([
    [{ dataCompra: "" }, "Informe a data da compra."],
    [{ dataPrevista: "" }, "Informe a previsão de chegada."],
    [{ dataPrevista: "2026-09-30" }, "A previsão não pode ser anterior à data da compra."],
    [{ fornecedorId: "" }, "Selecione o fornecedor."],
    [{ materialId: "" }, "Selecione o material."],
    [{ tipoClassificacao: "" }, "Selecione o tipo do material."],
    [{ quantidadeKg: "0" }, "Informe uma quantidade maior que zero."],
    [{ ipiPercentual: "101" }, "IPI: o valor máximo é 100."],
    [{ valorFrete: "-1" }, "Frete: o valor não pode ser negativo."],
    [{ precoUnitario: "abc" }, "Preço unitário: informe um valor numérico válido."],
  ])("%j", (alteracao, mensagem) => {
    expect(validarFormulario({ ...VALIDO, ...alteracao }, RESUMO)).toBe(mensagem);
  });

  it("recusa total negativo e aceita formulário válido", () => {
    expect(validarFormulario(VALIDO, { valorTotal: -1 })).toBe(
      "O valor total ficou negativo. Revise o desconto informado.",
    );
    expect(validarFormulario(VALIDO, RESUMO)).toBe("");
  });
});

describe("montarCompraDoFormulario", () => {
  it("compra nova nasce confirmada e converte os números", () => {
    const compra = montarCompraDoFormulario({ ...VALIDO, precoUnitario: "4,25" }, null);

    expect(compra.id).toBeNull();
    expect(compra.status).toBe("CONFIRMADA");
    expect(compra.quantidadeKg).toBe(1000);
    expect(compra.precoUnitario).toBe(4.25);
    expect(compra.dataRecebimento).toBeNull();
  });

  it("edição mantém recebida/cancelada e a data de recebimento", () => {
    const item = { id: 5, status: "RECEBIDA", dataRecebimento: "2026-10-05" };

    expect(montarCompraDoFormulario(VALIDO, item)).toMatchObject(item);
    expect(montarCompraDoFormulario(VALIDO, { status: "PENDENTE" }).status).toBe("CONFIRMADA");
  });
});

describe("descreverStatusCompra", () => {
  it("cai em Confirmada para qualquer outro status", () => {
    expect(descreverStatusCompra("RECEBIDA").nome).toBe("Recebida");
    expect(descreverStatusCompra("CANCELADA").nome).toBe("Cancelada");
    expect(descreverStatusCompra(undefined).nome).toBe("Confirmada");
  });
});
