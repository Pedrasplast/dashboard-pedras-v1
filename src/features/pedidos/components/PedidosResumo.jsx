import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";

import { formatarNumero } from "../utils/format.utils";


function CardResumo({
  icon: Icon,
  label,
  valor,
  tipo,
  isLoading,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`pedidos-card pedidos-card--${tipo}`}
      onClick={() => onClick(tipo)}
      disabled={isLoading}
      aria-label={`Ver detalhes de ${label}`}
    >
      <div className="pedidos-card-icon">
        <Icon size={22} />
      </div>

      <div>
        <span className="pedidos-card-label">
          {label}
        </span>

        <strong>
          {valor}
        </strong>
      </div>
    </button>
  );
}


export default function PedidosResumo({
  isLoading,
  quantidadePedidos,
  pedidosAtrasados,
  quantidadeTotal,
  entregasProximos7Dias,
  faturamentosHoje,
  onCardClick,
}) {
  const carregando =
    isLoading
      ? "-"
      : null;

  return (
    <section className="pedidos-resumo">

      <CardResumo
        icon={ShoppingCart}
        label="Pedidos em aberto"
        valor={
          carregando ??
          quantidadePedidos
        }
        tipo="abertos"
        isLoading={isLoading}
        onClick={onCardClick}
      />


      <CardResumo
        icon={AlertTriangle}
        label="Pedidos atrasados"
        valor={
          carregando ??
          pedidosAtrasados
        }
        tipo="atrasados"
        isLoading={isLoading}
        onClick={onCardClick}
      />


      <CardResumo
        icon={PackageSearch}
        label="Quantidade total"
        valor={
          carregando ??
          formatarNumero(
            quantidadeTotal,
          )
        }
        tipo="quantidade"
        isLoading={isLoading}
        onClick={onCardClick}
      />


      <CardResumo
        icon={CalendarClock}
        label="Faturamentos próximos 7 dias"
        valor={
          carregando ??
          entregasProximos7Dias
        }
        tipo="proximos"
        isLoading={isLoading}
        onClick={onCardClick}
      />


      <CardResumo
        icon={CalendarCheck2}
        label="Faturamento do dia"
        valor={
          carregando ??
          faturamentosHoje
        }
        tipo="hoje"
        isLoading={isLoading}
        onClick={onCardClick}
      />

    </section>
  );
}