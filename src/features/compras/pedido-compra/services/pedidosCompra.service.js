import {
  supabase,
} from "@/lib/supabaseClient";

import {
  enriquecerPedido,
  ordenarPedidos,
} from "../utils/pedidosCompra.utils";

const TAMANHO_PAGINA =
  1000;

async function buscarTodos(
  nomeTabela,
  colunas,
  configurarConsulta,
) {
  const registros =
    [];

  let inicio =
    0;

  while (true) {
    let consulta =
      supabase
        .from(
          nomeTabela,
        )
        .select(
          colunas,
        );

    if (
      typeof configurarConsulta ===
      "function"
    ) {
      consulta =
        configurarConsulta(
          consulta,
        );
    }

    const {
      data,
      error,
    } =
      await consulta.range(
        inicio,
        inicio +
          TAMANHO_PAGINA -
          1,
      );

    if (
      error
    ) {
      throw error;
    }

    const pagina =
      Array.isArray(
        data,
      )
        ? data
        : [];

    registros.push(
      ...pagina,
    );

    if (
      pagina.length <
      TAMANHO_PAGINA
    ) {
      break;
    }

    inicio +=
      TAMANHO_PAGINA;
  }

  return registros;
}

async function buscarEstadoSincronizacao() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "sincronizacao_pedidos_compra_omie",
      )
      .select(
        "id,status,iniciado_em,finalizado_em,atualizado_em,varredura_iniciada_em,total_pedidos,total_paginas,mensagem",
      )
      .eq(
        "id",
        1,
      )
      .maybeSingle();

  if (
    error
  ) {
    throw error;
  }

  return data ??
    null;
}

async function buscarDocumentosAtuais() {
  return buscarTodos(
    "compras_documentos_front",

    "documento_id,tipo_documento,numero_documento,cod_ped_compra,cod_req_compra,numero_pedido,numero_requisicao,codigo_fornecedor,codigo_comprador,categoria,categoria_nome,centro_custo,condicao_pagamento,data_previsao,data_inclusao,observacoes,observacoes_internas,quantidade_itens,primeira_sincronizacao_em,ultima_sincronizacao_em,snapshot",

    (
      consulta,
    ) =>
      consulta.order(
        "documento_id",
        {
          ascending:
            true,
        },
      ),
  );
}

async function buscarItens() {
  return buscarTodos(
    "compras_documentos_itens_front",

    "documento_id,tipo_documento,cod_ped_compra,cod_req_compra,numero_documento,codigo_item,codigo_produto,codigo_comercial,descricao,unidade,quantidade,quantidade_recebida,preco_unitario,valor_total,desconto,observacao,local_estoque,sequencia",

    (
      consulta,
    ) =>
      consulta.order(
        "documento_id",
        {
          ascending:
            true,
        },
      ),
  );
}

async function buscarFornecedoresCache() {
  return buscarTodos(
    "pedidos_compra_fornecedores",

    "codigo,nome,atualizado_em",

    (
      consulta,
    ) =>
      consulta.order(
        "codigo",
        {
          ascending:
            true,
        },
      ),
  );
}

async function buscarNomesOmie() {
  const {
    data,
    error,
  } =
    await supabase
      .functions
      .invoke(
        "nomes-fornecedores-pedidos-compra",
        {
          body: {},
        },
      );

  if (
    error
  ) {
    console.warn(
      "Não foi possível atualizar os nomes dos pedidos de compra:",
      error.message,
    );

    return {
      fornecedores:
        {},

      compradores:
        {},

      consulta_omie_falhou:
        true,
    };
  }

  return {
    fornecedores:
      data
        ?.fornecedores &&
      typeof data
        .fornecedores ===
        "object"
        ? data.fornecedores
        : {},

    compradores:
      data
        ?.compradores &&
      typeof data
        .compradores ===
        "object"
        ? data.compradores
        : {},

    consulta_omie_falhou:
      Boolean(
        data
          ?.consulta_omie_falhou,
      ),
  };
}

export async function buscarPedidosCompra() {
  const estado =
    await buscarEstadoSincronizacao();

  const [
    documentos,
    itens,
    fornecedoresCache,
    nomesOmie,
  ] =
    await Promise.all(
      [
        buscarDocumentosAtuais(),

        buscarItens(),

        buscarFornecedoresCache(),

        buscarNomesOmie(),
      ],
    );

  const idsAtuais =
    new Set(
      documentos.map(
        (
          documento,
        ) =>
          String(
            documento
              .documento_id ??
              "",
          ),
      ),
    );

  const itensPorDocumento =
    new Map();

  for (
    const item
    of itens
  ) {
    const documentoId =
      String(
        item
          ?.documento_id ??
          "",
      );

    if (
      !idsAtuais.has(
        documentoId,
      )
    ) {
      continue;
    }

    if (
      !itensPorDocumento.has(
        documentoId,
      )
    ) {
      itensPorDocumento.set(
        documentoId,
        [],
      );
    }

    itensPorDocumento
      .get(
        documentoId,
      )
      .push(
        item,
      );
  }

  for (
    const lista
    of itensPorDocumento.values()
  ) {
    lista.sort(
      (
        a,
        b,
      ) =>
        Number(
          a
            ?.sequencia ??
            0,
        ) -
        Number(
          b
            ?.sequencia ??
            0,
        ),
    );
  }

  const mapaFornecedores =
    new Map(
      fornecedoresCache
        .map(
          (
            fornecedor,
          ) => [
            String(
              fornecedor
                .codigo ??
                "",
            ).trim(),

            String(
              fornecedor
                .nome ??
                "",
            ).trim(),
          ],
        )
        .filter(
          (
            [
              codigo,
              nome,
            ],
          ) =>
            codigo &&
            nome,
        ),
    );

  for (
    const [
      codigo,
      nome,
    ]
    of Object.entries(
      nomesOmie
        .fornecedores,
    )
  ) {
    const codigoNormalizado =
      String(
        codigo ??
          "",
      ).trim();

    const nomeNormalizado =
      String(
        nome ??
          "",
      ).trim();

    if (
      codigoNormalizado &&
      nomeNormalizado
    ) {
      mapaFornecedores.set(
        codigoNormalizado,
        nomeNormalizado,
      );
    }
  }

  const mapaCompradores =
    new Map(
      Object.entries(
        nomesOmie
          .compradores,
      )
        .map(
          (
            [
              codigo,
              nome,
            ],
          ) => [
            String(
              codigo ??
                "",
            ).trim(),

            String(
              nome ??
                "",
            ).trim(),
          ],
        )
        .filter(
          (
            [
              codigo,
              nome,
            ],
          ) =>
            codigo &&
            nome,
        ),
    );

  const documentosEnriquecidos =
    documentos.map(
      (
        documento,
      ) =>
        enriquecerPedido(
          documento,

          itensPorDocumento.get(
            String(
              documento
                .documento_id ??
                "",
            ),
          ) ??
            [],

          mapaFornecedores,

          mapaCompradores,
        ),
    );

  return {
    pedidos:
      ordenarPedidos(
        documentosEnriquecidos,
      ),

    estadoSincronizacao:
      estado,

    atualizadoEm:
      estado
        ?.finalizado_em ??
      estado
        ?.atualizado_em ??
      null,

    consultaNomesOmieFalhou:
      nomesOmie
        .consulta_omie_falhou,
  };
}