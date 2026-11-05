import { createClient } from "npm:@supabase/supabase-js@2";

const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function resposta(
  body: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: HEADERS,
    },
  );
}

const texto = (
  valor: unknown,
) =>
  String(
    valor ?? "",
  ).trim();

async function esperar(
  ms: number,
) {
  await new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        ms,
      ),
  );
}

/* =========================================================
   LISTAR SNAPSHOTS

   Busca apenas os dois campos usados (fornecedor e comprador)
   em vez do snapshot JSON completo de cada pedido.
   Antes: ~11 MB por chamada. Agora: ~0,4 MB, mesmo resultado.
========================================================= */

async function listarTodosSnapshots(
  db: ReturnType<typeof createClient>,
) {
  const snapshots: Array<{ fornecedor: unknown; comprador: unknown }> = [];
  const tamanhoPagina = 1000;
  let inicio = 0;

  while (true) {
    const pagina = await db
      .from("pedidos_compra_omie")
      .select("fornecedor:snapshot->>fornecedor,comprador:snapshot->>comprador")
      .order("cod_ped_compra", { ascending: true })
      .range(inicio, inicio + tamanhoPagina - 1);

    if (pagina.error) {
      throw new Error("Não foi possível consultar os pedidos de compra.");
    }

    const registros = Array.isArray(pagina.data) ? pagina.data : [];

    for (const registro of registros) {
      snapshots.push({
        fornecedor: registro?.fornecedor ?? null,
        comprador: registro?.comprador ?? null,
      });
    }

    if (registros.length < tamanhoPagina) {
      break;
    }

    inicio += tamanhoPagina;
  }

  return snapshots;
}

