import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  buscarComprasFuturas,
  salvarCompraFutura as salvarCompraFuturaService,
} from "./comprasFuturasService";


/* =========================================================
   HOOK
========================================================= */

export default function useComprasFuturas({
  carregar = true,
} = {}) {
  const [
    compras,
    setCompras,
  ] = useState([]);

  const [
    fornecedores,
    setFornecedores,
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

  const carregarCompras =
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
            await buscarComprasFuturas();


          setCompras(
            Array.isArray(
              resultado
                ?.compras,
            )
              ? resultado
                  .compras
              : [],
          );


          setFornecedores(
            Array.isArray(
              resultado
                ?.fornecedores,
            )
              ? resultado
                  .fornecedores
              : [],
          );


          setCarregado(
            true,
          );
        } catch (error) {
          console.error(
            "Erro ao carregar compras futuras:",
            error,
          );


          setCompras(
            [],
          );

          setFornecedores(
            [],
          );

          setErro(
            "Não foi possível carregar as compras futuras.",
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
     AUTO LOAD
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


      void carregarCompras();
    },
    [
      carregar,
      carregado,
      carregando,
      carregarCompras,
    ],
  );


  /* =======================================================
     RECARREGAR
  ======================================================= */

  const recarregar =
    useCallback(
      async () => {
        await carregarCompras();
      },
      [
        carregarCompras,
      ],
    );


  /* =======================================================
     SALVAR
  ======================================================= */

  const salvarCompraFutura =
    useCallback(
      async (
        dados,
      ) => {
        setSalvando(
          true,
        );

        setSalvandoId(
          dados?.id ??
          null,
        );


        try {
          const resultado =
            await salvarCompraFuturaService(
              dados,
            );


          await carregarCompras();


          return resultado;
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
        carregarCompras,
      ],
    );


  /* =======================================================
     ITEM SALVANDO
  ======================================================= */

  const compraEstaSalvando =
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


  return {
    compras,

    fornecedores,

    carregando,

    carregado,

    erro,

    salvando,

    recarregar,

    salvarCompraFutura,

    compraEstaSalvando,
  };
}