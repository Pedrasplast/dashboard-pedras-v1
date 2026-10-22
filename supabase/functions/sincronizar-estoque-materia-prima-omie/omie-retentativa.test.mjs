// Executar com: node --test supabase/functions/sincronizar-estoque-materia-prima-omie/omie-retentativa.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esperaParaRepetir, comRetentativa } from './omie-retentativa.mjs';

const EXECUTANDO = 'ERROR: Já existe uma requisição desse método sendo executada e você pode tentar novamente em alguns instantes. (1)';
const REDUNDANTE = 'ListarPosEstoque: ERROR: Consumo redundante detectado. Aguarde 56 segundos para tentar novamente (REDUNDANT).';

test('mensagens reais do Omie são reconhecidas como temporárias', () => {
  assert.equal(esperaParaRepetir(EXECUTANDO, 1), 5000);
  assert.equal(esperaParaRepetir(EXECUTANDO, 2), 10000);
  assert.equal(esperaParaRepetir(REDUNDANTE, 1), 58000);
});

test('outros erros não são repetidos', () => {
  assert.equal(esperaParaRepetir('Retorno Omie sem lista de produtos', 1), null);
  assert.equal(esperaParaRepetir('ERROR: Chave de acesso inválida', 1), null);
});

test('caso de hoje às :45: falha por chamada simultânea e passa na 2ª tentativa', async () => {
  let chamadas = 0; const esperas = [];
  const r = await comRetentativa(async () => {
    chamadas++; if (chamadas === 1) throw new Error(EXECUTANDO); return 'ok';
  }, async (ms) => { esperas.push(ms); });
  assert.equal(r, 'ok'); assert.equal(chamadas, 2); assert.deepEqual(esperas, [5000]);
});

test('erro definitivo sobe na hora, sem esperar', async () => {
  const esperas = [];
  await assert.rejects(comRetentativa(async () => { throw new Error('Paginação inválida no Omie'); },
    async (ms) => { esperas.push(ms); }), /Paginação inválida/);
  assert.deepEqual(esperas, []);
});

test('para depois do limite de tentativas e do limite de espera', async () => {
  let chamadas = 0; const esperas = [];
  await assert.rejects(comRetentativa(async () => { chamadas++; throw new Error(EXECUTANDO); },
    async (ms) => { esperas.push(ms); }), /sendo executada/);
  assert.equal(chamadas, 4); assert.deepEqual(esperas, [5000, 10000, 15000]);

  chamadas = 0; esperas.length = 0;
  await assert.rejects(comRetentativa(async () => { chamadas++; throw new Error(REDUNDANTE); },
    async (ms) => { esperas.push(ms); }), /redundante/);
  assert.equal(chamadas, 2, 'só uma espera de 58 s cabe no limite de 75 s');
  assert.ok(esperas.reduce((a, b) => a + b, 0) <= 75000);
});
