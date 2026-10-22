import {
  formatarDataPreco,
  formatarPreco,
  formatarQuantidadePreco,
  obterPrecoReferencia,
} from "../utils/formatadoresPrecos";

/* =========================================================
   GRID DE PREÇOS
   Exibe o último preço original e, na última coluna,
   a média válida do período (30, 45 ou 60 dias) ou o último
   preço como fallback.
========================================================= */

export default function TabelaPrecosGrid({ registros = [], periodo = 30 }) {
  if (registros.length === 0) {
    return <div className="tp-vazio">Nenhum material encontrado.</div>;
  }

  return (
    <div className="tp-tabela-container">
      <table className="tp-tabela">
        <thead>
          <tr>
            <th>Código</th>
            <th>Material</th>
            <th>Última compra</th>
            <th>Último preço</th>
            <th>Qtd. últimos {periodo} dias (kg)</th>
            <th>Valor total últimos {periodo} dias</th>
            <th>Preço Médio {periodo} dias</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((item) => {
            const referencia = obterPrecoReferencia(item, periodo);
            return (
              <tr key={item.codigo_produto_omie ?? item.codigo_produto}>
                <td className="tp-codigo">{item.codigo_produto || "—"}</td>
                <td className="tp-material">{item.descricao || "—"}</td>
                <td>{formatarDataPreco(item.ultima_compra)}</td>
                <td className="tp-preco">{formatarPreco(item.ultimo_preco)}</td>
                <td className="tp-numero">{formatarQuantidadePreco(item[`quantidade_${periodo}d`])}</td>
                <td className="tp-numero">{formatarPreco(item[`valor_total_${periodo}d`])}</td>
                <td className="tp-preco">
                  <div>{formatarPreco(referencia.valor)}</div>
                  {referencia.origem === "ultima_compra" && (
                    <small style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "#64748b" }}>
                      Última compra (sem média {periodo}d)
                    </small>
                  )}
                  {referencia.origem === "sem_preco" && (
                    <small style={{ display: "block", fontSize: "11px", color: "#64748b" }}>
                      Sem preço disponível
                    </small>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
