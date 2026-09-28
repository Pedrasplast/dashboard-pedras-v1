import { AlertTriangle } from "lucide-react";

export default function PedidosAvisoCancelados() {
  return (
    <div className="pedidos-consulta-cancelados">
      <AlertTriangle size={19} />

      <div>
        <strong>Consulta de pedidos cancelados</strong>
        <span>
          Estes pedidos são exibidos somente para consulta e não participam dos
          indicadores operacionais.
        </span>
      </div>
    </div>
  );
}
