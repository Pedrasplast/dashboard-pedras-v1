import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";
import {
  FiCopy,
  FiUserPlus,
  FiX,
} from "react-icons/fi";


export default function NovoUsuarioModal({
  aberto,
  email,
  criando,
  linkPrimeiroAcesso,
  emailUsuarioCriado,
  linkCopiado,
  onEmailChange,
  onSubmit,
  onCopiarLink,
  onFechar,
}) {
  if (
    !aberto
  ) {
    return null;
  }

  return (
    <Modal
      asChild
      aberto={aberto}
      onFechar={onFechar}
      bloqueado={criando}
      tamanho="pequeno"
      fecharAoClicarFora={false}
    >

      <div className="modal-content modal-novo-usuario">

        <div className="modal-novo-usuario-header" data-modal-header="">

          <div className="modal-permissoes-icon" data-modal-icone="">
            <FiUserPlus />
          </div>


          <div>

            <ModalTitulo>
              <h3>
                Cadastrar usuário
              </h3>
            </ModalTitulo>

            <p>
              Cadastre o e-mail do colaborador.
              Ele receberá um link para definir a própria senha.
            </p>

          </div>


          <button
            type="button"
            className="btn-fechar-modal-usuario"
            onClick={
              onFechar
            }
            disabled={
              criando
            }
            aria-label="Fechar"
            data-modal-fechar=""
          >
            <FiX />
          </button>

        </div>


        {!linkPrimeiroAcesso ? (

          <form
            onSubmit={
              onSubmit
            }
            className="form-novo-usuario"
            data-modal-form=""
          >

            <label className="campo-novo-usuario">

              <span>
                E-mail do usuário
              </span>

              <input
                type="email"
                value={
                  email
                }
                onChange={
                  (
                    event,
                  ) =>
                    onEmailChange(
                      event.target.value,
                    )
                }
                placeholder="nome@empresa.com"
                autoComplete="email"
                disabled={
                  criando
                }
                required
                autoFocus
              />

            </label>


            <div className="modal-actions" data-modal-footer="">

              <button
                type="button"
                className="btn-modal-cancelar"
                onClick={
                  onFechar
                }
                disabled={
                  criando
                }
                data-modal-acao="secundaria"
              >
                Cancelar
              </button>


              <button
                type="submit"
                className="btn-modal-salvar-permissoes"
                disabled={
                  criando
                }
                data-modal-acao="primaria"
              >
                {criando
                  ? "Cadastrando..."
                  : "Cadastrar usuário"}
              </button>

            </div>

          </form>

        ) : (

          <div className="usuario-criado-sucesso">

            <strong>
              Usuário cadastrado
            </strong>

            <span>
              {emailUsuarioCriado}
            </span>

            <p>
              Envie o link abaixo para o usuário definir
              a senha do primeiro acesso.
            </p>


            <div className="bloco-link-primeiro-acesso">

              <input
                type="text"
                value={
                  linkPrimeiroAcesso
                }
                readOnly
                onFocus={
                  (
                    event,
                  ) =>
                    event.target.select()
                }
              />


              <button
                type="button"
                onClick={
                  onCopiarLink
                }
              >
                <FiCopy />

                {linkCopiado
                  ? "Copiado!"
                  : "Copiar link"}
              </button>

            </div>


            <div className="modal-actions" data-modal-footer="">

              <button
                type="button"
                className="btn-modal-salvar-permissoes"
                onClick={
                  onFechar
                }
                data-modal-acao="primaria"
              >
                Concluir
              </button>

            </div>

          </div>

        )}

      </div>

    </Modal>
  );
}