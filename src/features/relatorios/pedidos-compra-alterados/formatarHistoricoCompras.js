/* =========================================================
   HISTÓRICO DE PEDIDOS DE COMPRA

   - Preserva os eventos originais.
   - Identifica produtos pelo código do item.
   - Detalha parcelas e departamentos.
   - Calcula variações.
   - Protege dados de pagamento na apresentação.
========================================================= */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const decimal = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 4,
});

const obj = (x) =>
  x && typeof x === "object" && !Array.isArray(x)
    ? x
    : {};

const definido = (x) =>
  x !== undefined && x !== null && x !== "";

const n = (x) =>
  definido(x) && Number.isFinite(Number(x))
    ? Number(x)
    : null;

const dinheiro = (x) =>
  n(x) === null
    ? "Não informado"
    : brl.format(n(x));

const quant = (x) =>
  n(x) === null
    ? "Não informado"
    : decimal.format(n(x));

const iguais = (a, b) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/* =========================================================
   PROTEÇÃO DE DADOS DE PAGAMENTO
========================================================= */

function luhn(digitos) {
  let soma = 0;
  let duplicar = false;

  for (let i = digitos.length - 1; i >= 0; i--) {
    let d = Number(digitos[i]);

    if (duplicar) {
      d *= 2;

      if (d > 9) {
        d -= 9;
      }
    }

    soma += d;
    duplicar = !duplicar;
  }

  return soma % 10 === 0;
}

