import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  buscarComprasFuturas,

  excluirCompraFutura as excluirCompraFuturaService,

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

  const [
    excluindo,
    setExcluindo,
  ] = useState(false);

  const [
    excluindoId,
    setExcluindoId,
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
            error?.message ||
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
     EXCLUIR
  ======================================================= */

  const excluirCompraFutura =
    useCallback(
      async (
        id,
      ) => {
        if (
          id === null ||
          id === undefined
        ) {
          throw new Error(
            "Compra futura não informada.",
          );
        }


        setExcluindo(
          true,
        );

        setExcluindoId(
          id,
        );


        try {
          const resultado =
            await excluirCompraFuturaService(
              id,
            );


          await carregarCompras();


          return resultado;
        } finally {
          setExcluindo(
            false,
          );

          setExcluindoId(
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


  /* =======================================================
     ITEM EXCLUINDO
  ======================================================= */

  const compraEstaExcluindo =
    useCallback(
      (
        id,
      ) => {
        if (!excluindo) {
          return false;
        }


        return (
          String(
            id,
          ) ===
          String(
            excluindoId,
          )
        );
      },
      [
        excluindo,
        excluindoId,
      ],
    );


  return {
    compras,

    fornecedores,

    carregando,

    carregado,

    erro,

    salvando,

    excluindo,

    recarregar,

    salvarCompraFutura,

    excluirCompraFutura,

    compraEstaSalvando,

    compraEstaExcluindo,
  };
}