import { createClient } from "npm:@supabase/supabase-js@2";

/*
 * Sincroniza as requisições de compra ativas do Omie.
 *
 * v8 (22/10): o número da requisição só existe na auditoria do Omie, que às
 * vezes demora a registrar requisições novas. A v7 procurava 3 vezes por
 * execução (até 50 páginas, 4 tentativas de 28 s cada) e chegou a levar
 * 132 s. Agora: 1 busca por execução, até 5 páginas, 2 tentativas de 15 s e
 * no máximo 45 s somados por execução. A próxima execução (10 min depois)
 * tenta de novo, e o número já gravado nunca é apagado.
 */
const AUDITORIA_MAX_PAGINAS = 5;
const AUDITORIA_TENTATIVAS = 2;
const AUDITORIA_TIMEOUT_MS = 15000;
const AUDITORIA_PRAZO_TOTAL_MS = 45000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type OpcoesOmie = { tentativas?: number; timeoutMs?: number };

async function callOmie(
  endpoint: string,
  call: string,
  param: Record<string, unknown>,
  appKey: string,
  appSecret: string,
  opcoes: OpcoesOmie = {},
) {
  const maxTentativas = opcoes.tentativas ?? 4;
  const timeoutMs = opcoes.timeoutMs ?? 28000;
  let ultimoErro = "";

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
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

      const data = await response.json();

      if (response.ok && !data?.faultstring && !data?.faultcode) {
        return data;
      }

      ultimoErro = String(
        data?.faultstring ||
          data?.message ||
          data?.faultcode ||
          response.status,
      );

      const erroNormalizado = ultimoErro.toLowerCase();

      const temporario =
        erroNormalizado.includes("redundant") ||
        erroNormalizado.includes("redundante") ||
        response.status === 429 ||
        response.status >= 500;

      if (!temporario || tentativa === maxTentativas) {
        throw new Error(ultimoErro);
      }

      await sleep(tentativa === 1 ? 900 : tentativa === 2 ? 1800 : 3000);
    } catch (error) {
      ultimoErro =
        error instanceof Error
          ? error.message
          : String(error);

      const erroNormalizado = ultimoErro.toLowerCase();

      const temporario =
        erroNormalizado.includes("redundant") ||
        erroNormalizado.includes("redundante") ||
        erroNormalizado.includes("429") ||
        erroNormalizado.includes("abort") ||
        erroNormalizado.includes("timeout");

      if (!temporario || tentativa === maxTentativas) {
        throw error;
      }

      await sleep(tentativa === 1 ? 900 : tentativa === 2 ? 1800 : 3000);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error(ultimoErro || "Falha desconhecida ao consultar Omie");
}

