import {
  formatarCustoKg,
  formatarData,
  formatarMoeda,
  formatarPercentual,
  formatarPrecoKg,
  formatarQuantidade,
} from "../utils/formatadores";

export default function EntradaLinha({ entrada }) {
  return (
    <tr>
      <td>
        <strong>{entrada.numeroPedido || "-"}</strong>
      </td>

      <td className="entradas-pp-data">{formatarData(entrada.data)}</td>

      <td>{formatarData(entrada.dataCompra)}</td>

      <td>{formatarData(entrada.dataPrevista)}</td>

      <td className="entradas-pp-fornecedor">
        <strong>{entrada.fornecedorNome}</strong>
      </td>

      <td>
        <strong>{entrada.materialNome || "-"}</strong>
      </td>

      <td>
        <strong>{entrada.tipoClassificacao || "-"}</strong>
      </td>

      <td className="entradas-pp-quantidade">{formatarQuantidade(entrada.quantidadeKg)}</td>

      <td className="entradas-pp-quantidade">{formatarPrecoKg(entrada.precoUnitario)}</td>

      <td className="entradas-pp-financeiro">
        <span>{formatarPercentual(entrada.ipiPercentual)}</span>
        {entrada.valorIpi !== null && <small>{formatarMoeda(entrada.valorIpi)}</small>}
      </td>

      <td className="entradas-pp-total">{formatarMoeda(entrada.valorTotal)}</td>

      <td className="entradas-pp-quantidade">{formatarCustoKg(entrada.custoEfetivoKg)}</td>

      <td className="entradas-pp-observacao">{entrada.observacao || "-"}</td>
    </tr>
  );
}
