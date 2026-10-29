import { useEffect, useState } from "react";

import { listarCalendarioIndustrial } from "@/features/calendario-industrial/calendarioIndustrialService";

import { listarPeriodosProgramacao } from "../programacaoCalendarioService";

/**
 * Calendário industrial do período da grade e os períodos de trabalho
 * configurados. Recarrega quando o modal abre ou a grade muda de mês;
 * resposta de uma grade antiga é descartada.
 */
export function useCalendarioProgramacao({ aberto, inicio, fim, onErro }) {
  const [calendario, setCalendario] = useState([]);

  const [periodos, setPeriodos] = useState([]);

  const [carregandoCalendario, setCarregandoCalendario] = useState(false);

  useEffect(() => {
    if (!aberto || !inicio || !fim) {
      return;
    }

    let cancelado = false;

    async function carregar() {
      setCarregandoCalendario(true);

      try {
        const [dias, periodosConfigurados] = await Promise.all([
          listarCalendarioIndustrial({
            dataInicio: inicio,

            dataFim: fim,
          }),

          listarPeriodosProgramacao(),
        ]);

        if (cancelado) {
          return;
        }

        setCalendario(dias);

        setPeriodos(periodosConfigurados);
      } catch (error) {
        if (!cancelado) {
          onErro(error?.message || "Não foi possível carregar o calendário de programação.");
        }
      } finally {
        if (!cancelado) {
          setCarregandoCalendario(false);
        }
      }
    }

    void carregar();

    return () => {
      cancelado = true;
    };
  }, [aberto, inicio, fim, onErro]);

  return { calendario, periodos, carregandoCalendario };
}
