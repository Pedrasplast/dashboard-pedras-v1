import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  buscarProdutosPP,
  salvarProdutoPP as salvarProdutoPPService,
} from "./produtosPPService";


/* =========================================================
   HOOK PRODUTOS PP
========================================================= */

export default function useProdutosPP() {
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
    salvandoCodigo,
    setSalvandoCodigo,
  ] = useState(null);


  /* =======================================================
     CARREGAR
  ======================================================= */

  const carregarProdutos =
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
            await buscarProdutosPP();


          setProdutos(
            Array.isArray(
              resultado,
            )
              ? resultado
              : [],
          );


          setCarregado(
            true,
          );
        } catch (error) {
          console.error(
            "Erro ao carregar Produtos PP:",
            error,
          );


          setProdutos(
            [],
          );


          setErro(
            "Não foi possível carregar os produtos PP.",
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
     AUTOMÁTICO
  ======================================================= */

  useEffect(
    () => {
      void carregarProdutos();
    },
    [
      carregarProdutos,
    ],
  );


  /* =======================================================
     SALVAR
  ======================================================= */

  const salvarProduto =
    useCallback(
      async (
        dados,
      ) => {
        setSalvando(
          true,
        );

        setSalvandoCodigo(
          dados
            ?.codigoProdutoOriginal ??
          null,
        );


        try {
          const resultado =
            await salvarProdutoPPService(
              dados,
            );


          await carregarProdutos();


          return resultado;
        } catch (error) {
          console.error(
            "Erro ao salvar Produto PP:",
            error,
          );


          throw error;
        } finally {
          setSalvando(
            false,
          );

          setSalvandoCodigo(
            null,
          );
        }
      },
      [
        carregarProdutos,
      ],
    );


  /* =======================================================
     PRODUTO SALVANDO
  ======================================================= */

  const produtoEstaSalvando =
    useCallback(
      (
        codigo,
      ) => {
        if (!salvando) {
          return false;
        }


        if (
          codigo === null ||
          codigo === undefined
        ) {
          return (
            salvandoCodigo ===
            null
          );
        }


        return (
          String(
            codigo,
          ) ===
          String(
            salvandoCodigo,
          )
        );
      },
      [
        salvando,
        salvandoCodigo,
      ],
    );


  /* =======================================================
     RETORNO
  ======================================================= */

  return {
    produtos,

    carregando,

    carregado,

    erro,

    salvando,

    recarregar:
      carregarProdutos,

    salvarProduto,

    produtoEstaSalvando,
  };
}