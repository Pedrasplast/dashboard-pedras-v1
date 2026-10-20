import { createClient } from "npm:@supabase/supabase-js@2";

const ENDPOINT = "https://app.omie.com.br/api/v1/produtos/requisicaocompra/";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const mensagem = (e: unknown) => e instanceof Error ? e.message : String(e);
const texto = (v: unknown) => String(v ?? "").trim();
const inteiro = (v: unknown) => {
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n <= 0) throw new Error(`Identificador inválido retornado pelo Omie: ${v}`);
  return n;
};
const numero = (v: unknown) => {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) throw new Error("Quantidade/preço inválido no retorno do Omie.");
  return n;
};

type Registro = Record<string, unknown>;
function objeto(v: unknown): Registro {
  return v && typeof v === "object" && !Array.isArray(v) ? v as Registro : {};
}
function normalizar(entrada: unknown) {
  const r = objeto(entrada);
  const codigo = inteiro(r.codReqCompra);
  if (!Array.isArray(r.ItensReqCompra)) {
    throw new Error(`Requisição ${codigo}: retorno sem lista de itens; sincronização abortada.`);
  }
  const ids = new Set<number>();
  const itens = r.ItensReqCompra.map((registro: unknown) => {
    const i = objeto(registro);
    const cod = inteiro(i.codItem);
    if (ids.has(cod)) throw new Error(`Requisição ${codigo}: item duplicado ${cod}.`);
    ids.add(cod);
    return {
      codigo_item: cod,
      codigo_produto: i.codProd == null ? null : numero(i.codProd),
      codigo_integracao_produto: texto(i.codIntProd),
      codigo_integracao_item: texto(i.codIntItem),
      quantidade: numero(i.qtde),
      preco_unitario: numero(i.precoUnit),
      observacao: texto(i.obsItem),
    };
  }).sort((a, b) => a.codigo_item - b.codigo_item);
  return {
    codigo,
    snapshot: {
      codigo,
      codigo_integracao: texto(r.codIntReqCompra),
      categoria: texto(r.codCateg),
      projeto: numero(r.codProj),
      data_sugestao: texto(r.dtSugestao),
      observacoes: texto(r.obsReqCompra),
      observacoes_internas: texto(r.obsIntReqCompra),
      itens,
    },
  };
}

async function buscarPagina(pagina: number, appKey: string, appSecret: string) {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const control = new AbortController();
    const timeout = setTimeout(() => control.abort(), 28000);
    try {
      const resposta = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: control.signal,
        body: JSON.stringify({
          call: "PesquisarReq",
          app_key: appKey,
          app_secret: appSecret,
          param: [{ pagina, registros_por_pagina: 50 }],
        }),
      });
      const corpo = await resposta.json();
      if (resposta.ok && !corpo.faultstring && !corpo.faultcode) return corpo;
      const erroOmie = corpo.faultstring || corpo.message || `HTTP ${resposta.status}`;
      if (pagina === 1 && /n[aã]o existem registros para a p[aá]gina/i.test(String(erroOmie))) {
        return { requisicaoCadastro: [], total_de_paginas: 0, total_de_registros: 0 };
      }
      throw new Error(`PesquisarReq página ${pagina}: ${erroOmie}`);
    } catch (e) {
      if (tentativa === 3) throw e;
      await new Promise((resolve) => setTimeout(resolve, tentativa * 2500));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error("Não foi possível consultar o Omie.");
}

