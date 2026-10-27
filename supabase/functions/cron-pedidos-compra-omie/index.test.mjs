// Executar com: node --test supabase/functions/cron-pedidos-compra-omie/index.test.mjs
// Carrega o index.ts real (transpilado com esbuild), com Deno e fetch simulados,
// e testa pesquisarOmie diante das respostas do Omie.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { transformSync } from "esbuild";

const aqui = fileURLToPath(new URL(".", import.meta.url));
const fonte = readFileSync(join(aqui, "index.ts"), "utf8").replace(
  "import {createClient} from 'npm:@supabase/supabase-js@2';",
  "const createClient = () => ({});",
);
const { code } = transformSync(fonte + "\nexport { pesquisarOmie, semRegistros };", {
  loader: "ts",
  format: "esm",
});
const arquivo = join(mkdtempSync(join(tmpdir(), "cron-pc-")), "mod.mjs");
writeFileSync(arquivo, code);

globalThis.Deno = {
  serve() {},
  env: {
    get() {
      return undefined;
    },
  },
};
let respostas = [];
globalThis.fetch = async () => {
  const corpo = respostas.shift();
  return { ok: !corpo.faultstring, status: corpo.faultstring ? 500 : 200, json: async () => corpo };
};
const { pesquisarOmie, semRegistros } = await import(pathToFileURL(arquivo));

const SEM_REGISTROS = {
  faultstring: "ERROR: Não existem registros para a página [1]!",
  faultcode: "SOAP-ENV:Client-5113",
};

test("detecta a mensagem do Omie com e sem acento", () => {
  assert.equal(semRegistros("ERROR: Não existem registros para a página [1]!"), true);
  assert.equal(semRegistros("ERROR: Nao existem registros para a pagina [1]!"), true);
  assert.equal(semRegistros("Consumo redundante detectado"), false);
});

test('incremental: "sem registros" vira lista vazia (não é erro)', async () => {
  respostas = [SEM_REGISTROS];
  const r = await pesquisarOmie(1, "k", "s", true, "2026-10-20T10:00:00Z");
  assert.deepEqual(r, { nPagina: 1, nTotalPaginas: 0, nTotalRegistros: 0, pedidos_pesquisa: [] });
});

test('conferência completa: "sem registros" continua sendo erro', async () => {
  respostas = [SEM_REGISTROS];
  await assert.rejects(() => pesquisarOmie(1, "k", "s", false), /Não existem registros/);
});

test("incremental: outros erros do Omie continuam sendo erro", async () => {
  respostas = [{ faultstring: "ERROR: Chave de acesso inválida" }];
  await assert.rejects(() => pesquisarOmie(1, "k", "s", true, null), /Chave de acesso/);
});

test("incremental: resposta normal passa sem alteração", async () => {
  const normal = { nPagina: 1, nTotalPaginas: 1, nTotalRegistros: 1, pedidos_pesquisa: [{ x: 1 }] };
  respostas = [normal];
  assert.deepEqual(await pesquisarOmie(1, "k", "s", true, null), normal);
});
