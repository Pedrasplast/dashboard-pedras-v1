// Diagnóstico TEMPORÁRIO e SOMENTE LEITURA (28/10/2026).
// Descobre qual filtro do PesquisarPedCompra reproduz a coluna "Aprovação" do Omie.
// Não grava nada no banco. Será substituído por stub 410 após o uso.
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (v: unknown, s = 200) =>
  new Response(JSON.stringify(v), { status: s, headers: { "Content-Type": "application/json" } });
const str = (v: unknown) => String(v ?? "").trim();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ALVOS = [
  "15051", "15056", "15057", "15045", "15041",
  "14917", "14695", "14602",
  "15013", "14790", "14793", "14792", "14968", "14981", "15008", "15004", "15011", "15018", "15003", "14997", "15006", "15009",
];

async function chamar(key: string, secret: string, param: Record<string, unknown>) {
  for (let t = 1; t <= 3; t++) {
    const r = await fetch("https://app.omie.com.br/api/v1/produtos/pedidocompra/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ call: "PesquisarPedCompra", app_key: key, app_secret: secret, param: [param] }),
    });
    const d = await r.json();
    const erro = str(d?.faultstring || d?.faultcode);
    if (!erro) return d;
    if (erro.toLowerCase().includes("nao existem") || erro.toLowerCase().includes("não existem")) {
      return { nTotalPaginas: 0, nTotalRegistros: 0, pedidos_pesquisa: [] };
    }
    if (erro.toLowerCase().includes("redundan") && t < 3) { await sleep(2500); continue; }
    throw new Error(erro);
  }
}

async function variante(key: string, secret: string, nome: string, filtros: Record<string, unknown>, maxPaginas = 12) {
  const vistos: Array<{ numero: string; etapa: string }> = [];
  let pagina = 1, totalPaginas = 1, totalRegistros = 0;
  let chavesCab: string[] = [];
  let exemploCab: unknown = null;
  do {
    const d = await chamar(key, secret, { nPagina: pagina, nRegsPorPagina: 50, lApenasImportadoApi: "N", ...filtros });
    totalPaginas = Number(d?.nTotalPaginas ?? 0);
    totalRegistros = Number(d?.nTotalRegistros ?? 0);
    for (const p of (Array.isArray(d?.pedidos_pesquisa) ? d.pedidos_pesquisa : [])) {
      const c = p?.cabecalho_consulta ?? {};
      if (!chavesCab.length) { chavesCab = Object.keys(c); exemploCab = c; }
      vistos.push({ numero: str(c.cNumero), etapa: str(c.cEtapa) });
    }
    pagina++;
    await sleep(400);
  } while (pagina <= totalPaginas && pagina <= maxPaginas);
  const etapas: Record<string, number> = {};
  for (const v of vistos) etapas[v.etapa] = (etapas[v.etapa] ?? 0) + 1;
  const alvos: Record<string, string | null> = {};
  for (const a of ALVOS) alvos[a] = vistos.find((v) => v.numero === a)?.etapa ?? null;
  return {
    nome, totalRegistros, totalPaginas, paginasLidas: pagina - 1, etapas, alvos,
    numerosEtapa15: vistos.filter((v) => v.etapa === "15").map((v) => v.numero),
    chavesCab, exemploCab,
  };
}

Deno.serve(async (req) => {
  const url = Deno.env.get("SUPABASE_URL")!, service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const key = Deno.env.get("OMIE_APP_KEY")!, secret = Deno.env.get("OMIE_APP_SECRET")!;
  const db = createClient(url, service, { auth: { persistSession: false } });
  const token = req.headers.get("x-cron-secret");
  if (!token) return json({ erro: "Não autorizado" }, 401);
  const ok = await db.rpc("validar_token_cron_pedidos_compra", { p_token: token });
  if (ok.error || ok.data !== true) return json({ erro: "Não autorizado" }, 401);

  const sem = { lExibirPedidosCancelados: "N", lExibirPedidosEncerrados: "N" };
  const resultados: unknown[] = [];
  const executar = async (nome: string, f: Record<string, unknown>, max?: number) => {
    try { resultados.push(await variante(key, secret, nome, f, max)); }
    catch (e) { resultados.push({ nome, erro: e instanceof Error ? e.message : String(e) }); }
  };

  // A: somente pendentes (aguardando entrega).
  await executar("A_pendentes", { ...sem, lExibirPedidosPendentes: "S", lExibirPedidosFaturados: "N", lExibirPedidosRecebidos: "N", lExibirPedidosRecParciais: "N", lExibirPedidosFatParciais: "N" });
  // B: abertos = pendentes + faturados + parciais, sem recebidos.
  await executar("B_abertos", { ...sem, lExibirPedidosPendentes: "S", lExibirPedidosFaturados: "S", lExibirPedidosRecebidos: "N", lExibirPedidosRecParciais: "S", lExibirPedidosFatParciais: "S" });
  // C: tudo, exceto cancelados/encerrados, só a primeira página (pedidos mais novos).
  await executar("C_completo_pag1", { ...sem, lExibirPedidosPendentes: "S", lExibirPedidosFaturados: "S", lExibirPedidosRecebidos: "S", lExibirPedidosRecParciais: "S", lExibirPedidosFatParciais: "S" }, 1);
  // D: incremental atual (alterados hoje).
  await executar("D_alterados_hoje", { ...sem, lExibirPedidosPendentes: "S", lExibirPedidosFaturados: "S", lExibirPedidosRecebidos: "S", lExibirPedidosRecParciais: "S", lExibirPedidosFatParciais: "S", dDataInicial: "28/10/2026", dDataFinal: "28/10/2026", lApenasAlterados: true });
  // E: alterados 26 a 28/10.
  await executar("E_alterados_26a28", { ...sem, lExibirPedidosPendentes: "S", lExibirPedidosFaturados: "S", lExibirPedidosRecebidos: "S", lExibirPedidosRecParciais: "S", lExibirPedidosFatParciais: "S", dDataInicial: "26/10/2026", dDataFinal: "28/10/2026", lApenasAlterados: true });
  // F: encerrados/cancelados alterados 26 a 28/10.
  await executar("F_fechados_26a28", { lExibirPedidosPendentes: "N", lExibirPedidosFaturados: "N", lExibirPedidosRecebidos: "N", lExibirPedidosRecParciais: "N", lExibirPedidosFatParciais: "N", lExibirPedidosCancelados: "S", lExibirPedidosEncerrados: "S", dDataInicial: "26/10/2026", dDataFinal: "28/10/2026", lApenasAlterados: true });

  return json({ geradoEm: new Date().toISOString(), resultados });
});
