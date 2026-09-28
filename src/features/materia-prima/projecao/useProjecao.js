import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  buscarProjecao,
} from "./projecaoService";


/* =========================================================
   HOOK PROJEÇÃO
========================================================= */

export default function useProjecao({
  dataInicio,
  dataFim,
  materialId = "1",
}) {
  const [
    dados,
    setDados,
  ] = useState({
    linhas: [],
    materiais: [],
    fornecedores: [],
    fornecedoresSemSaldo: [],
    programacoesSemReceita: [],
    consumoProgramadoDisponivel: true,
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
        if (
          !dataInicio ||
          !dataFim ||
          !materialId
        ) {
          return;
        }


        setCarregando(true);

        setErro("");


        try {
          const resultado =
            await buscarProjecao({
              dataInicio,
              dataFim,
              materialId,
            });


          setDados(
            resultado,
          );

          setCarregado(true);
        } catch (error) {
          console.error(
            "Erro ao calcular projeção de matéria-prima:",
            error,
          );


          setErro(
            error?.message ||
              "Não foi possível calcular a projeção.",
          );

          setCarregado(true);
        } finally {
          setCarregando(false);
        }
      },
      [
        dataInicio,
        dataFim,
        materialId,
      ],
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
