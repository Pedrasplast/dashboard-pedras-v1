import {
  useMemo,
  useState,
} from "react";

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

import {
  useQuery,
} from "@tanstack/react-query";

import {
  supabase,
} from "@/lib/supabaseClient";

import {
  buscarPedidosOmie,
} from "./omie.functions";

import "./PedidosPage.css";


/*
 * A tela verifica o SUPABASE
 * a cada 60 segundos.
 *
 * Isso NÃO consulta o Omie.
 */
const INTERVALO_LEITURA_SUPABASE =
  60 * 1000;


/* =========================================================
   DATAS
========================================================= */

function converterData(
  dataTexto,
) {
  if (!dataTexto) {
    return null;
  }

  /*
   * Formato DD/MM/AAAA
   */
  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      dataTexto,
    )
  ) {
    const [
      dia,
      mes,
      ano,
    ] =
      dataTexto
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


  const data =
    new Date(
      dataTexto,
    );


  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return null;
  }


  return data;
}


function obterHoje() {
  const agora =
    new Date();


  return new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
    0,
    0,
    0,
    0,
  );
}


function formatarData(
  dataTexto,
) {
  if (!dataTexto) {
    return "-";
  }


  if (
    /^\d{2}\/\d{2}\/\d{4}$/.test(
      dataTexto,
    )
  ) {
    return dataTexto;
  }


  const data =
    converterData(
      dataTexto,
    );


  if (!data) {
    return "-";
  }


  return data.toLocaleDateString(
    "pt-BR",
  );
}


function formatarHorario(
  dataTexto,
) {
  if (!dataTexto) {
    return "-";
  }


  const data =
    dataTexto instanceof Date
      ? dataTexto
      : new Date(
          dataTexto,
        );


  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "-";
  }


  return data.toLocaleTimeString(
    "pt-BR",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );
}


function formatarDataHora(
  dataTexto,
) {
  if (!dataTexto) {
    return "-";
  }


  const data =
    new Date(
      dataTexto,
    );


  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "-";
  }


  return data.toLocaleString(
    "pt-BR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );
}


/* =========================================================
   NUMEROS
========================================================= */

function formatarNumero(
  valor,
) {
  const numero =
    Number(
      valor,
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "0";
  }


  return numero.toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits:
        3,
    },
  );
}


function formatarMoeda(
  valor,
) {
  const numero =
    Number(
      valor,
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "-";
  }


  return numero.toLocaleString(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    },
  );
}


/* =========================================================
   STATUS
========================================================= */

function obterClasseStatus(
  status,
) {
  const texto =
    String(
      status ?? "",
    )
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      );


  if (
    texto.includes(
      "separa",
    )
  ) {
    return "status-separacao";
  }


  if (
    texto.includes(
      "liber",
    )
  ) {
    return "status-liberado";
  }


  if (
    texto === "pedido" ||
    texto.includes(
      "aberto",
    )
  ) {
    return "status-aberto";
  }


  return "status-padrao";
}


/* =========================================================
   IDENTIFICAR PEDIDO UNICO
========================================================= */

function obterChavePedido(
  pedido,
) {
  return String(
    pedido.codigoPedido ||
      pedido.pedido ||
      pedido.id,
  );
}


