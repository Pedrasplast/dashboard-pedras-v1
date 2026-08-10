import React, { useMemo, useState } from "react";

import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

import { useCargaMaquina } from "@/lib/cargaMaquina";

import FiltrosDashboard from "./FiltrosDashboard";
import Sidebar from "@/components/layout/Sidebar";

import {
  CheckCircle2,
  XCircle,
  Clock,
  PauseCircle,
  Calculator,
  Target,
} from "lucide-react";

import "./Dashboard.css";


/* ============================================================
   DATA DO REGISTRO
============================================================ */

/*
 * Extrai a data no formato YYYY-MM-DD.
 *
 * Prioriza lista_de_data porque ela já representa
 * diretamente o dia do registro no banco.
 */
const extrairDataISORegistro = (registro) => {
  const valorData =
    registro?.lista_de_data ||
    registro?.inicio ||
    registro?.inicio_dia ||
    registro?.data ||
    null;

  if (!valorData) {
    return null;
  }

  const textoData = String(valorData).trim();

  const correspondencia = textoData.match(
    /^(\d{4})-(\d{2})-(\d{2})/,
  );

  if (correspondencia) {
    return [
      correspondencia[1],
      correspondencia[2],
      correspondencia[3],
    ].join("-");
  }

  const data = new Date(valorData);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  const ano = data.getFullYear();

  const mes = String(
    data.getMonth() + 1,
  ).padStart(2, "0");

  const dia = String(
    data.getDate(),
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
};


/* ============================================================
   HORÁRIO DO REGISTRO
============================================================ */

/*
 * Extrai o horário do registro
 * e converte para minutos desde 00:00.
 *
 * Exemplos:
 *
 * 05:00 = 300
 * 14:30 = 870
 * 23:45 = 1425
 *
 * Aceita:
 *
 * 2026-08-10T14:30:00
 * 2026-08-10 14:30:00
 * 14:30:00
 * 14:30
 */
const extrairHorarioMinutosRegistro = (registro) => {
  const valoresPossiveis = [
    registro?.inicio,
    registro?.hora_inicio,
    registro?.horario_inicio,
    registro?.inicio_dia,
    registro?.hora,
  ];

  for (const valor of valoresPossiveis) {
    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      continue;
    }

    /*
     * Caso já venha como Date.
     */
    if (valor instanceof Date) {
      if (!Number.isNaN(valor.getTime())) {
        return (
          valor.getHours() * 60 +
          valor.getMinutes()
        );
      }

      continue;
    }

    const texto = String(valor).trim();

    if (!texto) {
      continue;
    }

    const correspondencia = texto.match(
      /(?:T|\s|^)(\d{1,2}):(\d{2})(?::\d{2})?/,
    );

    if (!correspondencia) {
      continue;
    }

    const hora = Number(
      correspondencia[1],
    );

    const minuto = Number(
      correspondencia[2],
    );

    if (
      !Number.isFinite(hora) ||
      !Number.isFinite(minuto) ||
      hora < 0 ||
      hora > 23 ||
      minuto < 0 ||
      minuto > 59
    ) {
      continue;
    }

    return (
      hora * 60 +
      minuto
    );
  }

  return null;
};


/* ============================================================
   IDENTIFICAÇÃO DO TURNO
============================================================ */

/*
 * HORÁRIOS INFORMADOS:
 *
 * TURNO I
 * 05:00 às 11:00
 * 12:00 às 14:48
 *
 * TURNO II
 * 14:30 às 19:00
 * 20:00 às 23:55
 *
 * TURNO III
 * 23:45 às 05:10
 *
 *
 * EXISTEM SOBREPOSIÇÕES:
 *
 * 14:30 até 14:48
 * TURNO I / TURNO II
 *
 * 23:45 até 23:55
 * TURNO II / TURNO III
 *
 * 05:00 até 05:10
 * TURNO III / TURNO I
 *
 *
 * Para evitar que a mesma ocorrência seja
 * contada em dois turnos, o horário passa a
 * pertencer ao turno que está ENTRANDO.
 *
 * Portanto:
 *
 * 05:00  = TURNO I
 * 14:30  = TURNO II
 * 23:45  = TURNO III
 */
