import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  ClipboardList,
  DollarSign,
  ListChecks,
  PackageCheck,
  PackageSearch,
  ShoppingBag,
  WalletCards,
} from "lucide-react";

import { TIPOS_DOCUMENTO } from "../constants/pedidosCompra.constants";

import { formatarMoeda } from "../utils/pedidosCompra.utils";

import "./PedidosCompraResumo.css";

function CardResumo({
  id,
  titulo,
  valor,
  icon: Icon,
  variante,
  carregando,
  ativo,
  clicavel = false,
  compacto = false,
  onClick,
}) {
  const classes = [
    "compras-resumo-card",

    variante ? `compras-resumo-card--${variante}` : "",

    ativo ? "compras-resumo-card--ativo" : "",

    clicavel ? "compras-resumo-card--clicavel" : "",

    compacto ? "compras-resumo-card--compacto" : "",
  ]
    .filter(Boolean)
    .join(" ");

  function abrirCard() {
    if (!clicavel || typeof onClick !== "function") {
      return;
    }

    onClick(id);
  }

  function aoPressionarTecla(event) {
    if (!clicavel) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      abrirCard();
    }
  }

  return (
    <article
      className={classes}
      onClick={abrirCard}
      onKeyDown={aoPressionarTecla}
      role={clicavel ? "button" : undefined}
      tabIndex={clicavel ? 0 : undefined}
    >
      <div
        className={`compras-resumo-card-icone${
          variante ? ` compras-resumo-card-icone--${variante}` : ""
        }`}
      >
        <Icon size={compacto ? 18 : 21} />
      </div>

      <div className="compras-resumo-card-conteudo">
        <span className="compras-resumo-card-titulo">{titulo}</span>

        <strong className="compras-resumo-card-valor">{carregando ? "-" : valor}</strong>
      </div>
    </article>
  );
}

export default function PedidosCompraResumo({
  carregando,
  indicadores,
  indicadoresRequisicoes,
  indicadoresRecebimentoFisico,
  tipoDocumento,
  cardAtivo,
  onClicarCard,
}) {
  const mostrarPedidos = tipoDocumento !== TIPOS_DOCUMENTO.REQUISICAO;

  const mostrarRequisicoes = tipoDocumento !== TIPOS_DOCUMENTO.PEDIDO;

  const exibindoAmbos = tipoDocumento === TIPOS_DOCUMENTO.TODOS;

  return (
    <section className={`compras-resumo${exibindoAmbos ? " compras-resumo--completo" : ""}`}>
      {mostrarPedidos && (
        <>
          <CardResumo
            id="abertos"
            titulo="Pedidos em aberto"
            valor={indicadores.abertos}
            icon={ShoppingBag}
            carregando={carregando}
            ativo={cardAtivo === "abertos"}
            clicavel
            compacto={exibindoAmbos}
            onClick={onClicarCard}
          />

          <CardResumo
            id="atrasados"
            titulo="Pedidos atrasados"
            valor={indicadores.atrasados}
            icon={AlertTriangle}
            variante="danger"
            carregando={carregando}
            ativo={cardAtivo === "atrasados"}
            clicavel
            compacto={exibindoAmbos}
            onClick={onClicarCard}
          />

          <CardResumo
            id="valor-aberto"
            titulo="Valor total em aberto"
            valor={formatarMoeda(indicadores.valorEmAberto)}
            icon={DollarSign}
            variante="success"
            carregando={carregando}
            ativo={cardAtivo === "valor-aberto"}
            clicavel
            compacto={exibindoAmbos}
            onClick={onClicarCard}
          />

          <CardResumo
            id="proximos-7-dias"
            titulo="Recebimentos próximos 7 dias"
            valor={indicadores.proximos7Dias}
            icon={CalendarClock}
            variante="purple"
            carregando={carregando}
            ativo={cardAtivo === "proximos-7-dias"}
            clicavel
            compacto={exibindoAmbos}
            onClick={onClicarCard}
          />

          <CardResumo
            id="hoje"
            titulo="Recebimentos do dia"
            valor={indicadores.hoje}
            icon={CalendarCheck2}
            variante="cyan"
            carregando={carregando}
            ativo={cardAtivo === "hoje"}
            clicavel
            compacto={exibindoAmbos}
            onClick={onClicarCard}
          />
        </>
      )}

      {mostrarRequisicoes && (
        <>
          <CardResumo
            id="requisicoes-total"
            titulo="Requisições abertas"
            valor={indicadoresRequisicoes.total}
            icon={ClipboardList}
            variante="requisicao"
            carregando={carregando}
            ativo={cardAtivo === "requisicoes-total"}
            clicavel
            compacto={exibindoAmbos}
            onClick={onClicarCard}
          />

          <CardResumo
            id="requisicoes-valor"
            titulo="Valor requisitado"
            valor={formatarMoeda(indicadoresRequisicoes.valorTotal)}
            icon={WalletCards}
            variante="requisicao-valor"
            carregando={carregando}
            ativo={cardAtivo === "requisicoes-valor"}
            clicavel
            compacto={exibindoAmbos}
            onClick={onClicarCard}
          />

          <CardResumo
            id="requisicoes-itens"
            titulo="Itens requisitados"
            valor={indicadoresRequisicoes.itens}
            icon={PackageSearch}
            variante="requisicao-itens"
            carregando={carregando}
            ativo={cardAtivo === "requisicoes-itens"}
            clicavel
            compacto={exibindoAmbos}
            onClick={onClicarCard}
          />

          <CardResumo
            id="requisicoes-proximos-7-dias"
            titulo="Requisições próximos 7 dias"
            valor={indicadoresRequisicoes.proximos7Dias}
            icon={ListChecks}
            variante="requisicao-futuro"
            carregando={carregando}
            ativo={cardAtivo === "requisicoes-proximos-7-dias"}
            clicavel
            compacto={exibindoAmbos}
            onClick={onClicarCard}
          />

          <CardResumo
            id="recebimentos-fisicos-7-dias"
            titulo="Recebimentos físicos 7 dias"
            valor={indicadoresRecebimentoFisico?.pedidos ?? 0}
            icon={PackageCheck}
            variante="requisicao-hoje"
            carregando={carregando}
            ativo={cardAtivo === "recebimentos-fisicos-7-dias"}
            clicavel
            compacto={exibindoAmbos}
            onClick={onClicarCard}
          />
        </>
      )}
    </section>
  );
}
