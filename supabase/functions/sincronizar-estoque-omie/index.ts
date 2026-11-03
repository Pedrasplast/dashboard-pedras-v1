import { createClient } from "npm:@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const URL_ESTOQUE = "https://app.omie.com.br/api/v1/estoque/consulta/";
const URL_PRODUTOS = "https://app.omie.com.br/api/v1/geral/produtos/";
const MAX_TENTATIVAS = 4;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function criarSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) throw new Error("Credenciais do Supabase não encontradas.");
  return createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

function esperar(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function textoErro(erro: unknown) { return erro instanceof Error ? erro.message : String(erro ?? "Erro desconhecido"); }
function normalizarTexto(valor: unknown) { return String(valor ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
function omieOcupado(erro: unknown) { const t = normalizarTexto(textoErro(erro)); return t.includes("ja existe uma requisicao") && t.includes("sendo executada"); }
function numero(valor: unknown) { const n = Number(valor ?? 0); return Number.isFinite(n) ? n : 0; }

function formatarDataBrasil(data: Date) {
  const partes = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }).formatToParts(data);
  const mapa = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  return `${mapa.day}/${mapa.month}/${mapa.year}`;
}
function converterDataBrParaIso(valor: string) { const m = String(valor ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : null; }

async function chamarOmieUmaVez(url: string, call: string, param: Record<string, unknown>, appKey: string, appSecret: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const resposta = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ call, app_key: appKey, app_secret: appSecret, param: [param] }) });
    const texto = await resposta.text();
    let dados: any = {};
    try { dados = texto ? JSON.parse(texto) : {}; } catch { throw new Error(`${call}: retorno inválido. HTTP ${resposta.status}.`); }
    if (!resposta.ok || dados?.faultstring || dados?.faultcode) throw new Error(`${call}: ${dados?.faultstring || dados?.description || dados?.message || `HTTP ${resposta.status}`}`);
    return dados;
  } catch (erro) {
    if (erro instanceof Error && erro.name === "AbortError") throw new Error(`${call}: tempo limite excedido.`);
    throw erro;
  } finally { clearTimeout(timeout); }
}

async function chamarOmie(url: string, call: string, param: Record<string, unknown>, appKey: string, appSecret: string) {
  let ultimoErro: unknown = null;
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try { return await chamarOmieUmaVez(url, call, param, appKey, appSecret); }
    catch (erro) { ultimoErro = erro; if (!omieOcupado(erro) || tentativa === MAX_TENTATIVAS) throw erro; await esperar(tentativa * 2000); }
  }
  throw ultimoErro;
}

async function listarProdutosAcabadosAtivos(appKey: string, appSecret: string) {
  let pagina = 1, totalPaginas = 1; const produtos: any[] = [];
  do {
    const dados = await chamarOmie(URL_PRODUTOS, "ListarProdutos", { pagina, registros_por_pagina: 100, apenas_importado_api: "N", filtrar_apenas_omiepdv: "N", filtrar_apenas_tipo: "04", inativo: "N" }, appKey, appSecret);
    const lista = Array.isArray(dados?.produto_servico_cadastro) ? dados.produto_servico_cadastro : [];
    produtos.push(...lista); totalPaginas = Math.max(1, numero(dados?.total_de_paginas) || 1); pagina++; if (pagina <= totalPaginas) await esperar(120);
  } while (pagina <= totalPaginas);
  return { produtos, totalPaginas };
}

