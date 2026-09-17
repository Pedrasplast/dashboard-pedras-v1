
/*
 * FORMATAÇÃO DO HISTÓRICO DE PEDIDOS DE COMPRA
 *
 * Regras:
 * 1. Não exibir mudanças de etapa (movimentação entre colunas).
 * 2. Não considerar preenchimentos iniciais de cadastro.
 * 3. Exibir alterações reais de preço, quantidade, valores,
 *    vencimento, prazo, condição de pagamento e observações.
 * 4. Transformar parcelas e departamentos em dados legíveis.
 * 5. Não modificar o histórico original do Supabase.
 */

const numeroBR = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 4,
});

const moedaBR = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const percentualBR = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function definido(valor) {
  return (
    valor !== null &&
    valor !== undefined &&
    valor !== ""
  );
}

function objeto(valor) {
  return valor &&
    typeof valor === "object" &&
    !Array.isArray(valor)
    ? valor
    : {};
}

function num(valor) {
  return typeof valor === "number"
    ? valor
    : Number(valor);
}

function moeda(valor) {
  return Number.isFinite(num(valor)) && definido(valor)
    ? moedaBR.format(num(valor))
    : "Não informado";
}

function quantidade(valor) {
  return Number.isFinite(num(valor)) && definido(valor)
    ? numeroBR.format(num(valor))
    : "Não informado";
}

function porcentagem(valor) {
  return definido(valor) && Number.isFinite(num(valor))
    ? `${percentualBR.format(num(valor))}%`
    : "Não informado";
}

function dataBR(valor) {
  const texto = String(valor ?? "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return texto.split("-").reverse().join("/");
  }

  return texto || "Não informado";
}

function valorAusente(valor) {
  return (
    !definido(valor) ||
    (typeof valor === "string" && !valor.trim())
  );
}

function codigoLegivel(valor, nome, mapa) {
  if (
    valorAusente(valor) ||
    String(valor).trim() === "0"
  ) {
    return "Não informado";
  }

  const codigo = String(valor).trim();
  const descricao = mapa?.[codigo];

  return descricao
    ? `${descricao} (cód. ${codigo})`
    : `${nome} ${codigo}`;
}

// ============================================================
// TIPOS DE CAMPOS
// ============================================================

const CAMPOS_MOEDA = new Set([
  "valor_total",
  "preco_unitario",
  "desconto",
  "despesas",
  "frete_item",
  "seguro",
  "nValor",
  "nValMerc",
  "nValTot",
  "nValUnit",
  "nValFrete",
  "nValOutras",
  "nValSeguro",
  "nDesconto",
  "nDespesas",
  "nFrete",
  "nSeguro",
]);

const CAMPOS_QUANTIDADE = new Set([
  "quantidade",
  "quantidade_recebida",
  "parcelas_quantidade",
  "nQtde",
  "nQtdeRec",
]);

const CAMPOS_DATA = new Set([
  "data_previsao",
  "data_inclusao",
  "dVencto",
  "dDtPrevisao",
]);

const DOC_TIPO = {
  BOL: "Boleto",
  CRC: "Cartão de crédito",
  DUP: "Duplicata",
  PIX: "Pix",
};

// ============================================================
// FORMATAÇÃO DOS VALORES
// ============================================================

