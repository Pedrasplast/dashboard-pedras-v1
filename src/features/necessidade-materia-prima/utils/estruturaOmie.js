/* ============================================================
   NEC. COMPRA MP — ESTRUTURA DO OMIE (23/10)

   KG/UN e matéria-prima de cada produto vêm da estrutura (malha)
   do Omie, só as linhas de matéria-prima do 1º nível.

   Produto com qualquer pendência fica FORA do consumo:
   - sem estrutura (ou ainda não lida / erro na leitura);
   - peso zerado na estrutura;
   - matéria-prima sem material no Cadastro de Material;
   - peso suspeito (> 5 kg/un) sem aceite, ou recusado;
   - sem cadastro de estoque no depósito;
   - sem estoque mínimo (vazio ou 0).
============================================================ */

export const PESO_SUSPEITO_KG = 5;

export const MOTIVOS = Object.freeze({
  ESTRUTURA_NAO_LIDA: "Estrutura ainda não lida do Omie",
  ERRO_LEITURA: "Erro ao ler a estrutura no Omie",
  SEM_ESTRUTURA: "Sem estrutura no Omie",
  PESO_ZERADO: "Peso zerado na estrutura",
  MP_SEM_MATERIAL: "Matéria-prima sem material no Cadastro de Material",
  PESO_SUSPEITO: "Peso suspeito",
  PESO_RECUSADO: "Peso recusado – corrigir no Omie",
  SEM_ESTOQUE: "Sem cadastro de estoque no depósito",
  SEM_ESTOQUE_MINIMO: "Sem estoque mínimo",
});

const codigo = (v) => String(v ?? "").trim().toUpperCase();

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Mesmo peso (evita diferença de arredondamento entre texto e número). */
export function mesmoPeso(a, b) {
  const x = num(a);
  const y = num(b);
  return x !== null && y !== null && Math.abs(x - y) < 1e-9;
}

/** Código da matéria-prima (Omie) → id do material. */
export function criarMapaMateriais({ vinculos = [], materiais = [] } = {}) {
  const mapa = new Map();
  for (const v of vinculos) {
    if (v?.ativo === false) continue;
    const c = codigo(v?.codigo_produto);
    if (c && v?.material_id != null && !mapa.has(c)) mapa.set(c, String(v.material_id));
  }
  for (const m of materiais) {
    const c = codigo(m?.codigo_omie);
    if (c && m?.id != null && !mapa.has(c)) mapa.set(c, String(m.id));
  }
  return mapa;
}

function indexarEstrutura({ produtos = [], itens = [] } = {}) {
  const porProduto = new Map();
  for (const p of produtos) {
    porProduto.set(codigo(p.codigo_produto), { ...p, itens: [] });
  }
  for (const i of itens) {
    const p = porProduto.get(codigo(i.codigo_produto));
    if (p) p.itens.push(i);
  }
  return porProduto;
}

function indexarEstoques(estoqueProdutos = []) {
  const mapa = new Map();
  for (const e of estoqueProdutos) {
    const c = codigo(e.codigo_produto);
    if (!c) continue;
    const fisico = num(e.fisico);
    if (fisico === null) continue;
    const minimo = num(e.estoque_minimo) ?? 0;
    const anterior = mapa.get(c);
    mapa.set(c, { minimo: Math.max(anterior?.minimo ?? 0, minimo) });
  }
  return mapa;
}

function indexarDecisoes(decisoes = []) {
  return new Map(decisoes.map((d) => [`${codigo(d.codigo_produto)}|${codigo(d.codigo_mp)}`, d]));
}

/**
 * Avalia um produto: { motivos, linhasMaterial, pesosSuspeitos, pesosAceitos }.
 * linhasMaterial: Map materialId → kg/un (com perda).
 */
