import { supabase } from "@/lib/supabaseClient";

import {
  buscarProdutosPP,
} from "../produtos/produtosPPService";

import {
  buscarReceitas,
} from "../receitas/receitasService";

import {
  buscarProgramacaoAgrupada,
} from "./programacaoDiariaService";

/* =========================================================
   UTILITÁRIOS
========================================================= */

function numero(valor, fallback = 0) {
  const convertido = Number(valor);

  return Number.isFinite(convertido)
    ? convertido
    : fallback;
}

function montarProdutos({ produtos, receitas }) {
  const receitaPorCodigo = new Map(
    (receitas || []).map((receita) => [
      String(receita?.codigo ?? "").trim(),
      receita,
    ]),
  );

  return (produtos || [])
    .filter((produto) => produto?.ativo !== false)
    .map((produto) => {
      const codigo = String(
        produto?.codigoProduto ?? produto?.codigo ?? "",
      ).trim();

      const receita = receitaPorCodigo.get(codigo) ?? null;

      return {
        codigo,
        descricao:
          produto?.nomeProduto ??
          produto?.descricao ??
          "Sem descrição",
        pesoKg: numero(produto?.pesoKg, null),
        cicloSegundos: numero(produto?.cicloSegundos, null),
        cavidadeMolde: numero(produto?.cavidadeMolde, null),
        receitaConfigurada: receita?.configurada === true,
        receitaPercentualTotal: numero(receita?.percentualTotal),
        receitaItens: (receita?.itens ?? []).map((item) => ({
          fornecedorId: item?.fornecedorId ?? null,
          fornecedorNome: item?.fornecedorNome ?? "Fornecedor",
          percentual: numero(item?.percentual),
        })),
      };
    })
    .filter((produto) => produto.codigo)
    .sort((a, b) =>
      String(a.descricao).localeCompare(String(b.descricao), "pt-BR", {
        sensitivity: "base",
        numeric: true,
      }),
    );
}

/* =========================================================
   BUSCAR PROGRAMAÇÃO + PRODUTOS
========================================================= */

export async function buscarProgramacaoComCalendario() {
  const [programacao, produtosBrutos, dadosReceitas] = await Promise.all([
    buscarProgramacaoAgrupada({
      apenasAtivas: false,
    }),
    buscarProdutosPP(),
    buscarReceitas(),
  ]);

  const produtos = montarProdutos({
    produtos: produtosBrutos,
    receitas: dadosReceitas?.receitas ?? [],
  });

  return {
    programacao,
    produtos,
    fornecedores: dadosReceitas?.fornecedores ?? [],
  };
}

/* =========================================================
   TURNOS / PERÍODOS
========================================================= */

export async function listarPeriodosProgramacao() {
  const { data, error } = await supabase.rpc(
    "listar_periodos_programacao",
  );

  if (error) {
    throw error;
  }

  return (Array.isArray(data) ? data : []).map((registro) => ({
    perfilCodigo: String(registro?.perfil_codigo ?? "").trim(),
    perfilNome: String(registro?.perfil_nome ?? "").trim(),
    turnoCodigo: String(registro?.turno_codigo ?? "").trim(),
    turnoNome: String(registro?.turno_nome ?? "").trim(),
    turnoOrdem: numero(registro?.turno_ordem),
    periodoOrdem: numero(registro?.periodo_ordem),
    horaInicio: String(registro?.hora_inicio ?? "").slice(0, 5),
    horaFim: String(registro?.hora_fim ?? "").slice(0, 5),
    descontoIntervaloMinutos: numero(
      registro?.desconto_intervalo_minutos,
    ),
    duracaoMinutos: numero(registro?.duracao_minutos),
  }));
}

/* =========================================================
   SALVAR
========================================================= */

export async function salvarProgramacaoCalendario({
  id = null,
  codigoProduto,
  injetora,
  ativo = true,
  quantidade,
  dias,
}) {
  const diasNormalizados = (Array.isArray(dias) ? dias : []).map(
    (dia) => ({
      data: String(dia?.data ?? "").trim(),
      perfil_horas: String(dia?.perfilHoras ?? "").trim(),
      minutos_solicitados: Math.trunc(
        numero(dia?.minutosSolicitados),
      ),
      minutos_descontados: Math.trunc(
        numero(dia?.minutosDescontados),
      ),
    }),
  );

  const { data, error } = await supabase.rpc(
    "salvar_programacao_calendario",
    {
      p_id: id,
      p_codigo_produto: String(codigoProduto ?? "").trim(),
      p_injetora: String(injetora ?? "").trim(),
      p_ativo: Boolean(ativo),
      p_quantidade: Math.max(1, Math.trunc(numero(quantidade, 1))),
      p_dias: diasNormalizados,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   EXCLUIR
========================================================= */

export async function excluirProgramacao(id) {
  if (id === null || id === undefined) {
    throw new Error("Programação não informada.");
  }

  const { data, error } = await supabase
    .from("materia_prima_programacao")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
