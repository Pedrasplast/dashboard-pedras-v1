/* =========================================================
   AGENDA DA SINCRONIZACAO DE PEDIDOS (OMIE -> SUPABASE)
   ---------------------------------------------------------
   Deve refletir o cron "sincronizar-pedidos-omie-15min":
   a cada 15 minutos, de segunda a sexta, das 07:00 as 17:45
   (horario de Brasilia). Fora desse horario nada roda.
========================================================= */

export const AGENDA_SINCRONIZACAO_PEDIDOS = {
  intervaloMinutos: 15,
  horaInicial: 7,
  horaFinal: 17,
  diasUteis: [1, 2, 3, 4, 5],
};

function dentroDaAgenda(data, agenda) {
  const hora = data.getHours();
  return (
    agenda.diasUteis.includes(data.getDay()) &&
    hora >= agenda.horaInicial &&
    hora <= agenda.horaFinal
  );
}

/*
 * Retorna o proximo horario de sincronizacao estritamente
 * depois de "agora". Usa o horario local do navegador.
 */
export function obterProximaSincronizacaoPedidos(
  agora = new Date(),
  agenda = AGENDA_SINCRONIZACAO_PEDIDOS,
) {
  const base = agora instanceof Date ? agora : new Date(agora);
  const proxima = new Date(base);
  proxima.setSeconds(0, 0);

  const proximoSlot =
    (Math.floor(proxima.getMinutes() / agenda.intervaloMinutos) + 1) * agenda.intervaloMinutos;
  proxima.setMinutes(proximoSlot);

  // No maximo uma semana de avanço (fim de semana + feriado prolongado).
  for (let tentativas = 0; tentativas < 10 && !dentroDaAgenda(proxima, agenda); tentativas++) {
    if (agenda.diasUteis.includes(proxima.getDay()) && proxima.getHours() < agenda.horaInicial) {
      proxima.setHours(agenda.horaInicial, 0, 0, 0);
    } else {
      proxima.setDate(proxima.getDate() + 1);
      proxima.setHours(agenda.horaInicial, 0, 0, 0);
    }
  }

  return proxima;
}
