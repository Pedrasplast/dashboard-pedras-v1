import { createClient } from "npm:@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { comRetentativa } from "./omie-retentativa.mjs";

const URL_ESTOQUE = "https://app.omie.com.br/api/v1/estoque/consulta/";
const PAGINA_BASE = 500;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function supabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Credenciais do Supabase não encontradas.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function numero(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function textoErro(e: unknown) {
  return e instanceof Error ? e.message : String(e ?? "Erro desconhecido");
}

function formatarDataBrasil(data: Date) {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(data);
  const mapa = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  return `${mapa.day}/${mapa.month}/${mapa.year}`;
}

function dataBrParaIso(v: string) {
  const m = String(v ?? "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

async function carregarBaseCompleta(supabase: any) {
  const todas: any[] = [];
  let inicio = 0;

  while (true) {
    const fim = inicio + PAGINA_BASE - 1;
    const { data, error } = await supabase
      .from("estoque_produto_acabado_omie")
      .select("id,codigo_produto_omie,codigo_local_estoque,tipo_item,ativo")
      .order("id", { ascending: true })
      .range(inicio, fim);

    if (error) throw new Error(`Lendo base definitiva: ${error.message}`);

    const lote = data ?? [];
    todas.push(...lote);

    if (lote.length < PAGINA_BASE) break;
    inicio += PAGINA_BASE;
  }

  return todas;
}

async function chamarUmaVez(
  pagina: number,
  dataPosicao: string,
  appKey: string,
  appSecret: string,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const resposta = await fetch(URL_ESTOQUE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        call: "ListarPosEstoque",
        app_key: appKey,
        app_secret: appSecret,
        param: [{
          nPagina: pagina,
          nRegPorPagina: 100,
          dDataPosicao: dataPosicao,
          cExibeTodos: "N",
          lista_local_estoque: "TODOS",
          cTipoItem: "04",
        }],
      }),
    });

    const texto = await resposta.text();
    let dados: any = {};
    try {
      dados = texto ? JSON.parse(texto) : {};
    } catch {
      throw new Error(`ListarPosEstoque: retorno inválido. HTTP ${resposta.status}.`);
    }

    if (!resposta.ok || dados?.faultstring || dados?.faultcode) {
      throw new Error(
        `ListarPosEstoque: ${dados?.faultstring || dados?.description || dados?.message || `HTTP ${resposta.status}`}`,
      );
    }

    return dados;
  } catch (erro) {
    if (erro instanceof Error && erro.name === "AbortError") {
      throw new Error("ListarPosEstoque: tempo limite excedido.");
    }
    throw erro;
  } finally {
    clearTimeout(timeout);
  }
}

