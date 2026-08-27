import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  CalendarClock,
  Clock3,
  PackageSearch,
  RefreshCw,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";

import Paginacao from "@/components/paginacao/Paginacao";
import Filtros, { possuiFiltrosAtivos } from "@/components/filtros/Filtros";
import { valoresUnicosOrdenados } from "@/lib/colecoes";

import AtualizacaoAutomatica from "./components/AtualizacaoAutomatica";
import {
  agruparItensPorPedido,
  calcularDiasAtraso,
  converterData,
  formatarData,
  formatarNumeroPedido as formatarNumero,
  formatarTextoAtraso,
  obterClasseStatus,
  obterHoje,
  pedidoEstaAtrasado,
} from "./pedidos.utils";
import { usePedidosSupabase } from "./usePedidosSupabase";

import "./PedidosPage.css";

const INTERVALO_LEITURA_SUPABASE = 15 * 1000;
const PEDIDOS_POR_PAGINA = 8;
const FILTROS_INICIAIS_PEDIDOS = Object.freeze({
  pesquisa: "",
  vendedor: "todos",
  status: "Pedido",
});


export default function PedidosPage() {
  /* =======================================================
     FILTROS
  ======================================================= */

  const [filtros, setFiltros] = useState(() => ({ ...FILTROS_INICIAIS_PEDIDOS }));
  const { pesquisa, vendedor, status } = filtros;


  /* =======================================================
     PAGINACAO
  ======================================================= */

  const [
    paginaAtual,
    setPaginaAtual,
  ] =
    useState(
      1,
    );


  /* =======================================================
     ESTADO DOS FILTROS
  ======================================================= */

  const possuiFiltro =
    possuiFiltrosAtivos(
      filtros,
      FILTROS_INICIAIS_PEDIDOS,
    );


  function limparFiltros() {
    setFiltros({
      ...FILTROS_INICIAIS_PEDIDOS,
    });

    setPaginaAtual(1);
  }


  /* =======================================================
     CONSULTA SUPABASE
  ======================================================= */

  const {
    data: respostaPedidos,
    pedidos,
    error: erroConsulta,
    isLoading,
    isFetching,
  } = usePedidosSupabase({
    refetchInterval: INTERVALO_LEITURA_SUPABASE,
    refetchIntervalInBackground: false,
    staleTime: 10 * 1000,
  });


  /* =======================================================
     VENDEDORES
  ======================================================= */

  const vendedores = useMemo(
    () =>
      valoresUnicosOrdenados(
        pedidos.map((pedido) => pedido.vendedor),
        {
          filtrar: (nome) => Boolean(nome && nome !== "-"),
          comparar: (a, b) => String(a).localeCompare(String(b), "pt-BR"),
        },
      ),
    [pedidos],
  );


  /* =======================================================
     STATUS DISPONIVEIS
  ======================================================= */

  const statusDisponiveis = useMemo(
    () =>
      valoresUnicosOrdenados(
        pedidos.map((pedido) => pedido.status),
        {
          comparar: (a, b) => String(a).localeCompare(String(b), "pt-BR"),
        },
      ),
    [pedidos],
  );


  /* =======================================================
     FILTRAR
  ======================================================= */

  const pedidosFiltrados =
    useMemo(
      () => {
        const termo =
          pesquisa
            .trim()
            .toLowerCase();

        return pedidos.filter(
          (
            pedido,
          ) => {
            const correspondePesquisa =
              !termo ||
              String(
                pedido.pedido ??
                  "",
              )
                .toLowerCase()
                .includes(
                  termo,
                ) ||
              String(
                pedido.cliente ??
                  "",
              )
                .toLowerCase()
                .includes(
                  termo,
                ) ||
              String(
                pedido.produto ??
                  "",
              )
                .toLowerCase()
                .includes(
                  termo,
                ) ||
              String(
                pedido.codigoProduto ??
                  "",
              )
                .toLowerCase()
                .includes(
                  termo,
                );

            const correspondeVendedor =
              vendedor ===
                "todos" ||
              pedido.vendedor ===
                vendedor;

            const correspondeStatus =
              status ===
                "todos" ||
              pedido.status ===
                status;

            return (
              correspondePesquisa &&
              correspondeVendedor &&
              correspondeStatus
            );
          },
        );
      },
      [
        pedidos,
        pesquisa,
        vendedor,
        status,
      ],
    );


  /* =======================================================
     AGRUPAMENTO DOS PEDIDOS

     A base é agrupada uma única vez. Antes a tela:
     1) descobria pedidos únicos;
     2) criava um Set com as chaves da página;
     3) percorria novamente todas as linhas;
     4) agrupava novamente os itens.

     O resultado visual e a ordem permanecem os mesmos,
     mas evitamos passagens extras sobre a lista.
  ======================================================= */

  const todosPedidosAgrupados = useMemo(
    () => agruparItensPorPedido(pedidosFiltrados),
    [pedidosFiltrados],
  );


  const pedidosUnicos = useMemo(
    () =>
      todosPedidosAgrupados
        .map((grupo) => grupo.itens[0])
        .filter(Boolean),
    [todosPedidosAgrupados],
  );


  /* =======================================================
     TOTAL DE PAGINAS
  ======================================================= */

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      todosPedidosAgrupados.length /
        PEDIDOS_POR_PAGINA,
    ),
  );


  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);


  /* =======================================================
     GRUPOS DA PAGINA ATUAL
  ======================================================= */

  const pedidosAgrupados = useMemo(() => {
    const inicio =
      (paginaAtual - 1) *
      PEDIDOS_POR_PAGINA;

    return todosPedidosAgrupados.slice(
      inicio,
      inicio + PEDIDOS_POR_PAGINA,
    );
  }, [todosPedidosAgrupados, paginaAtual]);


  /* =======================================================
     QUANTIDADE TOTAL
  ======================================================= */

  const quantidadeTotal =
    useMemo(
      () => {
        return pedidosFiltrados.reduce(
          (
            total,
            pedido,
          ) => {
            const quantidade =
              Number(
                pedido.quantidade,
              );

            if (
              !Number.isFinite(
                quantidade,
              )
            ) {
              return total;
            }

            return (
              total +
              quantidade
            );
          },
          0,
        );
      },
      [
        pedidosFiltrados,
      ],
    );


  /* =======================================================
     PEDIDOS ATRASADOS
  ======================================================= */

  const pedidosAtrasados =
    useMemo(
      () => {
        const hoje =
          obterHoje();

        return pedidosUnicos.filter(
          (
            pedido,
          ) => {
            const previsao =
              converterData(
                pedido.previsao,
              );

            if (
              !previsao
            ) {
              return false;
            }

            previsao.setHours(
              0,
              0,
              0,
              0,
            );

            return (
              previsao <
              hoje
            );
          },
        ).length;
      },
      [
        pedidosUnicos,
      ],
    );


  /* =======================================================
     PROXIMOS 7 DIAS
  ======================================================= */

  const entregasProximos7Dias =
    useMemo(
      () => {
        const hoje =
          obterHoje();

        const limite =
          new Date(
            hoje,
          );

        limite.setDate(
          limite.getDate() +
            7,
        );

        return pedidosUnicos.filter(
          (
            pedido,
          ) => {
            const previsao =
              converterData(
                pedido.previsao,
              );

            if (
              !previsao
            ) {
              return false;
            }

            previsao.setHours(
              0,
              0,
              0,
              0,
            );

            return (
              previsao >=
                hoje &&
              previsao <=
                limite
            );
          },
        ).length;
      },
      [
        pedidosUnicos,
      ],
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="pedidos-page">

      <div className="pedidos-container">

        {/* =================================================
            CABECALHO
        ================================================= */}

        <section className="pedidos-header">

          <div>

            <h1>
              Pedidos
            </h1>

            <p>
              Acompanhamento dos pedidos de venda em aberto.
            </p>

          </div>


          <div className="pedidos-header-actions">

            <AtualizacaoAutomatica
              atualizadoEm={respostaPedidos?.atualizadoEm}
            />

          </div>

        </section>


        {/* =================================================
            CARDS
        ================================================= */}

        <section className="pedidos-resumo">

          <article className="pedidos-card">

            <div className="pedidos-card-icon">

              <ShoppingCart
                size={22}
              />

            </div>


            <div>

              <span className="pedidos-card-label">
                Pedidos em aberto
              </span>

              <strong>
                {isLoading
                  ? "-"
                  : pedidosUnicos.length}
              </strong>

            </div>

          </article>


          <article className="pedidos-card">

            <div className="pedidos-card-icon">

              <AlertTriangle
                size={22}
              />

            </div>


            <div>

              <span className="pedidos-card-label">
                Pedidos atrasados
              </span>

              <strong>
                {isLoading
                  ? "-"
                  : pedidosAtrasados}
              </strong>

            </div>

          </article>


          <article className="pedidos-card">

            <div className="pedidos-card-icon">

              <PackageSearch
                size={22}
              />

            </div>


            <div>

              <span className="pedidos-card-label">
                Quantidade total
              </span>

              <strong>
                {isLoading
                  ? "-"
                  : formatarNumero(
                      quantidadeTotal,
                    )}
              </strong>

            </div>

          </article>


          <article className="pedidos-card">

            <div className="pedidos-card-icon">

              <CalendarClock
                size={22}
              />

            </div>


            <div>

              <span className="pedidos-card-label">
                Faturamentos próximos 7 dias
              </span>

              <strong>
                {isLoading
                  ? "-"
                  : entregasProximos7Dias}
              </strong>

            </div>

          </article>

        </section>


        {/* =================================================
            FILTROS
        ================================================= */}

        <Filtros
          as="section"
          className="pedidos-filtros"
          filtros={filtros}
          setFiltros={setFiltros}
          valoresPadrao={FILTROS_INICIAIS_PEDIDOS}
          onDepoisAlterar={() => setPaginaAtual(1)}
          onDepoisLimpar={() => setPaginaAtual(1)}
        >
          {({ alterar, limpar, possuiFiltroAtivo }) => (
            <>
              <div className="pedidos-pesquisa">
                <Search size={18} />
                <input
                  type="text"
                  value={pesquisa}
                  onChange={(evento) => alterar("pesquisa", evento.target.value)}
                  placeholder="Buscar pedido, cliente, código ou produto..."
                />
              </div>

              <select
                value={vendedor}
                onChange={(evento) => alterar("vendedor", evento.target.value)}
              >
                <option value="todos">Todos os vendedores</option>
                {vendedores.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>

              <select
                value={status}
                onChange={(evento) => alterar("status", evento.target.value)}
              >
                <option value="Pedido">Pedido</option>
                <option value="todos">Todos os status</option>
                {statusDisponiveis
                  .filter((nomeStatus) => nomeStatus !== "Pedido")
                  .map((nomeStatus) => (
                    <option key={nomeStatus} value={nomeStatus}>
                      {nomeStatus}
                    </option>
                  ))}
              </select>

              {possuiFiltroAtivo && (
                <button type="button" className="pedidos-btn-limpar" onClick={limpar}>
                  <X size={16} />
                  Limpar
                </button>
              )}
            </>
          )}
        </Filtros>

        {/* =================================================
            CONTEUDO
        ================================================= */}

        <section className="pedidos-content">

          <div className="pedidos-content-header">

            <div>

              <h2>
                Pedidos em aberto
              </h2>

              <p>

                {isLoading
                  ? "Carregando pedidos..."
                  : `${pedidosUnicos.length} pedido${
                      pedidosUnicos.length !== 1
                        ? "s"
                        : ""
                    } encontrado${
                      pedidosUnicos.length !== 1
                        ? "s"
                        : ""
                    }`}

                {isFetching &&
                  !isLoading &&
                  " • atualizando"}

              </p>

            </div>


            <span className="pedidos-demo">
              Dados do Omie
            </span>

          </div>


          {/* =================================================
              ERRO
          ================================================= */}

          {erroConsulta && (

            <div className="pedidos-empty">

              <div className="pedidos-empty-icon">

                <AlertTriangle
                  size={30}
                />

              </div>

              <h3>
                Não foi possível carregar os pedidos
              </h3>

              <p>
                {erroConsulta.message ||
                  "Ocorreu um erro ao consultar os pedidos armazenados."}
              </p>

            </div>

          )}


          {/* =================================================
              CARREGANDO
          ================================================= */}

          {!erroConsulta &&
            isLoading && (

              <div className="pedidos-empty">

                <div className="pedidos-empty-icon">

                  <RefreshCw
                    size={30}
                  />

                </div>

                <h3>
                  Carregando pedidos
                </h3>

                <p>
                  Consultando os pedidos armazenados no sistema.
                </p>

              </div>

            )}


          {/* =================================================
              TABELA
          ================================================= */}

          {!erroConsulta &&
            !isLoading &&
            pedidosFiltrados.length >
              0 && (
              <>

                <div className="pedidos-tabela-wrapper">

                  <table className="pedidos-tabela">

                    <thead>

                      <tr>

                        <th>
                          Pedido
                        </th>

                        <th>
                          Cliente
                        </th>

                        <th>
                          Data
                        </th>

                        <th className="pedidos-col-previsao">
                          Previsão faturamento
                        </th>

                        <th>
                          Código
                        </th>

                        <th className="pedidos-col-produto">
                          Produto
                        </th>

                        <th className="pedidos-col-numero">
                          Quantidade
                        </th>

                        <th>
                          Un.
                        </th>

                        <th>
                          Vendedor
                        </th>

                        <th>
                          Status
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {pedidosAgrupados.flatMap(
                        (
                          grupo,
                        ) => {

                          const quantidadeItens =
                            grupo.itens.length;

                          return grupo.itens.map(
                            (
                              pedido,
                              indiceItem,
                            ) => {

                              const primeiroItem =
                                indiceItem ===
                                0;

                              const diasAtraso =
                                calcularDiasAtraso(
                                  pedido.previsao,
                                );

                              const atrasado =
                                pedidoEstaAtrasado(
                                  pedido,
                                );

                              return (

                                <tr
                                  key={
                                    pedido.id
                                  }
                                  className={
                                    `${
                                      primeiroItem
                                        ? "pedidos-inicio-grupo"
                                        : "pedidos-item-continuacao"
                                    }${
                                      atrasado
                                        ? " pedido-linha-atrasada"
                                        : ""
                                    }`
                                  }
                                >

                                  {/* PEDIDO */}

                                  {primeiroItem && (

                                    <td
                                      rowSpan={
                                        quantidadeItens
                                      }
                                      className={`pedidos-celula-agrupada pedidos-celula-pedido${atrasado ? " pedido-celula-atrasada" : ""}`}
                                    >

                                      <div className="pedidos-pedido-agrupado">

                                        <strong className="pedidos-numero">
                                          {
                                            pedido.pedido
                                          }
                                        </strong>

                                        {quantidadeItens >
                                          1 && (

                                          <span className="pedidos-itens-badge">
                                            {quantidadeItens} itens
                                          </span>

                                        )}

                                      </div>

                                    </td>

                                  )}


                                  {/* CLIENTE */}

                                  {primeiroItem && (

                                    <td
                                      rowSpan={
                                        quantidadeItens
                                      }
                                      className={`pedidos-celula-agrupada${atrasado ? " pedido-celula-atrasada" : ""}`}
                                    >

                                      <div className="pedidos-cliente">
                                        {
                                          pedido.cliente
                                        }
                                      </div>

                                    </td>

                                  )}


                                  {/* DATA */}

                                  {primeiroItem && (

                                    <td
                                      rowSpan={
                                        quantidadeItens
                                      }
                                      className={`pedidos-celula-agrupada${atrasado ? " pedido-celula-atrasada" : ""}`}
                                    >

                                      {formatarData(
                                        pedido.data,
                                      )}

                                    </td>

                                  )}


                                  {/* PREVISAO FATURAMENTO */}

                                  {primeiroItem && (

                                    <td
                                      rowSpan={
                                        quantidadeItens
                                      }
                                      className={`pedidos-celula-agrupada pedidos-col-previsao${atrasado ? " pedido-celula-atrasada" : ""}`}
                                    >

                                      <div className="pedidos-previsao-wrapper">

                                        <span className="pedidos-previsao-data">

                                          {formatarData(
                                            pedido.previsao,
                                          )}

                                        </span>


                                        {atrasado && (

                                          <span className="pedidos-tag-atraso">

                                            <AlertTriangle
                                              size={11}
                                            />

                                            {formatarTextoAtraso(
                                              diasAtraso,
                                            )}

                                          </span>

                                        )}

                                      </div>

                                    </td>

                                  )}


                                  {/* CODIGO */}

                                  <td>

                                    <span className="pedidos-codigo-produto">
                                      {pedido.codigoProduto ||
                                        "-"}
                                    </span>

                                  </td>


                                  {/* PRODUTO */}

                                  <td className="pedidos-col-produto">

                                    <div className="pedidos-produto">

                                      {!primeiroItem && (

                                        <span className="pedidos-item-indicador">
                                          ↳
                                        </span>

                                      )}

                                      <span>
                                        {
                                          pedido.produto
                                        }
                                      </span>

                                    </div>

                                  </td>


                                  {/* QUANTIDADE */}

                                  <td className="pedidos-col-numero">

                                    {formatarNumero(
                                      pedido.quantidade,
                                    )}

                                  </td>


                                  {/* UNIDADE */}

                                  <td>
                                    {pedido.unidade ||
                                      "-"}
                                  </td>


                                  {/* VENDEDOR */}

                                  {primeiroItem && (

                                    <td
                                      rowSpan={
                                        quantidadeItens
                                      }
                                      className={`pedidos-celula-agrupada${atrasado ? " pedido-celula-atrasada" : ""}`}
                                    >

                                      <div className="pedidos-vendedor">
                                        {
                                          pedido.vendedor
                                        }
                                      </div>

                                    </td>

                                  )}


                                  {/* STATUS */}

                                  {primeiroItem && (

                                    <td
                                      rowSpan={
                                        quantidadeItens
                                      }
                                      className="pedidos-celula-agrupada"
                                    >

                                      <span
                                        className={
                                          `pedidos-status ${obterClasseStatus(
                                            pedido.status,
                                          )}`
                                        }
                                      >
                                        {
                                          pedido.status
                                        }
                                      </span>

                                    </td>

                                  )}

                                </tr>

                              );
                            },
                          );
                        },
                      )}

                    </tbody>

                  </table>

                </div>


                <Paginacao
                  paginaAtual={
                    paginaAtual
                  }
                  totalItens={
                    pedidosUnicos.length
                  }
                  itensPorPagina={
                    PEDIDOS_POR_PAGINA
                  }
                  onChangePagina={
                    setPaginaAtual
                  }
                />

              </>
            )}


          {/* =================================================
              VAZIO
          ================================================= */}

          {!erroConsulta &&
            !isLoading &&
            pedidosFiltrados.length ===
              0 && (

              <div className="pedidos-empty">

                <div className="pedidos-empty-icon">

                  <Search
                    size={30}
                  />

                </div>

                <h3>
                  Nenhum pedido encontrado
                </h3>

                <p>

                  {possuiFiltro
                    ? "Não existem pedidos que correspondam aos filtros selecionados."
                    : respostaPedidos?.atualizadoEm
                      ? "Nenhum pedido com status Pedido foi encontrado."
                      : "Ainda não existem pedidos sincronizados. Aguardando a primeira sincronização automática."}

                </p>


                {possuiFiltro && (

                  <button
                    type="button"
                    className="pedidos-btn-limpar-vazio"
                    onClick={
                      limparFiltros
                    }
                  >
                    Limpar filtros
                  </button>

                )}

              </div>

            )}

        </section>


        <div className="pedidos-rodape-info">

          <Clock3
            size={14}
          />

          Os pedidos são sincronizados automaticamente
          com o Omie.

        </div>

      </div>

    </main>
  );
}