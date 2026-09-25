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
    <div className="modal-overlay">

      <div className="modal-content modal-novo-usuario">

        <div className="modal-novo-usuario-header">

          <div className="modal-permissoes-icon">
            <FiUserPlus />
          </div>


          <div>

            <h3>
              Cadastrar usuário
            </h3>

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


            <div className="modal-actions">

              <button
                type="button"
                className="btn-modal-cancelar"
                onClick={
                  onFechar
                }
                disabled={
                  criando
                }
              >
                Cancelar
              </button>


              <button
                type="submit"
                className="btn-modal-salvar-permissoes"
                disabled={
                  criando
                }
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


            <div className="modal-actions">

              <button
                type="button"
                className="btn-modal-salvar-permissoes"
                onClick={
                  onFechar
                }
              >
                Concluir
              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}