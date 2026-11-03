import { createClient } from "npm:@supabase/supabase-js@2";
import {
  codigosProdutos,
  extrairEstrutura,
  falhaTemporaria,
  ordemLeitura,
  semEstrutura,
} from "./estrutura-core.mjs";

/*
 * Nec. Compra MP — estrutura (malha) dos produtos dos pedidos de venda em
 * aberto, lida do Omie (geral/malha ConsultarEstrutura). Grava só as linhas
 * de matéria-prima do 1º nível. Regras em estrutura-core.mjs.
 *
 * Corpo (JSON, opcional): { "codigos": ["11234"], "dry_run": true }
 *   Sem "codigos": todos os produtos de pedidos_omie (ativo, status Pedido),
 *   nunca lidos primeiro, depois os mais antigos, até o tempo acabar.
 */
const URL_MALHA = "https://app.omie.com.br/api/v1/geral/malha/";
const PRAZO_MS = 110000;
const PAUSA_MS = 400;

const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mensagem = (e: unknown) =>
  e instanceof Error ? e.message : ((e as { message?: string })?.message ?? String(e));

// deno-lint-ignore no-explicit-any
type Json = any;

async function consultar(
  codigo: string,
  key: string,
  secret: string,
): Promise<{ resposta: Json | null; erro: string | null }> {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), 30000);
    try {
      const r = await fetch(URL_MALHA, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controle.signal,
        body: JSON.stringify({
          call: "ConsultarEstrutura",
          app_key: key,
          app_secret: secret,
          param: [{ idProduto: 0, intProduto: "", codProduto: codigo }],
        }),
      });
      const d = await r.json();
      const falha = String(d?.faultstring ?? "");
      if (!falha) return { resposta: d, erro: null };
      if (semEstrutura(falha)) return { resposta: null, erro: null };
      if (falhaTemporaria(falha) && tentativa < 4) {
        const segundos = Number(falha.match(/aguarde\s+(\d+)/i)?.[1]);
        await esperar(
          Number.isFinite(segundos) ? Math.min(segundos, 30) * 1000 + 2000 : 4000 * tentativa,
        );
        continue;
      }
      return { resposta: null, erro: falha };
    } catch (e) {
      if (tentativa < 4) {
        await esperar(3000);
        continue;
      }
      return { resposta: null, erro: mensagem(e) };
    } finally {
      clearTimeout(timer);
    }
  }
  return { resposta: null, erro: "falha após tentativas" };
}

Deno.serve(async (req) => {
  if (req.method !== "POST")
    return responder({ sucesso: false, erro: "Método não permitido" }, 405);
  const inicio = Date.now();
  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const key = Deno.env.get("OMIE_APP_KEY");
  const secret = Deno.env.get("OMIE_APP_SECRET");
  if (!url || !service || !key || !secret)
    return responder({ sucesso: false, erro: "Configuração ausente" }, 500);

  const db = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const auth = await db.rpc("validar_token_cron_pedidos_compra", {
    p_token: req.headers.get("x-cron-secret") || "",
  });
  if (auth.error || auth.data !== true)
    return responder({ sucesso: false, erro: "Não autorizado" }, 401);

  const corpo = await req.json().catch(() => ({}));
  const simulacao = corpo?.dry_run === true;

  try {
    let codigos: string[];
    if (Array.isArray(corpo?.codigos) && corpo.codigos.length) {
      codigos = codigosProdutos(corpo.codigos.map((c: unknown) => ({ codigo_produto: c })));
    } else {
      const { data, error } = await db
        .from("pedidos_omie")
        .select("codigo_produto")
        .eq("ativo", true)
        .eq("status", "Pedido");
      if (error) throw error;
      codigos = codigosProdutos(data ?? []);
    }
    const { data: lidos, error: erroLidos } = await db
      .from("necessidade_mp_estrutura_produtos_omie")
      .select("codigo_produto,sincronizado_em");
    if (erroLidos) throw erroLidos;
    const fila = ordemLeitura(codigos, lidos ?? []);

    const resumo = {
      produtos: fila.length,
      lidos: 0,
      com_materia_prima: 0,
      sem_estrutura: 0,
      erros: 0,
      pendentes: 0,
    };
    const detalhe: Json[] = [];
    for (const codigo of fila) {
      if (Date.now() - inicio > PRAZO_MS) {
        resumo.pendentes = fila.length - resumo.lidos;
        break;
      }
      const { resposta, erro } = await consultar(codigo, key, secret);
      const { produto, itens } = extrairEstrutura(codigo, resposta, erro);
      resumo.lidos += 1;
      if (erro) resumo.erros += 1;
      else if (itens.length) resumo.com_materia_prima += 1;
      else resumo.sem_estrutura += 1;
      if (simulacao) {
        detalhe.push({ produto, itens });
      } else {
        const p = await db
          .from("necessidade_mp_estrutura_produtos_omie")
          .upsert({ ...produto, sincronizado_em: new Date().toISOString() });
        if (p.error) throw p.error;
        const d = await db
          .from("necessidade_mp_estrutura_itens_omie")
          .delete()
          .eq("codigo_produto", codigo);
        if (d.error) throw d.error;
        if (itens.length) {
          const i = await db.from("necessidade_mp_estrutura_itens_omie").insert(itens);
          if (i.error) throw i.error;
        }
      }
      await esperar(PAUSA_MS);
    }

    return responder({
      sucesso: true,
      dry_run: simulacao,
      ...resumo,
      ...(simulacao ? { detalhe } : {}),
      duracao_ms: Date.now() - inicio,
    });
  } catch (e) {
    return responder(
      { sucesso: false, erro: mensagem(e).slice(0, 500), duracao_ms: Date.now() - inicio },
      500,
    );
  }
});
