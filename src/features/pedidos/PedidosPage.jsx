import {
  useEffect,
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

import Paginacao from "@/componentS/Paginacao/Paginacao";

import {
  buscarPedidosOmie,
} from "./omie.functions";

import "./PedidosPage.css";


/* =========================================================
   CONFIGURACOES
========================================================= */

const INTERVALO_LEITURA_SUPABASE =
  15 * 1000;

const INTERVALO_RELOGIO =
  1000;

const PEDIDOS_POR_PAGINA =
  8;


/* =========================================================
   DATAS
========================================================= */

function converterData(
  dataTexto,
) {
  if (!dataTexto) {
    return null;
  }

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


function obterProximaAtualizacao(
  dataAtual,
) {
  const agora =
    dataAtual instanceof Date
      ? dataAtual
      : new Date();

  const proxima =
    new Date(
      agora,
    );

  proxima.setSeconds(
    0,
    0,
  );

  const minutoAtual =
    agora.getMinutes();

  const proximoMinuto =
    (
      Math.floor(
        minutoAtual / 15,
      ) + 1
    ) * 15;

  if (
    proximoMinuto >= 60
  ) {
    proxima.setHours(
      proxima.getHours() + 1,
      0,
      0,
      0,
    );
  } else {
    proxima.setMinutes(
      proximoMinuto,
      0,
      0,
    );
  }

  return proxima;
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
   ATRASO
========================================================= */

function calcularDiasAtraso(
  previsao,
) {
  const dataPrevisao =
    converterData(
      previsao,
    );

  if (
    !dataPrevisao
  ) {
    return 0;
  }

  const hoje =
    obterHoje();

  dataPrevisao.setHours(
    0,
    0,
    0,
    0,
  );

  const diferencaMs =
    hoje.getTime() -
    dataPrevisao.getTime();

  if (
    diferencaMs <= 0
  ) {
    return 0;
  }

  return Math.floor(
    diferencaMs /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}


function pedidoEstaAtrasado(
  pedido,
) {
  const statusPedido =
    String(
      pedido?.status ??
        "",
    )
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      );

  return (
    statusPedido ===
      "pedido" &&
    calcularDiasAtraso(
      pedido?.previsao,
    ) > 0
  );
}


function formatarTextoAtraso(
  dias,
) {
  if (
    dias === 1
  ) {
    return "1 dia em atraso";
  }

  return `${dias} dias em atraso`;
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
   IDENTIFICADOR UNICO DO PEDIDO
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
   COMPONENTE
========================================================= */

export default function PedidosPage() {
  /* =======================================================
     RELOGIO
  ======================================================= */

  const [
    agora,
    setAgora,
  ] =
    useState(
      () => new Date(),
    );


  useEffect(
    () => {
      const intervalo =
        window.setInterval(
          () => {
            setAgora(
              new Date(),
            );
          },
          INTERVALO_RELOGIO,
        );

      return () => {
        window.clearInterval(
          intervalo,
        );
      };
    },
    [],
  );


  /* =======================================================
     FILTROS
  ======================================================= */

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
      "Pedido",
    );


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
     CONSULTA SUPABASE
  ======================================================= */

  const {
    data:
      respostaPedidos,

    error:
      erroConsulta,

    isLoading,

    isFetching,
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

      refetchInterval:
        INTERVALO_LEITURA_SUPABASE,

      refetchIntervalInBackground:
        false,

      refetchOnMount:
        true,

      refetchOnWindowFocus:
        true,

      staleTime:
        10 * 1000,

      retry:
        1,
    });


  /* =======================================================
     PEDIDOS
  ======================================================= */

  const pedidos =
    Array.isArray(
      respostaPedidos
        ?.pedidos,
    )
      ? respostaPedidos.pedidos
      : [];


  /* =======================================================
     PROXIMA ATUALIZACAO
  ======================================================= */

  const proximaAtualizacao =
    useMemo(
      () =>
        obterProximaAtualizacao(
          agora,
        ),
      [
        agora,
      ],
    );


  /* =======================================================
     VENDEDORES
  ======================================================= */

  const vendedores =
    useMemo(
      () => {
        return [
          ...new Set(
            pedidos
              .map(
                (
                  pedido,
                ) =>
                  pedido.vendedor,
              )
              .filter(
                (
                  nome,
                ) =>
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
                (
                  pedido,
                ) =>
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
     PEDIDOS UNICOS
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
     TOTAL DE PAGINAS
  ======================================================= */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        pedidosUnicos.length /
          PEDIDOS_POR_PAGINA,
      ),
    );


  useEffect(
    () => {
      if (
        paginaAtual >
        totalPaginas
      ) {
        setPaginaAtual(
          totalPaginas,
        );
      }
    },
    [
      paginaAtual,
      totalPaginas,
    ],
  );


  /* =======================================================
     PEDIDOS UNICOS DA PAGINA
  ======================================================= */

  const pedidosUnicosDaPagina =
    useMemo(
      () => {
        const inicio =
          (
            paginaAtual - 1
          ) *
          PEDIDOS_POR_PAGINA;

        const fim =
          inicio +
          PEDIDOS_POR_PAGINA;

        return pedidosUnicos.slice(
          inicio,
          fim,
        );
      },
      [
        pedidosUnicos,
        paginaAtual,
      ],
    );


  /* =======================================================
     CHAVES DOS PEDIDOS DA PAGINA
  ======================================================= */

  const chavesPedidosDaPagina =
    useMemo(
      () => {
        return new Set(
          pedidosUnicosDaPagina.map(
            (
              pedido,
            ) =>
              obterChavePedido(
                pedido,
              ),
          ),
        );
      },
      [
        pedidosUnicosDaPagina,
      ],
    );


  /* =======================================================
     TODAS AS LINHAS DOS PEDIDOS DA PAGINA
  ======================================================= */

  const pedidosPaginados =
    useMemo(
      () => {
        return pedidosFiltrados.filter(
          (
            pedido,
          ) =>
            chavesPedidosDaPagina.has(
              obterChavePedido(
                pedido,
              ),
            ),
        );
      },
      [
        pedidosFiltrados,
        chavesPedidosDaPagina,
      ],
    );


  /* =======================================================
     AGRUPAR ITENS POR PEDIDO
  ======================================================= */

  const pedidosAgrupados =
    useMemo(
      () => {
        const mapa =
          new Map();

        for (
          const pedido
          of pedidosPaginados
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
              {
                chave,
                itens: [],
              },
            );
          }

          mapa
            .get(
              chave,
            )
            .itens
            .push(
              pedido,
            );
        }

        return [
          ...mapa.values(),
        ];
      },
      [
        pedidosPaginados,
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
     ALTERAR FILTROS
  ======================================================= */

  function alterarPesquisa(
    valor,
  ) {
    setPesquisa(
      valor,
    );

    setPaginaAtual(
      1,
    );
  }


  function alterarVendedor(
    valor,
  ) {
    setVendedor(
      valor,
    );

    setPaginaAtual(
      1,
    );
  }


  function alterarStatus(
    valor,
  ) {
    setStatus(
      valor,
    );

    setPaginaAtual(
      1,
    );
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
      "Pedido",
    );

    setPaginaAtual(
      1,
    );
  }


  const possuiFiltro =
    Boolean(
      pesquisa,
    ) ||
    vendedor !==
      "todos" ||
    status !==
      "Pedido";


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

            <div
              className="pedidos-atualizacao"
              title={
                respostaPedidos
                  ?.atualizadoEm
                  ? (
                      `Última sincronização: ${formatarDataHora(
                        respostaPedidos
                          .atualizadoEm,
                      )} | Próxima execução automática: ${formatarDataHora(
                        proximaAtualizacao,
                      )}`
                    )
                  : (
                      `Aguardando primeira sincronização. Próxima execução automática: ${formatarDataHora(
                        proximaAtualizacao,
                      )}`
                    )
              }
            >

              <Clock3
                size={18}
              />


              <div className="pedidos-atualizacao-textos">

                <span className="pedidos-atualizacao-titulo">
                  Atualização automática
                </span>


                <span className="pedidos-atualizacao-horarios">

                  Última:{" "}

                  <strong>
                    {formatarHorario(
                      respostaPedidos
                        ?.atualizadoEm,
                    )}
                  </strong>


                  <span className="pedidos-atualizacao-separador">
                    |
                  </span>


                  Próxima:{" "}

                  <strong>
                    {formatarHorario(
                      proximaAtualizacao,
                    )}
                  </strong>

                </span>

              </div>

            </div>

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
                  alterarPesquisa(
                    evento
                      .target
                      .value,
                  )
              }
              placeholder="Buscar pedido, cliente, código ou produto..."
            />

          </div>


          <select
            value={
              vendedor
            }
            onChange={
              (
                evento,
              ) =>
                alterarVendedor(
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


          <select
            value={
              status
            }
            onChange={
              (
                evento,
              ) =>
                alterarStatus(
                  evento
                    .target
                    .value,
                )
            }
          >

            <option value="Pedido">
              Pedido
            </option>

            <option value="todos">
              Todos os status
            </option>

            {statusDisponiveis
              .filter(
                (
                  nomeStatus,
                ) =>
                  nomeStatus !==
                  "Pedido",
              )
              .map(
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