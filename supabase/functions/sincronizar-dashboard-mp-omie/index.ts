import { createClient } from "npm:@supabase/supabase-js@2";
import {
  codigosPedidos,
  dataBR,
  extrairItensNota,
  extrairItensPedidos,
  janela,
  notasCandidatas,
  parametrosEncerrados,
  parametrosPesquisa,
} from "./dashboard-mp-core.mjs";

/*
 * Dashboard de Matéria-Prima — origem Omie (separada da base manual).
 * Regras em dashboard-mp-core.mjs.
 *
 * Corpo (JSON):
 *   pedidos: { "tipo": "pedidos", "desde": "aaaa-mm-dd", "ate": "aaaa-mm-dd",
 *              "pagina_inicial": 1, "max_paginas": 60, "dry_run": true }
 *            Incremental: incluídos ou alterados no período (padrão: últimos
 *            7 dias). Grava por página; "proxima_pagina" diz onde continuar.
 *            Cancelados e pedidos que saíram do departamento 11 são removidos.
 *   encerrados: { "tipo": "encerrados", "desde": "aaaa-mm-dd", "pagina_inicial": 1 }
 *            Só marca os pedidos Encerrados no Omie (também roda no fim de "pedidos").
 *   notas:   { "tipo": "notas", "de": "aaaa-mm-dd", "ate": "aaaa-mm-dd" }
 *            NF-e de entrada emitidas no período (padrão: últimos 60 dias),
 *            só as ligadas aos pedidos já gravados; troca a janela inteira.
 */
const URL_PEDIDOS = "https://app.omie.com.br/api/v1/produtos/pedidocompra/";
const URL_NOTAS = "https://app.omie.com.br/api/v1/produtos/recebimentonfe/";
const POR_PAGINA_PADRAO = 100;
const LIMITE_PAGINAS = 60;
// O filtro de datas padrão do PesquisarPedCompra segue a previsão e deixa
// pedidos de fora (teste de 22/10). Com lApenasAlterados = 'T' o período vale
// pela inclusão/alteração: buscamos "incluídos ou alterados desde X".
// Padrão da rotina diária: incluídos/alterados nos últimos 7 dias (sobra
// para dias sem execução, como fins de semana e feriados).
const DIAS_INCREMENTAL = 7;
const PRAZO_MS = 125000;
// Uma página de 100 pedidos leva ~14 s no Omie: só começa outra se sobrar tempo.
const PRAZO_NOVA_PAGINA_MS = 105000;
const PAUSA_PAGINAS_MS = 700;
const PAUSA_NOTAS_MS = 400;

const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const mensagem = (e: unknown) => (e instanceof Error ? e.message : String(e));
const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// deno-lint-ignore no-explicit-any
type Json = any;

async function omie(
  url: string,
  call: string,
  param: unknown,
  key: string,
  secret: string,
): Promise<Json | null> {
  for (let tentativa = 1; tentativa <= 4; tentativa++) {
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), 30000);
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controle.signal,
        body: JSON.stringify({ call, app_key: key, app_secret: secret, param: [param] }),
      });
      const d = await r.json();
      const falha = String(d?.faultstring ?? d?.faultcode ?? "");
      if (falha) {
        const n = semAcento(falha);
        if (n.includes("nao existem registros")) return null;
        if ((n.includes("redundante") || n.includes("sendo executada")) && tentativa < 4) {
          const segundos = Number(n.match(/aguarde\s+(\d+)/)?.[1]);
          await esperar(
            Number.isFinite(segundos) ? Math.min(segundos, 60) * 1000 + 2000 : 5000 * tentativa,
          );
          continue;
        }
        throw new Error(`Omie ${call}: ${falha}`);
      }
      return d;
    } catch (e) {
      if (tentativa < 4 && e instanceof Error && e.name === "AbortError") {
        await esperar(3000);
        continue;
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`Omie ${call}: falha após tentativas`);
}

