import {
  AlertTriangle,
  CalendarClock,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";
import { formatarNumero } from "../utils/format.utils";

function CardResumo({ icon: Icon, label, valor }) {
  return (
    <article className="pedidos-card">
      <div className="pedidos-card-icon">
        <Icon size={22} />
      </div>

      <div>
        <span className="pedidos-card-label">{label}</span>
        <strong>{valor}</strong>
      </div>
    </article>
  );
}

export default function PedidosResumo({
  isLoading,
  quantidadePedidos,
  pedidosAtrasados,
  quantidadeTotal,
  entregasProximos7Dias,
}) {
  const carregando = isLoading ? "-" : null;

  return (
    <section className="pedidos-resumo">
      <CardResumo
        icon={ShoppingCart}
        label="Pedidos em aberto"
        valor={carregando ?? quantidadePedidos}
      />

      <CardResumo
        icon={AlertTriangle}
        label="Pedidos atrasados"
        valor={carregando ?? pedidosAtrasados}
      />

      <CardResumo
        icon={PackageSearch}
        label="Quantidade total"
        valor={carregando ?? formatarNumero(quantidadeTotal)}
      />

      <CardResumo
        icon={CalendarClock}
        label="Faturamentos próximos 7 dias"
        valor={carregando ?? entregasProximos7Dias}
      />
    </section>
  );
}