const identificarTurnoRegistro = (registro) => {
  const minutos =
    extrairHorarioMinutosRegistro(
      registro,
    );

  if (minutos === null) {
    return "SEM TURNO";
  }


  /*
   * TURNO I
   *
   * 05:00 até 10:59
   *
   * 12:00 até 14:29
   */
  if (
    (minutos >= 300 && minutos < 660) ||
    (minutos >= 720 && minutos < 870)
  ) {
    return "TURNO I";
  }


  /*
   * TURNO II
   *
   * 14:30 até 18:59
   *
   * 20:00 até 23:44
   */
  if (
    (minutos >= 870 && minutos < 1140) ||
    (minutos >= 1200 && minutos < 1425)
  ) {
    return "TURNO II";
  }


  /*
   * TURNO III
   *
   * 23:45 até 04:59
   */
  if (
    minutos >= 1425 ||
    minutos < 300
  ) {
    return "TURNO III";
  }


  /*
   * Intervalos:
   *
   * 11:00 até 11:59
   *
   * 19:00 até 19:59
   */
  return "FORA DE PRODUÇÃO";
};


/* ============================================================
   ORDENAÇÃO DOS FILTROS
============================================================ */

const ordenarValores = (valores) => {
  return [
    ...new Set(
      valores.filter(
        (valor) =>
          valor !== null &&
          valor !== undefined &&
          String(valor).trim() !== "",
      ),
    ),
  ].sort((a, b) =>
    String(a).localeCompare(
      String(b),
      "pt-BR",
      {
        numeric: true,
        sensitivity: "base",
      },
    ),
  );
};


/* ============================================================
   FORMATA PERCENTUAL
============================================================ */

const formatarPercentual = (valor) => {
  const numero = Number(valor);

  return Math.round(
    Number.isFinite(numero)
      ? numero
      : 0,
  ).toLocaleString("pt-BR");
};


/* ============================================================
   DASHBOARD
============================================================ */

