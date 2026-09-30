import {
  useMemo,
  useState,
} from "react";

import {
  Clock3,
  ShoppingCart,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";

import AtualizacaoAutomatica from "./components/AtualizacaoAutomatica";
import PedidosAvisoCancelados from "./components/PedidosAvisoCancelados";
import PedidosConteudo from "./components/PedidosConteudo";
import PedidosFiltros from "./components/PedidosFiltros";
import PedidosResumo from "./components/PedidosResumo";
import PedidosResumoModal from "./components/PedidosResumoModal";

import {
  usePedidosData,
} from "./hooks/usePedidosData";

import {
  usePedidosViewModel,
} from "./hooks/usePedidosViewModel";

import "./PedidosPage.css";


/* =========================================================
   TEXTO
========================================================= */

function normalizarTexto(
  valor,
) {
  return String(
    valor ?? "",
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}


/* =========================================================
   DATA LOCAL
========================================================= */

function converterDataLocal(
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


  return new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate(),
    0,
    0,
    0,
    0,
  );
}


function obterHojeLocal() {
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


/* =========================================================
   PÁGINA
========================================================= */

export default function PedidosPage() {
  const [
    resumoAberto,
    setResumoAberto,
  ] =
    useState(null);


  const {
    respostaPedidos,
    pedidos,
    erroConsulta,
    isLoading,
    isFetching,
    notificacoesPorPedido,
    marcarPedidoComoVisualizado,
  } =
    usePedidosData();


  const vm =
    usePedidosViewModel({
      pedidos,
      notificacoesPorPedido,
    });


  const pedidosOperacionaisUnicos =
    Array.isArray(
      vm.pedidosOperacionaisUnicos,
    )
      ? vm.pedidosOperacionaisUnicos
      : [];


  /* =======================================================
     PEDIDOS ATRASADOS
  ======================================================= */

  const listaPedidosAtrasados =
    useMemo(() => {
      const hoje =
        obterHojeLocal();

      return pedidosOperacionaisUnicos.filter(
        (
          pedido,
        ) => {
          if (
            normalizarTexto(
              pedido?.status,
            ) !==
            "pedido"
          ) {
            return false;
          }


          const previsao =
            converterDataLocal(
              pedido?.previsao,
            );


          if (!previsao) {
            return false;
          }


          return (
            previsao <
            hoje
          );
        },
      );
    }, [
      pedidosOperacionaisUnicos,
    ]);


  /* =======================================================
     FATURAMENTOS PRÓXIMOS 7 DIAS
  ======================================================= */

  const listaProximos7Dias =
    useMemo(() => {
      const hoje =
        obterHojeLocal();

      const limite =
        new Date(
          hoje,
        );

      limite.setDate(
        limite.getDate() +
          7,
      );


      return pedidosOperacionaisUnicos.filter(
        (
          pedido,
        ) => {
          if (
            normalizarTexto(
              pedido?.status,
            ) !==
            "pedido"
          ) {
            return false;
          }


          const previsao =
            converterDataLocal(
              pedido?.previsao,
            );


          if (!previsao) {
            return false;
          }


          return (
            previsao >=
              hoje &&
            previsao <=
              limite
          );
        },
      );
    }, [
      pedidosOperacionaisUnicos,
    ]);


  /* =======================================================
     FATURAMENTO DO DIA
  ======================================================= */

  const listaFaturamentoHoje =
    useMemo(() => {
      const hoje =
        obterHojeLocal();

      const timestampHoje =
        hoje.getTime();


      return pedidosOperacionaisUnicos.filter(
        (
          pedido,
        ) => {
          if (
            normalizarTexto(
              pedido?.status,
            ) !==
            "pedido"
          ) {
            return false;
          }


          const previsao =
            converterDataLocal(
              pedido?.previsao,
            );


          if (!previsao) {
            return false;
          }


          return (
            previsao.getTime() ===
            timestampHoje
          );
        },
      );
    }, [
      pedidosOperacionaisUnicos,
    ]);


  /* =======================================================
     CONFIGURAÇÃO DO MODAL
  ======================================================= */

  const configuracaoModal =
    useMemo(() => {
      switch (
        resumoAberto
      ) {
        case "abertos":
          return {
            titulo:
              "Pedidos em aberto",

            descricao:
              "Pedidos atualmente considerados em aberto pelos filtros da tela.",

            pedidos:
              pedidosOperacionaisUnicos,
          };


        case "atrasados":
          return {
            titulo:
              "Pedidos atrasados",

            descricao:
              "Pedidos com previsão de faturamento anterior à data de hoje.",

            pedidos:
              listaPedidosAtrasados,
          };


        case "quantidade":
          return {
            titulo:
              "Quantidade total",

            descricao:
              "Pedidos que compõem a quantidade total exibida no indicador.",

            pedidos:
              pedidosOperacionaisUnicos,
          };


        case "proximos":
          return {
            titulo:
              "Faturamentos próximos 7 dias",

            descricao:
              "Pedidos previstos para faturamento entre hoje e os próximos 7 dias.",

            pedidos:
              listaProximos7Dias,
          };


        case "hoje":
          return {
            titulo:
              "Faturamento do dia",

            descricao:
              "Pedidos com previsão de faturamento para hoje.",

            pedidos:
              listaFaturamentoHoje,
          };


        default:
          return null;
      }
    }, [
      resumoAberto,
      pedidosOperacionaisUnicos,
      listaPedidosAtrasados,
      listaProximos7Dias,
      listaFaturamentoHoje,
    ]);


  return (
    <main className="pedidos-page">

      <div className="pedidos-container">

        <PageHeader
          eyebrow="Comercial"
          title="Pedidos"
          description="Acompanhamento dos pedidos de venda e consulta dos pedidos cancelados."
          icon={ShoppingCart}
          className="pedidos-header"
          actions={
            <AtualizacaoAutomatica
              atualizadoEm={
                respostaPedidos
                  ?.atualizadoEm
              }
            />
          }
        />


        {!vm.visualizandoCancelados && (
          <PedidosResumo
            isLoading={
              isLoading
            }
            quantidadePedidos={
              pedidosOperacionaisUnicos
                .length
            }
            pedidosAtrasados={
              vm.pedidosAtrasados
            }
            quantidadeTotal={
              vm.quantidadeTotal
            }
            entregasProximos7Dias={
              vm.entregasProximos7Dias
            }
            faturamentosHoje={
              listaFaturamentoHoje
                .length
            }
            onCardClick={
              setResumoAberto
            }
          />
        )}


        <PedidosFiltros
          pesquisa={
            vm.pesquisa
          }
          vendedor={
            vm.vendedor
          }
          status={
            vm.status
          }
          vendedores={
            vm.vendedores
          }
          statusDisponiveis={
            vm.statusDisponiveis
          }
          possuiFiltro={
            vm.possuiFiltro
          }
          onPesquisaChange={
            vm.alterarPesquisa
          }
          onVendedorChange={
            vm.alterarVendedor
          }
          onStatusChange={
            vm.alterarStatus
          }
          onLimpar={
            vm.limparFiltros
          }
        />


        {vm.visualizandoCancelados && (
          <PedidosAvisoCancelados />
        )}


        <PedidosConteudo
          tituloLista={
            vm.tituloLista
          }
          pedidosUnicos={
            vm.pedidosUnicos
          }
          pedidosFiltrados={
            vm.pedidosFiltrados
          }
          pedidosAgrupados={
            vm.pedidosAgrupados
          }
          notificacoesPorPedido={
            notificacoesPorPedido
          }
          visualizandoCancelados={
            vm.visualizandoCancelados
          }
          possuiFiltro={
            vm.possuiFiltro
          }
          respostaPedidos={
            respostaPedidos
          }
          erroConsulta={
            erroConsulta
          }
          isLoading={
            isLoading
          }
          isFetching={
            isFetching
          }
          paginaAtual={
            vm.paginaAtual
          }
          onPaginaChange={
            vm.setPaginaAtual
          }
          onLimparFiltros={
            vm.limparFiltros
          }
          onVisualizarPedido={
            marcarPedidoComoVisualizado
          }
        />


        <div className="pedidos-rodape-info">
          <Clock3
            size={14}
          />

          Os pedidos são sincronizados automaticamente com o Omie.
        </div>

      </div>


      <PedidosResumoModal
        aberto={
          Boolean(
            configuracaoModal,
          )
        }
        titulo={
          configuracaoModal
            ?.titulo ??
          ""
        }
        descricao={
          configuracaoModal
            ?.descricao ??
          ""
        }
        pedidos={
          configuracaoModal
            ?.pedidos ??
          []
        }
        todosPedidos={
          pedidos
        }
        onFechar={
          () =>
            setResumoAberto(
              null,
            )
        }
      />

    </main>
  );
}