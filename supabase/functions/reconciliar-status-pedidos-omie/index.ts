import { createClient } from "npm:@supabase/supabase-js@2.111.0";
import {
  TOTAL_LOTES,
  codigoValido,
  loteDoCodigo,
  loteDoHorario,
  rodadaDoHorario,
  escolherDoLote,
  extrairPedido,
  avaliarSituacao,
  devePersistir,
  pedidoNaoCadastrado,
} from "./reconciliacao-core.mjs";

const URL_OMIE = "https://app.omie.com.br/api/v1/produtos/pedido/";
const URL_ETAPAS = "https://app.omie.com.br/api/v1/produtos/etapafat/";
const PRAZO_MAXIMO_MS = 75000;
// ~3 s por pedido no Omie: 20 pedidos cabem no prazo de 75 s com folga.
const MAX_PEDIDOS_LOTE = 20;
const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};
const responder = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers });
const mensagem = (erro: unknown) => (erro instanceof Error ? erro.message : String(erro));
const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

function administrador() {
  const url = Deno.env.get("SUPABASE_URL");
  const chave = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !chave) throw new Error("Configuração do Supabase ausente.");
  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function omie(
  url: string,
  call: string,
  parametros: Record<string, unknown>,
  appKey: string,
  appSecret: string,
) {
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    const controle = new AbortController();
    const timer = setTimeout(() => controle.abort(), 15000);
    try {
      const resposta = await fetch(url, {
        method: "POST",
        signal: controle.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ call, app_key: appKey, app_secret: appSecret, param: [parametros] }),
      });
      const texto = await resposta.text();
      let corpo;
      try {
        corpo = JSON.parse(texto);
      } catch {
        throw new Error(`${call}: JSON inválido.`);
      }
      if (resposta.ok && !corpo?.faultstring && !corpo?.faultcode) return corpo;
      const falha = String(corpo?.faultstring || corpo?.message || `HTTP ${resposta.status}`);
      const normal = falha.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const temporaria =
        resposta.status === 429 ||
        normal.includes("consumo redundante") ||
        (normal.includes("requisicao") && normal.includes("sendo executada"));
      if (temporaria && tentativa === 1) {
        await esperar(1800);
        continue;
      }
      throw new Error(`${call}: ${falha}`);
    } catch (erro) {
      if (tentativa === 1 && erro instanceof Error && erro.name === "AbortError") {
        await esperar(1000);
        continue;
      }
      throw erro;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`${call}: falha após tentativas.`);
}

async function obterEtapas(appKey: string, appSecret: string) {
  const retorno = await omie(
    URL_ETAPAS,
    "ListarEtapasFaturamento",
    { pagina: 1, registros_por_pagina: 100 },
    appKey,
    appSecret,
  );
  const mapa = new Map<string, string>();
  for (const cadastro of retorno?.cadastros ?? []) {
    for (const etapa of cadastro?.etapas ?? []) {
      if (etapa.cCodigo != null) {
        mapa.set(
          String(etapa.cCodigo),
          String(etapa.cDescricao || etapa.cDescrPadrao || "").trim(),
        );
      }
    }
  }
  return mapa;
}

