import { useEffect, useMemo, useState } from "react";

import { PEDIDOS_POR_PAGINA } from "../constants/pedidos.constants";
import { normalizarTexto } from "../utils/format.utils";
import {
  agruparPedidos,
  contarFaturamentosProximos7Dias,
  contarPedidosAtrasados,
  filtrarPedidos,
  obterLinhasDaPagina,
  obterPedidosUnicos,
  obterStatusDisponiveis,
  obterVendedores,
  ordenarPedidosUnicosPorNotificacao,
  pedidoEhCancelado,
  somarQuantidade,
} from "../utils/pedidos.utils";

export function usePedidosViewModel({ pedidos, notificacoesPorPedido }) {
  const [pesquisa, setPesquisa] = useState("");
  const [vendedor, setVendedor] = useState("todos");
  const [status, setStatus] = useState("Pedido");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const vendedores = useMemo(() => obterVendedores(pedidos), [pedidos]);

  const statusDisponiveis = useMemo(
    () => obterStatusDisponiveis(pedidos),
    [pedidos],
  );

  const visualizandoCancelados = useMemo(
    () => normalizarTexto(status) === "cancelado",
    [status],
  );

  const pedidosFiltrados = useMemo(
    () => filtrarPedidos(pedidos, { pesquisa, vendedor, status }),
    [pedidos, pesquisa, vendedor, status],
  );

  const pedidosUnicos = useMemo(() => {
    const unicos = obterPedidosUnicos(pedidosFiltrados);
    return ordenarPedidosUnicosPorNotificacao(unicos, notificacoesPorPedido);
  }, [pedidosFiltrados, notificacoesPorPedido]);

  const pedidosOperacionaisFiltrados = useMemo(
    () => pedidosFiltrados.filter((pedido) => !pedidoEhCancelado(pedido)),
    [pedidosFiltrados],
  );

  const pedidosOperacionaisUnicos = useMemo(
    () => obterPedidosUnicos(pedidosOperacionaisFiltrados),
    [pedidosOperacionaisFiltrados],
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(pedidosUnicos.length / PEDIDOS_POR_PAGINA),
  );

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const pedidosUnicosDaPagina = useMemo(() => {
    const inicio = (paginaAtual - 1) * PEDIDOS_POR_PAGINA;
    const fim = inicio + PEDIDOS_POR_PAGINA;
    return pedidosUnicos.slice(inicio, fim);
  }, [pedidosUnicos, paginaAtual]);

  const pedidosPaginados = useMemo(
    () => obterLinhasDaPagina(pedidosFiltrados, pedidosUnicosDaPagina),
    [pedidosFiltrados, pedidosUnicosDaPagina],
  );

  const pedidosAgrupados = useMemo(
    () => agruparPedidos(pedidosPaginados),
    [pedidosPaginados],
  );

  const quantidadeTotal = useMemo(
    () => somarQuantidade(pedidosOperacionaisFiltrados),
    [pedidosOperacionaisFiltrados],
  );

  const pedidosAtrasados = useMemo(
    () => contarPedidosAtrasados(pedidosOperacionaisUnicos),
    [pedidosOperacionaisUnicos],
  );

  const entregasProximos7Dias = useMemo(
    () => contarFaturamentosProximos7Dias(pedidosOperacionaisUnicos),
    [pedidosOperacionaisUnicos],
  );

  const possuiFiltro =
    Boolean(pesquisa) || vendedor !== "todos" || status !== "Pedido";

  const tituloLista = useMemo(() => {
    if (visualizandoCancelados) return "Pedidos cancelados";
    if (status === "todos") return "Todos os pedidos";
    if (status && status !== "Pedido") return `Pedidos - ${status}`;
    return "Pedidos em aberto";
  }, [status, visualizandoCancelados]);

  function alterarPesquisa(valor) {
    setPesquisa(valor);
    setPaginaAtual(1);
  }

  function alterarVendedor(valor) {
    setVendedor(valor);
    setPaginaAtual(1);
  }

  function alterarStatus(valor) {
    setStatus(valor);
    setPaginaAtual(1);
  }

  function limparFiltros() {
    setPesquisa("");
    setVendedor("todos");
    setStatus("Pedido");
    setPaginaAtual(1);
  }

  return {
    pesquisa,
    vendedor,
    status,
    paginaAtual,
    setPaginaAtual,
    alterarPesquisa,
    alterarVendedor,
    alterarStatus,
    limparFiltros,
    vendedores,
    statusDisponiveis,
    visualizandoCancelados,
    pedidosFiltrados,
    pedidosUnicos,
    pedidosAgrupados,
    pedidosOperacionaisUnicos,
    quantidadeTotal,
    pedidosAtrasados,
    entregasProximos7Dias,
    possuiFiltro,
    tituloLista,
  };
}