export function avaliarProduto(cod, { estrutura, mapaMateriais, estoques, decisoes }) {
  const motivos = [];
  const pesosSuspeitos = [];
  const pesosAceitos = [];
  const linhasMaterial = new Map();
  const registro = estrutura.get(cod);

  if (!registro) {
    motivos.push({ tipo: "ESTRUTURA_NAO_LIDA", texto: MOTIVOS.ESTRUTURA_NAO_LIDA });
  } else if (registro.erro) {
    motivos.push({ tipo: "ERRO_LEITURA", texto: MOTIVOS.ERRO_LEITURA, detalhe: registro.erro });
  } else if (registro.itens.length === 0) {
    motivos.push({ tipo: "SEM_ESTRUTURA", texto: MOTIVOS.SEM_ESTRUTURA });
  }

  for (const item of registro?.itens ?? []) {
    const mp = codigo(item.codigo_mp);
    const kg = num(item.quantidade) ?? 0;
    if (!(kg > 0)) {
      motivos.push({ tipo: "PESO_ZERADO", texto: `${MOTIVOS.PESO_ZERADO} (${mp})` });
      continue;
    }
    const materialId = mapaMateriais.get(mp);
    if (!materialId) {
      motivos.push({ tipo: "MP_SEM_MATERIAL", texto: `${MOTIVOS.MP_SEM_MATERIAL} (${mp})`, codigoMp: mp });
    }
    if (kg > PESO_SUSPEITO_KG) {
      const decisao = decisoes.get(`${cod}|${mp}`);
      const vale = decisao && mesmoPeso(decisao.quantidade, kg);
      const peso = { codigoMp: mp, descricaoMp: item.descricao_mp ?? null, quantidade: kg, decisao: vale ? decisao : null };
      if (vale && decisao.decisao === "ACEITO") {
        pesosAceitos.push(peso);
      } else if (vale && decisao.decisao === "RECUSADO") {
        motivos.push({ tipo: "PESO_RECUSADO", texto: MOTIVOS.PESO_RECUSADO, peso });
      } else {
        motivos.push({ tipo: "PESO_SUSPEITO", texto: MOTIVOS.PESO_SUSPEITO, peso });
        pesosSuspeitos.push(peso);
      }
    }
    if (materialId) {
      const perda = num(item.percentual_perda) ?? 0;
      const kgComPerda = kg * (1 + Math.max(perda, 0) / 100);
      linhasMaterial.set(materialId, (linhasMaterial.get(materialId) ?? 0) + kgComPerda);
    }
  }

  const estoque = estoques.get(cod);
  if (!estoque) motivos.push({ tipo: "SEM_ESTOQUE", texto: MOTIVOS.SEM_ESTOQUE });
  else if (!(estoque.minimo > 0)) motivos.push({ tipo: "SEM_ESTOQUE_MINIMO", texto: MOTIVOS.SEM_ESTOQUE_MINIMO });

  return { motivos, linhasMaterial, pesosSuspeitos, pesosAceitos };
}

/**
 * Aplica a estrutura do Omie aos itens dos pedidos.
 * Retorna:
 *  - pedidos: itens no formato do cálculo (um por material), só produtos OK;
 *  - pendencias: [{ codigo, produto, motivos }], um por produto;
 *  - pesosAceitos: [{ codigo, produto, codigoMp, quantidade, decisao }].
 */
export function aplicarEstruturaOmie(pedidos = [], {
  estrutura = {},
  vinculos = [],
  materiais = [],
  estoqueProdutos = [],
  decisoes = [],
} = {}) {
  const ctx = {
    estrutura: indexarEstrutura(estrutura),
    mapaMateriais: criarMapaMateriais({ vinculos, materiais }),
    estoques: indexarEstoques(estoqueProdutos),
    decisoes: indexarDecisoes(decisoes),
  };

  const avaliacoes = new Map();
  const nomes = new Map();
  const linhas = [];

  for (const pedido of pedidos) {
    const cod = codigo(pedido.codigo_produto);
    if (!cod) continue;
    if (!nomes.has(cod)) nomes.set(cod, pedido.produto || "Sem descrição");
    if (!avaliacoes.has(cod)) avaliacoes.set(cod, avaliarProduto(cod, ctx));
    const avaliacao = avaliacoes.get(cod);
    if (avaliacao.motivos.length) continue;
    const quantidade = num(pedido.quantidade);
    if (quantidade === null) continue;
    for (const [materialId, kgUn] of avaliacao.linhasMaterial) {
      linhas.push({
        ...pedido,
        codigo_produto: cod,
        material_id: materialId,
        kg_un: kgUn,
        consumo_kg: quantidade * kgUn,
        situacao_cadastro: "OK",
      });
    }
  }

  const pendencias = [];
  const pesosAceitos = [];
  for (const [cod, avaliacao] of avaliacoes) {
    if (avaliacao.motivos.length) {
      pendencias.push({ codigo: cod, produto: nomes.get(cod), motivos: avaliacao.motivos });
    }
    for (const p of avaliacao.pesosAceitos) {
      pesosAceitos.push({ codigo: cod, produto: nomes.get(cod), ...p });
    }
  }
  pendencias.sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR", { numeric: true }));
  pesosAceitos.sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR", { numeric: true }));

  return { pedidos: linhas, pendencias, pesosAceitos };
}
