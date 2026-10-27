import { supabase } from "@/lib/supabaseClient";

function garantirSemErro(resultado, mensagemPadrao) {
  if (resultado?.error) {
    throw new Error(resultado.error.message || mensagemPadrao);
  }

  return resultado?.data ?? [];
}

export async function buscarResumosRecebimentoFisico(codigosPedidos = []) {
  const codigos = [
    ...new Set(
      codigosPedidos.map(Number).filter((codigo) => Number.isFinite(codigo) && codigo > 0),
    ),
  ];

  if (!codigos.length) {
    return [];
  }

  const resultado = await supabase
    .from("pedidos_compra_recebimento_fisico_resumo")
    .select("*")
    .in("cod_ped_compra", codigos);

  return garantirSemErro(resultado, "Não foi possível carregar o recebimento físico.");
}

export async function buscarItensRecebimentoFisico(codPedidoCompra) {
  const resultado = await supabase
    .from("pedidos_compra_recebimento_fisico_itens")
    .select("*")
    .eq("cod_ped_compra", Number(codPedidoCompra))
    .order("codigo_item", { ascending: true });

  return garantirSemErro(resultado, "Não foi possível carregar os itens do recebimento físico.");
}

export async function buscarHistoricoRecebimentoFisico(codPedidoCompra) {
  const resultado = await supabase
    .from("pedidos_compra_recebimentos_fisicos")
    .select(
      [
        "id",
        "cod_ped_compra",
        "numero_pedido",
        "codigo_item",
        "codigo_produto",
        "codigo_comercial",
        "descricao_produto",
        "unidade",
        "quantidade_movimentada",
        "tipo_movimento",
        "usuario_id",
        "usuario_nome",
        "registrado_em",
        "observacao",
      ].join(","),
    )
    .eq("cod_ped_compra", Number(codPedidoCompra))
    .order("registrado_em", { ascending: false })
    .order("id", { ascending: false });

  return garantirSemErro(resultado, "Não foi possível carregar o histórico do recebimento físico.");
}

async function obterNomeUsuarioAtual() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  const usuario = data?.user;

  if (!usuario?.id) {
    throw new Error("Usuário não autenticado.");
  }

  return (
    String(
      usuario.user_metadata?.nome ??
        usuario.user_metadata?.full_name ??
        usuario.user_metadata?.name ??
        usuario.email ??
        usuario.id,
    ).trim() || usuario.id
  );
}

export async function registrarRecebimentoFisicoItem({
  codPedidoCompra,
  codigoItem,
  quantidade,
  observacao,
}) {
  const usuarioNome = await obterNomeUsuarioAtual();

  const resultado = await supabase.rpc("registrar_recebimento_fisico_item", {
    p_cod_ped_compra: Number(codPedidoCompra),
    p_codigo_item: Number(codigoItem),
    p_quantidade: Number(quantidade),
    p_usuario_nome: usuarioNome,
    p_observacao: String(observacao ?? "").trim() || null,
  });

  if (resultado.error) {
    throw new Error(resultado.error.message || "Não foi possível registrar o recebimento físico.");
  }

  return resultado.data;
}

export async function estornarRecebimentoFisicoItem({
  codPedidoCompra,
  codigoItem,
  quantidade,
  observacao,
}) {
  const usuarioNome = await obterNomeUsuarioAtual();

  const resultado = await supabase.rpc("estornar_recebimento_fisico_item", {
    p_cod_ped_compra: Number(codPedidoCompra),
    p_codigo_item: Number(codigoItem),
    p_quantidade: Number(quantidade),
    p_usuario_nome: usuarioNome,
    p_observacao: String(observacao ?? "").trim(),
  });

  if (resultado.error) {
    throw new Error(resultado.error.message || "Não foi possível estornar o recebimento físico.");
  }

  return resultado.data;
}

export async function receberSaldoFisicoCompleto({ codPedidoCompra, itens, observacao }) {
  const pendentes = (Array.isArray(itens) ? itens : []).filter(
    (item) => Number(item?.quantidade_pendente_fisica ?? 0) > 0,
  );

  for (const item of pendentes) {
    await registrarRecebimentoFisicoItem({
      codPedidoCompra,
      codigoItem: item.codigo_item,
      quantidade: item.quantidade_pendente_fisica,
      observacao,
    });
  }

  return pendentes.length;
}

export async function buscarRecebimentosFisicosUltimos7Dias() {
  const inicio = new Date();

  inicio.setHours(0, 0, 0, 0);

  inicio.setDate(inicio.getDate() - 6);

  const resultado = await supabase
    .from("pedidos_compra_recebimentos_fisicos")
    .select(
      [
        "id",
        "cod_ped_compra",
        "numero_pedido",
        "codigo_item",
        "codigo_produto",
        "codigo_comercial",
        "descricao_produto",
        "unidade",
        "quantidade_movimentada",
        "tipo_movimento",
        "usuario_id",
        "usuario_nome",
        "registrado_em",
        "observacao",
      ].join(","),
    )
    .eq("tipo_movimento", "RECEBIMENTO")
    .gte("registrado_em", inicio.toISOString())
    .order("registrado_em", { ascending: false })
    .order("id", { ascending: false });

  return garantirSemErro(
    resultado,
    "Não foi possível carregar os recebimentos físicos dos últimos 7 dias.",
  );
}