export function formatarValorCompra(
  valor,
  campo = "",
  referencias = {}
) {
  if (valorAusente(valor)) {
    return "Não informado";
  }

  if (campo === "etapa") {
    return `Etapa ${valor}`;
  }

  if (campo === "fornecedor") {
    return codigoLegivel(
      valor,
      "Código Omie",
      referencias.fornecedores
    );
  }

  if (campo === "comprador") {
    return codigoLegivel(
      valor,
      "Código Omie",
      referencias.compradores
    );
  }

  if (campo === "local_estoque") {
    return codigoLegivel(
      valor,
      "Código Omie",
      referencias.locais
    );
  }

  if (campo === "cCodDepto") {
    return codigoLegivel(
      valor,
      "Departamento",
      referencias.departamentos
    );
  }

  if (campo === "nDias") {
    return Number.isFinite(num(valor))
      ? `${quantidade(valor)} dias`
      : String(valor);
  }

  if (campo === "nPerc") {
    return porcentagem(valor);
  }

  if (campo === "cTipoDoc") {
    return (
      DOC_TIPO[String(valor).toUpperCase()] ||
      String(valor)
    );
  }

  if (CAMPOS_MOEDA.has(campo)) {
    return moeda(valor);
  }

  if (CAMPOS_QUANTIDADE.has(campo)) {
    return quantidade(valor);
  }

  if (CAMPOS_DATA.has(campo)) {
    return dataBR(valor);
  }

  if (typeof valor === "boolean") {
    return valor ? "Sim" : "Não";
  }

  if (typeof valor === "number") {
    return numeroBR.format(valor);
  }

  if (Array.isArray(valor)) {
    return valor.length
      ? valor
          .map(
            (item, indice) =>
              `${indice + 1}. ${formatarValorCompra(
                item,
                "",
                referencias
              )}`
          )
          .join("\n")
      : "Nenhum registro";
  }

  if (typeof valor === "object") {
    return (
      Object.entries(valor)
        .map(
          ([chave, dado]) =>
            `${chave}: ${formatarValorCompra(
              dado,
              chave,
              referencias
            )}`
        )
        .join(" • ") || "Nenhum dado"
    );
  }

  return String(valor).trim() || "Não informado";
}

// ============================================================
// CAMPOS DE PARCELAS E DEPARTAMENTOS
// ============================================================

const PARCELAS = [
  ["dVencto", "Vencimento"],
  ["nValor", "Valor"],
  ["nDias", "Prazo"],
  ["cTipoDoc", "Tipo de documento"],
  ["nPercent", "Percentual"],
  ["nParcela", "Número"],
];

const DEPARTAMENTOS = [
  ["nPerc", "Percentual"],
  ["nValor", "Valor"],
];

function valorAninhado(valor, campo, referencias) {
  if (campo === "nPercent") {
    return porcentagem(valor);
  }

  return formatarValorCompra(
    valor,
    campo,
    referencias
  );
}

function resumoParcela(parcela, referencias) {
  const registro = objeto(parcela);

  return [
    `Parcela ${registro.nParcela ?? "?"}`,

    `Venc.: ${dataBR(registro.dVencto)}`,

    `Valor: ${moeda(registro.nValor)}`,

    `Prazo: ${formatarValorCompra(
      registro.nDias,
      "nDias",
      referencias
    )}`,

    `Documento: ${formatarValorCompra(
      registro.cTipoDoc,
      "cTipoDoc",
      referencias
    )}`,

    `Percentual: ${porcentagem(
      registro.nPercent
    )}`,
  ].join(" • ");
}

function resumoDepartamento(
  departamento,
  referencias
) {
  const registro = objeto(departamento);

  return [
    formatarValorCompra(
      registro.cCodDepto,
      "cCodDepto",
      referencias
    ),

    `Rateio: ${porcentagem(registro.nPerc)}`,

    `Valor: ${moeda(registro.nValor)}`,
  ].join(" • ");
}

// ============================================================
// IDENTIFICAÇÃO DE PREENCHIMENTOS INICIAIS
// ============================================================

function valorInicial(valor) {
  return (
    valor == null ||
    valor === "" ||
    valor === 0 ||
    valor === "0" ||
    (Array.isArray(valor) && valor.length === 0)
  );
}

function preenchimentoDeCadastro(
  chave,
  mudanca
) {
  const camposIniciais = new Set([
    "comprador",
    "fornecedor",
    "centro_custo",
    "codigo_integracao",
    "departamentos",
    "parcelas",
    "caracteristicas",
    "parcelas_quantidade",
  ]);

  const campoItem =
    /^item_\d+_local_estoque$/.test(chave);

  const registroInicial =
    camposIniciais.has(chave) ||
    campoItem;

  return (
    registroInicial &&
    valorInicial(mudanca.anterior) &&
    !valorInicial(mudanca.novo)
  );
}

