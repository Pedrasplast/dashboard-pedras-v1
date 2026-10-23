/**
 * Regras puras do Dashboard de Matéria-Prima (origem Omie).
 *
 * Definido em 22/10:
 *   Pedidos: etapa 15, departamento 11 — Suprimentos PP (9069810185),
 *            situação ≠ Cancelado, TODOS os itens do pedido (não só os
 *            materiais cadastrados); data da compra = inclusão.
 *   Notas:   NF-e de entrada ligadas a esses pedidos; data de recebimento =
 *            infoCadastro.dRec (o "Recebido em" da tela do Omie).
 *   Recebido: quantidade recebida do item (nQtdeRec); parcial conta só o que chegou.
 *   Fornecedor: nome como está no Omie.
 */

export const ETAPA = '15';
export const DEPARTAMENTO = '9069810185';

const texto = (v) => String(v ?? '').trim();

export function numero(v, campo) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) throw new Error(`Número inválido do Omie em ${campo}`);
  return n;
}

/** dd/mm/aaaa → aaaa-mm-dd (ou null). */
export function dataISO(v) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto(v));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** aaaa-mm-dd → dd/mm/aaaa. */
export function dataBR(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto(iso));
  if (!m) throw new Error(`Data inválida: ${iso}`);
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Soma dias a uma data aaaa-mm-dd. */
export function somarDias(iso, dias) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Hoje (aaaa-mm-dd) no fuso de São Paulo. */
export function hojeSP(agora = new Date()) {
  const br = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(agora);
  return dataISO(br);
}

