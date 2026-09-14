import { supabase } from "@/lib/supabaseClient";

import {
  LOCAL_ESTOQUE_MATRIZ,
  STATUS_PLANEJAMENTO,
} from "../programacaoProducao.constants";

function validarResultado(resultado) {
  if (resultado?.error) throw resultado.error;
  return resultado?.data ?? [];
}

export async function carregarDadosProgramacaoProducao() {
  const [
    pedidosResult,
    estoqueResult,
    parametrosResult,
    programacoesResult,
    periodosResult,
  ] = await Promise.all([
    supabase
      .from("pedidos_omie")
      .select(
        "codigo_pedido_omie,numero_pedido,cliente,data_pedido,previsao,codigo_produto,produto,quantidade,status",
      )
      .eq("ativo", true)
      .in("status", STATUS_PLANEJAMENTO),

    supabase
      .from("estoque_produto_acabado_omie")
      .select("codigo_produto,saldo")
      .eq("ativo", true)
      .eq("tipo_item", "04")
      .eq("codigo_local_estoque", LOCAL_ESTOQUE_MATRIZ),

    supabase
      .from("parametros_produto")
      .select("cod_prod,descricao,ciclo_segundos,cavidade_molde")
      .eq("ativo", true),

    supabase
      .from("programacao_producao")
      .select(
        "id,codigo_produto,inicio_em,jornada_horas,trabalha_sabado,jornada_sabado_horas,trabalha_domingo,jornada_domingo_horas,ativo",
      )
      .eq("ativo", true),

    supabase.rpc("listar_periodos_programacao"),
  ]);

  return {
    pedidos: validarResultado(pedidosResult),
    estoque: validarResultado(estoqueResult),
    parametros: validarResultado(parametrosResult),
    programacoes: validarResultado(programacoesResult),
    periodos: validarResultado(periodosResult),
  };
}

export async function salvarProgramacaoProducao({
  codigoProduto,
  inicio,
  jornadaHoras,
  trabalhaSabado,
  jornadaSabadoHoras,
  trabalhaDomingo,
  jornadaDomingoHoras,
}) {
  const { error } = await supabase.rpc(
    "salvar_programacao_producao_configuracao_v2",
    {
      p_codigo_produto: codigoProduto,
      p_inicio_em: inicio.toISOString(),
      p_jornada_horas: jornadaHoras,
      p_trabalha_sabado: trabalhaSabado,
      p_jornada_sabado_horas: trabalhaSabado ? jornadaSabadoHoras : null,
      p_trabalha_domingo: trabalhaDomingo,
      p_jornada_domingo_horas: trabalhaDomingo ? jornadaDomingoHoras : null,
    },
  );

  if (error) throw error;
}

export async function excluirProgramacaoProducao({ id, codigoProduto }) {
  const { error } = await supabase
    .from("programacao_producao")
    .update({ ativo: false })
    .eq("id", id)
    .eq("codigo_produto", codigoProduto);

  if (error) throw error;
}
