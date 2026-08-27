import {
  createServerFn,
} from "@tanstack/react-start";

import {
  createClient,
} from "@supabase/supabase-js";


const URL_PEDIDOS =
  "https://app.omie.com.br/api/v1/produtos/pedido/";

const URL_CLIENTES =
  "https://app.omie.com.br/api/v1/geral/clientes/";

const URL_VENDEDORES =
  "https://app.omie.com.br/api/v1/geral/vendedores/";

const URL_ETAPAS =
  "https://app.omie.com.br/api/v1/produtos/etapafat/";


/* =========================================================
   CONFIGURACAO SUPABASE
========================================================= */

function obterSupabaseUrl() {
  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  if (!url) {
    throw new Error(
      "URL do Supabase não configurada.",
    );
  }

  return url;
}


function obterSupabasePublicKey() {
  const chave =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!chave) {
    throw new Error(
      "Chave pública do Supabase não configurada.",
    );
  }

  return chave;
}


function obterSupabaseSecretKey() {
  const chave =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!chave) {
    throw new Error(
      "SUPABASE_SECRET_KEY não configurada no servidor.",
    );
  }

  return chave;
}


/* =========================================================
   CLIENTE SUPABASE DO USUARIO

   Usa a sessão do usuário e respeita RLS.
========================================================= */

function criarClienteSupabaseUsuario(
  accessToken,
) {
  return createClient(
    obterSupabaseUrl(),
    obterSupabasePublicKey(),
    {
      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },

      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,

        detectSessionInUrl:
          false,
      },
    },
  );
}


/* =========================================================
   CLIENTE ADMINISTRATIVO

   SOMENTE SERVIDOR.
   Nunca enviar essa chave ao navegador.
========================================================= */

function criarClienteSupabaseAdmin() {
  return createClient(
    obterSupabaseUrl(),
    obterSupabaseSecretKey(),
    {
      auth: {
        persistSession:
          false,

        autoRefreshToken:
          false,

        detectSessionInUrl:
          false,
      },
    },
  );
}


/* =========================================================
   VALIDAR SESSAO
========================================================= */

async function validarSessao(
  accessToken,
) {
  const supabase =
    criarClienteSupabaseUsuario(
      accessToken,
    );

  const {
    data,
    error,
  } =
    await supabase
      .auth
      .getUser(
        accessToken,
      );

  if (
    error ||
    !data?.user
  ) {
    throw new Error(
      "Sessão inválida ou expirada.",
    );
  }

  return data.user;
}


/* =========================================================
   CHAMADA GENERICA OMIE
========================================================= */

async function chamarOmie({
  url,
  call,
  param,
  appKey,
  appSecret,
}) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => {
        controller.abort();
      },
      30000,
    );

  try {
    const resposta =
      await fetch(
        url,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          signal:
            controller.signal,

          body:
            JSON.stringify({
              call,

              app_key:
                appKey,

              app_secret:
                appSecret,

              param: [
                param,
              ],
            }),
        },
      );


    const texto =
      await resposta.text();


    let dados;

    try {
      dados =
        texto
          ? JSON.parse(
              texto,
            )
          : {};
    } catch {
      throw new Error(
        "O Omie retornou uma resposta inválida.",
      );
    }


    if (
      !resposta.ok ||
      dados?.faultstring ||
      dados?.faultcode
    ) {
      const mensagem =
        dados?.faultstring ||
        dados?.description ||
        dados?.message ||
        `Erro HTTP ${resposta.status}`;

      throw new Error(
        `Erro Omie: ${mensagem}`,
      );
    }


    return dados;
  } catch (erro) {
    if (
      erro?.name ===
      "AbortError"
    ) {
      throw new Error(
        "A consulta ao Omie excedeu o tempo limite.",
      );
    }

    throw erro;
  } finally {
    clearTimeout(
      timeout,
    );
  }
}


/* =========================================================
   PEDIDO ESTA EM ABERTO?
========================================================= */

