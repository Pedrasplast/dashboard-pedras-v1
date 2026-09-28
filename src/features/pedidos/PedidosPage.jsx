import { Clock3, ShoppingCart } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";

import AtualizacaoAutomatica from "./components/AtualizacaoAutomatica";
import PedidosAvisoCancelados from "./components/PedidosAvisoCancelados";
import PedidosConteudo from "./components/PedidosConteudo";
import PedidosFiltros from "./components/PedidosFiltros";
import PedidosResumo from "./components/PedidosResumo";
import { usePedidosData } from "./hooks/usePedidosData";
import { usePedidosViewModel } from "./hooks/usePedidosViewModel";

import "./PedidosPage.css";

export default function PedidosPage() {
  const {
    respostaPedidos,
    pedidos,
    erroConsulta,
    isLoading,
    isFetching,
    notificacoesPorPedido,
    marcarPedidoComoVisualizado,
  } = usePedidosData();

  const vm = usePedidosViewModel({
    pedidos,
    notificacoesPorPedido,
  });

  return (
    <main className="pedidos-page">
      <div className="pedidos-container">
        <PageHeader
          eyebrow="Comercial"
          title="Pedidos"
          description="Acompanhamento dos pedidos de venda e consulta dos pedidos cancelados."
          icon={ShoppingCart}
          className="pedidos-header"
          actions={
            <AtualizacaoAutomatica
              atualizadoEm={respostaPedidos?.atualizadoEm}
            />
          }
        />

        {!vm.visualizandoCancelados && (
          <PedidosResumo
            isLoading={isLoading}
            quantidadePedidos={vm.pedidosOperacionaisUnicos.length}
            pedidosAtrasados={vm.pedidosAtrasados}
            quantidadeTotal={vm.quantidadeTotal}
            entregasProximos7Dias={vm.entregasProximos7Dias}
          />
        )}

        <PedidosFiltros
          pesquisa={vm.pesquisa}
          vendedor={vm.vendedor}
          status={vm.status}
          vendedores={vm.vendedores}
          statusDisponiveis={vm.statusDisponiveis}
          possuiFiltro={vm.possuiFiltro}
          onPesquisaChange={vm.alterarPesquisa}
          onVendedorChange={vm.alterarVendedor}
          onStatusChange={vm.alterarStatus}
          onLimpar={vm.limparFiltros}
        />

        {vm.visualizandoCancelados && <PedidosAvisoCancelados />}

        <PedidosConteudo
          tituloLista={vm.tituloLista}
          pedidosUnicos={vm.pedidosUnicos}
          pedidosFiltrados={vm.pedidosFiltrados}
          pedidosAgrupados={vm.pedidosAgrupados}
          notificacoesPorPedido={notificacoesPorPedido}
          visualizandoCancelados={vm.visualizandoCancelados}
          possuiFiltro={vm.possuiFiltro}
          respostaPedidos={respostaPedidos}
          erroConsulta={erroConsulta}
          isLoading={isLoading}
          isFetching={isFetching}
          paginaAtual={vm.paginaAtual}
          onPaginaChange={vm.setPaginaAtual}
          onLimparFiltros={vm.limparFiltros}
          onVisualizarPedido={marcarPedidoComoVisualizado}
        />

        <div className="pedidos-rodape-info">
          <Clock3 size={14} />
          Os pedidos são sincronizados automaticamente com o Omie.
        </div>
      </div>
    </main>
  );
}
