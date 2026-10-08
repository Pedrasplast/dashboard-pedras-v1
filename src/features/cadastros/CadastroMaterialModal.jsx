import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";
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
    <Modal
      asChild
      aberto={aberto}
      onFechar={onCancelar}
      bloqueado={salvando}
      tamanho="medio"
      fecharAoClicarFora={false}
    >
      <div
        className="produto-pp-modal cadastro-produto-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cadastro-material-modal-titulo"
      >
        <div className="produto-pp-modal-header" data-modal-header="">
          <div className="produto-pp-modal-header-icone" data-modal-icone="">
            <Boxes
              size={22}
              aria-hidden="true"
            />
          </div>

          <div className="produto-pp-modal-header-texto">
            <span>
              Cadastro
            </span>

            <ModalTitulo>
              <h3 id="cadastro-material-modal-titulo">
                {item
                  ? "Editar material"
                  : "Cadastrar material"}
              </h3>
            </ModalTitulo>

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
            data-modal-fechar=""
          >
            <X size={19} />
          </button>
        </div>

        <form
          className="produto-pp-modal-form"
          onSubmit={
            enviar
          }
          data-modal-form=""
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

          <div className="produto-pp-modal-acoes" data-modal-footer="">
            <button
              type="button"
              className="produto-pp-modal-cancelar"
              onClick={
                onCancelar
              }
              disabled={
                salvando
              }
              data-modal-acao="secundaria"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="produto-pp-modal-salvar"
              disabled={
                salvando
              }
              data-modal-acao="primaria"
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
    </Modal>
  );
}
