import { supabase } from "../../../lib/supabaseClient";


/* =========================================================
   VALIDAR PERÍODO
========================================================= */

function validarPeriodo(
  ano,
  mes,
) {
  const anoNumero =
    Number(ano);

  const mesNumero =
    Number(mes);


  if (
    !Number.isInteger(
      anoNumero,
    ) ||
    anoNumero < 2000 ||
    anoNumero > 2100
  ) {
    throw new Error(
      "Ano inválido.",
    );
  }


  if (
    !Number.isInteger(
      mesNumero,
    ) ||
    mesNumero < 1 ||
    mesNumero > 12
  ) {
    throw new Error(
      "Mês inválido.",
    );
  }


  return {
    ano:
      anoNumero,

    mes:
      mesNumero,
  };
}


/* =========================================================
   ANOS DISPONÍVEIS

   Retorna somente anos que realmente possuem
   dados financeiros no banco.
========================================================= */

export async function buscarAnosFinanceiro() {
  const {
    data,
    error,
  } =
    await supabase.rpc(
      "listar_anos_financeiro",
    );


  if (error) {
    throw new Error(
      `Erro ao carregar anos financeiros: ${error.message}`,
    );
  }


  if (
    !Array.isArray(data)
  ) {
    return [];
  }


  return data
    .map(
      (registro) =>
        Number(
          registro?.ano,
        ),
    )
    .filter(
      (ano) =>
        Number.isInteger(
          ano,
        ),
    );
}


/* =========================================================
   RESUMO FINANCEIRO
========================================================= */

export async function buscarResumoFinanceiro(
  ano,
  mes,
) {
  const periodo =
    validarPeriodo(
      ano,
      mes,
    );


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "financeiro_omie_resumo",
      )
      .select(`
        id,
        ano,
        mes,
        tipo,
        codigo_categoria,
        categoria,
        valor_previsto,
        valor_realizado,
        sincronizado_em
      `)
      .eq(
        "ano",
        periodo.ano,
      )
      .eq(
        "mes",
        periodo.mes,
      )
      .order(
        "codigo_categoria",
        {
          ascending:
            true,
        },
      );


  if (error) {
    throw new Error(
      `Erro ao carregar financeiro: ${error.message}`,
    );
  }


  return Array.isArray(data)
    ? data
    : [];
}


/* =========================================================
   DETALHES
========================================================= */

export async function buscarDetalhesFinanceiro({
  ano,
  mes,
  codigoCategoria,
}) {
  const periodo =
    validarPeriodo(
      ano,
      mes,
    );


  const codigo =
    String(
      codigoCategoria ??
        "",
    ).trim();


  if (!codigo) {
    throw new Error(
      "Código da categoria não informado.",
    );
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "financeiro_omie_lancamentos",
      )
      .select(`
        id,
        ano,
        mes,
        codigo_titulo_omie,
        codigo_categoria,
        categoria,
        natureza,
        componente,
        data_referencia,
        codigo_cliente_fornecedor_omie,
        cliente_fornecedor,
        numero_documento,
        numero_pedido,
        data_emissao,
        data_vencimento,
        data_pagamento,
        valor_documento,
        valor_pago,
        valor_aberto,
        valor_componente,
        percentual_categoria,
        status,
        sincronizado_em
      `)
      .eq(
        "ano",
        periodo.ano,
      )
      .eq(
        "mes",
        periodo.mes,
      )
      .eq(
        "codigo_categoria",
        codigo,
      )
      .order(
        "data_referencia",
        {
          ascending:
            true,

          nullsFirst:
            false,
        },
      )
      .order(
        "codigo_titulo_omie",
        {
          ascending:
            true,
        },
      );


  if (error) {
    throw new Error(
      `Erro ao carregar detalhes financeiros: ${error.message}`,
    );
  }


  return Array.isArray(data)
    ? data
    : [];
}


/* =========================================================
   STATUS DA SINCRONIZAÇÃO
========================================================= */

export async function buscarStatusSincronizacaoFinanceiro() {
  const {
    data,
    error,
  } =
    await supabase
      .from(
        "sincronizacao_financeiro_omie",
      )
      .select(`
        id,
        ultima_sincronizacao,
        inicio_em,
        fim_em,
        status,
        etapa,
        ano,
        mes,
        quantidade_resumos,
        quantidade_lancamentos,
        duracao_ms,
        mensagem,
        atualizado_em
      `)
      .eq(
        "id",
        1,
      )
      .maybeSingle();


  if (error) {
    throw new Error(
      `Erro ao consultar sincronização financeira: ${error.message}`,
    );
  }


  return data ??
    null;
}


/* =========================================================
   VARIAÇÃO
========================================================= */

export function calcularVariacaoFinanceiro(
  previsto,
  realizado,
) {
  const valorPrevisto =
    Number(
      previsto ??
        0,
    );

  const valorRealizado =
    Number(
      realizado ??
        0,
    );


  const variacao =
    valorRealizado -
    valorPrevisto;


  const percentual =
    valorPrevisto !== 0
      ? (
          variacao /
          Math.abs(
            valorPrevisto,
          )
        ) *
        100
      : null;


  return {
    previsto:
      valorPrevisto,

    realizado:
      valorRealizado,

    variacao,

    percentual,
  };
}


/* =========================================================
   TIPO DA CATEGORIA
========================================================= */

export function identificarTipoCategoria(
  codigoCategoria,
) {
  const codigo =
    String(
      codigoCategoria ??
        "",
    ).trim();


  if (
    codigo === "1" ||
    codigo.startsWith(
      "1.",
    )
  ) {
    return "Receita";
  }


  if (
    codigo === "2" ||
    codigo.startsWith(
      "2.",
    )
  ) {
    return "Despesa";
  }


  return "Outro";
}