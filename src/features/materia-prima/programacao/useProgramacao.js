import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  buscarProgramacao,
  salvarProgramacao as salvarProgramacaoService,
} from "./programacaoService";


/* =========================================================
   HOOK PROGRAMAÇÃO
========================================================= */

export default function useProgramacao({
  carregar = true,
} = {}) {
  const [
    programacao,
    setProgramacao,
  ] = useState([]);

  const [
    produtos,
    setProdutos,
  ] = useState([]);

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [
    carregado,
    setCarregado,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    salvandoId,
    setSalvandoId,
  ] = useState(null);


  /* =======================================================
     CARREGAR
  ======================================================= */

  const carregarProgramacao =
    useCallback(
      async () => {
        setCarregando(
          true,
        );

        setErro(
          "",
        );


        try {
          const resultado =
            await buscarProgramacao();


          setProgramacao(
            Array.isArray(
              resultado
                ?.programacao,
            )
              ? resultado
                  .programacao
              : [],
          );


          setProdutos(
            Array.isArray(
              resultado
                ?.produtos,
            )
              ? resultado
                  .produtos
              : [],
          );


          setCarregado(
            true,
          );
        } catch (error) {
          console.error(
            "Erro ao carregar programação de matéria-prima:",
            error,
          );


          setProgramacao(
            [],
          );

          setProdutos(
            [],
          );

          setErro(
            "Não foi possível carregar a programação de matéria-prima.",
          );

          setCarregado(
            true,
          );
        } finally {
          setCarregando(
            false,
          );
        }
      },
      [],
    );


  /* =======================================================
     CARREGAMENTO AUTOMÁTICO
  ======================================================= */

  useEffect(
    () => {
      if (
        !carregar ||
        carregado ||
        carregando
      ) {
        return;
      }


      void carregarProgramacao();
    },
    [
      carregar,
      carregado,
      carregando,
      carregarProgramacao,
    ],
  );


  /* =======================================================
     RECARREGAR
  ======================================================= */

  const recarregar =
    useCallback(
      async () => {
        await carregarProgramacao();
      },
      [
        carregarProgramacao,
      ],
    );


  /* =======================================================
     SALVAR
  ======================================================= */

  const salvarProgramacao =
    useCallback(
      async (
        dados,
      ) => {
        const id =
          dados
            ?.id ??
          null;


        setSalvando(
          true,
        );

        setSalvandoId(
          id,
        );


        try {
          const resultado =
            await salvarProgramacaoService(
              dados,
            );


          /*
           * Recarregamos porque o consumo
           * depende também do peso e da
           * receita atual do produto.
           */
          await carregarProgramacao();


          return resultado;
        } catch (error) {
          console.error(
            "Erro ao salvar programação:",
            error,
          );


          throw error;
        } finally {
          setSalvando(
            false,
          );

          setSalvandoId(
            null,
          );
        }
      },
      [
        carregarProgramacao,
      ],
    );


  /* =======================================================
     ITEM ESTÁ SALVANDO?
  ======================================================= */

  const itemEstaSalvando =
    useCallback(
      (
        id,
      ) => {
        if (!salvando) {
          return false;
        }


        if (
          id === null ||
          id === undefined
        ) {
          return (
            salvandoId ===
            null
          );
        }


        return (
          String(
            id,
          ) ===
          String(
            salvandoId,
          )
        );
      },
      [
        salvando,
        salvandoId,
      ],
    );


  /* =======================================================
     RETORNO
  ======================================================= */

  return {
    programacao,

    produtos,

    carregando,

    carregado,

    erro,

    salvando,

    salvandoId,

    recarregar,

    salvarProgramacao,

    itemEstaSalvando,
  };
}