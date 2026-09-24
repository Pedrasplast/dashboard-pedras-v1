import {
  useEffect,
  useState,
} from "react";

import {
  Boxes,
  Save,
  X,
} from "lucide-react";

import "./CadastroProdutoModal.css";

/* =========================================================
   MODAL
========================================================= */

export default function CadastroMaterialModal({
  aberto,
  item = null,
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

  useEffect(
    () => {
      if (!aberto) {
        return;
      }

      setNome(
        item?.nome ??
        "",
      );

      setAtivo(
        item?.ativo !==
        false,
      );

      setErro(
        "",
      );
    },
    [
      aberto,
      item,
    ],
  );

  useEffect(
    () => {
      if (!aberto) {
        return undefined;
      }

      function fecharEscape(
        event,
      ) {
        if (
          event.key ===
            "Escape" &&
          !salvando
        ) {
          onCancelar?.();
        }
      }

      document.addEventListener(
        "keydown",
        fecharEscape,
      );

      return () => {
        document.removeEventListener(
          "keydown",
          fecharEscape,
        );
      };
    },
    [
      aberto,
      salvando,
      onCancelar,
    ],
  );

  useEffect(
    () => {
      if (!aberto) {
        return undefined;
      }

      const overflowAnterior =
        document.body
          .style
          .overflow;

      document.body.style.overflow =
        "hidden";

      return () => {
        document.body.style.overflow =
          overflowAnterior;
      };
    },
    [
      aberto,
    ],
  );

  async function enviar(
    event,
  ) {
    event.preventDefault();

    setErro(
      "",
    );

    const nomeFinal =
      String(
        nome ?? "",
      ).trim();

    if (!nomeFinal) {
      setErro(
        "Informe o nome do material.",
      );

      return;
    }

    try {
      await onSalvar?.({
        id:
          item?.id ??
          null,

        nome:
          nomeFinal,

        ativo,
      });
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível salvar o material.",
      );
    }
  }

  if (!aberto) {
    return null;
  }

  return (
    <div className="produto-pp-modal-overlay">
      <div
        className="produto-pp-modal cadastro-produto-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cadastro-material-modal-titulo"
      >
        <div className="produto-pp-modal-header">
          <div className="produto-pp-modal-header-icone">
            <Boxes
              size={22}
              aria-hidden="true"
            />
          </div>

          <div className="produto-pp-modal-header-texto">
            <span>
              Cadastro
            </span>

            <h3 id="cadastro-material-modal-titulo">
              {item
                ? "Editar material"
                : "Cadastrar material"}
            </h3>

            <p>
              Materiais disponíveis
              para fornecedores,
              compras e recebimentos.
            </p>
          </div>

          <button
            type="button"
            className="produto-pp-modal-fechar"
            onClick={
              onCancelar
            }
            disabled={
              salvando
            }
            aria-label="Fechar"
          >
            <X size={19} />
          </button>
        </div>

        <form
          className="produto-pp-modal-form"
          onSubmit={
            enviar
          }
        >
          <label className="produto-pp-modal-campo">
            <span>
              Nome do material
            </span>

            <input
              type="text"
              value={
                nome
              }
              onChange={
                (event) => {
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
              placeholder="Ex.: PP, PET/PE, PEAD..."
              autoComplete="off"
              disabled={
                salvando
              }
            />
          </label>

          <label className="produto-pp-modal-status">
            <input
              type="checkbox"
              checked={
                ativo
              }
              onChange={
                (event) => {
                  setAtivo(
                    event
                      .target
                      .checked,
                  );

                  setErro(
                    "",
                  );
                }
              }
              disabled={
                salvando
              }
            />

            <div>
              <strong>
                Material ativo
              </strong>

              <span>
                Materiais inativos
                permanecem no
                histórico, mas não
                ficam disponíveis
                para novos vínculos.
              </span>
            </div>
          </label>

          {erro && (
            <div className="produto-pp-modal-erro">
              {erro}
            </div>
          )}

          <div className="produto-pp-modal-acoes">
            <button
              type="button"
              className="produto-pp-modal-cancelar"
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
              className="produto-pp-modal-salvar"
              disabled={
                salvando
              }
            >
              <Save
                size={17}
              />

              {salvando
                ? "Salvando..."
                : "Salvar material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
