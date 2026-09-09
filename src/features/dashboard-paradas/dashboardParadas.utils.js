import { normalizarTexto } from "@/lib/texto";

import {
  extrairDataISORegistro,
  extrairHorarioMinutosRegistro,
  filtrarRegistrosDashboard,
} from "@/features/dashboard/dashboard.utils";

import {
  converterDuracaoParaSegundos,
  formatarSegundosComoDuracao,
} from "@/features/relatorios/utils/Duracao";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

export const TIPOS_PARADA = Object.freeze([
  "1",
  "2",
  "3",
]);

export const FAIXAS_DURACAO = Object.freeze([
  {
    id: "ate-15",
    label: "Até 15 min",
    min: 0,
    max: 15 * 60,
  },

  {
    id: "15-30",
    label: "15 a 30 min",
    min: 15 * 60,
    max: 30 * 60,
  },

  {
    id: "30-60",
    label: "30 a 60 min",
    min: 30 * 60,
    max: 60 * 60,
  },

  {
    id: "1-2h",
    label: "1 a 2 horas",
    min: 60 * 60,
    max: 2 * 60 * 60,
  },

  {
    id: "acima-2h",
    label: "Acima de 2h",
    min: 2 * 60 * 60,
    max: Infinity,
  },
]);

const DIAS_SEMANA = Object.freeze([
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
]);

const FAIXAS_HORARIO = Object.freeze([
  {
    id: "00-04",
    label: "00–04",
    inicio: 0,
    fim: 4 * 60,
  },

  {
    id: "04-08",
    label: "04–08",
    inicio: 4 * 60,
    fim: 8 * 60,
  },

  {
    id: "08-12",
    label: "08–12",
    inicio: 8 * 60,
    fim: 12 * 60,
  },

  {
    id: "12-16",
    label: "12–16",
    inicio: 12 * 60,
    fim: 16 * 60,
  },

  {
    id: "16-20",
    label: "16–20",
    inicio: 16 * 60,
    fim: 20 * 60,
  },

  {
    id: "20-24",
    label: "20–24",
    inicio: 20 * 60,
    fim: 24 * 60,
  },
]);

/* =========================================================
   UTILITÁRIOS INTERNOS
========================================================= */

function textoOuPadrao(valor, padrao) {
  const texto = String(valor ?? "").trim();

  return texto || padrao;
}

function chaveTexto(valor) {
  return normalizarTexto(valor, {
    compactarEspacos: true,
  });
}

function criarGrupoMapa(mapa, chave, criador) {
  if (!mapa.has(chave)) {
    mapa.set(chave, criador());
  }

  return mapa.get(chave);
}

function adicionarDiasISO(dataISO, quantidade) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      String(dataISO || ""),
    )
  ) {
    return "";
  }

  const [ano, mes, dia] = dataISO
    .split("-")
    .map(Number);

  const data = new Date(
    Date.UTC(
      ano,
      mes - 1,
      dia,
    ),
  );

  data.setUTCDate(
    data.getUTCDate() + quantidade,
  );

  return data
    .toISOString()
    .slice(0, 10);
}

function diferencaDiasInclusiva(
  inicio,
  fim,
) {
  if (
    !inicio ||
    !fim ||
    fim < inicio
  ) {
    return 0;
  }

  const dataInicio = new Date(
    `${inicio}T00:00:00Z`,
  );

  const dataFim = new Date(
    `${fim}T00:00:00Z`,
  );

  const diferenca =
    dataFim.getTime() -
    dataInicio.getTime();

  return (
    Math.floor(
      diferenca / 86_400_000,
    ) + 1
  );
}

/* =========================================================
   IDENTIFICAÇÃO DE PARADAS
========================================================= */

export function ehRegistroParada(
  registro,
) {
  return TIPOS_PARADA.includes(
    String(
      registro?.tipo ?? "",
    ).trim(),
  );
}

/* =========================================================
   FILTRO DE PARADAS
========================================================= */

