import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FILTROS_INICIAIS,
  PERIODO_EMISSAO,
  PERIODO_RECEBIDO,
  descreverPeriodo,
  extrairOpcoes,
  extrairTipos,
  filtrarEntradas,
} from "../utils/entradasUtils";


const STORAGE_KEY =
  "materia-prima-entradas-filtros";


/* =========================================================
   CARREGAR FILTROS SALVOS
========================================================= */

function carregarFiltrosSalvos() {
  if (typeof window === "undefined") {
    return FILTROS_INICIAIS;
  }

  try {
    const salvo =
      window.sessionStorage.getItem(
        STORAGE_KEY,
      );

    if (!salvo) {
      return FILTROS_INICIAIS;
    }

    const filtros =
      JSON.parse(
        salvo,
      );

    const periodoValido =
      filtros?.periodoPor === PERIODO_RECEBIDO ||
      filtros?.periodoPor === PERIODO_EMISSAO;

    return {
      ...FILTROS_INICIAIS,

      fornecedor:
        typeof filtros?.fornecedor === "string"
          ? filtros.fornecedor
          : FILTROS_INICIAIS.fornecedor,

      material:
        typeof filtros?.material === "string"
          ? filtros.material
          : FILTROS_INICIAIS.material,

      tipo:
        typeof filtros?.tipo === "string"
          ? filtros.tipo
          : FILTROS_INICIAIS.tipo,

      periodoPor:
        periodoValido
          ? filtros.periodoPor
          : FILTROS_INICIAIS.periodoPor,

      dataDe:
        typeof filtros?.dataDe === "string"
          ? filtros.dataDe
          : "",

      dataAte:
        typeof filtros?.dataAte === "string"
          ? filtros.dataAte
          : "",
    };
  } catch (error) {
    console.warn(
      "Não foi possível recuperar os filtros de Entradas:",
      error,
    );

    return FILTROS_INICIAIS;
  }
}


/* =========================================================
   HOOK
========================================================= */

export default function useFiltrosEntradas(
  entradas,
) {
  const [
    filtros,
    setFiltros,
  ] = useState(
    carregarFiltrosSalvos,
  );


  /* =======================================================
     PERSISTIR FILTROS
  ======================================================= */

  useEffect(
    () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      try {
        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            filtros,
          ),
        );
      } catch (error) {
        console.warn(
          "Não foi possível salvar os filtros de Entradas:",
          error,
        );
      }
    },
    [
      filtros,
    ],
  );


  /* =======================================================
     ALTERAR FILTRO
  ======================================================= */

  function alterarFiltro(
    campo,
    valor,
  ) {
    setFiltros(
      (
        atuais,
      ) => ({
        ...atuais,
        [campo]:
          valor,
      }),
    );
  }


  /* =======================================================
     LIMPAR FILTROS
  ======================================================= */

  function limparFiltros() {
    setFiltros({
      ...FILTROS_INICIAIS,
    });
  }


  /* =======================================================
     FILTRO ATIVO
  ======================================================= */

  const possuiFiltroAtivo =
    Object.keys(
      FILTROS_INICIAIS,
    ).some(
      (
        campo,
      ) =>
        filtros[campo] !==
        FILTROS_INICIAIS[campo],
    );


  /* =======================================================
     OPÇÕES
  ======================================================= */

  const opcoes =
    useMemo(
      () => ({
        fornecedores:
          extrairOpcoes(
            entradas,
            "fornecedorId",
            "fornecedorNome",
            "Fornecedor não encontrado",
          ),

        materiais:
          extrairOpcoes(
            entradas,
            "materialId",
            "materialNome",
            "Material não encontrado",
          ),

        tipos:
          extrairTipos(
            entradas,
          ),
      }),
      [
        entradas,
      ],
    );


  /* =======================================================
     DESCRIÇÃO DO PERÍODO
  ======================================================= */

  const descricaoPeriodo =
    useMemo(
      () =>
        descreverPeriodo(
          filtros,
        ),
      [
        filtros,
      ],
    );


  /* =======================================================
     ENTRADAS FILTRADAS
  ======================================================= */

  const filtradas =
    useMemo(
      () =>
        filtrarEntradas(
          entradas,
          filtros,
        ),
      [
        entradas,
        filtros,
      ],
    );


  return {
    filtros,

    alterarFiltro,

    limparFiltros,

    possuiFiltroAtivo,

    opcoes,

    descricaoPeriodo,

    filtradas,
  };
}