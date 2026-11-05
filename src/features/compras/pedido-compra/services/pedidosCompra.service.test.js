import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * Simula o client do Supabase registrando cada consulta feita
 * (tabela + colunas) e devolvendo dados fixos por tabela.
 */
const consultas = [];

/*
 * Versão devolvida pela RPC versao_compras_documentos.
 * null = RPC indisponível (comportamento antigo: carga completa).
 */
let versaoAtual = null;
let chamadasNomes = 0;

const dadosPorTabela = {
  sincronizacao_pedidos_compra_omie: {
    id: 1,
    status: "sucesso",
    finalizado_em: "2026-10-20T11:00:00Z",
  },
  compras_documentos_front: [
    {
      documento_id: "P-100",
      tipo_documento: "PEDIDO",
      numero_documento: "123",
      cod_ped_compra: 100,
      numero_pedido: "123",
      codigo_fornecedor: "55",
      codigo_comprador: "9",
      quantidade_itens: 1,
      solicitante: "Maria Compras",
    },
    {
      documento_id: "R-200",
      tipo_documento: "REQUISICAO",
      numero_documento: "7",
      cod_req_compra: 200,
      numero_requisicao: 7,
      quantidade_itens: 0,
      solicitante: null,
    },
  ],
  compras_documentos_itens_front: [
    {
      documento_id: "P-100",
      codigo_item: 1,
      descricao: "PP HOMOPOLIMERO",
      quantidade: 1000,
      quantidade_recebida: 0,
      valor_total: 9000,
      sequencia: 1,
    },
  ],
  pedidos_compra_fornecedores: [{ codigo: "55", nome: "Berlimplast" }],
};

function criarConsulta(tabela) {
  const consulta = {
    select(colunas) {
      consultas.push({ tabela, colunas });
      return consulta;
    },
    order: () => consulta,
    eq: () => consulta,
    range: async () => ({
      data: dadosPorTabela[tabela],
      error: null,
    }),
    maybeSingle: async () => ({
      data: dadosPorTabela[tabela],
      error: null,
    }),
  };
  return consulta;
}

vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: (tabela) => criarConsulta(tabela),
    rpc: async () =>
      versaoAtual ? { data: versaoAtual, error: null } : { data: null, error: { message: "sem rpc" } },
    functions: {
      invoke: async () => {
        chamadasNomes += 1;
        return {
          data: { fornecedores: {}, compradores: { 9: "Joao" } },
          error: null,
        };
      },
    },
  },
}));

const { buscarPedidosCompra, COLUNAS_DOCUMENTOS_COMPRA, limparCacheMemoriaPedidosCompra } =
  await import("./pedidosCompra.service");

describe("buscarPedidosCompra (economia de egress)", () => {
  beforeEach(() => {
    consultas.length = 0;
    versaoAtual = null;
    limparCacheMemoriaPedidosCompra();
  });

  it("nao baixa o JSON snapshot nem a coluna solicitante", () => {
    const colunas = COLUNAS_DOCUMENTOS_COMPRA.split(",");
    expect(colunas).not.toContain("snapshot");
    expect(colunas).not.toContain("solicitante");
  });

  it("nenhuma consulta da tela pede snapshot ou select=*", async () => {
    await buscarPedidosCompra();

    expect(consultas.length).toBeGreaterThan(0);
    for (const { tabela, colunas } of consultas) {
      expect(colunas, tabela).not.toMatch(/\bsnapshot\b/);
      expect(colunas, tabela).not.toBe("*");
    }
  });

  it("mantem os dados que a tabela exibe", async () => {
    const { pedidos, atualizadoEm } = await buscarPedidosCompra();

    const pedido = pedidos.find((p) => p.documento_id === "P-100");
    expect(pedido.fornecedor_nome).toBe("Berlimplast");
    expect(pedido.itens).toHaveLength(1);

    const requisicao = pedidos.find((p) => p.documento_id === "R-200");
    expect(requisicao).toBeDefined();
    expect(requisicao.itens).toHaveLength(0);

    expect(atualizadoEm).toBe("2026-10-20T11:00:00Z");
  });
});

describe("buscarPedidosCompra (só baixa a lista quando a versão muda)", () => {
  const tabelasPesadas = ["compras_documentos_front", "compras_documentos_itens_front"];
  const baixouListaPesada = () => consultas.some(({ tabela }) => tabelasPesadas.includes(tabela));

  beforeEach(() => {
    consultas.length = 0;
    chamadasNomes = 0;
    versaoAtual = null;
    limparCacheMemoriaPedidosCompra();
  });

  it("sem RPC de versão, faz a carga completa toda vez (comportamento antigo)", async () => {
    await buscarPedidosCompra();
    expect(baixouListaPesada()).toBe(true);

    consultas.length = 0;
    await buscarPedidosCompra();
    expect(baixouListaPesada()).toBe(true);
  });

  it("com a mesma versão, a segunda leitura não baixa documentos nem itens", async () => {
    versaoAtual = "v1";

    const primeira = await buscarPedidosCompra();
    expect(baixouListaPesada()).toBe(true);

    consultas.length = 0;
    const segunda = await buscarPedidosCompra();

    expect(baixouListaPesada()).toBe(false);
    expect(segunda.pedidos).toEqual(primeira.pedidos);
    expect(chamadasNomes).toBe(1);
  });

  it("estado da sincronização continua sendo lido mesmo sem mudança", async () => {
    versaoAtual = "v1";
    await buscarPedidosCompra();

    consultas.length = 0;
    const { atualizadoEm } = await buscarPedidosCompra();

    expect(consultas.map((c) => c.tabela)).toContain("sincronizacao_pedidos_compra_omie");
    expect(atualizadoEm).toBe("2026-10-20T11:00:00Z");
  });

  it("quando a versão muda, baixa a lista de novo", async () => {
    versaoAtual = "v1";
    await buscarPedidosCompra();

    versaoAtual = "v2";
    consultas.length = 0;
    await buscarPedidosCompra();

    expect(baixouListaPesada()).toBe(true);
  });
});
