import Paginacao from "@/components/paginacao/Paginacao";

import { PEDIDOS_POR_PAGINA } from "../constants/pedidos.constants";
import PedidosTabela from "./PedidosTabela";
import {
  PedidosCarregando,
  PedidosErro,
  PedidosVazio,
} from "./PedidosEstado";

export default function PedidosConteudo({
  tituloLista,
  pedidosUnicos,
  pedidosFiltrados,
  pedidosAgrupados,
  notificacoesPorPedido,
  visualizandoCancelados,
  possuiFiltro,
  respostaPedidos,
  erroConsulta,
  isLoading,
  isFetching,
  paginaAtual,
  onPaginaChange,
  onLimparFiltros,
  onVisualizarPedido,
}) {
  return (
    <section
      className={`pedidos-content${
        visualizandoCancelados ? " pedidos-content-cancelados" : ""
      }`}
    >
      <div className="pedidos-content-header">
        <div>
          <h2>{tituloLista}</h2>

          <p>
            {isLoading
              ? "Carregando pedidos..."
              : `${pedidosUnicos.length} pedido${
                  pedidosUnicos.length !== 1 ? "s" : ""
                } encontrado${pedidosUnicos.length !== 1 ? "s" : ""}`}

            {isFetching && !isLoading && " • atualizando"}
          </p>
        </div>

        <span
          className={
            visualizandoCancelados
              ? "pedidos-demo pedidos-demo-cancelado"
              : "pedidos-demo"
          }
        >
          {visualizandoCancelados ? "Somente consulta" : "Dados do Omie"}
        </span>
      </div>

      {erroConsulta && <PedidosErro erro={erroConsulta} />}

      {!erroConsulta && isLoading && <PedidosCarregando />}

      {!erroConsulta && !isLoading && pedidosFiltrados.length > 0 && (
        <>
          <PedidosTabela
            pedidosAgrupados={pedidosAgrupados}
            notificacoesPorPedido={notificacoesPorPedido}
            onVisualizarPedido={onVisualizarPedido}
          />

          <Paginacao
            paginaAtual={paginaAtual}
            totalItens={pedidosUnicos.length}
            itensPorPagina={PEDIDOS_POR_PAGINA}
            onChangePagina={onPaginaChange}
          />
        </>
      )}

      {!erroConsulta && !isLoading && pedidosFiltrados.length === 0 && (
        <PedidosVazio
          visualizandoCancelados={visualizandoCancelados}
          possuiFiltro={possuiFiltro}
          atualizadoEm={respostaPedidos?.atualizadoEm}
          onLimparFiltros={onLimparFiltros}
        />
      )}
    </section>
  );
}
