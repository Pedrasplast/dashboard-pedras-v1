import { useMemo } from "react";


/* =========================================================
   NÚMEROS
========================================================= */

const converterNumero = (valor) => {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor)
      ? valor
      : 0;
  }

  const numero = Number.parseFloat(
    String(valor)
      .trim()
      .replace(",", "."),
  );

  return Number.isFinite(numero)
    ? numero
    : 0;
};


/* =========================================================
   TEMPO -> HORAS DECIMAIS
========================================================= */

const converterTempoParaHoras = (tempo) => {
  if (
    tempo === null ||
    tempo === undefined ||
    tempo === ""
  ) {
    return 0;
  }


  /*
   * Número armazenado diretamente
   * como horas decimais.
   */
  if (typeof tempo === "number") {
    return Number.isFinite(tempo)
      ? Math.max(0, tempo)
      : 0;
  }


  const texto = String(tempo).trim();

  if (!texto) {
    return 0;
  }


  /*
   * Aceita:
   *
   * HH:MM
   * HH:MM:SS
   * HHH:MM:SS
   */
  const correspondencia = texto.match(
    /^(\d+):(\d{1,2})(?::(\d{1,2}))?$/,
  );


  if (correspondencia) {
    const horas =
      Number(correspondencia[1]);

    const minutos =
      Number(correspondencia[2]);

    const segundos =
      Number(
        correspondencia[3] || 0,
      );


    if (
      minutos >= 60 ||
      segundos >= 60
    ) {
      return 0;
    }


    return (
      horas +
      minutos / 60 +
      segundos / 3600
    );
  }


  /*
   * Número decimal em texto.
   *
   * Exemplo:
   * 2,5 = 2h30
   */
  const numero = Number.parseFloat(
    texto.replace(",", "."),
  );


  return Number.isFinite(numero)
    ? Math.max(0, numero)
    : 0;
};


/* =========================================================
   FORMATA HH:MM:SS
========================================================= */

const formatarHorasParaHHMMSS = (
  totalHoras,
) => {
  if (
    !Number.isFinite(totalHoras) ||
    totalHoras <= 0
  ) {
    return "00:00:00";
  }


  const segundosTotais =
    Math.round(
      totalHoras * 3600,
    );


  const horas =
    Math.floor(
      segundosTotais / 3600,
    );


  const minutos =
    Math.floor(
      (
        segundosTotais % 3600
      ) / 60,
    );


  const segundos =
    segundosTotais % 60;


  const horasFormatadas =
    horas.toLocaleString(
      "pt-BR",
    );


  return `${horasFormatadas}:${String(
    minutos,
  ).padStart(
    2,
    "0",
  )}:${String(
    segundos,
  ).padStart(
    2,
    "0",
  )}`;
};


/* =========================================================
   FORMATA HH:MM
========================================================= */

const formatarHorasParaHHMM = (
  totalHoras,
) => {
  if (
    !Number.isFinite(totalHoras) ||
    totalHoras <= 0
  ) {
    return "00:00";
  }


  const minutosTotais =
    Math.round(
      totalHoras * 60,
    );


  const horas =
    Math.floor(
      minutosTotais / 60,
    );


  const minutos =
    minutosTotais % 60;


  const horasFormatadas =
    horas.toLocaleString(
      "pt-BR",
    );


  return `${horasFormatadas}:${String(
    minutos,
  ).padStart(
    2,
    "0",
  )}`;
};


/* =========================================================
   FORMATA DIAS E HORAS
========================================================= */

const formatarDiasEHoras = (
  totalHoras,
) => {
  if (
    !Number.isFinite(totalHoras) ||
    totalHoras <= 0
  ) {
    return "0d 00h";
  }


  const minutosTotais =
    Math.round(
      totalHoras * 60,
    );


  const dias =
    Math.floor(
      minutosTotais /
        (24 * 60),
    );


  const minutosRestantes =
    minutosTotais %
    (24 * 60);


  const horasRestantes =
    Math.floor(
      minutosRestantes / 60,
    );


  const diasFormatados =
    dias.toLocaleString(
      "pt-BR",
    );


  return `${diasFormatados}d ${String(
    horasRestantes,
  ).padStart(
    2,
    "0",
  )}h`;
};


/* =========================================================
   NORMALIZA TEXTO
========================================================= */

const normalizarTexto = (valor) => {
  return String(
    valor ?? "",
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    );
};


/* =========================================================
   NORMALIZA TIPO
========================================================= */

const normalizarTipo = (tipo) => {
  return normalizarTexto(
    tipo,
  ).replace(
    /\s+/g,
    "",
  );
};


/* =========================================================
   VERIFICA TIPO 3
========================================================= */

