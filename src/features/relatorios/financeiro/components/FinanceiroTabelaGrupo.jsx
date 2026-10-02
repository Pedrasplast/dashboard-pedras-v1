function obterClasseVariacao(
  coluna,
  item,
) {
  if (
    coluna.chave !== "variacao" &&
    coluna.chave !== "variacao_percentual"
  ) {
    return "";
  }

  const numero = Number(
    item?.[coluna.chave],
  );

  if (!Number.isFinite(numero)) {
    return "";
  }

  if (numero > 0) {
    return "financeiro-valor-positivo";
  }

  if (numero < 0) {
    return "financeiro-valor-negativo";
  }

  return "financeiro-valor-neutro";
}


export default function FinanceiroTabelaGrupo({
  grupo,
  colunas,
}) {
  const codigoCabecalho =
    grupo.chave === "receitas"
      ? "1"
      : "2";

  return (
    <section
      className={`financeiro-relatorio-grupo financeiro-relatorio-grupo-${grupo.chave}`}
    >
      <div className="financeiro-relatorio-grupo-titulo">
        <div>
          <span>
            Classificação financeira
          </span>

          <h4>
            {grupo.titulo}
          </h4>
        </div>

        <strong>
          {grupo.totalGrupo} categoria(s)
        </strong>
      </div>


      <div className="relatorio-visualizacao-tabela-wrapper">
        <table className="relatorio-visualizacao-tabela financeiro-relatorio-tabela">
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
                      ? "financeiro-coluna-numerica"
                      : ""
                  }
                >
                  {coluna.titulo}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {grupo.dados.map(
              (item, indice) => {
                const ehCabecalho =
                  String(
                    item.codigo_categoria || "",
                  ).trim() === codigoCabecalho;

                return (
                  <tr
                    key={`${grupo.chave}-${item.codigo_categoria || "categoria"}-${indice}`}
                    className={
                      ehCabecalho
                        ? "financeiro-linha-cabecalho-grupo"
                        : ""
                    }
                  >
                    {colunas.map((coluna) => {
                      const classes = [
                        coluna.numerica
                          ? "financeiro-coluna-numerica"
                          : "",

                        obterClasseVariacao(
                          coluna,
                          item,
                        ),
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <td
                          key={coluna.chave}
                          className={classes}
                        >
                          {coluna.valor(item)}
                        </td>
                      );
                    })}
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}