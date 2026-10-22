// Executar com: node --test supabase/functions/sincronizar-requisicoes-compra-omie/index.test.mjs
// Carrega o index.ts real (transpilado com esbuild), com Deno, fetch e espera
// simulados, e testa a busca do número da requisição na auditoria do Omie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const aqui = fileURLToPath(new URL('.', import.meta.url));
const fonte = readFileSync(join(aqui, 'index.ts'), 'utf8')
  .replace('import { createClient } from "npm:@supabase/supabase-js@2";', 'const createClient = () => ({});')
  // Sem espera real nos testes.
  .replace('return new Promise((resolve) => setTimeout(resolve, ms));', 'esperas.push(ms); return Promise.resolve();');
const { code } = transformSync(
  'export const esperas = [];\n' + fonte +
  '\nexport { callOmie, obterNumeroRequisicaoPelaAuditoria, AUDITORIA_MAX_PAGINAS, AUDITORIA_TENTATIVAS, AUDITORIA_TIMEOUT_MS, AUDITORIA_PRAZO_TOTAL_MS };',
  { loader: 'ts', format: 'esm' },
);
const arquivo = join(mkdtempSync(join(tmpdir(), 'req-')), 'mod.mjs');
writeFileSync(arquivo, code);

globalThis.Deno = { serve() {}, env: { get() { return undefined; } } };
let chamadas = [];
let responder = () => ({ eventos: [], total_de_paginas: 1 });
globalThis.fetch = async (_url, opcoes) => {
  const corpo = JSON.parse(opcoes.body);
  chamadas.push(corpo);
  const r = responder(corpo, chamadas.length);
  if (r instanceof Error) throw r;
  return { ok: !r.faultstring, status: r.status ?? (r.faultstring ? 500 : 200), json: async () => r };
};

const mod = await import(pathToFileURL(arquivo));
const { obterNumeroRequisicaoPelaAuditoria, callOmie, esperas } = mod;

function reiniciar(fn) {
  chamadas = [];
  esperas.length = 0;
  responder = fn;
}

test('acha o número na resposta real do Omie de 22/10 (requisição 14983)', async () => {
  reiniciar(() => ({
    pagina: 1, total_de_paginas: 1, registros: 1, total_de_registros: 1,
    eventos: [{
      codigo_registro: '9238177705', operacao: 'I',
      campos: [
        { campo: 'BLOQUEADO', rotulo: 'Bloqueado', valor_anterior: null, valor_novo: 'N' },
        { campo: 'NUMERO', rotulo: 'Número da Requisição', valor_anterior: null, valor_novo: '000000000014983' },
        { campo: 'OPERACAO', rotulo: 'Operação', valor_anterior: null, valor_novo: '21' },
      ],
    }],
  }));
  assert.equal(await obterNumeroRequisicaoPelaAuditoria(9238177705, 'k', 's'), 14983);
  assert.equal(chamadas.length, 1);
});

test('limites cabem no prazo da Edge Function (150 s)', () => {
  // pior caso: uma busca começa com o prazo quase esgotado e usa o timeout inteiro,
  // mais ~15 s do resto da sincronização.
  const piorCaso = mod.AUDITORIA_PRAZO_TOTAL_MS + mod.AUDITORIA_TIMEOUT_MS * mod.AUDITORIA_TENTATIVAS + 15000;
  assert.ok(piorCaso < 150000, `pior caso ${piorCaso} ms`);
  assert.ok(mod.AUDITORIA_TIMEOUT_MS >= 25000, 'a auditoria levou 20,6 s em 22/10');
});

test('caso de 22/10: auditoria ainda sem o número → uma busca só, sem repetir ciclos', async () => {
  reiniciar(() => ({ total_de_paginas: 1, eventos: [] }));
  assert.equal(await obterNumeroRequisicaoPelaAuditoria(9238177705, 'k', 's'), null);
  assert.equal(chamadas.length, 1, 'a v7 fazia 3 ciclos');
  assert.deepEqual(esperas, [], 'sem as esperas de 1,2 s e 2,5 s entre ciclos');
});

test('auditoria com muitas páginas: no máximo 5 por execução (a v7 ia até 50)', async () => {
  reiniciar(() => ({ total_de_paginas: 40, eventos: [] }));
  assert.equal(await obterNumeroRequisicaoPelaAuditoria(1, 'k', 's'), null);
  assert.equal(chamadas.length, mod.AUDITORIA_MAX_PAGINAS);
  assert.deepEqual(chamadas.map((c) => c.param[0].pagina), [1, 2, 3, 4, 5]);
});

test('auditoria com Omie instável: 1 tentativa longa por página (a v7 fazia 4)', async () => {
  reiniciar(() => ({ faultstring: 'Consumo redundante detectado', status: 500 }));
  await assert.rejects(() => obterNumeroRequisicaoPelaAuditoria(1, 'k', 's'), /redundante/);
  assert.equal(chamadas.length, mod.AUDITORIA_TENTATIVAS);
});

test('demais consultas continuam com 4 tentativas (comportamento da v7)', async () => {
  reiniciar((_c, n) => (n < 4 ? { faultstring: 'Consumo redundante', status: 500 } : { ok: 1 }));
  assert.deepEqual(await callOmie('u', 'PesquisarReq', {}, 'k', 's'), { ok: 1 });
  assert.equal(chamadas.length, 4);
  assert.deepEqual(esperas, [900, 1800, 3000]);
});

test('erro definitivo não é repetido', async () => {
  reiniciar(() => ({ faultstring: 'ERROR: Chave de acesso inválida', status: 500 }));
  await assert.rejects(() => callOmie('u', 'PesquisarReq', {}, 'k', 's'), /Chave de acesso/);
});
