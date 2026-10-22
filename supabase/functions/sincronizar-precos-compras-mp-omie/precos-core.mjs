/**
 * Regras puras da média de preços de matéria-prima (Tabela de Preços).
 *
 * Regra definida em 22/10:
 *   - Etapa 15 (Aprovação).
 *   - Departamento 11 — Suprimentos PP (9069810185).
 *   - Situação diferente de Cancelado: PesquisarPedCompra com todas as
 *     situações (inclui encerrados) e lExibirPedidosCancelados = 'F'.
 *   - Material pelo código do produto no Omie (cProduto).
 *   - Data de inclusão do pedido; quantidade total comprada (nQtde);
 *     valor total do item (nValTot, já com os ajustes do Omie).
 * Baseado no script de teste do usuário (teste-simplificado-02).
 */

export const ETAPA = '15';
export const DEPARTAMENTO = '9069810185';
export const DIAS_JANELA = 60;
export const JANELAS = [30, 45, 60];

const texto = (v) => String(v ?? '').trim();

function numero(v, campo) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) throw new Error(`Número inválido do Omie em ${campo}`);
  return n;
}

/** Parâmetros do PesquisarPedCompra: tudo menos cancelados. */
export function parametrosPesquisa(pagina, dataInicial, dataFinal, porPagina = 50) {
  return {
    nPagina: pagina,
    nRegsPorPagina: porPagina,
    lApenasImportadoApi: 'F',
    lApenasAlterados: 'F',
    dDataInicial: dataInicial,
    dDataFinal: dataFinal,
    lExibirPedidosPendentes: 'T',
    lExibirPedidosRecebidos: 'T',
    lExibirPedidosRecParciais: 'T',
    lExibirPedidosFaturados: 'T',
    lExibirPedidosFatParciais: 'T',
    lExibirPedidosEncerrados: 'T',
    lExibirPedidosCancelados: 'F',
  };
}

/** dd/mm/aaaa → aaaa-mm-dd (ou null). */
export function dataISO(v) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto(v));
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

/** Data de hoje e de N dias atrás no fuso de São Paulo, nos dois formatos. */
export function periodo(agora = new Date(), dias = DIAS_JANELA) {
  const fmt = (d) => new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(d);
  const fim = fmt(agora);
  const fimIso = dataISO(fim);
  const inicioData = new Date(`${fimIso}T12:00:00Z`);
  inicioData.setUTCDate(inicioData.getUTCDate() - dias);
  const inicioIso = inicioData.toISOString().slice(0, 10);
  const [a, m, d] = inicioIso.split('-');
  return { inicio: `${d}/${m}/${a}`, fim, inicioIso, fimIso };
}

/**
 * Itens que entram na média, de uma lista de pedidos do PesquisarPedCompra.
 * `materiais`: Set com os códigos (cProduto) em maiúsculas.
 */
export function extrairItens(pedidos, materiais, inicioIso, fimIso) {
  const itens = [];
  for (const pedido of pedidos ?? []) {
    const cab = pedido?.cabecalho_consulta ?? {};
    if (texto(cab.cEtapa) !== ETAPA) continue;

    const departamentos = Array.isArray(pedido?.departamentos_consulta) ? pedido.departamentos_consulta : [];
    const noDepartamento = departamentos.some(
      (d) => texto(d?.cCodDepto) === DEPARTAMENTO && numero(d?.nPerc ?? 100, 'nPerc') > 0,
    );
    if (!noDepartamento) continue;

    const data = dataISO(cab.dIncData);
    if (!data || data < inicioIso || data > fimIso) continue;

    const codPed = numero(cab.nCodPed, 'nCodPed');
    if (!Number.isSafeInteger(codPed) || codPed <= 0) throw new Error('Pedido sem código válido no Omie');

    for (const item of Array.isArray(pedido?.produtos_consulta) ? pedido.produtos_consulta : []) {
      const codigo = texto(item?.cProduto).toUpperCase();
      if (!materiais.has(codigo)) continue;
      const quantidade = numero(item?.nQtde, 'nQtde');
      const valor = numero(item?.nValTot, 'nValTot');
      if (quantidade <= 0 || valor < 0) continue;
      const codigoItem = numero(item?.nCodItem, 'nCodItem');
      if (!Number.isSafeInteger(codigoItem) || codigoItem <= 0) throw new Error(`Item sem código no pedido ${texto(cab.cNumero)}`);
      const codProd = numero(item?.nCodProd, 'nCodProd');
      itens.push({
        cod_ped_compra: codPed,
        codigo_item: codigoItem,
        numero_pedido: texto(cab.cNumero),
        etapa: texto(cab.cEtapa),
        data_inclusao: data,
        codigo_produto: codigo,
        codigo_produto_omie: codProd > 0 ? codProd : null,
        quantidade,
        quantidade_recebida: numero(item?.nQtdeRec, 'nQtdeRec'),
        valor_total: valor,
      });
    }
  }
  return itens;
}

/** Média ponderada (valor total / quantidade total) por produto e janela. */
export function calcularMedias(itens, fimIso, janelas = JANELAS) {
  const fim = new Date(`${fimIso}T12:00:00Z`);
  const resultado = {};
  for (const item of itens) {
    const r = (resultado[item.codigo_produto] ??= {});
    for (const dias of janelas) {
      const inicio = new Date(fim);
      inicio.setUTCDate(inicio.getUTCDate() - dias);
      if (item.data_inclusao < inicio.toISOString().slice(0, 10)) continue;
      const j = (r[`${dias}d`] ??= { compras: 0, quantidade: 0, valor: 0, media: null });
      j.compras += 1;
      j.quantidade += item.quantidade;
      j.valor += item.valor_total;
      j.media = j.quantidade > 0 ? j.valor / j.quantidade : null;
    }
  }
  return resultado;
}
