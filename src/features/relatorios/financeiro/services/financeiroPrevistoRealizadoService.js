import { supabase } from "@/lib/supabaseClient";


function numero(valor) {
  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
}


function numeroOpcional(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : null;
}


function texto(valor) {
  return String(valor ?? "").trim();
}


function normalizarRegistroFinanceiro(registro) {
  const categoria =
    texto(registro?.categoria_financeira) ||
    texto(registro?.categoria);

  const tipo =
    texto(registro?.tipo_financeiro) ||
    texto(registro?.tipo);

  return {
    ...registro,

    codigo_categoria:
      texto(registro?.codigo_categoria),

    categoria_financeira:
      categoria || "-",

    tipo_financeiro:
      tipo || "-",

    /*
     * Mantemos também `tipo` para compatibilidade
     * com trechos antigos do módulo.
     */
    tipo:
      tipo || "-",

    valor_previsto:
      numero(registro?.valor_previsto),

    valor_realizado:
      numero(registro?.valor_realizado),

    variacao:
      numero(registro?.variacao),

    variacao_percentual:
      numeroOpcional(
        registro?.variacao_percentual,
      ),

    meses_com_dados:
      numero(registro?.meses_com_dados),
  };
}


export async function buscarAnosFinanceiros() {
  const { data, error } = await supabase
    .from("financeiro_omie_resumo")
    .select("ano")
    .order("ano", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return [
    ...new Set(
      (data || [])
        .map((item) => Number(item.ano))
        .filter(Number.isFinite),
    ),
  ];
}


export async function buscarPrevistoRealizadoFinanceiro({
  ano,
  mes,
  tipo,
}) {
  const {
    data,
    error,
  } = await supabase.rpc(
    "listar_relatorio_financeiro_previsto_realizado",
    {
      p_ano: Number(ano),
      p_mes_inicial: Number(mes),
      p_mes_final: Number(mes),
      p_tipo: tipo === "todos" ? null : tipo,
      p_limite: 5000,
    },
  );

  if (error) {
    throw error;
  }

  return Array.isArray(data)
    ? data.map(normalizarRegistroFinanceiro)
    : [];
}