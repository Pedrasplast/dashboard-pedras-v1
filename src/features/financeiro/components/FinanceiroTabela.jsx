import {
  memo,
} from "react";

import {
  formatarMoeda,
  formatarPercentual,
} from "../utils/financeiro.utils";


/* =========================================================
   LINHA DA TABELA
========================================================= */

const FinanceiroLinha =
  memo(
    function FinanceiroLinha({
      linha,
      aoDetalhar,
    }) {
      const codigo =
        String(
          linha
            ?.codigo_categoria ??
            "",
        );

      const categoria =
        String(
          linha
            ?.categoria ??
            "",
        );

      const previsto =
        Number(
          linha
            ?.valor_previsto ??
            0,
        );

      const realizado =
        Number(
          linha
            ?.valor_realizado ??
            0,
        );

      const variacao =
        Number(
          linha
            ?.variacao_valor ??
            0,
        );

      const percentual =
        linha
          ?.variacao_percentual ??
        null;


      let classeVariacao =
        "neutra";


      if (
        variacao > 0
      ) {
        classeVariacao =
          "positiva";
      }


      if (
        variacao < 0
      ) {
        classeVariacao =
          "negativa";
      }


      return (
        <tr className="financeiro-tabela-linha">

          <td className="financeiro-tabela-codigo">
            {codigo}
          </td>


          <td className="financeiro-tabela-categoria">
            {categoria}
          </td>


          <td className="financeiro-tabela-numero">
            {formatarMoeda(
              previsto,
            )}
          </td>


          <td className="financeiro-tabela-numero">
            {formatarMoeda(
              realizado,
            )}
          </td>


          <td
            className={[
              "financeiro-tabela-numero",
              `financeiro-variacao-${classeVariacao}`,
            ].join(" ")}
          >
            {formatarMoeda(
              variacao,
            )}
          </td>


          <td
            className={[
              "financeiro-tabela-percentual",
              `financeiro-variacao-${classeVariacao}`,
            ].join(" ")}
          >
            {formatarPercentual(
              percentual,
            )}
          </td>


          <td className="financeiro-tabela-detalhes">

            <button
              type="button"
              className="financeiro-botao-detalhar"
              title={`Detalhar ${categoria}`}
              aria-label={`Detalhar ${categoria}`}
              onClick={() =>
                aoDetalhar(
                  linha,
                )
              }
            >
              ›
            </button>

          </td>

        </tr>
      );
    },
  );


/* =========================================================
   TABELA
========================================================= */

function FinanceiroTabela({
  linhas,
  aoDetalhar,
}) {
  const registros =
    Array.isArray(
      linhas,
    )
      ? linhas
      : [];


  if (
    registros.length ===
    0
  ) {
    return (
      <div className="financeiro-sem-dados">
        Nenhum dado financeiro encontrado para o período selecionado.
      </div>
    );
  }


  return (
    <div className="financeiro-tabela-container">

      <table className="financeiro-tabela">

        <thead>

          <tr>

            <th>
              Código
            </th>

            <th>
              Categoria
            </th>

            <th className="financeiro-tabela-numero">
              Previsto
            </th>

            <th className="financeiro-tabela-numero">
              Realizado / a realizar
            </th>

            <th className="financeiro-tabela-numero">
              Variação
            </th>

            <th className="financeiro-tabela-percentual">
              %
            </th>

            <th className="financeiro-tabela-detalhes">
              Detalhes
            </th>

          </tr>

        </thead>


        <tbody>

          {registros.map(
            (
              linha,
            ) => (
              <FinanceiroLinha
                key={
                  linha.id ??
                  `${linha.ano}-${linha.mes}-${linha.codigo_categoria}`
                }
                linha={
                  linha
                }
                aoDetalhar={
                  aoDetalhar
                }
              />
            ),
          )}

        </tbody>

      </table>

    </div>
  );
}


/* =========================================================
   MEMO
========================================================= */

export default memo(
  FinanceiroTabela,
);