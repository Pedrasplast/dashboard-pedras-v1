export function numero(
  valor,
) {
  const convertido =
    Number(
      valor,
    );

  return Number.isFinite(
    convertido,
  )
    ? convertido
    : 0;
}


export function numeroOuNull(
  valor,
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const convertido =
    Number(
      valor,
    );

  return Number.isFinite(
    convertido,
  )
    ? convertido
    : null;
}


export function formatarNumero(
  valor,
  casas = 0,
) {
  return numero(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        casas,

      maximumFractionDigits:
        casas,
    },
  );
}


export function formatarKg(
  valor,
  casas = 0,
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "-";
  }

  return `${formatarNumero(
    valor,
    casas,
  )} kg`;
}


export function formatarMoeda(
  valor,
  casas = 2,
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

  return Number(
    valor,
  ).toLocaleString(
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


export function formatarMoedaKg(
  valor,
  casas = 3,
) {
  const moeda =
    formatarMoeda(
      valor,
      casas,
    );

  return moeda ===
    "-"
      ? "-"
      : `${moeda}/kg`;
}


export function formatarData(
  valor,
) {
  if (!valor) {
    return "-";
  }

  const [
    ano,
    mes,
    dia,
  ] =
    String(
      valor,
    ).split(
      "-",
    );

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return String(
      valor,
    );
  }

  return `${dia}/${mes}/${ano}`;
}


export function formatarDataCurta(
  valor,
) {
  const data =
    formatarData(
      valor,
    );

  return data ===
    "-"
      ? "-"
      : data.slice(
          0,
          5,
        );
}


export function formatarDataISO(
  data,
) {
  const ano =
    data.getFullYear();

  const mes =
    String(
      data.getMonth() +
      1,
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


export function adicionarDias(
  dataISO,
  quantidade,
) {
  const [
    ano,
    mes,
    dia,
  ] =
    String(
      dataISO,
    )
      .split(
        "-",
      )
      .map(
        Number,
      );

  const data =
    new Date(
      ano,
      mes - 1,
      dia,
    );

  data.setDate(
    data.getDate() +
    Number(
      quantidade ||
      0,
    ),
  );

  return formatarDataISO(
    data,
  );
}


export function obterPeriodoInicial() {
  const hoje =
    new Date();

  return {
    inicio:
      formatarDataISO(
        new Date(
          hoje.getFullYear(),
          hoje.getMonth(),
          1,
        ),
      ),

    fim:
      formatarDataISO(
        hoje,
      ),
  };
}


export function statusCompraAberta(
  status,
) {
  const valor =
    String(
      status ??
      "",
    )
      .trim()
      .toUpperCase();

  return (
    valor ===
      "PREVISTA" ||
    valor ===
      "CONFIRMADA"
  );
}
