// Executar com: node --test supabase/functions/cron-pedidos-compra-omie/index.test.mjs
// Carrega o index.ts real (transpilado com esbuild), com Deno e fetch simulados,
// e testa pesquisarOmie diante das respostas do Omie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const aqui = fileURLToPath(new URL('.', import.meta.url));
const fonte = readFileSync(join(aqui, 'index.ts'), 'utf8')
  .replace("import {createClient} from 'npm:@supabase/supabase-js@2';", 'const createClient = () => ({});');
const { code } = transformSync(fonte + '\nexport { pesquisarOmie, semRegistros, conferenciaRapida };', { loader: 'ts', format: 'esm' });
const arquivo = join(mkdtempSync(join(tmpdir(), 'cron-pc-')), 'mod.mjs');
writeFileSync(arquivo, code);

globalThis.Deno = { serve() {}, env: { get() { return undefined; } } };
let respostas = [];
const chamadas = [];
globalThis.fetch = async (_url, init) => {
  chamadas.push(JSON.parse(init.body).param[0]);
  const corpo = respostas.shift();
  return { ok: !corpo.faultstring, status: corpo.faultstring ? 500 : 200, json: async () => corpo };
};
const { pesquisarOmie, semRegistros, conferenciaRapida } = await import(pathToFileURL(arquivo));

const SEM_REGISTROS = { faultstring: 'ERROR: Não existem registros para a página [1]!', faultcode: 'SOAP-ENV:Client-5113' };

test('detecta a mensagem do Omie com e sem acento', () => {
  assert.equal(semRegistros('ERROR: Não existem registros para a página [1]!'), true);
  assert.equal(semRegistros('ERROR: Nao existem registros para a pagina [1]!'), true);
  assert.equal(semRegistros('Consumo redundante detectado'), false);
});

test('incremental: "sem registros" vira lista vazia (não é erro)', async () => {
  respostas = [SEM_REGISTROS];
  const r = await pesquisarOmie(1, 'k', 's', true, '2026-10-20T10:00:00Z');
  assert.deepEqual(r, { nPagina: 1, nTotalPaginas: 0, nTotalRegistros: 0, pedidos_pesquisa: [] });
});

test('conferência completa: "sem registros" continua sendo erro', async () => {
  respostas = [SEM_REGISTROS];
  await assert.rejects(() => pesquisarOmie(1, 'k', 's', false), /Não existem registros/);
});

test('incremental: outros erros do Omie continuam sendo erro', async () => {
  respostas = [{ faultstring: 'ERROR: Chave de acesso inválida' }];
  await assert.rejects(() => pesquisarOmie(1, 'k', 's', true, null), /Chave de acesso/);
});

test('incremental: resposta normal passa sem alteração', async () => {
  const normal = { nPagina: 1, nTotalPaginas: 1, nTotalRegistros: 1, pedidos_pesquisa: [{ x: 1 }] };
  respostas = [normal];
  assert.deepEqual(await pesquisarOmie(1, 'k', 's', true, null), normal);
});

// --- Conferência rápida da coluna Aprovação --------------------------------

function pedido(codigo, numero, etapa = '15') {
  return {
    cabecalho_consulta: { nCodPed: codigo, cNumero: numero, cEtapa: etapa },
    produtos_consulta: [{ nCodItem: 1, nCodProd: 9, nQtde: 1, nQtdeRec: 0, nValUnit: 10, nValTot: 10 }],
    parcelas_consulta: [], departamentos_consulta: [], caracteristicas_consulta: [],
  };
}
const pagina = (lista, total = 1) => ({ nPagina: 1, nTotalPaginas: total, nTotalRegistros: lista.length, pedidos_pesquisa: lista });

function bancoFalso(resultadoConciliacao = { revisao_necessaria: false, escondidos: 0, numeros_escondidos: [] }) {
  const rpcs = [];
  return {
    rpcs,
    rpc: async (nome, args) => {
      rpcs.push({ nome, args });
      if (nome === 'registrar_lote_pedidos_compra_omie') return { data: { novas: 0, alteradas: 0, iguais: args.p_pedidos.length }, error: null };
      return { data: resultadoConciliacao, error: null };
    },
  };
}

test('conferência rápida: grava recebidos e abertos e concilia só a etapa 15', async () => {
  chamadas.length = 0;
  respostas = [
    SEM_REGISTROS, // nenhum recebido alterado nos últimos 7 dias
    pagina([pedido(101, '15051'), pedido(102, '15043', '10'), pedido(103, '14927')]),
  ];
  const db = bancoFalso();
  const r = await conferenciaRapida(db, 'k', 's');
  assert.equal(r.ok, true);
  assert.equal(r.abertos_omie, 2);
  const conc = db.rpcs.find((x) => x.nome === 'conciliar_rapida_pedidos_compra_aprovacao');
  assert.deepEqual(conc.args.p_codigos, [101, 103]);
  // 1ª chamada: só recebidos, com período; 2ª: abertos, sem período.
  assert.equal(chamadas[0].lExibirPedidosRecebidos, 'S');
  assert.equal(chamadas[0].lExibirPedidosPendentes, 'N');
  assert.equal(chamadas[0].lApenasAlterados, true);
  assert.equal(chamadas[1].lExibirPedidosRecebidos, 'N');
  assert.equal(chamadas[1].lExibirPedidosPendentes, 'S');
  assert.equal(chamadas[1].lExibirPedidosCancelados, 'N');
  assert.equal(chamadas[1].lExibirPedidosEncerrados, 'N');
  assert.equal(chamadas[1].dDataInicial, undefined);
});

test('conferência rápida: lê todas as páginas dos abertos antes de conciliar', async () => {
  respostas = [SEM_REGISTROS, pagina([pedido(1, '1')], 2), pagina([pedido(2, '2')], 2)];
  const db = bancoFalso();
  await conferenciaRapida(db, 'k', 's');
  const conc = db.rpcs.find((x) => x.nome === 'conciliar_rapida_pedidos_compra_aprovacao');
  assert.deepEqual(conc.args.p_codigos, [1, 2]);
});

test('conferência rápida: lista de abertos vazia não concilia nada', async () => {
  respostas = [SEM_REGISTROS, SEM_REGISTROS];
  const db = bancoFalso();
  const r = await conferenciaRapida(db, 'k', 's');
  assert.equal(r.ok, false);
  assert.equal(db.rpcs.some((x) => x.nome === 'conciliar_rapida_pedidos_compra_aprovacao'), false);
});

test('conferência rápida: paginação inconsistente interrompe sem conciliar', async () => {
  respostas = [SEM_REGISTROS, pagina([pedido(1, '1')], 2), pagina([pedido(2, '2')], 3)];
  const db = bancoFalso();
  await assert.rejects(() => conferenciaRapida(db, 'k', 's'), /Paginação inconsistente/);
  assert.equal(db.rpcs.some((x) => x.nome === 'conciliar_rapida_pedidos_compra_aprovacao'), false);
});

test('conferência rápida: trava do banco é repassada como não aplicada', async () => {
  respostas = [SEM_REGISTROS, pagina([pedido(1, '1')])];
  const db = bancoFalso({ revisao_necessaria: true, motivo: 'Quantidade anormal' });
  const r = await conferenciaRapida(db, 'k', 's');
  assert.equal(r.ok, false);
});
