// Executar com: node --test supabase/functions/sincronizar-dashboard-mp-omie/dashboard-mp-core.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parametrosPesquisa,
  janela,
  somarDias,
  dataBR,
  extrairItensPedidos,
  notasCandidatas,
  extrairItensNota,
  codigosPedidos,
  parametrosEncerrados,
} from "./dashboard-mp-core.mjs";

function pedido({
  numero,
  cod,
  etapa = "15",
  inclusao,
  previsao = inclusao,
  deptos = [["9069810185", 100]],
  itens,
  fornecedor = 2429376908,
}) {
  return {
    cabecalho_consulta: {
      nCodPed: cod,
      cNumero: numero,
      cEtapa: etapa,
      dIncData: inclusao,
      dDtPrevisao: previsao,
      nCodFor: fornecedor,
      cCodParc: "S01",
    },
    departamentos_consulta: deptos.map(([cCodDepto, nPerc]) => ({ cCodDepto, nPerc })),
    produtos_consulta: itens.map((i, n) => ({
      nCodItem: cod * 10 + n + 1,
      nCodProd: 1000 + n,
      cProduto: i.produto,
      cDescricao: i.descricao ?? i.produto,
      cUnidade: "KG",
      nQtde: i.qtd,
      nQtdeRec: i.rec ?? 0,
      nValUnit: i.unit ?? 0,
      nValMerc: i.merc ?? 0,
      nValorIpi: i.ipi ?? 0,
      nDesconto: 0,
      nFrete: 0,
      nDespesas: 0,
      nValTot: i.total,
    })),
  };
}

test("pesquisa: todas as situações menos cancelado", () => {
  const p = parametrosPesquisa(3, "01/12/2025", "31/12/2025");
  assert.equal(p.lExibirPedidosCancelados, "F");
  for (const s of [
    "Pendentes",
    "Recebidos",
    "RecParciais",
    "Faturados",
    "FatParciais",
    "Encerrados",
  ]) {
    assert.equal(p["lExibirPedidos" + s], "T", s);
  }
  assert.equal(p.nPagina, 3);
  assert.equal(p.lApenasAlterados, "F");
});

test("pesquisa incremental (incluídos/alterados) e só cancelados", () => {
  const inc = parametrosPesquisa(1, "15/10/2026", "22/10/2026", 100, true);
  assert.equal(inc.lApenasAlterados, "T");
  assert.equal(inc.lExibirPedidosCancelados, "F");
  assert.equal(inc.lExibirPedidosEncerrados, "T");
  const canc = parametrosPesquisa(1, "15/10/2026", "22/10/2026", 100, true, true);
  assert.equal(canc.lExibirPedidosCancelados, "T");
  for (const s of [
    "Pendentes",
    "Recebidos",
    "RecParciais",
    "Faturados",
    "FatParciais",
    "Encerrados",
  ]) {
    assert.equal(canc["lExibirPedidos" + s], "F", s);
  }
});

test("janela padrão de 60 dias até hoje (SP) e validação", () => {
  assert.deepEqual(janela({}, new Date("2026-10-22T15:00:00Z")), {
    de: "2026-08-23",
    ate: "2026-10-22",
  });
  assert.deepEqual(janela({ de: "2025-12-01", ate: "2025-12-31" }), {
    de: "2025-12-01",
    ate: "2025-12-31",
  });
  assert.throws(() => janela({ de: "2026-02-01", ate: "2026-01-01" }), /antes/);
  assert.throws(() => janela({ de: "01/12/2025" }), /inválido/);
  assert.equal(somarDias("2025-12-31", 1), "2026-01-01");
  assert.equal(dataBR("2026-10-05"), "05/10/2026");
});

