import { CheckCircle2, Pencil, Trash2 } from "lucide-react";

import StatusCompra from "./StatusCompra";
import { estaEmAberto } from "../utils/comprasFuturasUtils";
import {
  formatarCustoKg,
  formatarData,
  formatarMoeda,
  formatarPercentual,
  formatarPrecoKg,
  formatarQuantidade,
} from "../utils/formatadores";

/**
 * Uma linha da tabela.
 * `processando` = { salvando, excluindo, confirmandoChegada } desta compra.
 */
export default function CompraFuturaLinha({
  compra,
  processando,
  bloqueado,
  onConfirmarChegada,
  onEditar,
  onExcluir,
}) {
  return (
    <tr>
      <td>
        <strong>{compra.numeroPedido || "-"}</strong>
      </td>

      <td>{formatarData(compra.dataCompra)}</td>

      <td>{formatarData(compra.dataPrevista)}</td>

      <td>
        <strong>{compra.fornecedorNome}</strong>
      </td>

      <td>
        <strong>{compra.materialNome || "-"}</strong>
      </td>

      <td>
        <strong>{compra.tipoClassificacao || "-"}</strong>
      </td>

      <td className="compras-futuras-quantidade">{formatarQuantidade(compra.quantidadeKg)}</td>

      <td className="compras-futuras-financeiro">{formatarPrecoKg(compra.precoUnitario)}</td>

      <td className="compras-futuras-financeiro">
        <span>{formatarPercentual(compra.ipiPercentual)}</span>
        {compra.valorIpi !== null && <small>{formatarMoeda(compra.valorIpi)}</small>}
      </td>

      <td className="compras-futuras-total">{formatarMoeda(compra.valorTotal)}</td>

      <td className="compras-futuras-financeiro">{formatarCustoKg(compra.custoEfetivoKg)}</td>

      <td>
        <StatusCompra status={compra.status} />
      </td>

      <td>
        <div className="compras-futuras-acoes">
          {estaEmAberto(compra) && (
            <button
              type="button"
              className="compras-futuras-confirmar-chegada"
              onClick={() => onConfirmarChegada(compra)}
              disabled={bloqueado}
            >
              <CheckCircle2 size={14} />
              {processando.confirmandoChegada ? "Confirmando..." : "Confirmar chegada"}
            </button>
          )}

          <button
            type="button"
            className="compras-futuras-editar"
            onClick={() => onEditar(compra)}
            disabled={bloqueado}
          >
            <Pencil size={14} />
            {processando.salvando ? "Salvando..." : "Editar"}
          </button>

          <button
            type="button"
            className="compras-futuras-editar compras-futuras-excluir"
            onClick={() => onExcluir(compra)}
            disabled={bloqueado}
          >
            <Trash2 size={14} />
            {processando.excluindo ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </td>
    </tr>
  );
}
