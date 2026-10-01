import { supabase } from "@/lib/supabaseClient";

import {
  buscarCadastroReceitas,
} from "@/features/cadastros/receitas/cadastroReceitasService";

import {
  buscarProdutosPP,
} from "../produtos/produtosPPService";

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

function montarProdutos(produtos = []) {
  return (Array.isArray(produtos) ? produtos : [])
    .filter((produto) => produto?.ativo !== false)
    .map((produto) => {
      const codigo = String(
        produto?.codigoProduto ?? produto?.codigo ?? "",
      ).trim();

      return {
        codigo,
        descricao:
          produto?.nomeProduto ??
          produto?.descricao ??
          "Sem descrição",
        pesoKg: numero(produto?.pesoKg, null),
        cicloSegundos: numero(produto?.cicloSegundos, null),
        cavidadeMolde: numero(produto?.cavidadeMolde, null),
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

function montarReceitas(receitas = []) {
  return (Array.isArray(receitas) ? receitas : [])
    .filter(
      (receita) =>
        receita?.ativo === true &&
        receita?.configurada === true,
    )
    .map((receita) => ({
      id: receita.id,
      nome: String(receita?.nome ?? "").trim(),
      descricao: String(receita?.descricao ?? "").trim(),
      percentualTotal: numero(receita?.percentualTotal),
      configurada: receita?.configurada === true,
      ativo: receita?.ativo === true,
      itens: (Array.isArray(receita?.itens) ? receita.itens : []).map(
        (item) => ({
          fornecedorId: item?.fornecedorId ?? null,
          fornecedorNome: String(
            item?.fornecedorNome ?? "Fornecedor",
          ).trim(),
          percentual: numero(item?.percentual),
        }),
      ),
    }))
    .filter((receita) => receita.id && receita.nome)
    .sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", {
        sensitivity: "base",
        numeric: true,
      }),
    );
}

/* =========================================================
   BUSCAR PROGRAMAÇÃO + PRODUTOS + RECEITAS
========================================================= */

export async function buscarProgramacaoComCalendario() {
  const [programacao, produtosBrutos, cadastroReceitas] = await Promise.all([
    buscarProgramacaoAgrupada({
      apenasAtivas: false,
    }),
    buscarProdutosPP(),
    buscarCadastroReceitas(),
  ]);

  return {
    programacao,
    produtos: montarProdutos(produtosBrutos),
    receitas: montarReceitas(cadastroReceitas?.receitas ?? []),
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
      receita_id:
        dia?.receitaId === null ||
        dia?.receitaId === undefined ||
        dia?.receitaId === ""
          ? null
          : Number(dia.receitaId),
    }),
  );

  const { data, error } = await supabase.rpc(
    "salvar_programacao_calendario_v3",
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