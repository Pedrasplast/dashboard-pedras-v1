import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  ClipboardList,
  DollarSign,
  ListChecks,
  PackageSearch,
  ShoppingBag,
  WalletCards,
} from "lucide-react";

import {
  TIPOS_DOCUMENTO,
} from "../constants/pedidosCompra.constants";

import {
  formatarMoeda,
} from "../utils/pedidosCompra.utils";

import "./PedidosCompraResumo.css";

function CardResumo({
  id,
  titulo,
  valor,
  icon: Icon,
  variante,
  loading,
  ativo,
  clicavel = false,
  compacto = false,
  onClick,
}) {
  const classes = [
    "compras-resumo-card",

    variante
      ? `compras-resumo-card--${variante}`
      : "",

    ativo
      ? "compras-resumo-card--ativo"
      : "",

    clicavel
      ? "compras-resumo-card--clicavel"
      : "",

    compacto
      ? "compras-resumo-card--compacto"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  function abrirCard() {
    if (
      !clicavel ||
      typeof onClick !==
        "function"
    ) {
      return;
    }

    onClick(id);
  }

  function aoPressionarTecla(
    event,
  ) {
    if (
      !clicavel
    ) {
      return;
    }

    if (
      event.key ===
        "Enter" ||
      event.key ===
        " "
    ) {
      event.preventDefault();

      abrirCard();
    }
  }

  return (
    <article
      className={
        classes
      }
      onClick={
        abrirCard
      }
      onKeyDown={
        aoPressionarTecla
      }
      role={
        clicavel
          ? "button"
          : undefined
      }
      tabIndex={
        clicavel
          ? 0
          : undefined
      }
    >
      <div
        className={`compras-resumo-card-icone${
          variante
            ? ` compras-resumo-card-icone--${variante}`
            : ""
        }`}
      >
        <Icon
          size={
            compacto
              ? 18
              : 21
          }
        />
      </div>

      <div className="compras-resumo-card-conteudo">
        <span className="compras-resumo-card-titulo">
          {titulo}
        </span>

        <strong className="compras-resumo-card-valor">
          {loading
            ? "-"
            : valor}
        </strong>
      </div>
    </article>
  );
}

export default function PedidosCompraResumo({
  loading,
  indicadores,
  indicadoresRequisicoes,
  tipoDocumento,
  cardAtivo,
  onCardClick,
}) {
  const mostrarPedidos =
    tipoDocumento !==
    TIPOS_DOCUMENTO.REQUISICAO;

  const mostrarRequisicoes =
    tipoDocumento !==
    TIPOS_DOCUMENTO.PEDIDO;

  const exibindoAmbos =
    tipoDocumento ===
    TIPOS_DOCUMENTO.TODOS;

  return (
    <section
      className={`compras-resumo${
        exibindoAmbos
          ? " compras-resumo--completo"
          : ""
      }`}
    >
      {mostrarPedidos && (
        <>
          <CardResumo
            id="abertos"
            titulo="Pedidos em aberto"
            valor={
              indicadores
                .abertos
            }
            icon={
              ShoppingBag
            }
            loading={
              loading
            }
            ativo={
              cardAtivo ===
              "abertos"
            }
            clicavel
            compacto={
              exibindoAmbos
            }
            onClick={
              onCardClick
            }
          />

          <CardResumo
            id="atrasados"
            titulo="Pedidos atrasados"
            valor={
              indicadores
                .atrasados
            }
            icon={
              AlertTriangle
            }
            variante="danger"
            loading={
              loading
            }
            ativo={
              cardAtivo ===
              "atrasados"
            }
            clicavel
            compacto={
              exibindoAmbos
            }
            onClick={
              onCardClick
            }
          />

          <CardResumo
            id="valor-aberto"
            titulo="Valor total em aberto"
            valor={
              formatarMoeda(
                indicadores
                  .valorEmAberto,
              )
            }
            icon={
              DollarSign
            }
            variante="success"
            loading={
              loading
            }
            ativo={
              cardAtivo ===
              "valor-aberto"
            }
            clicavel
            compacto={
              exibindoAmbos
            }
            onClick={
              onCardClick
            }
          />

          <CardResumo
            id="proximos-7-dias"
            titulo="Recebimentos próximos 7 dias"
            valor={
              indicadores
                .proximos7Dias
            }
            icon={
              CalendarClock
            }
            variante="purple"
            loading={
              loading
            }
            ativo={
              cardAtivo ===
              "proximos-7-dias"
            }
            clicavel
            compacto={
              exibindoAmbos
            }
            onClick={
              onCardClick
            }
          />

          <CardResumo
            id="hoje"
            titulo="Recebimentos do dia"
            valor={
              indicadores
                .hoje
            }
            icon={
              CalendarCheck2
            }
            variante="cyan"
            loading={
              loading
            }
            ativo={
              cardAtivo ===
              "hoje"
            }
            clicavel
            compacto={
              exibindoAmbos
            }
            onClick={
              onCardClick
            }
          />
        </>
      )}

      {mostrarRequisicoes && (
        <>
          <CardResumo
            id="requisicoes-total"
            titulo="Requisições abertas"
            valor={
              indicadoresRequisicoes
                .total
            }
            icon={
              ClipboardList
            }
            variante="requisicao"
            loading={
              loading
            }
            ativo={
              cardAtivo ===
              "requisicoes-total"
            }
            clicavel
            compacto={
              exibindoAmbos
            }
            onClick={
              onCardClick
            }
          />

          <CardResumo
            id="requisicoes-valor"
            titulo="Valor requisitado"
            valor={
              formatarMoeda(
                indicadoresRequisicoes
                  .valorTotal,
              )
            }
            icon={
              WalletCards
            }
            variante="requisicao-valor"
            loading={
              loading
            }
            ativo={
              cardAtivo ===
              "requisicoes-valor"
            }
            clicavel
            compacto={
              exibindoAmbos
            }
            onClick={
              onCardClick
            }
          />

          <CardResumo
            id="requisicoes-itens"
            titulo="Itens requisitados"
            valor={
              indicadoresRequisicoes
                .itens
            }
            icon={
              PackageSearch
            }
            variante="requisicao-itens"
            loading={
              loading
            }
            ativo={
              cardAtivo ===
              "requisicoes-itens"
            }
            clicavel
            compacto={
              exibindoAmbos
            }
            onClick={
              onCardClick
            }
          />

          <CardResumo
            id="requisicoes-proximos-7-dias"
            titulo="Requisições próximos 7 dias"
            valor={
              indicadoresRequisicoes
                .proximos7Dias
            }
            icon={
              ListChecks
            }
            variante="requisicao-futuro"
            loading={
              loading
            }
            ativo={
              cardAtivo ===
              "requisicoes-proximos-7-dias"
            }
            clicavel
            compacto={
              exibindoAmbos
            }
            onClick={
              onCardClick
            }
          />

          <CardResumo
            id="requisicoes-hoje"
            titulo="Requisições para hoje"
            valor={
              indicadoresRequisicoes
                .hoje
            }
            icon={
              CalendarCheck2
            }
            variante="requisicao-hoje"
            loading={
              loading
            }
            ativo={
              cardAtivo ===
              "requisicoes-hoje"
            }
            clicavel
            compacto={
              exibindoAmbos
            }
            onClick={
              onCardClick
            }
          />
        </>
      )}
    </section>
  );
}