export function protegerDadosPagamento(valor) {
  if (valor === null || valor === undefined) {
    return "";
  }

  return String(valor)
    .replace(
      /\b((?:n[uú]mero\s+(?:do\s+)?cart[aã]o|cart[aã]o\s*(?:n[uú]mero|n[ºo])?|card\s*(?:number|no\.?))\s*[:=#-]?\s*)((?:\d[ -]?){12,19})/gi,
      (_trecho, rotulo) => `${rotulo}[NÚMERO PROTEGIDO]`
    )
    .replace(
      /\b((?:n[uú]mero|number)\s*[:=#-]\s*)((?:\d[ -]?){12,19})/gi,
      (_trecho, rotulo) => `${rotulo}[NÚMERO PROTEGIDO]`
    )
    .replace(
      /\b((?:cvv|cvc|c[oó]digo\s+de\s+seguran[cç]a)\s*[:=#-]?\s*)\d{3,4}\b/gi,
      (_trecho, rotulo) => `${rotulo}[PROTEGIDO]`
    )
    .replace(
      /\b(?:\d[ -]?){12,18}\d\b/g,
      (trecho) => {
        const digitos = trecho.replace(/\D/g, "");

        return digitos.length >= 13 &&
          digitos.length <= 19 &&
          luhn(digitos)
          ? "[NÚMERO PROTEGIDO]"
          : trecho;
      }
    );
}

/* =========================================================
   NOMENCLATURA DOS CAMPOS
========================================================= */

const NOMES = {
  numero: "Número do pedido",
  fornecedor: "Fornecedor",
  comprador: "Comprador",
  centro_custo: "Centro de custo",
  categoria: "Categoria",
  contrato: "Contrato",
  projeto: "Projeto",
  data_previsao: "Previsão de entrega",
  observacoes: "Observações do pedido",
  observacoes_internas: "Observações internas",
  condicao_pagamento: "Condição de pagamento",
  parcelas_quantidade: "Quantidade de parcelas",
  codigo_comercial: "Código do produto",
  codigo_produto: "Produto",
  descricao: "Descrição do produto",
  unidade: "Unidade de medida",
  quantidade: "Quantidade comprada",
  quantidade_recebida: "Quantidade recebida",
  preco_unitario: "Preço por unidade",
  valor_total: "Valor total do produto",
  desconto: "Desconto do produto",
  despesas: "Despesas do produto",
  frete_item: "Frete do produto",
  seguro: "Seguro do produto",
  local_estoque: "Local de estoque",
  observacao: "Observação do produto",
  frete: "Frete",
  parcelas: "Parcelas",
  departamentos: "Departamentos",
  caracteristicas: "Características",
  cTipoDoc: "Tipo de documento",
  dVencto: "Vencimento",
  nValor: "Valor",
  nDias: "Prazo",
  nPercent: "Percentual",
  nPerc: "Percentual",
};

const MONETARIOS = new Set([
  "preco_unitario",
  "valor_total",
  "desconto",
  "despesas",
  "frete_item",
  "seguro",
  "nValor",
  "nValFrete",
  "nValSeguro",
  "nValOutras",
]);

const QUANTIDADES = new Set([
  "quantidade",
  "quantidade_recebida",
  "parcelas_quantidade",
  "nQtde",
  "nQtdeRec",
  "nQtdVol",
]);

const DOCUMENTOS = {
  BOL: "Boleto",
  CRC: "Cartão de crédito",
  CHQ: "Cheque",
  DUP: "Duplicata",
  PIX: "Pix",
};

/* =========================================================
   REFERÊNCIAS
========================================================= */

function referencia(valor, mapa, rotulo) {
  if (!definido(valor) || String(valor) === "0") {
    return "Não informado";
  }

  const chave = String(valor);
  const nome = mapa?.[chave];

  return protegerDadosPagamento(
    nome
      ? `${nome} (código ${chave})`
      : `${rotulo}: ${chave}`
  );
}

/* =========================================================
   FORMATAR VALORES
========================================================= */

export function formatarValorCompra(
  valor,
  campo = "",
  referencias = {}
) {
  if (!definido(valor)) {
    return "Não informado";
  }

  if (MONETARIOS.has(campo)) {
    return dinheiro(valor);
  }

  if (QUANTIDADES.has(campo)) {
    return quant(valor);
  }

  if (campo === "nDias") {
    return `${quant(valor)} dias`;
  }

  if (campo === "nPercent" || campo === "nPerc") {
    return `${quant(valor)}%`;
  }

  if (
    campo === "data_previsao" ||
    campo === "data_inclusao" ||
    campo === "dVencto"
  ) {
    const str = String(valor);

    const iso =
      /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);

    return iso
      ? `${iso[3]}/${iso[2]}/${iso[1]}`
      : protegerDadosPagamento(str);
  }

  if (campo === "cTipoDoc") {
    return protegerDadosPagamento(
      DOCUMENTOS[valor] || String(valor)
    );
  }

  /* =====================================================
     CORREÇÃO: FORNECEDOR PELO NOME

     Utiliza o código do próprio valor histórico.
     Assim, o fornecedor antigo e o novo são
     identificados separadamente.

     Não substitui o fornecedor antigo pelo atual.
  ===================================================== */

  if (campo === "fornecedor") {
    const codigo = String(valor).trim();
    const nome = referencias.fornecedores?.[codigo];

    return protegerDadosPagamento(
      nome && String(nome).trim()
        ? String(nome).trim()
        : `Fornecedor não identificado (código ${codigo})`
    );
  }

  if (campo === "comprador") {
    return referencia(
      valor,
      referencias.compradores,
      "Comprador Omie"
    );
  }

  if (campo === "local_estoque") {
    return referencia(
      valor,
      referencias.locais,
      "Local Omie"
    );
  }

  if (campo === "cCodDepto") {
    return referencia(
      valor,
      referencias.departamentos,
      "Departamento Omie"
    );
  }

  if (typeof valor === "boolean") {
    return valor ? "Sim" : "Não";
  }

  if (typeof valor === "number") {
    return quant(valor);
  }

  if (Array.isArray(valor)) {
    return valor.length
      ? valor
          .map((item) =>
            formatarValorCompra(item, "", referencias)
          )
          .join("\n")
      : "Nenhum registro";
  }

  if (typeof valor === "object") {
    return Object.entries(valor)
      .map(
        ([chave, dado]) =>
          `${
            NOMES[chave] ||
            protegerDadosPagamento(chave)
          }: ${formatarValorCompra(
            dado,
            chave,
            referencias
          )}`
      )
      .join(" • ");
  }

  return protegerDadosPagamento(String(valor).trim());
}

/* =========================================================
   VARIAÇÃO DE VALORES
========================================================= */

function variacao(
  antes,
  depois,
  campo,
  unidade = ""
) {
  const a = n(antes);
  const b = n(depois);

  if (a === null || b === null || a === b) {
    return "";
  }

  const direcao = b > a ? "Aumento" : "Redução";

  if (MONETARIOS.has(campo)) {
    return (
      `${direcao} de ${dinheiro(Math.abs(b - a))}` +
      (campo === "preco_unitario"
        ? " por unidade"
        : "")
    );
  }

  if (QUANTIDADES.has(campo)) {
    return (
      `${direcao} de ${quant(Math.abs(b - a))}` +
      (unidade
        ? ` ${protegerDadosPagamento(unidade)}`
        : "")
    );
  }

  if (campo === "nDias") {
    return `${direcao} de ${quant(
      Math.abs(b - a)
    )} dias`;
  }

  return "";
}

/* =========================================================
   IDENTIFICAÇÃO DO PRODUTO
========================================================= */

function identificarProduto(
  codigoItem,
  mudanca,
  referencias
) {
  const atual = obj(
    referencias.itens?.[String(codigoItem)]
  );

  const anterior = obj(mudanca.anterior);
  const novo = obj(mudanca.novo);

  const item = {
    ...atual,
    ...anterior,
    ...novo,
  };

  return {
    codigoItem: String(codigoItem),

    descricao: protegerDadosPagamento(
      item.descricao ||
        "Produto sem descrição disponível"
    ),

    codigoComercial: protegerDadosPagamento(
      item.codigo_comercial ||
        item.codigoComercial ||
        ""
    ),

    unidade: protegerDadosPagamento(
      item.unidade || ""
    ),
  };
}

function nomeProduto(produto) {
  if (!produto) {
    return "";
  }

  return (
    produto.descricao +
    (produto.codigoComercial
      ? ` — cód. ${produto.codigoComercial}`
      : "")
  );
}

/* =========================================================
   CRIAR MUDANÇA
========================================================= */

function criarMudanca(
  titulo,
  anterior,
  novo,
  campo,
  referencias,
  produto = null
) {
  return {
    campo: protegerDadosPagamento(
      produto
        ? `${titulo} • ${nomeProduto(produto)}`
        : titulo
    ),

    tituloCurto: protegerDadosPagamento(titulo),

    produto,

    anterior: formatarValorCompra(
      anterior,
      campo,
      referencias
    ),

    novo: formatarValorCompra(
      novo,
      campo,
      referencias
    ),

    variacao: protegerDadosPagamento(
      variacao(
        anterior,
        novo,
        campo,
        produto?.unidade
      )
    ),
  };
}

/* =========================================================
   PARCELAS E DEPARTAMENTOS
========================================================= */

const PARCELA = [
  ["dVencto", "Vencimento"],
  ["nValor", "Valor da parcela"],
  ["nDias", "Prazo de pagamento"],
  ["cTipoDoc", "Tipo de documento"],
  ["nPercent", "Percentual da parcela"],
];

const DEPARTAMENTO = [
  ["nPerc", "Percentual de rateio"],
  ["nValor", "Valor do rateio"],
];

function compararListas(
  mudanca,
  tipo,
  referencias
) {
  const antes = Array.isArray(mudanca.anterior)
    ? mudanca.anterior
    : [];

  const depois = Array.isArray(mudanca.novo)
    ? mudanca.novo
    : [];

  const parcelas = tipo === "parcelas";

  const idCampo = parcelas
    ? "nParcela"
    : "cCodDepto";

  const campos = parcelas
    ? PARCELA
    : DEPARTAMENTO;

  const a = new Map(
    antes.map((v, i) => [
      String(v?.[idCampo] ?? i),
      obj(v),
    ])
  );

  const b = new Map(
    depois.map((v, i) => [
      String(v?.[idCampo] ?? i),
      obj(v),
    ])
  );

  const saida = [];

  for (
    const id of new Set([
      ...a.keys(),
      ...b.keys(),
    ])
  ) {
    const anterior = a.get(id);
    const novo = b.get(id);

    const titulo = parcelas
      ? `Parcela ${id}`
      : referencia(
          id,
          referencias.departamentos,
          "Departamento Omie"
        );

    if (!anterior || !novo) {
      const rotulo =
        `${titulo} ` +
        (novo ? "adicionada" : "removida");

      saida.push(
        criarMudanca(
          rotulo,
          anterior ?? null,
          novo ?? null,
          "",
          referencias
        )
      );

      continue;
    }

    for (const [campo, nome] of campos) {
      if (
        !iguais(
          anterior[campo],
          novo[campo]
        )
      ) {
        saida.push(
          criarMudanca(
            `${titulo} • ${nome}`,
            anterior[campo],
            novo[campo],
            campo,
            referencias
          )
        );
      }
    }
  }

  return saida;
}

/* =========================================================
   FRETE
========================================================= */

const FRETE = {
  cTpFrete: "Tipo de frete",
  nCodTransp: "Transportadora",
  nValFrete: "Valor do frete",
  nValOutras: "Outras despesas do frete",
  nValSeguro: "Seguro do frete",
  nPesoBruto: "Peso bruto",
  nPesoLiq: "Peso líquido",
  nQtdVol: "Quantidade de volumes",
};

/* =========================================================
   EXTRAIR ALTERAÇÕES
========================================================= */

export function extrairMudancasCompra(
  evento,
  referencias = {}
) {
  const saida = [];

  for (
    const [chave, entrada] of
    Object.entries(obj(evento?.detalhes))
  ) {
    const mudanca = obj(entrada);

    // Identificadores técnicos não são mudanças comerciais.

    if (
      chave === "etapa" ||
      chave === "codigo" ||
      chave === "codigo_integracao"
    ) {
      continue;
    }

    if (
      iguais(
        mudanca.anterior,
        mudanca.novo
      )
    ) {
      continue;
    }

    // PARCELAS E DEPARTAMENTOS

    if (
      chave === "parcelas" ||
      chave === "departamentos"
    ) {
      saida.push(
        ...compararListas(
          mudanca,
          chave,
          referencias
        )
      );

      continue;
    }

    // FRETE

    if (chave === "frete") {
      const anterior = obj(mudanca.anterior);
      const novo = obj(mudanca.novo);

      for (
        const campo of new Set([
          ...Object.keys(anterior),
          ...Object.keys(novo),
        ])
      ) {
        if (
          !iguais(
            anterior[campo],
            novo[campo]
          )
        ) {
          saida.push(
            criarMudanca(
              FRETE[campo] ||
                `Frete • ${campo}`,
              anterior[campo],
              novo[campo],
              campo,
              referencias
            )
          );
        }
      }

      continue;
    }

    // ITEM ADICIONADO OU REMOVIDO

    const addRm =
      /^(adicionado|removido)_(\d+)$/.exec(chave);

    if (addRm) {
      const adicionado =
        addRm[1] === "adicionado";

      const produto = identificarProduto(
        addRm[2],
        mudanca,
        referencias
      );

      const dados = obj(
        adicionado
          ? mudanca.novo
          : mudanca.anterior
      );

      const resumo = [
        nomeProduto(produto),

        `Quantidade: ${quant(
          dados.quantidade
        )} ${produto.unidade}`,

        `Preço unitário: ${dinheiro(
          dados.preco_unitario
        )}`,

        `Valor do item: ${dinheiro(
          dados.valor_total
        )}`,
      ].join("\n");

      saida.push({
        campo:
          `${
            adicionado
              ? "Produto adicionado"
              : "Produto removido"
          } • ${nomeProduto(produto)}`,

        tituloCurto: adicionado
          ? "Produto adicionado"
          : "Produto removido",

        produto,

        anterior: adicionado
          ? "Não constava no pedido"
          : protegerDadosPagamento(resumo),

        novo: adicionado
          ? protegerDadosPagamento(resumo)
          : "Removido do pedido",

        variacao: "",
      });

      continue;
    }

    // ALTERAÇÃO DE ITEM EXISTENTE

    const item =
      /^item_(\d+)_(.+)$/.exec(chave);

    if (item) {
      const produto = identificarProduto(
        item[1],
        mudanca,
        referencias
      );

      const nome =
        NOMES[item[2]] ||
        mudanca.campo ||
        item[2].replaceAll("_", " ");

      saida.push(
        criarMudanca(
          nome,
          mudanca.anterior,
          mudanca.novo,
          item[2],
          referencias,
          produto
        )
      );

      continue;
    }

    // INFORMAÇÕES GERAIS

    const nome =
      NOMES[chave] ||
      mudanca.campo ||
      chave.replaceAll("_", " ");

    saida.push(
      criarMudanca(
        nome,
        mudanca.anterior,
        mudanca.novo,
        chave,
        referencias
      )
    );
  }

  function importante(mudanca) {
    return /preço|valor|quantidade|vencimento|prazo/i.test(
      mudanca.tituloCurto
    )
      ? 0
      : 1;
  }

  return saida.sort(
    (a, b) =>
      importante(a) - importante(b)
  );
}