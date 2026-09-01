import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  buscarSaldosIniciais,
  salvarSaldoInicial as salvarSaldoInicialService,
} from "./saldoInicialService";


/* =========================================================
   HOOK
========================================================= */

export default function useSaldosIniciais() {
  const [
    saldos,
    setSaldos,
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

  const carregarSaldos =
    useCallback(
      async () => {
        setCarregando(true);

        setErro("");


        try {
          const resultado =
            await buscarSaldosIniciais();


          setSaldos(
            Array.isArray(
              resultado?.saldos,
            )
              ? resultado.saldos
              : [],
          );


          setFornecedores(
            Array.isArray(
              resultado?.fornecedores,
            )
              ? resultado.fornecedores
              : [],
          );


          setCarregado(true);
        } catch (error) {
          console.error(
            "Erro ao carregar saldos iniciais:",
            error,
          );


          setSaldos([]);

          setFornecedores([]);

          setErro(
            "Não foi possível carregar os saldos iniciais.",
          );

          setCarregado(true);
        } finally {
          setCarregando(false);
        }
      },
      [],
    );


  /* =======================================================
     CARREGAMENTO AUTOMÁTICO
  ======================================================= */

  useEffect(
    () => {
      void carregarSaldos();
    },
    [
      carregarSaldos,
    ],
  );


  /* =======================================================
     SALVAR
  ======================================================= */

  const salvarSaldoInicial =
    useCallback(
      async (
        dados,
      ) => {
        setSalvando(true);

        setSalvandoId(
          dados?.id ??
          null,
        );


        try {
          const resultado =
            await salvarSaldoInicialService(
              dados,
            );


          await carregarSaldos();


          return resultado;
        } catch (error) {
          console.error(
            "Erro ao salvar saldo inicial:",
            error,
          );


          throw error;
        } finally {
          setSalvando(false);

          setSalvandoId(null);
        }
      },
      [
        carregarSaldos,
      ],
    );


  /* =======================================================
     ITEM SALVANDO
  ======================================================= */

  const saldoEstaSalvando =
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
          String(id) ===
          String(salvandoId)
        );
      },
      [
        salvando,
        salvandoId,
      ],
    );


  return {
    saldos,

    fornecedores,

    carregando,

    carregado,

    erro,

    salvando,

    recarregar:
      carregarSaldos,

    salvarSaldoInicial,

    saldoEstaSalvando,
  };
}