import { describe, expect, it } from "vitest";

import { montarBlocoHistorico, montarValoresResumo } from "./linhasExcelPedidosAlterados";

const formatar = (valor) => (valor ? `F(${valor})` : "-");

describe("montarValoresResumo", () => {
  it("monta as 7 colunas do Resumo com os valores padrão", () => {
    expect(
      montarValoresResumo(
        {
          codigo_pedido_omie: 555,
          cliente: "ACME",
          primeira_alteracao: "a",
          quantidade_alteracoes: "3",
          campos_alterados: ["Previsão", "Valor"],
        },
        formatar,
      ),
    ).toEqual([555, "ACME", "-", "F(a)", "-", 3, "Previsão, Valor"]);

    expect(montarValoresResumo({ campos_alterados: [] }, formatar).at(-1)).toBe("-");
  });
});

describe("montarBlocoHistorico", () => {
  it("numera as ocorrências da mais nova para a mais antiga, uma linha por campo", () => {
    const extrair = (ocorrencia) => ocorrencia.mudancas;

    const bloco = montarBlocoHistorico(
      {
        numero_pedido: "100",
        cliente: "ACME",
        quantidade_alteracoes: 2,
        detalhes_alteracoes: [
          {
            alterado_em: "d2",
            mudancas: [
              { campo: "Previsão", anterior: "1", novo: "2" },
              { campo: "Valor", anterior: "3", novo: "4" },
            ],
          },
          { alterado_em: "d1", resumo: "", mudancas: [] },
        ],
      },
      extrair,
      formatar,
    );

    expect(bloco.titulo).toBe("PEDIDO 100");
    expect(bloco.informacoes).toBe("Cliente: ACME   |   Vendedor: -   |   Total de alterações: 2");
    expect(bloco.linhas).toEqual([
      { tipo: "mudanca", valores: ["Alteração #2", "F(d2)", "Previsão", "1", "2"] },
      { tipo: "mudanca", valores: ["Alteração #2", "F(d2)", "Valor", "3", "4"] },
      {
        tipo: "sem-mudanca",
        valores: ["Alteração #1", "F(d1)", "Alteração registrada", "-", "-"],
      },
    ]);
  });

  it("pedido sem ocorrências mostra o último resumo", () => {
    expect(montarBlocoHistorico({ ultimo_resumo: "" }, () => [], formatar).linhas).toEqual([
      { tipo: "sem-detalhe", texto: "Alteração registrada sem detalhamento." },
    ]);
  });
});
