import { obterHojeISO } from "@/shared/lib/datas";
import { formatarNumeroPtBR } from "@/shared/lib/formatar";

/* =========================================================
   PROGRAMAÇÃO DE INJETORAS: REGRAS DO MODAL

   Constantes e funções puras usadas pelo ProgramacaoModal:
   datas da grade, perfis de horas, tempo já passado hoje e
   conflito com outra programação da mesma injetora.
========================================================= */

/* =========================================================
   CONSTANTES
========================================================= */

export const INJETORAS = Array.from(
  {
    length: 11,
  },
  (_, indice) => String(indice + 1).padStart(2, "0"),
);

export const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const PERFIS = [
  {
    codigo: "5H",
    minutos: 300,
    rotulo: "5h",
  },

  {
    codigo: "17H",
    minutos: 1020,
    rotulo: "17h",
  },

  {
    codigo: "22H",
    minutos: 1320,
    rotulo: "22h",
  },

  {
    codigo: "24H",
    minutos: 1440,
    rotulo: "24h",
  },
];

/* =========================================================
   UTILITÁRIOS
========================================================= */

export function criarDataLocal(valor) {
  const [ano, mes, dia] = String(valor ?? "")
    .split("-")
    .map(Number);

  if (!ano || !mes || !dia) {
    return null;
  }

  return new Date(ano, mes - 1, dia, 12, 0, 0);
}

export function formatarDataVisual(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return valor || "-";
  }

  return data.toLocaleDateString("pt-BR");
}

export function formatarNumero(valor, casas = 0) {
  const numero = Number(valor ?? 0);

  if (!Number.isFinite(numero)) {
    return "0";
  }

  return formatarNumeroPtBR(numero, {
    minimumFractionDigits: casas,

    maximumFractionDigits: casas,
  });
}

export function formatarKg(valor) {
  return `${formatarNumero(valor, 2)} kg`;
}

export function formatarMinutos(minutos) {
  const total = Math.max(0, Math.round(Number(minutos ?? 0)));

  const horas = Math.floor(total / 60);

  const resto = total % 60;

  if (resto === 0) {
    return `${horas}h`;
  }

  return `${horas}h${String(resto).padStart(2, "0")}`;
}

export function obterInicioMes(referencia) {
  return new Date(referencia.getFullYear(), referencia.getMonth(), 1, 12, 0, 0);
}

export function adicionarMeses(referencia, quantidade) {
  return new Date(referencia.getFullYear(), referencia.getMonth() + quantidade, 1, 12, 0, 0);
}

export function criarDiasGrade(referencia) {
  const primeiro = obterInicioMes(referencia);

  const ultimo = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0, 12, 0, 0);

  const deslocamentoInicio = (primeiro.getDay() + 6) % 7;

  const inicio = new Date(primeiro);

  inicio.setDate(primeiro.getDate() - deslocamentoInicio);

  const deslocamentoFim = (7 - ((ultimo.getDay() + 6) % 7) - 1) % 7;

  const fim = new Date(ultimo);

  fim.setDate(ultimo.getDate() + deslocamentoFim);

  const dias = [];

  const atual = new Date(inicio);

  while (atual <= fim) {
    dias.push(new Date(atual));

    atual.setDate(atual.getDate() + 1);
  }

  return dias;
}

export function minutosHorario(hora) {
  const [horas, minutos] = String(hora ?? "")
    .slice(0, 5)
    .split(":")
    .map(Number);

  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) {
    return null;
  }

  return horas * 60 + minutos;
}

export function dataEhPassada(dataISO) {
  if (!dataISO) {
    return false;
  }

  return dataISO < obterHojeISO();
}

export function perfilBasePorLimite(limite) {
  if (limite >= 1440) {
    return "24H";
  }

  if (limite >= 1320) {
    return "22H";
  }

  if (limite >= 1020) {
    return "17H";
  }

  if (limite >= 300) {
    return "5H";
  }

  return null;
}

/* =========================================================
   RESUMO DO NOME DO FERIADO
========================================================= */