test("pedidos: etapa 15, departamento 11, inclusão no período, todos os itens", () => {
  const nomes = new Map([["2429376908", "BERLIMPLAST"]]);
  const itens = extrairItensPedidos(
    [
      pedido({
        numero: "14926",
        cod: 1,
        inclusao: "16/10/2026",
        previsao: "23/10/2026",
        itens: [
          { produto: "prd11295", qtd: 12000, unit: 5.4, merc: 64800, total: 64800 },
          { produto: "BIGBAG", qtd: 10, total: 300 },
        ],
      }),
      pedido({
        numero: "ETAPA20",
        cod: 2,
        etapa: "20",
        inclusao: "16/10/2026",
        itens: [{ produto: "X", qtd: 1, total: 1 }],
      }),
      pedido({
        numero: "OUTRO_DEPTO",
        cod: 3,
        inclusao: "16/10/2026",
        deptos: [["9069810215", 100]],
        itens: [{ produto: "X", qtd: 1, total: 1 }],
      }),
      pedido({
        numero: "DEPTO_0",
        cod: 4,
        inclusao: "16/10/2026",
        deptos: [
          ["9069810185", 0],
          ["9069810215", 100],
        ],
        itens: [{ produto: "X", qtd: 1, total: 1 }],
      }),
      pedido({
        numero: "ANTES",
        cod: 5,
        inclusao: "30/09/2026",
        itens: [{ produto: "X", qtd: 1, total: 1 }],
      }),
      pedido({
        numero: "QTD0",
        cod: 6,
        inclusao: "16/10/2026",
        itens: [{ produto: "X", qtd: 0, total: 0 }],
      }),
    ],
    "2026-10-01",
    "2026-10-31",
    nomes,
  );

  assert.deepEqual(
    itens.map((i) => `${i.numero_pedido}:${i.codigo_produto}`),
    ["14926:PRD11295", "14926:BIGBAG"],
  );
  const pp = itens[0];
  assert.equal(pp.data_inclusao, "2026-10-16");
  assert.equal(pp.data_previsao, "2026-10-23");
  assert.equal(pp.fornecedor_nome, "BERLIMPLAST");
  assert.equal(pp.quantidade_recebida, 0);
  assert.equal(pp.valor_total, 64800);
  assert.equal(pp.percentual_departamento, 100);
});

test("pedidos: IPI separado e recebido parcial (quantidade recebida)", () => {
  const [i] = extrairItensPedidos(
    [
      pedido({
        numero: "14925",
        cod: 7,
        inclusao: "15/10/2026",
        itens: [
          {
            produto: "PRD11295",
            qtd: 12000,
            rec: 5000,
            unit: 6.2,
            merc: 74400,
            ipi: 2418,
            total: 76818,
          },
        ],
      }),
    ],
    "2026-10-01",
    "2026-10-31",
  );
  assert.equal(i.valor_mercadoria, 74400);
  assert.equal(i.valor_ipi, 2418);
  assert.equal(i.valor_total, 76818);
  assert.equal(i.quantidade_recebida, 5000);
});

test("incremental: sem período traz todos os do departamento 11; códigos de todos os lidos", () => {
  const lidos = [
    pedido({
      numero: "ANTIGO",
      cod: 21,
      inclusao: "10/03/2026",
      itens: [{ produto: "A", qtd: 1, total: 1 }],
    }),
    pedido({
      numero: "OUTRO_DEPTO",
      cod: 22,
      inclusao: "10/10/2026",
      deptos: [["9069809921", 100]],
      itens: [{ produto: "A", qtd: 1, total: 1 }],
    }),
  ];
  assert.deepEqual(
    extrairItensPedidos(lidos).map((i) => i.numero_pedido),
    ["ANTIGO"],
  );
  // os dois códigos vão para a gravação: o de outro departamento é removido se existia
  assert.deepEqual(codigosPedidos(lidos), [21, 22]);
});

test("pedido repetido entre páginas não duplica", () => {
  const p = pedido({
    numero: "R",
    cod: 8,
    inclusao: "15/10/2026",
    itens: [{ produto: "A", qtd: 1, total: 1 }],
  });
  assert.equal(extrairItensPedidos([p, p], "2026-10-01", "2026-10-31").length, 1);
});

