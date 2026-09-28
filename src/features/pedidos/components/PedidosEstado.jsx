import { AlertTriangle, RefreshCw, Search } from "lucide-react";

export function PedidosErro({ erro }) {
  return (
    <div className="pedidos-empty">
      <div className="pedidos-empty-icon">
        <AlertTriangle size={30} />
      </div>

      <h3>Não foi possível carregar os pedidos</h3>
      <p>
        {erro?.message ||
          "Ocorreu um erro ao consultar os pedidos armazenados."}
      </p>
    </div>
  );
}

export function PedidosCarregando() {
  return (
    <div className="pedidos-empty">
      <div className="pedidos-empty-icon">
        <RefreshCw size={30} />
      </div>

      <h3>Carregando pedidos</h3>
      <p>Consultando os pedidos armazenados no sistema.</p>
    </div>
  );
}

export function PedidosVazio({
  visualizandoCancelados,
  possuiFiltro,
  atualizadoEm,
  onLimparFiltros,
}) {
  return (
    <div className="pedidos-empty">
      <div className="pedidos-empty-icon">
        <Search size={30} />
      </div>

      <h3>
        {visualizandoCancelados
          ? "Nenhum pedido cancelado encontrado"
          : "Nenhum pedido encontrado"}
      </h3>

      <p>
        {visualizandoCancelados
          ? "Os pedidos cancelados passarão a aparecer nesta consulta à medida que forem cancelados no Omie daqui para a frente."
          : possuiFiltro
            ? "Não existem pedidos que correspondam aos filtros selecionados."
            : atualizadoEm
              ? "Nenhum pedido com status Pedido foi encontrado."
              : "Ainda não existem pedidos sincronizados. Aguardando a primeira sincronização automática."}
      </p>

      {possuiFiltro && !visualizandoCancelados && (
        <button
          type="button"
          className="pedidos-btn-limpar-vazio"
          onClick={onLimparFiltros}
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