export function resumirNomeFeriado(observacao) {
  const texto = String(observacao ?? "").trim();

  if (!texto) {
    return "";
  }

  const mapa = [
    [/confraterniza/i, "ANO NOVO"],

    [/carnaval/i, "CARNAVAL"],

    [/sexta[- ]feira santa|paix[aã]o de cristo/i, "PAIXÃO DE CRISTO"],

    [/\bp[aá]scoa\b/i, "PÁSCOA"],

    [/tiradent/i, "TIRADENTES"],

    [/trabalhador|trabalho/i, "DIA DO TRABALHO"],

    [/corpus christi/i, "CORPUS CHRISTI"],

    [/independ/i, "INDEPENDÊNCIA"],

    [/aparecida|padroeira/i, "APARECIDA"],

    [/finados/i, "FINADOS"],

    [/proclama/i, "REPÚBLICA"],

    [/consci[eê]ncia negra/i, "CONSCIÊNCIA NEGRA"],

    [/natal/i, "NATAL"],
  ];

  for (const [regex, resumo] of mapa) {
    if (regex.test(texto)) {
      return resumo;
    }
  }

  const limpo = texto
    .replace(/^feriado\s*(nacional|estadual|municipal)?\s*[-–:]?\s*/i, "")
    .replace(/^dia\s+de\s+/i, "")
    .trim();

  if (!limpo) {
    return "FERIADO";
  }

  return limpo.toLocaleUpperCase("pt-BR").slice(0, 24);
}

/* =========================================================
   TEMPO PASSADO HOJE
========================================================= */

export function calcularMinutosPassadosEmPeriodos(periodos, agoraMinutos) {
  let total = 0;

  for (const periodo of periodos) {
    const inicio = minutosHorario(periodo.horaInicio);

    const fim = minutosHorario(periodo.horaFim);

    if (inicio === null || fim === null) {
      continue;
    }

    const cruzaMeiaNoite = fim <= inicio;

    const duracaoBruta = cruzaMeiaNoite ? 1440 - inicio + fim : fim - inicio;

    let decorrido = 0;

    if (!cruzaMeiaNoite) {
      if (agoraMinutos <= inicio) {
        decorrido = 0;
      } else if (agoraMinutos >= fim) {
        decorrido = duracaoBruta;
      } else {
        decorrido = agoraMinutos - inicio;
      }
    } else if (agoraMinutos < fim) {
      decorrido = 1440 - inicio + agoraMinutos;
    } else if (agoraMinutos >= inicio) {
      decorrido = agoraMinutos - inicio;
    } else {
      decorrido = 0;
    }

    const desconto = Number(periodo.descontoIntervaloMinutos ?? 0);

    if (decorrido >= duracaoBruta && desconto > 0) {
      decorrido -= desconto;
    }

    total += Math.max(0, Math.min(Number(periodo.duracaoMinutos ?? decorrido), decorrido));
  }

  return Math.max(0, Math.round(total));
}

export function calcularMinutosDescontadosHoje({
  data,
  perfilHoras,
  minutosSolicitados,
  limiteMinutos,
  periodos,
}) {
  if (data !== obterHojeISO()) {
    return 0;
  }

  if (!perfilHoras || minutosSolicitados <= 0) {
    return 0;
  }

  const agora = new Date();

  const agoraMinutos = agora.getHours() * 60 + agora.getMinutes();

  if (perfilHoras === "24H") {
    return Math.min(Math.max(0, minutosSolicitados - 1), agoraMinutos);
  }

  const perfilCalculo = perfilHoras === "OUTRO" ? perfilBasePorLimite(limiteMinutos) : perfilHoras;

  if (!perfilCalculo) {
    return 0;
  }

  if (perfilCalculo === "24H") {
    return Math.min(Math.max(0, minutosSolicitados - 1), agoraMinutos);
  }

  const periodosPerfil = periodos.filter((periodo) => periodo.perfilCodigo === perfilCalculo);

  const passados = calcularMinutosPassadosEmPeriodos(periodosPerfil, agoraMinutos);

  return Math.min(Math.max(0, minutosSolicitados - 1), passados);
}

/* =========================================================
   CONFLITOS
========================================================= */

export function existeConflito({ programacao, injetora, dias, ignorarId }) {
  if (!injetora || !Array.isArray(dias) || dias.length === 0) {
    return null;
  }

  const datas = new Set(dias.filter((dia) => !dataEhPassada(dia.data)).map((dia) => dia.data));

  return (
    (Array.isArray(programacao) ? programacao : []).find((item) => {
      if (
        item?.ativo === false ||
        String(item?.injetora ?? "") !== String(injetora) ||
        String(item?.id ?? "") === String(ignorarId ?? "")
      ) {
        return false;
      }

      if (item?.tipoProgramacao === "CALENDARIO") {
        return (item?.diasProgramacao ?? []).some((dia) => datas.has(dia.data));
      }

      return [...datas].some(
        (data) => data >= String(item?.dataInicio ?? "") && data <= String(item?.dataFim ?? ""),
      );
    }) ?? null
  );
}

