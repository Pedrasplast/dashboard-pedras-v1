export default function DespesasAcimaPrevistoTabela({
  dados,
  colunas,
}) {
  return (
    <div className="relatorio-visualizacao-tabela-wrapper">
      <table className="relatorio-visualizacao-tabela despesas-acima-previsto-tabela">
        <colgroup>
          {colunas.map((coluna) => (
            <col
              key={coluna.chave}
              style={{
                width:
                  coluna.larguraTabela ||
                  "auto",
              }}
            />
          ))}
        </colgroup>

        <thead>
          <tr>
            {colunas.map((coluna) => (
              <th
                key={coluna.chave}
                className={
                  coluna.numerica
                    ? "despesas-acima-previsto-coluna-numerica"
                    : ""
                }
              >
                {coluna.titulo}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {dados.map((item, indice) => (
            <tr
              key={`${item?.codigo_categoria || "categoria"}-${indice}`}
            >
              {colunas.map((coluna) => (
                <td
                  key={coluna.chave}
                  className={[
                    coluna.numerica
                      ? "despesas-acima-previsto-coluna-numerica"
                      : "",

                    coluna.chave ===
                    "excesso_previsto"
                      ? "despesas-acima-previsto-destaque"
                      : "",

                    coluna.chave ===
                    "excesso_percentual"
                      ? "despesas-acima-previsto-destaque"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {coluna.valor(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