/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function PedidosPage() {
  const [
    pesquisa,
    setPesquisa,
  ] =
    useState("");


  const [
    vendedor,
    setVendedor,
  ] =
    useState(
      "todos",
    );


  const [
    status,
    setStatus,
  ] =
    useState(
      "todos",
    );


  const [
    sincronizandoOmie,
    setSincronizandoOmie,
  ] =
    useState(
      false,
    );


  const [
    erroSincronizacao,
    setErroSincronizacao,
  ] =
    useState(
      "",
    );


  /* =======================================================
     CONSULTAR PEDIDOS SALVOS NO SUPABASE

     buscarPedidosOmie lê somente as tabelas
     armazenadas no Supabase.

     NÃO consulta o Omie.
  ======================================================= */

  const {
    data:
      respostaPedidos,

    error:
      erroConsulta,

    isLoading,

    isFetching,

    refetch,
  } =
    useQuery({
      queryKey: [
        "pedidos-supabase-abertos",
      ],


      queryFn:
        async () => {
          const {
            data:
              sessaoData,

            error:
              sessaoErro,
          } =
            await supabase
              .auth
              .getSession();


          if (
            sessaoErro
          ) {
            throw new Error(
              "Não foi possível validar sua sessão.",
            );
          }


          const accessToken =
            sessaoData
              ?.session
              ?.access_token;


          if (
            !accessToken
          ) {
            throw new Error(
              "Sua sessão expirou. Entre novamente no sistema.",
            );
          }


          return await buscarPedidosOmie({
            data: {
              accessToken,
            },
          });
        },


      /*
       * Apenas consulta o Supabase.
       */
      refetchInterval:
        INTERVALO_LEITURA_SUPABASE,


      /*
       * Não continua consultando
       * com navegador em segundo plano.
       */
      refetchIntervalInBackground:
        false,


      /*
       * Consulta o Supabase
       * ao entrar na tela.
       */
      refetchOnMount:
        true,


      /*
       * Verifica novamente
       * ao retornar para a aba.
       */
      refetchOnWindowFocus:
        true,


      staleTime:
        30 * 1000,


      retry:
        1,
    });


  const pedidos =
    Array.isArray(
      respostaPedidos
        ?.pedidos,
    )
      ? respostaPedidos.pedidos
      : [];


  /* =======================================================
     VENDEDORES DISPONIVEIS
  ======================================================= */

  const vendedores =
    useMemo(
      () => {
        return [
          ...new Set(
            pedidos
              .map(
                (pedido) =>
                  pedido.vendedor,
              )
              .filter(
                (nome) =>
                  nome &&
                  nome !== "-",
              ),
          ),
        ].sort(
          (
            a,
            b,
          ) =>
            a.localeCompare(
              b,
              "pt-BR",
            ),
        );
      },
      [
        pedidos,
      ],
    );


  /* =======================================================
     STATUS DISPONIVEIS
  ======================================================= */

  const statusDisponiveis =
    useMemo(
      () => {
        return [
          ...new Set(
            pedidos
              .map(
                (pedido) =>
                  pedido.status,
              )
              .filter(
                Boolean,
              ),
          ),
        ].sort(
          (
            a,
            b,
          ) =>
            a.localeCompare(
              b,
              "pt-BR",
            ),
        );
      },
      [
        pedidos,
      ],
    );


  /* =======================================================
     FILTROS
  ======================================================= */

  const pedidosFiltrados =
    useMemo(
      () => {
        const termo =
          pesquisa
            .trim()
            .toLowerCase();


        return pedidos.filter(
          (pedido) => {
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
     PEDIDOS UNICOS

     Um pedido pode possuir vários itens.
     Ele deve contar somente uma vez nos cards.
  ======================================================= */

  const pedidosUnicos =
    useMemo(
      () => {
        const mapa =
          new Map();


        for (
          const pedido
          of pedidosFiltrados
        ) {
          const chave =
            obterChavePedido(
              pedido,
            );


          if (
            !mapa.has(
              chave,
            )
          ) {
            mapa.set(
              chave,
              pedido,
            );
          }
        }


        return [
          ...mapa.values(),
        ];
      },
      [
        pedidosFiltrados,
      ],
    );


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
          (pedido) => {
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
     ENTREGAS PROXIMOS 7 DIAS
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
          (pedido) => {
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
     ATUALIZAR AGORA

     Agora o botão chama diretamente
     a EDGE FUNCTION do Supabase.

     DASHBOARD
        ↓
     EDGE FUNCTION
        ↓
     OMIE
        ↓
     SUPABASE
        ↓
     RECARREGA A TELA

     Nenhuma chave secreta fica no navegador.
  ======================================================= */

  async function atualizarAgora() {
    if (
      sincronizandoOmie
    ) {
      return;
    }


    setErroSincronizacao(
      "",
    );


    setSincronizandoOmie(
      true,
    );


    try {
      /*
       * Confirma que o usuário ainda
       * possui uma sessão válida.
       */
      const {
        data:
          sessaoData,

        error:
          sessaoErro,
      } =
        await supabase
          .auth
          .getSession();


      if (
        sessaoErro
      ) {
        throw new Error(
          "Não foi possível validar sua sessão.",
        );
      }


      if (
        !sessaoData
          ?.session
          ?.access_token
      ) {
        throw new Error(
          "Sua sessão expirou. Entre novamente no sistema.",
        );
      }


      /*
       * Chama diretamente a Edge Function.
       *
       * OMIE_APP_KEY e OMIE_APP_SECRET
       * ficam apenas nos Secrets do Supabase.
       */
      const {
        data,
        error,
      } =
        await supabase
          .functions
          .invoke(
            "sincronizar-pedidos-omie",
            {
              body: {},
            },
          );


      /*
       * Erro HTTP / chamada da Edge Function.
       */
      if (
        error
      ) {
        console.error(
          "Erro retornado pela Edge Function:",
          error,
        );


        throw new Error(
          error.message ||
          "Não foi possível executar a sincronização.",
        );
      }


      /*
       * A Edge Function respondeu,
       * mas informou falha na sincronização.
       */
      if (
        !data?.sucesso
      ) {
        console.error(
          "Falha retornada pela sincronização:",
          data,
        );


        const etapa =
          data?.etapa
            ? ` (${data.etapa})`
            : "";


        throw new Error(
          `${
            data?.erro ||
            "A sincronização com o Omie não foi concluída."
          }${etapa}`,
        );
      }


      console.log(
        "Sincronização concluída:",
        data,
      );


      /*
       * Omie -> Supabase terminou.
       *
       * Agora recarregamos somente
       * os dados armazenados no Supabase.
       */
      await refetch();

    } catch (
      erro
    ) {
      console.error(
        "Erro ao sincronizar pedidos:",
        erro,
      );


      setErroSincronizacao(
        erro instanceof Error
          ? erro.message
          : "Não foi possível sincronizar os pedidos com o Omie.",
      );


      /*
       * Mesmo se ocorrer erro,
       * verifica se a Edge Function
       * chegou a atualizar algum status.
       */
      try {
        await refetch();
      } catch {
        // Mantém o erro principal.
      }

    } finally {
      setSincronizandoOmie(
        false,
      );
    }
  }


  /* =======================================================
     LIMPAR FILTROS
  ======================================================= */

  function limparFiltros() {
    setPesquisa(
      "",
    );

    setVendedor(
      "todos",
    );

    setStatus(
      "todos",
    );
  }


  const possuiFiltro =
    Boolean(
      pesquisa,
    ) ||
    vendedor !==
      "todos" ||
    status !==
      "todos";


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
              Acompanhamento dos pedidos de venda
              em aberto.
            </p>

          </div>


          <div className="pedidos-header-actions">

            {/* ULTIMA ATUALIZACAO */}

            <div
              className="pedidos-atualizacao"
              title={
                respostaPedidos
                  ?.atualizadoEm
                  ? `Última sincronização: ${formatarDataHora(
                      respostaPedidos
                        .atualizadoEm,
                    )}`
                  : "Ainda não houve sincronização"
              }
            >

              <Clock3
                size={15}
              />

              <span>

                Última atualização:
                {" "}

                <strong>
                  {formatarHorario(
                    respostaPedidos
                      ?.atualizadoEm,
                  )}
                </strong>

              </span>

            </div>


            {/* BOTAO SINCRONIZAR */}

            <button
              type="button"
              className="pedidos-btn-atualizar"
              onClick={
                atualizarAgora
              }
              disabled={
                sincronizandoOmie
              }
            >

              <RefreshCw
                size={17}
              />

              {sincronizandoOmie
                ? "Sincronizando..."
                : "Atualizar agora"}

            </button>

          </div>

        </section>


        {/* =================================================
            ERRO DA SINCRONIZACAO
        ================================================= */}

        {erroSincronizacao && (

          <div
            style={{
              marginBottom:
                "18px",

              padding:
                "12px 14px",

              border:
                "1px solid #fecaca",

              borderRadius:
                "8px",

              background:
                "#fef2f2",

              color:
                "#b91c1c",

              fontSize:
                "13px",
            }}
          >

            <strong>
              Falha na sincronização:
            </strong>

            {" "}

            {erroSincronizacao}

          </div>

        )}


        {/* =================================================
            INDICADORES
        ================================================= */}

        <section className="pedidos-resumo">

          {/* PEDIDOS EM ABERTO */}

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


          {/* ATRASADOS */}

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


          {/* QUANTIDADE */}

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


          {/* PROXIMOS 7 DIAS */}

          <article className="pedidos-card">

            <div className="pedidos-card-icon">

              <CalendarClock
                size={22}
              />

            </div>


            <div>

              <span className="pedidos-card-label">
                Entregas próximos 7 dias
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

        <section className="pedidos-filtros">

          <div className="pedidos-pesquisa">

            <Search
              size={18}
            />

            <input
              type="text"
              value={
                pesquisa
              }
              onChange={
                (
                  evento,
                ) =>
                  setPesquisa(
                    evento
                      .target
                      .value,
                  )
              }
              placeholder="Buscar pedido, cliente, código ou produto..."
            />

          </div>


          {/* VENDEDOR */}

          <select
            value={
              vendedor
            }
            onChange={
              (
                evento,
              ) =>
                setVendedor(
                  evento
                    .target
                    .value,
                )
            }
          >

            <option value="todos">
              Todos os vendedores
            </option>

            {vendedores.map(
              (
                nome,
              ) => (

                <option
                  key={
                    nome
                  }
                  value={
                    nome
                  }
                >
                  {nome}
                </option>

              ),
            )}

          </select>


          {/* STATUS */}

          <select
            value={
              status
            }
            onChange={
              (
                evento,
              ) =>
                setStatus(
                  evento
                    .target
                    .value,
                )
            }
          >

            <option value="todos">
              Todos os status
            </option>

            {statusDisponiveis.map(
              (
                nomeStatus,
              ) => (

                <option
                  key={
                    nomeStatus
                  }
                  value={
                    nomeStatus
                  }
                >
                  {nomeStatus}
                </option>

              ),
            )}

          </select>


          {possuiFiltro && (

            <button
              type="button"
              className="pedidos-btn-limpar"
              onClick={
                limparFiltros
              }
            >

              <X
                size={16}
              />

              Limpar

            </button>

          )}

        </section>


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
                      pedidosUnicos.length !==
                      1
                        ? "s"
                        : ""
                    } encontrado${
                      pedidosUnicos.length !==
                      1
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
              ERRO AO LER SUPABASE
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
              CARREGAMENTO
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
                  Consultando os pedidos armazenados
                  no sistema.
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

                      <th>
                        Previsão
                      </th>

                      <th>
                        Código
                      </th>

                      <th>
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

                      <th className="pedidos-col-valor">
                        Valor
                      </th>

                      <th>
                        Status
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {pedidosFiltrados.map(
                      (
                        pedido,
                      ) => (

                        <tr
                          key={
                            pedido.id
                          }
                        >

                          <td>

                            <strong className="pedidos-numero">
                              #
                              {
                                pedido.pedido
                              }
                            </strong>

                          </td>


                          <td>

                            <div className="pedidos-cliente">
                              {
                                pedido.cliente
                              }
                            </div>

                          </td>


                          <td>
                            {formatarData(
                              pedido.data,
                            )}
                          </td>


                          <td>
                            {formatarData(
                              pedido.previsao,
                            )}
                          </td>


                          <td>
                            {pedido.codigoProduto ||
                              "-"}
                          </td>


                          <td>

                            <div className="pedidos-produto">
                              {
                                pedido.produto
                              }
                            </div>

                          </td>


                          <td className="pedidos-col-numero">

                            {formatarNumero(
                              pedido.quantidade,
                            )}

                          </td>


                          <td>
                            {pedido.unidade ||
                              "-"}
                          </td>


                          <td>
                            {
                              pedido.vendedor
                            }
                          </td>


                          <td className="pedidos-col-valor">

                            {formatarMoeda(
                              pedido.valor,
                            )}

                          </td>


                          <td>

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

                        </tr>

                      ),
                    )}

                  </tbody>

                </table>

              </div>

            )}


          {/* =================================================
              NENHUM PEDIDO
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
                      ? "Nenhum pedido em aberto foi encontrado."
                      : "Ainda não existem pedidos sincronizados. Clique em Atualizar agora para realizar a primeira sincronização."}

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


        {/* =================================================
            RODAPE
        ================================================= */}

        <div className="pedidos-rodape-info">

          <Clock3
            size={14}
          />

          A tela utiliza os pedidos armazenados no sistema.
          A sincronização automática com o Omie será realizada
          a cada 15 minutos.

        </div>

      </div>

    </main>
  );
}