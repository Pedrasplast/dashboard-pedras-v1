import {
  formatarData,
  formatarKg,
  formatarPreco,
  formatarPercentual,
  formatarMoeda,
} from "../entradasCompras.regras";

/* =========================================================
   TABELA
========================================================= */

export default function TabelaEntradasCompras({ registros }) {
  return (
    <div className="relatorio-visualizacao-tabela-wrapper entradas-compras-tabela-wrapper">
      <table className="relatorio-visualizacao-tabela entradas-compras-tabela">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Recebido</th>
            <th>Emissão</th>
            <th>Previsão de recebimento</th>
            <th>Fornecedor</th>
            <th>Material</th>
            <th className="coluna-numerica">Quantidade</th>
            <th className="coluna-numerica">Preço</th>
            <th className="coluna-numerica">IPI</th>
            <th className="coluna-numerica">Total</th>
          </tr>
        </thead>

        <tbody>
          {registros.map((registro) => (
            <tr key={registro.id}>
              <td>
                <strong className="entradas-compras-pedido">{registro.pedido || "-"}</strong>
              </td>

              <td>
                {registro.situacao === "FUTURA" ? (
                  <span className="entradas-compras-a-receber">A receber</span>
                ) : registro.situacao === "ENCERRADA" ? (
                  <span
                    className="entradas-compras-encerrado"
                    title="Pedido encerrado no Omie sem recebimento vinculado"
                  >
                    Encerrado
                  </span>
                ) : (
                  formatarData(registro.recebido)
                )}
              </td>

              <td>{formatarData(registro.emissao)}</td>

              <td>{formatarData(registro.previsaoRecebimento)}</td>

              <td>{registro.fornecedor || "-"}</td>

              <td>{registro.material || "-"}</td>

              <td className="coluna-numerica entradas-compras-numero">
                {formatarKg(registro.quantidadeKg)}
              </td>

              <td className="coluna-numerica entradas-compras-numero">
                {formatarPreco(registro.preco)}
              </td>

              <td className="coluna-numerica entradas-compras-numero">
                {formatarPercentual(registro.ipiPercentual)}
              </td>

              <td className="coluna-numerica entradas-compras-total">
                {formatarMoeda(registro.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
