import {
  SITUACOES_RECEBIMENTO,
} from "../constants/pedidosCompra.constants";

export function normalizarTexto(
  valor,
) {
  return String(
    valor ?? "",
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}

export function numeroSeguro(
  valor,
) {
  const numero =
    Number(valor);

  return Number.isFinite(
    numero,
  )
    ? numero
    : 0;
}

export function converterDataLocal(
  valor,
) {
  if (!valor) {
    return null;
  }

  const texto =
    String(
      valor,
    ).trim();

  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      texto,
    )
  ) {
    const [
      dia,
      mes,
      ano,
    ] = texto
      .split("/")
      .map(Number);

    return new Date(
      ano,
      mes - 1,
      dia,
      0,
      0,
      0,
      0,
    );
  }

  const iso =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );

  if (iso) {
    return new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      0,
      0,
      0,
      0,
    );
  }

  const data =
    new Date(texto);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return null;
  }

  return new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate(),
    0,
    0,
    0,
    0,
  );
}

export function obterHojeLocal() {
  const agora =
    new Date();

  return new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    0,
    0,
    0,
    0,
  );
}

export function formatarData(
  valor,
) {
  const data =
    converterDataLocal(
      valor,
    );

  return data
    ? data.toLocaleDateString(
        "pt-BR",
      )
    : "-";
}

export function formatarDataHora(
  valor,
) {
  if (!valor) {
    return "-";
  }

  const data =
    valor instanceof Date
      ? valor
      : new Date(valor);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "-";
  }

  return data.toLocaleString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

