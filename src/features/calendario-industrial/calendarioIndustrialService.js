import { supabase } from "@/lib/supabaseClient";


/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarData(valor) {
  const data = String(valor ?? "").trim();

  return /^\d{4}-\d{2}-\d{2}$/.test(data)
    ? data
    : "";
}


function normalizarNumero(valor) {
  const numero = Number(valor ?? 0);

  return Number.isFinite(numero)
    ? numero
    : 0;
}


function normalizarDiaCalendario(registro) {
  return {
    data: normalizarData(
      registro?.data,
    ),

    origem: String(
      registro?.origem ?? "SEMANA",
    ).trim(),

    perfilCodigo: String(
      registro?.perfil_codigo ?? "",
    ).trim(),

    perfilNome: String(
      registro?.perfil_nome ?? "",
    ).trim(),

    perfilTipo: String(
      registro?.perfil_tipo ?? "",
    ).trim(),

    minutosProgramados: normalizarNumero(
      registro?.minutos_programados,
    ),

    horasProgramadas: normalizarNumero(
      registro?.horas_programadas,
    ),

    observacao: String(
      registro?.observacao ?? "",
    ).trim(),
  };
}


/* =========================================================
   LISTAR CALENDÁRIO INDUSTRIAL

   SERVIÇO OPERACIONAL SOMENTE DE LEITURA

   USADO PELA PROGRAMAÇÃO PARA CONSULTAR:

   - DIA NORMAL = 24H
   - FERIADO = SEM PRODUÇÃO
   - EXCEÇÃO DEFINIDA PELO ADMINISTRADOR

   AS ALTERAÇÕES DO CALENDÁRIO FICAM EXCLUSIVAMENTE EM:

   src/features/administracao/
   calendarioIndustrialAdminService.js
========================================================= */

export async function listarCalendarioIndustrial({
  dataInicio,
  dataFim,
}) {
  const inicio = normalizarData(
    dataInicio,
  );

  const fim = normalizarData(
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
  } = await supabase.rpc(
    "listar_calendario_industrial",
    {
      p_data_inicio: inicio,
      p_data_fim: fim,
    },
  );


  if (error) {
    throw error;
  }


  return (
    Array.isArray(data)
      ? data
      : []
  )
    .map(
      normalizarDiaCalendario,
    )
    .filter(
      (item) =>
        Boolean(item.data),
    );
}