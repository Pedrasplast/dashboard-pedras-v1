import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  buscarItensPedidosCompra,
  buscarLocaisEstoquePedidosCompra,
  buscarNomesFornecedoresPedidosCompra,
  buscarPedidosCompraAlterados,
  buscarSincronizacaoPedidosCompra,
} from "../services/relatoriosAlterados.service";

import { prepararPedido } from "./pedidosCompraAlterados.regras";

const FORNECEDORES_VAZIOS = Object.freeze({});

/**
 * Consultas do relatório: histórico do período, status da sincronização,
 * nomes dos fornecedores, locais e itens dos pedidos. Devolve os pedidos já
 * preparados e as referências usadas pelo histórico e pela exportação.
 */
export function useDadosPedidosCompraAlterados({ dataInicial, dataFinal, periodoValido }) {
  const historico = useQuery({
    queryKey: ["relatorio-pedidos-compra-alterados", dataInicial, dataFinal],

    queryFn: () => buscarPedidosCompraAlterados(dataInicial, dataFinal),

    enabled: periodoValido,

    staleTime: 30000,

    refetchOnWindowFocus: true,

    refetchInterval: 60000,

    retry: 1,
  });

  const sincronizacao = useQuery({
    queryKey: ["sincronizacao-pedidos-compra-status"],

    queryFn: buscarSincronizacaoPedidosCompra,

    staleTime: 10000,

    refetchInterval: 30000,

    retry: false,
  });

  const fornecedoresQuery = useQuery({
    queryKey: ["nomes-fornecedores-pedidos-compra"],

    queryFn: buscarNomesFornecedoresPedidosCompra,

    staleTime: 30 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });

  const nomesFornecedores = fornecedoresQuery.data?.nomes || FORNECEDORES_VAZIOS;

  const locais = useQuery({
    queryKey: ["locais-estoque-omie-relatorio-compras"],

    queryFn: buscarLocaisEstoquePedidosCompra,

    staleTime: 300000,

    retry: false,
  });

  const itens = useQuery({
    queryKey: ["referencias-itens-pedidos-compra"],

    queryFn: buscarItensPedidosCompra,

    staleTime: 300000,

    refetchInterval: 60000,

    retry: false,
  });

  /* O mesmo mapa de fornecedores serve à coluna Fornecedor e ao histórico. */
  const referencias = useMemo(
    () => ({
      fornecedores: nomesFornecedores,

      locais: locais.data || {},

      itensPorPedido: itens.data || {},
    }),

    [nomesFornecedores, locais.data, itens.data],
  );

  const pedidos = useMemo(
    () =>
      (historico.data || []).map((pedido) => prepararPedido(pedido, referencias)).filter(Boolean),

    [historico.data, referencias],
  );

  return {
    historico,
    sincronizacao,
    fornecedoresQuery,
    nomesFornecedores,
    referencias,
    pedidos,
  };
}
