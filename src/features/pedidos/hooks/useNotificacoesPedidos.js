import { useCallback, useEffect, useRef, useState } from "react";

import {
  assinarNotificacoesPedidos,
  contarNotificacoesPedidosNaoLidas,
} from "../services/pedidos.service";

/* =========================================================
   NOTIFICAÇÕES DE PEDIDOS (NAVBAR)

   Responsabilidade:
   - manter o contador de pedidos não lidos;
   - mostrar o alerta de pedido novo/alterado por 10 s.

   O contador é atualizado:
   - na hora, pelo tempo real (canal em pedidos_notificacoes);
   - pelo evento interno "pedidos-notificacoes-atualizadas";
   - ao voltar para a aba;
   - a cada 5 min, como rede de segurança.
========================================================= */

const DURACAO_ALERTA_MS = 10000;

const INTERVALO_VERIFICACAO_MS = 5 * 60_000;

export function obterTipoNotificacao(notificacao) {
  const tipo = String(notificacao?.tipo_ultima_ocorrencia ?? notificacao?.tipo ?? "novo")
    .trim()
    .toLowerCase();

  return tipo === "alterado" ? "alterado" : "novo";
}

export function montarAlertaPedido(notificacao) {
  const tipo = obterTipoNotificacao(notificacao);

  return {
    id: notificacao.id,
    codigoPedidoOmie: notificacao.codigo_pedido_omie,
    numeroPedido: notificacao.numero_pedido,
    cliente: notificacao.cliente,
    vendedor: notificacao.vendedor,
    tipo,
    resumo:
      notificacao.resumo || (tipo === "alterado" ? "Pedido alterado" : "Novo pedido recebido"),
    camposAlterados: Array.isArray(notificacao.campos_alterados)
      ? notificacao.campos_alterados
      : [],
  };
}

export function useNotificacoesPedidos({ user, podeAcessarPedidos }) {
  const alertaTimeoutRef = useRef(null);

  const [pedidosNaoLidos, setPedidosNaoLidos] = useState(0);

  const [ultimaNotificacaoPedido, setUltimaNotificacaoPedido] = useState(null);

  const [mostrarAlertaPedido, setMostrarAlertaPedido] = useState(false);

  const ativo = Boolean(user && podeAcessarPedidos);

  const atualizarQuantidadePedidosNovos = useCallback(async () => {
    if (!ativo) {
      setPedidosNaoLidos(0);
      return;
    }

    try {
      setPedidosNaoLidos(await contarNotificacoesPedidosNaoLidas());
    } catch (error) {
      console.error("Erro ao consultar notificações de pedidos:", error);
    }
  }, [ativo]);

  /* Primeira consulta */

  useEffect(() => {
    if (!ativo) {
      setPedidosNaoLidos(0);
      return;
    }

    void atualizarQuantidadePedidosNovos();
  }, [ativo, atualizarQuantidadePedidosNovos]);

  /* Realtime */

  const userId = user?.id;

  useEffect(() => {
    if (!ativo) {
      return undefined;
    }

    const cancelarAssinatura = assinarNotificacoesPedidos({
      nomeCanal: `navbar-pedidos-${userId}`,

      onChange: (payload) => {
        const notificacao = payload?.new;

        void atualizarQuantidadePedidosNovos();

        if (!notificacao || notificacao.notificar !== true) {
          return;
        }

        setUltimaNotificacaoPedido(montarAlertaPedido(notificacao));

        setMostrarAlertaPedido(true);

        if (alertaTimeoutRef.current) {
          window.clearTimeout(alertaTimeoutRef.current);
        }

        alertaTimeoutRef.current = window.setTimeout(() => {
          setMostrarAlertaPedido(false);
        }, DURACAO_ALERTA_MS);
      },
    });

    return () => {
      if (alertaTimeoutRef.current) {
        window.clearTimeout(alertaTimeoutRef.current);

        alertaTimeoutRef.current = null;
      }

      cancelarAssinatura();
    };
  }, [ativo, userId, atualizarQuantidadePedidosNovos]);

  /* Eventos internos, verificação periódica e volta para a aba */

  useEffect(() => {
    if (!ativo) {
      return undefined;
    }

    const atualizarContador = () => {
      void atualizarQuantidadePedidosNovos();
    };

    const verificarAoVoltar = () => {
      if (document.visibilityState === "visible") {
        atualizarContador();
      }
    };

    window.addEventListener("pedidos-notificacoes-atualizadas", atualizarContador);

    document.addEventListener("visibilitychange", verificarAoVoltar);

    const intervalo = window.setInterval(atualizarContador, INTERVALO_VERIFICACAO_MS);

    return () => {
      window.removeEventListener("pedidos-notificacoes-atualizadas", atualizarContador);

      document.removeEventListener("visibilitychange", verificarAoVoltar);

      window.clearInterval(intervalo);
    };
  }, [ativo, atualizarQuantidadePedidosNovos]);

  /* Alerta */

  const ocultarAlertaPedido = useCallback(() => {
    setMostrarAlertaPedido(false);
  }, []);

  const fecharAlertaPedido = useCallback((event) => {
    event?.stopPropagation?.();

    setMostrarAlertaPedido(false);

    if (alertaTimeoutRef.current) {
      window.clearTimeout(alertaTimeoutRef.current);

      alertaTimeoutRef.current = null;
    }
  }, []);

  return {
    pedidosNaoLidos,
    ultimaNotificacaoPedido,
    mostrarAlertaPedido,
    ocultarAlertaPedido,
    fecharAlertaPedido,
  };
}
