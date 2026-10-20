import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const json = (
  body: unknown,
  status = 200,
) =>
  new Response(
    JSON.stringify(body, null, 2),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
      },
    },
  );

async function chamarOmie(
  call: string,
  param: Record<string, unknown>,
) {
  const appKey =
    Deno.env.get("OMIE_APP_KEY");

  const appSecret =
    Deno.env.get("OMIE_APP_SECRET");

  if (!appKey || !appSecret) {
    throw new Error(
      "Credenciais Omie ausentes.",
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
          call,
          app_key: appKey,
          app_secret: appSecret,
          param: [
            param,
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
      String(
        data?.faultstring ||
          data?.faultcode ||
          response.status,
      ),
    );
  }

  return data;
}

Deno.serve(
  async () => {
    try {
      const auditoria =
        await chamarOmie(
          "ListarAuditoriaAlteracoes",
          {
            entidade:
              "requisicao-de-compra",

            codigo_registro:
              9235178539,

            pagina:
              1,

            registros_por_pagina:
              50,
          },
        );

      return json({
        sucesso: true,
        entidade:
          "requisicao-de-compra",
        codigo_registro:
          9235178539,
        auditoria,
      });
    } catch (erro) {
      return json(
        {
          sucesso: false,

          erro:
            erro instanceof Error
              ? erro.message
              : String(erro),
        },
        500,
      );
    }
  },
);
