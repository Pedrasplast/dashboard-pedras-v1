import { createClient } from "npm:@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const txt = (v: unknown) =>
  String(v ?? "").trim();

function normalizarTexto(valor: unknown) {
  return txt(valor)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

async function buscarPedidosPorStatus(
  status: "encerrados" | "cancelados",
  appKey: string,
  appSecret: string,
  dataInicial: string,
  dataFinal: string,
) {
  const encontrados: Array<{
    codigo: number;
    numero: string;
    etapa: string;
  }> = [];

  let pagina = 1;
  let totalPaginas = 1;

  do {
    const filtros = {
      nPagina: pagina,
      nRegsPorPagina: 50,

      lApenasImportadoApi: "N",

      lExibirPedidosPendentes: "N",
      lExibirPedidosFaturados: "N",
      lExibirPedidosRecebidos: "N",

      lExibirPedidosCancelados:
        status === "cancelados" ? "S" : "N",

      lExibirPedidosEncerrados:
        status === "encerrados" ? "S" : "N",

      lExibirPedidosRecParciais: "N",
      lExibirPedidosFatParciais: "N",

      dDataInicial: dataInicial,
      dDataFinal: dataFinal,

      lApenasAlterados: false,
    };

    const response =
      await fetch(
        "https://app.omie.com.br/api/v1/produtos/pedidocompra/",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            call:
              "PesquisarPedCompra",

            app_key:
              appKey,

            app_secret:
              appSecret,

            param: [
              filtros,
            ],
          }),
        },
      );

    const dados =
      await response.json();

    const mensagemErro =
      txt(
        dados?.faultstring ||
          dados?.message ||
          dados?.faultcode ||
          "",
      );

    const erroNormalizado =
      normalizarTexto(
        mensagemErro,
      );

    if (
      pagina === 1 &&
      erroNormalizado.includes(
        "nao existem registros para a pagina",
      )
    ) {
      return [];
    }

    if (
      !response.ok ||
      dados?.faultstring ||
      dados?.faultcode
    ) {
      throw new Error(
        mensagemErro ||
          `Erro HTTP ${response.status}`,
      );
    }

    totalPaginas =
      Math.max(
        0,
        Number(
          dados?.nTotalPaginas ??
            0,
        ),
      );

    const lista =
      Array.isArray(
        dados?.pedidos_pesquisa,
      )
        ? dados.pedidos_pesquisa
        : [];

    for (
      const item of lista
    ) {
      const cab =
        item?.cabecalho_consulta ??
        {};

      const codigo =
        Number(
          cab?.nCodPed ??
            0,
        );

      const numero =
        txt(
          cab?.cNumero,
        );

      const etapa =
        txt(
          cab?.cEtapa,
        );

      if (
        Number.isSafeInteger(
          codigo,
        ) &&
        codigo > 0
      ) {
        encontrados.push({
          codigo,
          numero,
          etapa,
        });
      }
    }

    pagina++;
  } while (
    pagina <= totalPaginas &&
    pagina <= 1000
  );

  return encontrados;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json(
      {
        erro:
          "Método não permitido",
      },
      405,
    );
  }

  const url =
    Deno.env.get(
      "SUPABASE_URL",
    );

  const service =
    Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

  const appKey =
    Deno.env.get(
      "OMIE_APP_KEY",
    );

  const appSecret =
    Deno.env.get(
      "OMIE_APP_SECRET",
    );

  if (
    !url ||
    !service ||
    !appKey ||
    !appSecret
  ) {
    return json(
      {
        sucesso: false,
        erro:
          "Configuração ausente.",
      },
      500,
    );
  }

  const db =
    createClient(
      url,
      service,
      {
        auth: {
          persistSession:
            false,

          autoRefreshToken:
            false,
        },
      },
    );

  let body: any = {};

  try {
    body =
      await req.json();
  } catch {}

  const dataInicial =
    txt(
      body?.data_inicial,
    ) ||
    "01/09/2026";

  const dataFinal =
    txt(
      body?.data_final,
    ) ||
    "14/10/2026";

  const limite =
    Math.max(
      1,
      Math.min(
        Number(
          body?.limite ??
            20,
        ),
        20,
      ),
    );

  try {
    const encerrados =
      await buscarPedidosPorStatus(
        "encerrados",
        appKey,
        appSecret,
        dataInicial,
        dataFinal,
      );

    const cancelados =
      await buscarPedidosPorStatus(
        "cancelados",
        appKey,
        appSecret,
        dataInicial,
        dataFinal,
      );

    const terminais = [
      ...encerrados.map(
        (item) => ({
          ...item,
          status:
            "Encerrado",
        }),
      ),

      ...cancelados.map(
        (item) => ({
          ...item,
          status:
            "Cancelado",
        }),
      ),
    ].filter(
      (item) =>
        item.etapa ===
        "15",
    );

    const codigos =
      terminais.map(
        (item) =>
          item.codigo,
      );

    if (
      codigos.length === 0
    ) {
      return json({
        sucesso: true,

        encontrados_encerrados:
          encerrados.length,

        encontrados_cancelados:
          cancelados.length,

        candidatos_etapa_15:
          0,

        arquivados:
          0,

        detalhes:
          [],
      });
    }

    const consultaLocal =
      await db
        .from(
          "pedidos_compra_omie",
        )
        .select(
          "cod_ped_compra,snapshot",
        )
        .in(
          "cod_ped_compra",
          codigos,
        );

    if (
      consultaLocal.error
    ) {
      throw consultaLocal.error;
    }

    const mapaLocal =
      new Map<
        number,
        any
      >();

    for (
      const registro of
        consultaLocal.data ??
        []
    ) {
      mapaLocal.set(
        Number(
          registro.cod_ped_compra,
        ),
        registro,
      );
    }

    const candidatos =
      terminais
        .filter(
          (item) => {
            const local =
              mapaLocal.get(
                item.codigo,
              );

            if (!local) {
              return false;
            }

            const etapaLocal =
              txt(
                local
                  ?.snapshot
                  ?.etapa,
              );

            return (
              etapaLocal ===
              "15"
            );
          },
        )
        .slice(
          0,
          limite,
        );

    const detalhes: any[] =
      [];

    let arquivados =
      0;

    for (
      const item of candidatos
    ) {
      const local =
        mapaLocal.get(
          item.codigo,
        );

      const numeroLocal =
        txt(
          local
            ?.snapshot
            ?.numero,
        );

      const resultado =
        await db.rpc(
          "arquivar_remover_pedido_compra_fora_aprovacao",
          {
            p_codigo:
              item.codigo,
          },
        );

      if (
        resultado?.error
      ) {
        throw resultado.error;
      }

      arquivados++;

      detalhes.push({
        numero:
          numeroLocal ||
          item.numero,

        codigo:
          item.codigo,

        etapa:
          "15",

        status:
          item.status,
      });
    }

    return json({
      sucesso: true,

      regra:
        "Mostrar somente etapa 15 e status diferente de Encerrado e Cancelado",

      periodo: {
        data_inicial:
          dataInicial,

        data_final:
          dataFinal,
      },

      encontrados_encerrados:
        encerrados.length,

      encontrados_cancelados:
        cancelados.length,

      candidatos_etapa_15:
        terminais.length,

      candidatos_na_base:
        candidatos.length,

      arquivados,

      limite_por_execucao:
        limite,

      detalhes,

      executar_novamente:
        candidatos.length ===
        limite,
    });
  } catch (erro) {
    return json(
      {
        sucesso: false,

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
});
