import { Clock3 } from "lucide-react";
import { formatarDataHora, formatarHorario } from "../utils/pedidosCompra.utils";
import "./PedidosCompraAtualizacao.css";

export default function PedidosCompraAtualizacao({ atualizadoEm, isFetching }) {
  const titulo = atualizadoEm
    ? `Última sincronização dos pedidos de compra: ${formatarDataHora(atualizadoEm)}.`
    : "Aguardando a primeira leitura dos pedidos de compra.";

  return (
    <div className="compras-atualizacao" title={titulo} aria-label={titulo}>
      <div className="compras-atualizacao-icone" aria-hidden="true">
        <Clock3 size={14} strokeWidth={2} />
      </div>

      <div className="compras-atualizacao-conteudo">
        <span className="compras-atualizacao-status">
          <span className={`compras-atualizacao-ponto${isFetching ? " atualizando" : ""}`} />
          {isFetching ? "Atualizando" : "Atualização automática"}
        </span>

        <span className="compras-atualizacao-horario">
          Última <strong>{formatarHorario(atualizadoEm)}</strong>
        </span>
      </div>
    </div>
  );
}