async function buscarPedidosAtivos(supabase: ReturnType<typeof administrador>) {
  const { data, error, count } = await supabase
    .from("pedidos_omie")
    .select("codigo_pedido_omie,numero_pedido,status,ativo,sincronizado_em", { count: "exact" })
    .eq("ativo", true)
    .order("codigo_pedido_omie")
    .range(0, 999);
  if (error) throw error;
  if ((count ?? 0) > 1000)
    throw new Error("Mais de 1.000 itens ativos: revisar paginação antes de conciliar.");
  const mapa = new Map<
    number,
    {
      numero: string;
      status: string;
      itens: number;
      divergente: boolean;
      sincronizadoEm: string | null;
    }
  >();
  for (const linha of data ?? []) {
    const codigo = codigoValido(linha.codigo_pedido_omie);
    if (codigo === null) continue;
    const anterior = mapa.get(codigo);
    if (anterior) {
      anterior.itens++;
      if (anterior.status !== linha.status || anterior.sincronizadoEm !== linha.sincronizado_em)
        anterior.divergente = true;
    } else {
      mapa.set(codigo, {
        numero: String(linha.numero_pedido ?? ""),
        status: String(linha.status ?? ""),
        itens: 1,
        divergente: false,
        sincronizadoEm: linha.sincronizado_em ?? null,
      });
    }
  }
  return mapa;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return responder({ ok: true });
  if (req.method !== "POST")
    return responder({ sucesso: false, erro: "Método não permitido." }, 405);

  const inicio = Date.now();
  try {
    const corpo = await req.json().catch(() => ({}));
    const pedidoInformado = corpo?.codigo_pedido;
    const codigoEspecifico = pedidoInformado == null ? null : codigoValido(pedidoInformado);
    if (pedidoInformado != null && codigoEspecifico === null) {
      return responder({ sucesso: false, erro: "Código de pedido inválido." }, 400);
    }
    if (corpo?.dry_run != null && typeof corpo.dry_run !== "boolean") {
      return responder({ sucesso: false, erro: "dry_run deve ser booleano." }, 400);
    }
    const simulacao = corpo?.dry_run === true;
    const loteExplicito = corpo?.lote;
    if (
      loteExplicito != null &&
      (!Number.isInteger(loteExplicito) || loteExplicito < 0 || loteExplicito >= TOTAL_LOTES)
    ) {
      return responder({ sucesso: false, erro: "Lote deve ser número inteiro entre 0 e 11." }, 400);
    }
    const lote = codigoEspecifico === null ? (loteExplicito ?? loteDoHorario()) : null;
    const appKey = Deno.env.get("OMIE_APP_KEY");
    const appSecret = Deno.env.get("OMIE_APP_SECRET");
    if (!appKey || !appSecret) throw new Error("Integração Omie não configurada.");
    const supabase = administrador();
    const pedidos = await buscarPedidosAtivos(supabase);
    const doLote = [...pedidos.entries()]
      .filter(([codigo]) =>
        codigoEspecifico !== null ? codigo === codigoEspecifico : loteDoCodigo(codigo) === lote,
      )
      .sort(([a], [b]) => a - b);
    // Lote maior que o limite: confere uma parte por rodada, em rodízio.
    const selecionados = escolherDoLote(doLote, MAX_PEDIDOS_LOTE, rodadaDoHorario());
    if (codigoEspecifico !== null && selecionados.length === 0) {
      return responder(
        {
          sucesso: false,
          erro: "Pedido não encontrado entre os registros ativos; nada foi alterado.",
        },
        404,
      );
    }

    const etapas = selecionados.length
      ? await obterEtapas(appKey, appSecret)
      : new Map<string, string>();
    const resultados: Record<string, unknown>[] = [];
    let alterados = 0;
    let erros = 0;
    let processados = 0;
    let interrompido = false;

    for (const [codigo, registro] of selecionados) {
      if (Date.now() - inicio >= PRAZO_MAXIMO_MS) {
        interrompido = true;
        break;
      }
      processados++;
      if (registro.divergente) {
        resultados.push({
          numero_pedido: registro.numero,
          codigo_pedido_omie: codigo,
          erro: "Status inconsistente entre os itens; exige revisão manual.",
        });
        erros++;
        continue;
      }
      try {
        const bruto = await omie(
          URL_OMIE,
          "ConsultarPedido",
          { codigo_pedido: codigo },
          appKey,
          appSecret,
        );
        const pedido = extrairPedido(bruto, codigo);
        const situacao = avaliarSituacao(pedido, registro.status, etapas);
        const mudou = registro.status !== situacao.status || situacao.ativo !== true;
        let itensAtualizados = 0;
        if (devePersistir(simulacao, registro.status, situacao)) {
          const agora = new Date().toISOString();
          const { data, error } = await supabase
            .from("pedidos_omie")
            .update({
              status: situacao.status,
              ativo: situacao.ativo,
              sincronizado_em: agora,
              atualizado_em: agora,
            })
            .eq("codigo_pedido_omie", codigo)
            .eq("ativo", true)
            .eq("status", registro.status)
            .eq("sincronizado_em", registro.sincronizadoEm)
            .select("id");
          if (error) throw error;
          itensAtualizados = data?.length ?? 0;
          if (itensAtualizados !== registro.itens) {
            throw new Error(
              `Atualização concorrente: esperado ${registro.itens}, obtido ${itensAtualizados}; revisar.`,
            );
          }
        }
        if (mudou) alterados++;
        resultados.push({
          numero_pedido: registro.numero,
          codigo_pedido_omie: codigo,
          status_anterior: registro.status,
          status_omie: situacao.status,
          ativo_omie: situacao.ativo,
          motivo: situacao.motivo,
          indicador_cancelamento: String(pedido.infoCadastro.cancelado),
          mudou,
          itens: registro.itens,
          itens_atualizados: itensAtualizados,
        });
      } catch (erro) {
        if (pedidoNaoCadastrado(erro)) {
          try {
            let itensAtualizados = 0;
            if (!simulacao) {
              const agora = new Date().toISOString();
              const { data, error } = await supabase
                .from("pedidos_omie")
                .update({
                  status: "Removido no Omie",
                  ativo: false,
                  sincronizado_em: agora,
                  atualizado_em: agora,
                })
                .eq("codigo_pedido_omie", codigo)
                .eq("ativo", true)
                .eq("status", registro.status)
                .eq("sincronizado_em", registro.sincronizadoEm)
                .select("id");
              if (error) throw error;
              itensAtualizados = data?.length ?? 0;
              if (itensAtualizados !== registro.itens) {
                throw new Error(
                  `Atualização concorrente do pedido removido: esperado ${registro.itens}, obtido ${itensAtualizados}.`,
                );
              }
            }
            alterados++;
            resultados.push({
              numero_pedido: registro.numero,
              codigo_pedido_omie: codigo,
              status_anterior: registro.status,
              status_omie: "Removido no Omie",
              ativo_omie: false,
              motivo: "nao_cadastrado_no_omie",
              mudou: true,
              itens: registro.itens,
              itens_atualizados: itensAtualizados,
            });
          } catch (falha) {
            erros++;
            resultados.push({
              numero_pedido: registro.numero,
              codigo_pedido_omie: codigo,
              erro: mensagem(falha).slice(0, 300),
            });
          }
        } else {
          erros++;
          resultados.push({
            numero_pedido: registro.numero,
            codigo_pedido_omie: codigo,
            erro: mensagem(erro).slice(0, 300),
          });
        }
      }
      await esperar(150);
    }
    const sucesso = erros === 0 && !interrompido;
    return responder(
      {
        sucesso,
        dry_run: simulacao,
        lote,
        total_lotes: TOTAL_LOTES,
        pedidos_no_lote: doLote.length,
        pedidos_selecionados: selecionados.length,
        pedidos_processados: processados,
        pedidos_alterados: alterados,
        pedidos_com_erro: erros,
        interrompido,
        resultados,
      },
      sucesso ? 200 : 500,
    );
  } catch (erro) {
    return responder({ sucesso: false, erro: mensagem(erro).slice(0, 500) }, 500);
  }
});
