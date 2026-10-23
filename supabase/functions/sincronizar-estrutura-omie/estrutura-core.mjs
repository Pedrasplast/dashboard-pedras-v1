/**
 * Regras puras da leitura da estrutura (malha) do Omie — Nec. Compra MP.
 *
 * Definido em 23/10: da estrutura entra só a matéria-prima do primeiro
 * nível (tipo 01 ou família "Matéria Prima"). Produtos acabados que
 * aparecem como componente (tipo 04) ficam de fora.
 */

const texto = (v) => String(v ?? '').trim();

const semAcento = (t) => texto(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function numero(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Linha da estrutura é matéria-prima? */
export function ehMateriaPrima(item) {
  return texto(item?.tipoProdMalha) === '01' || semAcento(item?.descrFamMalha).includes('materia prima');
}

/** Códigos distintos (maiúsculos) dos produtos dos pedidos. */
export function codigosProdutos(pedidos) {
  return [...new Set((pedidos ?? []).map((p) => texto(p?.codigo_produto).toUpperCase()).filter(Boolean))];
}

/**
 * Converte a resposta do ConsultarEstrutura em { produto, itens }.
 * `erro`: falha do Omie para esse produto (vira registro sem itens).
 */
export function extrairEstrutura(codigo, resposta, erro = null) {
  const lista = Array.isArray(resposta?.itens) ? resposta.itens : [];
  const ident = resposta?.ident ?? {};
  const idProduto = numero(ident.idProduto);
  const itens = [];
  const vistos = new Set();
  for (const i of lista) {
    if (!ehMateriaPrima(i)) continue;
    const idMalha = numero(i?.idMalha);
    const codigoMp = texto(i?.codProdMalha).toUpperCase();
    if (!(idMalha > 0) || !codigoMp || vistos.has(idMalha)) continue;
    vistos.add(idMalha);
    const idMp = numero(i?.idProdMalha);
    itens.push({
      codigo_produto: codigo,
      id_malha: idMalha,
      codigo_mp: codigoMp,
      codigo_mp_omie: idMp > 0 ? idMp : null,
      descricao_mp: texto(i?.descrProdMalha) || null,
      tipo: texto(i?.tipoProdMalha) || null,
      familia: texto(i?.descrFamMalha) || null,
      unidade: texto(i?.unidProdMalha) || null,
      quantidade: numero(i?.quantProdMalha),
      percentual_perda: numero(i?.percPerdaProdMalha),
    });
  }
  return {
    produto: {
      codigo_produto: codigo,
      id_produto_omie: idProduto > 0 ? idProduto : null,
      descricao: texto(ident.descrProduto) || null,
      total_itens: lista.length,
      erro: erro ? texto(erro).slice(0, 300) : null,
    },
    itens,
  };
}

/** Falha do Omie que significa "produto sem estrutura" (não é erro da rotina). */
export function semEstrutura(falha) {
  const n = semAcento(falha);
  return n.includes('nao existe') || n.includes('nao encontrad') || n.includes('nao cadastrad') || n.includes('nao possui');
}

/** Falha temporária do Omie: esperar e tentar de novo. */
export function falhaTemporaria(falha) {
  const n = semAcento(falha);
  return n.includes('redundante') || n.includes('sendo executada') || n.includes('tipo de dado');
}

/** Ordem de leitura: nunca lidos primeiro, depois os mais antigos. */
export function ordemLeitura(codigos, lidos) {
  const quando = new Map((lidos ?? []).map((l) => [texto(l.codigo_produto).toUpperCase(), Date.parse(l.sincronizado_em) || 0]));
  return [...codigos].sort((a, b) => (quando.get(a) ?? -1) - (quando.get(b) ?? -1) || a.localeCompare(b));
}
