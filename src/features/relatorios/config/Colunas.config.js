/* =========================================================
   CONFIGURAÇÃO CENTRAL DAS COLUNAS
========================================================= */


/* =========================================================
   NÚMERO
========================================================= */

function converterNumero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return 0;
  }

  if (
    typeof valor === "number"
  ) {
    return Number.isFinite(valor)
      ? valor
      : 0;
  }

  let texto =
    String(valor)
      .trim()
      .replace(/\s/g, "");


  if (
    texto.includes(",") &&
    texto.includes(".")
  ) {
    texto =
      texto
        .replace(/\./g, "")
        .replace(",", ".");
  } else {
    texto =
      texto.replace(",", ".");
  }


  const numero =
    Number(texto);


  return Number.isFinite(numero)
    ? numero
    : 0;
}


/* =========================================================
   FORMATAÇÃO NUMÉRICA
========================================================= */

function formatarNumero(
  valor,
  casas = 2,
) {
  return converterNumero(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits:
        casas,
    },
  );
}


/* =========================================================
   DATA
========================================================= */

function formatarData(valor) {
  if (!valor) {
    return "-";
  }

  const texto =
    String(valor).trim();


  const iso =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );


  if (iso) {
    return (
      `${iso[3]}/` +
      `${iso[2]}/` +
      `${iso[1]}`
    );
  }


  const br =
    texto.match(
      /^(\d{2})\/(\d{2})\/(\d{4})/,
    );


  if (br) {
    return (
      `${br[1]}/` +
      `${br[2]}/` +
      `${br[3]}`
    );
  }


  return texto;
}


/* =========================================================
   TÍTULO AUTOMÁTICO
========================================================= */

function criarTituloAutomatico(chave) {
  return String(
    chave || "",
  )
    .replace(
      /_/g,
      " ",
    )
    .replace(
      /\b\w/g,
      (letra) =>
        letra.toUpperCase(),
    );
}


/* =========================================================
   COLUNAS
========================================================= */