/* =========================================================
   DIAS CALCULADOS

   Desconta do dia de hoje o tempo produtivo que já passou.
   Dias passados mantêm o desconto gravado.
========================================================= */

export function calcularDiasProgramacao(diasSelecionados, calendarioPorData, periodos) {
  return diasSelecionados.map((dia) => {
    const configuracao = calendarioPorData.get(dia.data);

    const limiteMinutos = Number(configuracao?.minutosProgramados ?? dia.limiteMinutos ?? 1440);

    const minutosDescontados = dataEhPassada(dia.data)
      ? Number(dia?.minutosDescontados ?? 0)
      : calcularMinutosDescontadosHoje({
          data: dia.data,

          perfilHoras: dia.perfilHoras,

          minutosSolicitados: Number(dia.minutosSolicitados ?? 0),

          limiteMinutos,

          periodos,
        });

    return {
      ...dia,

      limiteMinutos,

      minutosDescontados,

      minutosEfetivos: Math.max(0, Number(dia.minutosSolicitados ?? 0) - minutosDescontados),
    };
  });
}

/* =========================================================
   PEÇAS E CONSUMO

   Só ciclos completos geram peças.
========================================================= */

export function calcularProducaoProgramacao(diasCalculados, produto) {
  const minutosEfetivos = diasCalculados.reduce(
    (total, dia) => total + Number(dia.minutosEfetivos ?? 0),
    0,
  );

  const ciclo = Number(produto?.cicloSegundos ?? 0);

  const cavidades = Number(produto?.cavidadeMolde ?? 0);

  const peso = Number(produto?.pesoKg ?? 0);

  const segundos = minutosEfetivos * 60;

  const valido =
    ciclo > 0 && Number.isInteger(cavidades) && cavidades > 0 && peso > 0 && segundos > 0;

  const ciclosCompletos = valido ? Math.floor(segundos / ciclo) : 0;

  const pecasPrevistas = ciclosCompletos * cavidades;

  const pecasPorHora = valido ? (3600 / ciclo) * cavidades : 0;

  const consumoPeriodoKg = pecasPrevistas * peso;

  const consumoPorHoraKg = pecasPorHora * peso;

  return {
    minutosEfetivos,
    pecasPrevistas,
    pecasPorHora,
    consumoPeriodoKg,
    consumoPorHoraKg,
  };
}

/* =========================================================
   VALIDAÇÃO AO SALVAR

   Devolve a mensagem do primeiro problema, ou null.
========================================================= */

export function validarProgramacao({
  item,
  itemLegado,
  injetora,
  codigoProduto,
  produtoSelecionado,
  diasCalculados,
  programacao,
  calculo,
}) {
  if (itemLegado) {
    return "Esta programação pertence ao modelo antigo.";
  }

  if (!injetora) {
    return "Selecione a injetora.";
  }

  if (!codigoProduto || !produtoSelecionado) {
    return "Selecione o produto.";
  }

  if (diasCalculados.length === 0) {
    return "Programe pelo menos um dia.";
  }

  if (!item && diasCalculados.some((dia) => dataEhPassada(dia.data))) {
    return "Não é permitido programar uma data anterior ao dia atual.";
  }

  for (const dia of diasCalculados) {
    if (dataEhPassada(dia.data)) {
      continue;
    }

    if (!dia.perfilHoras || dia.minutosSolicitados <= 0) {
      return `Defina as horas de ${formatarDataVisual(dia.data)}.`;
    }

    if (dia.minutosSolicitados > dia.limiteMinutos) {
      return `${formatarDataVisual(dia.data)} ultrapassa a disponibilidade permitida.`;
    }

    if (dia.minutosEfetivos <= 0) {
      return `Não restam horas produtivas disponíveis em ${formatarDataVisual(dia.data)}.`;
    }

    if (dia.receitaId === null || dia.receitaId === undefined || dia.receitaId === "") {
      return `Selecione a receita de ${formatarDataVisual(dia.data)}.`;
    }
  }

  const conflito = existeConflito({
    programacao,
    injetora,

    dias: diasCalculados,

    ignorarId: item?.id ?? null,
  });

  if (conflito) {
    return `A Injetora ${injetora} já possui programação em um dos dias selecionados.`;
  }

  if (calculo.pecasPrevistas <= 0) {
    return "As horas selecionadas não são suficientes para completar um ciclo.";
  }

  return null;
}
