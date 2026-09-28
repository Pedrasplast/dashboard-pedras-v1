import CompraFuturaLinha from "./CompraFuturaLinha";

const COLUNAS = [
  "Pedido (OC)",
  "Emissão",
  "Previsão Recebimento",
  "Fornecedor",
  "Material",
  "Tipo",
  "Quantidade(kg)",
  "Preço/kg",
  "IPI",
  "Total",
  "Custo/kg",
  "Status",
  "Ações",
];

/**
 * `obterProcessando(id)` devolve { salvando, excluindo, confirmandoChegada } da compra.
 */
export default function ComprasFuturasTabela({
  compras,
  bloqueado,
  obterProcessando,
  onConfirmarChegada,
  onEditar,
  onExcluir,
}) {
  return (
    <div className="compras-futuras-tabela-container">
      <table className="compras-futuras-tabela">
        <thead>
          <tr>
            {COLUNAS.map((coluna) => (
              <th key={coluna}>{coluna}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {compras.map((compra) => (
            <CompraFuturaLinha
              key={compra.id}
              compra={compra}
              processando={obterProcessando(compra.id)}
              bloqueado={bloqueado}
              onConfirmarChegada={onConfirmarChegada}
              onEditar={onEditar}
              onExcluir={onExcluir}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
