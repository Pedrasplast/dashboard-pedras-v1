import { createClient } from "npm:@supabase/supabase-js@2";
import {
  DIAS_JANELA,
  parametrosPesquisa,
  periodo,
  extrairItens,
  calcularMedias,
} from "./precos-core.mjs";

/*
 * Atualiza os itens de compra que entram na média da Tabela de Preços
 * (tabela precos_compras_mp_omie). Regras em precos-core.mjs.
 *
 * - Consulta PesquisarPedCompra (todas as situações menos Cancelado) e
 *   filtra etapa 15, departamento 11, materiais cadastrados e data de
 *   inclusão nos últimos 60 dias.
 * - Só grava se leu todas as páginas; senão mantém os dados anteriores.
 * - { "dry_run": true } calcula e devolve as médias sem gravar.
 */
const URL_OMIE = "https://app.omie.com.br/api/v1/produtos/pedidocompra/";
const POR_PAGINA = 50;
const LIMITE_PAGINAS = 40;
// Filtro de datas do Omie (dDataInicial/dDataFinal) não é a data de inclusão:
// consultamos com folga para frente e filtramos a inclusão no código.
const FOLGA_FINAL_DIAS = 180;
const PRAZO_MS = 125000;

const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mensagem = (e: unknown) => (e instanceof Error ? e.message : String(e));
const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function dataBr(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric",
  }).format(d);
}

async function pesquisar(pagina: number, di: string, df: string, key: string, secret: string) {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), 30000);
    try {
      const r = await fetch(URL_OMIE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controle.signal,
        body: JSON.stringify({
          call: "PesquisarPedCompra", app_key: key, app_secret: secret,
          param: [parametrosPesquisa(pagina, di, df, POR_PAGINA)],
        }),
      });
      const d = await r.json();
      const falha = String(d?.faultstring ?? d?.faultcode ?? "");
      if (falha) {
        const n = semAcento(falha);
        if (pagina === 1 && n.includes("nao existem registros")) return { pedidos: [], paginas: 0 };
        if ((n.includes("redundante") || n.includes("sendo executada")) && tentativa < 4) {
          const segundos = Number(n.match(/aguarde\s+(\d+)/)?.[1]);
          await esperar(Number.isFinite(segundos) ? Math.min(segundos, 60) * 1000 + 2000 : 5000 * tentativa);
          continue;
        }
        throw new Error(`Omie (página ${pagina}): ${falha}`);
      }
      if (!Array.isArray(d?.pedidos_pesquisa)) throw new Error(`Omie (página ${pagina}): resposta sem pedidos_pesquisa`);
      const paginas = Number(d?.nTotalPaginas);
      if (!Number.isInteger(paginas) || paginas < 1) throw new Error("Paginação inválida no Omie");
      return { pedidos: d.pedidos_pesquisa, paginas };
    } catch (e) {
      if (tentativa < 4 && e instanceof Error && e.name === "AbortError") { await esperar(3000); continue; }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Omie: falha após tentativas");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return responder({ sucesso: false, erro: "Método não permitido" }, 405);
  const inicio = Date.now();

  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const key = Deno.env.get("OMIE_APP_KEY");
  const secret = Deno.env.get("OMIE_APP_SECRET");
  if (!url || !service || !key || !secret) return responder({ sucesso: false, erro: "Configuração ausente" }, 500);

  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const auth = await db.rpc("validar_token_cron_pedidos_compra", { p_token: req.headers.get("x-cron-secret") || "" });
  if (auth.error || auth.data !== true) return responder({ sucesso: false, erro: "Não autorizado" }, 401);

  const corpo = await req.json().catch(() => ({}));
  const simulacao = corpo?.dry_run === true;

  try {
    const { data: materiais, error: erroMateriais } = await db
      .from("materia_prima_materiais").select("codigo_omie").eq("ativo", true);
    if (erroMateriais) throw erroMateriais;
    const codigos = new Set(
      (materiais ?? []).map((m) => String(m.codigo_omie ?? "").trim().toUpperCase()).filter(Boolean),
    );
    if (!codigos.size) throw new Error("Nenhuma matéria-prima ativa com código Omie");

    const janela = periodo(new Date(), DIAS_JANELA);
    const fimConsulta = new Date();
    fimConsulta.setUTCDate(fimConsulta.getUTCDate() + FOLGA_FINAL_DIAS);
    const dataFinalConsulta = dataBr(fimConsulta);

    const pedidos: unknown[] = [];
    let pagina = 1;
    let paginas = 1;
    do {
      if (Date.now() - inicio > PRAZO_MS) {
        throw new Error(`Tempo esgotado na página ${pagina} de ${paginas}; nada foi gravado.`);
      }
      const r = await pesquisar(pagina, janela.inicio, dataFinalConsulta, key, secret);
      if (pagina > 1 && r.paginas !== paginas) throw new Error("Paginação do Omie mudou durante a leitura; nada foi gravado.");
      paginas = r.paginas;
      pedidos.push(...r.pedidos);
      pagina += 1;
      if (pagina <= paginas) await esperar(700);
    } while (pagina <= paginas && pagina <= LIMITE_PAGINAS);

    if (paginas > LIMITE_PAGINAS) throw new Error(`Omie retornou ${paginas} páginas (limite ${LIMITE_PAGINAS}); nada foi gravado.`);

    const itens = extrairItens(pedidos, codigos, janela.inicioIso, janela.fimIso);
    const medias = calcularMedias(itens, janela.fimIso);

    let gravacao: unknown = null;
    if (!simulacao) {
      const { data, error } = await db.rpc("substituir_precos_compras_mp", {
        p_desde: janela.inicioIso,
        p_itens: itens,
      });
      if (error) throw error;
      gravacao = data;
    }

    return responder({
      sucesso: true,
      dry_run: simulacao,
      periodo_inclusao: [janela.inicio, janela.fim],
      consulta_omie: { dDataInicial: janela.inicio, dDataFinal: dataFinalConsulta, paginas, pedidos_lidos: pedidos.length },
      itens: itens.length,
      medias,
      gravacao,
      ...(simulacao ? { detalhe: itens } : {}),
      duracao_ms: Date.now() - inicio,
    });
  } catch (e) {
    return responder({ sucesso: false, erro: mensagem(e).slice(0, 500), duracao_ms: Date.now() - inicio }, 500);
  }
});
