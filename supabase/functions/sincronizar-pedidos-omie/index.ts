import { createClient } from "npm:@supabase/supabase-js@2";

const URL_PEDIDOS = "https://app.omie.com.br/api/v1/produtos/pedido/";
const URL_CLIENTES = "https://app.omie.com.br/api/v1/geral/clientes/";
const URL_VENDEDORES = "https://app.omie.com.br/api/v1/geral/vendedores/";
const URL_ETAPAS = "https://app.omie.com.br/api/v1/produtos/etapafat/";

const SOBREPOSICAO_MS = 2 * 60 * 1000;
const MAX_TENTATIVAS = 4;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function msgErro(erro: unknown) {
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
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function validar(resultado: any, etapa: string) {
  if (!resultado) throw new Error(`${etapa}: resposta vazia do Supabase.`);
  if (resultado.error) throw new Error(`${etapa}: ${resultado.error.message}`);
  return resultado;
}

function omieTemporariamenteBloqueado(erro: unknown) {
  const texto = normalizarTexto(msgErro(erro));
  return (
    (texto.includes("ja existe uma requisicao") && texto.includes("sendo executada")) ||
    texto.includes("consumo redundante") ||
    texto.includes("redundant") ||
    texto.includes("uncaught error") ||
    (texto.includes("soap-error") && texto.includes("unexpected response from server"))
  );
}

function esperaSugeridaOmieMs(erro: unknown, tentativa: number) {
  const texto = normalizarTexto(msgErro(erro));
  const match = texto.match(/aguarde\s+(\d+)\s+segundos?/);

  if (match) {
    const segundos = Math.max(1, Number(match[1]));
    return Math.min((segundos + 2) * 1000, 70000);
  }

  if (texto.includes("consumo redundante") || texto.includes("redundant")) {
    return 60000;
  }

  return Math.min(tentativa * 3000, 12000);
}

function omieSemRegistros(erro: unknown) {
  return normalizarTexto(msgErro(erro)).includes("nao existem registros para a pagina");
}

async function chamarOmieUmaVez(
  url: string,
  call: string,
  param: Record<string, unknown>,
  appKey: string,
  appSecret: string,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        call,
        app_key: appKey,
        app_secret: appSecret,
        param: [param],
      }),
    });

    const texto = await resposta.text();
    let dados: any = {};

    try {
      dados = texto ? JSON.parse(texto) : {};
    } catch {
      throw new Error(`${call}: retorno inválido. HTTP ${resposta.status}.`);
    }

    if (!resposta.ok || dados?.faultstring || dados?.faultcode) {
      throw new Error(
        `${call}: ${
          dados?.faultstring ||
          dados?.description ||
          dados?.message ||
          `HTTP ${resposta.status}`
        }`,
      );
    }

    return dados;
  } catch (erro) {
    if (erro instanceof Error && erro.name === "AbortError") {
      throw new Error(`${call}: tempo limite excedido.`);
    }
    throw erro;
  } finally {
    clearTimeout(timeout);
  }
}

async function chamarOmie(
  url: string,
  call: string,
  param: Record<string, unknown>,
  appKey: string,
  appSecret: string,
) {
  let ultimoErro: unknown = null;

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      return await chamarOmieUmaVez(url, call, param, appKey, appSecret);
    } catch (erro) {
      ultimoErro = erro;

      if (call === "ListarPedidos" && omieSemRegistros(erro)) {
        return {
          pedido_venda_produto: [],
          total_de_paginas: 0,
          total_de_registros: 0,
          _semRegistros: true,
        };
      }

      if (!omieTemporariamenteBloqueado(erro) || tentativa === MAX_TENTATIVAS) {
        throw erro;
      }

      const esperaMs = esperaSugeridaOmieMs(erro, tentativa);
      console.warn(
        `${call}: Omie temporariamente bloqueado. Tentativa ${tentativa}/${MAX_TENTATIVAS}. Aguardando ${Math.round(esperaMs / 1000)}s.`,
      );
      await esperar(esperaMs);
    }
  }

  throw ultimoErro;
}

function formatarDataHoraOmie(data: Date) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(data)
      .map((p) => [p.type, p.value]),
  );

  return {
    data: `${partes.day}/${partes.month}/${partes.year}`,
    hora: `${partes.hour}:${partes.minute}:${partes.second}`,
  };
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