function resposta(dados: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(dados), { status, headers: CORS });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return resposta({ ok: true });
  if (request.method !== "POST") return resposta({ erro: "Método não permitido." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const appKey = Deno.env.get("OMIE_APP_KEY");
  const appSecret = Deno.env.get("OMIE_APP_SECRET");
  if (!url || !serviceKey || !anonKey || !appKey || !appSecret) {
    return resposta({ erro: "Segredos de integração não configurados no servidor." }, 500);
  }

  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return resposta({ erro: "Autenticação obrigatória." }, 401);
  const usuarioClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: identificacao, error: erroAuth } = await usuarioClient.auth.getUser(token);
  if (erroAuth || !identificacao.user?.id) return resposta({ erro: "Sessão inválida." }, 401);
  const { data: perfil, error: erroPerfil } = await usuarioClient
    .from("perfis").select("regra").eq("id", identificacao.user.id).maybeSingle();
  if (erroPerfil || perfil?.regra !== "admin") {
    return resposta({ erro: "Somente administradores podem iniciar a sincronização." }, 403);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let travado = false;
  const inicio = new Date().toISOString();
  try {
    const limite = new Date(Date.now() - 20 * 60_000).toISOString();
    const desbloqueio = await admin.from("sincronizacao_requisicoes_omie")
      .update({ status: "erro", mensagem: "Sincronização anterior expirou.", atualizado_em: inicio })
      .eq("id", 1).eq("status", "executando").lt("atualizado_em", limite);
    if (desbloqueio.error) throw desbloqueio.error;

    const inicioLock = await admin.from("sincronizacao_requisicoes_omie")
      .update({ status: "executando", iniciado_em: inicio, finalizado_em: null,
        atualizado_em: inicio, mensagem: "Consultando requisições..." })
      .eq("id", 1).neq("status", "executando").select("id").maybeSingle();
    if (inicioLock.error) throw inicioLock.error;
    if (!inicioLock.data) return resposta({ erro: "Já existe uma sincronização em andamento." }, 409);
    travado = true;

    const todos = new Map<number, ReturnType<typeof normalizar>>();
    let pagina = 1;
    let paginas = 1;
    do {
      const resultado = await buscarPagina(pagina, appKey, appSecret);
      paginas = Number(resultado.total_de_paginas ?? 0);
      if (!Number.isSafeInteger(paginas) || paginas < 0 || paginas > 1000) {
        throw new Error("Paginação inesperada do Omie; sincronização interrompida.");
      }
      const lista = resultado.requisicaoCadastro;
      if (!Array.isArray(lista)) throw new Error(`Página ${pagina} sem requisicaoCadastro.`);
      for (const item of lista) {
        const normalizado = normalizar(item);
        if (todos.has(normalizado.codigo)) throw new Error(
          `Requisição repetida em páginas diferentes: ${normalizado.codigo}. Repita a consulta.`);
        todos.set(normalizado.codigo, normalizado);
      }
      pagina++;
      if (pagina <= paginas) {
        const { error } = await admin.from("sincronizacao_requisicoes_omie")
          .update({ atualizado_em: new Date().toISOString(), mensagem: `Página ${pagina - 1}/${paginas}` })
          .eq("id", 1);
        if (error) throw error;
      }
    } while (pagina <= paginas);

    let novas = 0;
    let alteradas = 0;
    let iguais = 0;
    const lote = Array.from(todos.values());
    for (let i = 0; i < lote.length; i += 50) {
      const { data, error } = await admin.rpc("registrar_lote_requisicoes_omie", {
        p_requisicoes: lote.slice(i, i + 50),
      });
      if (error) throw error;
      novas += Number(data?.novas ?? 0);
      alteradas += Number(data?.alteradas ?? 0);
      iguais += Number(data?.iguais ?? 0);
    }
    const fim = new Date().toISOString();
    const { error: fimErro } = await admin.from("sincronizacao_requisicoes_omie")
      .update({ status: "sucesso", finalizado_em: fim, atualizado_em: fim,
        total_requisicoes: lote.length, total_alteradas: alteradas, total_paginas: paginas,
        mensagem: `Concluído: ${novas} novas, ${alteradas} alteradas, ${iguais} sem mudança.` })
      .eq("id", 1);
    if (fimErro) throw fimErro;
    travado = false;
    return resposta({ sucesso: true, paginas, total: lote.length, novas, alteradas, iguais });
  } catch (e) {
    console.error("Falha na sincronização de requisições:", mensagem(e));
    if (travado) {
      const fim = new Date().toISOString();
      await admin.from("sincronizacao_requisicoes_omie")
        .update({ status: "erro", finalizado_em: fim, atualizado_em: fim,
          mensagem: mensagem(e).slice(0, 800) }).eq("id", 1);
    }
    return resposta({ sucesso: false, erro: mensagem(e) }, 500);
  }
});
