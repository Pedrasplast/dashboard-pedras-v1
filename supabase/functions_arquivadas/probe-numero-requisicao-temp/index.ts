// Diagnóstico temporário (22/10): onde o Omie devolve o número da requisição 9238177705.
// Somente leitura. Desativado após o uso (publicado como stub 410).
// Resultado: ListarAuditoriaAlteracoes devolveu NUMERO = "000000000014983" em 20,6 s;
// uma segunda chamada levou 121 s e respondeu "Não foi possível consultar os dados
// no momento". ConsultarReq (0,4 s) não traz o número.
const CODIGO = 9238177705;
const KEY = Deno.env.get('OMIE_APP_KEY')!;
const SECRET = Deno.env.get('OMIE_APP_SECRET')!;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function omie(url: string, call: string, param: unknown) {
  const inicio = Date.now();
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ call, app_key: KEY, app_secret: SECRET, param: [param] }) });
    const t = await r.text();
    return { call, ms: Date.now() - inicio, status: r.status, corpo: t.slice(0, 6000) };
  } catch (e) { return { call, ms: Date.now() - inicio, erro: String(e) }; }
}
Deno.serve(async () => {
  const out: unknown[] = [];
  out.push(await omie('https://app.omie.com.br/api/v1/geral/auditoria/', 'ListarAuditoriaAlteracoes', { entidade: 'requisicao-de-compra', codigo_registro: CODIGO, pagina: 1, registros_por_pagina: 100 }));
  await esperar(1500);
  out.push(await omie('https://app.omie.com.br/api/v1/produtos/requisicaocompra/', 'ConsultarReq', { codReqCompra: CODIGO }));
  await esperar(1500);
  out.push(await omie('https://app.omie.com.br/api/v1/geral/auditoria/', 'ListarAuditoriaAlteracoes', { entidade: 'requisicao-de-compra', codigo_registro: 9238155717, pagina: 1, registros_por_pagina: 100 }));
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
});
