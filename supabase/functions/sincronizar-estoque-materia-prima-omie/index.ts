import { createClient } from "npm:@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { comRetentativa } from "./omie-retentativa.mjs";

const LOCAL = 2333946061;
const URL_OMIE = "https://app.omie.com.br/api/v1/estoque/consulta/";
const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-cron-token",
};
const resposta = (status: number, dados: unknown) =>
  new Response(JSON.stringify(dados), { status, headers });
const normalizar = (v: unknown) =>
  String(v ?? "")
    .trim()
    .toUpperCase();
function numeroObrigatorio(v: unknown, nome: string) {
  if (v === null || v === undefined || String(v).trim() === "") {
    throw new Error(`Campo ausente no retorno Omie: ${nome}`);
  }
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Valor inválido no retorno Omie: ${nome}`);
  return n;
}
function numeroOpcional(v: unknown) {
  if (v === null || v === undefined || String(v).trim() === "") return 0;
  return numeroObrigatorio(v, "valor opcional");
}
function dataBrasil() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

// Repete a página quando o Omie recusa por chamada simultânea ou redundante
// (outro sistema com a mesma chave consultando estoque no mesmo minuto).
function paginaOmie(pagina: number, data: string, key: string, secret: string) {
  return comRetentativa(() => paginaOmieUmaVez(pagina, data, key, secret), esperar);
}

async function paginaOmieUmaVez(pagina: number, data: string, key: string, secret: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const http = await fetch(URL_OMIE, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        call: "ListarPosEstoque",
        app_key: key,
        app_secret: secret,
        param: [
          {
            nPagina: pagina,
            nRegPorPagina: 50,
            dDataPosicao: data,
            cExibeTodos: "S",
            codigo_local_estoque: LOCAL,
            cTipoItem: "01",
          },
        ],
      }),
    });
    const body = await http.json();
    if (!http.ok || body?.faultstring || body?.faultcode) {
      throw new Error(body?.faultstring || `Erro HTTP ${http.status} no Omie`);
    }
    if (!Array.isArray(body?.produtos)) throw new Error("Retorno Omie sem lista de produtos");
    return body;
  } finally {
    clearTimeout(timer);
  }
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return resposta(200, { ok: true });
  if (req.method !== "POST") return resposta(405, { sucesso: false, erro: "Método não permitido" });
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const appKey = Deno.env.get("OMIE_APP_KEY");
    const appSecret = Deno.env.get("OMIE_APP_SECRET");
    if (!url || !anonKey || !serviceRole || !appKey || !appSecret) {
      throw new Error("Configuração ausente na função");
    }

    const db = createClient(url, serviceRole);
    const tokenCron = req.headers.get("x-cron-token") || "";
    let autorizado = false;
    if (tokenCron) {
      const { data: credencial, error: erroToken } = await db
        .from("integracao_cron_tokens")
        .select("token")
        .eq("rotina", "estoque_materia_prima")
        .single();
      if (erroToken) throw erroToken;
      const encoder = new TextEncoder();
      const a = encoder.encode(tokenCron);
      const b = encoder.encode(String(credencial?.token || ""));
      let diferenca = a.length ^ b.length;
      for (let i = 0; i < Math.max(a.length, b.length); i++) {
        diferenca |= (a[i] || 0) ^ (b[i] || 0);
      }
      autorizado = b.length > 0 && diferenca === 0;
    }
    if (!autorizado) {
      const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (jwt) {
        const sessao = createClient(url, anonKey);
        const { data: usuario, error: erroAuth } = await sessao.auth.getUser(jwt);
        autorizado = !erroAuth && !!usuario.user;
      }
    }
    if (!autorizado) return resposta(401, { sucesso: false, erro: "Acesso não autorizado" });
    const { data: materiais, error: erroMateriais } = await db
      .from("materia_prima_materiais")
      .select("id,nome,codigo_omie")
      .eq("ativo", true);
    if (erroMateriais) throw erroMateriais;

    const cadastrados = (materiais || []).filter((m) => normalizar(m.codigo_omie));
    if (!cadastrados.length) throw new Error("Nenhuma matéria-prima com código Omie");

    const { data: itens, error: erroItens } = await db
      .from("materiais_compra_omie")
      .select("codigo_produto_omie,codigo_produto,descricao,unidade,categoria");
    if (erroItens) throw erroItens;
    const porCodigo = new Map((itens || []).map((i) => [normalizar(i.codigo_produto), i]));
    const porCodigoManual = new Map(cadastrados.map((m) => [normalizar(m.codigo_omie), m]));
    const mapa = new Map(
      (itens || [])
        .filter((i) => porCodigoManual.has(normalizar(i.codigo_produto)))
        .map((i) => [String(i.codigo_produto_omie), i]),
    );
    const data = dataBrasil();
    const primeira = await paginaOmie(1, data, appKey, appSecret);
    const total = numeroObrigatorio(primeira.nTotPaginas, "nTotPaginas");
    if (!Number.isInteger(total) || total < 1 || total > 100) {
      throw new Error("Paginação inválida no Omie");
    }
    const posicoes = [...primeira.produtos];
    for (let n = 2; n <= total; n++) {
      const pagina = await paginaOmie(n, data, appKey, appSecret);
      posicoes.push(...pagina.produtos);
    }

    const selecionadas = posicoes.filter(
      (p) =>
        Number(p?.codigo_local_estoque) === LOCAL &&
        (porCodigoManual.has(normalizar(p?.cCodigo)) || mapa.has(String(p?.nCodProd))),
    );
    if (!selecionadas.length) {
      return resposta(422, {
        sucesso: false,
        erro: "Nenhuma posição retornada para o local e os materiais informados. Nenhum dado gravado.",
        local_estoque: LOCAL,
        paginas: total,
      });
    }
    const agora = new Date().toISOString();
    const [dia, mes, ano] = data.split("/");
    const linhas = selecionadas.map((p) => {
      const produto = mapa.get(String(p.nCodProd));
      const codigo = produto?.codigo_produto ?? String(p.cCodigo ?? "").trim();
      if (!porCodigoManual.has(normalizar(codigo)))
        throw new Error("Código retornado não corresponde ao cadastro manual");
      return {
        codigo_produto_omie: numeroObrigatorio(p.nCodProd, "nCodProd"),
        codigo_produto: codigo,
        descricao: produto?.descricao ?? String(p.cDescricao ?? "").trim(),
        categoria: "2.01.03",
        unidade: "KG",
        codigo_local_estoque: LOCAL,
        preco_unitario: numeroOpcional(p.nPrecoUnitario),
        saldo: numeroOpcional(p.nSaldo),
        cmc: numeroOpcional(p.nCMC),
        pendente: numeroOpcional(p.nPendente),
        estoque_minimo: numeroOpcional(p.estoque_minimo),
        reservado: numeroOpcional(p.reservado),
        fisico: numeroObrigatorio(p.fisico, "fisico"),
        data_posicao: `${ano}-${mes}-${dia}`,
        ativo: true,
        sincronizado_em: agora,
        atualizado_em: agora,
      };
    });
    const unicos = new Set(linhas.map((l) => l.codigo_produto_omie));
    if (unicos.size !== linhas.length) {
      throw new Error("Posições duplicadas para o mesmo produto no local selecionado");
    }
    const { error: erroGravacao } = await db
      .from("estoque_materia_prima_omie")
      .upsert(linhas, { onConflict: "codigo_produto_omie,codigo_local_estoque" });
    if (erroGravacao) throw erroGravacao;
    const { data: antigos, error: erroAntigos } = await db
      .from("estoque_materia_prima_omie")
      .select("id,codigo_produto")
      .eq("codigo_local_estoque", LOCAL);
    if (erroAntigos) throw erroAntigos;
    const idsAntigos = (antigos || [])
      .filter((r) => !porCodigoManual.has(normalizar(r.codigo_produto)))
      .map((r) => r.id);
    if (idsAntigos.length) {
      const { error: erroLimpeza } = await db
        .from("estoque_materia_prima_omie")
        .delete()
        .in("id", idsAntigos)
        .eq("codigo_local_estoque", LOCAL);
      if (erroLimpeza) throw erroLimpeza;
    }
    return resposta(200, {
      sucesso: true,
      local_estoque: LOCAL,
      local_nome: "MATÉRIA PRIMA / PRODUTO",
      materiais_cadastrados: cadastrados.length,
      posicoes_atualizadas: linhas.length,
      registros_antigos_removidos: idsAntigos.length,
      codigos_sem_posicao: cadastrados
        .filter(
          (m) => !linhas.some((l) => normalizar(l.codigo_produto) === normalizar(m.codigo_omie)),
        )
        .map((m) => m.codigo_omie),
      paginas_omie: total,
      data_posicao: data,
      saldos: linhas.map((l) => ({ codigo: l.codigo_produto, fisico_kg: l.fisico })),
    });
  } catch (erro) {
    return resposta(500, {
      sucesso: false,
      erro:
        erro instanceof Error
          ? erro.message
          : erro && typeof erro === "object" && "message" in erro
            ? String(erro.message)
            : String(erro),
    });
  }
});