async function obterNumeroRequisicaoPelaAuditoria(
  codigoRegistro: number,
  appKey: string,
  appSecret: string,
) {
  let pagina = 1;
  let totalPaginas = 1;

  do {
    const data = await callOmie(
      "https://app.omie.com.br/api/v1/geral/auditoria/",
      "ListarAuditoriaAlteracoes",
      {
        entidade: "requisicao-de-compra",
        codigo_registro: codigoRegistro,
        pagina,
        registros_por_pagina: 100,
      },
      appKey,
      appSecret,
      { tentativas: AUDITORIA_TENTATIVAS, timeoutMs: AUDITORIA_TIMEOUT_MS },
    );

    const eventos = Array.isArray(data?.eventos)
      ? data.eventos
      : [];

    for (const evento of eventos) {
      const campos = Array.isArray(evento?.campos)
        ? evento.campos
        : [];

      for (const campo of campos) {
        const nomeCampo = text(campo?.campo).toUpperCase();
        const rotulo = text(campo?.rotulo)
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .toUpperCase();

        if (
          nomeCampo !== "NUMERO" &&
          rotulo !== "NUMERO DA REQUISICAO"
        ) {
          continue;
        }

        const bruto = text(
          campo?.valor_novo ??
            campo?.valorNovo ??
            campo?.novo_valor,
        );

        if (!/^\d+$/.test(bruto)) {
          continue;
        }

        const numero = Number(bruto);

        if (Number.isSafeInteger(numero) && numero > 0) {
          return numero;
        }
      }
    }

    totalPaginas = Math.max(
      1,
      toNumber(data?.total_de_paginas) ||
        toNumber(data?.total_paginas) ||
        toNumber(data?.nTotalPaginas) ||
        1,
    );

    pagina += 1;
  } while (pagina <= totalPaginas && pagina <= AUDITORIA_MAX_PAGINAS);

  return null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ erro: "Método não permitido" }, 405);
  }

  const inicio = Date.now();

  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const appKey = Deno.env.get("OMIE_APP_KEY");
  const appSecret = Deno.env.get("OMIE_APP_SECRET");

  if (!url || !service || !appKey || !appSecret) {
    return json({ erro: "Configuração ausente" }, 500);
  }

  const db = createClient(url, service, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const token = req.headers.get("x-cron-secret");

  if (!token) {
    return json({ erro: "Não autorizado" }, 401);
  }

  const auth = await db.rpc("validar_token_cron_pedidos_compra", {
    p_token: token,
  });

  if (auth.error || auth.data !== true) {
    return json({ erro: "Não autorizado" }, 401);
  }

  try {
    const categorias = new Map<string, string>();

    const categoriasResult = await db
      .from("financeiro_omie_lancamentos")
      .select("codigo_categoria,categoria")
      .not("codigo_categoria", "is", null)
      .not("categoria", "is", null)
      .limit(10000);

    if (!categoriasResult.error) {
      for (const row of categoriasResult.data ?? []) {
        const codigo = text(row?.codigo_categoria);
        const nome = text(row?.categoria);

        if (codigo && nome && !categorias.has(codigo)) {
          categorias.set(codigo, nome);
        }
      }
    }

    const requisicoes: any[] = [];

    let pagina = 1;
    let totalPaginas = 1;
    let totalRegistros = 0;

    do {
      const data = await callOmie(
        "https://app.omie.com.br/api/v1/produtos/requisicaocompra/",
        "PesquisarReq",
        {
          pagina,
          registros_por_pagina: 100,
          apenas_importado_api: "N",
          ordenar_por: "CODIGO",
          ordem_descrescente: "N",
        },
        appKey,
        appSecret,
      );

      const paginaAtual = toNumber(data?.pagina);

      totalPaginas = Math.max(1, toNumber(data?.total_de_paginas));
      totalRegistros = Math.max(0, toNumber(data?.total_de_registros));

      if (paginaAtual && paginaAtual !== pagina) {
        throw new Error(
          `Paginação inconsistente: solicitada ${pagina}, recebida ${paginaAtual}.`,
        );
      }

      const lista = Array.isArray(data?.requisicaoCadastro)
        ? data.requisicaoCadastro
        : [];

      requisicoes.push(...lista);

      pagina += 1;
    } while (pagina <= totalPaginas && pagina <= 10000);

    if (totalRegistros !== requisicoes.length) {
      throw new Error(
        `Contagem inconsistente da Omie: informou ${totalRegistros}, recebemos ${requisicoes.length}.`,
      );
    }

    const produtosConsultados = new Set<number>();

    const cacheProdutos = new Map<
      number,
      {
        codigo_comercial: string;
        descricao: string;
        unidade: string;
      }
    >();

    let produtosResolvidos = 0;
    let produtosNaoResolvidos = 0;

    for (const requisicao of requisicoes) {
      const codigoCategoria = text(requisicao?.codCateg);

      requisicao.categoria_nome = categorias.get(codigoCategoria) || "";

      const itens = Array.isArray(requisicao?.ItensReqCompra)
        ? requisicao.ItensReqCompra
        : [];

      for (const item of itens) {
        const codigoProduto = toNumber(item?.codProd);

        if (!codigoProduto) {
          continue;
        }

        let produto = cacheProdutos.get(codigoProduto);

        if (!produto && !produtosConsultados.has(codigoProduto)) {
          produtosConsultados.add(codigoProduto);

          try {
            const respostaProduto = await callOmie(
              "https://app.omie.com.br/api/v1/geral/produtos/",
              "ConsultarProduto",
              { codigo_produto: codigoProduto },
              appKey,
              appSecret,
            );

            produto = {
              codigo_comercial:
                text(respostaProduto?.codigo) ||
                text(respostaProduto?.codigo_produto_integracao),
              descricao: text(respostaProduto?.descricao),
              unidade: text(respostaProduto?.unidade),
            };

            if (produto.codigo_comercial || produto.descricao || produto.unidade) {
              cacheProdutos.set(codigoProduto, produto);
              produtosResolvidos += 1;
            } else {
              produtosNaoResolvidos += 1;
            }
          } catch {
            produtosNaoResolvidos += 1;
          }
        }

        produto = cacheProdutos.get(codigoProduto);

        if (produto) {
          item.codigo_comercial = produto.codigo_comercial;
          item.descricao = produto.descricao;
          item.unidade = produto.unidade;
        }
      }
    }

    const codigos = requisicoes
      .map((r) => toNumber(r?.codReqCompra))
      .filter((codigo) => codigo > 0);

    const numerosExistentes = new Map<number, number>();

    if (codigos.length > 0) {
      const existentes = await db
        .from("requisicoes_compra_omie")
        .select("cod_req_compra,numero_requisicao")
        .in("cod_req_compra", codigos);

      if (existentes.error) {
        throw existentes.error;
      }

      for (const row of existentes.data ?? []) {
        const codigo = toNumber(row?.cod_req_compra);
        const numero = toNumber(row?.numero_requisicao);

        if (codigo > 0 && numero > 0) {
          numerosExistentes.set(codigo, numero);
        }
      }
    }

    let numerosAuditoriaResolvidos = 0;
    let numerosAuditoriaNaoResolvidos = 0;
    let numerosAuditoriaAdiados = 0;
    let tempoAuditoriaMs = 0;

    const rows: any[] = [];

    for (const requisicao of requisicoes) {
      const codigo = toNumber(requisicao?.codReqCompra);

      if (!codigo) {
        continue;
      }

      let numeroRequisicao = numerosExistentes.get(codigo) ?? null;

      if (!numeroRequisicao) {
        if (tempoAuditoriaMs >= AUDITORIA_PRAZO_TOTAL_MS) {
          // Prazo desta execução esgotado: a próxima tenta de novo.
          numerosAuditoriaAdiados += 1;
        } else {
          const inicioAuditoria = Date.now();

          try {
            numeroRequisicao = await obterNumeroRequisicaoPelaAuditoria(
              codigo,
              appKey,
              appSecret,
            );

            if (numeroRequisicao) {
              numerosAuditoriaResolvidos += 1;
            } else {
              numerosAuditoriaNaoResolvidos += 1;
            }
          } catch {
            numerosAuditoriaNaoResolvidos += 1;
          }

          tempoAuditoriaMs += Date.now() - inicioAuditoria;
          await sleep(250);
        }
      }

      rows.push({
        cod_req_compra: codigo,
        cod_int_req_compra: text(requisicao?.codIntReqCompra) || null,
        snapshot: requisicao,
        ativo: true,
        ultima_sincronizacao_em: new Date().toISOString(),
        ...(numeroRequisicao ? { numero_requisicao: numeroRequisicao } : {}),
      });
    }

    // Proteção contra corrida: antes do upsert, relê números já gravados.
    // Assim uma consulta de auditoria temporariamente indisponível nunca apaga
    // um numero_requisicao que já foi resolvido em execução anterior.
    const semNumero = rows
      .filter((row) => !toNumber(row?.numero_requisicao))
      .map((row) => toNumber(row?.cod_req_compra))
      .filter((codigo) => codigo > 0);

    if (semNumero.length > 0) {
      const atuais = await db
        .from("requisicoes_compra_omie")
        .select("cod_req_compra,numero_requisicao")
        .in("cod_req_compra", semNumero);

      if (atuais.error) {
        throw atuais.error;
      }

      const numerosAtuais = new Map<number, number>();

      for (const atual of atuais.data ?? []) {
        const codigoAtual = toNumber(atual?.cod_req_compra);
        const numeroAtual = toNumber(atual?.numero_requisicao);

        if (codigoAtual > 0 && numeroAtual > 0) {
          numerosAtuais.set(codigoAtual, numeroAtual);
        }
      }

      for (const row of rows) {
        if (toNumber(row?.numero_requisicao) > 0) {
          continue;
        }

        const numeroAtual = numerosAtuais.get(toNumber(row?.cod_req_compra));

        if (numeroAtual) {
          row.numero_requisicao = numeroAtual;
        }
      }
    }

    if (rows.length !== requisicoes.length) {
      throw new Error(
        "Uma ou mais requisições retornaram sem código válido. Nenhuma desativação foi executada.",
      );
    }

    if (rows.length > 0) {
      const upsert = await db
        .from("requisicoes_compra_omie")
        .upsert(rows, { onConflict: "cod_req_compra", ignoreDuplicates: false });

      if (upsert.error) {
        throw upsert.error;
      }
    }

    if (codigos.length > 0) {
      const agora = new Date().toISOString();

      const desativar = await db
        .from("requisicoes_compra_omie")
        .update({ ativo: false, ultima_sincronizacao_em: agora })
        .eq("ativo", true)
        .not("cod_req_compra", "in", `(${codigos.join(",")})`);

      if (desativar.error) {
        throw desativar.error;
      }
    }

    return json({
      sucesso: true,
      requisicoes_ativas: rows.length,
      total_paginas: totalPaginas,
      categorias_resolvidas: categorias.size,
      produtos_consultados: produtosConsultados.size,
      produtos_resolvidos: produtosResolvidos,
      produtos_nao_resolvidos: produtosNaoResolvidos,
      numeros_auditoria_resolvidos: numerosAuditoriaResolvidos,
      numeros_auditoria_nao_resolvidos: numerosAuditoriaNaoResolvidos,
      numeros_auditoria_adiados: numerosAuditoriaAdiados,
      tempo_auditoria_ms: tempoAuditoriaMs,
      duracao_ms: Date.now() - inicio,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);

    if (
      message.toLowerCase().includes("redundant") ||
      message.toLowerCase().includes("redundante")
    ) {
      return json({
        sucesso: true,
        ignorado: true,
        motivo:
          "A Omie bloqueou uma consulta redundante; será tentado novamente no próximo ciclo.",
        duracao_ms: Date.now() - inicio,
      });
    }

    return json(
      {
        sucesso: false,
        erro: message,
        duracao_ms: Date.now() - inicio,
      },
      500,
    );
  }
});
