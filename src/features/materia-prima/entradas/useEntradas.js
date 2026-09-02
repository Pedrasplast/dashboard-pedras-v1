import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  buscarEntradas,
} from "./entradasService";


/* =========================================================
   HOOK ENTRADAS
========================================================= */

export default function useEntradas() {
  const [
    entradas,
    setEntradas,
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


  const carregarEntradas =
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
            await buscarEntradas();


          setEntradas(
            resultado.entradas ??
              [],
          );

          setFornecedores(
            resultado.fornecedores ??
              [],
          );

          setCarregado(
            true,
          );
        } catch (error) {
          console.error(
            "Erro ao carregar entradas:",
            error,
          );

          setErro(
            "Não foi possível carregar as entradas.",
          );
        } finally {
          setCarregando(
            false,
          );
        }
      },
      [],
    );


  useEffect(
    () => {
      void carregarEntradas();
    },
    [
      carregarEntradas,
    ],
  );


  return {
    entradas,

    fornecedores,

    carregando,

    carregado,

    erro,

    recarregar:
      carregarEntradas,
  };
}