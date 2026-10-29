import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";
import { useEffect, useMemo, useState } from "react";

import { X } from "lucide-react";

import { TIPOS_DOCUMENTO } from "../constants/pedidosCompra.constants";

import { formatarMoeda } from "../utils/pedidosCompra.utils";
import {
  calcularResumoDocumentos,
  calcularResumoRecebimentosFisicos,
  obterValorPrincipal,
} from "../utils/pedidosCompraCardModal.utils";

import { CONFIGURACOES_CARD_MODAL } from "./card-modal/cardModal.config";
import TabelaPedidosModal from "./card-modal/TabelaPedidosModal";
import TabelaRecebimentosFisicosModal from "./card-modal/TabelaRecebimentosFisicosModal";
import TabelaRequisicoesModal from "./card-modal/TabelaRequisicoesModal";

import "./PedidosCompraCardModal.css";
import { formatarNumeroCasasFixas } from "@/shared/lib/formatar";

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

  const configuracao = CONFIGURACOES_CARD_MODAL[cardId] ?? null;

  const recebimentoFisico = cardId === "recebimentos-fisicos-7-dias";

  const requisicao =
    tipoDocumento === TIPOS_DOCUMENTO.REQUISICAO ||
    configuracao?.documento === TIPOS_DOCUMENTO.REQUISICAO;

  const resumo = useMemo(() => calcularResumoDocumentos(pedidos), [pedidos]);

  const resumoRecebimentoFisico = useMemo(
    () => calcularResumoRecebimentosFisicos(recebimentosFisicos),
    [recebimentosFisicos],
  );

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
              <TabelaRecebimentosFisicosModal
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
            <TabelaRequisicoesModal
              requisicoes={pedidos}
              documentosExpandidos={documentosExpandidos}
              onAlternarItens={alternarItens}
            />
          ) : (
            <TabelaPedidosModal
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