export const COLUNAS_RELATORIO = {


  /* =====================================================
     PRODUÇÃO
  ===================================================== */

  data: {
    titulo: "Data",

    larguraPdf: 22,

    valor: (item) =>
      formatarData(
        item.inicio_dia ||
          item.inicio ||
          item.data,
      ),
  },


  injetora: {
    titulo: "Injetora",

    larguraPdf: 32,

    valor: (item) =>
      item.injetora ||
      "-",
  },


  produto: {
    titulo: "Produto",

    larguraPdf: 30,

    valor: (item) =>
      item.cod_prod ||
      item.produto ||
      "-",
  },


  descricao_produto: {
    titulo:
      "Descrição do Produto",

    larguraPdf: 48,

    valor: (item) =>
      item.descricao_produto ||
      "-",
  },


  mp: {
    titulo:
      "Matéria-Prima",

    larguraPdf: 38,

    valor: (item) =>
      item.mp ||
      item.materia_prima ||
      "-",
  },


  tipo: {
    titulo: "Tipo",

    larguraPdf: 20,

    valor: (item) =>
      item.tipo ||
      "-",
  },


  conforme: {
    titulo: "Conforme",

    larguraPdf: 24,

    valor: (item) =>
      formatarNumero(
        item.conforme,
        2,
      ),
  },


  danificada: {
    titulo: "Danificada",

    larguraPdf: 24,

    valor: (item) =>
      formatarNumero(
        item.danificada,
        2,
      ),
  },


  total_produzido: {
    titulo:
      "Total Produzido",

    larguraPdf: 28,

    valor: (item) =>
      formatarNumero(
        item.total_produzido,
        2,
      ),
  },


  duracao: {
    titulo: "Duração",

    larguraPdf: 25,

    valor: (item) =>
      item.duracao ||
      item.tempo ||
      "-",
  },


  produtividade_hora: {
    titulo: "UN/H",

    larguraPdf: 22,

    valor: (item) =>
      formatarNumero(
        item.produtividade_hora,
        0,
      ),
  },


  qualidade: {
    titulo: "Qualidade",

    larguraPdf: 24,

    valor: (item) =>
      `${converterNumero(
        item.qualidade,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits:
            2,

          maximumFractionDigits:
            2,
        },
      )}%`,
  },


  op: {
    titulo: "OP",

    larguraPdf: 25,

    valor: (item) =>
      item.op ||
      "-",
  },


  descricao: {
    titulo: "Descrição",

    larguraPdf: 48,

    valor: (item) =>
      item.descricao ||
      item.justificativa ||
      item.natureza ||
      item.motivo ||
      "-",
  },
  
  pedidos_atendidos: {
  titulo:
    "Pedidos Atendidos",

  larguraPdf: 48,

  valor:
    (item) =>
      item.pedidos_atendidos ||
      "-",
},

  /* =====================================================
     PARADAS
  ===================================================== */

  motivo: {
    titulo: "Motivo",

    larguraPdf: 48,

    valor: (item) =>
      item.motivo ||
      "-",
  },


  justificativa: {
    titulo: "Justificativa",

    larguraPdf: 58,

    valor: (item) =>
      item.justificativa ||
      "-",
  },


  ocorrencias: {
    titulo: "Ocorrências",

    larguraPdf: 25,

    valor: (item) =>
      formatarNumero(
        item.ocorrencias,
        0,
      ),
  },


  tempo_total: {
    titulo: "Tempo Total",

    larguraPdf: 27,

    valor: (item) =>
      item.tempo_total ||
      "-",
  },


  tempo_medio: {
    titulo: "Tempo Médio",

    larguraPdf: 27,

    valor: (item) =>
      item.tempo_medio ||
      "-",
  },


  percentual_impacto: {
    titulo: "Impacto",

    larguraPdf: 24,

    valor: (item) =>
      `${converterNumero(
        item.percentual_impacto,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits:
            2,

          maximumFractionDigits:
            2,
        },
      )}%`,
  },


  /* =====================================================
     MATÉRIA-PRIMA
  ===================================================== */

  quantidade_mp: {
    titulo: "Qtd. MP",

    larguraPdf: 24,

    valor: (item) =>
      formatarNumero(
        item.quantidade_mp,
        2,
      ),
  },


  peso_unitario: {
    titulo:
      "Peso Unitário",

    larguraPdf: 28,

    valor: (item) =>
      converterNumero(
        item.peso_unitario,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits:
            4,

          maximumFractionDigits:
            4,
        },
      ),
  },


  consumo_total: {
    titulo:
      "Consumo Total",

    larguraPdf: 30,

    valor: (item) =>
      converterNumero(
        item.consumo_total,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits:
            4,

          maximumFractionDigits:
            4,
        },
      ),
  },


  gasto_unidade: {
    titulo:
      "Gasto por Unidade",

    larguraPdf: 34,

    valor: (item) =>
      converterNumero(
        item.gasto_unidade,
      ).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits:
            4,

          maximumFractionDigits:
            6,
        },
      ),
  },


  /* =====================================================
     PEDIDOS
  ===================================================== */

  pedido: {
    titulo: "Pedido",

    larguraPdf: 22,

    valor: (item) =>
      item.pedido ||
      "-",
  },


  cliente: {
    titulo: "Cliente",

    larguraPdf: 42,

    valor: (item) =>
      item.cliente ||
      "-",
  },


  data_pedido: {
    titulo:
      "Data do Pedido",

    larguraPdf: 25,

    valor: (item) =>
      formatarData(
        item.data_pedido,
      ),
  },


  previsao: {
    titulo:
      "Previsão Faturamento",

    larguraPdf: 29,

    valor: (item) =>
      formatarData(
        item.previsao,
      ),
  },


  dias_atraso: {
    titulo:
      "Dias em Atraso",

    larguraPdf: 24,

    valor: (item) =>
      formatarNumero(
        item.dias_atraso,
        0,
      ),
  },


  codigo_produto: {
    titulo: "Código",

    larguraPdf: 28,

    valor: (item) =>
      item.codigo_produto ||
      item.codigoProduto ||
      "-",
  },


  produto_pedido: {
    titulo: "Produto",

    larguraPdf: 62,

    valor: (item) =>
      item.produto_pedido ||
      item.produto ||
      "-",
  },


  quantidade: {
    titulo: "Quantidade",

    larguraPdf: 25,

    valor: (item) =>
      formatarNumero(
        item.quantidade,
        3,
      ),
  },


  unidade: {
    titulo: "Un.",

    larguraPdf: 16,

    valor: (item) =>
      item.unidade ||
      "-",
  },


  vendedor: {
    titulo: "Vendedor",

    larguraPdf: 32,

    valor: (item) =>
      item.vendedor ||
      "-",
  },


  status: {
    titulo: "Status",

    larguraPdf: 24,

    valor: (item) =>
      item.status ||
      "-",
  },


  pedidos: {
    titulo: "Pedidos",

    larguraPdf: 20,

    valor: (item) =>
      formatarNumero(
        item.pedidos,
        0,
      ),
  },
};


/* =========================================================
   OBTER COLUNAS
========================================================= */

export function obterColunasRelatorio(relatorio) {
  if (
    !relatorio ||
    !Array.isArray(
      relatorio.colunas,
    )
  ) {
    return [];
  }


  return relatorio
    .colunas
    .map(
      (chave) => {

        const configuracao =
          COLUNAS_RELATORIO[
            chave
          ];


        if (
          configuracao
        ) {
          return {
            chave,

            ...configuracao,
          };
        }


        return {
          chave,

          titulo:
            criarTituloAutomatico(
              chave,
            ),

          larguraPdf:
            30,

          valor:
            (item) => {

              const valor =
                item?.[chave];


              if (
                valor === null ||
                valor === undefined ||
                valor === ""
              ) {
                return "-";
              }


              return String(
                valor,
              );
            },
        };
      },
    );
}