function pedidoEstaEmAberto(
  pedido,
) {
  const info =
    pedido?.infoCadastro ??
    {};

  const cabecalho =
    pedido?.cabecalho ??
    {};


  if (
    info.faturado === "S"
  ) {
    return false;
  }


  if (
    info.cancelado === "S"
  ) {
    return false;
  }


  if (
    info.denegado === "S"
  ) {
    return false;
  }


  if (
    info.devolvido === "S"
  ) {
    return false;
  }


  if (
    cabecalho.encerrado === "S"
  ) {
    return false;
  }


  return true;
}


/* =========================================================
   STATUS PARA EXIBICAO
========================================================= */

function normalizarStatusExibicao(
  statusOriginal,
) {
  if (!statusOriginal) {
    return "Pedido";
  }


  const texto =
    String(
      statusOriginal,
    ).trim();


  const normalizado =
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      );


  /*
   * Omie:
   * Armazenado
   *
   * Dashboard:
   * Pedido
   */
  if (
    normalizado.includes(
      "armazenado",
    )
  ) {
    return "Pedido";
  }


  return texto;
}


/* =========================================================
   DATAS
========================================================= */

function converterDataOmieParaIso(
  valor,
) {
  if (!valor) {
    return null;
  }


  const texto =
    String(
      valor,
    ).trim();


  const brasileiro =
    texto.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/,
    );


  if (brasileiro) {
    const [
      ,
      dia,
      mes,
      ano,
    ] =
      brasileiro;

    return `${ano}-${mes}-${dia}`;
  }


  const iso =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );


  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }


  return null;
}


function converterDataIsoParaBrasileira(
  valor,
) {
  if (!valor) {
    return "";
  }


  const texto =
    String(
      valor,
    );


  const partes =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );


  if (!partes) {
    return texto;
  }


  return (
    `${partes[3]}/` +
    `${partes[2]}/` +
    `${partes[1]}`
  );
}


/* =========================================================
   LISTAR PEDIDOS OMIE
========================================================= */

async function listarPedidosOmie({
  appKey,
  appSecret,
}) {
  let pagina =
    1;

  let totalPaginas =
    1;

  const pedidos =
    [];


  do {
    const resposta =
      await chamarOmie({
        url:
          URL_PEDIDOS,

        call:
          "ListarPedidos",

        appKey,

        appSecret,

        param: {
          pagina,

          registros_por_pagina:
            100,

          apenas_importado_api:
            "N",

          apenas_resumo:
            "N",
        },
      });


    const registros =
      Array.isArray(
        resposta
          ?.pedido_venda_produto,
      )
        ? resposta
            .pedido_venda_produto
        : [];


    pedidos.push(
      ...registros,
    );


    totalPaginas =
      Number(
        resposta
          ?.total_de_paginas ??
          1,
      );


    pagina += 1;
  } while (
    pagina <=
    totalPaginas
  );


  return pedidos;
}


/* =========================================================
   BUSCAR CLIENTES
========================================================= */

async function buscarClientes({
  pedidos,
  appKey,
  appSecret,
}) {
  const codigos =
    [
      ...new Set(
        pedidos
          .map(
            (pedido) =>
              Number(
                pedido
                  ?.cabecalho
                  ?.codigo_cliente,
              ),
          )
          .filter(
            (codigo) =>
              Number.isFinite(
                codigo,
              ) &&
              codigo > 0,
          ),
      ),
    ];


  const clientes =
    new Map();


  const TAMANHO_LOTE =
    50;


  for (
    let indice = 0;
    indice <
    codigos.length;
    indice +=
      TAMANHO_LOTE
  ) {
    const lote =
      codigos.slice(
        indice,
        indice +
          TAMANHO_LOTE,
      );


    const resposta =
      await chamarOmie({
        url:
          URL_CLIENTES,

        call:
          "ListarClientesResumido",

        appKey,

        appSecret,

        param: {
          pagina:
            1,

          registros_por_pagina:
            50,

          apenas_importado_api:
            "N",

          clientesPorCodigo:
            lote.map(
              (codigo) => ({
                codigo_cliente_omie:
                  codigo,
              }),
            ),
        },
      });


    const registros =
      Array.isArray(
        resposta
          ?.clientes_cadastro_resumido,
      )
        ? resposta
            .clientes_cadastro_resumido
        : [];


    for (
      const cliente
      of registros
    ) {
      const codigo =
        Number(
          cliente
            ?.codigo_cliente,
        );


      if (
        !Number.isFinite(
          codigo,
        )
      ) {
        continue;
      }


      const nome =
        cliente
          ?.razao_social
          ?.trim() ||
        cliente
          ?.nome_fantasia
          ?.trim() ||
        `Cliente ${codigo}`;


      clientes.set(
        codigo,
        nome,
      );
    }
  }


  return clientes;
}


