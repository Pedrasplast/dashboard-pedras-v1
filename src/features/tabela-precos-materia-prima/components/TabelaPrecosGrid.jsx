
import {
  formatarDataPreco,
  formatarPreco,
  formatarQuantidadePreco,
} from "../utils/formatadoresPrecos";

/* =========================================================
   GRID DE PREÇOS

   Responsabilidade:
   Exibir os registros já tratados pela página.
========================================================= */

export default function TabelaPrecosGrid({
  registros,
}) {
  if (registros.length === 0) {
    return (
      <div className="tp-vazio">
        Nenhum material encontrado.
      </div>
    );
  }

  return (
    <div className="tp-tabela-container">
      <table className="tp-tabela">
        <thead>
          <tr>
            <th>Código</th>
            <th>Material</th>
            <th>UN</th>
            <th>Última compra</th>
            <th>Último preço</th>
            <th>Qtd. última compra</th>
            <th>Qtd. últimos 30 dias</th>
            <th>Preço médio 30 dias</th>
          </tr>
        </thead>

        <tbody>
          {registros.map((item) => (
            <tr
              key={item.codigo_produto_omie}
            >
              <td className="tp-codigo">
                {item.codigo_produto || "—"}
              </td>

              <td className="tp-material">
                {item.descricao || "—"}
              </td>

              <td>
                {item.unidade || "—"}
              </td>

              <td>
                {formatarDataPreco(
                  item.ultima_compra
                )}
              </td>

              <td className="tp-preco">
                {formatarPreco(
                  item.ultimo_preco
                )}
              </td>

              <td className="tp-numero">
                {formatarQuantidadePreco(
                  item.quantidade_ultima_compra
                )}
              </td>

              <td className="tp-numero">
                {formatarQuantidadePreco(
                  item.quantidade_30d
                )}
              </td>

              <td className="tp-preco">
                {formatarPreco(
                  item.preco_medio_30d
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