export function formatarHorario(
  valor,
) {
  if (!valor) {
    return "-";
  }

  const data =
    valor instanceof Date
      ? valor
      : new Date(valor);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "-";
  }

  return data.toLocaleTimeString(
    "pt-BR",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

export function formatarNumero(
  valor,
  casas = 0,
) {
  return numeroSeguro(
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

export function formatarMoeda(
  valor,
) {
  return numeroSeguro(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
}

export function calcularResumoItens(
  itens = [],
) {
  return itens.reduce(
    (
      acumulado,
      item,
    ) => {
      const quantidade =
        numeroSeguro(
          item?.quantidade,
        );

      const recebida =
        Math.min(
          numeroSeguro(
            item
              ?.quantidade_recebida,
          ),

          quantidade,
        );

      const saldo =
        Math.max(
          quantidade -
            recebida,

          0,
        );

      const precoUnitario =
        numeroSeguro(
          item?.preco_unitario,
        );

      const valorTotalInformado =
        numeroSeguro(
          item?.valor_total,
        );

      const valorTotal =
        valorTotalInformado ||
        quantidade *
          precoUnitario;

      acumulado.quantidade +=
        quantidade;

      acumulado.recebida +=
        recebida;

      acumulado.saldo +=
        saldo;

      acumulado.valorTotal +=
        valorTotal;

      acumulado.valorEmAberto +=
        saldo *
        precoUnitario;

      return acumulado;
    },

    {
      quantidade: 0,
      recebida: 0,
      saldo: 0,
      valorTotal: 0,
      valorEmAberto: 0,
    },
  );
}

export function obterSituacaoRecebimento(
  pedido,
) {
  if (
    pedido
      ?.tipo_documento ===
    "REQUISICAO"
  ) {
    return null;
  }

  const resumo =
    calcularResumoItens(
      pedido?.itens ?? [],
    );

  if (
    resumo.quantidade > 0 &&
    resumo.saldo <= 0
  ) {
    return SITUACOES_RECEBIMENTO.RECEBIDO;
  }

  if (
    resumo.recebida > 0 &&
    resumo.saldo > 0
  ) {
    return SITUACOES_RECEBIMENTO.RECEBIDO_PARCIALMENTE;
  }

  const previsao =
    converterDataLocal(
      pedido?.data_previsao,
    );

  const hoje =
    obterHojeLocal();

  if (
    resumo.saldo > 0 &&
    previsao &&
    previsao < hoje
  ) {
    return SITUACOES_RECEBIMENTO.EM_ATRASO;
  }

  return SITUACOES_RECEBIMENTO.EM_ABERTO;
}

export function obterRotuloSituacaoRecebimento(
  situacao,
) {
  if (
    !situacao
  ) {
    return "-";
  }

  switch (
    situacao
  ) {
    case SITUACOES_RECEBIMENTO.EM_ATRASO:
      return "Em atraso";

    case SITUACOES_RECEBIMENTO.RECEBIDO_PARCIALMENTE:
      return "Recebido parcialmente";

    case SITUACOES_RECEBIMENTO.RECEBIDO:
      return "Recebido";

    default:
      return "Em aberto";
  }
}

export function calcularDiasAtraso(
  valor,
) {
  const previsao =
    converterDataLocal(
      valor,
    );

  if (!previsao) {
    return 0;
  }

  const diferenca =
    obterHojeLocal().getTime() -
    previsao.getTime();

  return diferenca > 0
    ? Math.floor(
        diferenca /
          86400000,
      )
    : 0;
}

export function enriquecerPedido(
  pedido,
  itens = [],
  fornecedores = new Map(),
  compradores = new Map(),
) {
  const requisicao =
    pedido
      ?.tipo_documento ===
    "REQUISICAO";

  const codigoFornecedor =
    String(
      pedido
        ?.codigo_fornecedor ??
        "",
    ).trim();

  const codigoComprador =
    String(
      pedido
        ?.codigo_comprador ??
        "",
    ).trim();

  const resumo =
    calcularResumoItens(
      itens,
    );

  const situacaoRecebimento =
    obterSituacaoRecebimento({
      ...pedido,
      itens,
    });

  const fornecedorNome =
    String(
      fornecedores.get(
        codigoFornecedor,
      ) ?? "",
    ).trim();

  const compradorNome =
    String(
      compradores.get(
        codigoComprador,
      ) ?? "",
    ).trim();

  return {
    ...pedido,

    itens,

    fornecedor_nome:
      requisicao
        ? "-"
        : fornecedorNome ||
          "Fornecedor não identificado",

    comprador_nome:
      requisicao
        ? "-"
        : compradorNome ||
          "Comprador não identificado",

    situacao_recebimento:
      situacaoRecebimento,

    ...resumo,
  };
}

export function ordenarPedidos(
  pedidos = [],
) {
  const pesoSituacao = {
    [SITUACOES_RECEBIMENTO.EM_ATRASO]:
      0,

    [SITUACOES_RECEBIMENTO.EM_ABERTO]:
      1,

    [SITUACOES_RECEBIMENTO.RECEBIDO_PARCIALMENTE]:
      2,

    [SITUACOES_RECEBIMENTO.RECEBIDO]:
      3,
  };

  return [
    ...pedidos,
  ].sort(
    (
      a,
      b,
    ) => {
      const requisicaoA =
        a
          ?.tipo_documento ===
        "REQUISICAO";

      const requisicaoB =
        b
          ?.tipo_documento ===
        "REQUISICAO";

      const pesoA =
        requisicaoA
          ? 4
          : pesoSituacao[
              a
                ?.situacao_recebimento
            ] ?? 9;

      const pesoB =
        requisicaoB
          ? 4
          : pesoSituacao[
              b
                ?.situacao_recebimento
            ] ?? 9;

      if (
        pesoA !==
        pesoB
      ) {
        return (
          pesoA -
          pesoB
        );
      }

      const numeroA =
        String(
          a
            ?.numero_documento ??
            "",
        );

      const numeroB =
        String(
          b
            ?.numero_documento ??
            "",
        );

      return numeroB.localeCompare(
        numeroA,
        "pt-BR",
        {
          numeric:
            true,
        },
      );
    },
  );
}