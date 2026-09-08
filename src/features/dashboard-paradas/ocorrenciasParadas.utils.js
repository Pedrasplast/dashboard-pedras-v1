import {
  converterDuracaoParaSegundos,
} from "@/features/relatorios/utils/Duracao";

/* =========================================================
   TEXTO
========================================================= */

export function normalizarTextoOcorrencia(
  valor,
) {
  return String(
    valor ?? "",
  )
    .trim()
    .toLocaleUpperCase(
      "pt-BR",
    );
}

export function obterMotivoRegistro(
  registro,
) {
  const motivo = String(
    registro?.motivo ?? "",
  ).trim();

  return motivo ||
    "SEM MOTIVO INFORMADO";
}

export function obterInjetoraRegistro(
  registro,
) {
  return String(
    registro?.injetora ||
      registro?.no_injetora ||
      "",
  ).trim();
}

/* =========================================================
   DURAÇÃO
========================================================= */

export function obterDuracaoSegundos(
  registro,
) {
  return Math.max(
    0,
    Number(
      converterDuracaoParaSegundos(
        registro?.duracao,
      ),
    ) || 0,
  );
}

/* =========================================================
   DATA ISO DO REGISTRO

   Prioriza lista_de_data, que já é uma data operacional
   sem depender de conversão de timezone.

   Exemplo:
   2026-09-08
========================================================= */

export function obterDataISORegistro(
  registro,
) {
  const candidatos = [
    registro?.lista_de_data,
    registro?.data,
    registro?.inicio,
    registro?.inicio_dia,
  ];

  for (
    const valor of candidatos
  ) {
    if (!valor) {
      continue;
    }

    const texto =
      String(valor).trim();

    const matchIso =
      texto.match(
        /^(\d{4})-(\d{2})-(\d{2})/,
      );

    if (matchIso) {
      return (
        `${matchIso[1]}-` +
        `${matchIso[2]}-` +
        `${matchIso[3]}`
      );
    }

    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime(),
      )
    ) {
      continue;
    }

    const ano =
      data.getFullYear();

    const mes =
      String(
        data.getMonth() + 1,
      ).padStart(
        2,
        "0",
      );

    const dia =
      String(
        data.getDate(),
      ).padStart(
        2,
        "0",
      );

    return `${ano}-${mes}-${dia}`;
  }

  return "";
}

/* =========================================================
   DATA FORMATADA
========================================================= */

export function formatarDataRegistro(
  registro,
) {
  const dataISO =
    obterDataISORegistro(
      registro,
    );

  if (dataISO) {
    const [
      ano,
      mes,
      dia,
    ] =
      dataISO.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  return "—";
}

/* =========================================================
   HORÁRIO
========================================================= */

export function formatarHorarioRegistro(
  valor,
) {
  if (!valor) {
    return "—";
  }

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "—";
  }

  return data.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

/* =========================================================
   FAIXA DE DURAÇÃO
========================================================= */

export function registroPertenceFaixaDuracao(
  registro,
  faixa,
) {
  if (!faixa) {
    return false;
  }

  const duracaoSegundos =
    obterDuracaoSegundos(
      registro,
    );

  if (
    faixa.id === "ate-15"
  ) {
    return (
      duracaoSegundos <=
      faixa.max
    );
  }

  if (
    faixa.max === Infinity
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
}