/* =========================================================
   BUSCAR VENDEDORES
========================================================= */

async function buscarVendedores({
  appKey,
  appSecret,
}) {
  let pagina =
    1;

  let totalPaginas =
    1;


  const vendedores =
    new Map();


  do {
    const resposta =
      await chamarOmie({
        url:
          URL_VENDEDORES,

        call:
          "ListarVendedores",

        appKey,

        appSecret,

        param: {
          pagina,

          registros_por_pagina:
            100,

          apenas_importado_api:
            "N",
        },
      });


    const registros =
      Array.isArray(
        resposta?.cadastro,
      )
        ? resposta.cadastro
        : [];


    for (
      const vendedor
      of registros
    ) {
      const codigo =
        Number(
          vendedor?.codigo,
        );


      if (
        !Number.isFinite(
          codigo,
        )
      ) {
        continue;
      }


      vendedores.set(
        codigo,
        vendedor
          ?.nome
          ?.trim() ||
          `Vendedor ${codigo}`,
      );
    }


    totalPaginas =
      Number(
        resposta
          ?.total_de_paginas ??
          1,
      );


    pagina += 1;
  } while (
    pagina <=
    totalPaginas
  );


  return vendedores;
}


/* =========================================================
   BUSCAR ETAPAS
========================================================= */

async function buscarEtapas({
  appKey,
  appSecret,
}) {
  let pagina =
    1;

  let totalPaginas =
    1;


  const etapas =
    new Map();


  do {
    const resposta =
      await chamarOmie({
        url:
          URL_ETAPAS,

        call:
          "ListarEtapasFaturamento",

        appKey,

        appSecret,

        param: {
          pagina,

          registros_por_pagina:
            100,
        },
      });


    const cadastros =
      Array.isArray(
        resposta?.cadastros,
      )
        ? resposta.cadastros
        : [];


    for (
      const cadastro
      of cadastros
    ) {
      const lista =
        Array.isArray(
          cadastro?.etapas,
        )
          ? cadastro.etapas
          : [];


      for (
        const etapa
        of lista
      ) {
        if (
          !etapa?.cCodigo
        ) {
          continue;
        }


        etapas.set(
          String(
            etapa.cCodigo,
          ),

          etapa
            ?.cDescricao
            ?.trim() ||
          etapa
            ?.cDescrPadrao
            ?.trim() ||
          `Etapa ${etapa.cCodigo}`,
        );
      }
    }


    totalPaginas =
      Number(
        resposta
          ?.total_de_paginas ??
          1,
      );


    pagina += 1;
  } while (
    pagina <=
    totalPaginas
  );


  return etapas;
}


/* =========================================================
   NORMALIZAR PARA TABELA pedidos_omie
========================================================= */

