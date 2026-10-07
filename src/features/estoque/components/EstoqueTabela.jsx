import Paginacao
  from "@/components/paginacao/Paginacao";

import {
  formatarNumero,
  numero,
} from "../utils/estoque.utils";

import "./EstoqueTabela.css";


export default function EstoqueTabela({
  itens = [],

  totalItens = 0,

  localAtual,

  carregando,

  paginaAtual,

  itensPorPagina,

  onChangePagina,
}) {
  return (
    <section className="estoque-tabela-card">

      {/* =================================================
          TOPO
      ================================================= */}

      <div className="estoque-tabela-topo">

        <div>
          <span className="estoque-tabela-eyebrow">
            Produtos acabados
          </span>


          <h2>
            Posição de estoque
          </h2>
        </div>


        <div className="estoque-tabela-meta">

          <span>
            {localAtual}
          </span>


          <strong>
            {formatarNumero(
              totalItens,
              0,
            )}{" "}
            produtos
          </strong>

        </div>

      </div>


      {/* =================================================
          TABELA
      ================================================= */}

      <div className="estoque-tabela-scroll">

        <table className="estoque-tabela">

          <thead>
            <tr>

              <th>
                Código
              </th>


              <th>
                Produto
              </th>


              <th className="numero">
                Estoque
              </th>


              <th className="numero">
                Pedidos em aberto
              </th>


              <th className="numero">
                Saldo
              </th>

            </tr>
          </thead>


          <tbody>

            {carregando ? (
              <tr>

                <td
                  colSpan={5}
                  className="estoque-vazio"
                >
                  Carregando estoque...
                </td>

              </tr>
            ) : itens.length === 0 ? (
              <tr>

                <td
                  colSpan={5}
                  className="estoque-vazio"
                >
                  Nenhum produto encontrado para os filtros selecionados.
                </td>

              </tr>
            ) : (
              itens.map(
                (
                  item,
                ) => {
                  const estoqueAtual =
                    numero(
                      item.saldo,
                    );


                  const pedidosEmAberto =
                    numero(
                      item.quantidadePedidos,
                    );


                  const saldoDisponivel =
                    numero(
                      item.saldoDisponivel,
                    );


                  return (
                    <tr
                      key={
                        item.codigoProdutoOmie
                      }
                    >

                      {/* ===================================
                          CÓDIGO
                      =================================== */}

                      <td>
                        <span className="estoque-codigo">
                          {
                            item.codigoProduto ||
                            "-"
                          }
                        </span>
                      </td>


                      {/* ===================================
                          PRODUTO
                      =================================== */}

                      <td>
                        <div className="estoque-produto">

                          <strong>
                            {
                              item.descricao ||
                              "Produto sem descrição"
                            }
                          </strong>


                          {item.codigoIntegracao && (
                            <small>
                              Integração:{" "}
                              {
                                item.codigoIntegracao
                              }
                            </small>
                          )}

                        </div>
                      </td>


                      {/* ===================================
                          ESTOQUE
                      =================================== */}

                      <td className="numero">

                        <span
                          className={
                            estoqueAtual !== 0
                              ? "estoque-valor estoque-valor--saldo"
                              : "estoque-valor estoque-valor--zero"
                          }
                        >
                          {formatarNumero(
                            estoqueAtual,
                          )}
                        </span>

                      </td>


                      {/* ===================================
                          PEDIDOS EM ABERTO
                      =================================== */}

                      <td className="numero">

                        <span
                          className={
                            pedidosEmAberto > 0
                              ? "estoque-valor"
                              : "estoque-valor estoque-valor--zero"
                          }
                        >
                          {formatarNumero(
                            pedidosEmAberto,
                          )}
                        </span>

                      </td>


                      {/* ===================================
                          SALDO

                          ESTOQUE - PEDIDOS EM ABERTO
                      =================================== */}

                      <td className="numero">

                        <span
                          className={
                            saldoDisponivel > 0
                              ? "estoque-valor estoque-valor--saldo"
                              : saldoDisponivel < 0
                                ? "estoque-valor estoque-valor--negativo"
                                : "estoque-valor estoque-valor--zero"
                          }
                        >
                          {formatarNumero(
                            saldoDisponivel,
                          )}
                        </span>

                      </td>

                    </tr>
                  );
                },
              )
            )}

          </tbody>

        </table>

      </div>


      {/* =================================================
          PAGINAÇÃO
      ================================================= */}

      <Paginacao
        paginaAtual={
          paginaAtual
        }

        totalItens={
          totalItens
        }

        itensPorPagina={
          itensPorPagina
        }

        onChangePagina={
          onChangePagina
        }
      />

    </section>
  );
}