function pedidoEhCancelado(pedido: any) {
  return (pedido?.infoCadastro ?? {}).cancelado === "S";
}

function pedidoDeveSerSincronizado(pedido: any) {
  const info = pedido?.infoCadastro ?? {};
  const cab = pedido?.cabecalho ?? {};

  // No Omie, etapa "00" representa Orçamento.
  // Orçamentos não entram no banco nem geram notificações.
  if (String(cab?.etapa ?? "").trim() === "00") return false;

  if (info.cancelado === "S") return true;
  if (info.faturado === "S") return false;
  if (info.denegado === "S") return false;
  if (info.devolvido === "S") return false;
  if (cab.encerrado === "S") return false;
  return true;
}

function normalizarStatus(valor: unknown) {
  if (!valor) return "Pedido";
  const original = String(valor).trim();
  return normalizarTexto(original).includes("armazenado") ? "Pedido" : original;
}

async function listarPedidos(
  appKey: string,
  appSecret: string,
  periodoDe: Date | null,
  periodoAte: Date,
  atualizarProgresso: (p: number, t: number) => Promise<void>,
) {
  let pagina = 1;
  let totalPaginas = 1;
  const pedidos: any[] = [];
  const de = periodoDe ? formatarDataHoraOmie(periodoDe) : null;
  const ate = formatarDataHoraOmie(periodoAte);

  do {
    const param: Record<string, unknown> = {
      pagina,
      registros_por_pagina: 100,
      apenas_resumo: "N",
    };

    if (de) {
      param.filtrar_por_data_de = de.data;
      param.filtrar_por_hora_de = de.hora;
      param.filtrar_por_data_ate = ate.data;
      param.filtrar_por_hora_ate = ate.hora;
      param.filtrar_apenas_inclusao = "N";
      param.filtrar_apenas_alteracao = "N";
    }

    const resposta = await chamarOmie(
      URL_PEDIDOS,
      "ListarPedidos",
      param,
      appKey,
      appSecret,
    );

    if (resposta?._semRegistros) {
      return { pedidos: [], totalPaginas: 0 };
    }

    const lista = Array.isArray(resposta?.pedido_venda_produto)
      ? resposta.pedido_venda_produto
      : [];

    pedidos.push(...lista);
    totalPaginas = Math.max(1, Number(resposta?.total_de_paginas ?? 1));
    await atualizarProgresso(pagina, totalPaginas);
    pagina++;
  } while (pagina <= totalPaginas);

  return { pedidos, totalPaginas };
}

async function buscarClientes(pedidos: any[], appKey: string, appSecret: string) {
  const codigos = [
    ...new Set(
      pedidos
        .map((p) => Number(p?.cabecalho?.codigo_cliente))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ];

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

    const clientes = Array.isArray(resposta?.clientes_cadastro_resumido)
      ? resposta.clientes_cadastro_resumido
      : [];

    for (const cliente of clientes) {
      const codigo = Number(cliente?.codigo_cliente);
      if (!Number.isFinite(codigo)) continue;
      mapa.set(
        codigo,
        cliente?.razao_social?.trim() ||
          cliente?.nome_fantasia?.trim() ||
          `Cliente ${codigo}`,
      );
    }
  }

  return mapa;
}

async function buscarVendedores(appKey: string, appSecret: string) {
  const mapa = new Map<number, string>();
  let pagina = 1;
  let total = 1;

  do {
    const resposta = await chamarOmie(
      URL_VENDEDORES,
      "ListarVendedores",
      { pagina, registros_por_pagina: 100 },
      appKey,
      appSecret,
    );

    const lista = Array.isArray(resposta?.cadastro) ? resposta.cadastro : [];
    for (const v of lista) {
      const codigo = Number(v?.codigo);
      if (Number.isFinite(codigo)) {
        mapa.set(codigo, v?.nome?.trim() || `Vendedor ${codigo}`);
      }
    }

    total = Math.max(1, Number(resposta?.total_de_paginas ?? 1));
    pagina++;
  } while (pagina <= total);

  return mapa;
}

