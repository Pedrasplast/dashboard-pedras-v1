import { createClient } from "npm:@supabase/supabase-js@2";

const URL_CAIXA = "https://app.omie.com.br/api/v1/financas/caixa/";
const URL_TITULOS = "https://app.omie.com.br/api/v1/financas/pesquisartitulos/";
const URL_CLIENTES = "https://app.omie.com.br/api/v1/geral/clientes/";
const MAX_TENTATIVAS = 4;
const PAGE_SIZE = 100;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function erroTexto(erro: unknown) {
  return erro instanceof Error ? erro.message : String(erro ?? "Erro desconhecido");
}

function normalizarTexto(valor: unknown) {
  return String(valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function criarSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) throw new Error("Credenciais do Supabase não encontradas.");
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function validar(resultado: any, etapa: string) {
  if (!resultado) throw new Error(`${etapa}: resposta vazia do Supabase.`);
  if (resultado.error) throw new Error(`${etapa}: ${resultado.error.message}`);
  return resultado;
}

function omieOcupado(erro: unknown) {
  const texto = normalizarTexto(erroTexto(erro));
  return texto.includes("ja existe uma requisicao") && texto.includes("sendo executada");
}

function omieSemRegistros(erro: unknown) {
  const texto = normalizarTexto(erroTexto(erro));
  return texto.includes("nao existem registros") || texto.includes("nenhum registro");
}

async function chamarOmieUmaVez(url: string, call: string, param: Record<string, unknown>, appKey: string, appSecret: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ call, app_key: appKey, app_secret: appSecret, param: [param] }),
    });
    const texto = await resposta.text();
    let dados: any = {};
    if (texto) {
      try { dados = JSON.parse(texto); } catch { throw new Error(`${call}: resposta inválida do Omie.`); }
    }
    if (!resposta.ok || dados?.faultstring || dados?.faultcode) {
      throw new Error(`${call}: ${dados?.faultstring || dados?.description || dados?.message || `HTTP ${resposta.status}`}`);
    }
    return dados;
  } catch (erro) {
    if (erro instanceof Error && erro.name === "AbortError") throw new Error(`${call}: tempo limite excedido.`);
    throw erro;
  } finally {
    clearTimeout(timeout);
  }
}

async function chamarOmie(url: string, call: string, param: Record<string, unknown>, appKey: string, appSecret: string) {
  let ultimoErro: unknown = null;
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      return await chamarOmieUmaVez(url, call, param, appKey, appSecret);
    } catch (erro) {
      ultimoErro = erro;
      if (omieSemRegistros(erro)) return { _semRegistros: true };
      if (!omieOcupado(erro) || tentativa === MAX_TENTATIVAS) throw erro;
      await esperar(tentativa * 2000);
    }
  }
  throw ultimoErro;
}

function agoraSaoPaulo() {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  return { ano: Number(partes.year), mes: Number(partes.month) };
}

