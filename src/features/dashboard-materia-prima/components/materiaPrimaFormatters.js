import {
  formatarKg,
  formatarMoeda,
  formatarNumero,
} from "../dashboardMateriaPrimaUtils.js";


/* =========================================================
   PERCENTUAL
========================================================= */

export function formatarPercentual(
  valor,
  casas = 1,
) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(
        valor,
      ),
    )
  ) {
    return "-";
  }

  return `${Number(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        casas,

      maximumFractionDigits:
        casas,
    },
  )}%`;
}


/* =========================================================
   DIAS
========================================================= */

export function formatarDias(
  valor,
) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(
        valor,
      ),
    )
  ) {
    return "-";
  }

  return `${formatarNumero(
    valor,
    1,
  )} dias`;
}


/* =========================================================
   MOEDA COMPACTA

   Utilizada nos rankings onde existe pouco espaço.
========================================================= */

export function formatarMoedaCompacta(
  valor,
) {
  const numero =
    Number(
      valor,
    );

  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "R$ 0";
  }

  if (
    Math.abs(
      numero,
    ) >= 1000000
  ) {
    return `R$ ${(numero / 1000000).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          1,

        maximumFractionDigits:
          1,
      },
    )} mi`;
  }

  if (
    Math.abs(
      numero,
    ) >= 1000
  ) {
    return `R$ ${(numero / 1000).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          0,

        maximumFractionDigits:
          1,
      },
    )} mil`;
  }

  return formatarMoeda(
    numero,
    0,
  );
}


/* =========================================================
   MOEDA COMPLETA

   Utilizada no gráfico mensal.

   Exemplos:
   R$ 848.388
   R$ 1.100.000

   Nunca exibe:
   mil
   mi
========================================================= */

export function formatarMoedaCompleta(
  valor,
  casas = 0,
) {
  const numero =
    Number(
      valor,
    );

  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "R$ 0";
  }

  return numero.toLocaleString(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",

      minimumFractionDigits:
        casas,

      maximumFractionDigits:
        casas,
    },
  );
}


/* =========================================================
   KG COMPACTO

   Utilizado nos rankings por fornecedor.
========================================================= */

export function formatarKgCompacto(
  valor,
) {
  const numero =
    Number(
      valor,
    );

  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "0 kg";
  }

  if (
    Math.abs(
      numero,
    ) >= 1000000
  ) {
    return `${(numero / 1000000).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          1,

        maximumFractionDigits:
          1,
      },
    )} mi kg`;
  }

  if (
    Math.abs(
      numero,
    ) >= 1000
  ) {
    return `${(numero / 1000).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          0,

        maximumFractionDigits:
          1,
      },
    )} mil kg`;
  }

  return formatarKg(
    numero,
    0,
  );
}


/* =========================================================
   KG COMPLETO

   Utilizado no gráfico mensal.

   Exemplos:
   113.800 kg
   204.580 kg
========================================================= */

export function formatarKgCompleto(
  valor,
) {
  const numero =
    Number(
      valor,
    );

  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "0 kg";
  }

  return `${numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        0,
    },
  )} kg`;
}