function normalizarPedidosParaBanco({
  pedidos,
  clientes,
  vendedores,
  etapas,
  sincronizadoEm,
}) {
  const linhas =
    [];


  for (
    const pedido
    of pedidos
  ) {
    const cabecalho =
      pedido?.cabecalho ??
      {};

    const info =
      pedido?.infoCadastro ??
      {};

    const frete =
      pedido?.frete ??
      {};

    const informacoes =
      pedido
        ?.informacoes_adicionais ??
      {};


    const codigoPedido =
      Number(
        cabecalho
          ?.codigo_pedido,
      );


    if (
      !Number.isFinite(
        codigoPedido,
      ) ||
      codigoPedido <= 0
    ) {
      continue;
    }


    const numeroPedido =
      String(
        cabecalho
          ?.numero_pedido ??
        codigoPedido,
      );


    const codigoCliente =
      Number(
        cabecalho
          ?.codigo_cliente,
      );


    const codigoClienteValido =
      Number.isFinite(
        codigoCliente,
      ) &&
      codigoCliente > 0
        ? codigoCliente
        : null;


    const cliente =
      codigoClienteValido
        ? (
            clientes.get(
              codigoClienteValido,
            ) ||
            `Cliente ${codigoClienteValido}`
          )
        : "Cliente não identificado";


    const codigoVendedor =
      Number(
        informacoes
          ?.codVend,
      );


    const codigoVendedorValido =
      Number.isFinite(
        codigoVendedor,
      ) &&
      codigoVendedor > 0
        ? codigoVendedor
        : null;


    const vendedor =
      codigoVendedorValido
        ? (
            vendedores.get(
              codigoVendedorValido,
            ) ||
            `Vendedor ${codigoVendedorValido}`
          )
        : "-";


    const codigoEtapa =
      String(
        cabecalho
          ?.etapa ??
        "",
      );


    const statusOriginal =
      etapas.get(
        codigoEtapa,
      ) ||
      "Pedido";


    const status =
      normalizarStatusExibicao(
        statusOriginal,
      );


    const dataPedido =
      converterDataOmieParaIso(
        info?.dInc,
      );


    const previsao =
      converterDataOmieParaIso(
        frete
          ?.previsao_entrega ||
        cabecalho
          ?.data_previsao,
      );


    const itens =
      Array.isArray(
        pedido?.det,
      )
        ? pedido.det
        : [];


    /*
     * PEDIDO SEM ITENS
     */
    if (
      itens.length === 0
    ) {
      linhas.push({
        chave_item:
          `${codigoPedido}:sem-item`,

        codigo_pedido_omie:
          codigoPedido,

        numero_pedido:
          numeroPedido,

        codigo_cliente_omie:
          codigoClienteValido,

        cliente,

        data_pedido:
          dataPedido,

        previsao,

        item_sequencia:
          0,

        codigo_produto:
          "",

        produto:
          "Sem item informado",

        quantidade:
          0,

        unidade:
          "",

        codigo_vendedor_omie:
          codigoVendedorValido,

        vendedor,

        valor:
          Number(
            pedido
              ?.total_pedido
              ?.valor_total_pedido ??
              0,
          ),

        codigo_etapa:
          codigoEtapa,

        status,

        ativo:
          true,

        sincronizado_em:
          sincronizadoEm,

        atualizado_em:
          sincronizadoEm,
      });


      continue;
    }


    /*
     * PEDIDO COM ITENS
     */
    itens.forEach(
      (
        item,
        indice,
      ) => {
        const ide =
          item?.ide ??
          {};

        const produto =
          item?.produto ??
          {};


        /*
         * O codigo_item é o identificador
         * interno do item no Omie e é
         * preferível ao índice da lista.
         */
        const identificadorItem =
          ide?.codigo_item ??
          ide
            ?.codigo_item_integracao ??
          indice + 1;


        const quantidade =
          Number(
            produto
              ?.quantidade ??
              0,
          );


        let valor =
          Number(
            produto
              ?.valor_total,
          );


        if (
          !Number.isFinite(
            valor,
          )
        ) {
          valor =
            Number(
              produto
                ?.valor_mercadoria,
            );
        }


        if (
          !Number.isFinite(
            valor,
          )
        ) {
          const unitario =
            Number(
              produto
                ?.valor_unitario ??
                0,
            );

          valor =
            quantidade *
            unitario;
        }


        linhas.push({
          chave_item:
            `${codigoPedido}:${identificadorItem}`,

          codigo_pedido_omie:
            codigoPedido,

          numero_pedido:
            numeroPedido,

          codigo_cliente_omie:
            codigoClienteValido,

          cliente,

          data_pedido:
            dataPedido,

          previsao,

          item_sequencia:
            indice + 1,

          codigo_produto:
            String(
              produto
                ?.codigo_produto ??
                "",
            ),

          produto:
            produto
              ?.descricao
              ?.trim() ||
            "Produto sem descrição",

          quantidade:
            Number.isFinite(
              quantidade,
            )
              ? quantidade
              : 0,

          unidade:
            String(
              produto
                ?.unidade ??
                "",
            ),

          codigo_vendedor_omie:
            codigoVendedorValido,

          vendedor,

          valor:
            Number.isFinite(
              valor,
            )
              ? valor
              : 0,

          codigo_etapa:
            codigoEtapa,

          status,

          ativo:
            true,

          sincronizado_em:
            sincronizadoEm,

          atualizado_em:
            sincronizadoEm,
        });
      },
    );
  }


  return linhas;
}


