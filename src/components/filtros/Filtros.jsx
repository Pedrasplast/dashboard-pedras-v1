import {
  useCallback,
  useMemo,
} from "react";

import "./Filtros.css";


/* =========================================================
   COMPARAÇÃO DE VALORES
========================================================= */

function valoresIguais(valorAtual, valorPadrao) {
  if (
    Array.isArray(valorAtual) ||
    Array.isArray(valorPadrao)
  ) {
    const atual =
      Array.isArray(valorAtual)
        ? valorAtual
        : [];

    const padrao =
      Array.isArray(valorPadrao)
        ? valorPadrao
        : [];

    if (
      atual.length !==
      padrao.length
    ) {
      return false;
    }

    return atual.every(
      (valor, indice) =>
        valor ===
        padrao[indice],
    );
  }

  return valorAtual === valorPadrao;
}


/* =========================================================
   VERIFICA SE EXISTEM FILTROS ATIVOS
========================================================= */

export function possuiFiltrosAtivos(
  filtros = {},
  valoresPadrao = {},
) {
  return Object.entries(
    valoresPadrao,
  ).some(
    ([campo, valorPadrao]) => {
      /*
       * Se a tela não utiliza determinado campo,
       * ele pode não existir no estado. Nesse caso
       * não deve ser considerado um filtro ativo.
       */
      if (
        !Object.prototype.hasOwnProperty.call(
          filtros,
          campo,
        )
      ) {
        return false;
      }

      return !valoresIguais(
        filtros?.[campo],
        valorPadrao,
      );
    },
  );
}


/* =========================================================
   COMPONENTE COMPARTILHADO DE FILTROS
========================================================= */

export default function Filtros({
  filtros = {},
  setFiltros,
  valoresPadrao = {},

  as: Componente = "div",
  className =
    "filtros-compartilhados",

  children,

  onDepoisAlterar,
  onDepoisLimpar,

  mostrarBotaoLimpar = false,
  textoLimpar = "Limpar filtros",
  classNameBotaoLimpar =
    "filtros-compartilhados-limpar",
  iconeLimpar = null,

  renderBotaoLimpar,
}) {
  const possuiFiltroAtivo =
    useMemo(
      () =>
        possuiFiltrosAtivos(
          filtros,
          valoresPadrao,
        ),
      [
        filtros,
        valoresPadrao,
      ],
    );


  /* =====================================================
     ALTERAR UM CAMPO
  ===================================================== */

  const alterar =
    useCallback(
      (
        campo,
        valor,
        ajustesAdicionais = {},
      ) => {
        if (
          typeof setFiltros !==
          "function"
        ) {
          return;
        }

        setFiltros(
          (anteriores) => ({
            ...anteriores,

            [campo]: valor,

            ...ajustesAdicionais,
          }),
        );

        if (
          typeof onDepoisAlterar ===
          "function"
        ) {
          onDepoisAlterar(
            campo,
            valor,
          );
        }
      },
      [setFiltros, onDepoisAlterar],
    );


  /* =====================================================
     LIMPAR TODOS OS CAMPOS CONFIGURADOS
  ===================================================== */

  const limpar =
    useCallback(() => {
      if (
        typeof setFiltros ===
        "function"
      ) {
        setFiltros(
          (anteriores) => ({
            ...anteriores,

            ...valoresPadrao,
          }),
        );
      }

      if (
        typeof onDepoisLimpar ===
        "function"
      ) {
        onDepoisLimpar();
      }
    }, [
      setFiltros,
      valoresPadrao,
      onDepoisLimpar,
    ]);


  const apiFiltros =
    useMemo(
      () => ({
        alterar,
        limpar,
        possuiFiltroAtivo,
      }),
      [alterar, limpar, possuiFiltroAtivo],
    );


  const conteudo =
    typeof children ===
    "function"
      ? children(
          apiFiltros,
        )
      : children;


  return (
    <Componente className={className}>

      {conteudo}


      {mostrarBotaoLimpar &&
        possuiFiltroAtivo &&
        (
          typeof renderBotaoLimpar ===
          "function"
            ? renderBotaoLimpar(
                apiFiltros,
              )
            : (
              <button
                type="button"
                className={
                  classNameBotaoLimpar
                }
                onClick={limpar}
                title="Limpar todos os filtros"
              >
                {iconeLimpar}

                {textoLimpar}
              </button>
            )
        )}

    </Componente>
  );
}