test("notas candidatas: só fornecedores dos pedidos do departamento 11", () => {
  const lista = [
    { cabec: { nIdReceb: 1, nIdFornecedor: 2429376908 } },
    { cabec: { nIdReceb: 2, nIdFornecedor: 111 } },
    { cabec: { nIdReceb: 1, nIdFornecedor: 2429376908 } },
  ];
  assert.deepEqual(notasCandidatas(lista, new Set(["2429376908"])), [1]);
});

// NF 1184 BERLIMPLAST → pedido 640, recebida em 28/10/2022 (teste real de 22/10).
function nota({ cancelada = "N", recebido = "S", pedidoId = 7685164797 } = {}) {
  return {
    cabec: {
      nIdReceb: 7685683257,
      cNumeroNFe: "000001184",
      dEmissaoNFe: "25/10/2022",
      nIdFornecedor: 2429376908,
    },
    infoCadastro: {
      cCancelada: cancelada,
      cDevolvido: "N",
      cRecebido: recebido,
      dRec: "28/10/2022",
    },
    itensRecebimento: [
      {
        itensCabec: {
          nIdItem: 7685165055,
          nSequencia: 1,
          nIdPedido: pedidoId,
          nIdItPedido: 7685165055,
          nQtdeNFe: 12000,
          vTotalItem: 80535,
          cIgnorarItem: "N",
        },
        itensAjustes: { nQtdeRecebida: 12000 },
        itensInfoAdic: { nNumPedCompra: "640" },
      },
    ],
  };
}

test("nota: liga ao pedido, data de recebimento e número da NF", () => {
  const pedidos = new Map([["7685164797", "640"]]);
  const [i] = extrairItensNota(nota(), pedidos);
  assert.equal(i.cod_ped_compra, 7685164797);
  assert.equal(i.codigo_item, 7685165055);
  assert.equal(i.numero_pedido, "640");
  assert.equal(i.numero_nf, "000001184");
  assert.equal(i.data_emissao, "2022-10-25");
  assert.equal(i.data_recebimento, "2022-10-28");
  assert.equal(i.quantidade, 12000);
  assert.equal(i.id_item_nota, 1);
});

test("nota: pedido de outro departamento, cancelada ou ainda não recebida", () => {
  const pedidos = new Map([["7685164797", "640"]]);
  assert.equal(
    extrairItensNota(nota({ pedidoId: 999 }), pedidos).length,
    0,
    "pedido fora do departamento 11",
  );
  assert.equal(extrairItensNota(nota({ cancelada: "S" }), pedidos).length, 0, "NF cancelada");
  assert.equal(
    extrairItensNota(nota({ recebido: "N" }), pedidos)[0].data_recebimento,
    null,
    "sem data até receber",
  );
});

test("só encerrados, pela inclusão/alteração", () => {
  const p = parametrosEncerrados(2, "01/10/2026", "23/10/2026");
  assert.equal(p.lApenasAlterados, "T");
  assert.equal(p.lExibirPedidosEncerrados, "T");
  for (const s of [
    "Pendentes",
    "Recebidos",
    "RecParciais",
    "Faturados",
    "FatParciais",
    "Cancelados",
  ]) {
    assert.equal(p["lExibirPedidos" + s], "F", s);
  }
  assert.equal(p.nPagina, 2);
});

test("nota: IPI do item (itensIPI); sem IPI fica 0", () => {
  const pedidos = new Map([["7685164797", "640"]]);
  const n = nota();
  n.itensRecebimento[0].itensIPI = { nAliqIPI: 3.25, nValIPI: 2617.39 };
  const [i] = extrairItensNota(n, pedidos);
  assert.equal(i.aliquota_ipi, 3.25);
  assert.equal(i.valor_ipi, 2617.39);
  const [s] = extrairItensNota(nota(), pedidos);
  assert.equal(s.aliquota_ipi, 0);
});
