import { Search, X } from "lucide-react";
import { normalizarTexto } from "../utils/format.utils";

export default function PedidosFiltros({
  pesquisa,
  vendedor,
  status,
  vendedores,
  statusDisponiveis,
  possuiFiltro,
  onAlterarPesquisa,
  onAlterarVendedor,
  onAlterarStatus,
  onLimpar,
}) {
  return (
    <section className="pedidos-filtros">
      <div className="pedidos-pesquisa">
        <Search size={18} />

        <input
          type="text"
          value={pesquisa}
          onChange={(evento) => onAlterarPesquisa(evento.target.value)}
          placeholder="Buscar pedido, cliente, código ou produto..."
        />
      </div>

      <select value={vendedor} onChange={(evento) => onAlterarVendedor(evento.target.value)}>
        <option value="todos">Todos os vendedores</option>

        {vendedores.map((nome) => (
          <option key={nome} value={nome}>
            {nome}
          </option>
        ))}
      </select>

      <select value={status} onChange={(evento) => onAlterarStatus(evento.target.value)}>
        <option value="Pedido">Pedido</option>
        <option value="todos">Todos os status</option>
        <option value="Cancelado">Cancelados</option>

        {statusDisponiveis
          .filter((nomeStatus) => {
            const statusNormalizado = normalizarTexto(nomeStatus);
            return statusNormalizado !== "pedido" && statusNormalizado !== "cancelado";
          })
          .map((nomeStatus) => (
            <option key={nomeStatus} value={nomeStatus}>
              {nomeStatus}
            </option>
          ))}
      </select>

      {possuiFiltro && (
        <button type="button" className="pedidos-btn-limpar" onClick={onLimpar}>
          <X size={16} />
          Limpar
        </button>
      )}
    </section>
  );
}
