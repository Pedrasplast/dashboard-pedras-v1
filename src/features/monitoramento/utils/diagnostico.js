import { expandirCampo } from "./monitoramento.utils";

/* =========================================================
   MONITORAMENTO — DIAGNÓSTICO (regras puras, testadas)

   - explicarErro: traduz o erro técnico em causa provável + o que fazer.
   - avaliarOmie: termômetro do Omie pelos últimos 30 min.
   - resumirResultado: "2 novos · 1 alterado" a partir da resposta.
   - pedidosComErro: pedidos que falharam numa resposta em lote.
   - rotinasNaHora / mapaDaHora: quais rotinas disparam em cada minuto.
========================================================= */

/* ---------------------------------------------------------
   1. Erros em português
--------------------------------------------------------- */

const OMIE_LENTO =
  "Costuma ser lentidão do Omie e volta sozinho. Se repetir por mais de 30 min, pause a rotina.";

const ERROS = [
  {
    teste: (t) => /sendo executada|redundan/i.test(t),
    titulo: "O Omie estava ocupado com a mesma consulta",
    dica: "Outra rotina fazia a mesma consulta no Omie ao mesmo tempo. Resolve sozinho na próxima execução; se acontecer sempre no mesmo horário, vale mudar a agenda.",
  },
  {
    teste: (t, http) => http === 546 || /compute resources|worker_limit/i.test(t),
    titulo: "A função ficou sem memória ou processamento",
    dica: "Acontece quando o Omie demora e várias rotinas rodam juntas. Normalmente volta sozinho; se durar mais de 30 min, pause as rotinas mais pesadas, como a conferência completa.",
  },
  {
    teste: (t) => /signal has been aborted|aborterror/i.test(t),
    titulo: "O Omie demorou e a função desistiu de esperar",
    dica: OMIE_LENTO,
  },
  {
    teste: (t, http) => http === 504 || /idle timeout|150s/i.test(t),
    titulo: "A função passou do tempo máximo (150 s)",
    dica: OMIE_LENTO,
  },
  {
    teste: (t) => /^tempo limite excedido\.?$/i.test(t.trim()),
    titulo: "A função não respondeu a tempo",
    dica: OMIE_LENTO,
  },
  {
    teste: (t) => /tempo limite|timed? ?out/i.test(t),
    titulo: "O Omie avisou que a consulta demorou demais",
    dica: OMIE_LENTO,
  },
  {
    teste: (t) => /sem resposta da fun/i.test(t),
    titulo: "A função não respondeu",
    dica: "A chamada se perdeu. Se repetir, confira no Supabase se a função está publicada.",
  },
  {
    teste: (t, http) =>
      http === 429 || /consumo|bloquead|limite de requisi|too many requests/i.test(t),
    titulo: "O Omie bloqueou por excesso de chamadas",
    dica: "O Omie libera depois de alguns minutos. Se repetir, diminua a frequência das rotinas.",
  },
  {
    teste: (t, http) =>
      http === 401 || http === 403 || /chave de acesso|app_key|app_secret|credencia|n[aã]o autorizad/i.test(t),
    titulo: "Acesso recusado",
    dica: "A chave do Omie ou a senha da rotina está errada ou venceu. Confira os segredos no Supabase.",
  },
  {
    teste: (t) => /soap-error|broken response|application server|faultstring/i.test(t),
    titulo: "O Omie respondeu com erro interno",
    dica: "Problema do lado do Omie. Costuma voltar sozinho.",
  },
];

function lerJson(texto) {
  try {
    const valor = JSON.parse(texto);
    return valor && typeof valor === "object" ? valor : null;
  } catch {
    return null;
  }
}

/** Pedidos que falharam numa resposta em lote (ex.: conferência de status). */
export function pedidosComErro(texto) {
  const json = lerJson(String(texto ?? ""));
  const lista = Array.isArray(json?.resultados) ? json.resultados : [];
  return lista
    .filter((r) => r && typeof r === "object" && (r.erro || r.error))
    .map((r) => ({
      pedido: String(r.numero_pedido ?? r.codigo_pedido_omie ?? "?"),
      erro: String(r.erro ?? r.error),
    }));
}

