import { useMemo } from "react";

import { valoresUnicosOrdenados } from "@/lib/colecoes";
import { useCargaMaquina } from "@/lib/cargaMaquina";

import {
  calcularVariacaoPercentual,
  consolidarParadas,
  ehRegistroParada,
  filtrarParadas,
  obterPeriodoAnterior,
} from "./dashboardParadas.utils";

/* =========================================================
   FILTROS PADRÃO DO DASHBOARD DE PARADAS
========================================================= */

export const FILTROS_INICIAIS_PARADAS = Object.freeze({
  dataInicio: "",
  dataFim: "",

  injetora: "Todos",

  /*
   * Mantemos estes campos porque o filtro compartilhado
   * do Dashboard espera essas propriedades.
   *
   * Não significa que vamos exibi-los na tela.
   */
  turno: "Todos",
  cod_prod: "Todos",
  mp: "Todos",

  tipo: [],

  motivo: "Todos",
});

/* =========================================================
   NORMALIZAÇÃO DOS FILTROS
========================================================= */

function normalizarFiltros(filtros) {
  const origem =
    filtros &&
    typeof filtros === "object"
      ? filtros
      : {};

  return {
    ...FILTROS_INICIAIS_PARADAS,

    ...origem,

    tipo:
      Array.isArray(origem.tipo)
        ? origem.tipo
            .map((tipo) =>
              String(tipo).trim(),
            )
            .filter(Boolean)
        : [],
  };
}

/* =========================================================
   MOTIVOS DISPONÍVEIS
========================================================= */

function obterMotivosDisponiveis(
  registros,
) {
  if (!Array.isArray(registros)) {
    return [];
  }

  return valoresUnicosOrdenados(
    registros
      .filter(ehRegistroParada)
      .map((registro) => {
        const motivo = String(
          registro?.motivo ?? "",
        ).trim();

        return motivo;
      })
      .filter(Boolean),
  );
}

/* =========================================================
   TIPOS DISPONÍVEIS
========================================================= */

function obterTiposDisponiveis(
  registros,
) {
  if (!Array.isArray(registros)) {
    return [];
  }

  return valoresUnicosOrdenados(
    registros
      .filter(ehRegistroParada)
      .map((registro) =>
        String(
          registro?.tipo ?? "",
        ).trim(),
      )
      .filter(Boolean),
  );
}

/* =========================================================
   HOOK PRINCIPAL
========================================================= */

export default function useDashboardParadas(
  filtros,
) {
  /* =======================================================
     DADOS

     Reutiliza exatamente o mesmo hook usado pelo restante
     do sistema.

     Portanto:
     - não cria nova consulta;
     - reaproveita React Query;
     - reaproveita IndexedDB;
     - reaproveita cache existente.

     Agora também expõe recarregarCompleto para permitir
     uma atualização manual ignorando o cache local.
  ======================================================= */

  const {
    dados: rawDados,
    loading,
    atualizando,
    erro,
    recarregar,
    recarregarCompleto,
  } = useCargaMaquina();

  /* =======================================================
     FILTROS NORMALIZADOS
  ======================================================= */

  const filtrosNormalizados =
    useMemo(
      () =>
        normalizarFiltros(
          filtros,
        ),
      [filtros],
    );

  /* =======================================================
     OPÇÕES DOS FILTROS
  ======================================================= */

  const tiposDisponiveis =
    useMemo(
      () =>
        obterTiposDisponiveis(
          rawDados,
        ),
      [rawDados],
    );

  const motivosDisponiveis =
    useMemo(
      () =>
        obterMotivosDisponiveis(
          rawDados,
        ),
      [rawDados],
    );

  /* =======================================================
     DADOS DO PERÍODO ATUAL
  ======================================================= */

  const dadosFiltrados =
    useMemo(
      () =>
        filtrarParadas(
          rawDados,
          filtrosNormalizados,
        ),
      [
        rawDados,
        filtrosNormalizados,
      ],
    );

  /* =======================================================
     CONSOLIDAÇÃO DO PERÍODO ATUAL
  ======================================================= */

  const atual =
    useMemo(
      () =>
        consolidarParadas(
          dadosFiltrados,
        ),
      [dadosFiltrados],
    );

  /* =======================================================
     PERÍODO ANTERIOR

     Exemplo:

     Atual:
     01/09 até 08/09

     Comparação:
     24/08 até 31/08

     Não usa calendário industrial.
     Apenas compara dois intervalos de mesma duração.
  ======================================================= */

  const periodoAnterior =
    useMemo(
      () =>
        obterPeriodoAnterior(
          filtrosNormalizados,
        ),
      [filtrosNormalizados],
    );

  /* =======================================================
     DADOS DO PERÍODO ANTERIOR
  ======================================================= */

  const dadosPeriodoAnterior =
    useMemo(() => {
      if (!periodoAnterior) {
        return [];
      }

      const filtrosAnteriores = {
        ...filtrosNormalizados,

        dataInicio:
          periodoAnterior.dataInicio,

        dataFim:
          periodoAnterior.dataFim,
      };

      return filtrarParadas(
        rawDados,
        filtrosAnteriores,
      );
    }, [
      rawDados,
      filtrosNormalizados,
      periodoAnterior,
    ]);

  /* =======================================================
     CONSOLIDAÇÃO DO PERÍODO ANTERIOR
  ======================================================= */

  const anterior =
    useMemo(() => {
      if (!periodoAnterior) {
        return null;
      }

      return consolidarParadas(
        dadosPeriodoAnterior,
      );
    }, [
      periodoAnterior,
      dadosPeriodoAnterior,
    ]);

  /* =======================================================
     COMPARATIVOS
  ======================================================= */

  const comparativo =
    useMemo(() => {
      if (!anterior) {
        return null;
      }

      return {
        tempoTotal:
          calcularVariacaoPercentual(
            atual.tempoTotalSegundos,
            anterior.tempoTotalSegundos,
          ),

        totalParadas:
          calcularVariacaoPercentual(
            atual.totalParadas,
            anterior.totalParadas,
          ),

        tempoMedio:
          calcularVariacaoPercentual(
            atual.tempoMedioSegundos,
            anterior.tempoMedioSegundos,
          ),
      };
    }, [
      atual,
      anterior,
    ]);

  /* =======================================================
     RETORNO
  ======================================================= */

  return {
    /* -----------------------------------------------------
       STATUS DA CONSULTA
    ----------------------------------------------------- */

    loading,
    atualizando,
    erro,

    /*
     * Atualização incremental.
     * Continua usando o cache local quando possível.
     */
    recarregar,

    /*
     * Atualização completa.
     * Limpa o IndexedDB da carga_maquina e baixa novamente
     * a base do Supabase, capturando UPDATEs antigos.
     */
    recarregarCompleto,

    /* -----------------------------------------------------
       DADOS BRUTOS
    ----------------------------------------------------- */

    rawDados,

    /* -----------------------------------------------------
       FILTROS
    ----------------------------------------------------- */

    filtrosNormalizados,

    tiposDisponiveis,

    motivosDisponiveis,

    /* -----------------------------------------------------
       REGISTROS FILTRADOS
    ----------------------------------------------------- */

    dadosFiltrados,

    /* -----------------------------------------------------
       INDICADORES
    ----------------------------------------------------- */

    ...atual,

    /* -----------------------------------------------------
       COMPARAÇÃO
    ----------------------------------------------------- */

    comparativoDisponivel:
      Boolean(
        periodoAnterior,
      ),

    periodoAnterior,

    comparativo,

    dadosPeriodoAnterior,
  };
}