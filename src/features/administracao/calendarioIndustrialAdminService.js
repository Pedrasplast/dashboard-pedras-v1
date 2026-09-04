import { supabase } from "@/lib/supabaseClient";

export const PREFIXO_FERIADO_NACIONAL = "FERIADO NACIONAL — ";

function validarAno(ano) {
  const numero = Number(ano);

  if (!Number.isInteger(numero) || numero < 2000 || numero > 2100) {
    throw new Error("Ano inválido para o calendário industrial.");
  }

  return numero;
}

function normalizarTexto(valor) {
  return String(valor ?? "").trim();
}

export function ehFeriadoNacionalAutomatico(item) {
  return normalizarTexto(item?.observacao)
    .toUpperCase()
    .startsWith(PREFIXO_FERIADO_NACIONAL);
}

export async function listarCalendarioIndustrialAno(ano) {
  const anoValido = validarAno(ano);

  const { data, error } = await supabase.rpc("listar_calendario_industrial", {
    p_data_inicio: `${anoValido}-01-01`,
    p_data_fim: `${anoValido}-12-31`,
  });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function salvarExcecaoCalendarioIndustrial({
  data,
  perfilCodigo,
  observacao,
}) {
  const { data: resultado, error } = await supabase.rpc(
    "salvar_excecao_calendario_industrial",
    {
      p_data: data,
      p_perfil_codigo: perfilCodigo,
      p_observacao: normalizarTexto(observacao) || null,
    },
  );

  if (error) {
    throw error;
  }

  return resultado?.[0] ?? null;
}

export async function removerExcecaoCalendarioIndustrial(data) {
  const { data: resultado, error } = await supabase.rpc(
    "remover_excecao_calendario_industrial",
    {
      p_data: data,
    },
  );

  if (error) {
    throw error;
  }

  return resultado?.[0] ?? null;
}

export async function buscarFeriadosNacionais(ano) {
  const anoValido = validarAno(ano);

  const resposta = await fetch(
    `https://brasilapi.com.br/api/feriados/v1/${anoValido}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!resposta.ok) {
    throw new Error(
      `Não foi possível consultar os feriados nacionais (${resposta.status}).`,
    );
  }

  const dados = await resposta.json();

  if (!Array.isArray(dados)) {
    throw new Error("A fonte de feriados retornou um formato inesperado.");
  }

  return dados
    .map((item) => ({
      data: normalizarTexto(item?.date),
      nome: normalizarTexto(item?.name).toLocaleUpperCase("pt-BR"),
      tipo: normalizarTexto(item?.type),
    }))
    .filter((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.data) && item.nome);
}

export async function sincronizarFeriadosNacionais({
  ano,
  calendarioAtual = [],
}) {
  const feriados = await buscarFeriadosNacionais(ano);

  const mapaAtual = new Map(
    (calendarioAtual ?? []).map((item) => [String(item.data), item]),
  );

  let inseridos = 0;
  let atualizados = 0;
  let preservados = 0;

  for (const feriado of feriados) {
    const existente = mapaAtual.get(feriado.data);
    const existeExcecao = existente?.origem === "EXCECAO";
    const ehAutomatico = ehFeriadoNacionalAutomatico(existente);

    // Uma decisão manual do administrador sempre prevalece.
    if (existeExcecao && !ehAutomatico) {
      preservados += 1;
      continue;
    }

    await salvarExcecaoCalendarioIndustrial({
      data: feriado.data,
      perfilCodigo: "SEM_PRODUCAO",
      observacao: `${PREFIXO_FERIADO_NACIONAL}${feriado.nome}`,
    });

    if (existeExcecao) {
      atualizados += 1;
    } else {
      inseridos += 1;
    }
  }

  return {
    totalFonte: feriados.length,
    inseridos,
    atualizados,
    preservados,
  };
}
