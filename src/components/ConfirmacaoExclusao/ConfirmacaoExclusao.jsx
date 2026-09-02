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
    <div className="confirmacao-exclusao-overlay">

      <div
        className="confirmacao-exclusao"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmacao-exclusao-titulo"
      >

        <div className="confirmacao-exclusao-header">

          <div className="confirmacao-exclusao-icone">

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

            <h3 id="confirmacao-exclusao-titulo">
              {titulo}
            </h3>

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
          >

            <X
              size={18}
            />

          </button>

        </div>


        <div className="confirmacao-exclusao-conteudo">

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


        <div className="confirmacao-exclusao-acoes">

          <button
            type="button"
            className="confirmacao-exclusao-cancelar"
            onClick={
              onCancelar
            }
            disabled={
              processando
            }
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

    </div>
  );
}