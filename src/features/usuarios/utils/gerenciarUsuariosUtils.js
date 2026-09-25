import {
  CHAVE_TELA_USUARIOS,
} from "../constants/gerenciarUsuariosConfig.js";


export function emailValido(
  email,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(
      email || "",
    ).trim(),
  );
}


export function criarMapaPermissoes(
  registros = [],
  campoItemId,
) {
  const mapa =
    {};

  for (
    const registro of
    registros
  ) {
    const usuarioId =
      registro?.usuario_id;

    const itemId =
      registro?.[
        campoItemId
      ];

    if (
      !usuarioId ||
      itemId === null ||
      itemId === undefined
    ) {
      continue;
    }

    if (
      !mapa[
        usuarioId
      ]
    ) {
      mapa[
        usuarioId
      ] = {};
    }

    mapa[
      usuarioId
    ][
      String(
        itemId,
      )
    ] =
      Boolean(
        registro.permitido,
      );
  }

  return mapa;
}


export function criarMapaSelecao(
  itens = [],
  permissoesAtuais = {},
) {
  return itens.reduce(
    (
      mapa,
      item,
    ) => {

      mapa[
        String(
          item.id,
        )
      ] =
        Boolean(
          permissoesAtuais[
            String(
              item.id,
            )
          ],
        );

      return mapa;
    },
    {},
  );
}


export function obterTelasGerenciaveis(
  telas = [],
) {
  return telas.filter(
    (
      tela,
    ) =>
      tela.chave !==
      CHAVE_TELA_USUARIOS,
  );
}


export function agruparTelasPorModulo(
  telas = [],
  modulos = [],
) {
  const mapaPorChave =
    new Map(
      telas.map(
        (
          tela,
        ) => [
          tela.chave,
          tela,
        ],
      ),
    );

  return modulos
    .map(
      (
        modulo,
      ) => ({
        ...modulo,

        telas:
          modulo.chaves
            .map(
              (
                chave,
              ) =>
                mapaPorChave.get(
                  chave,
                ),
            )
            .filter(
              Boolean,
            ),
      }),
    )
    .filter(
      (
        modulo,
      ) =>
        modulo.telas.length >
        0,
    );
}


export function agruparRelatoriosPorCategoria(
  relatorios = [],
) {
  return relatorios.reduce(
    (
      grupos,
      relatorio,
    ) => {

      const categoria =
        relatorio.categoria ||
        "Outros";

      if (
        !grupos[
          categoria
        ]
      ) {
        grupos[
          categoria
        ] = [];
      }

      grupos[
        categoria
      ].push(
        relatorio,
      );

      return grupos;
    },
    {},
  );
}


export function obterStatusModulo(
  modulo,
  permissoes = {},
) {
  const total =
    modulo?.telas?.length ||
    0;

  const permitidas =
    (
      modulo?.telas ||
      []
    ).filter(
      (
        tela,
      ) =>
        Boolean(
          permissoes[
            String(
              tela.id,
            )
          ],
        ),
    ).length;

  return {
    total,
    permitidas,

    completo:
      total > 0 &&
      permitidas === total,

    parcial:
      permitidas > 0 &&
      permitidas < total,
  };
}


export function contarPermissoesUsuario({
  usuarioId,
  permissoesPorUsuario,
  telasGerenciaveis,
}) {
  const permissoes =
    permissoesPorUsuario?.[
      usuarioId
    ] || {};

  return telasGerenciaveis.filter(
    (
      tela,
    ) =>
      permissoes[
        String(
          tela.id,
        )
      ] === true,
  ).length;
}


export function contarSelecionados(
  itens = [],
  mapa = {},
) {
  return itens.filter(
    (
      item,
    ) =>
      Boolean(
        mapa[
          String(
            item.id,
          )
        ],
      ),
  ).length;
}