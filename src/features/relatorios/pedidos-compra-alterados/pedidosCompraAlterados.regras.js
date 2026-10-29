/* =========================================================
   REGRAS DO RELATÓRIO PEDIDOS DE COMPRA ALTERADOS
   ---------------------------------------------------------
   Datas do filtro, preparação do histórico, busca e o
   estado do indicador de sincronização. Sem React.
========================================================= */

import { extrairMudancasCompra, protegerDadosPagamento } from "./formatarHistoricoCompras";
import { normalizarTextoSemAparar } from "@/shared/lib/texto";
import { FUSO_BRASILIA } from "@/shared/lib/datas";

/* =========================================================
   DATAS
========================================================= */

const FORMATADOR_DATA_BRASILIA = new Intl.DateTimeFormat("en-US", {
  timeZone: FUSO_BRASILIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Hoje em Brasília, "AAAA-MM-DD". */
export function dataHoje() {
  const partes = FORMATADOR_DATA_BRASILIA.formatToParts(new Date());

  const ler = (tipo) => partes.find((p) => p.type === tipo)?.value || "00";

  return `${ler("year")}-${ler("month")}-${ler("day")}`;
}

/** Primeiro dia do mês de uma data "AAAA-MM-DD". */
export function inicioDoMes(dataISO) {
  return `${dataISO.slice(0, 8)}01`;
}

export function dataBR(valor) {
  return valor ? valor.split("-").reverse().join("/") : "Sem limite";
}

/* =========================================================
   PREPARAR PEDIDO E HISTÓRICO
========================================================= */

/**
 * Eventos com mudanças relevantes, do mais novo (número maior) para o mais
 * antigo. Pedido sem nenhuma mudança relevante volta `null`.
 */
export function prepararPedido(pedido, referencias) {
  const refsPedido = {
    ...referencias,

    itens: referencias.itensPorPedido[String(pedido.cod_ped_compra)] || {},
  };

  const eventos = (Array.isArray(pedido.detalhes_alteracoes) ? pedido.detalhes_alteracoes : [])
    .map((evento) => ({
      id: evento.id,

      detectado_em: evento.detectado_em,

      mudancas: extrairMudancasCompra(evento, refsPedido),
    }))
    .filter((evento) => evento.mudancas.length > 0)
    .sort(
      (a, b) => new Date(b.detectado_em) - new Date(a.detectado_em) || Number(b.id) - Number(a.id),
    )
    .map((evento, indice, todos) => ({
      ...evento,

      numeroAlteracao: todos.length - indice,
    }));

  if (!eventos.length) {
    return null;
  }

  return {
    cod_ped_compra: pedido.cod_ped_compra,

    numero_pedido: pedido.numero_pedido,

    fornecedor_codigo: pedido.fornecedor_codigo,

    detalhes_alteracoes: eventos,

    primeira_alteracao: eventos[eventos.length - 1].detectado_em,

    ultima_alteracao: eventos[0].detectado_em,

    quantidade_alteracoes: eventos.length,

    campos_alterados: [
      ...new Set(
        eventos.flatMap((evento) => evento.mudancas.map((mudanca) => mudanca.tituloCurto)),
      ),
    ],
  };
}

/* =========================================================
   BUSCA
========================================================= */

/** Busca em número, código, fornecedor, campos e valores (antes, depois e variação). */
export function filtrarPedidosCompra(pedidos, pesquisa, nomesFornecedores) {
  const termo = normalizarTextoSemAparar(pesquisa.trim());

  if (!termo) {
    return pedidos;
  }

  return pedidos.filter((pedido) => {
    const codigoFornecedor = String(pedido.fornecedor_codigo ?? "");

    const nomeFornecedor = nomesFornecedores[codigoFornecedor] || "";

    return normalizarTextoSemAparar(
      [
        pedido.numero_pedido,

        pedido.cod_ped_compra,

        pedido.fornecedor_codigo,

        nomeFornecedor,

        ...pedido.campos_alterados,

        ...pedido.detalhes_alteracoes.flatMap((evento) =>
          evento.mudancas.flatMap((mudanca) => [
            mudanca.campo,
            mudanca.anterior,
            mudanca.novo,
            mudanca.variacao,
          ]),
        ),
      ].join(" "),
    ).includes(termo);
  });
}

/* =========================================================
   INDICADOR DE SINCRONIZAÇÃO
========================================================= */

const CORES_SINCRONIZACAO = {
  falha: { cor: "#b91c1c", fundo: "#fef2f2", borda: "#fecaca" },
  concluida: { cor: "#15803d", fundo: "#f0fdf4", borda: "#bbf7d0" },
  andamento: { cor: "#1d4ed8", fundo: "#eff6ff", borda: "#bfdbfe" },
};

/**
 * Falha (erro na consulta ou status "erro"), concluída (sucesso na última
 * página) ou em andamento; com o instante, as cores e a mensagem de erro.
 */
export function descreverSincronizacao(dados, erro) {
  const falha = Boolean(erro) || dados?.status === "erro";

  const concluida = dados?.status === "sucesso" && Number(dados?.pagina_proxima ?? 1) === 1;

  const andamento =
    !falha && !concluida && (dados?.status === "executando" || dados?.status === "sucesso");

  const cores = falha
    ? CORES_SINCRONIZACAO.falha
    : concluida
      ? CORES_SINCRONIZACAO.concluida
      : CORES_SINCRONIZACAO.andamento;

  return {
    falha,

    concluida,

    andamento,

    instante: falha ? dados?.atualizado_em || dados?.finalizado_em : dados?.finalizado_em,

    ...cores,

    mensagem: falha
      ? protegerDadosPagamento(
          erro
            ? "Não foi possível consultar o status no Supabase."
            : dados?.mensagem || "Falha na sincronização automática.",
        )
      : "",
  };
}
