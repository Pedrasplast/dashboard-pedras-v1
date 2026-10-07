import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ITENS_POR_PAGINA_ESTOQUE,
} from "../constants/estoque.constants";


export default function useEstoquePaginacao({
  itens = [],

  localSelecionado,
  pesquisa,
  situacao,
}) {
  const [
    paginaAtual,
    setPaginaAtual,
  ] =
    useState(1);


  /* =======================================================
     TOTAL DE PÁGINAS
  ======================================================= */

  const totalPaginas =
    useMemo(
      () =>
        Math.max(
          1,

          Math.ceil(
            itens.length /
              ITENS_POR_PAGINA_ESTOQUE,
          ),
        ),
      [
        itens.length,
      ],
    );


  /* =======================================================
     RESETAR AO ALTERAR FILTRO
  ======================================================= */

  useEffect(
    () => {
      setPaginaAtual(
        1,
      );
    },
    [
      localSelecionado,
      pesquisa,
      situacao,
    ],
  );


  /* =======================================================
     CORRIGIR PÁGINA INVÁLIDA
  ======================================================= */

  useEffect(
    () => {
      if (
        paginaAtual >
        totalPaginas
      ) {
        setPaginaAtual(
          totalPaginas,
        );
      }
    },
    [
      paginaAtual,
      totalPaginas,
    ],
  );


  /* =======================================================
     ITENS DA PÁGINA
  ======================================================= */

  const itensPagina =
    useMemo(
      () => {
        const inicio =
          (
            paginaAtual -
            1
          ) *
          ITENS_POR_PAGINA_ESTOQUE;


        return itens.slice(
          inicio,

          inicio +
            ITENS_POR_PAGINA_ESTOQUE,
        );
      },
      [
        itens,
        paginaAtual,
      ],
    );


  return {
    paginaAtual,

    totalPaginas,

    itensPagina,

    itensPorPagina:
      ITENS_POR_PAGINA_ESTOQUE,

    setPaginaAtual,
  };
}