export function filtrarParadas(
  registros,
  filtros,
) {
  /*
   * Aproveita primeiro o filtro que já existe
   * no Dashboard de Produção.
   *
   * Assim não duplicamos regras de:
   * - período
   * - injetora
   * - demais filtros compartilhados
   */
  const base =
    filtrarRegistrosDashboard(
      registros,
      filtros,
    );

  const tiposSelecionados =
    Array.isArray(filtros?.tipo)
      ? filtros.tipo
          .map((tipo) =>
            String(tipo).trim(),
          )
          .filter(Boolean)
      : [];

  const motivoSelecionado =
    String(
      filtros?.motivo ||
        "Todos",
    ).trim();

  const chaveMotivoSelecionado =
    chaveTexto(
      motivoSelecionado,
    );

  return base.filter(
    (registro) => {
      if (
        !ehRegistroParada(
          registro,
        )
      ) {
        return false;
      }

      const tipo = String(
        registro.tipo ?? "",
      ).trim();

      if (
        tiposSelecionados.length >
          0 &&
        !tiposSelecionados.includes(
          tipo,
        )
      ) {
        return false;
      }

      if (
        motivoSelecionado !==
        "Todos"
      ) {
        const motivo =
          textoOuPadrao(
            registro.motivo,
            "SEM MOTIVO INFORMADO",
          );

        if (
          chaveTexto(motivo) !==
          chaveMotivoSelecionado
        ) {
          return false;
        }
      }

      return true;
    },
  );
}

/* =========================================================
   PERÍODO ANTERIOR
========================================================= */

export function obterPeriodoAnterior(
  filtros,
) {
  const inicio = String(
    filtros?.dataInicio || "",
  );

  const fim = String(
    filtros?.dataFim || "",
  );

  const dias =
    diferencaDiasInclusiva(
      inicio,
      fim,
    );

  if (dias <= 0) {
    return null;
  }

  const fimAnterior =
    adicionarDiasISO(
      inicio,
      -1,
    );

  const inicioAnterior =
    adicionarDiasISO(
      fimAnterior,
      -(dias - 1),
    );

  return {
    dataInicio:
      inicioAnterior,

    dataFim:
      fimAnterior,
  };
}

/* =========================================================
   FORMATAÇÕES
========================================================= */

export function formatarDuracaoResumida(
  segundos,
) {
  const total = Math.max(
    0,
    Number(segundos) || 0,
  );

  const horas = Math.floor(
    total / 3600,
  );

  const minutos = Math.floor(
    (total % 3600) / 60,
  );

  if (horas <= 0) {
    return `${minutos} min`;
  }

  if (minutos === 0) {
    return `${horas}h`;
  }

  return `${horas}h ${String(
    minutos,
  ).padStart(2, "0")}min`;
}

export function formatarDataCurta(
  dataISO,
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      String(dataISO || ""),
    )
  ) {
    return "-";
  }

  const [, mes, dia] =
    dataISO.split("-");

  return `${dia}/${mes}`;
}

/* =========================================================
   COMPARAÇÃO COM PERÍODO ANTERIOR
========================================================= */

export function calcularVariacaoPercentual(
  atual,
  anterior,
) {
  const atualNumero =
    Number(atual) || 0;

  const anteriorNumero =
    Number(anterior) || 0;

  if (anteriorNumero === 0) {
    return null;
  }

  return (
    ((atualNumero -
      anteriorNumero) /
      Math.abs(
        anteriorNumero,
      )) *
    100
  );
}

/* =========================================================
   CONSOLIDAÇÃO PRINCIPAL

   IMPORTANTE:
   Os registros são percorridos uma única vez para gerar
   praticamente todas as informações do dashboard.

   Isso evita vários filter/reduce independentes em cada
   componente.
========================================================= */

