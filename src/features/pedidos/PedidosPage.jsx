import { useCallback, useEffect, useMemo, useState } from "react";

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

import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabaseClient";

import Paginacao from "@/components/paginacao/Paginacao";

import { buscarPedidosOmie } from "./omie.functions";

import "./PedidosPage.css";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const INTERVALO_LEITURA_SUPABASE = 15 * 1000;

const INTERVALO_RELOGIO = 1000;

const PEDIDOS_POR_PAGINA = 8;

/* =========================================================
   TEXTO
========================================================= */

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* =========================================================
   DATAS
========================================================= */

function converterData(dataTexto) {
  if (!dataTexto) {
    return null;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataTexto)) {
    const [dia, mes, ano] = dataTexto.split("/").map(Number);

    return new Date(ano, mes - 1, dia, 0, 0, 0, 0);
  }

  const data = new Date(dataTexto);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data;
}

function obterHoje() {
  const agora = new Date();

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

function obterProximaAtualizacao(dataAtual) {
  const agora = dataAtual instanceof Date ? dataAtual : new Date();

  const proxima = new Date(agora);

  proxima.setSeconds(0, 0);

  const minutoAtual = agora.getMinutes();

  const proximoMinuto = (Math.floor(minutoAtual / 15) + 1) * 15;

  if (proximoMinuto >= 60) {
    proxima.setHours(proxima.getHours() + 1, 0, 0, 0);
  } else {
    proxima.setMinutes(proximoMinuto, 0, 0);
  }

  return proxima;
}

function formatarData(dataTexto) {
  if (!dataTexto) {
    return "-";
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataTexto)) {
    return dataTexto;
  }

  const data = converterData(dataTexto);

  if (!data) {
    return "-";
  }

  return data.toLocaleDateString("pt-BR");
}

function formatarHorario(dataTexto) {
  if (!dataTexto) {
    return "-";
  }

  const data =
    dataTexto instanceof Date
      ? dataTexto
      : new Date(dataTexto);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",

    minute: "2-digit",
  });
}

function formatarDataHora(dataTexto) {
  if (!dataTexto) {
    return "-";
  }

  const data =
    dataTexto instanceof Date
      ? dataTexto
      : new Date(dataTexto);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleString("pt-BR", {
    day: "2-digit",

    month: "2-digit",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",
  });
}

/* =========================================================
   ATRASO
========================================================= */

function calcularDiasAtraso(previsao) {
  const dataPrevisao = converterData(previsao);

  if (!dataPrevisao) {
    return 0;
  }

  const hoje = obterHoje();

  dataPrevisao.setHours(0, 0, 0, 0);

  const diferencaMs =
    hoje.getTime() -
    dataPrevisao.getTime();

  if (diferencaMs <= 0) {
    return 0;
  }

  return Math.floor(
    diferencaMs /
      (1000 * 60 * 60 * 24),
  );
}

function pedidoEstaAtrasado(pedido) {
  return (
    normalizarTexto(pedido?.status) ===
      "pedido" &&
    calcularDiasAtraso(
      pedido?.previsao,
    ) > 0
  );
}

function formatarTextoAtraso(dias) {
  if (dias === 1) {
    return "1 dia em atraso";
  }

  return `${dias} dias em atraso`;
}

/* =========================================================
   NÚMEROS
========================================================= */

function formatarNumero(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0";
  }

  return numero.toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits: 3,
    },
  );
}

/* =========================================================
   STATUS
========================================================= */

function pedidoEhCancelado(pedido) {
  return (
    normalizarTexto(
      pedido?.status,
    ) === "cancelado"
  );
}

function obterClasseStatus(status) {
  const texto =
    normalizarTexto(status);

  if (texto.includes("cancel")) {
    return "status-cancelado";
  }

  if (texto.includes("separa")) {
    return "status-separacao";
  }

  if (texto.includes("liber")) {
    return "status-liberado";
  }

  if (
    texto === "pedido" ||
    texto.includes("aberto")
  ) {
    return "status-aberto";
  }

  return "status-padrao";
}

/* =========================================================
   IDENTIFICADOR ÚNICO DO PEDIDO
========================================================= */

