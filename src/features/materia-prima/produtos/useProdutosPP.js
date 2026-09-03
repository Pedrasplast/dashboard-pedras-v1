import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  buscarProdutosPP,

  excluirProdutoPP as excluirProdutoPPService,

  salvarProdutoPP,
} from "./produtosPPService";


export default function useProdutosPP({
  carregar = true,
} = {}) {
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

  const [
    excluindo,
    setExcluindo,
  ] = useState(false);

  const [
    excluindoCodigo,
    setExcluindoCodigo,
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
            error
              ?.message ||
            "Não foi possível carregar os Produtos PP.",
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


      void carregarProdutos();
    },
    [
      carregar,
      carregado,
      carregando,
      carregarProdutos,
    ],
  );


  /* =======================================================
     RECARREGAR
  ======================================================= */

  const recarregar =
    useCallback(
      async () => {
        await carregarProdutos();
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
        const codigo =
          dados
            ?.codigoProdutoOriginal ??
          dados
            ?.codigoProduto ??
          null;


        setSalvando(
          true,
        );

        setSalvandoCodigo(
          codigo,
        );


        try {
          const resultado =
            await salvarProdutoPP(
              dados,
            );


          await carregarProdutos();


          return resultado;
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
     EXCLUIR
  ======================================================= */

  const excluirProduto =
    useCallback(
      async (
        codigoProduto,
      ) => {
        setExcluindo(
          true,
        );

        setExcluindoCodigo(
          codigoProduto,
        );


        try {
          const resultado =
            await excluirProdutoPPService(
              codigoProduto,
            );


          await carregarProdutos();


          return resultado;
        } finally {
          setExcluindo(
            false,
          );

          setExcluindoCodigo(
            null,
          );
        }
      },
      [
        carregarProdutos,
      ],
    );


  /* =======================================================
     ESTADOS POR ITEM
  ======================================================= */

  const produtoEstaSalvando =
    useCallback(
      (
        codigo,
      ) =>
        salvando &&
        String(
          codigo ?? "",
        ) ===
          String(
            salvandoCodigo ?? "",
          ),
      [
        salvando,
        salvandoCodigo,
      ],
    );


  const produtoEstaExcluindo =
    useCallback(
      (
        codigo,
      ) =>
        excluindo &&
        String(
          codigo ?? "",
        ) ===
          String(
            excluindoCodigo ?? "",
          ),
      [
        excluindo,
        excluindoCodigo,
      ],
    );


  return {
    produtos,

    carregando,

    carregado,

    erro,

    salvando,

    excluindo,

    recarregar,

    salvarProduto,

    excluirProduto,

    produtoEstaSalvando,

    produtoEstaExcluindo,
  };
}