/**
 * Causa provável e o que fazer, a partir do texto do erro.
 * Devolve null se não houver erro.
 */
export function explicarErro(texto, statusHttp = null) {
  const bruto = String(texto ?? "").trim();
  if (!bruto) return null;

  const http = Number(statusHttp) || null;
  const json = lerJson(bruto);

  // Resposta em lote que parou no meio (ex.: conferência de status).
  if (json && json.interrompido === true) {
    const comErro = pedidosComErro(bruto);
    const processados = Number(json.pedidos_processados);
    const total = Number(json.pedidos_no_lote ?? json.pedidos_selecionados);
    const parte =
      Number.isFinite(processados) && Number.isFinite(total) && total > 0
        ? ` Conferiu ${processados} de ${total} pedidos.`
        : "";
    return {
      titulo: "Parou no meio para não passar do tempo",
      dica: `O restante entra nas próximas execuções.${parte}`,
      pedidos: comErro,
    };
  }

  const textoBusca = json ? String(json.erro ?? json.message ?? bruto) : bruto;
  const regra = ERROS.find((e) => e.teste(textoBusca, http));

  return {
    titulo: regra?.titulo ?? "Erro não reconhecido",
    dica: regra?.dica ?? "Veja o detalhe técnico.",
    pedidos: pedidosComErro(bruto),
  };
}

/* ---------------------------------------------------------
   2. Termômetro do Omie (últimos 30 min)
--------------------------------------------------------- */

export const NIVEL_OMIE = Object.freeze({
  NORMAL: "normal",
  LENTO: "lento",
  INSTAVEL: "instavel",
  SEM_DADOS: "sem_dados",
});

/**
 * falhas_omie = falhas que vêm do Omie (demora ou erro interno do Omie).
 * normal: quase tudo certo e no tempo de sempre;
 * lento / com erros: 25% ou mais das execuções lentas ou com falha do Omie;
 * instável: metade ou mais com falha do Omie.
 */
export function avaliarOmie(termometro) {
  const execucoes = Number(termometro?.execucoes) || 0;
  const doOmie = Number(termometro?.falhas_omie) || 0;
  const lentas = Number(termometro?.lentas) || 0;
  const falhas = Number(termometro?.falhas) || 0;

  if (execucoes < 3) {
    return {
      nivel: NIVEL_OMIE.SEM_DADOS,
      titulo: "Omie: sem leitura agora",
      detalhe: "Menos de 3 execuções nos últimos 30 min (fora do horário das rotinas).",
    };
  }

  const detalhe = `Últimos 30 min: ${execucoes} execuções, ${lentas} lentas, ${falhas} com erro.`;

  if (doOmie / execucoes >= 0.5) {
    return { nivel: NIVEL_OMIE.INSTAVEL, titulo: "Omie instável", detalhe };
  }
  if ((doOmie + lentas) / execucoes >= 0.25) {
    const titulo = doOmie > lentas ? "Omie com erros" : "Omie lento";
    return { nivel: NIVEL_OMIE.LENTO, titulo, detalhe };
  }
  return { nivel: NIVEL_OMIE.NORMAL, titulo: "Omie normal", detalhe };
}

/* ---------------------------------------------------------
   3. Resultado da execução
--------------------------------------------------------- */

// Ordem = prioridade de exibição. [chave, singular, plural]
const CAMPOS_RESULTADO = [
  ["novas", "novo", "novos"],
  ["alteradas", "alterado", "alterados"],
  ["pedidos_sincronizados", "pedido atualizado", "pedidos atualizados"],
  ["pedidos_alterados", "pedido alterado", "pedidos alterados"],
  ["pedidos_confirmados", "pedido confirmado", "pedidos confirmados"],
  ["pedidos_processados", "pedido conferido", "pedidos conferidos"],
  ["posicoes_atualizadas", "saldo atualizado", "saldos atualizados"],
  ["requisicoes_ativas", "requisição ativa", "requisições ativas"],
  ["lancamentos", "lançamento", "lançamentos"],
  ["titulos", "título", "títulos"],
  ["notas_consultadas", "nota consultada", "notas consultadas"],
  ["com_materia_prima", "produto com MP", "produtos com MP"],
  ["itens", "item", "itens"],
  ["pendentes", "pendente", "pendentes"],
  ["erros", "erro", "erros"],
  ["paginas_processadas", "página lida", "páginas lidas"],
  ["paginas", "página", "páginas"],
];

