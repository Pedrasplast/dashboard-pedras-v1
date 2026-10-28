import { Bell, X } from "lucide-react";

/* =========================================================
   ALERTA DE PEDIDO NOVO / ALTERADO
========================================================= */

export default function AlertaPedido({
  ultimaNotificacaoPedido,
  alertaPedidoAlterado,
  abrirPedidosPeloAlerta,
  fecharAlertaPedido,
}) {
  return (
    <div
      className={[
        "novo-pedido-alerta",
        alertaPedidoAlterado ? "novo-pedido-alerta-alterado" : "novo-pedido-alerta-novo",
      ].join(" ")}
      role="status"
    >
      <button
        type="button"
        className="novo-pedido-alerta-conteudo"
        onClick={abrirPedidosPeloAlerta}
      >
        <span className="novo-pedido-alerta-icone">
          <Bell size={20} strokeWidth={2.2} aria-hidden="true" />
        </span>

        <span className="novo-pedido-alerta-textos">
          <strong>{alertaPedidoAlterado ? "Pedido alterado" : "Novo pedido recebido"}</strong>

          <span>
            Pedido{" "}
            <b>
              {ultimaNotificacaoPedido.numeroPedido || ultimaNotificacaoPedido.codigoPedidoOmie}
            </b>
            {ultimaNotificacaoPedido.cliente ? ` • ${ultimaNotificacaoPedido.cliente}` : ""}
          </span>

          {alertaPedidoAlterado && ultimaNotificacaoPedido.resumo && (
            <small className="novo-pedido-alerta-resumo">{ultimaNotificacaoPedido.resumo}</small>
          )}

          <small>Clique para abrir Pedidos</small>
        </span>
      </button>

      <button
        type="button"
        className="novo-pedido-alerta-fechar"
        onClick={fecharAlertaPedido}
        aria-label="Fechar aviso"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
