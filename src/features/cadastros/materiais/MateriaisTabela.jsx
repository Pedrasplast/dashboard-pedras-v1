import { Pencil } from "lucide-react";
import { formatarNumero } from "../utils/cadastrosFormatadores";

export default function MateriaisTabela({registrosPagina, carregando, abrirEdicaoMaterial}) {
 return (
              <div className="cadastros-tabela-scroll">
                <table className="cadastros-tabela cadastros-tabela--materiais">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Código Omie</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {carregando ? (
                      <tr>
                        <td colSpan={4} className="cadastros-vazio">
                          Carregando materiais...
                        </td>
                      </tr>
                    ) : registrosPagina.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="cadastros-vazio">
                          Nenhum material encontrado.
                        </td>
                      </tr>
                    ) : (
                      registrosPagina.map((material) => (
                        <tr key={material.id}>
                          <td>
                            <strong>{material.nome}</strong>
                          </td>
                          <td>{material.codigoOmie || "Não informado"}</td>

                          <td>
                            <span
                              className={
                                material.ativo
                                  ? "cadastros-status cadastros-status--ativo"
                                  : "cadastros-status cadastros-status--inativo"
                              }
                            >
                              {material.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="cadastros-editar"
                              onClick={() => abrirEdicaoMaterial(material)}
                            >
                              <Pencil size={15} />
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
 );
}
