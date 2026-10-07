import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CODIGO_LOCAL_ESTOQUE_MATRIZ,
  LOCAL_TODOS,
  SITUACAO_ESTOQUE,
} from "../constants/estoque.constants";


/* =========================================================
   DESCOBRIR LOCAL PADRÃO
========================================================= */

function obterCodigoLocalPadrao(
  locais,
) {
  if (
    !Array.isArray(
      locais,
    ) ||
    locais.length === 0
  ) {
    return "";
  }


  /* =======================================================
     1. LOCAL MARCADO COMO PADRÃO
  ======================================================= */

  const localPadrao =
    locais.find(
      (local) =>
        local.padrao,
    );


  if (
    localPadrao
      ?.codigoLocalEstoque
  ) {
    return String(
      localPadrao
        .codigoLocalEstoque,
    );
  }


  /* =======================================================
     2. MATRIZ CONFIGURADA
  ======================================================= */

  const matriz =
    locais.find(
      (local) =>
        String(
          local.codigoLocalEstoque,
        ) ===
        CODIGO_LOCAL_ESTOQUE_MATRIZ,
    );


  if (
    matriz
      ?.codigoLocalEstoque
  ) {
    return String(
      matriz
        .codigoLocalEstoque,
    );
  }


  /* =======================================================
     3. PRIMEIRO LOCAL DISPONÍVEL
  ======================================================= */

  if (
    locais[0]
      ?.codigoLocalEstoque
  ) {
    return String(
      locais[0]
        .codigoLocalEstoque,
    );
  }


  /* =======================================================
     4. TODOS
  ======================================================= */

  return LOCAL_TODOS;
}


/* =========================================================
   HOOK
========================================================= */

export default function useEstoqueFiltros({
  locais = [],
}) {
  const [
    localSelecionado,
    setLocalSelecionado,
  ] =
    useState("");


  const [
    pesquisa,
    setPesquisa,
  ] =
    useState("");


  const [
    situacao,
    setSituacao,
  ] =
    useState(
      SITUACAO_ESTOQUE
        .TODOS,
    );


  /* =======================================================
     LOCAL PADRÃO
  ======================================================= */

  const codigoLocalPadrao =
    useMemo(
      () =>
        obterCodigoLocalPadrao(
          locais,
        ),
      [
        locais,
      ],
    );


  /* =======================================================
     DEFINIR LOCAL INICIAL
  ======================================================= */

  useEffect(
    () => {
      if (
        localSelecionado ||
        !codigoLocalPadrao
      ) {
        return;
      }


      setLocalSelecionado(
        codigoLocalPadrao,
      );
    },
    [
      codigoLocalPadrao,
      localSelecionado,
    ],
  );


  /* =======================================================
     VERIFICAR FILTROS ATIVOS

     IMPORTANTE:
     local padrão NÃO conta como filtro.
  ======================================================= */

  const possuiFiltrosAtivos =
    useMemo(
      () => {
        const localAlterado =
          Boolean(
            localSelecionado,
          ) &&
          Boolean(
            codigoLocalPadrao,
          ) &&
          localSelecionado !==
            codigoLocalPadrao;


        const pesquisaAtiva =
          Boolean(
            pesquisa.trim(),
          );


        const situacaoAlterada =
          situacao !==
          SITUACAO_ESTOQUE
            .TODOS;


        return (
          localAlterado ||
          pesquisaAtiva ||
          situacaoAlterada
        );
      },
      [
        localSelecionado,
        codigoLocalPadrao,
        pesquisa,
        situacao,
      ],
    );


  /* =======================================================
     LIMPAR FILTROS
  ======================================================= */

  function limparFiltros() {
    if (
      !possuiFiltrosAtivos
    ) {
      return;
    }


    setLocalSelecionado(
      codigoLocalPadrao ||
        LOCAL_TODOS,
    );


    setPesquisa(
      "",
    );


    setSituacao(
      SITUACAO_ESTOQUE
        .TODOS,
    );
  }


  /* =======================================================
     RETORNO
  ======================================================= */

  return {
    localSelecionado,

    pesquisa,

    situacao,

    codigoLocalPadrao,

    possuiFiltrosAtivos,

    setLocalSelecionado,

    setPesquisa,

    setSituacao,

    limparFiltros,
  };
}