function periodoMes(ano: number, mes: number) {
  const inicio = `01/${String(mes).padStart(2, "0")}/${ano}`;
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const fim = `${String(ultimoDia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
  return { inicio, fim };
}

function converterData(valor: unknown) {
  if (!valor) return null;
  const texto = String(valor).trim();
  const br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return null;
}

function numero(valor: unknown) {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function tipoCategoria(codigo: string) {
  return codigo.startsWith("2") ? "Despesa" : "Receita";
}

function dataPertenceMes(valor: unknown, ano: number, mes: number) {
  const iso = converterData(valor);
  return !!iso && iso.startsWith(`${ano}-${String(mes).padStart(2, "0")}-`);
}

async function listarOrcamento(appKey: string, appSecret: string, ano: number, mes: number) {
  const resposta = await chamarOmie(URL_CAIXA, "ListarOrcamentos", { nAno: ano, nMes: mes }, appKey, appSecret);
  if (resposta?._semRegistros) return [];
  return Array.isArray(resposta?.ListaOrcamentos) ? resposta.ListaOrcamentos : [];
}

async function pesquisarTitulosPaginado(appKey: string, appSecret: string, filtro: Record<string, unknown>) {
  const encontrados: any[] = [];
  let pagina = 1;
  let totalPaginas = 1;
  do {
    const resposta = await chamarOmie(
      URL_TITULOS,
      "PesquisarLancamentos",
      { nPagina: pagina, nRegPorPagina: PAGE_SIZE, lDadosCad: false, ...filtro },
      appKey,
      appSecret,
    );
    if (resposta?._semRegistros) break;
    if (Array.isArray(resposta?.titulosEncontrados)) encontrados.push(...resposta.titulosEncontrados);
    totalPaginas = Math.max(1, Number(resposta?.nTotPaginas ?? 1));
    pagina++;
  } while (pagina <= totalPaginas);
  return encontrados;
}

async function listarTitulosDoMes(appKey: string, appSecret: string, ano: number, mes: number) {
  const { inicio, fim } = periodoMes(ano, mes);
  const [porPrevisao, porPagamento] = await Promise.all([
    pesquisarTitulosPaginado(appKey, appSecret, { dDtPrevDe: inicio, dDtPrevAte: fim }),
    pesquisarTitulosPaginado(appKey, appSecret, { dDtPagtoDe: inicio, dDtPagtoAte: fim }),
  ]);
  const mapa = new Map<number, any>();
  for (const titulo of [...porPrevisao, ...porPagamento]) {
    const codigo = Number(titulo?.cabecTitulo?.nCodTitulo);
    if (Number.isFinite(codigo) && codigo > 0) mapa.set(codigo, titulo);
  }
  return [...mapa.values()];
}

async function buscarClientes(titulos: any[], appKey: string, appSecret: string) {
  const codigos = [...new Set(
    titulos.map((t) => Number(t?.cabecTitulo?.nCodCliente)).filter((n) => Number.isFinite(n) && n > 0),
  )];
  const mapa = new Map<number, string>();
  for (let i = 0; i < codigos.length; i += 50) {
    const lote = codigos.slice(i, i + 50);
    const resposta = await chamarOmie(
      URL_CLIENTES,
      "ListarClientesResumido",
      {
        pagina: 1,
        registros_por_pagina: 50,
        clientesPorCodigo: lote.map((codigo) => ({ codigo_cliente_omie: codigo })),
      },
      appKey,
      appSecret,
    );
    const clientes = Array.isArray(resposta?.clientes_cadastro_resumido) ? resposta.clientes_cadastro_resumido : [];
    for (const cliente of clientes) {
      const codigo = Number(cliente?.codigo_cliente);
      if (!Number.isFinite(codigo)) continue;
      mapa.set(codigo, String(cliente?.razao_social ?? cliente?.nome_fantasia ?? `Cliente ${codigo}`).trim());
    }
  }
  return mapa;
}

function rateiosTitulo(cabec: any) {
  const rateios = Array.isArray(cabec?.aCodCateg) ? cabec.aCodCateg : [];
  if (rateios.length) {
    return rateios.map((item: any) => ({
      codigo: String(item?.cCodCateg ?? "").trim(),
      percentual: numero(item?.nPerc),
      valor: numero(item?.nValor),
    })).filter((item: any) => item.codigo);
  }
  const codigo = String(cabec?.cCodCateg ?? "").trim();
  return codigo ? [{ codigo, percentual: 100, valor: numero(cabec?.nValorTitulo) }] : [];
}

function fatorRateio(rateio: any, valorTitulo: number) {
  if (rateio.percentual > 0) return rateio.percentual / 100;
  if (valorTitulo > 0 && rateio.valor > 0) return rateio.valor / valorTitulo;
  return 1;
}

function normalizarLancamentos(titulos: any[], categorias: Map<string, string>, clientes: Map<number, string>, ano: number, mes: number, sincronizadoEm: string) {
  const linhas: any[] = [];
  for (const titulo of titulos) {
    const cabec = titulo?.cabecTitulo ?? {};
    const resumo = titulo?.resumo ?? {};
    const lancamentos = Array.isArray(titulo?.lancamentos) ? titulo.lancamentos : [];
    const codigoTitulo = Number(cabec?.nCodTitulo);
    if (!Number.isFinite(codigoTitulo) || codigoTitulo <= 0) continue;

    const codigoCliente = Number(cabec?.nCodCliente);
    const valorTitulo = numero(cabec?.nValorTitulo);
    const valorPagoTotal = numero(resumo?.nValPago);
    const valorAbertoTotal = numero(resumo?.nValAberto);
    const rateios = rateiosTitulo(cabec);
    const lancamentosMes = lancamentos.filter((l: any) => dataPertenceMes(l?.dDtLanc, ano, mes));
    const valorRealizadoMes = lancamentosMes.reduce((total: number, l: any) => total + numero(l?.nValLanc), 0);
    const previsaoNoMes = dataPertenceMes(cabec?.dDtPrevisao, ano, mes);

    for (const rateio of rateios) {
      const fator = fatorRateio(rateio, valorTitulo);
      const base = {
        ano,
        mes,
        codigo_titulo_omie: codigoTitulo,
        codigo_categoria: rateio.codigo,
        categoria: categorias.get(rateio.codigo) ?? null,
        natureza: String(cabec?.cNatureza ?? "").trim() || null,
        codigo_cliente_fornecedor_omie: Number.isFinite(codigoCliente) ? codigoCliente : null,
        cliente_fornecedor: clientes.get(codigoCliente) ?? null,
        numero_documento: String(cabec?.cNumDocFiscal ?? cabec?.cNumTitulo ?? "").trim() || null,
        numero_pedido: String(cabec?.cNumOS ?? "").trim() || null,
        data_emissao: converterData(cabec?.dDtEmissao),
        data_vencimento: converterData(cabec?.dDtVenc),
        data_pagamento: converterData(cabec?.dDtPagamento),
        valor_documento: valorTitulo * fator,
        valor_pago: valorPagoTotal * fator,
        valor_aberto: valorAbertoTotal * fator,
        status: String(cabec?.cStatus ?? "").trim() || null,
        percentual_categoria: rateio.percentual || null,
        sincronizado_em: sincronizadoEm,
        updated_at: sincronizadoEm,
      };

      if (valorRealizadoMes !== 0) {
        linhas.push({
          ...base,
          componente: "realizado",
          data_referencia: converterData(lancamentosMes[0]?.dDtLanc ?? cabec?.dDtPagamento),
          valor_componente: valorRealizadoMes * fator,
        });
      }

      if (previsaoNoMes && valorAbertoTotal !== 0) {
        linhas.push({
          ...base,
          componente: "a_realizar",
          data_referencia: converterData(cabec?.dDtPrevisao),
          valor_componente: valorAbertoTotal * fator,
        });
      }
    }
  }
  return linhas;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(JSON.stringify({ ok: true }), { headers });

  const inicioMs = Date.now();
  const inicioIso = new Date().toISOString();
  const atual = agoraSaoPaulo();
  let ano = atual.ano;
  let mes = atual.mes;
  let supabase: any = null;
  let bloqueio = false;
  let etapa = "inicializacao";

  try {
    const appKey = Deno.env.get("OMIE_APP_KEY");
    const appSecret = Deno.env.get("OMIE_APP_SECRET");
    if (!appKey || !appSecret) throw new Error("Credenciais do Omie não configuradas.");

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    if (body?.ano != null) ano = Number(body.ano);
    if (body?.mes != null) mes = Number(body.mes);
    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) throw new Error("Ano inválido.");
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) throw new Error("Mês inválido.");

    supabase = criarSupabaseAdmin();
    etapa = "adquirindo_trava";
    const lock = await supabase.rpc("tentar_iniciar_sincronizacao_financeiro_omie", {
      p_iniciado_em: inicioIso,
      p_ano: ano,
      p_mes: mes,
    });
    validar(lock, etapa);
    bloqueio = lock.data === true;
    if (!bloqueio) {
      return new Response(JSON.stringify({ sucesso: true, ignorada: true, mensagem: "Já existe uma sincronização financeira em andamento." }), { status: 200, headers });
    }

    etapa = "consultando_orcamento";
    validar(await supabase.from("sincronizacao_financeiro_omie").update({ etapa, mensagem: "Consultando Orçamento de Caixa no Omie", atualizado_em: new Date().toISOString() }).eq("id", 1), etapa);

    const orcamento = await listarOrcamento(appKey, appSecret, ano, mes);
    const sincronizadoEm = new Date().toISOString();
    const resumo = orcamento.map((item: any) => {
      const codigo = String(item?.cCodCateg ?? "").trim();
      const categoria = String(item?.cDesCateg ?? "").trim();
      return {
        ano,
        mes,
        tipo: tipoCategoria(codigo),
        codigo_categoria: codigo,
        categoria,
        valor_previsto: numero(item?.nValorPrevisto),
        valor_realizado: numero(item?.nValorRealizado ?? item?.nValorRealilzado),
        sincronizado_em: sincronizadoEm,
        updated_at: sincronizadoEm,
      };
    }).filter((item: any) => item.codigo_categoria && item.categoria);

    etapa = "gravando_resumo";
    validar(await supabase.from("financeiro_omie_resumo").delete().eq("ano", ano).eq("mes", mes), etapa);
    for (let i = 0; i < resumo.length; i += 500) {
      validar(await supabase.from("financeiro_omie_resumo").insert(resumo.slice(i, i + 500)), etapa);
    }

    const categorias = new Map<string, string>();
    for (const item of resumo) categorias.set(item.codigo_categoria, item.categoria);

    etapa = "consultando_titulos";
    validar(await supabase.from("sincronizacao_financeiro_omie").update({ etapa, mensagem: "Consultando títulos financeiros no Omie", atualizado_em: new Date().toISOString() }).eq("id", 1), etapa);
    const titulos = await listarTitulosDoMes(appKey, appSecret, ano, mes);

    etapa = "consultando_clientes_fornecedores";
    const clientes = await buscarClientes(titulos, appKey, appSecret);

    etapa = "normalizando_lancamentos";
    const lancamentos = normalizarLancamentos(titulos, categorias, clientes, ano, mes, sincronizadoEm);

    etapa = "gravando_lancamentos";
    validar(await supabase.from("financeiro_omie_lancamentos").delete().eq("ano", ano).eq("mes", mes), etapa);
    for (let i = 0; i < lancamentos.length; i += 500) {
      validar(await supabase.from("financeiro_omie_lancamentos").insert(lancamentos.slice(i, i + 500)), etapa);
    }

    const fimIso = new Date().toISOString();
    const duracao = Date.now() - inicioMs;
    validar(await supabase.from("sincronizacao_financeiro_omie").update({
      ultima_sincronizacao: fimIso,
      fim_em: fimIso,
      status: "sucesso",
      etapa: "concluido",
      ano,
      mes,
      quantidade_resumos: resumo.length,
      quantidade_lancamentos: lancamentos.length,
      duracao_ms: duracao,
      mensagem: `Sincronização financeira concluída para ${String(mes).padStart(2, "0")}/${ano}.`,
      atualizado_em: fimIso,
    }).eq("id", 1), "finalizando");

    return new Response(JSON.stringify({ sucesso: true, ano, mes, categorias: resumo.length, titulos: titulos.length, lancamentos: lancamentos.length, duracao_ms: duracao }), { status: 200, headers });
  } catch (erro) {
    const fimIso = new Date().toISOString();
    const mensagem = erroTexto(erro);
    const duracao = Date.now() - inicioMs;
    console.error(`Erro em ${etapa}:`, erro);
    if (bloqueio && supabase) {
      await supabase.from("sincronizacao_financeiro_omie").update({
        fim_em: fimIso,
        status: "erro",
        etapa,
        ano,
        mes,
        duracao_ms: duracao,
        mensagem: `${etapa}: ${mensagem}`.slice(0, 1000),
        atualizado_em: fimIso,
      }).eq("id", 1);
    }
    return new Response(JSON.stringify({ sucesso: false, etapa, erro: mensagem }), { status: 500, headers });
  }
});