export default function Dashboard() {
  const {
    dados: rawDados,
    loading,
    erro,
  } = useCargaMaquina();


  /* ==========================================================
     FILTROS
  ========================================================== */

  const [filtros, setFiltros] = useState({
    injetora: "Todos",

    cod_prod: "Todos",

    /*
     * NOVO
     */
    turno: "Todos",

    tipo: [],

    dataInicio: "",

    dataFim: "",
  });


  /* ==========================================================
     TIPOS DISPONÍVEIS
  ========================================================== */

  const tiposDisponiveis = useMemo(() => {
    return ordenarValores(
      rawDados.map(
        (registro) =>
          registro.tipo,
      ),
    );
  }, [rawDados]);


  /* ==========================================================
     PRODUTOS DISPONÍVEIS
  ========================================================== */

  const produtosDisponiveis = useMemo(() => {
    const baseProdutos =
      filtros.injetora === "Todos"
        ? rawDados
        : rawDados.filter(
            (registro) =>
              registro.injetora ===
              filtros.injetora,
          );

    return ordenarValores(
      baseProdutos.map(
        (registro) =>
          registro.cod_prod,
      ),
    );
  }, [
    rawDados,
    filtros.injetora,
  ]);


  /* ==========================================================
     DADOS FILTRADOS
  ========================================================== */

  const dadosFiltrados = useMemo(() => {
    return rawDados.filter(
      (registro) => {

        /* ----------------------------------------------------
           INJETORA
        ---------------------------------------------------- */

        if (
          filtros.injetora !== "Todos" &&
          registro.injetora !==
            filtros.injetora
        ) {
          return false;
        }


        /* ----------------------------------------------------
           PRODUTO
        ---------------------------------------------------- */

        if (
          filtros.cod_prod !== "Todos" &&
          registro.cod_prod !==
            filtros.cod_prod
        ) {
          return false;
        }


        /* ----------------------------------------------------
           TURNO
        ---------------------------------------------------- */

        if (
          filtros.turno !== "Todos"
        ) {
          const turnoRegistro =
            identificarTurnoRegistro(
              registro,
            );

          if (
            turnoRegistro !==
            filtros.turno
          ) {
            return false;
          }
        }


        /* ----------------------------------------------------
           DATA
        ---------------------------------------------------- */

        const dataRegistro =
          extrairDataISORegistro(
            registro,
          );


        /* DATA INICIAL */

        if (filtros.dataInicio) {
          if (
            !dataRegistro ||
            dataRegistro <
              filtros.dataInicio
          ) {
            return false;
          }
        }


        /* DATA FINAL */

        if (filtros.dataFim) {
          if (
            !dataRegistro ||
            dataRegistro >
              filtros.dataFim
          ) {
            return false;
          }
        }


        return true;
      },
    );
  }, [
    rawDados,
    filtros.injetora,
    filtros.cod_prod,
    filtros.turno,
    filtros.dataInicio,
    filtros.dataFim,
  ]);


  /* ==========================================================
     MÉTRICAS
  ========================================================== */

  /*
   * O filtro TIPO continua separado porque
   * useDashboardMetrics já trata esta informação.
   */
  const metrics =
    useDashboardMetrics(
      dadosFiltrados,
      filtros.tipo,
    );


  /* ==========================================================
     PERCENTUAIS DAS HORAS
  ========================================================== */

  const horasTotaisDec =
    Number(
      metrics?.horasTotaisDec ||
        0,
    );


  const percentualHoraTrabalhada =
    horasTotaisDec > 0
      ? (
          Number(
            metrics?.horasTrabalhadasDec ||
              0,
          ) /
          horasTotaisDec
        ) *
        100
      : 0;


  const percentualHoraParada =
    horasTotaisDec > 0
      ? (
          Number(
            metrics?.horasParadasDec ||
              0,
          ) /
          horasTotaisDec
        ) *
        100
      : 0;


  /*
   * Maior motivo usado como referência
   * para o tamanho das barras.
   */
  const maiorMotivo =
    metrics?.motivos?.[0]?.value ||
    0;


  /* ==========================================================
     CARREGAMENTO
  ========================================================== */

  if (loading) {
    return (
      <div className="loading-spinner">
        Processando dados de produção...
      </div>
    );
  }


  /* ==========================================================
     RENDERIZAÇÃO
  ========================================================== */

  return (
    <div className="dashboard-container">


      <Sidebar>

        <FiltrosDashboard
          filtros={
            filtros
          }

          setFiltros={
            setFiltros
          }

          rawDados={
            rawDados
          }

          tiposDisponiveis={
            tiposDisponiveis
          }

          produtosDisponiveis={
            produtosDisponiveis
          }

          exibirPeriodo={
            true
          }

          exibirInjetora={
            true
          }

          exibirTurno={
            true
          }

          exibirProduto={
            true
          }

          /*
           * No Dashboard de Produção original
           * não exibimos matéria-prima.
           */
          exibirMp={
            false
          }

          exibirTipo={
            true
          }
        />

      </Sidebar>


      {/* ======================================================
          CONTEÚDO PRINCIPAL
      ====================================================== */}

      <main className="main-content">


        {/* ====================================================
            CABEÇALHO
        ==================================================== */}

        <header className="dashboard-header">

          <h1>
            Dashboard de Produção
          </h1>

        </header>


        {/* ====================================================
            ERRO
        ==================================================== */}

        {erro && (
          <div className="dashboard-error">
            {erro}
          </div>
        )}


        {/* ====================================================
            KPIs
        ==================================================== */}

        <section className="kpi-grid">


          {/* ==================================================
              CONFORME
          ================================================== */}

          <div className="kpi-card verde">

            <CheckCircle2 className="kpi-icon kpi-icon-conforme" />

            <span>
              CONFORME
            </span>

            <strong>
              {Number(
                metrics?.totalConforme ||
                  0,
              ).toLocaleString(
                "pt-BR",
              )}
            </strong>

          </div>


          {/* ==================================================
              DANIFICADAS
          ================================================== */}

          <div className="kpi-card vermelho">

            <XCircle className="kpi-icon kpi-icon-danificadas" />

            <span>
              DANIFICADAS
            </span>

            <strong>
              {Number(
                metrics?.totalDanificadas ||
                  0,
              ).toLocaleString(
                "pt-BR",
              )}
            </strong>

          </div>


          {/* ==================================================
              QUALIDADE
          ================================================== */}

          <div className="kpi-card verde">

            <Target className="kpi-icon kpi-icon-qualidade" />

            <span>
              QUALIDADE
            </span>

            <strong>
              {Number(
                metrics?.qualidade ||
                  0,
              ).toFixed(2)}{" "}
              %
            </strong>

          </div>


          {/* ==================================================
              HORA TRABALHADA
          ================================================== */}

          <div className="kpi-card verde kpi-horas-trabalhadas">

            <div className="dias-trabalhados-indicador">

              <small>
                DIAS
              </small>

              <strong>
                {metrics?.diasTrabalhados ||
                  "0.00"}
              </strong>

            </div>


            <Clock className="kpi-icon kpi-icon-horas" />


            <span>
              HORA TRABALHADA
            </span>


            <div className="percentual-horas-indicador percentual-horas-indicador-trabalhadas">

              {formatarPercentual(
                percentualHoraTrabalhada,
              )}

              %

            </div>


            <strong className="valor-horas-trabalhadas">

              {metrics?.horasTrabalhadas ||
                "00:00"}{" "}
              hrs

            </strong>

          </div>


          {/* ==================================================
              HORA PARADA
          ================================================== */}

          <div className="kpi-card vermelho kpi-horas-trabalhadas">

            <div className="dias-trabalhados-indicador">

              <small>
                DIAS
              </small>

              <strong>
                {metrics?.diasParados ||
                  "0d 00h"}
              </strong>

            </div>


            <PauseCircle className="kpi-icon kpi-icon-paradas" />


            <span>
              HORA PARADA
            </span>


            <div className="percentual-horas-indicador percentual-horas-indicador-paradas">

              {formatarPercentual(
                percentualHoraParada,
              )}

              %

            </div>


            <strong className="valor-horas-trabalhadas">

              {metrics?.horasParadas ||
                "00:00"}{" "}
              hrs

            </strong>

          </div>


          {/* ==================================================
              TOTAL DE HORAS
          ================================================== */}

          <div className="kpi-card verde kpi-horas-trabalhadas">

            <div className="dias-trabalhados-indicador">

              <small>
                DIAS
              </small>

              <strong>
                {metrics?.diasTotais ||
                  "0d 00h"}
              </strong>

            </div>


            <Calculator className="kpi-icon kpi-icon-horas" />


            <span>
              TOTAL DE HORAS
            </span>


            <strong className="valor-horas-trabalhadas">

              {metrics?.horasTotais ||
                "00:00"}{" "}
              hrs

            </strong>

          </div>

        </section>


        <section className="chart-container">

          <h3>
            MOTIVOS DE PARADA
          </h3>


          <div className="motivos-list">

            {(metrics?.motivos || [])
              .length === 0 ? (

              <p className="sem-dados">
                Nenhum motivo de parada encontrado.
              </p>

            ) : (

              (metrics?.motivos || []).map(
                (item) => (

                  <div
                    key={
                      item.name
                    }
                    className="motivo-bar"
                  >

                    <div className="label-row">

                      <span>
                        {item.name}
                      </span>


                      <span>
                        {
                          item.formattedValue
                        }
                      </span>

                    </div>


                    <div className="progress-bg">

                      <progress
                        className="progress-indicador"
                        value={
                          Number(
                            item.value,
                          ) || 0
                        }
                        max={
                          maiorMotivo > 0
                            ? maiorMotivo
                            : 1
                        }
                      />

                    </div>

                  </div>

                ),
              )

            )}

          </div>

        </section>

      </main>

    </div>
  );
}