// Antes: só repetia "requisição sendo executada", após 2/4/6 s. Repetir tão
// rápido fazia o Omie responder "Consumo redundante" e a execução desistia.
// Agora espera 5/10/15 s quando o Omie está ocupado e o tempo que ele pede
// (até 60 s) no consumo redundante; outros erros continuam falhando na hora.
function chamarOmie(
  pagina: number,
  dataPosicao: string,
  appKey: string,
  appSecret: string,
) {
  return comRetentativa(() => chamarUmaVez(pagina, dataPosicao, appKey, appSecret), esperar);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  const inicioMs = Date.now();
  const iniciadoEm = new Date().toISOString();
  let supabase: any = null;
  let travou = false;

  try {
    const appKey = Deno.env.get("OMIE_APP_KEY");
    const appSecret = Deno.env.get("OMIE_APP_SECRET");
    if (!appKey || !appSecret) throw new Error("Credenciais do Omie não configuradas.");

    supabase = supabaseAdmin();

    // Mesma trava usada pela sincronização completa: nunca escrevem juntas.
    const lock = await supabase.rpc("tentar_iniciar_sincronizacao_estoque_omie", {
      p_iniciado_em: iniciadoEm,
    });

    if (lock.error) throw new Error(`Obtendo trava compartilhada: ${lock.error.message}`);
    travou = lock.data === true;

    if (!travou) {
      return new Response(JSON.stringify({
        sucesso: true,
        ignorado: true,
        modo: "rapido",
        motivo: "Existe outra sincronização de estoque em andamento.",
        criou_cron: false,
        duracao_ms: Date.now() - inicioMs,
      }, null, 2), { status: 200, headers });
    }

    await supabase
      .from("sincronizacao_estoque_omie")
      .update({
        etapa: "rapido_consultando_omie",
        pagina_atual: 0,
        total_paginas: 0,
        quantidade_produtos: 0,
        mensagem: "Sincronização rápida: consultando posição de estoque",
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", 1);

    const [base, locaisResult] = await Promise.all([
      carregarBaseCompleta(supabase),
      supabase
        .from("locais_estoque_omie")
        .select("codigo_local_estoque,inativo")
        .eq("inativo", false),
    ]);

    if (locaisResult.error) {
      throw new Error(`Lendo locais ativos: ${locaisResult.error.message}`);
    }

    const locaisAtivos = new Set(
      (locaisResult.data ?? []).map((l: any) => String(l.codigo_local_estoque)),
    );

    const baseValida = base.filter((b: any) =>
      b.ativo === true &&
      String(b.tipo_item) === "04" &&
      locaisAtivos.has(String(b.codigo_local_estoque))
    );

    const chavesBase = new Set(
      baseValida.map((b: any) => `${String(b.codigo_produto_omie)}:${String(b.codigo_local_estoque)}`),
    );

    const produtosBase = new Set(
      baseValida.map((b: any) => String(b.codigo_produto_omie)),
    );

    if (chavesBase.size === 0) {
      throw new Error("Base definitiva vazia ou sem posições válidas; sincronização rápida cancelada.");
    }

    const dataPosicaoBr = formatarDataBrasil(new Date());
    const dataPosicaoIso = dataBrParaIso(dataPosicaoBr);
    if (!dataPosicaoIso) throw new Error("Não foi possível converter a data de posição.");

    let pagina = 1;
    let totalPaginas = 1;
    const posicoes: any[] = [];

    do {
      const dados = await chamarOmie(pagina, dataPosicaoBr, appKey, appSecret);
      const lista = Array.isArray(dados?.produtos) ? dados.produtos : [];
      posicoes.push(...lista);
      totalPaginas = Math.max(1, numero(dados?.nTotPaginas) || 1);
      pagina++;
      if (pagina <= totalPaginas) await esperar(120);
    } while (pagina <= totalPaginas);

    const posicoesFiltradas = posicoes
      .filter((p: any) => locaisAtivos.has(String(p?.codigo_local_estoque ?? "")))
      .filter((p: any) =>
        chavesBase.has(`${String(p?.nCodProd ?? "")}:${String(p?.codigo_local_estoque ?? "")}`)
      )
      .map((p: any) => ({
        codigo_produto_omie: numero(p?.nCodProd),
        codigo_local_estoque: numero(p?.codigo_local_estoque),
        saldo: numero(p?.nSaldo),
        fisico: numero(p?.fisico),
        reservado: numero(p?.reservado),
      }));

    if (!posicoesFiltradas.length) {
      throw new Error("Consulta rápida não retornou nenhuma posição válida; nenhuma alteração foi aplicada.");
    }

    const chavesRetorno = new Set(
      posicoesFiltradas.map((p: any) => `${p.codigo_produto_omie}:${p.codigo_local_estoque}`),
    );

    if (chavesRetorno.size !== posicoesFiltradas.length) {
      throw new Error("Consulta rápida retornou chaves duplicadas; nenhuma alteração foi aplicada.");
    }

    const sincronizadoEm = new Date().toISOString();

    const { data: resultado, error: erroRpc } = await supabase.rpc(
      "aplicar_snapshot_rapido_estoque_omie",
      {
        p_sincronizado_em: sincronizadoEm,
        p_data_posicao: dataPosicaoIso,
        p_posicoes: posicoesFiltradas,
      },
    );

    if (erroRpc) throw new Error(`Aplicando snapshot rápido: ${erroRpc.message}`);

    const { count: totalDepois, error: erroContagem } = await supabase
      .from("estoque_produto_acabado_omie")
      .select("id", { count: "exact", head: true });

    if (erroContagem) throw new Error(`Contando estoque após snapshot: ${erroContagem.message}`);

    const { data: matrizDados, error: erroMatriz } = await supabase
      .from("estoque_produto_acabado_omie")
      .select("saldo,pendente")
      .eq("codigo_local_estoque", 2333946061)
      .eq("ativo", true)
      .eq("tipo_item", "04");

    if (erroMatriz) throw new Error(`Conferindo Matriz: ${erroMatriz.message}`);

    const matrizComSaldo = (matrizDados ?? []).filter((r: any) => numero(r.saldo) !== 0).length;
    const pendenteTotalMatriz = (matrizDados ?? []).reduce(
      (acc: number, r: any) => acc + numero(r.pendente),
      0,
    );

    const fim = new Date().toISOString();
    const duracaoMs = Date.now() - inicioMs;

    const conclusao = await supabase
      .from("sincronizacao_estoque_omie")
      .update({
        ultima_sincronizacao: fim,
        fim_em: fim,
        status: "sucesso",
        etapa: "rapido_concluido",
        pagina_atual: totalPaginas,
        total_paginas: totalPaginas,
        quantidade_produtos: produtosBase.size,
        duracao_ms: duracaoMs,
        mensagem: `Sincronização rápida concluída: ${posicoesFiltradas.length} posições aplicadas; campo pendente preservado.`,
        atualizado_em: fim,
      })
      .eq("id", 1);

    if (conclusao.error) {
      throw new Error(`Finalizando controle da sincronização rápida: ${conclusao.error.message}`);
    }

    return new Response(JSON.stringify({
      sucesso: true,
      modo: "rapido",
      cExibeTodos: "N",
      versao_logica: 3,
      base_paginada: true,
      trava_compartilhada_com_sincronizacao_completa: true,
      tabela: "estoque_produto_acabado_omie",
      tipo_item: "04",
      somente_produtos_ja_validados_na_base: true,
      somente_locais_ativos: true,
      campo_pendente_preservado: true,
      criou_cron: false,
      linhas_base_lidas: base.length,
      chaves_base_validas: chavesBase.size,
      produtos_base_validos: produtosBase.size,
      paginas_estoque: totalPaginas,
      registros_retornados_omie: posicoes.length,
      posicoes_validas_aplicadas: posicoesFiltradas.length,
      resultado_snapshot: resultado,
      linhas_depois: totalDepois ?? 0,
      matriz: {
        registros: (matrizDados ?? []).length,
        produtos_com_saldo_diferente_zero: matrizComSaldo,
        pendente_total_preservado: pendenteTotalMatriz,
      },
      data_posicao: dataPosicaoBr,
      duracao_ms: duracaoMs,
    }, null, 2), { status: 200, headers });
  } catch (erro) {
    if (supabase && travou) {
      const fim = new Date().toISOString();
      await supabase
        .from("sincronizacao_estoque_omie")
        .update({
          fim_em: fim,
          status: "erro",
          etapa: "rapido_erro",
          duracao_ms: Date.now() - inicioMs,
          mensagem: textoErro(erro).slice(0, 1000),
          atualizado_em: fim,
        })
        .eq("id", 1);
    }

    return new Response(JSON.stringify({
      sucesso: false,
      modo: "rapido",
      versao_logica: 3,
      base_paginada: true,
      trava_compartilhada_com_sincronizacao_completa: true,
      criou_cron: false,
      erro: textoErro(erro),
      duracao_ms: Date.now() - inicioMs,
    }, null, 2), { status: 500, headers });
  }
});
