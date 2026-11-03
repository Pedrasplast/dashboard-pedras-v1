import { useCallback, useEffect, useRef, useState } from "react";

import { buscarProjecao } from "./projecao.service";

const EVENTO_ATUALIZAR_PROJECAO = "materia-prima-projecao-atualizar";

/* =========================================================
   HOOK PROJEÇÃO
========================================================= */

export default function useProjecao({ dataInicio, dataFim, materialId = "1" }) {
  const [dados, setDados] = useState({
    linhas: [],
    materiais: [],
    fornecedores: [],
    fornecedoresSemSaldo: [],
    programacoesSemReceita: [],
    consumoProgramadoDisponivel: true,
  });

  const [carregando, setCarregando] = useState(false);

  const [carregado, setCarregado] = useState(false);

  const [erro, setErro] = useState("");

  // Número da última consulta: se o filtro mudar antes de a resposta
  // anterior chegar, a resposta antiga é descartada.
  const ultimaConsultaRef = useRef(0);

  /* =======================================================
     CARREGAR
  ======================================================= */

  const carregar = useCallback(async () => {
    if (!dataInicio || !dataFim || !materialId) {
      return;
    }

    const consulta = ++ultimaConsultaRef.current;
    const ehAtual = () => consulta === ultimaConsultaRef.current;

    setCarregando(true);

    setErro("");

    try {
      const resultado = await buscarProjecao({
        dataInicio,
        dataFim,
        materialId,
      });

      if (!ehAtual()) {
        return;
      }

      setDados(resultado);

      setCarregado(true);
    } catch (error) {
      if (!ehAtual()) {
        return;
      }

      console.error("Erro ao calcular projeção de matéria-prima:", error);

      setErro(error?.message || "Não foi possível calcular a projeção.");

      setCarregado(true);
    } finally {
      if (ehAtual()) {
        setCarregando(false);
      }
    }
  }, [dataInicio, dataFim, materialId]);

  /* =======================================================
     AUTOMÁTICO
  ======================================================= */

  useEffect(() => {
    void carregar();
  }, [carregar]);

  /* =======================================================
     ATUALIZAÇÃO CRUZADA

     Quando o saldo-base é salvo no bloco acima, esse evento
     faz a projeção recalcular imediatamente sem depender de
     troca de filtro, recarregamento da página ou botão.
  ======================================================= */

  useEffect(() => {
    function atualizarProjecao() {
      void carregar();
    }

    window.addEventListener(EVENTO_ATUALIZAR_PROJECAO, atualizarProjecao);

    return () => {
      window.removeEventListener(EVENTO_ATUALIZAR_PROJECAO, atualizarProjecao);
    };
  }, [carregar]);

  return {
    ...dados,

    carregando,

    carregado,

    erro,

    recarregar: carregar,
  };
}
