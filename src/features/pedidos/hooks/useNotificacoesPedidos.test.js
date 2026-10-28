import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabaseClient", () => ({ supabase: {} }));

const { montarAlertaPedido, obterTipoNotificacao } = await import("./useNotificacoesPedidos");

describe("obterTipoNotificacao", () => {
  it("usa o tipo da última ocorrência antes do tipo da notificação", () => {
    expect(obterTipoNotificacao({ tipo_ultima_ocorrencia: " ALTERADO ", tipo: "novo" })).toBe(
      "alterado",
    );
  });

  it("trata qualquer outro valor (ou nenhum) como novo", () => {
    expect(obterTipoNotificacao({ tipo: "cancelado" })).toBe("novo");
    expect(obterTipoNotificacao(null)).toBe("novo");
  });
});

describe("montarAlertaPedido", () => {
  it("monta o alerta de pedido alterado com o resumo padrão", () => {
    expect(
      montarAlertaPedido({
        id: 7,
        codigo_pedido_omie: 123,
        numero_pedido: "4567",
        cliente: "Cliente X",
        vendedor: "Ana",
        tipo: "alterado",
        campos_alterados: ["quantidade"],
      }),
    ).toEqual({
      id: 7,
      codigoPedidoOmie: 123,
      numeroPedido: "4567",
      cliente: "Cliente X",
      vendedor: "Ana",
      tipo: "alterado",
      resumo: "Pedido alterado",
      camposAlterados: ["quantidade"],
    });
  });

  it("mantém o resumo enviado e ignora campos alterados que não são lista", () => {
    const alerta = montarAlertaPedido({ resumo: "Chegou", campos_alterados: "x" });

    expect(alerta.tipo).toBe("novo");
    expect(alerta.resumo).toBe("Chegou");
    expect(alerta.camposAlterados).toEqual([]);
  });
});