async function consultarFornecedorOmie(
  codigo: string,
  appKey: string,
  appSecret: string,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 16000);

  try {
    const response = await fetch(
      "https://app.omie.com.br/api/v1/geral/clientes/",
      {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call: "ConsultarCliente",
          app_key: appKey,
          app_secret: appSecret,
          param: [
            {
              codigo_cliente_omie: Number(codigo),
              codigo_cliente_integracao: "",
            },
          ],
        }),
      },
    );

    const data = await response.json();

    if (!response.ok || data?.faultstring || data?.faultcode) {
      throw new Error(
        texto(data?.faultstring || data?.message) ||
          "Consulta de fornecedor no Omie indisponível.",
      );
    }

    const codigoRetornado = texto(
      data?.codigo_cliente_omie ?? data?.codigo_cliente ?? codigo,
    );

    const nome = texto(data?.nome_fantasia) || texto(data?.razao_social);

    if (!nome) {
      return null;
    }

    return {
      codigo: codigoRetornado || codigo,
      nome,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function carregarFornecedores(
  db: ReturnType<typeof createClient>,
  codigos: string[],
  appKey: string | undefined,
  appSecret: string | undefined,
) {
  const nomes = new Map<string, string>();
  let falhaOmie = false;

  const codigosValidos = [
    ...new Set(
      codigos
        .map((codigo) => texto(codigo))
        .filter((codigo) => /^\d+$/.test(codigo) && codigo !== "0"),
    ),
  ];

  if (!codigosValidos.length) {
    return { nomes, falhaOmie };
  }

  for (let i = 0; i < codigosValidos.length; i += 500) {
    const lote = codigosValidos.slice(i, i + 500);

    const cache = await db
      .from("pedidos_compra_fornecedores")
      .select("codigo,nome")
      .in("codigo", lote);

    if (cache.error) {
      throw new Error("Não foi possível consultar o cache de fornecedores.");
    }

    for (const registro of cache.data ?? []) {
      const codigo = texto(registro.codigo);
      const nome = texto(registro.nome);
      if (codigo && nome) {
        nomes.set(codigo, nome);
      }
    }
  }

  const faltantes = codigosValidos.filter((codigo) => !nomes.has(codigo));

  if (!faltantes.length) {
    return { nomes, falhaOmie };
  }

  if (!appKey || !appSecret) {
    return { nomes, falhaOmie: true };
  }

  for (let i = 0; i < faltantes.length; i += 1) {
    const codigo = faltantes[i];

    try {
      let cadastro: { codigo: string; nome: string } | null = null;

      try {
        cadastro = await consultarFornecedorOmie(codigo, appKey, appSecret);
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : "";
        const redundante = /redundant|redundante|consumo redundante/i.test(mensagem);

        if (!redundante) {
          throw erro;
        }

        console.warn(
          `Consulta redundante para fornecedor ${codigo}. Aguardando antes de repetir.`,
        );

        await esperar(16500);

        cadastro = await consultarFornecedorOmie(codigo, appKey, appSecret);
      }

      if (cadastro?.nome) {
        const salvar = await db
          .from("pedidos_compra_fornecedores")
          .upsert(
            {
              codigo: cadastro.codigo,
              nome: cadastro.nome,
              origem: "omie",
              atualizado_em: new Date().toISOString(),
            },
            { onConflict: "codigo" },
          );

        if (salvar.error) {
          throw new Error("Erro ao atualizar o cache de fornecedores.");
        }

        nomes.set(cadastro.codigo, cadastro.nome);

        if (cadastro.codigo !== codigo) {
          nomes.set(codigo, cadastro.nome);
        }
      }
    } catch (erro) {
      falhaOmie = true;
      console.error(
        `Falha controlada na consulta do fornecedor ${codigo}:`,
        erro instanceof Error ? erro.message : "Falha desconhecida",
      );
    }

    if (i < faltantes.length - 1) {
      await esperar(350);
    }
  }

  return { nomes, falhaOmie };
}

async function carregarCompradores(
  db: ReturnType<typeof createClient>,
  codigos: string[],
  appKey: string | undefined,
  appSecret: string | undefined,
) {
  const nomes = new Map<string, string>();
  let falhaOmie = false;

  if (!codigos.length) {
    return { nomes, falhaOmie };
  }

  for (let i = 0; i < codigos.length; i += 500) {
    const lote = codigos.slice(i, i + 500);

    const cache = await db
      .from("pedidos_compra_compradores")
      .select("codigo,nome")
      .in("codigo", lote);

    if (cache.error) {
      throw new Error("Não foi possível consultar o cache de compradores.");
    }

    for (const registro of cache.data ?? []) {
      const codigo = texto(registro.codigo);
      const nome = texto(registro.nome);
      if (codigo && nome) {
        nomes.set(codigo, nome);
      }
    }
  }

  const faltantes = codigos.filter((codigo) => !nomes.has(codigo));

  if (!faltantes.length) {
    return { nomes, falhaOmie };
  }

  if (!appKey || !appSecret) {
    return { nomes, falhaOmie: true };
  }

  const desejados = new Set(faltantes);
  let pagina = 1;
  let totalPaginas = 1;

  while (pagina <= totalPaginas && desejados.size > 0) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 16000);

    try {
      const response = await fetch(
        "https://app.omie.com.br/api/v1/estoque/comprador/",
        {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            call: "ListarCompradores",
            app_key: appKey,
            app_secret: appSecret,
            param: [{ pagina, registros_por_pagina: 50 }],
          }),
        },
      );

      const data = await response.json();

      if (
        !response.ok ||
        data?.faultstring ||
        data?.faultcode ||
        !Array.isArray(data?.cadastros)
      ) {
        throw new Error(
          texto(data?.faultstring || data?.message) ||
            "Consulta de compradores no Omie indisponível.",
        );
      }

      totalPaginas = Math.max(1, Number(data.total_de_paginas ?? 1) || 1);

      const encontrados: Array<{ codigo: string; nome: string }> = [];

      for (const cadastro of data.cadastros) {
        const codigo = texto(cadastro?.nCodigo);
        const nome = texto(cadastro?.cDescricao);

        if (desejados.has(codigo) && nome) {
          encontrados.push({ codigo, nome });
          nomes.set(codigo, nome);
          desejados.delete(codigo);
        }
      }

      if (encontrados.length) {
        const salvar = await db
          .from("pedidos_compra_compradores")
          .upsert(
            encontrados.map((cadastro) => ({
              ...cadastro,
              origem: "omie",
              atualizado_em: new Date().toISOString(),
            })),
            { onConflict: "codigo" },
          );

        if (salvar.error) {
          throw new Error("Erro ao atualizar o cache de compradores.");
        }
      }

      pagina += 1;
    } catch (erro) {
      falhaOmie = true;
      console.error(
        "Falha controlada na consulta de compradores:",
        erro instanceof Error ? erro.message : "Falha desconhecida",
      );
      break;
    } finally {
      clearTimeout(timer);
    }
  }

  return { nomes, falhaOmie };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return resposta({ ok: true });
  }

  if (req.method !== "POST") {
    return resposta({ erro: "Método não permitido." }, 405);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const role = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const appKey = Deno.env.get("OMIE_APP_KEY");
  const appSecret = Deno.env.get("OMIE_APP_SECRET");

  if (!url || !anon || !role) {
    return resposta({ erro: "Configuração de autenticação indisponível." }, 500);
  }

  const jwt = req.headers
    .get("Authorization")
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  if (!jwt || jwt.startsWith("sb_publishable_")) {
    return resposta(
      { erro: "Faça login para consultar os nomes dos pedidos de compra." },
      401,
    );
  }

  const user = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const auth = await user.auth.getUser(jwt);

  if (auth.error || !auth.data.user?.id) {
    return resposta({ erro: "Sessão inválida. Entre novamente no dashboard." }, 401);
  }

  /*
   * Tela "Pedidos de Compra" OU relatório "Pedidos de compra alterados".
   */
  const permissao = await user.rpc("pode_ver_pedidos_compra");

  if (permissao.error || permissao.data !== true) {
    return resposta({ erro: "Sem permissão para acessar os pedidos de compra." }, 403);
  }

  const db = createClient(url, role, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const snapshots = await listarTodosSnapshots(db);

    const codigosFornecedores = [
      ...new Set(
        snapshots
          .map((snapshot) => texto(snapshot.fornecedor))
          .filter((codigo) => /^\d+$/.test(codigo) && codigo !== "0"),
      ),
    ];

    const codigosCompradores = [
      ...new Set(
        snapshots
          .map((snapshot) => texto(snapshot.comprador))
          .filter((codigo) => /^\d+$/.test(codigo) && codigo !== "0"),
      ),
    ];

    const [fornecedores, compradores] = await Promise.all([
      carregarFornecedores(db, codigosFornecedores, appKey, appSecret),
      carregarCompradores(db, codigosCompradores, appKey, appSecret),
    ]);

    return resposta({
      fornecedores: Object.fromEntries(fornecedores.nomes),
      compradores: Object.fromEntries(compradores.nomes),
      pendentes_fornecedores: codigosFornecedores.filter(
        (codigo) => !fornecedores.nomes.has(codigo),
      ).length,
      pendentes_compradores: codigosCompradores.filter(
        (codigo) => !compradores.nomes.has(codigo),
      ).length,
      consulta_omie_falhou: fornecedores.falhaOmie || compradores.falhaOmie,
    });
  } catch (erro) {
    console.error(
      "Erro ao montar nomes dos pedidos de compra:",
      erro instanceof Error ? erro.message : "Falha desconhecida",
    );

    return resposta(
      {
        erro:
          erro instanceof Error
            ? erro.message
            : "Não foi possível consultar os nomes dos pedidos de compra.",
      },
      500,
    );
  }
});