/* =========================================================
   ATUALIZAR CONTROLE DA SINCRONIZACAO
========================================================= */

async function atualizarControleSincronizacao(
  supabaseAdmin,
  dados,
) {
  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "sincronizacao_omie",
      )
      .upsert(
        {
          id:
            1,

          ...dados,

          atualizado_em:
            new Date()
              .toISOString(),
        },
        {
          onConflict:
            "id",
        },
      );


  if (error) {
    throw new Error(
      `Erro ao atualizar controle da sincronização: ${error.message}`,
    );
  }
}


/* =========================================================
   GRAVAR PEDIDOS NO SUPABASE
========================================================= */

async function gravarPedidosNoSupabase({
  supabaseAdmin,
  linhas,
  sincronizadoEm,
}) {
  const TAMANHO_LOTE =
    500;


  /*
   * Primeiro gravamos todos os pedidos
   * atuais.
   *
   * Somente depois disso desativamos
   * pedidos que não vieram mais do Omie.
   */
  for (
    let indice = 0;
    indice <
    linhas.length;
    indice +=
      TAMANHO_LOTE
  ) {
    const lote =
      linhas.slice(
        indice,
        indice +
          TAMANHO_LOTE,
      );


    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "pedidos_omie",
        )
        .upsert(
          lote,
          {
            onConflict:
              "chave_item",
          },
        );


    if (error) {
      throw new Error(
        `Erro ao gravar pedidos no Supabase: ${error.message}`,
      );
    }
  }


  /*
   * Tudo que estava ativo, mas não
   * recebeu a marca desta sincronização,
   * deixou de ser pedido em aberto.
   */
  const {
    error:
      erroDesativar,
  } =
    await supabaseAdmin
      .from(
        "pedidos_omie",
      )
      .update({
        ativo:
          false,

        atualizado_em:
          sincronizadoEm,
      })
      .eq(
        "ativo",
        true,
      )
      .lt(
        "sincronizado_em",
        sincronizadoEm,
      );


  if (
    erroDesativar
  ) {
    throw new Error(
      `Erro ao atualizar pedidos encerrados: ${erroDesativar.message}`,
    );
  }
}


/* =========================================================
   EXECUTAR SINCRONIZACAO OMIE -> SUPABASE
========================================================= */

