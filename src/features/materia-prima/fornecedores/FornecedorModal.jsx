import {
  useEffect,
  useState,
} from "react";

import {
  Save,
  Truck,
  X,
} from "lucide-react";

import "./FornecedorModal.css";


/* =========================================================
   MODAL FORNECEDOR
========================================================= */

export default function FornecedorModal({
  aberto,
  fornecedor = null,
  salvando = false,
  onCancelar,
  onSalvar,
}) {
  const [
    nome,
    setNome,
  ] = useState("");

  const [
    ativo,
    setAtivo,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");


  /* =======================================================
     CARREGAR DADOS NO FORMULÁRIO
  ======================================================= */

  useEffect(
    () => {
      if (!aberto) {
        return;
      }


      if (fornecedor) {
        setNome(
          String(
            fornecedor
              ?.nome ??
              "",
          ),
        );

        setAtivo(
          fornecedor
            ?.ativo !==
          false,
        );
      } else {
        setNome(
          "",
        );

        setAtivo(
          true,
        );
      }


      setErro(
        "",
      );
    },
    [
      aberto,
      fornecedor,
    ],
  );


  /* =======================================================
     FECHAR COM ESC
  ======================================================= */

  useEffect(
    () => {
      if (!aberto) {
        return undefined;
      }


      function fecharComEscape(
        event,
      ) {
        if (
          event.key !==
          "Escape"
        ) {
          return;
        }


        if (salvando) {
          return;
        }


        onCancelar?.();
      }


      document.addEventListener(
        "keydown",
        fecharComEscape,
      );


      return () => {
        document.removeEventListener(
          "keydown",
          fecharComEscape,
        );
      };
    },
    [
      aberto,
      salvando,
      onCancelar,
    ],
  );


  /* =======================================================
     SALVAR
  ======================================================= */

  async function enviarFormulario(
    event,
  ) {
    event.preventDefault();


    const nomeFinal =
      String(
        nome ??
        "",
      ).trim();


    setErro(
      "",
    );


    if (!nomeFinal) {
      setErro(
        "Informe o nome do fornecedor.",
      );

      return;
    }


    try {
      await onSalvar?.({
        id:
          fornecedor
            ?.id ??
          null,

        nome:
          nomeFinal,

        ativo:
          Boolean(
            ativo,
          ),
      });
    } catch (error) {
      setErro(
        error
          ?.message ||
          "Não foi possível salvar o fornecedor.",
      );
    }
  }


  /* =======================================================
     NÃO RENDERIZAR
  ======================================================= */

  if (!aberto) {
    return null;
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="fornecedor-modal-overlay">

      <div
        className="fornecedor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fornecedor-modal-titulo"
      >

        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <div className="fornecedor-modal-header">

          <div className="fornecedor-modal-header-icone">

            <Truck
              size={22}
              strokeWidth={2}
              aria-hidden="true"
            />

          </div>


          <div className="fornecedor-modal-header-texto">

            <span>
              Matéria-Prima PP
            </span>

            <h3 id="fornecedor-modal-titulo">
              {fornecedor
                ? "Editar fornecedor"
                : "Novo fornecedor"}
            </h3>

            <p>
              Cadastre o fornecedor ou
              origem do PP utilizado
              nas receitas.
            </p>

          </div>


          <button
            type="button"
            className="fornecedor-modal-fechar"
            onClick={
              onCancelar
            }
            disabled={
              salvando
            }
            aria-label="Fechar"
          >

            <X
              size={19}
              strokeWidth={2}
              aria-hidden="true"
            />

          </button>

        </div>


        {/* =================================================
            FORMULÁRIO
        ================================================= */}

        <form
          className="fornecedor-modal-form"
          onSubmit={
            enviarFormulario
          }
        >

          {/* ===============================================
              NOME
          =============================================== */}

          <label className="fornecedor-modal-campo">

            <span className="fornecedor-modal-label">
              Nome do fornecedor
            </span>


            <input
              type="text"
              value={
                nome
              }
              onChange={
                (
                  event,
                ) => {
                  setNome(
                    event
                      .target
                      .value,
                  );

                  setErro(
                    "",
                  );
                }
              }
              placeholder="Ex.: Fornecedor A"
              autoFocus
              disabled={
                salvando
              }
            />

          </label>


          {/* ===============================================
              STATUS
          =============================================== */}

          <div className="fornecedor-modal-campo">

            <span className="fornecedor-modal-label">
              Status
            </span>


            <div className="fornecedor-modal-opcoes">

              <label
                className={
                  ativo
                    ? "fornecedor-modal-opcao ativo"
                    : "fornecedor-modal-opcao"
                }
              >

                <input
                  type="radio"
                  name="fornecedor-status"
                  checked={
                    ativo ===
                    true
                  }
                  onChange={
                    () =>
                      setAtivo(
                        true,
                      )
                  }
                  disabled={
                    salvando
                  }
                />

                <span>
                  Ativo
                </span>

              </label>


              <label
                className={
                  !ativo
                    ? "fornecedor-modal-opcao ativo"
                    : "fornecedor-modal-opcao"
                }
              >

                <input
                  type="radio"
                  name="fornecedor-status"
                  checked={
                    ativo ===
                    false
                  }
                  onChange={
                    () =>
                      setAtivo(
                        false,
                      )
                  }
                  disabled={
                    salvando
                  }
                />

                <span>
                  Inativo
                </span>

              </label>

            </div>


            <small>
              Fornecedores inativos
              permanecem registrados,
              mas poderão ser ocultados
              das novas receitas.
            </small>

          </div>


          {/* ===============================================
              ERRO
          =============================================== */}

          {erro && (

            <div className="fornecedor-modal-erro">
              {erro}
            </div>

          )}


          {/* ===============================================
              AÇÕES
          =============================================== */}

          <div className="fornecedor-modal-acoes">

            <button
              type="button"
              className="fornecedor-modal-btn-cancelar"
              onClick={
                onCancelar
              }
              disabled={
                salvando
              }
            >
              Cancelar
            </button>


            <button
              type="submit"
              className="fornecedor-modal-btn-salvar"
              disabled={
                salvando
              }
            >

              <Save
                size={17}
                strokeWidth={2}
                aria-hidden="true"
              />

              <span>
                {salvando
                  ? "Salvando..."
                  : "Salvar"}
              </span>

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}