/** Janela [de, ate] validada (aaaa-mm-dd). Padrão: últimos `dias` até hoje. */
export function janela({ de, ate } = {}, agora = new Date(), dias = 60) {
  const hoje = hojeSP(agora);
  const fim = texto(ate) || hoje;
  const inicio = texto(de) || somarDias(fim, -dias);
  const valida = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T12:00:00Z`));
  if (!valida(inicio) || !valida(fim)) throw new Error('Período inválido (use aaaa-mm-dd)');
  if (fim < inicio) throw new Error('Período inválido: "ate" antes de "de"');
  return { de: inicio, ate: fim };
}

/**
 * PesquisarPedCompra: todas as situações menos cancelado
 * (ou só cancelados, com `somenteCancelados`).
 */
export function parametrosPesquisa(pagina, dataInicial, dataFinal, porPagina = 50, apenasAlterados = false, somenteCancelados = false) {
  const validos = somenteCancelados ? 'F' : 'T';
  return {
    nPagina: pagina,
    nRegsPorPagina: porPagina,
    lApenasImportadoApi: 'F',
    // 'T': o período passa a valer pela inclusão/alteração (não pela previsão).
    lApenasAlterados: apenasAlterados ? 'T' : 'F',
    dDataInicial: dataInicial,
    dDataFinal: dataFinal,
    lExibirPedidosPendentes: validos,
    lExibirPedidosRecebidos: validos,
    lExibirPedidosRecParciais: validos,
    lExibirPedidosFaturados: validos,
    lExibirPedidosFatParciais: validos,
    lExibirPedidosEncerrados: validos,
    lExibirPedidosCancelados: somenteCancelados ? 'T' : 'F',
  };
}

/** PesquisarPedCompra só com os Encerrados, incluídos/alterados no período. */
export function parametrosEncerrados(pagina, dataInicial, dataFinal, porPagina = 100) {
  return {
    ...parametrosPesquisa(pagina, dataInicial, dataFinal, porPagina, true, true),
    lExibirPedidosEncerrados: 'T',
    lExibirPedidosCancelados: 'F',
  };
}

/** Códigos (nCodPed) de todos os pedidos lidos, válidos ou não. */
export function codigosPedidos(pedidos) {
  const codigos = new Set();
  for (const p of pedidos ?? []) {
    const cod = numero(p?.cabecalho_consulta?.nCodPed, 'nCodPed');
    if (Number.isSafeInteger(cod) && cod > 0) codigos.add(cod);
  }
  return [...codigos];
}

/**
 * Itens dos pedidos do departamento 11 (etapa 15). Com [de, ate], só os
 * incluídos no período; sem período (null), todos.
 * `nomesFornecedor`: Map código → nome (opcional; completado depois).
 */
export function extrairItensPedidos(pedidos, de = null, ate = null, nomesFornecedor = new Map()) {
  const itens = [];
  const vistos = new Set();
  for (const pedido of pedidos ?? []) {
    const cab = pedido?.cabecalho_consulta ?? {};
    if (texto(cab.cEtapa) !== ETAPA) continue;

    const deptos = Array.isArray(pedido?.departamentos_consulta) ? pedido.departamentos_consulta : [];
    const depto = deptos.find((d) => texto(d?.cCodDepto) === DEPARTAMENTO && numero(d?.nPerc ?? 0, 'nPerc') > 0);
    if (!depto) continue;

    const inclusao = dataISO(cab.dIncData);
    if (!inclusao) continue;
    if ((de && inclusao < de) || (ate && inclusao > ate)) continue;

    const codPed = numero(cab.nCodPed, 'nCodPed');
    if (!Number.isSafeInteger(codPed) || codPed <= 0) throw new Error('Pedido sem código válido no Omie');
    const codFor = numero(cab.nCodFor, 'nCodFor');

    for (const item of Array.isArray(pedido?.produtos_consulta) ? pedido.produtos_consulta : []) {
      const quantidade = numero(item?.nQtde, 'nQtde');
      if (quantidade <= 0) continue;
      const codItem = numero(item?.nCodItem, 'nCodItem');
      if (!Number.isSafeInteger(codItem) || codItem <= 0) throw new Error(`Item sem código no pedido ${texto(cab.cNumero)}`);
      const chave = `${codPed}:${codItem}`;
      if (vistos.has(chave)) continue; // o Omie pode repetir o pedido entre páginas
      vistos.add(chave);
      const codProd = numero(item?.nCodProd, 'nCodProd');
      itens.push({
        cod_ped_compra: codPed,
        codigo_item: codItem,
        numero_pedido: texto(cab.cNumero),
        etapa: texto(cab.cEtapa),
        data_inclusao: inclusao,
        data_previsao: dataISO(cab.dDtPrevisao),
        codigo_fornecedor: codFor > 0 ? codFor : null,
        fornecedor_nome: nomesFornecedor.get(String(codFor)) ?? null,
        condicao_pagamento: texto(cab.cCodParc) || null,
        codigo_produto: texto(item?.cProduto).toUpperCase() || null,
        codigo_produto_omie: codProd > 0 ? codProd : null,
        descricao: texto(item?.cDescricao) || null,
        unidade: texto(item?.cUnidade) || null,
        quantidade,
        quantidade_recebida: numero(item?.nQtdeRec, 'nQtdeRec'),
        preco_unitario: numero(item?.nValUnit, 'nValUnit'),
        valor_mercadoria: numero(item?.nValMerc, 'nValMerc'),
        valor_ipi: numero(item?.nValorIpi, 'nValorIpi'),
        valor_desconto: numero(item?.nDesconto, 'nDesconto'),
        valor_frete: numero(item?.nFrete, 'nFrete'),
        valor_outras_despesas: numero(item?.nDespesas, 'nDespesas'),
        valor_total: numero(item?.nValTot, 'nValTot'),
        percentual_departamento: numero(depto.nPerc, 'nPerc'),
      });
    }
  }
  return itens;
}

/** Notas da listagem (ListarRecebimentos) dos fornecedores informados. */
export function notasCandidatas(recebimentos, fornecedores) {
  const ids = [];
  for (const r of recebimentos ?? []) {
    const id = numero(r?.cabec?.nIdReceb, 'nIdReceb');
    const fornecedor = String(numero(r?.cabec?.nIdFornecedor, 'nIdFornecedor'));
    if (id > 0 && fornecedores.has(fornecedor)) ids.push(id);
  }
  return [...new Set(ids)];
}

/**
 * Itens de uma NF-e de entrada (ConsultarRecebimento) ligados aos pedidos
 * do Dashboard. `pedidos`: Map cod_ped_compra (string) → numero_pedido.
 * NF cancelada ou devolvida não entra.
 */
export function extrairItensNota(nota, pedidos) {
  const info = nota?.infoCadastro ?? {};
  if (texto(info.cCancelada) === 'S' || texto(info.cDevolvido) === 'S') return [];
  const cab = nota?.cabec ?? {};
  const emissao = dataISO(cab.dEmissaoNFe);
  if (!emissao) return [];
  const recebimento = texto(info.cRecebido) === 'S' ? dataISO(info.dRec) : null;
  const idReceb = numero(cab.nIdReceb, 'nIdReceb');

  const itens = [];
  for (const it of Array.isArray(nota?.itensRecebimento) ? nota.itensRecebimento : []) {
    const c = it?.itensCabec ?? {};
    if (texto(c.cIgnorarItem) === 'S') continue;
    const codPed = String(numero(c.nIdPedido, 'nIdPedido'));
    if (!pedidos.has(codPed)) continue;
    const ajustes = it?.itensAjustes ?? {};
    itens.push({
      id_recebimento: idReceb,
      // nIdItem pode repetir o código do item do pedido; a sequência é única dentro da nota.
      id_item_nota: numero(c.nSequencia, 'nSequencia') || numero(c.nIdItem, 'nIdItem'),
      cod_ped_compra: Number(codPed),
      codigo_item: numero(c.nIdItPedido, 'nIdItPedido') || null,
      numero_pedido: pedidos.get(codPed) || texto(it?.itensInfoAdic?.nNumPedCompra) || null,
      numero_nf: texto(cab.cNumeroNFe) || null,
      data_emissao: emissao,
      data_recebimento: recebimento,
      quantidade: numero(ajustes.nQtdeRecebida ?? c.nQtdeNFe, 'nQtdeRecebida'),
      valor_total: numero(c.vTotalItem, 'vTotalItem'),
    });
  }
  return itens;
}