async function executarSincronizacaoPedidos() {
  const inicio =
    Date.now();

  const sincronizadoEm =
    new Date()
      .toISOString();


  const appKey =
    process.env
      .OMIE_APP_KEY;

  const appSecret =
    process.env
      .OMIE_APP_SECRET;


  if (
    !appKey ||
    !appSecret
  ) {
    throw new Error(
      "As credenciais do Omie não estão configuradas.",
    );
  }


  const supabaseAdmin =
    criarClienteSupabaseAdmin();


  /*
   * Marca que a sincronização começou.
   */
  await atualizarControleSincronizacao(
    supabaseAdmin,
    {
      status:
        "sincronizando",

      mensagem:
        "Consultando pedidos no Omie",
    },
  );


  try {
    /*
     * 1. Busca os pedidos.
     */
    const todosPedidos =
      await listarPedidosOmie({
        appKey,
        appSecret,
      });


    /*
     * 2. Mantém somente os abertos.
     *
     * A própria API informa faturado,
     * cancelado, denegado, devolvido e
     * encerrado.
     */
    const pedidosAbertos =
      todosPedidos.filter(
        pedidoEstaEmAberto,
      );


    /*
     * 3. Busca informações auxiliares
     * em paralelo.
     */
    const [
      clientes,
      vendedores,
      etapas,
    ] =
      await Promise.all([
        buscarClientes({
          pedidos:
            pedidosAbertos,

          appKey,
          appSecret,
        }),

        buscarVendedores({
          appKey,
          appSecret,
        }),

        buscarEtapas({
          appKey,
          appSecret,
        }),
      ]);


    /*
     * 4. Converte a estrutura do Omie
     * para a nossa tabela.
     */
    const linhas =
      normalizarPedidosParaBanco({
        pedidos:
          pedidosAbertos,

        clientes,

        vendedores,

        etapas,

        sincronizadoEm,
      });


    /*
     * 5. Salva no Supabase.
     */
    await gravarPedidosNoSupabase({
      supabaseAdmin,

      linhas,

      sincronizadoEm,
    });


    const duracao =
      Date.now() -
      inicio;


    /*
     * 6. Registra sucesso.
     */
    await atualizarControleSincronizacao(
      supabaseAdmin,
      {
        ultima_sincronizacao:
          sincronizadoEm,

        status:
          "sucesso",

        quantidade_pedidos:
          pedidosAbertos.length,

        quantidade_itens:
          linhas.length,

        duracao_ms:
          duracao,

        mensagem:
          "Pedidos sincronizados com sucesso",
      },
    );


    return {
      sucesso:
        true,

      quantidadePedidos:
        pedidosAbertos.length,

      quantidadeItens:
        linhas.length,

      duracaoMs:
        duracao,

      atualizadoEm:
        sincronizadoEm,
    };
  } catch (erro) {
    const duracao =
      Date.now() -
      inicio;


    /*
     * Mantemos os dados antigos.
     * Se o Omie falhar, a tela não fica vazia.
     */
    try {
      await atualizarControleSincronizacao(
        supabaseAdmin,
        {
          status:
            "erro",

          duracao_ms:
            duracao,

          mensagem:
            String(
              erro?.message ||
              "Erro desconhecido",
            ).slice(
              0,
              1000,
            ),
        },
      );
    } catch {
      /*
       * Não substituímos o erro
       * principal caso o registro
       * de log também falhe.
       */
    }


    throw erro;
  }
}


/* =========================================================
   BUSCAR PEDIDOS PARA A TELA

   IMPORTANTE:
   ESTA FUNCAO NAO CONSULTA O OMIE.

   Ela consulta apenas o Supabase.
========================================================= */