async function buscarEtapas(appKey: string, appSecret: string) {
  const resposta = await chamarOmie(
    URL_ETAPAS,
    "ListarEtapasFaturamento",
    { pagina: 1, registros_por_pagina: 100 },
    appKey,
    appSecret,
  );

  const mapa = new Map<string, string>();
  const cadastros = Array.isArray(resposta?.cadastros) ? resposta.cadastros : [];

  for (const cadastro of cadastros) {
    const etapas = Array.isArray(cadastro?.etapas) ? cadastro.etapas : [];
    for (const etapa of etapas) {
      if (!etapa?.cCodigo) continue;
      mapa.set(
        String(etapa.cCodigo),
        etapa?.cDescricao?.trim() ||
          etapa?.cDescrPadrao?.trim() ||
          `Etapa ${etapa.cCodigo}`,
      );
    }
  }

  return mapa;
}

function normalizarPedidos(
  pedidos: any[],
  clientes: Map<number, string>,
  vendedores: Map<number, string>,
  etapas: Map<string, string>,
  sincronizadoEm: string,
) {
  const linhas: any[] = [];

  for (const pedido of pedidos) {
    const cab = pedido?.cabecalho ?? {};
    const info = pedido?.infoCadastro ?? {};
    const adicionais = pedido?.informacoes_adicionais ?? {};
    const codigoPedido = Number(cab?.codigo_pedido);

    if (!Number.isFinite(codigoPedido) || codigoPedido <= 0) continue;

    const numeroPedido = String(cab?.numero_pedido ?? codigoPedido);
    const codigoCliente = Number(cab?.codigo_cliente);
    const codigoVendedor = Number(adicionais?.codVend);
    const codigoEtapa = String(cab?.etapa ?? "");

    const cliente =
      clientes.get(codigoCliente) ||
      (Number.isFinite(codigoCliente)
        ? `Cliente ${codigoCliente}`
        : "Cliente não identificado");

    const vendedor = vendedores.get(codigoVendedor) || "-";
    const status = pedidoEhCancelado(pedido)
      ? "Cancelado"
      : normalizarStatus(etapas.get(codigoEtapa) || "Pedido");

    const dataPedido = converterData(info?.dInc);
    const previsao = converterData(cab?.data_previsao);
    const itens = Array.isArray(pedido?.det) ? pedido.det : [];

    itens.forEach((item: any, indice: number) => {
      const ide = item?.ide ?? {};
      const produto = item?.produto ?? {};
      const identificador = ide?.codigo_item ?? ide?.codigo_item_integracao ?? indice + 1;
      const quantidade = Number(produto?.quantidade ?? 0);

      let valor = Number(produto?.valor_total);
      if (!Number.isFinite(valor)) valor = Number(produto?.valor_mercadoria);
      if (!Number.isFinite(valor)) {
        valor = quantidade * Number(produto?.valor_unitario ?? 0);
      }

      linhas.push({
        chave_item: `${codigoPedido}:${identificador}`,
        codigo_pedido_omie: codigoPedido,
        numero_pedido: numeroPedido,
        codigo_cliente_omie: Number.isFinite(codigoCliente) ? codigoCliente : null,
        cliente,
        data_pedido: dataPedido,
        previsao,
        item_sequencia: indice + 1,
        codigo_produto: String(produto?.codigo ?? "").trim(),
        produto: produto?.descricao?.trim() || "Produto sem descrição",
        quantidade: Number.isFinite(quantidade) ? quantidade : 0,
        unidade: String(produto?.unidade ?? ""),
        codigo_vendedor_omie: Number.isFinite(codigoVendedor) ? codigoVendedor : null,
        vendedor,
        valor: Number.isFinite(valor) ? valor : 0,
        codigo_etapa: codigoEtapa,
        status,
        ativo: true,
        sincronizado_em: sincronizadoEm,
        atualizado_em: sincronizadoEm,
      });
    });
  }

  return linhas;
}


function montarEstruturaItens(linhas: any[]) {
  const ordenadas = [...linhas].sort((a, b) =>
    String(a?.chave_item ?? "").localeCompare(String(b?.chave_item ?? ""))
  );

  const assinatura = ordenadas
    .map((item) => String(item?.chave_item ?? ""))
    .filter(Boolean)
    .join("|");

  const descricao = ordenadas
    .map((item) => {
      const codigo = String(item?.codigo_produto ?? "").trim();
      const produto = String(item?.produto ?? "").trim();
      const quantidade = item?.quantidade ?? "";
      const unidade = String(item?.unidade ?? "").trim();

      return [codigo, produto, `${quantidade}${unidade ? ` ${unidade}` : ""}`]
        .filter(Boolean)
        .join(" — ");
    })
    .join("\n");

  return { assinatura, descricao };
}