async function listarPosEstoque(appKey: string, appSecret: string) {
  const dataPosicao = formatarDataBrasil(new Date()); let pagina = 1, totalPaginas = 1; const posicoes: any[] = [];
  do {
    const dados = await chamarOmie(URL_ESTOQUE, "ListarPosEstoque", { nPagina: pagina, nRegPorPagina: 100, dDataPosicao: dataPosicao, cExibeTodos: "S", lista_local_estoque: "TODOS", cTipoItem: "04" }, appKey, appSecret);
    const lista = Array.isArray(dados?.produtos) ? dados.produtos : [];
    posicoes.push(...lista); totalPaginas = Math.max(1, numero(dados?.nTotPaginas) || 1); pagina++; if (pagina <= totalPaginas) await esperar(120);
  } while (pagina <= totalPaginas);
  return { posicoes, totalPaginas, dataPosicao };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(JSON.stringify({ ok: true }), { headers });
  const inicioMs = Date.now(); const iniciadoEm = new Date().toISOString(); let supabase: any = null; let travou = false;
  try {
    const appKey = Deno.env.get("OMIE_APP_KEY"); const appSecret = Deno.env.get("OMIE_APP_SECRET");
    if (!appKey || !appSecret) throw new Error("Credenciais do Omie não configuradas.");
    supabase = criarSupabaseAdmin();

    const lock = await supabase.rpc("tentar_iniciar_sincronizacao_estoque_omie", { p_iniciado_em: iniciadoEm });
    if (lock.error) throw new Error(`Obtendo trava: ${lock.error.message}`);
    travou = lock.data === true;
    if (!travou) return new Response(JSON.stringify({ sucesso: false, ignorado: true, motivo: "Já existe uma sincronização de estoque em andamento.", criou_cron: false }, null, 2), { status: 409, headers });

    const locaisResult = await supabase.from("locais_estoque_omie").select("codigo_local_estoque,codigo,descricao,padrao,inativo").eq("inativo", false);
    if (locaisResult.error) throw new Error(`Lendo locais ativos: ${locaisResult.error.message}`);
    const locaisAtivos = new Set((locaisResult.data ?? []).map((l: any) => String(l.codigo_local_estoque)));

    await supabase.from("sincronizacao_estoque_omie").update({ etapa: "consultando_omie", mensagem: "Consultando produtos ativos e posição de estoque", atualizado_em: new Date().toISOString() }).eq("id", 1);

    const [cadastro, estoque] = await Promise.all([listarProdutosAcabadosAtivos(appKey, appSecret), listarPosEstoque(appKey, appSecret)]);
    const idsAtivos = new Set<string>(); const integracaoPorId = new Map<string, string>();
    for (const produto of cadastro.produtos) {
      const id = String(produto?.codigo_produto ?? ""); const inativo = String(produto?.inativo ?? "N").toUpperCase(); const tipo = String(produto?.tipoItem ?? "");
      if (id && inativo !== "S" && tipo === "04") { idsAtivos.add(id); integracaoPorId.set(id, String(produto?.codigo_produto_integracao ?? "").trim()); }
    }

    const sincronizadoEm = new Date().toISOString(); const dataPosicaoIso = converterDataBrParaIso(estoque.dataPosicao);
    const linhas = estoque.posicoes
      .filter((p: any) => locaisAtivos.has(String(p?.codigo_local_estoque ?? "")))
      .filter((p: any) => idsAtivos.has(String(p?.nCodProd ?? "")))
      .map((p: any) => { const idProduto = String(p?.nCodProd ?? ""); return {
        codigo_produto_omie: numero(idProduto), codigo_integracao: String(p?.cCodInt ?? "").trim() || integracaoPorId.get(idProduto) || null,
        codigo_produto: String(p?.cCodigo ?? "").trim(), descricao: String(p?.cDescricao ?? "").trim() || null, tipo_item: "04",
        codigo_local_estoque: numero(p?.codigo_local_estoque), preco_unitario: numero(p?.nPrecoUnitario), saldo: numero(p?.nSaldo), cmc: numero(p?.nCMC),
        pendente: numero(p?.nPendente), estoque_minimo: numero(p?.estoque_minimo), reservado: numero(p?.reservado), fisico: numero(p?.fisico),
        data_posicao: dataPosicaoIso, ativo: true, sincronizado_em: sincronizadoEm, atualizado_em: sincronizadoEm
      }; });

    if (!linhas.length) throw new Error("Nenhuma posição válida encontrada; gravação interrompida.");
    const chaves = new Set(linhas.map((l: any) => `${l.codigo_produto_omie}:${l.codigo_local_estoque}`));
    if (chaves.size !== linhas.length) throw new Error(`Chaves duplicadas no retorno: ${linhas.length - chaves.size}.`);

    await supabase.from("sincronizacao_estoque_omie").update({ etapa: "gravando", total_paginas: estoque.totalPaginas, pagina_atual: estoque.totalPaginas, quantidade_produtos: idsAtivos.size, mensagem: `Gravando ${linhas.length} posições válidas`, atualizado_em: new Date().toISOString() }).eq("id", 1);

    for (let i = 0; i < linhas.length; i += 400) {
      const r = await supabase.from("estoque_produto_acabado_omie").upsert(linhas.slice(i, i + 400), { onConflict: "codigo_produto_omie,codigo_local_estoque" });
      if (r.error) throw new Error(`Gravando lote ${i / 400 + 1}: ${r.error.message}`);
    }

    const limpeza = await supabase.from("estoque_produto_acabado_omie").delete().lt("sincronizado_em", sincronizadoEm);
    if (limpeza.error) throw new Error(`Removendo posições antigas: ${limpeza.error.message}`);

    const depois = await supabase.from("estoque_produto_acabado_omie").select("id", { count: "exact", head: true });
    if (depois.error) throw new Error(`Contando resultado final: ${depois.error.message}`);

    const fim = new Date().toISOString(); const duracaoMs = Date.now() - inicioMs;
    await supabase.from("sincronizacao_estoque_omie").update({ ultima_sincronizacao: fim, fim_em: fim, status: "sucesso", etapa: "concluido", pagina_atual: estoque.totalPaginas, total_paginas: estoque.totalPaginas, quantidade_produtos: idsAtivos.size, duracao_ms: duracaoMs, mensagem: `Sincronização concluída: ${linhas.length} posições gravadas.`, atualizado_em: fim }).eq("id", 1);

    const matriz = linhas.filter((l: any) => l.codigo_local_estoque === 2333946061);
    return new Response(JSON.stringify({ sucesso: true, ambiente: "producao", tabela: "estoque_produto_acabado_omie", criou_cron: false, regra_produto: "tipo_item = 04 e produto ativo", regra_local: "somente locais ativos", produtos_acabados_ativos: idsAtivos.size, locais_ativos: locaisAtivos.size, posicoes_validas_processadas: linhas.length, chaves_unicas: chaves.size, linhas_depois: depois.count ?? 0, matriz: { registros: matriz.length, produtos_com_saldo_diferente_zero: matriz.filter((l: any) => numero(l.saldo) !== 0).length }, paginas_cadastro_produtos: cadastro.totalPaginas, paginas_estoque: estoque.totalPaginas, data_posicao: estoque.dataPosicao, duracao_ms: duracaoMs }, null, 2), { status: 200, headers });
  } catch (erro) {
    if (supabase && travou) {
      const fim = new Date().toISOString();
      await supabase.from("sincronizacao_estoque_omie").update({ fim_em: fim, status: "erro", etapa: "erro", duracao_ms: Date.now() - inicioMs, mensagem: textoErro(erro).slice(0, 1000), atualizado_em: fim }).eq("id", 1);
    }
    return new Response(JSON.stringify({ sucesso: false, ambiente: "producao", criou_cron: false, erro: textoErro(erro), duracao_ms: Date.now() - inicioMs }, null, 2), { status: 500, headers });
  }
});