export const buscarPedidosOmie =
  createServerFn({
    method:
      "POST",
  })
    .validator(
      (dados) => {
        if (
          !dados ||
          typeof dados
            .accessToken !==
            "string" ||
          !dados
            .accessToken
            .trim()
        ) {
          throw new Error(
            "Sessão não informada.",
          );
        }


        return {
          accessToken:
            dados.accessToken,
        };
      },
    )
    .handler(
      async ({
        data,
      }) => {
        await validarSessao(
          data.accessToken,
        );


        const supabase =
          criarClienteSupabaseUsuario(
            data.accessToken,
          );


        const [
          resultadoPedidos,
          resultadoSincronizacao,
        ] =
          await Promise.all([
            supabase
              .from(
                "pedidos_omie",
              )
              .select(
                `
                  chave_item,
                  codigo_pedido_omie,
                  numero_pedido,
                  cliente,
                  data_pedido,
                  previsao,
                  codigo_produto,
                  produto,
                  quantidade,
                  unidade,
                  vendedor,
                  valor,
                  codigo_etapa,
                  status
                `,
              )
              .eq(
                "ativo",
                true,
              )
              .order(
                "previsao",
                {
                  ascending:
                    true,

                  nullsFirst:
                    false,
                },
              )
              .order(
                "numero_pedido",
                {
                  ascending:
                    true,
                },
              ),

            supabase
              .from(
                "sincronizacao_omie",
              )
              .select(
                `
                  ultima_sincronizacao,
                  status,
                  quantidade_pedidos,
                  quantidade_itens,
                  duracao_ms,
                  mensagem
                `,
              )
              .eq(
                "id",
                1,
              )
              .maybeSingle(),
          ]);


        if (
          resultadoPedidos.error
        ) {
          throw new Error(
            `Erro ao consultar pedidos: ${resultadoPedidos.error.message}`,
          );
        }


        if (
          resultadoSincronizacao.error
        ) {
          throw new Error(
            `Erro ao consultar sincronização: ${resultadoSincronizacao.error.message}`,
          );
        }


        const registros =
          Array.isArray(
            resultadoPedidos.data,
          )
            ? resultadoPedidos.data
            : [];


        const pedidos =
          registros.map(
            (registro) => ({
              id:
                registro
                  .chave_item,

              codigoPedido:
                registro
                  .codigo_pedido_omie,

              pedido:
                registro
                  .numero_pedido,

              cliente:
                registro
                  .cliente ||
                "-",

              data:
                converterDataIsoParaBrasileira(
                  registro
                    .data_pedido,
                ),

              previsao:
                converterDataIsoParaBrasileira(
                  registro
                    .previsao,
                ),

              codigoProduto:
                registro
                  .codigo_produto ||
                "",

              produto:
                registro
                  .produto ||
                "",

              quantidade:
                Number(
                  registro
                    .quantidade ??
                    0,
                ),

              unidade:
                registro
                  .unidade ||
                "",

              vendedor:
                registro
                  .vendedor ||
                "-",

              valor:
                Number(
                  registro
                    .valor ??
                    0,
                ),

              codigoEtapa:
                registro
                  .codigo_etapa ||
                "",

              status:
                registro
                  .status ||
                "Pedido",
            }),
          );


        const sincronizacao =
          resultadoSincronizacao
            .data;


        return {
          pedidos,

          quantidadePedidos:
            sincronizacao
              ?.quantidade_pedidos ??
            0,

          quantidadeLinhas:
            pedidos.length,

          atualizadoEm:
            sincronizacao
              ?.ultima_sincronizacao ??
            null,

          statusSincronizacao:
            sincronizacao
              ?.status ??
            "aguardando",

          mensagemSincronizacao:
            sincronizacao
              ?.mensagem ??
            "",
        };
      },
    );


/* =========================================================
   SINCRONIZACAO MANUAL

   Esta é a função que realmente
   conversa com o Omie.
========================================================= */

export const sincronizarPedidosOmie =
  createServerFn({
    method:
      "POST",
  })
    .validator(
      (dados) => {
        if (
          !dados ||
          typeof dados
            .accessToken !==
            "string" ||
          !dados
            .accessToken
            .trim()
        ) {
          throw new Error(
            "Sessão não informada.",
          );
        }


        return {
          accessToken:
            dados.accessToken,
        };
      },
    )
    .handler(
      async ({
        data,
      }) => {
        /*
         * Impede chamada anônima.
         */
        await validarSessao(
          data.accessToken,
        );


        return await executarSincronizacaoPedidos();
      },
    );