import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  ListChecks,
  PackageCheck,
  PackageSearch,
  ShoppingBag,
  WalletCards,
} from "lucide-react";

import { TIPOS_DOCUMENTO } from "../../constants/pedidosCompra.constants";

/** Título, descrição, ícone e tipo de documento de cada card do resumo. */
export const CONFIGURACOES_CARD_MODAL = Object.freeze({
  abertos: {
    titulo: "Pedidos em aberto",
    descricao: "Pedidos que ainda possuem saldo pendente de recebimento.",
    icone: ShoppingBag,
    tipo: "abertos",
    documento: TIPOS_DOCUMENTO.PEDIDO,
  },

  atrasados: {
    titulo: "Pedidos atrasados",
    descricao: "Pedidos com saldo pendente e previsão de recebimento já vencida.",
    icone: AlertTriangle,
    tipo: "atrasados",
    documento: TIPOS_DOCUMENTO.PEDIDO,
  },

  "valor-aberto": {
    titulo: "Valor total em aberto",
    descricao: "Composição do valor ainda pendente nos pedidos de compra em aberto.",
    icone: CircleDollarSign,
    tipo: "valor",
    documento: TIPOS_DOCUMENTO.PEDIDO,
  },

  "proximos-7-dias": {
    titulo: "Recebimentos próximos 7 dias",
    descricao: "Pedidos em aberto com previsão de recebimento entre hoje e os próximos 7 dias.",
    icone: CalendarClock,
    tipo: "proximos",
    documento: TIPOS_DOCUMENTO.PEDIDO,
  },

  hoje: {
    titulo: "Recebimentos do dia",
    descricao: "Pedidos em aberto cuja previsão de recebimento é hoje.",
    icone: CalendarCheck2,
    tipo: "hoje",
    documento: TIPOS_DOCUMENTO.PEDIDO,
  },

  "requisicoes-total": {
    titulo: "Requisições abertas",
    descricao:
      "Requisições de compra atualmente disponíveis no Omie considerando os filtros aplicados.",
    icone: ClipboardList,
    tipo: "requisicoes",
    documento: TIPOS_DOCUMENTO.REQUISICAO,
  },

  "requisicoes-valor": {
    titulo: "Valor requisitado",
    descricao: "Composição do valor dos itens das requisições de compra selecionadas.",
    icone: WalletCards,
    tipo: "requisicoes-valor",
    documento: TIPOS_DOCUMENTO.REQUISICAO,
  },

  "requisicoes-itens": {
    titulo: "Itens requisitados",
    descricao: "Itens existentes nas requisições de compra selecionadas.",
    icone: PackageSearch,
    tipo: "requisicoes-itens",
    documento: TIPOS_DOCUMENTO.REQUISICAO,
  },

  "requisicoes-proximos-7-dias": {
    titulo: "Requisições próximos 7 dias",
    descricao: "Requisições com sugestão de entrega entre hoje e os próximos 7 dias.",
    icone: ListChecks,
    tipo: "requisicoes-proximos",
    documento: TIPOS_DOCUMENTO.REQUISICAO,
  },

  "recebimentos-fisicos-7-dias": {
    titulo: "Recebimentos físicos - últimos 7 dias",
    descricao:
      "Recebimentos físicos registrados nos últimos 7 dias, considerando hoje e os 6 dias anteriores.",
    icone: PackageCheck,
    tipo: "hoje",
    documento: TIPOS_DOCUMENTO.PEDIDO,
  },
});

/** Linha flexível usada no topo das células com número e botão de itens. */
export const ESTILO_CABECALHO_CELULA = Object.freeze({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 8,
});
