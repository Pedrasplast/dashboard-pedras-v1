// Executar com: node --test supabase/functions/sincronizar-precos-compras-mp-omie/precos-core.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parametrosPesquisa, periodo, extrairItens, calcularMedias, dataISO } from './precos-core.mjs';

const MATERIAIS = new Set(['PRD11295', 'PRD12455']);

function pedido({ numero, cod, etapa = '15', inclusao, deptos = [['9069810185', 100]], itens }) {
  return {
    cabecalho_consulta: { nCodPed: cod, cNumero: numero, cEtapa: etapa, dIncData: inclusao },
    departamentos_consulta: deptos.map(([cCodDepto, nPerc]) => ({ cCodDepto, nPerc })),
    produtos_consulta: itens.map(([cProduto, nQtde, nValTot], i) => ({
      nCodItem: cod * 10 + i + 1, nCodProd: 1000 + i, cProduto, nQtde, nQtdeRec: 0, nValTot,
    })),
  };
}

test('pesquisa: todas as situações menos cancelado (inclui encerrados)', () => {
  const p = parametrosPesquisa(2, '23/08/2026', '22/10/2026');
  assert.equal(p.lExibirPedidosCancelados, 'F');
  for (const s of ['Pendentes', 'Recebidos', 'RecParciais', 'Faturados', 'FatParciais', 'Encerrados']) {
    assert.equal(p['lExibirPedidos' + s], 'T', s);
  }
  assert.equal(p.nPagina, 2);
});

test('período de 60 dias no fuso de São Paulo', () => {
  // 22/10 01:00 em SP ainda é 22/10 (UTC 04:00)
  const r = periodo(new Date('2026-10-22T04:00:00Z'), 60);
  assert.deepEqual(r, { inicio: '23/08/2026', fim: '22/10/2026', inicioIso: '2026-08-23', fimIso: '2026-10-22' });
  // 22/10 23:30 em SP já é 23/10 em UTC, mas a data local continua 22/10
  assert.equal(periodo(new Date('2026-10-23T02:30:00Z'), 60).fim, '22/10/2026');
  assert.equal(dataISO('05/10/2026'), '2026-10-05');
  assert.equal(dataISO('2026-10-05'), null);
});

test('filtros da regra: etapa, departamento, material, quantidade e data de inclusão', () => {
  const pedidos = [
    pedido({ numero: 'OK', cod: 1, inclusao: '16/10/2026', itens: [['PRD11295', 12000, 64800], ['XYZ', 5, 50]] }),
    pedido({ numero: 'ETAPA', cod: 2, etapa: '20', inclusao: '16/10/2026', itens: [['PRD11295', 1, 1]] }),
    pedido({ numero: 'DEPTO', cod: 3, inclusao: '16/10/2026', deptos: [['9069810215', 100]], itens: [['PRD11295', 1, 1]] }),
    pedido({ numero: 'DEPTO0', cod: 4, inclusao: '16/10/2026', deptos: [['9069810185', 0], ['9069810215', 100]], itens: [['PRD11295', 1, 1]] }),
    pedido({ numero: 'ANTIGO', cod: 5, inclusao: '22/08/2026', itens: [['PRD11295', 1, 1]] }),
    pedido({ numero: 'FUTURO', cod: 6, inclusao: '23/10/2026', itens: [['PRD11295', 1, 1]] }),
    pedido({ numero: 'QTD0', cod: 7, inclusao: '16/10/2026', itens: [['PRD11295', 0, 0]] }),
    pedido({ numero: 'MISTO', cod: 8, inclusao: '01/10/2026', deptos: [['9069810185', 40], ['9069810215', 60]], itens: [['prd12455', 100, 165]] }),
  ];
  const itens = extrairItens(pedidos, MATERIAIS, '2026-08-23', '2026-10-22');
  assert.deepEqual(itens.map((i) => i.numero_pedido), ['OK', 'MISTO']);
  assert.equal(itens[0].quantidade, 12000);
  assert.equal(itens[0].valor_total, 64800);
  assert.equal(itens[0].data_inclusao, '2026-10-16');
  assert.equal(itens[1].codigo_produto, 'PRD12455', 'código em maiúsculas');
});

test('médias ponderadas reproduzem o teste do usuário (PE/PET 4 compras, R$ 1,65)', () => {
  const pedidos = [
    pedido({ numero: '14664', cod: 11, inclusao: '24/09/2026', itens: [['PRD12455', 5700, 11400]] }),
    pedido({ numero: '14670', cod: 12, inclusao: '24/09/2026', itens: [['PRD12455', 5700, 11400]] }),
    pedido({ numero: '14723', cod: 13, inclusao: '01/10/2026', itens: [['PRD12455', 5700, 11400]] }),
    pedido({ numero: '14802', cod: 14, inclusao: '06/10/2026', itens: [['PRD12455', 6400, 4480]] }),
    pedido({ numero: '14588', cod: 15, inclusao: '17/09/2026', itens: [['PRD12455', 5700, 11400]] }),
  ];
  const itens = extrairItens(pedidos, MATERIAIS, '2026-08-23', '2026-10-22');
  const m = calcularMedias(itens, '2026-10-22').PRD12455;
  assert.equal(m['30d'].compras, 4);
  assert.equal(m['30d'].quantidade, 23500);
  assert.equal(m['30d'].media.toFixed(2), '1.65');
  assert.equal(m['45d'].compras, 5, '17/09 entra só na de 45 e 60 dias');
  assert.equal(m['60d'].compras, 5);
});

test('item sem código no Omie interrompe (não grava dado incompleto)', () => {
  const p = pedido({ numero: 'X', cod: 9, inclusao: '16/10/2026', itens: [['PRD11295', 1, 1]] });
  p.produtos_consulta[0].nCodItem = null;
  assert.throws(() => extrairItens([p], MATERIAIS, '2026-08-23', '2026-10-22'), /sem código/);
});
