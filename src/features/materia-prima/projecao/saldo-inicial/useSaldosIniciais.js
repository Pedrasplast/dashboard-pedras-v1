import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  buscarSaldosIniciais,
  salvarSaldoInicial as salvarSaldoInicialService,
} from "./saldoInicialService";


const EVENTO_ATUALIZAR_PROJECAO =
  "materia-prima-projecao-atualizar";


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
    materiais,
    setMateriais,
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


          setMateriais(
            Array.isArray(
              resultado?.materiais,
            )
              ? resultado.materiais
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

          setMateriais([]);

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


          /*
           * Saldos-base e projeção ficam na mesma tela, mas
           * usam hooks independentes. Após salvar o saldo,
           * avisamos a projeção para recalcular imediatamente.
           */
          window.dispatchEvent(
            new CustomEvent(
              EVENTO_ATUALIZAR_PROJECAO,
              {
                detail: {
                  origem: "saldo-inicial",
                  saldoId:
                    resultado?.id ??
                    dados?.id ??
                    null,
                },
              },
            ),
          );


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

    materiais,

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