export function consolidarParadas(
  registros,
) {
  const lista = Array.isArray(
    registros,
  )
    ? registros
    : [];

  let tempoTotalSegundos = 0;

  let maiorParada = null;

  const motivos = new Map();

  const justificativas =
    new Map();

  const injetoras = new Map();

  const datas = new Map();

  const faixas = new Map(
    FAIXAS_DURACAO.map(
      (faixa) => [
        faixa.id,
        0,
      ],
    ),
  );

  const heatmap = new Map();

  /* =====================================================
     UMA PASSAGEM PELOS REGISTROS
  ===================================================== */

  for (const registro of lista) {
    const duracaoSegundos =
      converterDuracaoParaSegundos(
        registro?.duracao,
      );

    const tipo = String(
      registro?.tipo ?? "",
    ).trim();

    const motivo =
      textoOuPadrao(
        registro?.motivo,
        "SEM MOTIVO INFORMADO",
      );

    const justificativa =
      textoOuPadrao(
        registro?.justificativa,
        "SEM JUSTIFICATIVA",
      );

    const injetora =
      textoOuPadrao(
        registro?.injetora,
        "SEM INJETORA",
      );

    const dataISO =
      extrairDataISORegistro(
        registro,
      );

    /* ===================================================
       TOTAL
    =================================================== */

    tempoTotalSegundos +=
      duracaoSegundos;

    /* ===================================================
       MAIOR PARADA
    =================================================== */

    if (
      !maiorParada ||
      duracaoSegundos >
        maiorParada
          .duracao_segundos
    ) {
      maiorParada = {
        id: registro?.id,

        data:
          dataISO,

        injetora,

        motivo,

        justificativa,

        tipo,

        duracao_segundos:
          duracaoSegundos,

        tempo_total:
          formatarSegundosComoDuracao(
            duracaoSegundos,
          ),
      };
    }

    /* ===================================================
       MOTIVOS
    =================================================== */

    const chaveMotivo =
      chaveTexto(motivo);

    const grupoMotivo =
      criarGrupoMapa(
        motivos,
        chaveMotivo,
        () => ({
          motivo,

          ocorrencias: 0,

          duracao_segundos: 0,
        }),
      );

    grupoMotivo.ocorrencias +=
      1;

    grupoMotivo.duracao_segundos +=
      duracaoSegundos;

    /* ===================================================
       JUSTIFICATIVAS
    =================================================== */

    const chaveJustificativa =
      `${chaveMotivo}|||${chaveTexto(
        justificativa,
      )}`;

    const grupoJustificativa =
      criarGrupoMapa(
        justificativas,
        chaveJustificativa,
        () => ({
          motivo,

          justificativa,

          ocorrencias: 0,

          duracao_segundos: 0,
        }),
      );

    grupoJustificativa.ocorrencias +=
      1;

    grupoJustificativa.duracao_segundos +=
      duracaoSegundos;

    /* ===================================================
       INJETORAS
    =================================================== */

    const chaveInjetora =
      chaveTexto(injetora);

    const grupoInjetora =
      criarGrupoMapa(
        injetoras,
        chaveInjetora,
        () => ({
          injetora,

          ocorrencias: 0,

          duracao_segundos: 0,

          maior_parada_segundos:
            0,
        }),
      );

    grupoInjetora.ocorrencias +=
      1;

    grupoInjetora.duracao_segundos +=
      duracaoSegundos;

    grupoInjetora.maior_parada_segundos =
      Math.max(
        grupoInjetora
          .maior_parada_segundos,

        duracaoSegundos,
      );

    /* ===================================================
       EVOLUÇÃO POR DATA
    =================================================== */

    if (dataISO) {
      const grupoData =
        criarGrupoMapa(
          datas,
          dataISO,
          () => ({
            data:
              dataISO,

            tipo1_segundos:
              0,

            tipo2_segundos:
              0,

            tipo3_segundos:
              0,

            duracao_segundos:
              0,

            ocorrencias:
              0,
          }),
        );

      grupoData.ocorrencias +=
        1;

      grupoData.duracao_segundos +=
        duracaoSegundos;

      if (tipo === "1") {
        grupoData.tipo1_segundos +=
          duracaoSegundos;
      }

      if (tipo === "2") {
        grupoData.tipo2_segundos +=
          duracaoSegundos;
      }

      if (tipo === "3") {
        grupoData.tipo3_segundos +=
          duracaoSegundos;
      }
    }

    /* ===================================================
       FAIXAS DE DURAÇÃO
    =================================================== */

    const faixaEncontrada =
      FAIXAS_DURACAO.find(
        (faixa) => {
          if (
            faixa.id ===
            "ate-15"
          ) {
            return (
              duracaoSegundos <=
              faixa.max
            );
          }

          if (
            faixa.max ===
            Infinity
          ) {
            return (
              duracaoSegundos >
              faixa.min
            );
          }

          return (
            duracaoSegundos >
              faixa.min &&
            duracaoSegundos <=
              faixa.max
          );
        },
      );

    if (faixaEncontrada) {
      faixas.set(
        faixaEncontrada.id,

        (
          faixas.get(
            faixaEncontrada.id,
          ) || 0
        ) + 1,
      );
    }

    /* ===================================================
       HEATMAP
       Usa somente o horário informado no registro manual.
    =================================================== */

    const minutosInicio =
      extrairHorarioMinutosRegistro(
        registro,
      );

    if (
      dataISO &&
      minutosInicio !== null
    ) {
      const dataUTC =
        new Date(
          `${dataISO}T12:00:00Z`,
        );

      const diaSemana =
        Number.isNaN(
          dataUTC.getTime(),
        )
          ? null
          : dataUTC.getUTCDay();

      const faixaHorario =
        FAIXAS_HORARIO.find(
          (faixa) =>
            minutosInicio >=
              faixa.inicio &&
            minutosInicio <
              faixa.fim,
        );

      if (
        diaSemana !== null &&
        faixaHorario
      ) {
        const chaveHeatmap =
          `${diaSemana}|${faixaHorario.id}`;

        const celula =
          criarGrupoMapa(
            heatmap,
            chaveHeatmap,
            () => ({
              dia_indice:
                diaSemana,

              dia:
                DIAS_SEMANA[
                  diaSemana
                ],

              faixa:
                faixaHorario.id,

              faixa_label:
                faixaHorario.label,

              ocorrencias:
                0,

              duracao_segundos:
                0,

              /*
               * Guarda exatamente os mesmos registros
               * que formaram esta célula do Heatmap.
               *
               * Assim o drill-down não precisa tentar
               * reconstruir dia/horário novamente.
               */
              registros: [],
            }),
          );

        celula.registros.push(
          registro,
        );

        celula.ocorrencias =
          celula.registros.length;

        celula.duracao_segundos +=
          duracaoSegundos;
      }
    }
  }

  /* =====================================================
     MOTIVOS
  ===================================================== */

  const motivosOrdenados =
    Array.from(
      motivos.values(),
    )
      .sort(
        (a, b) =>
          b.duracao_segundos -
          a.duracao_segundos,
      )
      .map((item) => ({
        ...item,

        tempo_total:
          formatarSegundosComoDuracao(
            item.duracao_segundos,
          ),

        tempo_medio_segundos:
          item.ocorrencias > 0
            ? item.duracao_segundos /
              item.ocorrencias
            : 0,

        percentual_impacto:
          tempoTotalSegundos > 0
            ? (
                item.duracao_segundos /
                tempoTotalSegundos
              ) * 100
            : 0,
      }));

  /* =====================================================
     PARETO
  ===================================================== */

  let acumulado = 0;

  const paretoCompleto =
    motivosOrdenados.map(
      (item) => {
        acumulado +=
          item.percentual_impacto;

        return {
          ...item,

          percentual_acumulado:
            Math.min(
              100,
              acumulado,
            ),
        };
      },
    );

  /* =====================================================
     JUSTIFICATIVAS
  ===================================================== */

  const justificativasOrdenadas =
    Array.from(
      justificativas.values(),
    )
      .sort(
        (a, b) =>
          b.duracao_segundos -
          a.duracao_segundos,
      )
      .map((item) => ({
        ...item,

        tempo_total:
          formatarSegundosComoDuracao(
            item.duracao_segundos,
          ),

        tempo_medio_segundos:
          item.ocorrencias > 0
            ? item.duracao_segundos /
              item.ocorrencias
            : 0,

        percentual_impacto:
          tempoTotalSegundos > 0
            ? (
                item.duracao_segundos /
                tempoTotalSegundos
              ) * 100
            : 0,
      }));

  /* =====================================================
     RANKING DE INJETORAS
  ===================================================== */

  const rankingInjetoras =
    Array.from(
      injetoras.values(),
    )
      .sort(
        (a, b) =>
          b.duracao_segundos -
          a.duracao_segundos,
      )
      .map((item) => ({
        ...item,

        tempo_total:
          formatarSegundosComoDuracao(
            item.duracao_segundos,
          ),

        tempo_medio_segundos:
          item.ocorrencias > 0
            ? item.duracao_segundos /
              item.ocorrencias
            : 0,

        percentual_impacto:
          tempoTotalSegundos > 0
            ? (
                item.duracao_segundos /
                tempoTotalSegundos
              ) * 100
            : 0,
      }));

  /* =====================================================
     EVOLUÇÃO
  ===================================================== */

  const evolucao =
    Array.from(
      datas.values(),
    ).sort(
      (a, b) =>
        a.data.localeCompare(
          b.data,
        ),
    );

  /* =====================================================
     DISTRIBUIÇÃO DE DURAÇÃO
  ===================================================== */

  const distribuicaoDuracao =
    FAIXAS_DURACAO.map(
      (faixa) => ({
        faixa:
          faixa.label,

        ocorrencias:
          faixas.get(
            faixa.id,
          ) || 0,
      }),
    );

  /* =====================================================
     TOP 5 MAIORES PARADAS
  ===================================================== */

  const maioresParadas =
    [...lista]
      .map((registro) => {
        const duracaoSegundos =
          converterDuracaoParaSegundos(
            registro?.duracao,
          );

        return {
          id:
            registro?.id,

          data:
            extrairDataISORegistro(
              registro,
            ),

          injetora:
            textoOuPadrao(
              registro?.injetora,
              "SEM INJETORA",
            ),

          motivo:
            textoOuPadrao(
              registro?.motivo,
              "SEM MOTIVO INFORMADO",
            ),

          justificativa:
            textoOuPadrao(
              registro?.justificativa,
              "SEM JUSTIFICATIVA",
            ),

          tipo: String(
            registro?.tipo ?? "",
          ).trim(),

          duracao_segundos:
            duracaoSegundos,

          tempo_total:
            formatarSegundosComoDuracao(
              duracaoSegundos,
            ),
        };
      })
      .sort(
        (a, b) =>
          b.duracao_segundos -
          a.duracao_segundos,
      )
      .slice(0, 5);

  /* =====================================================
     CONCENTRAÇÃO TOP 3
  ===================================================== */

  const top3Tempo =
    motivosOrdenados
      .slice(0, 3)
      .reduce(
        (total, item) =>
          total +
          item.duracao_segundos,
        0,
      );

  /* =====================================================
     HEATMAP
  ===================================================== */

  /*
   * IMPORTANTE:
   * cada item de heatmapLista contém "registros",
   * com a lista exata que gerou ocorrencias e duração.
   *
   * O modal usa diretamente essa lista.
   */
  const heatmapLista =
    Array.from(
      heatmap.values(),
    );

  const heatmapMaxOcorrencias =
    heatmapLista.reduce(
      (maior, item) =>
        Math.max(
          maior,
          item.ocorrencias,
        ),
      0,
    );

  /* =====================================================
     RETORNO ÚNICO DO DASHBOARD
  ===================================================== */

  return {
    totalParadas:
      lista.length,

    tempoTotalSegundos,

    tempoMedioSegundos:
      lista.length > 0
        ? tempoTotalSegundos /
          lista.length
        : 0,

    maiorParada,

    motivoMaisCritico:
      motivosOrdenados[0] ||
      null,

    maquinaMaisImpactada:
      rankingInjetoras[0] ||
      null,

    concentracaoTop3:
      tempoTotalSegundos > 0
        ? (
            top3Tempo /
            tempoTotalSegundos
          ) * 100
        : 0,

    motivos:
      motivosOrdenados,

    pareto:
      paretoCompleto,

    justificativas:
      justificativasOrdenadas,

    rankingInjetoras,

    evolucao,

    distribuicaoDuracao,

    maioresParadas,

    criticidade:
      motivosOrdenados
        .slice(0, 12)
        .map((item) => ({
          motivo:
            item.motivo,

          ocorrencias:
            item.ocorrencias,

          horas:
            item.duracao_segundos /
            3600,

          tempo_medio_segundos:
            item.tempo_medio_segundos,

          tamanho:
            Math.max(
              80,

              item.tempo_medio_segundos ||
                item.ocorrencias *
                  100,
            ),

          duracao_segundos:
            item.duracao_segundos,
        })),

    heatmap: {
      dias:
        DIAS_SEMANA,

      faixas:
        FAIXAS_HORARIO,

      celulas:
        heatmapLista,

      maxOcorrencias:
        heatmapMaxOcorrencias,
    },
  };
}