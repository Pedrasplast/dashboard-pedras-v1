import {
  memo,
  useMemo,
} from "react";

import {
  useFinanceiroDetalhes,
} from "../hooks/useFinanceiro";

import {
  formatarData,
  formatarMoeda,
} from "../utils/financeiro.utils";


/* =========================================================
   RESUMO DOS LANÇAMENTOS

   Fazemos uma única passagem pelos detalhes carregados.
========================================================= */

function calcularResumoDetalhes(
  registros,
) {
  let totalRealizado =
    0;

  let totalARealizar =
    0;

  let totalGeral =
    0;


  for (
    const registro
    of registros
  ) {
    const valor =
      Number(
        registro
          ?.valor_componente ??
          0,
      );


    totalGeral +=
      valor;


    if (
      registro
        ?.componente ===
      "realizado"
    ) {
      totalRealizado +=
        valor;

      continue;
    }


    if (
      registro
        ?.componente ===
      "a_realizar"
    ) {
      totalARealizar +=
        valor;
    }
  }


  return {
    totalRealizado,
    totalARealizar,
    totalGeral,
    quantidade:
      registros.length,
  };
}


/* =========================================================
   TEXTO DO COMPONENTE
========================================================= */

function nomeComponente(
  componente,
) {
  if (
    componente ===
    "realizado"
  ) {
    return "Realizado";
  }


  if (
    componente ===
    "a_realizar"
  ) {
    return "A realizar";
  }


  return "-";
}


/* =========================================================
   LINHA DO DETALHAMENTO
========================================================= */

const LinhaDetalhe =
  memo(
    function LinhaDetalhe({
      registro,
    }) {
      return (
        <tr>

          <td>
            {formatarData(
              registro
                ?.data_referencia,
            )}
          </td>


          <td>
            {
              registro
                ?.cliente_fornecedor ||
              "-"
            }
          </td>


          <td>
            {
              registro
                ?.numero_documento ||
              "-"
            }
          </td>


          <td>
            {
              registro
                ?.numero_pedido ||
              "-"
            }
          </td>


          <td>
            {nomeComponente(
              registro
                ?.componente,
            )}
          </td>


          <td>
            {
              registro
                ?.status ||
              "-"
            }
          </td>


          <td className="financeiro-detalhes-numero">
            {formatarMoeda(
              registro
                ?.valor_documento,
            )}
          </td>


          <td className="financeiro-detalhes-numero">
            {formatarMoeda(
              registro
                ?.valor_componente,
            )}
          </td>

        </tr>
      );
    },
  );


/* =========================================================
   COMPONENTE
========================================================= */

function FinanceiroDetalhes({
  aberto,
  ano,
  mes,
  categoria,
  aoFechar,
}) {
  const codigoCategoria =
    categoria
      ?.codigo_categoria ??
    "";


  const {
    data:
      detalhes = [],

    isLoading:
      carregando,

    isFetching:
      atualizando,

    isError:
      erro,

    error:
      detalheErro,
  } =
    useFinanceiroDetalhes({
      ano,

      mes,

      codigoCategoria,

      habilitado:
        aberto &&
        Boolean(
          codigoCategoria,
        ),
    });


  /* =======================================================
     RESUMO

     Só recalcula quando a lista de detalhes mudar.
  ======================================================= */

  const resumo =
    useMemo(
      () =>
        calcularResumoDetalhes(
          detalhes,
        ),
      [
        detalhes,
      ],
    );


  if (
    !aberto ||
    !categoria
  ) {
    return null;
  }


  return (
    <div className="financeiro-detalhes-overlay">

      {/* ===================================================
          ÁREA EXTERNA

          Clique fora fecha o painel.
      =================================================== */}

      <button
        type="button"
        className="financeiro-detalhes-fundo"
        aria-label="Fechar detalhes"
        onClick={
          aoFechar
        }
      />


      {/* ===================================================
          PAINEL
      =================================================== */}

      <aside
        className="financeiro-detalhes-painel"
        aria-label="Detalhamento financeiro"
      >

        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <div className="financeiro-detalhes-cabecalho">

          <div>

            <span className="financeiro-detalhes-codigo">
              {
                categoria
                  .codigo_categoria
              }
            </span>

            <h2 className="financeiro-detalhes-titulo">
              {
                categoria
                  .categoria
              }
            </h2>

          </div>


          <button
            type="button"
            className="financeiro-detalhes-fechar"
            aria-label="Fechar"
            onClick={
              aoFechar
            }
          >
            ×
          </button>

        </div>


        {/* =================================================
            VALORES DA CATEGORIA
        ================================================= */}

        <div className="financeiro-detalhes-categoria-resumo">

          <div>

            <span>
              Previsto
            </span>

            <strong>
              {formatarMoeda(
                categoria
                  .valor_previsto,
              )}
            </strong>

          </div>


          <div>

            <span>
              Realizado / a realizar
            </span>

            <strong>
              {formatarMoeda(
                categoria
                  .valor_realizado,
              )}
            </strong>

          </div>

        </div>


        {/* =================================================
            RESUMO DOS TÍTULOS
        ================================================= */}

        {!carregando &&
          !erro && (
            <div className="financeiro-detalhes-resumo">

              <div>

                <span>
                  Realizado
                </span>

                <strong>
                  {formatarMoeda(
                    resumo
                      .totalRealizado,
                  )}
                </strong>

              </div>


              <div>

                <span>
                  A realizar
                </span>

                <strong>
                  {formatarMoeda(
                    resumo
                      .totalARealizar,
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Lançamentos
                </span>

                <strong>
                  {
                    resumo
                      .quantidade
                  }
                </strong>

              </div>

            </div>
          )}


        {/* =================================================
            CARREGAMENTO
        ================================================= */}

        {carregando && (
          <div className="financeiro-detalhes-status">
            Carregando lançamentos...
          </div>
        )}


        {/* =================================================
            ERRO
        ================================================= */}

        {erro && (
          <div className="financeiro-detalhes-status financeiro-detalhes-erro">

            {detalheErro
              ?.message ||
              "Não foi possível carregar os lançamentos."}

          </div>
        )}


        {/* =================================================
            SEM REGISTROS
        ================================================= */}

        {!carregando &&
          !erro &&
          detalhes.length ===
            0 && (
            <div className="financeiro-detalhes-status">
              Nenhum lançamento encontrado para esta categoria.
            </div>
          )}


        {/* =================================================
            TABELA
        ================================================= */}

        {!carregando &&
          !erro &&
          detalhes.length >
            0 && (
            <div className="financeiro-detalhes-tabela-container">

              {atualizando && (
                <div className="financeiro-detalhes-atualizando">
                  Atualizando...
                </div>
              )}


              <table className="financeiro-detalhes-tabela">

                <thead>

                  <tr>

                    <th>
                      Data
                    </th>

                    <th>
                      Cliente / Fornecedor
                    </th>

                    <th>
                      Documento
                    </th>

                    <th>
                      Pedido
                    </th>

                    <th>
                      Componente
                    </th>

                    <th>
                      Status
                    </th>

                    <th className="financeiro-detalhes-numero">
                      Valor título
                    </th>

                    <th className="financeiro-detalhes-numero">
                      Valor
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {detalhes.map(
                    (
                      registro,
                    ) => (
                      <LinhaDetalhe
                        key={
                          registro.id
                        }
                        registro={
                          registro
                        }
                      />
                    ),
                  )}

                </tbody>

              </table>

            </div>
          )}

      </aside>

    </div>
  );
}


/* =========================================================
   MEMO
========================================================= */

export default memo(
  FinanceiroDetalhes,
);