import { supabase } from "@/lib/supabaseClient";


/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarData(valor) {
  const data =
    String(
      valor ?? "",
    ).trim();

  return /^\d{4}-\d{2}-\d{2}$/.test(
    data,
  )
    ? data
    : "";
}


function normalizarNumero(valor) {
  const numero =
    Number(
      valor ?? 0,
    );

  return Number.isFinite(
    numero,
  )
    ? numero
    : 0;
}


function normalizarDiaCalendario(registro) {
  return {
    data:
      normalizarData(
        registro?.data,
      ),

    origem:
      String(
        registro?.origem ??
          "SEMANA",
      ).trim(),

    perfilCodigo:
      String(
        registro?.perfil_codigo ??
          "",
      ).trim(),

    perfilNome:
      String(
        registro?.perfil_nome ??
          "",
      ).trim(),

    perfilTipo:
      String(
        registro?.perfil_tipo ??
          "",
      ).trim(),

    minutosProgramados:
      normalizarNumero(
        registro?.minutos_programados,
      ),

    horasProgramadas:
      normalizarNumero(
        registro?.horas_programadas,
      ),

    observacao:
      String(
        registro?.observacao ??
          "",
      ).trim(),
  };
}


/* =========================================================
   LISTAR CALENDÁRIO INDUSTRIAL
========================================================= */

export async function listarCalendarioIndustrial({
  dataInicio,
  dataFim,
}) {
  const inicio =
    normalizarData(
      dataInicio,
    );

  const fim =
    normalizarData(
      dataFim,
    );


  if (!inicio) {
    throw new Error(
      "Data inicial do calendário industrial inválida.",
    );
  }


  if (!fim) {
    throw new Error(
      "Data final do calendário industrial inválida.",
    );
  }


  if (fim < inicio) {
    throw new Error(
      "A data final do calendário industrial não pode ser anterior à data inicial.",
    );
  }


  const {
    data,
    error,
  } =
    await supabase.rpc(
      "listar_calendario_industrial",
      {
        p_data_inicio:
          inicio,

        p_data_fim:
          fim,
      },
    );


  if (error) {
    throw error;
  }


  return (
    Array.isArray(
      data,
    )
      ? data
      : []
  )
    .map(
      normalizarDiaCalendario,
    )
    .filter(
      (item) =>
        Boolean(
          item.data,
        ),
    );
}


/* =========================================================
   SALVAR EXCEÇÃO
========================================================= */

export async function salvarExcecaoCalendarioIndustrial({
  data,
  perfilCodigo,
  observacao,
}) {
  const dataNormalizada =
    normalizarData(
      data,
    );

  const perfil =
    String(
      perfilCodigo ?? "",
    )
      .trim()
      .toUpperCase();


  if (!dataNormalizada) {
    throw new Error(
      "Data inválida.",
    );
  }


  if (!perfil) {
    throw new Error(
      "Selecione uma disponibilidade.",
    );
  }


  const {
    data: resultado,
    error,
  } =
    await supabase.rpc(
      "salvar_excecao_calendario_industrial",
      {
        p_data:
          dataNormalizada,

        p_perfil_codigo:
          perfil,

        p_observacao:
          String(
            observacao ?? "",
          ).trim() ||
          null,
      },
    );


  if (error) {
    throw error;
  }


  const registro =
    Array.isArray(
      resultado,
    )
      ? resultado[0]
      : resultado;


  return registro
    ? normalizarDiaCalendario(
        registro,
      )
    : null;
}


/* =========================================================
   REMOVER EXCEÇÃO
========================================================= */

export async function removerExcecaoCalendarioIndustrial(
  data,
) {
  const dataNormalizada =
    normalizarData(
      data,
    );


  if (!dataNormalizada) {
    throw new Error(
      "Data inválida.",
    );
  }


  const {
    data: resultado,
    error,
  } =
    await supabase.rpc(
      "remover_excecao_calendario_industrial",
      {
        p_data:
          dataNormalizada,
      },
    );


  if (error) {
    throw error;
  }


  const registro =
    Array.isArray(
      resultado,
    )
      ? resultado[0]
      : resultado;


  return registro
    ? normalizarDiaCalendario(
        registro,
      )
    : null;
}