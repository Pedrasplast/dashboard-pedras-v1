import { Pencil } from "lucide-react";
import { formatarNumero } from "../utils/cadastrosFormatadores";

export default function FornecedoresTabela({
  registrosPagina,
  carregando,
  materiaisDoFornecedor,
  abrirEdicaoFornecedor,
}) {
  return (
    <div className="cadastros-tabela-scroll">
      <table className="cadastros-tabela cadastros-tabela--fornecedores">
        <thead>
          <tr>
            <th>Fornecedor</th>

            <th>Materiais</th>

            <th className="numero">Estoque mínimo</th>

            <th className="numero">Estoque alvo</th>

            <th className="numero">Lead time</th>

            <th>Status</th>

            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {carregando ? (
            <tr>
              <td colSpan={7} className="cadastros-vazio">
                Carregando fornecedores...
              </td>
            </tr>
          ) : registrosPagina.length === 0 ? (
            <tr>
              <td colSpan={7} className="cadastros-vazio">
                Nenhum fornecedor encontrado.
              </td>
            </tr>
          ) : (
            registrosPagina.map((fornecedor) => (
              <tr key={fornecedor.id}>
                {/* FORNECEDOR */}

                <td>
                  <strong>{fornecedor.nome}</strong>
                </td>

                {/* MATERIAIS */}

                <td>
                  <div className="cadastros-materiais-tags">
                    {materiaisDoFornecedor(fornecedor.id).map((vinculo) => (
                      <span
                        key={vinculo.materialId}
                        className={
                          vinculo.padrao
                            ? "cadastros-material-tag cadastros-material-tag--padrao"
                            : "cadastros-material-tag"
                        }
                      >
                        {vinculo.material.nome}
                        {vinculo.padrao ? " • padrão" : ""}
                      </span>
                    ))}

                    {materiaisDoFornecedor(fornecedor.id).length === 0 && (
                      <span className="cadastros-material-tag">Sem material</span>
                    )}
                  </div>
                </td>

                {/* ESTOQUE MÍNIMO */}

                <td className="numero">
                  {fornecedor.estoqueMinimoKg === null
                    ? "-"
                    : `${formatarNumero(fornecedor.estoqueMinimoKg, 3)} kg`}
                </td>

                {/* ESTOQUE ALVO */}

                <td className="numero">
                  {fornecedor.estoqueAlvoKg === null
                    ? "-"
                    : `${formatarNumero(fornecedor.estoqueAlvoKg, 3)} kg`}
                </td>

                {/* LEAD TIME */}

                <td className="numero">
                  {fornecedor.leadTimeDias === null
                    ? "-"
                    : `${formatarNumero(fornecedor.leadTimeDias, 0)} dias`}
                </td>

                {/* STATUS */}

                <td>
                  <span
                    className={
                      fornecedor.ativo
                        ? "cadastros-status cadastros-status--ativo"
                        : "cadastros-status cadastros-status--inativo"
                    }
                  >
                    {fornecedor.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>

                {/* EDITAR */}

                <td>
                  <button
                    type="button"
                    className="cadastros-editar"
                    onClick={() => abrirEdicaoFornecedor(fornecedor)}
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