const MAXIMO_PARTES = 3;

/** Texto curto com os números da última resposta, ou null. */
export function resumirResultado(resultado) {
  if (!resultado || typeof resultado !== "object") return null;

  const partes = [];

  if (Number.isFinite(resultado.lote) && Number.isFinite(resultado.total_lotes)) {
    partes.push(`lote ${resultado.lote} de ${resultado.total_lotes}`);
  }

  for (const [chave, um, varios] of CAMPOS_RESULTADO) {
    if (partes.length >= MAXIMO_PARTES) break;
    const valor = resultado[chave];
    if (!Number.isFinite(valor)) continue;
    // "páginas" só quando não há "páginas lidas".
    if (chave === "paginas" && Number.isFinite(resultado.paginas_processadas)) continue;
    partes.push(`${valor.toLocaleString("pt-BR")} ${valor === 1 ? um : varios}`);
  }

  if (resultado.interrompido === true) partes.push("parou no meio");
  else if (resultado.concluido === false) partes.push("continua na próxima");

  return partes.length ? partes.join(" · ") : null;
}

/* ---------------------------------------------------------
   4. Mapa de horários (Brasília = UTC-3)
--------------------------------------------------------- */

const FUSO_HORAS = -3;

/** Minutos (0–59) em que a agenda dispara na hora local, em dia útil. */
export function minutosNaHora(agenda, horaLocal, diaSemana = 3) {
  const partes = String(agenda ?? "")
    .trim()
    .split(/\s+/);
  if (partes.length !== 5 || partes[2] !== "*" || partes[3] !== "*") return [];

  const minutos = expandirCampo(partes[0], 0, 59);
  const horas = expandirCampo(partes[1], 0, 23);
  const dias = expandirCampo(partes[4], 0, 7);
  if (!minutos || !horas || !dias) return [];

  const horaUtc = (horaLocal - FUSO_HORAS + 24) % 24;
  // Hora local antes das 21h cai no mesmo dia UTC; a partir das 21h, no dia seguinte.
  const diaUtc = (diaSemana + (horaLocal - FUSO_HORAS >= 24 ? 1 : 0)) % 7;

  if (!horas.includes(horaUtc)) return [];
  if (!dias.map((d) => d % 7).includes(diaUtc)) return [];
  return minutos;
}

/**
 * Para uma hora local: as rotinas que disparam nela e, para cada minuto,
 * quantas disparam juntas.
 */
export function mapaDaHora(rotinas, horaLocal, diaSemana = 3) {
  const linhas = (rotinas ?? [])
    .map((r) => ({
      rotina: r.rotina,
      nome: r.nome ?? r.rotina,
      ativa: r.ativa !== false,
      minutos: new Set(minutosNaHora(r.agenda, horaLocal, diaSemana)),
    }))
    .filter((l) => l.minutos.size > 0);

  const contagem = Array.from({ length: 60 }, (_, minuto) =>
    linhas.filter((l) => l.ativa && l.minutos.has(minuto)).length,
  );

  return { linhas, contagem };
}

/* ---------------------------------------------------------
   5. "Pausar até"
--------------------------------------------------------- */

/**
 * Data para retomar, conforme a opção escolhida (OPCOES_PAUSA).
 * null = até retomar à mão. "amanha6" = próximas 06:00 de Brasília.
 */
export function calcularRetomarEm(opcao, agora = new Date()) {
  if (!opcao || opcao.id === "manual") return null;

  if (Number.isFinite(opcao.horas)) {
    return new Date(agora.getTime() + opcao.horas * 60 * 60 * 1000);
  }

  if (opcao.id === "amanha6") {
    const local = new Date(agora.getTime() + FUSO_HORAS * 60 * 60 * 1000);
    const alvo = new Date(
      Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 6, 0, 0),
    );
    if (local.getUTCHours() >= 6) alvo.setUTCDate(alvo.getUTCDate() + 1);
    return new Date(alvo.getTime() - FUSO_HORAS * 60 * 60 * 1000);
  }

  return null;
}
