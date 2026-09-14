import { JORNADAS } from "../programacaoProducao.constants";
import { adicionarDias, chaveDataLocal, dataLocalMeiaNoite } from "./programacaoProducao.utils";
import {
  dataHoraAposSegundosEfetivos,
  jornadaParaData,
  segundosEfetivosDisponiveisNoDia,
} from "./calendarioProducao.utils";

function calcularPlanoProducaoPorQuantidade({
  quantidadeNecessaria,
  inicio,
  jornadaHoras,
  cicloSegundos,
  cavidades,
  periodos,
  trabalhaSabado = false,
  jornadaSabadoHoras = null,
  trabalhaDomingo = false,
  jornadaDomingoHoras = null,
}) {
  const producaoPorData = new Map();

  if (
    quantidadeNecessaria <= 0 ||
    !inicio ||
    Number.isNaN(inicio.getTime()) ||
    !JORNADAS.includes(jornadaHoras) ||
    cicloSegundos <= 0 ||
    cavidades <= 0
  ) {
    return { producaoPorData, termino: null, pecasPlanejadas: 0 };
  }

  const ciclosNecessarios = Math.ceil(quantidadeNecessaria / cavidades);
  let ciclosProduzidos = 0;
  let segundosEfetivosAcumulados = 0;
  let diaAtual = new Date(inicio);
  diaAtual.setHours(0, 0, 0, 0);
  let primeiroDia = true;
  let termino = null;

  for (let seguranca = 0; seguranca < 365 && ciclosProduzidos < ciclosNecessarios; seguranca += 1) {
    const segundosAntes = segundosEfetivosAcumulados;
    const ciclosAntes = ciclosProduzidos;
    const jornadaDoDia = jornadaParaData({
      data: diaAtual,
      jornadaHoras,
      trabalhaSabado,
      jornadaSabadoHoras,
      trabalhaDomingo,
      jornadaDomingoHoras,
    });
    const segundosDia = jornadaDoDia > 0
      ? segundosEfetivosDisponiveisNoDia({
          data: diaAtual,
          inicio,
          jornadaHoras: jornadaDoDia,
          periodos,
          primeiroDia,
        })
      : 0;

    segundosEfetivosAcumulados += segundosDia;
    const ciclosPossiveisAcumulados = Math.floor(segundosEfetivosAcumulados / cicloSegundos);
    const ciclosDia = Math.max(
      0,
      Math.min(ciclosNecessarios - ciclosProduzidos, ciclosPossiveisAcumulados - ciclosProduzidos),
    );
    const producaoDia = ciclosDia * cavidades;
    const chave = chaveDataLocal(diaAtual);

    producaoPorData.set(chave, {
      producao: producaoDia,
      segundos_efetivos: segundosDia,
      minutos_efetivos: segundosDia / 60,
    });

    ciclosProduzidos += ciclosDia;

    if (ciclosProduzidos >= ciclosNecessarios) {
      const residuoSegundosAnterior = Math.max(0, segundosAntes - ciclosAntes * cicloSegundos);
      const ciclosNecessariosNesteDia = ciclosNecessarios - ciclosAntes;
      const segundosNecessariosNesteDia = Math.max(
        0,
        ciclosNecessariosNesteDia * cicloSegundos - residuoSegundosAnterior,
      );
      termino = dataHoraAposSegundosEfetivos({
        data: diaAtual,
        inicio,
        jornadaHoras: jornadaDoDia,
        periodos,
        primeiroDia,
        segundosNecessarios: segundosNecessariosNesteDia,
      });
      break;
    }

    diaAtual = adicionarDias(diaAtual, 1);
    primeiroDia = false;
  }

  return {
    producaoPorData,
    termino,
    pecasPlanejadas: ciclosNecessarios * cavidades,
  };
}


export function calcularPlanoProducaoContinuo({
  inicio,
  dataFim,
  jornadaHoras,
  cicloSegundos,
  cavidades,
  periodos,
  trabalhaSabado = false,
  jornadaSabadoHoras = null,
  trabalhaDomingo = false,
  jornadaDomingoHoras = null,
}) {
  const producaoPorData = new Map();

  if (
    !inicio ||
    Number.isNaN(inicio.getTime()) ||
    !dataFim ||
    !JORNADAS.includes(jornadaHoras) ||
    cicloSegundos <= 0 ||
    cavidades <= 0
  ) {
    return { producaoPorData, termino: null, pecasPlanejadas: 0 };
  }

  let diaAtual = new Date(inicio);
  diaAtual.setHours(0, 0, 0, 0);

  let fim = dataLocalMeiaNoite(dataFim);
  if (fim < diaAtual) fim = new Date(diaAtual);

  let primeiroDia = true;
  let segundosEfetivosAcumulados = 0;
  let ciclosProduzidosAcumulados = 0;
  let pecasPlanejadas = 0;
  let termino = null;

  for (let seguranca = 0; diaAtual <= fim && seguranca < 366; seguranca += 1) {
    const jornadaDoDia = jornadaParaData({
      data: diaAtual,
      jornadaHoras,
      trabalhaSabado,
      jornadaSabadoHoras,
      trabalhaDomingo,
      jornadaDomingoHoras,
    });

    const segundosDia = jornadaDoDia > 0
      ? segundosEfetivosDisponiveisNoDia({
          data: diaAtual,
          inicio,
          jornadaHoras: jornadaDoDia,
          periodos,
          primeiroDia,
        })
      : 0;

    const ciclosAntes = ciclosProduzidosAcumulados;
    segundosEfetivosAcumulados += segundosDia;
    ciclosProduzidosAcumulados = Math.floor(
      segundosEfetivosAcumulados / cicloSegundos,
    );

    const ciclosDia = Math.max(0, ciclosProduzidosAcumulados - ciclosAntes);
    const producaoDia = ciclosDia * cavidades;
    const chave = chaveDataLocal(diaAtual);

    producaoPorData.set(chave, {
      producao: producaoDia,
      segundos_efetivos: segundosDia,
      minutos_efetivos: segundosDia / 60,
    });

    pecasPlanejadas += producaoDia;

    if (segundosDia > 0) {
      termino = dataHoraAposSegundosEfetivos({
        data: diaAtual,
        inicio,
        jornadaHoras: jornadaDoDia,
        periodos,
        primeiroDia,
        segundosNecessarios: segundosDia,
      });
    }

    diaAtual = adicionarDias(diaAtual, 1);
    primeiroDia = false;
  }

  return {
    producaoPorData,
    termino,
    pecasPlanejadas,
  };
}

export function calcularDataAtendimentoProducao({
  quantidadeNecessaria,
  inicio,
  jornadaHoras,
  cicloSegundos,
  cavidades,
  periodos,
  trabalhaSabado = false,
  jornadaSabadoHoras = null,
  trabalhaDomingo = false,
  jornadaDomingoHoras = null,
}) {
  return calcularPlanoProducaoPorQuantidade({
    quantidadeNecessaria,
    inicio,
    jornadaHoras,
    cicloSegundos,
    cavidades,
    periodos,
    trabalhaSabado,
    jornadaSabadoHoras,
    trabalhaDomingo,
    jornadaDomingoHoras,
  }).termino;
}

