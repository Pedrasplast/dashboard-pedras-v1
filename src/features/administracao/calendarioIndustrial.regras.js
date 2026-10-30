import {
  PREFIXO_FERIADO_NACIONAL,
  ehFeriadoNacionalAutomatico,
} from "./calendarioIndustrialAdminService";

export const NOMES_MESES = Object.freeze([
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
]);

export const DIAS_SEMANA = Object.freeze(["S", "T", "Q", "Q", "S", "S", "D"]);

function dataIsoLocal(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function formatarDataPtBr(dataIso) {
  if (!dataIso) {
    return "—";
  }

  const [ano, mes, dia] = String(dataIso).split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

export function formatarDiaSemana(dataIso) {
  const [ano, mes, dia] = String(dataIso).split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(data);
}

export function obterDiasDoMes(ano, mes) {
  const quantidadeDias = new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const deslocamentoSegunda = (primeiroDiaSemana + 6) % 7;
  const dias = [];

  for (let i = 0; i < deslocamentoSegunda; i += 1) {
    dias.push(null);
  }

  for (let dia = 1; dia <= quantidadeDias; dia += 1) {
    dias.push({
      dia,
      data: dataIsoLocal(ano, mes, dia),
    });
  }

  while (dias.length % 7 !== 0) {
    dias.push(null);
  }

  return dias;
}

export function classePerfil(perfilCodigo) {
  if (perfilCodigo === "SEM_PRODUCAO") {
    return "bloqueado";
  }

  if (perfilCodigo === "24H") {
    return "liberado";
  }

  if (["5H", "17H", "22H"].includes(perfilCodigo)) {
    return "parcial";
  }

  return "padrao";
}

export function mensagemErro(error, fallback) {
  return error?.message || error?.details || fallback;
}

export function calcularIndicadores(excecoes) {
  let bloqueados = 0;
  let feriadosAutomaticos = 0;
  let manuais = 0;
  let liberacoes = 0;

  for (const item of excecoes) {
    if (item.perfil_codigo === "SEM_PRODUCAO") {
      bloqueados += 1;
    }

    if (ehFeriadoNacionalAutomatico(item)) {
      feriadosAutomaticos += 1;
    } else {
      manuais += 1;
    }

    if (item.perfil_codigo === "24H") {
      liberacoes += 1;
    }
  }

  return {
    bloqueados,
    feriadosAutomaticos,
    manuais,
    liberacoes,
  };
}

export function criarDiaSelecionado(dataIso, item) {
  const temExcecao = item?.origem === "EXCECAO";

  return {
    data: dataIso,
    item,
    temExcecao,
    ehFeriadoAutomatico: temExcecao && ehFeriadoNacionalAutomatico(item),
  };
}

export function descreverDiaCalendario(dia, item, hojeIso) {
  const temExcecao = item?.origem === "EXCECAO";
  const perfil = item?.perfil_codigo || "24H";
  const automatico = temExcecao && ehFeriadoNacionalAutomatico(item);
  const hoje = dia.data === hojeIso;

  const classes = [
    "administracao-dia",
    temExcecao ? "com-excecao" : "",
    !temExcecao && perfil === "24H" ? "padrao-24h" : "",
    classePerfil(perfil),
    automatico ? "feriado-automatico" : "",
    hoje ? "hoje" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const titulo = temExcecao
    ? `${formatarDataPtBr(dia.data)} — ${item.perfil_nome}${
        item.observacao ? ` — ${item.observacao}` : ""
      }`
    : `${formatarDataPtBr(dia.data)} — padrão 24 horas`;

  return { temExcecao, perfil, automatico, classes, titulo };
}

export function montarObservacaoDia(observacao, perfilCodigo, ehFeriadoAutomatico) {
  let observacaoFinal = String(observacao || "").trim();

  if (!observacaoFinal) {
    observacaoFinal =
      perfilCodigo === "SEM_PRODUCAO"
        ? "SEM PRODUÇÃO — AJUSTE MANUAL DO CALENDÁRIO INDUSTRIAL"
        : "AJUSTE MANUAL DO CALENDÁRIO INDUSTRIAL";
  }

  // Se o administrador liberar/alterar um feriado importado, a decisão passa a ser manual.
  if (
    ehFeriadoAutomatico &&
    perfilCodigo !== "SEM_PRODUCAO" &&
    observacaoFinal.toUpperCase().startsWith(PREFIXO_FERIADO_NACIONAL)
  ) {
    observacaoFinal = `AJUSTE MANUAL — ${observacaoFinal}`;
  }

  return observacaoFinal;
}
