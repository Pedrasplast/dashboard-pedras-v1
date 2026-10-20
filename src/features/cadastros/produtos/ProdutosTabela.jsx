import { Pencil } from "lucide-react";
import { formatarNumero } from "../utils/cadastrosFormatadores";

export default function ProdutosTabela({registrosPagina, carregando, materiais, abrirEdicaoProduto}) {
 return (
              <div className="cadastros-tabela-scroll">
                <table className="cadastros-tabela">
                  {/* CABEÇALHO */}

                  <thead>
                    <tr>
                      <th>Código</th>

                      <th>Produto</th>

                      <th>COD. MP</th>

                      <th>Material</th>

                      <th className="numero">Cavidades</th>

                      <th className="numero">Ciclo</th>

                      <th className="numero">Kg/un.</th>

                      <th className="numero">Kg/haste</th>

                      <th>Status</th>

                      <th>Ações</th>
                    </tr>
                  </thead>

                  {/* CORPO */}

                  <tbody>
                    {carregando ? (
                      <tr>
                        <td colSpan={10} className="cadastros-vazio">
                          Carregando produtos...
                        </td>
                      </tr>
                    ) : registrosPagina.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="cadastros-vazio">
                          Nenhum produto encontrado.
                        </td>
                      </tr>
                    ) : (
                      registrosPagina.map((produto) => (
                        <tr key={produto.codigoProduto}>
                          {/* CÓDIGO */}

                          <td>
                            <span className="cadastros-codigo">{produto.codigoProduto}</span>
                          </td>

                          {/* =================================
                              NOME DO PRODUTO

                              Exibe somente uma descrição.

                              O nome já foi atualizado
                              no banco pelo estoque Omie.
                          ================================= */}

                          <td>
                            <strong className="cadastros-produto-nome">
                              {produto.nomeProduto}
                            </strong>
                          </td>

                          {/* CÓDIGO OMIE DA MATÉRIA-PRIMA */}

                          <td>
                            <span className="cadastros-codigo">
                              {materiais.find(
                                (material) => String(material.id) === String(produto.materialId)
                              )?.codigoOmie || "-"}
                            </span>
                          </td>

                          {/* MATERIAL */}

                          <td>{produto.materialNome || "-"}</td>

                          {/* CAVIDADES */}

                          <td className="numero">{formatarNumero(produto.cavidadeMolde, 0)}</td>

                          {/* CICLO */}

                          <td className="numero">
                            {produto.cicloSegundos === null
                              ? "-"
                              : `${formatarNumero(produto.cicloSegundos, 2)} s`}
                          </td>

                          {/* KG/UNIDADE */}

                          <td className="numero">{formatarNumero(produto.kgUn, 4)}</td>

                          {/* KG/HASTE */}

                          <td className="numero">{formatarNumero(produto.kgHaste, 4)}</td>

                          {/* STATUS */}

                          <td>
                            <span
                              className={
                                produto.ativo
                                  ? "cadastros-status cadastros-status--ativo"
                                  : "cadastros-status cadastros-status--inativo"
                              }
                            >
                              {produto.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>

                          {/* EDITAR */}

                          <td>
                            <button
                              type="button"
                              className="cadastros-editar"
                              onClick={() => abrirEdicaoProduto(produto)}
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
