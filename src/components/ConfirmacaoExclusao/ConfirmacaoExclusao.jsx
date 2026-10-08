import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";
import {
  AlertTriangle,
  Trash2,
  X,
} from "lucide-react";

import "./ConfirmacaoExclusao.css";


export default function ConfirmacaoExclusao({
  aberto = false,
  titulo = "Confirmar exclusão",
  descricao = "Esta ação não poderá ser desfeita.",
  itemTitulo = "",
  itemDescricao = "",
  detalhes = [],
  erro = "",
  processando = false,
  textoCancelar = "Cancelar",
  textoConfirmar = "Excluir",
  onCancelar,
  onConfirmar,
}) {
  if (!aberto) {
    return null;
  }


  return (
    <Modal
      asChild
      aberto={aberto}
      onFechar={onCancelar}
      bloqueado={processando}
      tamanho="pequeno"
      fecharAoClicarFora={false}
    >

      <div
        className="confirmacao-exclusao"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmacao-exclusao-titulo"
      >

        <div className="confirmacao-exclusao-header" data-modal-header="">

          <div className="confirmacao-exclusao-icone" data-modal-icone="">

            <Trash2
              size={21}
              strokeWidth={2}
              aria-hidden="true"
            />

          </div>


          <div className="confirmacao-exclusao-header-texto">

            <span>
              Exclusão
            </span>

            <ModalTitulo>
              <h3 id="confirmacao-exclusao-titulo">
                {titulo}
              </h3>
            </ModalTitulo>

            <p>
              {descricao}
            </p>

          </div>


          <button
            type="button"
            className="confirmacao-exclusao-fechar"
            onClick={
              onCancelar
            }
            disabled={
              processando
            }
            aria-label="Fechar"
            data-modal-fechar=""
          >

            <X
              size={18}
            />

          </button>

        </div>


        <div className="confirmacao-exclusao-conteudo" data-modal-body="">

          {(itemTitulo ||
            itemDescricao) && (

            <div className="confirmacao-exclusao-item">

              {itemTitulo && (

                <strong>
                  {itemTitulo}
                </strong>

              )}


              {itemDescricao && (

                <span>
                  {itemDescricao}
                </span>

              )}

            </div>

          )}


          {Array.isArray(
            detalhes,
          ) &&
            detalhes.length >
              0 && (

            <div className="confirmacao-exclusao-detalhes">

              {detalhes.map(
                (
                  detalhe,
                  indice,
                ) => (

                  <div
                    key={
                      `${detalhe?.label}-${indice}`
                    }
                  >

                    <span>
                      {
                        detalhe
                          ?.label
                      }
                    </span>

                    <strong>
                      {
                        detalhe
                          ?.valor ??
                        "-"
                      }
                    </strong>

                  </div>

                ),
              )}

            </div>

          )}


          {erro && (

            <div className="confirmacao-exclusao-erro">

              <AlertTriangle
                size={16}
              />

              <span>
                {erro}
              </span>

            </div>

          )}

        </div>


        <div className="confirmacao-exclusao-acoes" data-modal-footer="">

          <button
            type="button"
            className="confirmacao-exclusao-cancelar"
            onClick={
              onCancelar
            }
            disabled={
              processando
            }
            data-modal-acao="secundaria"
          >
            {textoCancelar}
          </button>


          <button
            type="button"
            className="confirmacao-exclusao-confirmar"
            onClick={
              onConfirmar
            }
            disabled={
              processando
            }
            data-modal-acao="perigo"
          >

            <Trash2
              size={15}
            />

            {processando
              ? "Excluindo..."
              : textoConfirmar}

          </button>

        </div>

      </div>

    </Modal>
  );
}