const tipo3EstaSelecionado = (
  tiposSelecionados,
) => {
  const tipos =
    Array.isArray(
      tiposSelecionados,
    )
      ? tiposSelecionados
      : [tiposSelecionados];


  return tipos.some(
    (tipo) => {
      const valorNormalizado =
        normalizarTipo(
          tipo,
        );


      const numeroEncontrado =
        valorNormalizado.match(
          /\d+/,
        );


      return Boolean(
        numeroEncontrado &&
        Number(
          numeroEncontrado[0],
        ) === 3,
      );
    },
  );
};


/* =========================================================
   HOOK PRINCIPAL
========================================================= */

export const useDashboardMetrics = (
  dados,
  tiposSelecionados = [],
) => {
  return useMemo(
    () => {
      const safeDados =
        Array.isArray(dados)
          ? dados
          : [];


      const listaTiposSelecionados =
        Array.isArray(
          tiposSelecionados,
        )
          ? tiposSelecionados
          : [tiposSelecionados];


      /* =====================================================
         FILTRO DE TIPO

         O filtro de tipo continua sendo usado
         principalmente para o gráfico de motivos.
      ===================================================== */

      const tiposSelecionadosSet =
        new Set(
          listaTiposSelecionados
            .filter(
              (tipo) =>
                tipo !== null &&
                tipo !== undefined &&
                String(
                  tipo,
                ).trim() !== "",
            )
            .map(
              normalizarTipo,
            ),
        );


      const existeFiltroTipo =
        tiposSelecionadosSet.size >
        0;


      /*
       * Quando Tipo 3 está selecionado,
       * as paradas especiais entram
       * no cartão de horas paradas.
       */
      const incluirParadasTipo3NoCartao =
        tipo3EstaSelecionado(
          listaTiposSelecionados,
        );


      /* =====================================================
         ACUMULADORES
      ===================================================== */

      let totalConforme = 0;

      let totalDanificadas = 0;

      let horasTrabalhadasDec = 0;

      /*
       * Todas as paradas indisponíveis,
       * inclusive Tipo 3.
       *
       * Mantido para conferência.
       */
      let horasParadasTotalDec = 0;


      /*
       * Somente as paradas que realmente
       * entram no cartão Hora Parada.
       */
      let horasParadasCartaoDec = 0;


      /*
       * NOVO:
       *
       * Quantidade de registros que seguem
       * exatamente a MESMA regra do cartão
       * Hora Parada.
       */
      let registrosParada = 0;


      const motivosMap = {};


      /* =====================================================
         PERCORRER REGISTROS
      ===================================================== */

      for (
        const registro of safeDados
      ) {
        /* ---------------------------------------------------
           PRODUÇÃO
        --------------------------------------------------- */

        totalConforme +=
          converterNumero(
            registro.conforme,
          );


        totalDanificadas +=
          converterNumero(
            registro.danificada,
          );


        /* ---------------------------------------------------
           STATUS / DURAÇÃO
        --------------------------------------------------- */

        const status =
          normalizarTexto(
            registro.status,
          );


        const duracao =
          converterTempoParaHoras(
            registro.duracao,
          );


        /* ---------------------------------------------------
           HORAS TRABALHADAS

           Apenas status Produzindo.
        --------------------------------------------------- */

        if (
          status ===
          "produzindo"
        ) {
          horasTrabalhadasDec +=
            duracao;

          continue;
        }


        /* ---------------------------------------------------
           PARADAS

           Apenas status Indisponível.
        --------------------------------------------------- */

        if (
          status !==
          "indisponivel"
        ) {
          continue;
        }


        /*
         * Total geral de paradas.
         */
        horasParadasTotalDec +=
          duracao;


        /* ---------------------------------------------------
           IDENTIFICAR PARADAS ESPECIAIS / TIPO 3
        --------------------------------------------------- */

        const motivoNormalizado =
          normalizarTexto(
            registro.motivo,
          );


        const ehParadaTipo3 =
          motivoNormalizado.includes(
            "final de semana",
          ) ||
          motivoNormalizado.includes(
            "feriado sem expediente",
          ) ||
          motivoNormalizado.includes(
            "turno reduzido",
          );


        /* ---------------------------------------------------
           PARADAS COMUNS

           Entram sempre.
        --------------------------------------------------- */

        if (!ehParadaTipo3) {
          horasParadasCartaoDec +=
            duracao;

          registrosParada += 1;
        }


        /* ---------------------------------------------------
           PARADAS TIPO 3

           Só entram quando Tipo 3 estiver
           selecionado no Dashboard.

           Na Home passaremos [],
           portanto NÃO entram.
        --------------------------------------------------- */

        if (
          ehParadaTipo3 &&
          incluirParadasTipo3NoCartao
        ) {
          horasParadasCartaoDec +=
            duracao;

          registrosParada += 1;
        }


        /* ---------------------------------------------------
           GRÁFICO DE MOTIVOS
        --------------------------------------------------- */

        const tipoRegistro =
          normalizarTipo(
            registro.tipo,
          );


        const incluirNoGrafico =
          !existeFiltroTipo ||
          tiposSelecionadosSet.has(
            tipoRegistro,
          );


        if (
          incluirNoGrafico &&
          String(
            registro.motivo ?? "",
          ).trim() !== ""
        ) {
          const motivo =
            String(
              registro.motivo,
            ).trim();


          motivosMap[motivo] =
            (
              motivosMap[motivo] ||
              0
            ) +
            duracao;
        }
      }


      /* =====================================================
         QUALIDADE
      ===================================================== */

      const totalProduzido =
        totalConforme +
        totalDanificadas;


      const qualidade =
        totalProduzido > 0
          ? (
              totalConforme /
              totalProduzido
            ) * 100
          : 0;


      /* =====================================================
         TOTAL DE HORAS

         Mesma lógica do Dashboard.

         Horas trabalhadas +
         horas paradas exibidas no cartão.
      ===================================================== */

      const horasTotaisDec =
        horasTrabalhadasDec +
        horasParadasCartaoDec;


      /* =====================================================
         PERCENTUAIS
      ===================================================== */

      const percentualHorasTrabalhadas =
        horasTotaisDec > 0
          ? (
              horasTrabalhadasDec /
              horasTotaisDec
            ) * 100
          : 0;


      const percentualHorasParadas =
        horasTotaisDec > 0
          ? (
              horasParadasCartaoDec /
              horasTotaisDec
            ) * 100
          : 0;


      /* =====================================================
         RETORNO
      ===================================================== */

      return {
        /* PRODUÇÃO */

        totalConforme,

        totalDanificadas,

        qualidade:
          qualidade.toFixed(
            1,
          ),


        /* HORAS TRABALHADAS */

        horasTrabalhadas:
          formatarHorasParaHHMM(
            horasTrabalhadasDec,
          ),

        horasTrabalhadasComSegundos:
          formatarHorasParaHHMMSS(
            horasTrabalhadasDec,
          ),

        horasTrabalhadasDec,


        diasTrabalhados:
          formatarDiasEHoras(
            horasTrabalhadasDec,
          ),

        diasTrabalhadosDec:
          (
            horasTrabalhadasDec /
            24
          ).toFixed(
            2,
          ),


        /* HORAS PARADAS */

        horasParadas:
          formatarHorasParaHHMM(
            horasParadasCartaoDec,
          ),

        horasParadasComSegundos:
          formatarHorasParaHHMMSS(
            horasParadasCartaoDec,
          ),

        horasParadasDec:
          horasParadasCartaoDec,


        diasParados:
          formatarDiasEHoras(
            horasParadasCartaoDec,
          ),

        diasParadosDec:
          (
            horasParadasCartaoDec /
            24
          ).toFixed(
            2,
          ),


        /*
         * NOVO
         *
         * Quantidade de paradas usando
         * exatamente a mesma regra
         * de horasParadas.
         */
        registrosParada,


        /* TODAS AS PARADAS */

        horasParadasTotal:
          formatarHorasParaHHMM(
            horasParadasTotalDec,
          ),

        horasParadasTotalComSegundos:
          formatarHorasParaHHMMSS(
            horasParadasTotalDec,
          ),

        horasParadasTotalDec,


        /* TOTAL DE HORAS */

        horasTotais:
          formatarHorasParaHHMM(
            horasTotaisDec,
          ),

        horasTotaisComSegundos:
          formatarHorasParaHHMMSS(
            horasTotaisDec,
          ),

        horasTotaisDec,


        /* PERCENTUAIS */

        percentualHorasTrabalhadas,

        percentualHorasParadas,


        /* DIAS TOTAIS */

        diasTotais:
          formatarDiasEHoras(
            horasTotaisDec,
          ),

        diasTotaisDec:
          (
            horasTotaisDec /
            24
          ).toFixed(
            2,
          ),


        /* MOTIVOS */

        motivos:
          Object.entries(
            motivosMap,
          )
            .map(
              (
                [
                  name,
                  value,
                ],
              ) => ({
                name,

                value,

                formattedValue:
                  formatarHorasParaHHMMSS(
                    value,
                  ),
              }),
            )
            .sort(
              (
                a,
                b,
              ) =>
                b.value -
                a.value,
            ),
      };
    },
    [
      dados,
      tiposSelecionados,
    ],
  );
};