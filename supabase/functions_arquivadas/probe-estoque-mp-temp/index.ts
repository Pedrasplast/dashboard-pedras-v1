// Diagnóstico TEMPORÁRIO e SOMENTE LEITURA (28/10/2026).
// Busca no Omie as posições de estoque do local de matéria-prima, como a rotina
// sincronizar-estoque-materia-prima-omie, e devolve código/descrição sem gravar nada.
import { createClient } from "npm:@supabase/supabase-js@2";
import { comRetentativa } from "./omie-retentativa.mjs";
const LOCAL = 2333946061;
const json = (v: unknown, s = 200) => new Response(JSON.stringify(v), { status: s, headers: { "Content-Type": "application/json" } });
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
function dataBrasil() {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
async function pagina(n: number, data: string, key: string, secret: string) {
  const http = await fetch("https://app.omie.com.br/api/v1/estoque/consulta/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ call: "ListarPosEstoque", app_key: key, app_secret: secret,
      param: [{ nPagina: n, nRegPorPagina: 50, dDataPosicao: data, cExibeTodos: "S", codigo_local_estoque: LOCAL, cTipoItem: "01" }] }),
  });
  const body = await http.json();
  if (!http.ok || body?.faultstring) throw new Error(body?.faultstring || `HTTP ${http.status}`);
  return body;
}
Deno.serve(async (req) => {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = req.headers.get("x-cron-secret");
  const ok = token ? await db.rpc("validar_token_cron_pedidos_compra", { p_token: token }) : null;
  if (!ok || ok.error || ok.data !== true) return json({ erro: "Não autorizado" }, 401);
  const key = Deno.env.get("OMIE_APP_KEY")!, secret = Deno.env.get("OMIE_APP_SECRET")!;
  const data = dataBrasil();
  const p1 = await comRetentativa(() => pagina(1, data, key, secret), esperar);
  const total = Number(p1.nTotPaginas);
  const posicoes = [...p1.produtos];
  for (let n = 2; n <= total && n <= 100; n++) posicoes.push(...(await comRetentativa(() => pagina(n, data, key, secret), esperar)).produtos);
  const doLocal = posicoes.filter((p: any) => Number(p?.codigo_local_estoque) === LOCAL)
    .map((p: any) => ({ nCodProd: p.nCodProd, cCodigo: p.cCodigo, cDescricao: p.cDescricao, fisico: p.fisico, nSaldo: p.nSaldo }));
  return json({ data, paginas: total, total_posicoes: posicoes.length, do_local: doLocal.length, posicoes: doLocal });
});
