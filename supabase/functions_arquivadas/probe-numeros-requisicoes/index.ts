import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const txt = (v: unknown) =>
  String(v ?? "").trim();

async function chamarOmie(
  codigoRegistro: number,
  pagina: number,
) {
  const appKey =
    Deno.env.get("OMIE_APP_KEY");

  const appSecret =
    Deno.env.get("OMIE_APP_SECRET");

  if (!appKey || !appSecret) {
    throw new Error(
      "Credenciais OMIE não configuradas.",
    );
  }

  const response =
    await fetch(
      "https://app.omie.com.br/api/v1/geral/auditoria/",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          call:
            "ListarAuditoriaAlteracoes",

          app_key:
            appKey,

          app_secret:
            appSecret,

          param: [
            {
              entidade:
                "requisicao-de-compra",

              codigo_registro:
                codigoRegistro,

              pagina,

              registros_por_pagina:
                100,
            },
          ],
        }),
      },
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    data?.faultstring ||
    data?.faultcode
  ) {
    throw new Error(
      txt(
        data?.faultstring ||
          data?.faultcode ||
          data?.message ||
          response.status,
      ),
    );
  }

  return data;
}

/*
 * Procura profundamente qualquer
 * informação relacionada a número.
 */
function procurarNumero(
  valor: unknown,
  caminho = "$",
  resultados: any[] = [],
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return resultados;
  }

  if (
    Array.isArray(valor)
  ) {
    valor.forEach(
      (item, indice) => {
        procurarNumero(
          item,
          `${caminho}[${indice}]`,
          resultados,
        );
      },
    );

    return resultados;
  }

  if (
    typeof valor ===
    "object"
  ) {
    for (
      const [
        chave,
        conteudo,
      ] of Object.entries(
        valor as Record<
          string,
          unknown
        >,
      )
    ) {
      const novoCaminho =
        `${caminho}.${chave}`;

      const chaveNormalizada =
        chave
          .normalize("NFD")
          .replace(
            /[̀-ͯ]/g,
            "",
          )
          .toLowerCase();

      const valorTexto =
        txt(conteudo);

      const valorNormalizado =
        valorTexto
          .normalize("NFD")
          .replace(
            /[̀-ͯ]/g,
            "",
          )
          .toLowerCase();

      if (
        chaveNormalizada.includes(
          "numero",
        ) ||
        valorNormalizado.includes(
          "numero",
        ) ||
        valorNormalizado.includes(
          "requisicao",
        )
      ) {
        resultados.push({
          caminho:
            novoCaminho,

          chave,

          valor:
            typeof conteudo ===
              "object"
              ? conteudo
              : valorTexto,
        });
      }

      procurarNumero(
        conteudo,
        novoCaminho,
        resultados,
      );
    }
  }

  return resultados;
}

function detectarTotalPaginas(
  data: any,
) {
  const candidatos = [
    data?.total_de_paginas,
    data?.total_paginas,
    data?.nTotalPaginas,
    data?.totalPaginas,
  ];

  for (
    const valor of candidatos
  ) {
    const n =
      Number(valor);

    if (
      Number.isFinite(n) &&
      n > 0
    ) {
      return Math.floor(n);
    }
  }

  return 1;
}

async function diagnosticar(
  codigo: number,
) {
  const primeira =
    await chamarOmie(
      codigo,
      1,
    );

  const totalPaginas =
    Math.min(
      detectarTotalPaginas(
        primeira,
      ),
      20,
    );

  const paginas: any[] = [];

  const analisarPagina = (
    pagina: number,
    data: any,
  ) => {
    const chaves =
      data &&
      typeof data ===
        "object"
        ? Object.keys(data)
        : [];

    const encontrados =
      procurarNumero(
        data,
      );

    paginas.push({
      pagina,

      chaves_topo:
        chaves,

      encontrados_relacionados_a_numero:
        encontrados,

      resposta_bruta:
        data,
    });
  };

  analisarPagina(
    1,
    primeira,
  );

  for (
    let pagina = 2;
    pagina <= totalPaginas;
    pagina++
  ) {
    const data =
      await chamarOmie(
        codigo,
        pagina,
      );

    analisarPagina(
      pagina,
      data,
    );
  }

  return {
    codigo_registro:
      codigo,

    total_paginas_detectadas:
      totalPaginas,

    paginas,
  };
}

Deno.serve(
  async (req) => {
    if (
      req.method !== "POST"
    ) {
      return json(
        {
          erro:
            "Método não permitido",
        },
        405,
      );
    }

    try {
      const codigos = [
        9235686989,
        9235761040,
      ];

      const resultados =
        [];

      for (
        const codigo of codigos
      ) {
        try {
          resultados.push(
            await diagnosticar(
              codigo,
            ),
          );
        } catch (erro) {
          resultados.push({
            codigo_registro:
              codigo,

            erro:
              erro instanceof
                Error
                ? erro.message
                : String(
                    erro,
                  ),
          });
        }
      }

      return json({
        sucesso: true,

        entidade:
          "requisicao-de-compra",

        objetivo:
          "Descobrir onde o Omie retorna o número visual da requisição",

        resultados,
      });
    } catch (erro) {
      return json(
        {
          sucesso:
            false,

          erro:
            erro instanceof Error
              ? erro.message
              : String(
                  erro,
                ),
        },
        500,
      );
    }
  },
);
