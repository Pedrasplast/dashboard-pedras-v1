import {
  useEffect,
  useMemo,
} from "react";

import {
  CalendarClock,
  PackageSearch,
  ShoppingCart,
  X,
} from "lucide-react";

import {
  formatarNumero,
} from "../utils/format.utils";

import "./PedidosResumoModal.css";


function obterChavePedido(
  pedido,
) {
  return String(
    pedido?.codigoPedido ??
      pedido?.codigo_pedido ??
      pedido?.pedido ??
      pedido?.numero_pedido ??
      pedido?.id ??
      "",
  );
}


function obterNumeroPedido(
  pedido,
) {
  return (
    pedido?.pedidoExibicao ??
    pedido?.pedido ??
    pedido?.numero_pedido ??
    pedido?.numeroPedido ??
    "-"
  );
}


function converterData(
  valor,
) {
  if (!valor) {
    return null;
  }

  const texto =
    String(valor).trim();


  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      texto,
    )
  ) {
    const [
      dia,
      mes,
      ano,
    ] =
      texto
        .split("/")
        .map(Number);

    return new Date(
      ano,
      mes - 1,
      dia,
      0,
      0,
      0,
      0,
    );
  }


  const iso =
    texto.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );

  if (iso) {
    return new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      0,
      0,
      0,
      0,
    );
  }


  const data =
    new Date(texto);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return null;
  }

  return data;
}


function formatarData(
  valor,
) {
  const data =
    converterData(
      valor,
    );

  if (!data) {
    return "-";
  }

  return data.toLocaleDateString(
    "pt-BR",
  );
}


export default function PedidosResumoModal({
  aberto,
  titulo,
  descricao,
  pedidos = [],
  todosPedidos = [],
  onFechar,
}) {
  useEffect(() => {
    if (!aberto) {
      return undefined;
    }


    function aoPressionarTecla(
      event,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onFechar();
      }
    }


    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      aoPressionarTecla,
    );


    return () => {
      document.body.style.overflow =
        overflowAnterior;

      window.removeEventListener(
        "keydown",
        aoPressionarTecla,
      );
    };
  }, [
    aberto,
    onFechar,
  ]);


  const linhasPorPedido =
    useMemo(() => {
      const mapa =
        new Map();

      for (
        const linha of
        todosPedidos
      ) {
        const chave =
          obterChavePedido(
            linha,
          );

        if (!chave) {
          continue;
        }

        if (
          !mapa.has(
            chave,
          )
        ) {
          mapa.set(
            chave,
            [],
          );
        }

        mapa
          .get(chave)
          .push(linha);
      }

      return mapa;
    }, [
      todosPedidos,
    ]);


  const registros =
    useMemo(() => {
      return pedidos.map(
        (
          pedido,
        ) => {
          const chave =
            obterChavePedido(
              pedido,
            );

          const linhas =
            linhasPorPedido.get(
              chave,
            ) ?? [
              pedido,
            ];


          const quantidade =
            linhas.reduce(
              (
                total,
                linha,
              ) => {
                const valor =
                  Number(
                    linha?.quantidade,
                  );

                return Number.isFinite(
                  valor,
                )
                  ? total +
                      valor
                  : total;
              },
              0,
            );


          return {
            chave,
            numero:
              obterNumeroPedido(
                pedido,
              ),

            cliente:
              pedido?.cliente ??
              "-",

            previsao:
              pedido?.previsao ??
              null,

            quantidade,

            itens:
              linhas.length,

            vendedor:
              pedido?.vendedor ??
              "-",
          };
        },
      );
    }, [
      pedidos,
      linhasPorPedido,
    ]);


  const quantidadeTotal =
    useMemo(() => {
      return registros.reduce(
        (
          total,
          registro,
        ) =>
          total +
          registro.quantidade,
        0,
      );
    }, [
      registros,
    ]);


  if (!aberto) {
    return null;
  }


  return (
    <div
      className="pedidos-resumo-modal-backdrop"
      onMouseDown={
        (
          event,
        ) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onFechar();
          }
        }
      }
    >
      <section
        className="pedidos-resumo-modal"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >

        <header className="pedidos-resumo-modal-header">

          <div className="pedidos-resumo-modal-titulo">

            <div className="pedidos-resumo-modal-icone">
              <CalendarClock
                size={21}
              />
            </div>

            <div>
              <span>
                Pedidos
              </span>

              <h2>
                {titulo}
              </h2>

              {descricao && (
                <p>
                  {descricao}
                </p>
              )}
            </div>

          </div>


          <button
            type="button"
            className="pedidos-resumo-modal-fechar"
            onClick={
              onFechar
            }
            aria-label="Fechar"
          >
            <X
              size={20}
            />
          </button>

        </header>


        <div className="pedidos-resumo-modal-indicadores">

          <div>
            <ShoppingCart
              size={18}
            />

            <span>
              Pedidos
            </span>

            <strong>
              {registros.length}
            </strong>
          </div>


          <div>
            <PackageSearch
              size={18}
            />

            <span>
              Quantidade
            </span>

            <strong>
              {formatarNumero(
                quantidadeTotal,
              )}
            </strong>
          </div>

        </div>


        {registros.length ===
        0 ? (
          <div className="pedidos-resumo-modal-vazio">
            Nenhum pedido encontrado para este indicador.
          </div>
        ) : (
          <div className="pedidos-resumo-modal-tabela-wrapper">

            <table className="pedidos-resumo-modal-tabela">

              <thead>
                <tr>
                  <th>
                    Pedido
                  </th>

                  <th>
                    Cliente
                  </th>

                  <th>
                    Previsão faturamento
                  </th>

                  <th>
                    Quantidade
                  </th>

                  <th>
                    Itens
                  </th>

                  <th>
                    Vendedor
                  </th>
                </tr>
              </thead>


              <tbody>
                {registros.map(
                  (
                    registro,
                  ) => (
                    <tr
                      key={
                        registro.chave
                      }
                    >
                      <td className="pedidos-resumo-modal-pedido">
                        {
                          registro.numero
                        }
                      </td>

                      <td className="pedidos-resumo-modal-cliente">
                        {
                          registro.cliente
                        }
                      </td>

                      <td>
                        {formatarData(
                          registro.previsao,
                        )}
                      </td>

                      <td className="pedidos-resumo-modal-quantidade">
                        {formatarNumero(
                          registro.quantidade,
                        )}
                      </td>

                      <td>
                        {
                          registro.itens
                        }
                      </td>

                      <td>
                        {
                          registro.vendedor
                        }
                      </td>
                    </tr>
                  ),
                )}
              </tbody>

            </table>

          </div>
        )}


        <footer className="pedidos-resumo-modal-footer">

          <span>
            {registros.length ===
            1
              ? "1 pedido encontrado"
              : `${registros.length} pedidos encontrados`}
          </span>


          <button
            type="button"
            onClick={
              onFechar
            }
          >
            Fechar
          </button>

        </footer>

      </section>
    </div>
  );
}