async function carregarEstruturasAtivas(
  supabase: any,
  codigos: number[],
) {
  const mapa = new Map<number, { assinatura: string; descricao: string }>();
  if (!codigos.length) return mapa;

  for (let i = 0; i < codigos.length; i += 100) {
    const resultado = validar(
      await supabase
        .from("pedidos_omie")
        .select(
          "codigo_pedido_omie,chave_item,codigo_produto,produto,quantidade,unidade"
        )
        .in("codigo_pedido_omie", codigos.slice(i, i + 100))
        .eq("ativo", true),
      "lendo estrutura anterior dos pedidos",
    );

    const agrupado = new Map<number, any[]>();

    for (const linha of resultado.data ?? []) {
      const codigo = Number(linha?.codigo_pedido_omie);
      if (!Number.isFinite(codigo) || codigo <= 0) continue;
      if (!agrupado.has(codigo)) agrupado.set(codigo, []);
      agrupado.get(codigo)!.push(linha);
    }

    for (const [codigo, linhasPedido] of agrupado.entries()) {
      mapa.set(codigo, montarEstruturaItens(linhasPedido));
    }
  }

  return mapa;
}

async function desativarPedidosAlterados(
  supabase: any,
  codigos: number[],
  agora: string,
) {
  if (!codigos.length) return;

  for (let i = 0; i < codigos.length; i += 100) {
    validar(
      await supabase
        .from("pedidos_omie")
        .update({ ativo: false, atualizado_em: agora })
        .in("codigo_pedido_omie", codigos.slice(i, i + 100)),
      "desativando pedidos alterados",
    );
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  const inicioMs = Date.now();
  const inicio = new Date();
  const inicioIso = inicio.toISOString();
  const periodoAte = new Date(inicio);

  let supabase: any = null;
  let bloqueio = false;
  let historicoId: number | null = null;
  let etapa = "inicializacao";
  let modo = "incremental";
  let periodoDe: Date | null = null;
  let totalPaginas = 0;

  try {
    const appKey = Deno.env.get("OMIE_APP_KEY");
    const appSecret = Deno.env.get("OMIE_APP_SECRET");
    if (!appKey || !appSecret) {
      throw new Error("Credenciais do Omie não configuradas.");
    }

    supabase = criarSupabaseAdmin();

    etapa = "adquirindo_trava";
    const lock = await supabase.rpc("tentar_iniciar_sincronizacao_omie", {
      p_iniciado_em: inicioIso,
    });
    validar(lock, etapa);
    bloqueio = lock.data === true;

    if (!bloqueio) {
      return new Response(
        JSON.stringify({
          sucesso: true,
          ignorada: true,
          mensagem: "Já existe uma sincronização em andamento.",
        }),
        { status: 200, headers },
      );
    }

    etapa = "lendo_cursor";
    const controle = await supabase
      .from("sincronizacao_omie")
      .select("cursor_omie_em, ultima_sincronizacao")
      .eq("id", 1)
      .single();
    validar(controle, etapa);

    const cursorSalvo =
      controle.data?.cursor_omie_em || controle.data?.ultima_sincronizacao;

    if (cursorSalvo) {
      periodoDe = new Date(new Date(cursorSalvo).getTime() - SOBREPOSICAO_MS);
      modo = "incremental";
    } else {
      periodoDe = null;
      modo = "completo";
    }

    validar(
      await supabase
        .from("sincronizacao_omie")
        .update({
          modo,
          inicio_em: inicioIso,
          etapa: "consultando_pedidos",
          periodo_de: periodoDe ? periodoDe.toISOString() : null,
          periodo_ate: periodoAte.toISOString(),
          pagina_atual: 0,
          total_paginas: 0,
          pedidos_processados: 0,
          itens_processados: 0,
          duracao_ms: null,
          mensagem:
            modo === "incremental"
              ? "Consultando pedidos incluídos ou alterados desde a última sincronização"
              : "Executando sincronização completa",
          atualizado_em: inicioIso,
        })
        .eq("id", 1),
      "preparando sincronizacao",
    );

    const hist = await supabase
      .from("sincronizacao_omie_historico")
      .insert({
        inicio_em: inicioIso,
        origem: "automatico",
        modo,
        status: "sincronizando",
        etapa: "consultando_pedidos",
        periodo_de: periodoDe ? periodoDe.toISOString() : null,
        periodo_ate: periodoAte.toISOString(),
        mensagem: "Sincronização iniciada",
      })
      .select("id")
      .single();
    validar(hist, "criando_historico");
    historicoId = Number(hist.data?.id);

    etapa = "consultando_pedidos";
    const resultadoPedidos = await listarPedidos(
      appKey,
      appSecret,
      periodoDe,
      periodoAte,
      async (pagina, paginas) => {
        totalPaginas = paginas;
        const r = await supabase
          .from("sincronizacao_omie")
          .update({
            pagina_atual: pagina,
            total_paginas: paginas,
            etapa: "consultando_pedidos",
            mensagem: `Consultando pedidos no Omie (${pagina}/${paginas})`,
            atualizado_em: new Date().toISOString(),
          })
          .eq("id", 1);
        if (r.error) console.warn(r.error);
      },
    );

    const todosPedidos = resultadoPedidos.pedidos;
    totalPaginas = resultadoPedidos.totalPaginas;
    const pedidosSincronizaveis = todosPedidos.filter(pedidoDeveSerSincronizado);
    const pedidosCancelados = pedidosSincronizaveis.filter(pedidoEhCancelado);
    const pedidosAbertos = pedidosSincronizaveis.filter((p: any) => !pedidoEhCancelado(p));

    const codigosAlterados = [
      ...new Set(
        todosPedidos
          .map((p: any) => Number(p?.cabecalho?.codigo_pedido))
          .filter((n: number) => Number.isFinite(n) && n > 0),
      ),
    ];

    let estruturasAnteriores =
      new Map<number, { assinatura: string; descricao: string }>();

    if (modo === "incremental") {
      estruturasAnteriores = await carregarEstruturasAtivas(
        supabase,
        codigosAlterados,
      );

      await desativarPedidosAlterados(
        supabase,
        codigosAlterados,
        new Date().toISOString(),
      );
    }

    let linhas: any[] = [];

    if (pedidosSincronizaveis.length > 0) {
      etapa = "dados_auxiliares";
      const [clientes, vendedores, etapas] = await Promise.all([
        buscarClientes(pedidosSincronizaveis, appKey, appSecret),
        buscarVendedores(appKey, appSecret),
        buscarEtapas(appKey, appSecret),
      ]);

      etapa = "normalizando";
      linhas = normalizarPedidos(
        pedidosSincronizaveis,
        clientes,
        vendedores,
        etapas,
        inicioIso,
      );

      etapa = "gravando";
      for (let i = 0; i < linhas.length; i += 500) {
        validar(
          await supabase
            .from("pedidos_omie")
            .upsert(linhas.slice(i, i + 500), { onConflict: "chave_item" }),
          "gravando pedidos",
        );
      }

      if (modo === "incremental" && estruturasAnteriores.size > 0) {
        etapa = "registrando_alteracoes_estruturais";

        const novasPorPedido = new Map<number, any[]>();

        for (const linha of linhas) {
          const codigo = Number(linha?.codigo_pedido_omie);
          if (!Number.isFinite(codigo) || codigo <= 0) continue;
          if (!novasPorPedido.has(codigo)) novasPorPedido.set(codigo, []);
          novasPorPedido.get(codigo)!.push(linha);
        }

        for (const [codigo, anterior] of estruturasAnteriores.entries()) {
          const novasLinhas = novasPorPedido.get(codigo);
          if (!novasLinhas?.length) continue;

          const novo = montarEstruturaItens(novasLinhas);
          if (anterior.assinatura === novo.assinatura) continue;

          const referencia = novasLinhas[0];

          validar(
            await supabase.rpc(
              "registrar_alteracao_itens_pedido_omie_integracao",
              {
                p_codigo_pedido_omie: codigo,
                p_numero_pedido: String(referencia?.numero_pedido ?? codigo),
                p_cliente: String(referencia?.cliente ?? ""),
                p_vendedor: String(referencia?.vendedor ?? ""),
                p_data_pedido: referencia?.data_pedido ?? null,
                p_sincronizacao_em: inicioIso,
                p_itens_anteriores: anterior.descricao,
                p_itens_novos: novo.descricao,
              },
            ),
            "registrando alteração estrutural dos itens",
          );
        }
      }
    }

    if (modo === "completo") {
      validar(
        await supabase
          .from("pedidos_omie")
          .update({ ativo: false, atualizado_em: new Date().toISOString() })
          .eq("ativo", true)
          .lt("sincronizado_em", inicioIso),
        "reconciliando carga completa",
      );
    }

    etapa = "resumo";
    const resumoResult = await supabase.rpc("resumo_pedidos_omie");
    validar(resumoResult, etapa);
    const resumo = Array.isArray(resumoResult.data)
      ? resumoResult.data[0]
      : resumoResult.data;

    const quantidadePedidos = Number(resumo?.quantidade_pedidos ?? 0);
    const quantidadeItens = Number(resumo?.quantidade_itens ?? 0);
    const fimIso = new Date().toISOString();
    const duracao = Date.now() - inicioMs;

    const mensagemSucesso =
      modo === "incremental"
        ? todosPedidos.length === 0
          ? "Sincronização incremental concluída. Nenhuma alteração encontrada no período."
          : `Sincronização incremental concluída. ${todosPedidos.length} pedido(s) incluído(s)/alterado(s). ${pedidosCancelados.length} cancelado(s) processado(s) para consulta.`
        : `Sincronização completa concluída. ${pedidosCancelados.length} pedido(s) cancelado(s) disponível(is) para consulta.`;

    validar(
      await supabase
        .from("sincronizacao_omie")
        .update({
          ultima_sincronizacao: fimIso,
          cursor_omie_em: periodoAte.toISOString(),
          status: "sucesso",
          etapa: "concluido",
          modo,
          pagina_atual: totalPaginas,
          total_paginas: totalPaginas,
          quantidade_pedidos: quantidadePedidos,
          quantidade_itens: quantidadeItens,
          pedidos_processados: todosPedidos.length,
          itens_processados: linhas.length,
          duracao_ms: duracao,
          mensagem: mensagemSucesso,
          atualizado_em: fimIso,
        })
        .eq("id", 1),
      "finalizando",
    );

    if (historicoId) {
      await supabase
        .from("sincronizacao_omie_historico")
        .update({
          fim_em: fimIso,
          status: "sucesso",
          etapa: "concluido",
          paginas_processadas: totalPaginas,
          pedidos_processados: todosPedidos.length,
          itens_processados: linhas.length,
          quantidade_pedidos: quantidadePedidos,
          quantidade_itens: quantidadeItens,
          duracao_ms: duracao,
          mensagem: mensagemSucesso,
        })
        .eq("id", historicoId);
    }

    return new Response(
      JSON.stringify({
        sucesso: true,
        modo,
        paginas: totalPaginas,
        pedidos_processados: todosPedidos.length,
        pedidos_sincronizados: pedidosSincronizaveis.length,
        pedidos_abertos_processados: pedidosAbertos.length,
        pedidos_cancelados_processados: pedidosCancelados.length,
        itens_processados: linhas.length,
        duracao_ms: duracao,
        mensagem: mensagemSucesso,
      }),
      { status: 200, headers },
    );
  } catch (erro) {
    const fimIso = new Date().toISOString();
    const mensagem = msgErro(erro);
    const duracao = Date.now() - inicioMs;
    console.error(`Erro em ${etapa}:`, erro);

    if (bloqueio && supabase) {
      await supabase
        .from("sincronizacao_omie")
        .update({
          status: "erro",
          etapa,
          modo,
          duracao_ms: duracao,
          mensagem: `${etapa}: ${mensagem}`.slice(0, 1000),
          atualizado_em: fimIso,
        })
        .eq("id", 1);

      if (historicoId) {
        await supabase
          .from("sincronizacao_omie_historico")
          .update({
            fim_em: fimIso,
            status: "erro",
            etapa,
            paginas_processadas: totalPaginas,
            duracao_ms: duracao,
            mensagem: `${etapa}: ${mensagem}`.slice(0, 1000),
          })
          .eq("id", historicoId);
      }
    }

    return new Response(
      JSON.stringify({ sucesso: false, etapa, erro: mensagem }),
      { status: 500, headers },
    );
  }
});