Deno.serve(async (req) => {
  if (req.method !== "POST")
    return responder({ sucesso: false, erro: "Método não permitido" }, 405);
  const inicio = Date.now();
  const noPrazo = (onde: string) => {
    if (Date.now() - inicio > PRAZO_MS)
      throw new Error(`Tempo esgotado em ${onde}; nada foi gravado.`);
  };

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
  const tipo = ["notas", "pedidos", "encerrados"].includes(corpo?.tipo) ? corpo.tipo : null;
  const simulacao = corpo?.dry_run === true;

  try {
    if (!tipo) throw new Error('Informe "tipo": "pedidos", "encerrados" ou "notas"');
    const j = janela({ de: corpo?.de, ate: corpo?.ate });
    const jp = janela(
      { de: corpo?.desde ?? corpo?.de, ate: corpo?.ate },
      new Date(),
      DIAS_INCREMENTAL,
    );

    /* ---------------------------- ENCERRADOS ---------------------------- */
    // Marca os pedidos Encerrados no Omie (não contam como compra em aberto).
    // Roda no fim da leitura de pedidos e também sozinho ({"tipo":"encerrados"}).
    const marcarEncerrados = async (
      desde: string,
      ate: string,
      paginaInicial = 1,
      maxPaginas = LIMITE_PAGINAS,
    ) => {
      const r = {
        paginas: 0,
        encerrados_lidos: 0,
        marcados: 0,
        proxima_pagina: null as number | null,
      };
      let pagina = paginaInicial;
      let paginas = paginaInicial;
      do {
        if (Date.now() - inicio > PRAZO_NOVA_PAGINA_MS) {
          r.proxima_pagina = pagina;
          break;
        }
        const d = await omie(
          URL_PEDIDOS,
          "PesquisarPedCompra",
          parametrosEncerrados(pagina, dataBR(desde), dataBR(ate)),
          key,
          secret,
        );
        if (!d) break;
        paginas = Number(d?.nTotalPaginas) || 1;
        const cods = codigosPedidos(d?.pedidos_pesquisa ?? []);
        r.paginas += 1;
        r.encerrados_lidos += cods.length;
        if (!simulacao && cods.length) {
          const { data, error } = await db.rpc("marcar_dashboard_mp_encerrados", {
            p_codigos: cods,
          });
          if (error) throw error;
          r.marcados += Number(data?.marcados ?? 0);
        }
        pagina += 1;
        if (pagina <= paginas && pagina < paginaInicial + maxPaginas)
          await esperar(PAUSA_PAGINAS_MS);
      } while (pagina <= paginas && pagina < paginaInicial + maxPaginas);
      if (r.proxima_pagina === null && pagina <= paginas) r.proxima_pagina = pagina;
      return r;
    };

    if (tipo === "encerrados") {
      const paginaInicial =
        Number.isInteger(corpo?.pagina_inicial) && corpo.pagina_inicial > 0
          ? corpo.pagina_inicial
          : 1;
      const r = await marcarEncerrados(jp.de, jp.ate, paginaInicial);
      return responder({
        sucesso: true,
        tipo,
        dry_run: simulacao,
        incluidos_ou_alterados: [jp.de, jp.ate],
        ...r,
        duracao_ms: Date.now() - inicio,
      });
    }

    /* ------------------------------ PEDIDOS ------------------------------ */
    // Incremental: pedidos incluídos ou alterados entre "desde" e "ate"
    // (lApenasAlterados = 'T'). Grava página a página; se o tempo acabar,
    // devolve "proxima_pagina" para continuar de onde parou.
    if (tipo === "pedidos") {
      const desde = jp.de;
      const ate = jp.ate;
      const di = dataBR(desde);
      const df = dataBR(ate);
      const porPagina = Number.isInteger(corpo?.por_pagina)
        ? Math.min(Math.max(corpo.por_pagina, 10), 100)
        : POR_PAGINA_PADRAO;
      const paginaInicial =
        Number.isInteger(corpo?.pagina_inicial) && corpo.pagina_inicial > 0
          ? corpo.pagina_inicial
          : 1;
      const maxPaginas =
        Number.isInteger(corpo?.max_paginas) && corpo.max_paginas > 0
          ? corpo.max_paginas
          : LIMITE_PAGINAS;

      // Nomes de fornecedor (como estão no Omie, cadastro já sincronizado no banco).
      const nomes = new Map<string, string>();
      const completarNomes = async (lista: Json[]) => {
        const faltam = [
          ...new Set(
            lista
              .map((i) => i.codigo_fornecedor)
              .filter(Boolean)
              .map(String),
          ),
        ].filter((c) => !nomes.has(c));
        if (faltam.length) {
          const { data, error } = await db
            .from("pedidos_compra_fornecedores")
            .select("codigo,nome")
            .in("codigo", faltam);
          if (error) throw error;
          for (const f of data ?? []) nomes.set(String(f.codigo), String(f.nome ?? "").trim());
        }
        return lista.map((i) => ({
          ...i,
          fornecedor_nome:
            nomes.get(String(i.codigo_fornecedor)) ||
            (i.codigo_fornecedor ? `Fornecedor ${i.codigo_fornecedor}` : null),
        }));
      };

      const resumo = {
        paginas: 0,
        pedidos_lidos: 0,
        pedidos_validos: 0,
        itens: 0,
        removidos: 0,
        inseridos: 0,
        cancelados: 0,
      };
      const detalhe: Json[] = [];
      const gravar = async (codigos: number[], itens: Json[]) => {
        if (simulacao || !codigos.length) return;
        const { data, error } = await db.rpc("gravar_dashboard_mp_pedidos", {
          p_codigos: codigos,
          p_itens: itens,
        });
        if (error) throw error;
        resumo.removidos += Number(data?.removidos ?? 0);
        resumo.inseridos += Number(data?.inseridos ?? 0);
      };

      // 1) Cancelados no período: saem do dashboard (só na primeira parte).
      if (paginaInicial === 1) {
        let pc = 1;
        let pcs = 1;
        do {
          noPrazo(`cancelados, página ${pc}`);
          const r = await omie(
            URL_PEDIDOS,
            "PesquisarPedCompra",
            parametrosPesquisa(pc, di, df, porPagina, true, true),
            key,
            secret,
          );
          if (!r) break;
          pcs = Number(r?.nTotalPaginas) || 1;
          const cods = codigosPedidos(r?.pedidos_pesquisa ?? []);
          resumo.cancelados += cods.length;
          await gravar(cods, []);
          pc += 1;
          if (pc <= pcs) await esperar(PAUSA_PAGINAS_MS);
        } while (pc <= pcs && pc <= 10);
      }

      // 2) Válidos: grava os do departamento 11; os demais lidos são removidos se existiam.
      let pagina = paginaInicial;
      let paginas = paginaInicial;
      let proximaPagina: number | null = null;
      do {
        if (Date.now() - inicio > PRAZO_NOVA_PAGINA_MS) {
          proximaPagina = pagina;
          break;
        }
        const r = await omie(
          URL_PEDIDOS,
          "PesquisarPedCompra",
          parametrosPesquisa(pagina, di, df, porPagina, true),
          key,
          secret,
        );
        if (!r) break;
        if (!Array.isArray(r?.pedidos_pesquisa))
          throw new Error(`Omie (página ${pagina}): resposta sem pedidos_pesquisa`);
        paginas = Number(r?.nTotalPaginas) || 1;
        const lidos = r.pedidos_pesquisa;
        const codigos = codigosPedidos(lidos);
        const itens = await completarNomes(extrairItensPedidos(lidos));
        resumo.paginas += 1;
        resumo.pedidos_lidos += lidos.length;
        resumo.pedidos_validos += new Set(itens.map((i) => i.cod_ped_compra)).size;
        resumo.itens += itens.length;
        await gravar(codigos, itens);
        if (simulacao) detalhe.push(...itens);
        pagina += 1;
        if (pagina <= paginas && pagina < paginaInicial + maxPaginas)
          await esperar(PAUSA_PAGINAS_MS);
      } while (pagina <= paginas && pagina < paginaInicial + maxPaginas);
      if (proximaPagina === null && pagina <= paginas) proximaPagina = pagina;

      // Leitura completa: marca os Encerrados do mesmo período (a gravação acima os voltou para não encerrados).
      const encerrados = proximaPagina === null ? await marcarEncerrados(desde, ate) : null;

      return responder({
        sucesso: true,
        tipo,
        dry_run: simulacao,
        incluidos_ou_alterados: [desde, ate],
        pagina_inicial: paginaInicial,
        total_paginas: paginas,
        proxima_pagina: proximaPagina,
        ...resumo,
        encerrados,
        ...(simulacao ? { detalhe } : {}),
        duracao_ms: Date.now() - inicio,
      });
    }

    /* ------------------------------- NOTAS ------------------------------- */
    const { data: linhas, error: erroPedidos } = await db
      .from("dashboard_mp_pedidos_omie")
      .select("cod_ped_compra,numero_pedido,codigo_fornecedor");
    if (erroPedidos) throw erroPedidos;
    const pedidosMapa = new Map<string, string>();
    const fornecedores = new Set<string>();
    for (const l of linhas ?? []) {
      pedidosMapa.set(String(l.cod_ped_compra), String(l.numero_pedido ?? ""));
      if (l.codigo_fornecedor) fornecedores.add(String(l.codigo_fornecedor));
    }
    if (!pedidosMapa.size)
      throw new Error("Nenhum pedido gravado ainda; rode primeiro o tipo 'pedidos'.");

    const lista: Json[] = [];
    let pagina = 1;
    let paginas = 1;
    do {
      noPrazo(`notas, página ${pagina} de ${paginas}`);
      const r = await omie(
        URL_NOTAS,
        "ListarRecebimentos",
        {
          nPagina: pagina,
          nRegistrosPorPagina: 100,
          dtEmissaoDe: dataBR(j.de),
          dtEmissaoAte: dataBR(j.ate),
        },
        key,
        secret,
      );
      if (!r) break;
      if (!Array.isArray(r?.recebimentos))
        throw new Error(`Omie (notas, página ${pagina}): resposta sem recebimentos`);
      paginas = Number(r?.nTotalPaginas) || 1;
      lista.push(...r.recebimentos);
      pagina += 1;
      if (pagina <= paginas) await esperar(PAUSA_PAGINAS_MS);
    } while (pagina <= paginas && pagina <= LIMITE_PAGINAS);
    if (paginas > LIMITE_PAGINAS)
      throw new Error(
        `Omie retornou ${paginas} páginas de notas (limite ${LIMITE_PAGINAS}); use um período menor.`,
      );

    const candidatas = notasCandidatas(lista, fornecedores);
    const itens: Json[] = [];
    let consultadas = 0;
    for (const id of candidatas) {
      noPrazo(`notas, consulta ${consultadas + 1} de ${candidatas.length}`);
      const nota = await omie(URL_NOTAS, "ConsultarRecebimento", { nIdReceb: id }, key, secret);
      consultadas += 1;
      if (nota) itens.push(...extrairItensNota(nota, pedidosMapa));
      await esperar(PAUSA_NOTAS_MS);
    }

    let gravacao: unknown = null;
    if (!simulacao) {
      const { data, error } = await db.rpc("substituir_dashboard_mp_notas", {
        p_de: j.de,
        p_ate: j.ate,
        p_itens: itens,
      });
      if (error) throw error;
      gravacao = data;
      // IPI da nota (usado quando o pedido não tem IPI).
      for (const i of itens) {
        if (!(i.aliquota_ipi > 0) && !(i.valor_ipi > 0)) continue;
        const u = await db
          .from("dashboard_mp_notas_omie")
          .update({ aliquota_ipi: i.aliquota_ipi, valor_ipi: i.valor_ipi })
          .eq("id_recebimento", i.id_recebimento)
          .eq("id_item_nota", i.id_item_nota);
        if (u.error) throw u.error;
      }
    }

    return responder({
      sucesso: true,
      tipo,
      dry_run: simulacao,
      periodo_emissao: [j.de, j.ate],
      notas_listadas: lista.length,
      notas_consultadas: consultadas,
      notas_com_pedido: new Set(itens.map((i) => i.id_recebimento)).size,
      itens: itens.length,
      gravacao,
      ...(simulacao ? { detalhe: itens } : {}),
      duracao_ms: Date.now() - inicio,
    });
  } catch (e) {
    return responder(
      { sucesso: false, tipo, erro: mensagem(e).slice(0, 500), duracao_ms: Date.now() - inicio },
      500,
    );
  }
});
