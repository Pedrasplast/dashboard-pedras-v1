import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  buscarVisaoGeral,
} from "./visaoGeralService";


/* =========================================================
   HOOK VISÃO GERAL
========================================================= */

export default function useVisaoGeral() {
  const [
    dados,
    setDados,
  ] = useState({
    hoje: null,

    dataFim: null,

    saldoHojeKg: 0,

    consumoHojeKg: 0,

    saldoFimPeriodoKg: 0,

    consumoPeriodoKg: 0,

    recebidoPeriodoKg: 0,

    comprasAbertasQuantidade: 0,

    comprasAbertasKg: 0,

    fornecedoresEmRiscoQuantidade: 0,

    primeiraRupturaData: null,

    primeiraRupturaFornecedor: null,

    resumoFornecedores: [],

    fornecedoresSemSaldo: [],

    programacoesSemReceita: [],
  });

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


  /* =======================================================
     CARREGAR
  ======================================================= */

  const carregar =
    useCallback(
      async () => {
        setCarregando(true);

        setErro("");


        try {
          const resultado =
            await buscarVisaoGeral();


          setDados(
            resultado,
          );

          setCarregado(true);
        } catch (error) {
          console.error(
            "Erro ao carregar visão geral da matéria-prima:",
            error,
          );


          setErro(
            error?.message ||
              "Não foi possível carregar a visão geral.",
          );

          setCarregado(true);
        } finally {
          setCarregando(false);
        }
      },
      [],
    );


  /* =======================================================
     AUTOMÁTICO
  ======================================================= */

  useEffect(
    () => {
      void carregar();
    },
    [
      carregar,
    ],
  );


  return {
    ...dados,

    carregando,

    carregado,

    erro,

    recarregar:
      carregar,
  };
}