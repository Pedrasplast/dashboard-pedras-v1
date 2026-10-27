import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";
import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  ClipboardList,
  ListChecks,
  PackageCheck,
  PackageSearch,
  ShoppingBag,
  WalletCards,
  X,
} from "lucide-react";

import { SITUACOES_RECEBIMENTO, TIPOS_DOCUMENTO } from "../constants/pedidosCompra.constants";

import {
  calcularDiasAtraso,
  formatarData,
  formatarMoeda,
  obterRotuloSituacaoRecebimento,
} from "../utils/pedidosCompra.utils";

import "./PedidosCompraCardModal.css";
import {
  obterValorItem,
  formatarNomeUsuario,
} from "@/features/compras/pedido-compra/utils/pedidosCompra.utils";
import { formatarNumeroCasasFixas } from "@/shared/lib/formatar";

const CONFIGURACOES = Object.freeze({
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

function obterValorPrincipal(cardId, indicadores) {
  switch (cardId) {
    case "abertos":
      return String(indicadores?.abertos ?? 0);

    case "atrasados":
      return String(indicadores?.atrasados ?? 0);

    case "valor-aberto":
      return formatarMoeda(indicadores?.valorEmAberto ?? 0);

    case "proximos-7-dias":
      return String(indicadores?.proximos7Dias ?? 0);

    case "hoje":
      return String(indicadores?.hoje ?? 0);

    case "requisicoes-total":
      return String(indicadores?.total ?? 0);

    case "requisicoes-valor":
      return formatarMoeda(indicadores?.valorTotal ?? 0);

    case "requisicoes-itens":
      return String(indicadores?.itens ?? 0);

    case "requisicoes-proximos-7-dias":
      return String(indicadores?.proximos7Dias ?? 0);

    case "recebimentos-fisicos-7-dias":
      return String(indicadores?.pedidos ?? 0);

    default:
      return "0";
  }
}

function obterNomeCategoria(requisicao) {
  return (
    String(requisicao?.categoria_nome ?? "").trim() ||
    String(requisicao?.categoria ?? "").trim() ||
    "-"
  );
}

function obterCodigoProduto(item) {
  return (
    String(item?.codigo_comercial ?? "").trim() || String(item?.codigo_produto ?? "").trim() || "-"
  );
}

function obterDescricaoProduto(item) {
  return String(item?.descricao ?? "").trim() || "Produto não identificado";
}

function obterDocumentoId(documento) {
  return String(
    documento?.documento_id ??
      documento?.cod_ped_compra ??
      documento?.cod_req_compra ??
      documento?.numero_pedido ??
      documento?.numero_requisicao ??
      documento?.numero_documento ??
      "",
  );
}

function BadgeRecebimento({ situacao }) {
  if (!situacao) {
    return <span className="compras-card-modal-sem-status">-</span>;
  }

  const classe = String(situacao).toLowerCase().replaceAll("_", "-");

  return (
    <span className={`compras-card-modal-badge compras-card-modal-badge--${classe}`}>
      {obterRotuloSituacaoRecebimento(situacao)}
    </span>
  );
}

function BotaoItensModal({ totalItens, expandido, onClick }) {
  if (totalItens <= 1) {
    return null;
  }

  const itensOcultos = Math.max(totalItens - 1, 0);

  return (
    <button
      type="button"
      className={`compras-btn-itens${expandido ? " compras-btn-itens--aberto" : ""}`}
      onClick={onClick}
      title={expandido ? "Recolher itens" : "Ver todos os itens"}
      aria-expanded={expandido}
    >
      {expandido ? (
        <>
          Recolher
          <ChevronUp size={12} />
        </>
      ) : (
        <>
          +{itensOcultos} {itensOcultos === 1 ? "item" : "itens"}
          <ChevronDown size={12} />
        </>
      )}
    </button>
  );
}

function TabelaPedidos({ pedidos, documentosExpandidos, onAlternarItens }) {
  return (
    <div className="compras-card-modal-tabela-wrapper">
      <table className="compras-card-modal-tabela compras-card-modal-tabela--pedidos">
        <thead>
          <tr>
            <th>Pedido</th>

            <th>Fornecedor</th>

            <th>Comprador</th>

            <th>Previsão</th>

            <th>Recebimento</th>

            <th className="compras-card-modal-col-valor">Valor pedido</th>

            <th className="compras-card-modal-col-valor">Em aberto</th>
          </tr>
        </thead>

        <tbody>
          {pedidos.flatMap((pedido) => {
            const atrasado = pedido.situacao_recebimento === SITUACOES_RECEBIMENTO.EM_ATRASO;

            const diasAtraso = atrasado ? calcularDiasAtraso(pedido.data_previsao) : 0;

            const documentoId = obterDocumentoId(pedido);

            const todosItens = Array.isArray(pedido?.itens) ? pedido.itens : [];

            const possuiMaisItens = todosItens.length > 1;

            const expandido = documentosExpandidos.has(documentoId);

            const linhaPrincipal = (
              <tr key={`pedido-${documentoId}`}>
                <td>
                  <div className="compras-card-modal-pedido">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <strong>{pedido.numero_pedido || "-"}</strong>

                      {possuiMaisItens && (
                        <BotaoItensModal
                          totalItens={todosItens.length}
                          expandido={expandido}
                          onClick={() => onAlternarItens(documentoId)}
                        />
                      )}
                    </div>

                    {atrasado && diasAtraso > 0 && (
                      <span>
                        <AlertTriangle size={11} />
                        {diasAtraso} {diasAtraso === 1 ? "dia" : "dias"} em atraso
                      </span>
                    )}
                  </div>
                </td>

                <td>
                  <strong className="compras-card-modal-fornecedor">
                    {pedido.fornecedor_nome || "Fornecedor não identificado"}
                  </strong>
                </td>

                <td>{pedido.comprador_nome || "Comprador não identificado"}</td>

                <td>{formatarData(pedido.data_previsao)}</td>

                <td>
                  <BadgeRecebimento situacao={pedido.situacao_recebimento} />
                </td>

                <td className="compras-card-modal-valor">{formatarMoeda(pedido.valorTotal)}</td>

                <td className="compras-card-modal-valor compras-card-modal-valor--aberto">
                  {formatarMoeda(pedido.valorEmAberto)}
                </td>
              </tr>
            );

            if (!expandido || todosItens.length === 0) {
              return [linhaPrincipal];
            }

            const linhaItens = (
              <tr key={`pedido-itens-${documentoId}`}>
                <td
                  colSpan={7}
                  style={{
                    padding: 0,
                  }}
                >
                  <div className="compras-card-modal-tabela-wrapper">
                    <table className="compras-card-modal-tabela compras-card-modal-tabela--requisicoes">
                      <thead>
                        <tr>
                          <th>Código</th>

                          <th className="compras-card-modal-col-produto">Produto</th>

                          <th className="compras-card-modal-col-numero">Qtd.</th>

                          <th className="compras-card-modal-col-numero">Recebido</th>

                          <th className="compras-card-modal-col-numero">Saldo</th>

                          <th>Un.</th>

                          <th className="compras-card-modal-col-valor">Valor item</th>
                        </tr>
                      </thead>

                      <tbody>
                        {todosItens.map((item, indice) => {
                          const quantidade = Number(item?.quantidade ?? 0);

                          const recebida = Math.min(
                            Number(item?.quantidade_recebida ?? 0),
                            quantidade,
                          );

                          const saldo = Math.max(quantidade - recebida, 0);

                          return (
                            <tr key={`${documentoId}-${item?.codigo_item ?? indice}`}>
                              <td className="compras-card-modal-codigo">
                                {obterCodigoProduto(item)}
                              </td>

                              <td className="compras-card-modal-produto">
                                <strong>{obterDescricaoProduto(item)}</strong>

                                {item?.observacao && (
                                  <span className="compras-card-modal-item-observacao">
                                    {item.observacao}
                                  </span>
                                )}
                              </td>

                              <td className="compras-card-modal-numero">
                                {formatarNumeroCasasFixas(quantidade, 2)}
                              </td>

                              <td className="compras-card-modal-numero">
                                {formatarNumeroCasasFixas(recebida, 2)}
                              </td>

                              <td className="compras-card-modal-numero">
                                {formatarNumeroCasasFixas(saldo, 2)}
                              </td>

                              <td>{item?.unidade || "-"}</td>

                              <td className="compras-card-modal-valor">
                                {formatarMoeda(obterValorItem(item))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            );

            return [linhaPrincipal, linhaItens];
          })}
        </tbody>
      </table>
    </div>
  );
}

function TabelaRequisicoes({ requisicoes, documentosExpandidos, onAlternarItens }) {
  return (
    <div className="compras-card-modal-tabela-wrapper">
      <table className="compras-card-modal-tabela compras-card-modal-tabela--requisicoes">
        <thead>
          <tr>
            <th>Requisição</th>

            <th>Categoria</th>

            <th>Previsão</th>

            <th>Código</th>

            <th className="compras-card-modal-col-produto">Produto</th>

            <th className="compras-card-modal-col-numero">Qtd.</th>

            <th>Un.</th>

            <th className="compras-card-modal-col-valor">Preço Unit.</th>

            <th className="compras-card-modal-col-valor">Valor Item</th>
          </tr>
        </thead>

        <tbody>
          {requisicoes.flatMap((requisicao) => {
            const itens =
              Array.isArray(requisicao?.itens) && requisicao.itens.length > 0
                ? requisicao.itens
                : [
                    {
                      codigo_item: `sem-item-${requisicao.documento_id}`,
                    },
                  ];

            const documentoId = obterDocumentoId(requisicao);

            const expandido = documentosExpandidos.has(documentoId);

            const possuiMaisItens = itens.length > 1;

            const itensVisiveis = expandido ? itens : itens.slice(0, 1);

            return itensVisiveis.map((item, indice) => {
              const primeiro = indice === 0;

              const quantidade = Number(item?.quantidade ?? 0);

              const precoUnitario = Number(item?.preco_unitario ?? 0);

              const valorItem = Number.isFinite(Number(item?.valor_total))
                ? Number(item.valor_total)
                : quantidade * precoUnitario;

              return (
                <tr
                  key={`${documentoId}-${item.codigo_item ?? indice}`}
                  className={primeiro ? "" : "compras-card-modal-item-continuacao"}
                >
                  {primeiro && (
                    <>
                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-card-modal-celula-grupo"
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <strong className="compras-card-modal-requisicao">
                            {requisicao.numero_requisicao || requisicao.numero_documento || "-"}
                          </strong>

                          {possuiMaisItens && (
                            <BotaoItensModal
                              totalItens={itens.length}
                              expandido={expandido}
                              onClick={() => onAlternarItens(documentoId)}
                            />
                          )}
                        </div>
                      </td>

                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-card-modal-celula-grupo compras-card-modal-categoria"
                      >
                        {obterNomeCategoria(requisicao)}
                      </td>

                      <td
                        rowSpan={itensVisiveis.length}
                        className="compras-card-modal-celula-grupo"
                      >
                        {formatarData(requisicao.data_previsao)}
                      </td>
                    </>
                  )}

                  <td className="compras-card-modal-codigo">{obterCodigoProduto(item)}</td>

                  <td className="compras-card-modal-produto">
                    <strong>{obterDescricaoProduto(item)}</strong>

                    {item?.observacao && (
                      <span className="compras-card-modal-item-observacao">{item.observacao}</span>
                    )}
                  </td>

                  <td className="compras-card-modal-numero">
                    {formatarNumeroCasasFixas(quantidade, 2)}
                  </td>

                  <td>{item?.unidade || "-"}</td>

                  <td className="compras-card-modal-valor">{formatarMoeda(precoUnitario)}</td>

                  <td className="compras-card-modal-valor compras-card-modal-valor--requisicao">
                    {formatarMoeda(valorItem)}
                  </td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatarDataHoraRecebimento(valor) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function TabelaRecebimentosFisicos({ recebimentos, documentosExpandidos, onAlternarItens }) {
  const gruposPorPedido = new Map();

  for (const recebimento of recebimentos) {
    const chavePedido = String(
      recebimento?.cod_ped_compra ?? recebimento?.numero_pedido ?? recebimento?.id ?? "",
    );

    if (!gruposPorPedido.has(chavePedido)) {
      gruposPorPedido.set(chavePedido, []);
    }

    gruposPorPedido.get(chavePedido).push(recebimento);
  }

  const grupos = Array.from(gruposPorPedido.entries());

  function renderizarLinhaRecebimento(
    recebimento,
    { mostrarPedido = true, totalItens = 1, expandido = false, chavePedido = "" } = {},
  ) {
    return (
      <tr
        key={
          recebimento.id ?? `${chavePedido}-${recebimento.codigo_item}-${recebimento.registrado_em}`
        }
      >
        <td>{formatarDataHoraRecebimento(recebimento.registrado_em)}</td>

        <td>
          {mostrarPedido ? (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <strong className="compras-card-modal-requisicao">
                {recebimento.numero_pedido || "-"}
              </strong>

              <BotaoItensModal
                totalItens={totalItens}
                expandido={expandido}
                onClick={() => onAlternarItens(chavePedido)}
              />
            </div>
          ) : (
            <span className="compras-card-modal-sem-status">-</span>
          )}
        </td>

        <td className="compras-card-modal-codigo">
          {recebimento.codigo_comercial || recebimento.codigo_produto || "-"}
        </td>

        <td className="compras-card-modal-produto">
          <strong>{recebimento.descricao_produto || "Produto não identificado"}</strong>
        </td>

        <td className="compras-card-modal-numero">
          {formatarNumeroCasasFixas(Number(recebimento.quantidade_movimentada ?? 0), 2)}
        </td>

        <td>{recebimento.unidade || "-"}</td>

        <td title={recebimento.usuario_nome || undefined}>
          {formatarNomeUsuario(recebimento.usuario_nome)}
        </td>
      </tr>
    );
  }

  return (
    <div className="compras-card-modal-tabela-wrapper">
      <table className="compras-card-modal-tabela compras-card-modal-tabela--requisicoes">
        <thead>
          <tr>
            <th>Data / hora</th>

            <th>Pedido</th>

            <th>Código</th>

            <th className="compras-card-modal-col-produto">Produto</th>

            <th className="compras-card-modal-col-numero">Qtd. recebida</th>

            <th>Un.</th>

            <th>Recebido por</th>
          </tr>
        </thead>

        <tbody>
          {grupos.flatMap(([chavePedido, itensPedido]) => {
            const primeiro = itensPedido[0];

            if (!primeiro) {
              return [];
            }

            const expandido = documentosExpandidos.has(chavePedido);

            const linhaPrincipal = renderizarLinhaRecebimento(primeiro, {
              mostrarPedido: true,
              totalItens: itensPedido.length,
              expandido,
              chavePedido,
            });

            if (!expandido || itensPedido.length <= 1) {
              return [linhaPrincipal];
            }

            const linhasAdicionais = itensPedido.slice(1).map((recebimento) =>
              renderizarLinhaRecebimento(recebimento, {
                mostrarPedido: false,
                totalItens: itensPedido.length,
                expandido,
                chavePedido,
              }),
            );

            return [linhaPrincipal, ...linhasAdicionais];
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PedidosCompraCardModal({
  aberto,
  cardId,
  indicadores,
  pedidos = [],
  recebimentosFisicos = [],
  tipoDocumento,
  onClose,
}) {
  const [documentosExpandidos, setDocumentosExpandidos] = useState(() => new Set());

  const configuracao = CONFIGURACOES[cardId] ?? null;

  const recebimentoFisico = cardId === "recebimentos-fisicos-7-dias";

  const requisicao =
    tipoDocumento === TIPOS_DOCUMENTO.REQUISICAO ||
    configuracao?.documento === TIPOS_DOCUMENTO.REQUISICAO;

  const resumo = useMemo(
    () =>
      pedidos.reduce(
        (acc, documento) => {
          acc.valorTotal += Number(documento?.valorTotal ?? 0);

          acc.valorEmAberto += Number(documento?.valorEmAberto ?? 0);

          acc.itens += Number(documento?.quantidade_itens ?? documento?.itens?.length ?? 0);

          return acc;
        },

        {
          valorTotal: 0,

          valorEmAberto: 0,

          itens: 0,
        },
      ),

    [pedidos],
  );

  const resumoRecebimentoFisico = useMemo(() => {
    const pedidosUnicos = new Set();

    const itensUnicos = new Set();

    for (const item of recebimentosFisicos) {
      const codigoPedido = Number(item?.cod_ped_compra);

      if (Number.isFinite(codigoPedido) && codigoPedido > 0) {
        pedidosUnicos.add(codigoPedido);
      }

      itensUnicos.add(`${item?.cod_ped_compra ?? ""}::${item?.codigo_item ?? ""}`);
    }

    return {
      pedidos: pedidosUnicos.size,

      lancamentos: recebimentosFisicos.length,

      itens: itensUnicos.size,
    };
  }, [recebimentosFisicos]);

  useEffect(() => {
    setDocumentosExpandidos(new Set());
  }, [aberto, cardId]);

  if (!aberto || !configuracao) {
    return null;
  }

  const Icone = configuracao.icone;

  const valorPrincipal = obterValorPrincipal(cardId, indicadores);

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

  return (
    <Modal
      asChild
      aberto={aberto}
      onFechar={onClose}
      bloqueado={false}
      tamanho={requisicao ? "amplo" : "grande"}
      fecharAoClicarFora={true}
    >
      <section
        className={`compras-card-modal${requisicao ? " compras-card-modal--requisicao" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compras-card-modal-titulo"
      >
        <header className="compras-card-modal-header" data-modal-header="">
          <div className="compras-card-modal-heading">
            <div
              className={`compras-card-modal-icon compras-card-modal-icon--${configuracao.tipo}`}
              data-modal-icone=""
            >
              <Icone size={23} />
            </div>

            <div>
              <span className="compras-card-modal-eyebrow">Detalhes do indicador</span>

              <ModalTitulo>
                <h2 id="compras-card-modal-titulo">{configuracao.titulo}</h2>
              </ModalTitulo>

              <p>{configuracao.descricao}</p>
            </div>
          </div>

          <button
            type="button"
            className="compras-card-modal-fechar"
            onClick={onClose}
            aria-label="Fechar detalhes"
            title="Fechar"
            data-modal-fechar=""
          >
            <X size={21} />
          </button>
        </header>

        <div
          className={`compras-card-modal-resumo${
            requisicao ? " compras-card-modal-resumo--requisicao" : ""
          }`}
        >
          {recebimentoFisico ? (
            <>
              <div className="compras-card-modal-resumo-destaque">
                <span>Pedidos recebidos</span>

                <strong>{resumoRecebimentoFisico.pedidos}</strong>
              </div>

              <div>
                <span>Lançamentos</span>

                <strong>{resumoRecebimentoFisico.lancamentos}</strong>
              </div>

              <div>
                <span>Itens recebidos</span>

                <strong>{resumoRecebimentoFisico.itens}</strong>
              </div>

              <div>
                <span>Período</span>

                <strong>Últimos 7 dias</strong>
              </div>
            </>
          ) : (
            <>
              <div className="compras-card-modal-resumo-destaque">
                <span>Indicador selecionado</span>

                <strong>{valorPrincipal}</strong>
              </div>

              <div>
                <span>{requisicao ? "Requisições no indicador" : "Pedidos no indicador"}</span>

                <strong>{pedidos.length}</strong>
              </div>

              <div>
                <span>{requisicao ? "Valor requisitado" : "Valor dos pedidos"}</span>

                <strong>{formatarMoeda(resumo.valorTotal)}</strong>
              </div>

              <div>
                <span>{requisicao ? "Itens requisitados" : "Valor em aberto"}</span>

                <strong>
                  {requisicao
                    ? formatarNumeroCasasFixas(resumo.itens, 0)
                    : formatarMoeda(resumo.valorEmAberto)}
                </strong>
              </div>
            </>
          )}
        </div>

        <div className="compras-card-modal-body" data-modal-body="">
          {recebimentoFisico ? (
            recebimentosFisicos.length === 0 ? (
              <div className="compras-card-modal-vazio">
                <strong>Nenhum recebimento físico nos últimos 7 dias.</strong>

                <span>O indicador considera os lançamentos físicos registrados no sistema.</span>
              </div>
            ) : (
              <TabelaRecebimentosFisicos
                recebimentos={recebimentosFisicos}
                documentosExpandidos={documentosExpandidos}
                onAlternarItens={alternarItens}
              />
            )
          ) : pedidos.length === 0 ? (
            <div className="compras-card-modal-vazio">
              <strong>
                {requisicao
                  ? "Nenhuma requisição neste indicador."
                  : "Nenhum pedido neste indicador."}
              </strong>

              <span>O resultado considera os filtros atualmente aplicados na tela.</span>
            </div>
          ) : requisicao ? (
            <TabelaRequisicoes
              requisicoes={pedidos}
              documentosExpandidos={documentosExpandidos}
              onAlternarItens={alternarItens}
            />
          ) : (
            <TabelaPedidos
              pedidos={pedidos}
              documentosExpandidos={documentosExpandidos}
              onAlternarItens={alternarItens}
            />
          )}
        </div>

        <footer className="compras-card-modal-footer" data-modal-footer="">
          <span>
            {recebimentoFisico
              ? "Os dados acima mostram os recebimentos físicos registrados nos últimos 7 dias."
              : "Os dados acima respeitam os filtros atualmente aplicados na tela."}
          </span>

          <button
            type="button"
            className="compras-card-modal-botao-fechar"
            onClick={onClose}
            data-modal-acao="primaria"
            data-modal-fechar=""
          >
            Fechar
          </button>
        </footer>
      </section>
    </Modal>
  );
}
