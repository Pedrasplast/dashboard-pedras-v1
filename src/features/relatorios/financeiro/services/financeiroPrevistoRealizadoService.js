import { supabase } from "@/lib/supabaseClient";
import { paraNumero, paraNumeroOuNull } from "@/shared/lib/numeros";
import { paraTexto } from "@/shared/lib/texto";

function normalizarRegistroFinanceiro(registro) {
  const categoria = paraTexto(registro?.categoria_financeira) || paraTexto(registro?.categoria);

  const tipo = paraTexto(registro?.tipo_financeiro) || paraTexto(registro?.tipo);

  return {
    ...registro,

    codigo_categoria: paraTexto(registro?.codigo_categoria),

    categoria_financeira: categoria || "-",

    tipo_financeiro: tipo || "-",

    /*
     * Mantemos também `tipo` para compatibilidade
     * com trechos antigos do módulo.
     */
    tipo: tipo || "-",

    valor_previsto: paraNumero(registro?.valor_previsto),

    valor_realizado: paraNumero(registro?.valor_realizado),

    variacao: paraNumero(registro?.variacao),

    variacao_percentual: paraNumeroOuNull(registro?.variacao_percentual),

    meses_com_dados: paraNumero(registro?.meses_com_dados),
  };
}

export async function buscarAnosFinanceiros() {
  const { data, error } = await supabase.from("financeiro_omie_resumo").select("ano").order("ano", {
    ascending: false,
  });

  if (error) {
    throw error;
  }

  return [...new Set((data || []).map((item) => Number(item.ano)).filter(Number.isFinite))];
}

export async function buscarPrevistoRealizadoFinanceiro({ ano, mes, tipo }) {
  const { data, error } = await supabase.rpc("listar_relatorio_financeiro_previsto_realizado", {
    p_ano: Number(ano),
    p_mes_inicial: Number(mes),
    p_mes_final: Number(mes),
    p_tipo: tipo === "todos" ? null : tipo,
    p_limite: 5000,
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data.map(normalizarRegistroFinanceiro) : [];
}
