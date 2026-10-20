import { createClient } from "npm:@supabase/supabase-js@2";
const URL_OMIE = "https://app.omie.com.br/api/v1/produtos/pedidocompra/";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json; charset=utf-8" };
const responder = (dados: Record<string, unknown>, status = 200) => new Response(JSON.stringify(dados), { status, headers: CORS });
const erroTexto = (e: unknown) => e instanceof Error ? e.message : String(e);
const texto = (v: unknown) => String(v ?? "").trim();
type Objeto = Record<string, unknown>;
const objeto = (v: unknown): Objeto => v && typeof v === "object" && !Array.isArray(v) ? v as Objeto : {};
const numero = (v: unknown) => { const n = Number(v ?? 0); if (!Number.isFinite(n)) throw new Error(`Número inválido no Omie: ${v}`); return n; };
const codigo = (v: unknown) => { const n = Number(v); if (!Number.isSafeInteger(n) || n <= 0) throw new Error(`Identificador inválido no Omie: ${v}`); return n; };
const ordenar = (v: unknown, campo: string) => { if (!Array.isArray(v)) throw new Error(`Bloco de dados do Omie não retornado: ${campo}`); return v.map((i: unknown) => objeto(i)).sort((a: Objeto, b: Objeto) => texto(a[campo] ?? JSON.stringify(a)).localeCompare(texto(b[campo] ?? JSON.stringify(b)))); };
function normalizar(registro: unknown) {
  const r = objeto(registro), c = objeto(r.cabecalho_consulta), id = codigo(c.nCodPed), num = texto(c.cNumero);
  if (!num || !Array.isArray(r.produtos_consulta)) throw new Error(`Pedido ${id}: retorno incompleto do Omie.`);
  const ids = new Set<number>();
  const itens = r.produtos_consulta.map((entrada: unknown) => {
    const i = objeto(entrada), iid = codigo(i.nCodItem); if (ids.has(iid)) throw new Error(`Pedido ${num}: item repetido (${iid}).`); ids.add(iid); return {
      codigo_item: iid, codigo_produto: i.nCodProd == null ? null : codigo(i.nCodProd), codigo_comercial: texto(i.cProduto), descricao: texto(i.cDescricao), unidade: texto(i.cUnidade), quantidade: numero(i.nQtde), quantidade_recebida: numero(i.nQtdeRec), preco_unitario: numero(i.nValUnit), valor_total: numero(i.nValTot), desconto: numero(i.nDesconto), despesas: numero(i.nDespesas), frete_item: numero(i.nFrete), seguro: numero(i.nSeguro), categoria: texto(i.cCodCateg), observacao: texto(i.cObs), local_estoque: texto(i.codigo_local_estoque)
    };
  }).sort((a, b) => a.codigo_item - b.codigo_item);
  const f = objeto(r.frete_consulta), frete: Objeto = {}; for (const k of ["cTpFrete", "nCodTransp", "nValFrete", "nValOutras", "nValSeguro", "nPesoBruto", "nPesoLiq", "nQtdVol"]) frete[k] = f[k] ?? null;
  return { codigo: id, snapshot: { codigo: id, numero: num, codigo_integracao: texto(c.cCodIntPed), fornecedor: texto(c.nCodFor), contato: texto(c.cContato), comprador: texto(c.nCodCompr), centro_custo: texto(c.nCodCC), categoria: texto(c.cCodCateg), etapa: texto(c.cEtapa), data_previsao: texto(c.dDtPrevisao), data_inclusao: texto(c.dIncData), hora_inclusao: texto(c.cIncHora), condicao_pagamento: texto(c.cCodParc), parcelas_quantidade: numero(c.nQtdeParc), observacoes: texto(c.cObs), observacoes_internas: texto(c.cObsInt), contrato: texto(c.cContrato), projeto: numero(c.nCodProj), frete, parcelas: ordenar(r.parcelas_consulta, "nParcela"), departamentos: ordenar(r.departamentos_consulta, "cCodDepto"), caracteristicas: ordenar(r.caracteristicas_consulta, "cNome"), itens } };
}
class EsperaOmie extends Error { constructor(public segundos: number, detalhe: string) { super(detalhe); } }
function identificarBloqueio(detalhe: string): EsperaOmie | null { const base = detalhe.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); if (!base.includes("consumo redundante") && !base.includes("redundant") && !(base.includes("ja existe uma requisicao") && base.includes("sendo executada"))) return null; const segundos = Math.max(65, Math.min(180, Number(base.match(/aguarde\s+(\d+)\s+segundos?/)?.[1] ?? 60) + 6)); return new EsperaOmie(segundos, detalhe); }
async function pesquisar(pagina: number, key: string, secret: string) {
  const controlador = new AbortController(), timeout = setTimeout(() => controlador.abort(), 28000);
  try {
    // Em aberto: pendentes, faturados aguardando recebimento e recebimentos/faturamentos parciais.
    // Nao carregar recebidos integralmente, cancelados nem encerrados.
    const filtros = {
      nPagina: pagina, nRegsPorPagina: 50,
      lApenasImportadoApi: "N",
      lExibirPedidosPendentes: "S",
      lExibirPedidosFaturados: "S",
      lExibirPedidosRecebidos: "S",
      lExibirPedidosCancelados: "N",
      lExibirPedidosEncerrados: "N",
      lExibirPedidosRecParciais: "S",
      lExibirPedidosFatParciais: "S"
    };
    const resp = await fetch(URL_OMIE, { method: "POST", headers: { "Content-Type": "application/json" }, signal: controlador.signal, body: JSON.stringify({ call: "PesquisarPedCompra", app_key: key, app_secret: secret, param: [filtros] }) });
    const dados = await resp.json();
    if (!resp.ok || dados.faultstring || dados.faultcode) {
      const detalhe = texto(dados.faultstring || dados.message || `HTTP ${resp.status}`), bloqueio = identificarBloqueio(detalhe);
      if (bloqueio) throw bloqueio;
      if (pagina === 1 && /nao existem registros para a pagina/i.test(detalhe.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase())) {
        return { nPagina: 1, nTotalPaginas: 0, nTotalRegistros: 0, pedidos_pesquisa: [] };
      }
      throw new Error(`PesquisarPedCompra página ${pagina}: ${detalhe}`);
    }
    if (Number(dados.nPagina) !== pagina || !Number.isSafeInteger(Number(dados.nTotalPaginas)) || !Array.isArray(dados.pedidos_pesquisa) || (Number(dados.nTotalPaginas) > 0 && !dados.pedidos_pesquisa.length)) throw new Error(`Resposta incompleta ou paginação inválida na página ${pagina}.`);
    return dados;
  } finally { clearTimeout(timeout); }
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return responder({ ok: true }); if (req.method !== "POST") return responder({ erro: "Método não permitido." }, 405);
  const url = Deno.env.get("SUPABASE_URL"), role = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), anon = Deno.env.get("SUPABASE_ANON_KEY"), key = Deno.env.get("OMIE_APP_KEY"), secret = Deno.env.get("OMIE_APP_SECRET"); if (!url || !role || !anon || !key || !secret) return responder({ erro: "Credenciais não configuradas." }, 500);
  const jwt = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, ""); if (!jwt) return responder({ erro: "Autenticação obrigatória." }, 401);
  const usuario = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${jwt}` } }, auth: { persistSession: false, autoRefreshToken: false } }), auth = await usuario.auth.getUser(jwt); if (auth.error || !auth.data.user?.id) return responder({ erro: "Sessão inválida." }, 401);
  const perfil = await usuario.from("perfis").select("regra").eq("id", auth.data.user.id).maybeSingle(); if (perfil.error || perfil.data?.regra !== "admin") return responder({ erro: "Acesso restrito a administradores." }, 403);
  const db = createClient(url, role, { auth: { persistSession: false, autoRefreshToken: false } }); let travado = false;
  try {
    const agora = new Date().toISOString(), controle = await db.from("sincronizacao_pedidos_compra_omie").select("proxima_tentativa_em").eq("id", 1).single(); if (controle.error) throw controle.error;
    const restante = Math.ceil((Date.parse(controle.data.proxima_tentativa_em ?? "") - Date.now()) / 1000); if (Number.isFinite(restante) && restante > 0) return responder({ sucesso: false, codigo: "OMIE_AGUARDANDO", aguarde_segundos: restante, erro: `Omie em intervalo de segurança. Aguarde ${restante} segundos antes de continuar.` }, 429);
    const expira = new Date(Date.now() - 20 * 60_000).toISOString(), limpar = await db.from("sincronizacao_pedidos_compra_omie").update({ status: "erro", mensagem: "Execução anterior expirou.", atualizado_em: agora }).eq("id", 1).eq("status", "executando").lt("atualizado_em", expira); if (limpar.error) throw limpar.error;
    const lock = await db.from("sincronizacao_pedidos_compra_omie").update({ status: "executando", iniciado_em: agora, finalizado_em: null, atualizado_em: agora, mensagem: "Consultando pedidos em aberto no Omie..." }).eq("id", 1).neq("status", "executando").select("id").maybeSingle(); if (lock.error) throw lock.error; if (!lock.data) return responder({ erro: "Sincronização já está em andamento." }, 409); travado = true;
    const cursor = await db.from("sincronizacao_pedidos_compra_omie").select("pagina_proxima,total_paginas_previstas,total_pedidos,total_alterados").eq("id", 1).single(); if (cursor.error) throw cursor.error; const pagina = Math.max(1, Number(cursor.data.pagina_proxima ?? 1)), totalAnterior = Number(cursor.data.total_paginas_previstas ?? 0);
    const reservar = await db.from("sincronizacao_pedidos_compra_omie").update({ proxima_tentativa_em: new Date(Date.now() + 70_000).toISOString() }).eq("id", 1); if (reservar.error) throw reservar.error;
    const dados = await pesquisar(pagina, key, secret), paginas = Number(dados.nTotalPaginas); if (paginas < 0 || paginas > 100000 || (pagina > 1 && totalAnterior > 0 && paginas !== totalAnterior)) throw new Error("Total de páginas foi alterado durante a varredura; nenhum cursor foi avançado.");
    const ids = new Set<number>(), lote = (dados.pedidos_pesquisa as unknown[]).map(entrada => { const item = normalizar(entrada); if (ids.has(item.codigo)) throw new Error(`Pedido duplicado ${item.codigo} na página ${pagina}.`); ids.add(item.codigo); return item; });
    const gravacao = await db.rpc("registrar_lote_pedidos_compra_omie", { p_pedidos: lote }); if (gravacao.error) throw gravacao.error;
    const conclusao = paginas === 0 || pagina >= paginas, processados = (pagina === 1 ? 0 : Number(cursor.data.total_pedidos ?? 0)) + lote.length, alteracoes = (pagina === 1 ? 0 : Number(cursor.data.total_alterados ?? 0)) + Number(gravacao.data?.alteradas ?? 0), fim = new Date().toISOString();
    const update = await db.from("sincronizacao_pedidos_compra_omie").update({ pagina_proxima: conclusao ? 1 : pagina + 1, total_paginas_previstas: conclusao ? 0 : paginas, total_paginas: paginas, total_pedidos: processados, total_alterados: alteracoes, status: "sucesso", finalizado_em: fim, atualizado_em: fim, mensagem: conclusao ? `Varredura concluída de pedidos em aberto: ${processados} pedidos; ${alteracoes} alterados.` : `Pedidos em aberto: página ${pagina}/${paginas} concluída. Próxima página liberada imediatamente.` }).eq("id", 1); if (update.error) throw update.error; travado = false;
    return responder({ sucesso: true, total: processados, registros_omie: Number(dados.nTotalRegistros ?? 0), novas: Number(gravacao.data?.novas ?? 0), alteradas: Number(gravacao.data?.alteradas ?? 0), iguais: Number(gravacao.data?.iguais ?? 0), paginas, paginas_processadas: 1, pagina_atual: pagina, proxima_pagina: conclusao ? 1 : pagina + 1, concluido: conclusao, aguarde_segundos: 0, mensagem: conclusao ? "Varredura de pedidos em aberto concluída." : `Página ${pagina}/${paginas} salva. A próxima página já pode ser processada.` });
  } catch (e) { const fim = new Date().toISOString(); if (travado) { const bloqueio = e instanceof EsperaOmie ? e.segundos : null; await db.from("sincronizacao_pedidos_compra_omie").update({ status: "erro", finalizado_em: fim, atualizado_em: fim, ...(bloqueio ? { proxima_tentativa_em: new Date(Date.now() + bloqueio * 1000).toISOString() } : {}), mensagem: erroTexto(e).slice(0, 900) }).eq("id", 1); } if (e instanceof EsperaOmie) return responder({ sucesso: false, codigo: "OMIE_REDUNDANT", aguarde_segundos: e.segundos, erro: `O Omie limitou a consulta. Aguarde ${e.segundos} segundos. ${e.message}` }, 429); return responder({ sucesso: false, erro: erroTexto(e) }, 500); }
});