// ============================================================
// COMPARAÇÃO DE PARCELAS E DEPARTAMENTOS
// ============================================================

function compararListas(
  mudanca,
  tipo,
  referencias
) {
  const anterior = Array.isArray(mudanca.anterior)
    ? mudanca.anterior
    : [];

  const novo = Array.isArray(mudanca.novo)
    ? mudanca.novo
    : [];

  const parcelas = tipo === "parcelas";

  const identificador = parcelas
    ? "nParcela"
    : "cCodDepto";

  const campos = parcelas
    ? PARCELAS
    : DEPARTAMENTOS;

  const mapaAnterior = new Map(
    anterior.map((registro, indice) => [
      String(
        objeto(registro)[identificador] ??
          indice
      ),

      objeto(registro),
    ])
  );

  const mapaNovo = new Map(
    novo.map((registro, indice) => [
      String(
        objeto(registro)[identificador] ??
          indice
      ),

      objeto(registro),
    ])
  );

  const identificadores = [
    ...new Set([
      ...mapaAnterior.keys(),
      ...mapaNovo.keys(),
    ]),
  ];

  const linhas = [];

  for (const id of identificadores) {
    const a = mapaAnterior.get(id);
    const n = mapaNovo.get(id);

    const rotulo = parcelas
      ? `Parcela ${id}`
      : formatarValorCompra(
          id,
          "cCodDepto",
          referencias
        );

    // Inclusão ou exclusão de parcela/departamento.
    if (!a || !n) {
      linhas.push({
        campo: `${rotulo} ${
          !a ? "adicionado(a)" : "removido(a)"
        }`,

        anterior: a
          ? parcelas
            ? resumoParcela(a, referencias)
            : resumoDepartamento(
                a,
                referencias
              )
          : "Não existia",

        novo: n
          ? parcelas
            ? resumoParcela(n, referencias)
            : resumoDepartamento(
                n,
                referencias
              )
          : "Removido",
      });

      continue;
    }

    // Comparação dos campos conhecidos.
    for (const [chave, titulo] of campos) {
      if (chave === identificador) {
        continue;
      }

      if (
        JSON.stringify(a[chave] ?? null) ===
        JSON.stringify(n[chave] ?? null)
      ) {
        continue;
      }

      // Primeiro preenchimento do tipo de documento
      // não representa revisão comercial.
      if (
        parcelas &&
        chave === "cTipoDoc" &&
        valorInicial(a[chave])
      ) {
        continue;
      }

      linhas.push({
        campo: `${rotulo} • ${titulo}`,

        anterior: valorAninhado(
          a[chave],
          chave,
          referencias
        ),

        novo: valorAninhado(
          n[chave],
          chave,
          referencias
        ),
      });
    }

    // Preserva a comparação de campos adicionais do Omie.
    for (const chave of new Set([
      ...Object.keys(a),
      ...Object.keys(n),
    ])) {
      if (
        chave === identificador ||
        campos.some(([campo]) => campo === chave)
      ) {
        continue;
      }

      if (
        JSON.stringify(a[chave] ?? null) ===
        JSON.stringify(n[chave] ?? null)
      ) {
        continue;
      }

      linhas.push({
        campo: `${rotulo} • ${chave}`,

        anterior: formatarValorCompra(
          a[chave],
          chave,
          referencias
        ),

        novo: formatarValorCompra(
          n[chave],
          chave,
          referencias
        ),
      });
    }
  }

  return linhas;
}

// ============================================================
// RÓTULOS DO FRETE
// ============================================================

const ROTULOS = {
  "frete.cTpFrete": "Tipo de frete",
  "frete.nValFrete": "Valor do frete",
  "frete.nValSeguro": "Seguro",
  "frete.nValOutras": "Outras despesas",
  "frete.nCodTransp":
    "Transportadora (código Omie)",
};

// ============================================================
// EXTRAÇÃO DAS ALTERAÇÕES RELEVANTES
// ============================================================

