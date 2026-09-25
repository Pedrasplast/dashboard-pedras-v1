import {
  FiSettings,
} from "react-icons/fi";


export default function UsuariosTable({
  usuarios,
  totalTelas,
  contarPermissoes,
  onAbrirPermissoes,
  onAlterarRegra,
  onExcluir,
}) {
  return (
    <div className="table-responsive">

      <table className="usuarios-table">

        <thead>
          <tr>
            <th>
              E-mail
            </th>

            <th>
              Perfil Atual
            </th>

            <th className="col-centralizada">
              Acessos Liberados
            </th>

            <th className="col-centralizada">
              Nível de Acesso
            </th>

            <th className="col-centralizada">
              Ações
            </th>
          </tr>
        </thead>


        <tbody>

          {usuarios.length ===
          0 ? (

            <tr>
              <td
                colSpan="5"
                className="tabela-vazia"
              >
                Nenhum usuário cadastrado encontrado.
              </td>
            </tr>

          ) : (

            usuarios.map(
              (
                usuario,
              ) => {

                const totalPermitido =
                  contarPermissoes(
                    usuario.id,
                  );

                return (
                  <tr
                    key={
                      usuario.id
                    }
                  >

                    <td className="user-email-col">
                      {usuario.email}
                    </td>


                    <td>
                      <span
                        className={
                          `badge-role ${usuario.regra}`
                        }
                      >
                        {usuario.regra ===
                        "admin"
                          ? "Administrador"
                          : "Operador"}
                      </span>
                    </td>


                    <td className="col-centralizada">

                      {usuario.regra ===
                      "admin" ? (

                        <div className="acesso-total-admin">
                          Acesso total
                        </div>

                      ) : (

                        <button
                          type="button"
                          className="btn-gerenciar-permissoes"
                          onClick={
                            () =>
                              onAbrirPermissoes(
                                usuario,
                              )
                          }
                        >

                          <FiSettings />

                          <span>
                            Configurar acessos
                          </span>

                          <span className="contador-permissoes">
                            {totalPermitido}/{totalTelas}
                          </span>

                        </button>
                      )}

                    </td>


                    <td className="col-centralizada">

                      {usuario.regra ===
                      "admin" ? (

                        <button
                          type="button"
                          className="btn-change-role op"
                          onClick={
                            () =>
                              onAlterarRegra(
                                usuario.id,
                                "operador",
                              )
                          }
                        >
                          Rebaixar para Operador
                        </button>

                      ) : (

                        <button
                          type="button"
                          className="btn-change-role adm"
                          onClick={
                            () =>
                              onAlterarRegra(
                                usuario.id,
                                "admin",
                              )
                          }
                        >
                          Promover a Admin
                        </button>

                      )}

                    </td>


                    <td className="col-centralizada">

                      <button
                        type="button"
                        className="btn-delete-user"
                        onClick={
                          () =>
                            onExcluir(
                              usuario,
                            )
                        }
                      >
                        Excluir
                      </button>

                    </td>

                  </tr>
                );
              },
            )

          )}

        </tbody>

      </table>

    </div>
  );
}