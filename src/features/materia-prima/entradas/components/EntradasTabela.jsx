import EntradaLinha from "./EntradaLinha";

const COLUNAS = [
  "Pedido (OC)",
  "Recebido",
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
  "Observação",
];

export default function EntradasTabela({ entradas }) {
  return (
    <div className="entradas-pp-tabela-container">
      <table className="entradas-pp-tabela">
        <thead>
          <tr>
            {COLUNAS.map((coluna) => (
              <th key={coluna}>{coluna}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {entradas.map((entrada) => (
            <EntradaLinha key={entrada.id} entrada={entrada} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
