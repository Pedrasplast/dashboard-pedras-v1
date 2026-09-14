import { JORNADAS } from "../programacaoProducao.constants";
import { numero } from "./programacaoProducao.utils";

export function minutosHora(valor) {
  const partes = String(valor ?? "00:00:00").split(":");
  const hora = Number(partes[0] ?? 0);
  const minuto = Number(partes[1] ?? 0);
  return hora * 60 + minuto;
}

export function periodosDaJornada(periodos, jornadaHoras) {
  const codigo = `${jornadaHoras}H`;
  const encontrados = (periodos ?? [])
    .filter((item) => item?.perfil_codigo === codigo)
    .sort((a, b) => {
      if (numero(a.turno_ordem) !== numero(b.turno_ordem)) {
        return numero(a.turno_ordem) - numero(b.turno_ordem);
      }
      return numero(a.periodo_ordem) - numero(b.periodo_ordem);
    });

  if (encontrados.length > 0) return encontrados;

  if (jornadaHoras === 24) {
    return [{
      perfil_codigo: "24H",
      hora_inicio: "00:00:00",
      hora_fim: "24:00:00",
      desconto_intervalo_minutos: 0,
      duracao_minutos: 1440,
    }];
  }

  return [];
}

export function intervalosJornadaNaData(data, jornadaHoras, periodos) {
  const base = new Date(data);
  base.setHours(0, 0, 0, 0);

  return periodosDaJornada(periodos, jornadaHoras).map((periodo) => {
    const inicioMinutos = minutosHora(periodo.hora_inicio);
    let fimMinutos = minutosHora(periodo.hora_fim);
    if (fimMinutos <= inicioMinutos) fimMinutos += 24 * 60;

    const minutosBrutos = Math.max(0, fimMinutos - inicioMinutos);
    const minutosEfetivos = Math.max(
      0,
      Math.min(
        minutosBrutos,
        numero(periodo.duracao_minutos) ||
          minutosBrutos - numero(periodo.desconto_intervalo_minutos),
      ),
    );

    return {
      inicio: new Date(base.getTime() + inicioMinutos * 60 * 1000),
      fim: new Date(base.getTime() + fimMinutos * 60 * 1000),
      minutos_brutos: minutosBrutos,
      minutos_efetivos: minutosEfetivos,
      fator_efetivo: minutosBrutos > 0 ? minutosEfetivos / minutosBrutos : 1,
    };
  });
}

export function segundosEfetivosDisponiveisNoDia({ data, inicio, jornadaHoras, periodos, primeiroDia }) {
  let totalSegundos = 0;

  for (const intervalo of intervalosJornadaNaData(data, jornadaHoras, periodos)) {
    let inicioUtil = intervalo.inicio;
    if (primeiroDia && inicio && inicio > inicioUtil) inicioUtil = inicio;
    if (inicioUtil >= intervalo.fim) continue;

    if (inicioUtil <= intervalo.inicio) {
      totalSegundos += intervalo.minutos_efetivos * 60;
      continue;
    }

    const segundosBrutosRestantes = Math.max(
      0,
      Math.floor((intervalo.fim.getTime() - inicioUtil.getTime()) / 1000),
    );
    totalSegundos += Math.floor(segundosBrutosRestantes * intervalo.fator_efetivo);
  }

  return totalSegundos;
}

export function dataHoraAposSegundosEfetivos({
  data,
  inicio,
  jornadaHoras,
  periodos,
  primeiroDia,
  segundosNecessarios,
}) {
  let restante = Math.max(0, segundosNecessarios);

  for (const intervalo of intervalosJornadaNaData(data, jornadaHoras, periodos)) {
    let inicioUtil = intervalo.inicio;
    if (primeiroDia && inicio && inicio > inicioUtil) inicioUtil = inicio;
    if (inicioUtil >= intervalo.fim) continue;

    const segundosBrutosDisponiveis = Math.max(
      0,
      (intervalo.fim.getTime() - inicioUtil.getTime()) / 1000,
    );
    const segundosEfetivosDisponiveis = inicioUtil <= intervalo.inicio
      ? intervalo.minutos_efetivos * 60
      : segundosBrutosDisponiveis * intervalo.fator_efetivo;

    if (restante <= segundosEfetivosDisponiveis) {
      const fator = intervalo.fator_efetivo > 0 ? intervalo.fator_efetivo : 1;
      return new Date(inicioUtil.getTime() + (restante / fator) * 1000);
    }

    restante -= segundosEfetivosDisponiveis;
  }

  return null;
}

export function jornadaParaData({
  data,
  jornadaHoras,
  trabalhaSabado,
  jornadaSabadoHoras,
  trabalhaDomingo,
  jornadaDomingoHoras,
}) {
  const diaSemana = data.getDay();

  if (diaSemana === 6) {
    return trabalhaSabado && JORNADAS.includes(numero(jornadaSabadoHoras))
      ? numero(jornadaSabadoHoras)
      : 0;
  }

  if (diaSemana === 0) {
    return trabalhaDomingo && JORNADAS.includes(numero(jornadaDomingoHoras))
      ? numero(jornadaDomingoHoras)
      : 0;
  }

  return jornadaHoras;
}

