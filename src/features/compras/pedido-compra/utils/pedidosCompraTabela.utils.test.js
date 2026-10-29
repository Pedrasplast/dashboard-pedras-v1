import { describe, expect, it } from "vitest";

import {
  calcularResumoRecebimentoFisicoVisual,
  montarClassesLinha,
  montarTituloRecebimentoFisico,
  obterCodigoItem,
  obterItensDocumentoTabela,
  obterItensVisiveis,
  obterNomeCategoria,
  obterSolicitante,
} from "./pedidosCompraTabela.utils";

describe("textos das células", () => {
  it("categoria, solicitante e código do item usam o primeiro valor preenchido", () => {
    expect(obterNomeCategoria({ categoria_nome: " ", categoria: "MP" })).toBe("MP");
    expect(obterNomeCategoria({})).toBe("-");

    expect(obterSolicitante({ contato: "Ana" })).toBe("Ana");
    expect(obterSolicitante({ snapshot: { contato: "Bia" } })).toBe("Bia");
    expect(obterSolicitante({ solicitante: "", contato: "Ana" })).toBe("-");

    expect(obterCodigoItem({ codigo_comercial: "A1", codigo_produto: 9 })).toBe("A1");
    expect(obterCodigoItem({ codigo_produto: 9 })).toBe("OMIE 9");
    expect(obterCodigoItem({})).toBe("-");
  });
});

describe("itens e linhas", () => {
  it("documento sem itens ganha um item vazio; recolhido mostra só o primeiro", () => {
    expect(obterItensDocumentoTabela({ documento_id: 5, itens: [] })).toEqual([
      { codigo_item: "vazio-5" },
    ]);

    expect(obterItensVisiveis([1, 2, 3], false)).toEqual([1]);
    expect(obterItensVisiveis([1, 2, 3], true)).toEqual([1, 2, 3]);
  });

  it("monta as classes do <tr>", () => {
    expect(montarClassesLinha({ primeiro: true, destacado: false })).toBe("compras-inicio-grupo");
    expect(montarClassesLinha({ primeiro: false, atrasado: true, destacado: true })).toBe(
      "compras-item-continuacao compras-linha-atrasada compras-grupo-destacado",
    );
  });
});

describe("calcularResumoRecebimentoFisicoVisual", () => {
  it("todos os itens recebidos no Omie: completo pelo Omie", () => {
    const pedido = {
      itens: [
        { quantidade: 10, quantidade_recebida: 10 },
        { quantidade: 5, quantidade_recebida: 7 },
      ],
    };

    expect(calcularResumoRecebimentoFisicoVisual(pedido, null)).toMatchObject({
      situacao_recebimento_fisico: "COMPLETO",
      origem_recebimento_visual: "OMIE",
      total_itens: 2,
      itens_completos: 2,
      omie_quantidade_recebida: 15,
      omie_quantidade_pedida: 15,
    });
  });

  it("parcial no Omie e no manual: origem dos dois", () => {
    const pedido = { itens: [{ quantidade: 10, quantidade_recebida: 4 }] };

    expect(
      calcularResumoRecebimentoFisicoVisual(pedido, {
        situacao_recebimento_fisico: "PARCIAL",
        itens_completos: 0,
      }),
    ).toMatchObject({
      situacao_recebimento_fisico: "PARCIAL",
      origem_recebimento_visual: "OMIE_E_MANUAL",
    });
  });

  it("sem recebimento no Omie, vale o manual", () => {
    const pedido = { itens: [{ quantidade: 10, quantidade_recebida: 0 }] };

    expect(
      calcularResumoRecebimentoFisicoVisual(pedido, { situacao_recebimento_fisico: "COMPLETO" }),
    ).toMatchObject({
      situacao_recebimento_fisico: "COMPLETO",
      origem_recebimento_visual: "MANUAL",
    });

    expect(calcularResumoRecebimentoFisicoVisual(pedido, null)).toMatchObject({
      situacao_recebimento_fisico: "NAO_RECEBIDO",
      origem_recebimento_visual: "NENHUMA",
    });
  });
});

describe("montarTituloRecebimentoFisico", () => {
  it("lista Omie e última movimentação, uma por linha", () => {
    expect(
      montarTituloRecebimentoFisico({
        situacao_recebimento_fisico: "PARCIAL",
        origem_recebimento_visual: "OMIE",
        omie_quantidade_recebida: 4,
        omie_quantidade_pedida: 10,
        ultima_movimentacao_em: "2026-10-28T13:05:00",
        ultima_movimentacao_usuario: "",
        ultima_movimentacao_produto: "Resina",
      }).split("\n"),
    ).toEqual([
      "Recebimento parcial identificado no Omie",
      "Omie: 4,00 de 10,00",
      expect.stringMatching(/^Última movimentação física: /),
      "Por: -",
      "Item: Resina",
    ]);
  });

  it("sem nada registrado", () => {
    expect(montarTituloRecebimentoFisico(null)).toBe("Nenhum recebimento registrado");
  });
});
