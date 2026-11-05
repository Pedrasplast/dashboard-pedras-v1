/** Regras puras; não acessam Omie ou Supabase. */
export const TOTAL_LOTES = 12;

/** Duração de cada "fatia" de tempo usada para escolher o lote. */
export const FATIA_LOTE_MS = 15 * 60 * 1000;

export function codigoValido(valor) {
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

export function loteDoCodigo(codigo, totalLotes = TOTAL_LOTES) {
  const numero = codigoValido(codigo);
  if (numero === null || !Number.isSafeInteger(totalLotes) || totalLotes < 1) {
    throw new Error("Código ou total de lotes inválido.");
  }
  return numero % totalLotes;
}

export function loteDoHorario(agora = new Date(), totalLotes = TOTAL_LOTES) {
  // Rotaciona um lote por quarto de hora (contado desde 1970, em UTC).
  // O cron roda a cada 15 minutos, então execuções consecutivas pegam lotes
  // consecutivos e os 12 lotes são conferidos a cada 3 horas, qualquer que
  // seja o minuto exato do agendamento.
  //
  // A regra anterior (minuto / 5) só funcionava com execução a cada 5 minutos;
  // com o cron a cada 15 minutos (minutos 04, 19, 34, 49) apenas os lotes
  // 0, 3, 6 e 9 eram conferidos.
  const fatia = Math.floor(agora.getTime() / FATIA_LOTE_MS);
  return ((fatia % totalLotes) + totalLotes) % totalLotes;
}

/** Número da volta completa pelos 12 lotes (muda a cada 3 horas). */
export function rodadaDoHorario(agora = new Date(), totalLotes = TOTAL_LOTES) {
  return Math.floor(agora.getTime() / (FATIA_LOTE_MS * totalLotes));
}

/**
 * Quando o lote tem mais pedidos do que cabem numa execução, escolhe `maximo`
 * deles começando numa posição que avança a cada rodada. Assim todos os
 * pedidos do lote acabam conferidos em poucas rodadas, em vez de o lote
 * inteiro ser recusado (antes: erro 409 e nenhum pedido conferido).
 * Itens devem vir em ordem estável (ex.: por código).
 */
export function escolherDoLote(itens, maximo, rodada) {
  if (!Number.isSafeInteger(maximo) || maximo < 1) throw new Error("Máximo inválido.");
  if (itens.length <= maximo) return itens;
  const inicio = (((rodada * maximo) % itens.length) + itens.length) % itens.length;
  return Array.from({ length: maximo }, (_, i) => itens[(inicio + i) % itens.length]);
}

// Preserva a semântica da função v3: somente a indicação literal 'S' é verdadeira.
function sim(valor) {
  return valor === "S";
}

export function pedidoNaoCadastrado(erro) {
  const texto = String(erro instanceof Error ? erro.message : (erro ?? ""))
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return texto.includes("pedido nao cadastrado") || texto.includes("nao cadastrado para o codigo");
}

export function extrairPedido(resposta, codigoEsperado) {
  const bruto = resposta?.pedido_venda_produto ?? resposta;
  const pedido = Array.isArray(bruto) ? (bruto.length === 1 ? bruto[0] : null) : bruto;
  if (!pedido || typeof pedido !== "object" || Array.isArray(pedido)) {
    throw new Error("Resposta do Omie sem pedido individual válido; nenhuma gravação permitida.");
  }
  const codigo = codigoValido(pedido.cabecalho?.codigo_pedido);
  if (codigo !== codigoEsperado) {
    throw new Error("Código divergente na resposta do Omie; nenhuma gravação permitida.");
  }
  if (!pedido.infoCadastro || !Object.hasOwn(pedido.infoCadastro, "cancelado")) {
    throw new Error("Omie não informou infoCadastro.cancelado; nenhuma gravação permitida.");
  }
  return pedido;
}

export function avaliarSituacao(pedido, _statusAnterior, etapas = new Map()) {
  const info = pedido.infoCadastro;
  const cab = pedido.cabecalho;
  // Precedência e estado ativo iguais aos da função de produção v3.
  if (sim(info.cancelado)) return { status: "Cancelado", ativo: true, motivo: "cancelado" };
  if (sim(info.faturado)) return { status: "Faturado", ativo: false, motivo: "faturado" };
  if (sim(info.denegado)) return { status: "Denegado", ativo: false, motivo: "denegado" };
  if (sim(info.devolvido)) return { status: "Devolvido", ativo: false, motivo: "devolvido" };
  if (sim(cab.encerrado)) return { status: "Encerrado", ativo: false, motivo: "encerrado" };
  const descricao = String(etapas.get(String(cab.etapa ?? "")) || "Pedido").trim();
  const status = descricao.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes("armazenado")
    ? "Pedido"
    : descricao;
  return { status, ativo: true, motivo: "aberto" };
}

export function devePersistir(simulacao, _statusAnterior, _situacao) {
  // A função v3 atualiza sincronizado_em mesmo quando o status não muda.
  return simulacao !== true;
}