function obterChavePedido(pedido) {
  return String(
    pedido?.codigoPedido ||
      pedido?.codigo_pedido ||
      pedido?.pedido ||
      pedido?.numero_pedido ||
      pedido?.id ||
      "",
  );
}

/* =========================================================
   CÓDIGO OMIE DO PEDIDO

   Usado para relacionar a linha da tabela
   com a notificação gravada no Supabase.
========================================================= */

function obterCodigoPedidoOmie(pedido) {
  const codigo = Number(
    pedido?.codigoPedidoOmie ??
      pedido?.codigoPedido ??
      pedido?.codigo_pedido_omie ??
      pedido?.codigo_pedido ??
      null,
  );

  if (
    !Number.isFinite(codigo) ||
    codigo <= 0
  ) {
    return null;
  }

  return codigo;
}

/* =========================================================
   DATA DA NOTIFICAÇÃO

   Utilizada somente para ordenar NOVO/ALTERADO,
   deixando a ocorrência mais recente primeiro.
========================================================= */

function obterTimestampNotificacao(notificacao) {
  const valor =
    notificacao?.atualizado_em ??
    notificacao?.criado_em ??
    null;

  if (!valor) {
    return 0;
  }

  const timestamp =
    new Date(valor).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function PedidosPage() {
  /* =======================================================
     RELÓGIO
  ======================================================= */

  const [agora, setAgora] =
    useState(() => new Date());

  useEffect(() => {
    const intervalo =
      window.setInterval(() => {
        setAgora(new Date());
      }, INTERVALO_RELOGIO);

    return () => {
      window.clearInterval(
        intervalo,
      );
    };
  }, []);

  /* =======================================================
     FILTROS
  ======================================================= */

  const [pesquisa, setPesquisa] =
    useState("");

  const [vendedor, setVendedor] =
    useState("todos");

  const [status, setStatus] =
    useState("Pedido");

  /* =======================================================
     PAGINAÇÃO
  ======================================================= */

  const [
    paginaAtual,
    setPaginaAtual,
  ] = useState(1);

  /* =======================================================
     CONSULTA DOS PEDIDOS
  ======================================================= */

  const {
    data: respostaPedidos,

    error: erroConsulta,

    isLoading,

    isFetching,

    refetch: refetchPedidos,
  } = useQuery({
    queryKey: [
      "pedidos-supabase",
    ],

    queryFn: async () => {
      const {
        data: sessaoData,

        error: sessaoErro,
      } =
        await supabase.auth.getSession();

      if (sessaoErro) {
        throw new Error(
          "Não foi possível validar sua sessão.",
        );
      }

      const accessToken =
        sessaoData?.session
          ?.access_token;

      if (!accessToken) {
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

    refetchOnMount: true,

    refetchOnWindowFocus: true,

    staleTime: 10 * 1000,

    retry: 1,
  });

  /* =======================================================
     NOTIFICAÇÕES NÃO LIDAS
  ======================================================= */

  const {
    data:
      notificacoesPendentes = [],

    refetch:
      refetchNotificacoes,
  } = useQuery({
    queryKey: [
      "pedidos-notificacoes-nao-lidas",
    ],

    queryFn: async () => {
      const { data, error } =
        await supabase.rpc(
          "listar_notificacoes_pedidos_nao_lidas",
          {
            p_limite: 100,
          },
        );

      if (error) {
        throw error;
      }

      return Array.isArray(data)
        ? data
        : [];
    },

    refetchInterval:
      30 * 1000,

    refetchIntervalInBackground:
      false,

    refetchOnMount: true,

    refetchOnWindowFocus: true,

    staleTime: 10 * 1000,

    retry: 1,
  });

  /* =======================================================
     MAPA DAS NOTIFICAÇÕES PENDENTES

     Cada pedido pode estar:
     - NOVO
     - ALTERADO
  ======================================================= */

  const notificacoesPorPedido =
    useMemo(() => {
      const mapa = new Map();

      for (
        const notificacao of
        notificacoesPendentes
      ) {
        const codigo = Number(
          notificacao?.codigo_pedido_omie,
        );

        if (
          Number.isFinite(codigo) &&
          codigo > 0
        ) {
          mapa.set(
            codigo,
            notificacao,
          );
        }
      }

      return mapa;
    }, [notificacoesPendentes]);

  /* =======================================================
     REALTIME DE PEDIDOS

     INSERT = pedido novo
     UPDATE = pedido alterado
     DELETE = limpeza eventual de notificação
  ======================================================= */

  useEffect(() => {
    const canal = supabase
      .channel(
        "pedidos-page-notificacoes",
      )
      .on(
        "postgres_changes",
        {
          event: "*",

          schema: "public",

          table:
            "pedidos_notificacoes",
        },
        (payload) => {
          const notificacao =
            payload?.new;

          /*
           * Em DELETE não existe payload.new.
           * Mesmo assim precisamos atualizar os badges.
           */
          if (!notificacao) {
            void refetchNotificacoes();

            return;
          }

          /*
           * Se a notificação deixou de ser ativa,
           * basta remover o destaque da tela.
           */
          if (
            notificacao.notificar !==
            true
          ) {
            void refetchNotificacoes();

            return;
          }

          /*
           * NOVO ou ALTERADO:
           * atualiza a notificação e os dados do pedido.
           */
          void refetchNotificacoes();

          void refetchPedidos();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        canal,
      );
    };
  }, [
    refetchNotificacoes,
    refetchPedidos,
  ]);

  /* =======================================================
     MARCAR PEDIDO COMO VISUALIZADO

     Não abre modal.
     Não muda de página.

     O clique somente registra que
     ESTE usuário visualizou o pedido.
  ======================================================= */

  const marcarPedidoComoVisualizado =
    useCallback(
      async (pedido) => {
        const codigoPedido =
          obterCodigoPedidoOmie(
            pedido,
          );

        if (!codigoPedido) {
          return;
        }

        /*
         * Se não houver NOVO ou ALTERADO pendente
         * para este usuário, não chamamos o banco.
         */
        if (
          !notificacoesPorPedido.has(
            codigoPedido,
          )
        ) {
          return;
        }

        try {
          const {
            data,
            error,
          } = await supabase.rpc(
            "marcar_pedido_como_visualizado",
            {
              p_codigo_pedido_omie:
                codigoPedido,
            },
          );

          if (error) {
            throw error;
          }

          if (data !== true) {
            console.warn(
              "O pedido não pôde ser marcado como visualizado.",
            );

            return;
          }

          /*
           * Atualiza os badges da própria
           * tela imediatamente.
           */
          await refetchNotificacoes();

          /*
           * A Navbar escuta este evento
           * para atualizar o contador [1].
           */
          window.dispatchEvent(
            new CustomEvent(
              "pedidos-notificacoes-atualizadas",
            ),
          );
        } catch (error) {
          console.error(
            "Erro ao marcar pedido como visualizado:",
            error,
          );
        }
      },
      [
        notificacoesPorPedido,
        refetchNotificacoes,
      ],
    );

  /* =======================================================
     PEDIDOS
  ======================================================= */

  const pedidos =
    Array.isArray(
      respostaPedidos?.pedidos,
    )
      ? respostaPedidos.pedidos
      : [];

  /* =======================================================
     PRÓXIMA ATUALIZAÇÃO
  ======================================================= */

  const proximaAtualizacao =
    useMemo(
      () =>
        obterProximaAtualizacao(
          agora,
        ),
      [agora],
    );

  /* =======================================================
     VENDEDORES
  ======================================================= */

  const vendedores =
    useMemo(() => {
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
      ].sort((a, b) =>
        a.localeCompare(
          b,
          "pt-BR",
        ),
      );
    }, [pedidos]);

  /* =======================================================
     STATUS DISPONÍVEIS
  ======================================================= */

  const statusDisponiveis =
    useMemo(() => {
      return [
        ...new Set(
          pedidos
            .map(
              (pedido) =>
                pedido.status,
            )
            .filter(Boolean),
        ),
      ].sort((a, b) =>
        String(a).localeCompare(
          String(b),
          "pt-BR",
        ),
      );
    }, [pedidos]);

  /* =======================================================
     CANCELADOS
  ======================================================= */

  const visualizandoCancelados =
    useMemo(
      () =>
        normalizarTexto(
          status,
        ) === "cancelado",
      [status],
    );

  /* =======================================================
     FILTRAR TABELA
  ======================================================= */

  const pedidosFiltrados =
    useMemo(() => {
      const termo =
        normalizarTexto(
          pesquisa,
        );

      return pedidos.filter(
        (pedido) => {
          const correspondePesquisa =
            !termo ||
            normalizarTexto(
              pedido?.pedido,
            ).includes(termo) ||
            normalizarTexto(
              pedido?.cliente,
            ).includes(termo) ||
            normalizarTexto(
              pedido?.produto,
            ).includes(termo) ||
            normalizarTexto(
              pedido?.codigoProduto,
            ).includes(termo);

          const correspondeVendedor =
            vendedor === "todos" ||
            pedido?.vendedor ===
              vendedor;

          const correspondeStatus =
            status === "todos" ||
            normalizarTexto(
              pedido?.status,
            ) ===
              normalizarTexto(
                status,
              );

          return (
            correspondePesquisa &&
            correspondeVendedor &&
            correspondeStatus
          );
        },
      );
    }, [
      pedidos,
      pesquisa,
      vendedor,
      status,
    ]);

  /* =======================================================
     PEDIDOS ÚNICOS DA TABELA

     ORDEM:
     1. NOVO/ALTERADO ainda não visualizados
     2. Mais recente primeiro entre os pendentes
     3. Demais pedidos mantêm a ordem original

     Assim que o usuário clicar no pedido,
     a notificação deixa de estar pendente
     e ele volta automaticamente à ordem normal.
  ======================================================= */

  const pedidosUnicos =
    useMemo(() => {
      const mapa = new Map();

      for (
        const pedido of
        pedidosFiltrados
      ) {
        const chave =
          obterChavePedido(
            pedido,
          );

        if (
          chave &&
          !mapa.has(chave)
        ) {
          mapa.set(
            chave,
            pedido,
          );
        }
      }

      const lista =
        [...mapa.values()];

      const ordemOriginal =
        new Map();

      lista.forEach(
        (pedido, indice) => {
          ordemOriginal.set(
            obterChavePedido(
              pedido,
            ),
            indice,
          );
        },
      );

      return lista.sort(
        (pedidoA, pedidoB) => {
          const codigoA =
            obterCodigoPedidoOmie(
              pedidoA,
            );

          const codigoB =
            obterCodigoPedidoOmie(
              pedidoB,
            );

          const notificacaoA =
            codigoA
              ? notificacoesPorPedido.get(
                  codigoA,
                )
              : null;

          const notificacaoB =
            codigoB
              ? notificacoesPorPedido.get(
                  codigoB,
                )
              : null;

          const pendenteA =
            Boolean(notificacaoA);

          const pendenteB =
            Boolean(notificacaoB);

          /*
           * Pedido pendente sempre fica acima
           * de pedido já visualizado.
           */
          if (
            pendenteA &&
            !pendenteB
          ) {
            return -1;
          }

          if (
            !pendenteA &&
            pendenteB
          ) {
            return 1;
          }

          /*
           * Se os dois estiverem pendentes,
           * a alteração mais recente fica primeiro.
           */
          if (
            pendenteA &&
            pendenteB
          ) {
            const dataA =
              obterTimestampNotificacao(
                notificacaoA,
              );

            const dataB =
              obterTimestampNotificacao(
                notificacaoB,
              );

            if (
              dataA !== dataB
            ) {
              return (
                dataB -
                dataA
              );
            }
          }

          /*
           * Para os demais casos,
           * mantém exatamente a ordem
           * que já existia na tela.
           */
          const indiceA =
            ordemOriginal.get(
              obterChavePedido(
                pedidoA,
              ),
            ) ?? 0;

          const indiceB =
            ordemOriginal.get(
              obterChavePedido(
                pedidoB,
              ),
            ) ?? 0;

          return (
            indiceA -
            indiceB
          );
        },
      );
    }, [
      pedidosFiltrados,
      notificacoesPorPedido,
    ]);

  /* =======================================================
     DADOS OPERACIONAIS

     Cancelados não entram nos indicadores.
  ======================================================= */

  const pedidosOperacionaisFiltrados =
    useMemo(
      () =>
        pedidosFiltrados.filter(
          (pedido) =>
            !pedidoEhCancelado(
              pedido,
            ),
        ),
      [pedidosFiltrados],
    );

  const pedidosOperacionaisUnicos =
    useMemo(() => {
      const mapa = new Map();

      for (
        const pedido of
        pedidosOperacionaisFiltrados
      ) {
        const chave =
          obterChavePedido(
            pedido,
          );

        if (
          chave &&
          !mapa.has(chave)
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
    }, [
      pedidosOperacionaisFiltrados,
    ]);

  /* =======================================================
     TOTAL DE PÁGINAS
  ======================================================= */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        pedidosUnicos.length /
          PEDIDOS_POR_PAGINA,
      ),
    );

  useEffect(() => {
    if (
      paginaAtual >
      totalPaginas
    ) {
      setPaginaAtual(
        totalPaginas,
      );
    }
  }, [
    paginaAtual,
    totalPaginas,
  ]);

  /* =======================================================
     PEDIDOS ÚNICOS DA PÁGINA
  ======================================================= */

  const pedidosUnicosDaPagina =
    useMemo(() => {
      const inicio =
        (paginaAtual - 1) *
        PEDIDOS_POR_PAGINA;

      const fim =
        inicio +
        PEDIDOS_POR_PAGINA;

      return pedidosUnicos.slice(
        inicio,
        fim,
      );
    }, [
      pedidosUnicos,
      paginaAtual,
    ]);

  /* =======================================================
     CHAVES DA PÁGINA
  ======================================================= */

  const chavesPedidosDaPagina =
    useMemo(() => {
      return new Set(
        pedidosUnicosDaPagina.map(
          (pedido) =>
            obterChavePedido(
              pedido,
            ),
        ),
      );
    }, [
      pedidosUnicosDaPagina,
    ]);

  /* =======================================================
     LINHAS DA PÁGINA

     Também respeita a ordem dos pedidos únicos
     calculada acima.
  ======================================================= */

  const pedidosPaginados =
    useMemo(() => {
      const ordemPagina =
        new Map();

      pedidosUnicosDaPagina.forEach(
        (pedido, indice) => {
          ordemPagina.set(
            obterChavePedido(
              pedido,
            ),
            indice,
          );
        },
      );

      return pedidosFiltrados
        .filter((pedido) =>
          chavesPedidosDaPagina.has(
            obterChavePedido(
              pedido,
            ),
          ),
        )
        .sort((a, b) => {
          const ordemA =
            ordemPagina.get(
              obterChavePedido(a),
            ) ?? 0;

          const ordemB =
            ordemPagina.get(
              obterChavePedido(b),
            ) ?? 0;

          return (
            ordemA -
            ordemB
          );
        });
    }, [
      pedidosFiltrados,
      chavesPedidosDaPagina,
      pedidosUnicosDaPagina,
    ]);

  /* =======================================================
     AGRUPAR ITENS
  ======================================================= */

  const pedidosAgrupados =
    useMemo(() => {
      const mapa = new Map();

      for (
        const pedido of
        pedidosPaginados
      ) {
        const chave =
          obterChavePedido(
            pedido,
          );

        if (
          !mapa.has(chave)
        ) {
          mapa.set(chave, {
            chave,
            itens: [],
          });
        }

        mapa
          .get(chave)
          .itens.push(pedido);
      }

      return [
        ...mapa.values(),
      ];
    }, [pedidosPaginados]);

  /* =======================================================
     QUANTIDADE TOTAL OPERACIONAL
  ======================================================= */

  const quantidadeTotal =
    useMemo(() => {
      return pedidosOperacionaisFiltrados.reduce(
        (
          total,
          pedido,
        ) => {
          const quantidade =
            Number(
              pedido?.quantidade,
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
    }, [
      pedidosOperacionaisFiltrados,
    ]);

  /* =======================================================
     PEDIDOS ATRASADOS
  ======================================================= */

  const pedidosAtrasados =
    useMemo(() => {
      return pedidosOperacionaisUnicos.filter(
        (pedido) =>
          pedidoEstaAtrasado(
            pedido,
          ),
      ).length;
    }, [
      pedidosOperacionaisUnicos,
    ]);

  /* =======================================================
     PRÓXIMOS 7 DIAS
  ======================================================= */

  const entregasProximos7Dias =
    useMemo(() => {
      const hoje =
        obterHoje();

      const limite =
        new Date(hoje);

      limite.setDate(
        limite.getDate() + 7,
      );

      return pedidosOperacionaisUnicos.filter(
        (pedido) => {
          if (
            normalizarTexto(
              pedido?.status,
            ) !== "pedido"
          ) {
            return false;
          }

          const previsao =
            converterData(
              pedido?.previsao,
            );

          if (!previsao) {
            return false;
          }

          previsao.setHours(
            0,
            0,
            0,
            0,
          );

          return (
            previsao >= hoje &&
            previsao <= limite
          );
        },
      ).length;
    }, [
      pedidosOperacionaisUnicos,
    ]);

  /* =======================================================
     ALTERAR FILTROS
  ======================================================= */

  function alterarPesquisa(valor) {
    setPesquisa(valor);

    setPaginaAtual(1);
  }

  function alterarVendedor(valor) {
    setVendedor(valor);

    setPaginaAtual(1);
  }

  function alterarStatus(valor) {
    setStatus(valor);

    setPaginaAtual(1);
  }

  /* =======================================================
     LIMPAR FILTROS
  ======================================================= */

  function limparFiltros() {
    setPesquisa("");

    setVendedor("todos");

    setStatus("Pedido");

    setPaginaAtual(1);
  }

  const possuiFiltro =
    Boolean(pesquisa) ||
    vendedor !== "todos" ||
    status !== "Pedido";

  /* =======================================================
     TÍTULO DA LISTA
  ======================================================= */

  const tituloLista =
    useMemo(() => {
      if (
        visualizandoCancelados
      ) {
        return "Pedidos cancelados";
      }

      if (
        status === "todos"
      ) {
        return "Todos os pedidos";
      }

      if (
        status &&
        status !== "Pedido"
      ) {
        return `Pedidos - ${status}`;
      }

      return "Pedidos em aberto";
    }, [
      status,
      visualizandoCancelados,
    ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="pedidos-page">
      <div className="pedidos-container">
        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <section className="pedidos-header">
          <div>
            <h1>
              Pedidos
            </h1>

            <p>
              Acompanhamento dos pedidos de venda e consulta dos pedidos cancelados.
            </p>
          </div>

          <div className="pedidos-header-actions">
            <div
              className="pedidos-atualizacao"
              title={
                respostaPedidos?.atualizadoEm
                  ? `Última sincronização: ${formatarDataHora(
                      respostaPedidos.atualizadoEm,
                    )} | Próxima execução automática: ${formatarDataHora(
                      proximaAtualizacao,
                    )}`
                  : `Aguardando primeira sincronização. Próxima execução automática: ${formatarDataHora(
                      proximaAtualizacao,
                    )}`
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
                      respostaPedidos?.atualizadoEm,
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

        {!visualizandoCancelados && (
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
                    : pedidosOperacionaisUnicos.length}
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
        )}

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
              value={pesquisa}
              onChange={(
                evento,
              ) =>
                alterarPesquisa(
                  evento.target.value,
                )
              }
              placeholder="Buscar pedido, cliente, código ou produto..."
            />
          </div>

          <select
            value={vendedor}
            onChange={(
              evento,
            ) =>
              alterarVendedor(
                evento.target.value,
              )
            }
          >
            <option value="todos">
              Todos os vendedores
            </option>

            {vendedores.map(
              (nome) => (
                <option
                  key={nome}
                  value={nome}
                >
                  {nome}
                </option>
              ),
            )}
          </select>

          <select
            value={status}
            onChange={(
              evento,
            ) =>
              alterarStatus(
                evento.target.value,
              )
            }
          >
            <option value="Pedido">
              Pedido
            </option>

            <option value="todos">
              Todos os status
            </option>

            <option value="Cancelado">
              Cancelados
            </option>

            {statusDisponiveis
              .filter(
                (
                  nomeStatus,
                ) => {
                  const statusNormalizado =
                    normalizarTexto(
                      nomeStatus,
                    );

                  return (
                    statusNormalizado !==
                      "pedido" &&
                    statusNormalizado !==
                      "cancelado"
                  );
                },
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
                    {
                      nomeStatus
                    }
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
              <X size={16} />

              Limpar
            </button>
          )}
        </section>

        {/* =================================================
            AVISO DE CANCELADOS
        ================================================= */}

        {visualizandoCancelados && (
          <div className="pedidos-consulta-cancelados">
            <AlertTriangle
              size={19}
            />

            <div>
              <strong>
                Consulta de pedidos cancelados
              </strong>

              <span>
                Estes pedidos são exibidos somente para consulta e não participam dos indicadores operacionais.
              </span>
            </div>
          </div>
        )}

        {/* =================================================
            CONTEÚDO
        ================================================= */}

        <section
          className={`pedidos-content${
            visualizandoCancelados
              ? " pedidos-content-cancelados"
              : ""
          }`}
        >
          <div className="pedidos-content-header">
            <div>
              <h2>
                {tituloLista}
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

            <span
              className={
                visualizandoCancelados
                  ? "pedidos-demo pedidos-demo-cancelado"
                  : "pedidos-demo"
              }
            >
              {visualizandoCancelados
                ? "Somente consulta"
                : "Dados do Omie"}
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
                        (grupo) => {
                          const quantidadeItens =
                            grupo
                              .itens
                              .length;

                          const primeiroPedidoGrupo =
                            grupo
                              .itens[0];

                          const codigoPedidoOmie =
                            obterCodigoPedidoOmie(
                              primeiroPedidoGrupo,
                            );

                          const notificacaoPedido =
                            codigoPedidoOmie
                              ? notificacoesPorPedido.get(
                                  codigoPedidoOmie,
                                )
                              : null;

                          const pedidoPendente =
                            Boolean(
                              notificacaoPedido,
                            );

                          const tipoNotificacao =
                            normalizarTexto(
                              notificacaoPedido?.tipo,
                            );

                          const pedidoNovo =
                            pedidoPendente &&
                            tipoNotificacao !==
                              "alterado";

                          const pedidoAlterado =
                            pedidoPendente &&
                            tipoNotificacao ===
                              "alterado";

                          return grupo.itens.map(
                            (
                              pedido,
                              indiceItem,
                            ) => {
                              const primeiroItem =
                                indiceItem ===
                                0;

                              const cancelado =
                                pedidoEhCancelado(
                                  pedido,
                                );

                              const diasAtraso =
                                calcularDiasAtraso(
                                  pedido.previsao,
                                );

                              const atrasado =
                                !cancelado &&
                                pedidoEstaAtrasado(
                                  pedido,
                                );

                              const classesLinha =
                                [
                                  primeiroItem
                                    ? "pedidos-inicio-grupo"
                                    : "pedidos-item-continuacao",

                                  atrasado
                                    ? "pedido-linha-atrasada"
                                    : "",

                                  cancelado
                                    ? "pedido-linha-cancelada"
                                    : "",

                                  pedidoNovo
                                    ? "pedido-linha-nova"
                                    : "",

                                  pedidoAlterado
                                    ? "pedido-linha-alterada"
                                    : "",
                                ]
                                  .filter(
                                    Boolean,
                                  )
                                  .join(
                                    " ",
                                  );

                              return (
                                <tr
                                  key={
                                    pedido.id
                                  }
                                  className={
                                    classesLinha
                                  }
                                  onClick={
                                    pedidoPendente
                                      ? () =>
                                          marcarPedidoComoVisualizado(
                                            pedido,
                                          )
                                      : undefined
                                  }
                                  title={
                                    pedidoNovo
                                      ? "Novo pedido. Clique para marcar como visualizado."
                                      : pedidoAlterado
                                        ? "Pedido alterado. Clique para marcar como visualizado."
                                        : undefined
                                  }
                                >
                                  {/* PEDIDO */}

                                  {primeiroItem && (
                                    <td
                                      rowSpan={
                                        quantidadeItens
                                      }
                                      className={`pedidos-celula-agrupada pedidos-celula-pedido${
                                        atrasado
                                          ? " pedido-celula-atrasada"
                                          : ""
                                      }${
                                        cancelado
                                          ? " pedido-celula-cancelada"
                                          : ""
                                      }${
                                        pedidoNovo
                                          ? " pedido-celula-nova"
                                          : ""
                                      }${
                                        pedidoAlterado
                                          ? " pedido-celula-alterada"
                                          : ""
                                      }`}
                                    >
                                      <div className="pedidos-pedido-agrupado">
                                        <strong className="pedidos-numero">
                                          {
                                            pedido.pedido
                                          }
                                        </strong>

                                        {pedidoNovo && (
                                          <span className="pedido-novo-badge">
                                            NOVO
                                          </span>
                                        )}

                                        {pedidoAlterado && (
                                          <span className="pedido-alterado-badge">
                                            ALTERADO
                                          </span>
                                        )}

                                        {quantidadeItens >
                                          1 && (
                                          <span className="pedidos-itens-badge">
                                            {
                                              quantidadeItens
                                            }{" "}
                                            itens
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
                                      className={`pedidos-celula-agrupada${
                                        atrasado
                                          ? " pedido-celula-atrasada"
                                          : ""
                                      }${
                                        cancelado
                                          ? " pedido-celula-cancelada"
                                          : ""
                                      }`}
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
                                      className={`pedidos-celula-agrupada${
                                        atrasado
                                          ? " pedido-celula-atrasada"
                                          : ""
                                      }${
                                        cancelado
                                          ? " pedido-celula-cancelada"
                                          : ""
                                      }`}
                                    >
                                      {formatarData(
                                        pedido.data,
                                      )}
                                    </td>
                                  )}

                                  {/* PREVISÃO */}

                                  {primeiroItem && (
                                    <td
                                      rowSpan={
                                        quantidadeItens
                                      }
                                      className={`pedidos-celula-agrupada pedidos-col-previsao${
                                        atrasado
                                          ? " pedido-celula-atrasada"
                                          : ""
                                      }${
                                        cancelado
                                          ? " pedido-celula-cancelada"
                                          : ""
                                      }`}
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
                                              size={
                                                11
                                              }
                                            />

                                            {formatarTextoAtraso(
                                              diasAtraso,
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  )}

                                  {/* CÓDIGO */}

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
                                      className={`pedidos-celula-agrupada${
                                        atrasado
                                          ? " pedido-celula-atrasada"
                                          : ""
                                      }${
                                        cancelado
                                          ? " pedido-celula-cancelada"
                                          : ""
                                      }`}
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
                                      className={`pedidos-celula-agrupada${
                                        cancelado
                                          ? " pedido-celula-cancelada"
                                          : ""
                                      }`}
                                    >
                                      <span
                                        className={`pedidos-status ${obterClasseStatus(
                                          pedido.status,
                                        )}`}
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
                  {visualizandoCancelados
                    ? "Nenhum pedido cancelado encontrado"
                    : "Nenhum pedido encontrado"}
                </h3>

                <p>
                  {visualizandoCancelados
                    ? "Os pedidos cancelados passarão a aparecer nesta consulta à medida que forem cancelados no Omie daqui para a frente."
                    : possuiFiltro
                      ? "Não existem pedidos que correspondam aos filtros selecionados."
                      : respostaPedidos?.atualizadoEm
                        ? "Nenhum pedido com status Pedido foi encontrado."
                        : "Ainda não existem pedidos sincronizados. Aguardando a primeira sincronização automática."}
                </p>

                {possuiFiltro &&
                  !visualizandoCancelados && (
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
            RODAPÉ
        ================================================= */}

        <div className="pedidos-rodape-info">
          <Clock3 size={14} />

          Os pedidos são sincronizados automaticamente com o Omie.
        </div>
      </div>
    </main>
  );
}