import { describe, expect, it, vi } from "vitest";

/*
 * Simula o client do Supabase devolvendo dados fixos por tabela.
 * As consultas são encadeadas (.select().eq()), então o objeto
 * se devolve e só resolve quando é aguardado.
 */
const dadosPorTabela = {
  telas_sistema: [
    { id: 1, chave: "pedidos", ativo: true },
    { id: 2, chave: "estoque", ativo: true },
    { id: 3, chave: " financeiro ", ativo: true },
  ],
  usuario_permissoes: [
    { tela_id: 1, permitido: true },
    { tela_id: 2, permitido: false },
    { tela_id: 3, permitido: true },
    { tela_id: 99, permitido: true },
  ],
  relatorios_sistema: [
    { id: "10", chave: " pedidos_abertos ", ativo: true },
    { id: "11", chave: "estoque_atual", ativo: true },
    { id: "12", chave: null, ativo: true },
  ],
  usuario_relatorio_permissoes: [
    { relatorio_id: 10, permitido: true },
    { relatorio_id: 11, permitido: false },
    { relatorio_id: 12, permitido: true },
  ],
};

let tabelaComErro = null;

function criarConsulta(tabela) {
  const resposta = () =>
    tabela === tabelaComErro
      ? { data: null, error: new Error(`falha em ${tabela}`) }
      : { data: dadosPorTabela[tabela], error: null };

  const consulta = {
    select: () => consulta,
    eq: () => consulta,
    then: (resolver, rejeitar) => Promise.resolve(resposta()).then(resolver, rejeitar),
  };

  return consulta;
}

vi.mock("./supabaseClient", () => ({
  supabase: {
    from: (tabela) => criarConsulta(tabela),
  },
}));

const { buscarPermissoesUsuario } = await import("./permissoesService");

describe("buscarPermissoesUsuario", () => {
  it("libera só as telas permitidas, com a chave como está no banco", async () => {
    tabelaComErro = null;

    const { telas } = await buscarPermissoesUsuario("usuario-1");

    expect([...telas].sort()).toEqual([" financeiro ", "pedidos"]);
  });

  it("libera só os relatórios permitidos, com a chave sem espaços nas pontas", async () => {
    tabelaComErro = null;

    const { relatorios } = await buscarPermissoesUsuario("usuario-1");

    expect([...relatorios]).toEqual(["pedidos_abertos"]);
  });

  it("propaga o erro de qualquer consulta", async () => {
    tabelaComErro = "usuario_relatorio_permissoes";

    await expect(buscarPermissoesUsuario("usuario-1")).rejects.toThrow(
      "falha em usuario_relatorio_permissoes",
    );

    tabelaComErro = null;
  });
});
