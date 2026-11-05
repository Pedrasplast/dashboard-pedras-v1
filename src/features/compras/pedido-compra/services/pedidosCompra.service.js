import { supabase } from "@/lib/supabaseClient";

import { gravarCache, lerCache } from "@/lib/cacheIndexedDB";

import { enriquecerPedido, ordenarPedidos } from "../utils/pedidosCompra.utils";

const TAMANHO_PAGINA = 1000;

/*
 * Os nomes de fornecedores/compradores mudam com muito menos
 * frequência do que os pedidos.
 *
 * Mantemos essa resposta em memória por 15 minutos para que o
 * refresh da tela a cada 30 segundos não invoque a Edge Function
 * repetidamente.
 */
const TEMPO_CACHE_NOMES_OMIE = 15 * 60 * 1000;

let cacheNomesOmie = null;
let cacheNomesOmieEm = 0;

/*
 * ECONOMIA DE EGRESS (05/11/2026)
 *
 * A lista completa (documentos + itens) tem ~10 MB. Antes ela era
 * baixada a cada 5 minutos com a tela aberta e a cada abertura,
 * mesmo sem nenhuma mudança no Omie.
 *
 * Agora a tela pergunta primeiro a "versão" dos dados ao banco
 * (RPC versao_compras_documentos, resposta de 32 caracteres) e só
 * baixa a lista quando a versão mudou. A última lista fica guardada
 * em memória e no IndexedDB do navegador, junto com a versão.
 *
 * Se a RPC falhar por qualquer motivo, a tela faz a carga completa
 * exatamente como antes.
 */
const CHAVE_CACHE_LOCAL = "pedidos-compra:dados-brutos:v1";

/*
 * Os nomes de compradores vêm da Edge Function e não entram na versão.
 * Mesmo sem mudança nos pedidos, eles são renovados após 6 horas.
 */
const TEMPO_RENOVAR_NOMES_SEM_MUDANCA = 6 * 60 * 60 * 1000;

let dadosBrutosMemoria = null;

async function buscarTodos(nomeTabela, colunas, configurarConsulta) {
  const registros = [];

  let inicio = 0;

  while (true) {
    let consulta = supabase.from(nomeTabela).select(colunas);

    if (typeof configurarConsulta === "function") {
      consulta = configurarConsulta(consulta);
    }

    const { data, error } = await consulta.range(inicio, inicio + TAMANHO_PAGINA - 1);

    if (error) {
      throw error;
    }

    const pagina = Array.isArray(data) ? data : [];

    registros.push(...pagina);

    if (pagina.length < TAMANHO_PAGINA) {
      break;
    }

    inicio += TAMANHO_PAGINA;
  }

  return registros;
}

