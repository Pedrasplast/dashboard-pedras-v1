import { useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { TIPOS_DOCUMENTO } from "../constants/pedidosCompra.constants";

import PedidosCompraRecebimentoFisicoModal from "./PedidosCompraRecebimentoFisicoModal";
import CardsPedidosMobile from "./tabela/CardsPedidosMobile";
import CardsRequisicoesMobile from "./tabela/CardsRequisicoesMobile";
import TabelaPedidos from "./tabela/TabelaPedidos";
import TabelaRequisicoes from "./tabela/TabelaRequisicoes";
import {
  QUERY_KEY_RECEBIMENTO_FISICO,
  useResumosRecebimentoFisico,
} from "../hooks/useResumosRecebimentoFisico";

import "./PedidosCompraTabela.css";
import "./PedidosCompraRecebimentoFisico.css";
import { obterCodigoPedidoCompra } from "@/features/compras/pedido-compra/utils/pedidosCompra.utils";
import { calcularResumoRecebimentoFisicoVisual } from "@/features/compras/pedido-compra/utils/pedidosCompraTabela.utils";

export default function PedidosCompraTabela({ pedidos, tipoDocumento }) {
  const [documentosExpandidos, setDocumentosExpandidos] = useState(() => new Set());

  const [documentoEmFoco, setDocumentoEmFoco] = useState(null);

  const queryClient = useQueryClient();

  const [pedidoRecebimentoFisico, setPedidoRecebimentoFisico] = useState(null);

  const codigosPedidosVisiveis = useMemo(
    () => [
      ...new Set(
        (pedidos || [])
          .filter((pedido) => pedido?.tipo_documento !== TIPOS_DOCUMENTO.REQUISICAO)
          .map(obterCodigoPedidoCompra)
          .filter(Boolean),
      ),
    ],
    [pedidos],
  );

  /*
   * A tabela consulta apenas os resumos físicos dos pedidos que
   * estão visíveis na página atual. O resultado fica no cache do
   * React Query e é reaproveitado ao navegar entre telas.
   */
  const { resumos: resumosFisicos } = useResumosRecebimentoFisico(codigosPedidosVisiveis, {
    enabled: codigosPedidosVisiveis.length > 0,
  });

  const somenteRequisicoes = tipoDocumento === TIPOS_DOCUMENTO.REQUISICAO;

  const somentePedidos = tipoDocumento === TIPOS_DOCUMENTO.PEDIDO;

  /*
   * Resumo do botão "Recebido físico" de cada documento com código de
   * pedido no Omie, calculado uma vez e usado pela tabela e pelos cards.
   * Documento sem código não entra no mapa e mostra "-".
   */
  const resumosVisuais = useMemo(() => {
    const mapa = new Map();

    if (somenteRequisicoes) {
      return mapa;
    }

    for (const pedido of pedidos) {
      const codigoPedidoCompra = obterCodigoPedidoCompra(pedido);

      if (codigoPedidoCompra) {
        mapa.set(
          pedido,
          calcularResumoRecebimentoFisicoVisual(
            pedido,
            resumosFisicos?.[String(codigoPedidoCompra)] || null,
          ),
        );
      }
    }

    return mapa;
  }, [pedidos, resumosFisicos, somenteRequisicoes]);

  function alternarItens(documentoId) {
    setDocumentosExpandidos((atual) => {
      const proximo = new Set(atual);

      if (proximo.has(documentoId)) {
        proximo.delete(documentoId);
      } else {
        proximo.add(documentoId);
      }

      return proximo;
    });
  }

  function entrarDocumento(documentoId) {
    setDocumentoEmFoco(documentoId);
  }

  function sairDocumento(evento, documentoId) {
    /*
     * IMPORTANTE:
     *
     * Um pedido expandido possui vários <tr>.
     * Ao mover o mouse de um item para outro
     * do MESMO pedido, não podemos limpar
     * documentoEmFoco.
     *
     * Somente limpamos quando o elemento
     * seguinte não pertence ao mesmo
     * documento.
     */
    const proximoElemento = evento.relatedTarget;

    const proximaLinha =
      proximoElemento && typeof proximoElemento.closest === "function"
        ? proximoElemento.closest("tr[data-documento-id]")
        : null;

    const proximoDocumentoId = proximaLinha?.dataset?.documentoId;

    if (proximoDocumentoId === documentoId) {
      return;
    }

    setDocumentoEmFoco(null);
  }

  const propsLinhas = {
    pedidos,
    documentosExpandidos,
    onAlternarItens: alternarItens,
  };

  const propsDestaque = {
    documentoEmFoco,
    onEntrarDocumento: entrarDocumento,
    onSairDocumento: sairDocumento,
  };

  if (somenteRequisicoes) {
    return (
      <>
        <div className="compras-tabela-desktop">
          <TabelaRequisicoes {...propsLinhas} {...propsDestaque} />
        </div>

        <CardsRequisicoesMobile {...propsLinhas} />
      </>
    );
  }

  return (
    <>
      <div className="compras-tabela-desktop">
        <TabelaPedidos
          {...propsLinhas}
          {...propsDestaque}
          mostrarRequisicao={!somentePedidos}
          resumosVisuais={resumosVisuais}
          onAbrirRecebimentoFisico={setPedidoRecebimentoFisico}
        />
      </div>

      <CardsPedidosMobile
        {...propsLinhas}
        resumosVisuais={resumosVisuais}
        onAbrirRecebimentoFisico={setPedidoRecebimentoFisico}
      />

      <PedidosCompraRecebimentoFisicoModal
        pedido={pedidoRecebimentoFisico}
        aberto={Boolean(pedidoRecebimentoFisico)}
        onFechar={() => setPedidoRecebimentoFisico(null)}
        onAlterado={() => {
          /*
           * Invalida qualquer resumo físico ativo, inclusive o
           * usado pelo filtro da página. Assim a atualização feita
           * no modal aparece sem recarregar a tela inteira.
           */
          queryClient.invalidateQueries({
            queryKey: QUERY_KEY_RECEBIMENTO_FISICO,
          });
        }}
      />
    </>
  );
}
