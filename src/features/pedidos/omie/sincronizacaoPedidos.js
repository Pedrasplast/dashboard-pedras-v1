/* =========================================================
   SINCRONIZAÇÃO OMIE → SUPABASE
   ---------------------------------------------------------
   SOMENTE SERVIDOR. Busca os pedidos em aberto no Omie,
   grava na tabela pedidos_omie e registra o andamento em
   sincronizacao_omie.
========================================================= */

import { buscarClientes, buscarEtapas, buscarVendedores, listarPedidosOmie } from "./omieApi";
import { normalizarPedidosParaBanco, pedidoEstaEmAberto } from "./pedidosOmie.regras";
import { criarClienteSupabaseAdmin } from "./supabaseServidor";

async function atualizarControleSincronizacao(supabaseAdmin, dados) {
  const { error } = await supabaseAdmin.from("sincronizacao_omie").upsert(
    {
      id: 1,

      ...dados,

      atualizado_em: new Date().toISOString(),
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw new Error(`Erro ao atualizar controle da sincronização: ${error.message}`);
  }
}

async function gravarPedidosNoSupabase({ supabaseAdmin, linhas, sincronizadoEm }) {
  const TAMANHO_LOTE = 500;

  /*
   * Primeiro gravamos todos os pedidos atuais. Somente depois disso
   * desativamos pedidos que não vieram mais do Omie.
   */
  for (let indice = 0; indice < linhas.length; indice += TAMANHO_LOTE) {
    const lote = linhas.slice(indice, indice + TAMANHO_LOTE);

    const { error } = await supabaseAdmin.from("pedidos_omie").upsert(lote, {
      onConflict: "chave_item",
    });

    if (error) {
      throw new Error(`Erro ao gravar pedidos no Supabase: ${error.message}`);
    }
  }

  /*
   * Tudo que estava ativo, mas não recebeu a marca desta sincronização,
   * deixou de ser pedido em aberto.
   */
  const { error: erroDesativar } = await supabaseAdmin
    .from("pedidos_omie")
    .update({
      ativo: false,

      atualizado_em: sincronizadoEm,
    })
    .eq("ativo", true)
    .lt("sincronizado_em", sincronizadoEm);

  if (erroDesativar) {
    throw new Error(`Erro ao atualizar pedidos encerrados: ${erroDesativar.message}`);
  }
}

export async function executarSincronizacaoPedidos() {
  const inicio = Date.now();

  const sincronizadoEm = new Date().toISOString();

  const appKey = process.env.OMIE_APP_KEY;

  const appSecret = process.env.OMIE_APP_SECRET;

  if (!appKey || !appSecret) {
    throw new Error("As credenciais do Omie não estão configuradas.");
  }

  const supabaseAdmin = criarClienteSupabaseAdmin();

  await atualizarControleSincronizacao(supabaseAdmin, {
    status: "sincronizando",

    mensagem: "Consultando pedidos no Omie",
  });

  try {
    const todosPedidos = await listarPedidosOmie({
      appKey,
      appSecret,
    });

    /*
     * Só os abertos: a própria API informa faturado, cancelado, denegado,
     * devolvido e encerrado.
     */
    const pedidosAbertos = todosPedidos.filter(pedidoEstaEmAberto);

    const [clientes, vendedores, etapas] = await Promise.all([
      buscarClientes({
        pedidos: pedidosAbertos,

        appKey,
        appSecret,
      }),

      buscarVendedores({
        appKey,
        appSecret,
      }),

      buscarEtapas({
        appKey,
        appSecret,
      }),
    ]);

    const linhas = normalizarPedidosParaBanco({
      pedidos: pedidosAbertos,

      clientes,

      vendedores,

      etapas,

      sincronizadoEm,
    });

    await gravarPedidosNoSupabase({
      supabaseAdmin,

      linhas,

      sincronizadoEm,
    });

    const duracao = Date.now() - inicio;

    await atualizarControleSincronizacao(supabaseAdmin, {
      ultima_sincronizacao: sincronizadoEm,

      status: "sucesso",

      quantidade_pedidos: pedidosAbertos.length,

      quantidade_itens: linhas.length,

      duracao_ms: duracao,

      mensagem: "Pedidos sincronizados com sucesso",
    });

    return {
      sucesso: true,

      quantidadePedidos: pedidosAbertos.length,

      quantidadeItens: linhas.length,

      duracaoMs: duracao,

      atualizadoEm: sincronizadoEm,
    };
  } catch (erro) {
    const duracao = Date.now() - inicio;

    /*
     * Mantemos os dados antigos: se o Omie falhar, a tela não fica vazia.
     */
    try {
      await atualizarControleSincronizacao(supabaseAdmin, {
        status: "erro",

        duracao_ms: duracao,

        mensagem: String(erro?.message || "Erro desconhecido").slice(0, 1000),
      });
    } catch {
      /* Não substituímos o erro principal caso o registro de log também falhe. */
    }

    throw erro;
  }
}