async function buscarEstadoSincronizacao() {
  const { data, error } = await supabase
    .from("sincronizacao_pedidos_compra_omie")
    .select(
      "id,status,iniciado_em,finalizado_em,atualizado_em,varredura_iniciada_em,total_pedidos,total_paginas,mensagem",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

async function buscarVersaoDados() {
  try {
    const { data, error } = await supabase.rpc("versao_compras_documentos");

    if (error || typeof data !== "string" || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/*
 * Colunas lidas da view de documentos.
 *
 * IMPORTANTE: o JSON "snapshot" NAO e lido aqui. Ele representava
 * cerca de 70% do volume baixado (11 MB de 16 MB por carga).
 * A coluna "solicitante" tambem deixou de ser lida (28/10/2026):
 * saiu da tabela da tela.
 */
export const COLUNAS_DOCUMENTOS_COMPRA =
  "documento_id,tipo_documento,numero_documento,cod_ped_compra,cod_req_compra,numero_pedido,numero_requisicao,codigo_fornecedor,codigo_comprador,categoria,categoria_nome,centro_custo,condicao_pagamento,data_previsao,data_inclusao,observacoes,observacoes_internas,quantidade_itens,primeira_sincronizacao_em,ultima_sincronizacao_em";

async function buscarDocumentosAtuais() {
  return buscarTodos(
    "compras_documentos_front",

    COLUNAS_DOCUMENTOS_COMPRA,

    (consulta) =>
      consulta.order("documento_id", {
        ascending: true,
      }),
  );
}

async function buscarItens() {
  return buscarTodos(
    "compras_documentos_itens_front",

    "documento_id,tipo_documento,cod_ped_compra,cod_req_compra,numero_documento,codigo_item,codigo_produto,codigo_comercial,descricao,unidade,quantidade,quantidade_recebida,preco_unitario,valor_total,desconto,observacao,local_estoque,sequencia",

    (consulta) =>
      consulta.order("documento_id", {
        ascending: true,
      }),
  );
}

async function buscarFornecedoresCache() {
  return buscarTodos(
    "pedidos_compra_fornecedores",

    "codigo,nome,atualizado_em",

    (consulta) =>
      consulta.order("codigo", {
        ascending: true,
      }),
  );
}

async function buscarNomesOmie() {
  const agora = Date.now();

  if (cacheNomesOmie && agora - cacheNomesOmieEm < TEMPO_CACHE_NOMES_OMIE) {
    return cacheNomesOmie;
  }

  const { data, error } = await supabase.functions.invoke("nomes-fornecedores-pedidos-compra", {
    body: {},
  });

  if (error) {
    console.warn("Não foi possível atualizar os nomes dos pedidos de compra:", error.message);

    /*
     * Se já existe um cache válido anterior, preservamos os nomes
     * conhecidos em vez de trocar tudo por 'não identificado'.
     */
    if (cacheNomesOmie) {
      return {
        ...cacheNomesOmie,
        consulta_omie_falhou: true,
      };
    }

    return {
      fornecedores: {},

      compradores: {},

      consulta_omie_falhou: true,
    };
  }

  const resultado = {
    fornecedores:
      data?.fornecedores && typeof data.fornecedores === "object" ? data.fornecedores : {},

    compradores: data?.compradores && typeof data.compradores === "object" ? data.compradores : {},

    consulta_omie_falhou: Boolean(data?.consulta_omie_falhou),
  };

  cacheNomesOmie = resultado;

  cacheNomesOmieEm = agora;

  return resultado;
}

/*
 * Para testes e para um eventual botão "recarregar tudo".
 */
export function limparCacheMemoriaPedidosCompra() {
  dadosBrutosMemoria = null;
  cacheNomesOmie = null;
  cacheNomesOmieEm = 0;
}

async function baixarDadosCompletos(versao) {
  const [documentos, itens, fornecedoresCache, nomesOmie] = await Promise.all([
    buscarDocumentosAtuais(),

    buscarItens(),

    buscarFornecedoresCache(),

    buscarNomesOmie(),
  ]);

  return {
    versao,
    documentos,
    itens,
    fornecedoresCache,
    nomesOmie,
    nomesOmieEm: Date.now(),
  };
}

async function obterDadosBrutos(versao) {
  /*
   * Sem versão (RPC indisponível): comportamento antigo, carga completa.
   */
  if (!versao) {
    return baixarDadosCompletos(null);
  }

  const emCache =
    dadosBrutosMemoria?.versao === versao
      ? dadosBrutosMemoria
      : await lerCache(CHAVE_CACHE_LOCAL);

  if (emCache?.versao === versao && Array.isArray(emCache.documentos)) {
    let dados = emCache;

    const nomesVelhos =
      !emCache.nomesOmie ||
      emCache.nomesOmie.consulta_omie_falhou ||
      Date.now() - Number(emCache.nomesOmieEm ?? 0) > TEMPO_RENOVAR_NOMES_SEM_MUDANCA;

    if (nomesVelhos) {
      dados = {
        ...emCache,
        nomesOmie: await buscarNomesOmie(),
        nomesOmieEm: Date.now(),
      };

      void gravarCache(CHAVE_CACHE_LOCAL, dados);
    }

    dadosBrutosMemoria = dados;

    return dados;
  }

  const dados = await baixarDadosCompletos(versao);

  dadosBrutosMemoria = dados;

  void gravarCache(CHAVE_CACHE_LOCAL, dados);

  return dados;
}

export async function buscarPedidosCompra() {
  /*
   * Estado da sincronização (1 linha) e versão dos dados (32 caracteres)
   * são sempre lidos. A lista pesada só é baixada se a versão mudou.
   */
  const [estado, versao] = await Promise.all([buscarEstadoSincronizacao(), buscarVersaoDados()]);

  const { documentos, itens, fornecedoresCache, nomesOmie } = await obterDadosBrutos(versao);

  const idsAtuais = new Set(documentos.map((documento) => String(documento.documento_id ?? "")));

  const itensPorDocumento = new Map();

  for (const item of itens) {
    const documentoId = String(item?.documento_id ?? "");

    if (!idsAtuais.has(documentoId)) {
      continue;
    }

    if (!itensPorDocumento.has(documentoId)) {
      itensPorDocumento.set(documentoId, []);
    }

    itensPorDocumento.get(documentoId).push(item);
  }

  for (const lista of itensPorDocumento.values()) {
    lista.sort((a, b) => Number(a?.sequencia ?? 0) - Number(b?.sequencia ?? 0));
  }

  const mapaFornecedores = new Map(
    fornecedoresCache
      .map((fornecedor) => [
        String(fornecedor.codigo ?? "").trim(),

        String(fornecedor.nome ?? "").trim(),
      ])
      .filter(([codigo, nome]) => codigo && nome),
  );

  for (const [codigo, nome] of Object.entries(nomesOmie.fornecedores)) {
    const codigoNormalizado = String(codigo ?? "").trim();

    const nomeNormalizado = String(nome ?? "").trim();

    if (codigoNormalizado && nomeNormalizado) {
      mapaFornecedores.set(codigoNormalizado, nomeNormalizado);
    }
  }

  const mapaCompradores = new Map(
    Object.entries(nomesOmie.compradores)
      .map(([codigo, nome]) => [String(codigo ?? "").trim(), String(nome ?? "").trim()])
      .filter(([codigo, nome]) => codigo && nome),
  );

  const documentosEnriquecidos = documentos.map((documento) =>
    enriquecerPedido(
      documento,

      itensPorDocumento.get(String(documento.documento_id ?? "")) ?? [],

      mapaFornecedores,

      mapaCompradores,
    ),
  );

  return {
    pedidos: ordenarPedidos(documentosEnriquecidos),

    estadoSincronizacao: estado,

    atualizadoEm: estado?.finalizado_em ?? estado?.atualizado_em ?? null,

    consultaNomesOmieFalhou: nomesOmie.consulta_omie_falhou,
  };
}