export function extrairMudancasCompra(
  evento,
  referencias = {}
) {
  const detalhes = objeto(evento?.detalhes);

  const resultado = [];

  for (const [chave, mudancaOriginal] of Object.entries(
    detalhes
  )) {
    const mudanca = objeto(mudancaOriginal);

    // ========================================================
    // REGRA 1 — IGNORAR ETAPA
    // ========================================================
    //
    // A movimentação entre colunas do Omie não é considerada
    // alteração comercial.
    //
    // Exemplos ignorados:
    // Etapa 10 -> 15
    // Etapa 15 -> 20
    // Etapa 20 -> 10
    //
    // A etapa continua armazenada no banco, mas não aparece
    // na tela, PDF, Excel ou contadores recalculados.
    // ========================================================

    if (chave === "etapa") {
      continue;
    }

    // ========================================================
    // REGRA 2 — IGNORAR PREENCHIMENTOS INICIAIS
    // ========================================================

    if (
      preenchimentoDeCadastro(
        chave,
        mudanca
      )
    ) {
      continue;
    }

    // ========================================================
    // REGRA 3 — PARCELAS E DEPARTAMENTOS
    // ========================================================

    if (
      chave === "parcelas" ||
      chave === "departamentos"
    ) {
      resultado.push(
        ...compararListas(
          mudanca,
          chave,
          referencias
        )
      );

      continue;
    }

    // ========================================================
    // REGRA 4 — FRETE
    // ========================================================

    if (
      chave === "frete" &&
      mudanca.anterior &&
      mudanca.novo
    ) {
      const anterior = objeto(
        mudanca.anterior
      );

      const novo = objeto(
        mudanca.novo
      );

      for (const campo of new Set([
        ...Object.keys(anterior),
        ...Object.keys(novo),
      ])) {
        if (
          JSON.stringify(
            anterior[campo] ?? null
          ) ===
          JSON.stringify(
            novo[campo] ?? null
          )
        ) {
          continue;
        }

        resultado.push({
          campo:
            ROTULOS[`frete.${campo}`] ||
            `Frete • ${campo}`,

          anterior: formatarValorCompra(
            anterior[campo],
            campo,
            referencias
          ),

          novo: formatarValorCompra(
            novo[campo],
            campo,
            referencias
          ),
        });
      }

      continue;
    }

    // ========================================================
    // REGRA 5 — ITENS ADICIONADOS OU REMOVIDOS
    // ========================================================

    let nome = mudanca.campo || chave;

    const item = mudanca.item || null;

    if (item) {
      nome += ` • Item ${item}`;
    }

    if (/^(adicionado_|removido_)/.test(chave)) {
      const valor =
        mudanca.anterior ||
        mudanca.novo;

      const produto = objeto(valor);

      const descricao = [
        produto.descricao ||
          produto.codigo_comercial ||
          "Produto sem descrição",

        produto.quantidade !== undefined
          ? `${quantidade(
              produto.quantidade
            )} un.`
          : null,

        produto.preco_unitario !== undefined
          ? moeda(
              produto.preco_unitario
            )
          : null,
      ]
        .filter(Boolean)
        .join(" • ");

      resultado.push({
        campo: nome,

        anterior: mudanca.anterior
          ? descricao
          : "Não existia",

        novo: mudanca.novo
          ? descricao
          : "Removido",
      });

      continue;
    }

    // ========================================================
    // REGRA 6 — CAMPOS INDIVIDUAIS
    // ========================================================

    const campoOriginal = chave.startsWith("item_")
      ? chave.split("_").slice(2).join("_")
      : chave;

    resultado.push({
      campo: nome,

      anterior: formatarValorCompra(
        mudanca.anterior,
        campoOriginal,
        referencias
      ),

      novo: formatarValorCompra(
        mudanca.novo,
        campoOriginal,
        referencias
      ),
    });
  }

  // ==========================================================
  // ORDENAÇÃO: ALTERAÇÕES COMERCIAIS PRIMEIRO
  // ==========================================================

  const prioridade = (nome) =>
    /preço|valor|quantidade|vencimento|previsão|prazo|produto/i.test(
      nome
    )
      ? 0
      : 1;

  return resultado.sort(
    (a, b) =>
      prioridade(a.campo) -
      prioridade(b.campo)
  );
}