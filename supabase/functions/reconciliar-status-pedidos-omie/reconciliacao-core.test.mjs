// Executar com: node --test supabase/functions/reconciliar-status-pedidos-omie/reconciliacao-core.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOTAL_LOTES, loteDoHorario, loteDoCodigo } from './reconciliacao-core.mjs';

// Regra antiga, mantida aqui só para provar que o teste detecta o defeito.
const loteDoHorarioAntigo = (agora) => Math.floor(agora.getUTCMinutes() / 5);

// Horários do cron "4-59/15 10-20 * * 1-5" (UTC) ao longo de um mês.
function execucoesDoCron(inicioIso, dias) {
  const horarios = [];
  const inicio = new Date(inicioIso);
  for (let d = 0; d < dias; d++) {
    const dia = new Date(inicio.getTime() + d * 86400000);
    const semana = dia.getUTCDay();
    if (semana === 0 || semana === 6) continue;
    for (let h = 10; h <= 20; h++) {
      for (const m of [4, 19, 34, 49]) {
        horarios.push(new Date(Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth(), dia.getUTCDate(), h, m)));
      }
    }
  }
  return horarios;
}

test('regra antiga só alcançava 4 dos 12 lotes (defeito reproduzido)', () => {
  const lotes = new Set(execucoesDoCron('2026-10-19T00:00:00Z', 30).map(loteDoHorarioAntigo));
  assert.deepEqual([...lotes].sort((a, b) => a - b), [0, 3, 6, 9]);
});

test('regra nova alcança os 12 lotes', () => {
  const lotes = new Set(execucoesDoCron('2026-10-19T00:00:00Z', 30).map((d) => loteDoHorario(d)));
  assert.equal(lotes.size, TOTAL_LOTES);
});

test('execuções consecutivas (15 min) pegam lotes consecutivos: 12 lotes a cada 3 horas', () => {
  const dia = execucoesDoCron('2026-10-20T00:00:00Z', 1);
  for (let i = 0; i + 12 <= dia.length; i++) {
    const janela = new Set(dia.slice(i, i + 12).map((d) => loteDoHorario(d)));
    assert.equal(janela.size, 12, `janela iniciando em ${dia[i].toISOString()}`);
  }
});

test('cada lote é conferido várias vezes por dia útil', () => {
  const contagem = new Map();
  for (const d of execucoesDoCron('2026-10-20T00:00:00Z', 1)) {
    const l = loteDoHorario(d);
    contagem.set(l, (contagem.get(l) ?? 0) + 1);
  }
  assert.equal(contagem.size, 12);
  for (const [, vezes] of contagem) assert.ok(vezes >= 3);
});

test('lote sempre entre 0 e 11, inclusive datas antigas', () => {
  for (const iso of ['1970-01-01T00:00:00Z', '2026-10-20T10:04:00Z', '2099-12-31T23:59:59Z']) {
    const l = loteDoHorario(new Date(iso));
    assert.ok(Number.isInteger(l) && l >= 0 && l < 12);
  }
});

test('loteDoCodigo inalterado', () => {
  assert.equal(loteDoCodigo(24), 0);
  assert.equal(loteDoCodigo(25), 1);
  assert.throws(() => loteDoCodigo(0));
});
