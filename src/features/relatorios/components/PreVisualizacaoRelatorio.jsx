import { useMemo } from "react";

import { FiFileText, FiX } from "react-icons/fi";

import Paginacao from "@/components/paginacao/Paginacao";

import { linhaEhTotalGeral } from "../exportacao/Comum";
import { obterValorVisualizacao } from "../utils/Visualizacao";

/**
 * Pré-visualização paginada do relatório. A paginação vale só para esta
 * tabela: PDF e Excel usam todos os dados filtrados.
 */
export default function PreVisualizacaoRelatorio({
  relatorio,
  textoFiltros,
  mostrarTotal,
  totalRegistros,
  colunas,
  dados,
  pagina,
  linhasPorPagina,
  onMudarPagina,
  onFechar,
}) {
  const inicioPagina = (pagina - 1) * linhasPorPagina;

  const dadosPagina = useMemo(
    () => dados.slice(inicioPagina, inicioPagina + linhasPorPagina),
    [dados, inicioPagina, linhasPorPagina],
  );

  const inicioVisualizacao = dados.length > 0 ? inicioPagina + 1 : 0;

  const fimVisualizacao = Math.min(pagina * linhasPorPagina, dados.length);

  return (
    <section className="relatorio-visualizacao">
      <div className="relatorio-visualizacao-header">
        <div>
          <span className="relatorio-visualizacao-eyebrow">Pré-visualização</span>

          <h3>{relatorio.titulo}</h3>
        </div>

        <button
          type="button"
          className="relatorio-visualizacao-fechar"
          onClick={onFechar}
          aria-label="Fechar visualização"
        >
          <FiX />
        </button>
      </div>

      <div className="relatorio-visualizacao-info">
        <div className="relatorio-visualizacao-info-item">
          <span>Filtros</span>

          <strong>{textoFiltros}</strong>
        </div>

        {mostrarTotal && (
          <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
            <span>Registros</span>
            <strong>{totalRegistros}</strong>
          </div>
        )}
      </div>

      {dados.length > 0 ? (
        <div className="relatorio-visualizacao-tabela-wrapper">
          <table className="relatorio-visualizacao-tabela">
            <thead>
              <tr>
                {colunas.map((coluna) => (
                  <th key={coluna.chave} className={coluna.numerica ? "coluna-numerica" : ""}>
                    {coluna.titulo}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {dadosPagina.map((item, indice) => (
                <tr
                  className={linhaEhTotalGeral(item) ? "linha-total" : undefined}
                  key={`${relatorio.id}-${inicioPagina + indice}`}
                >
                  {colunas.map((coluna) => (
                    <td key={coluna.chave} className={coluna.numerica ? "coluna-numerica" : ""}>
                      {obterValorVisualizacao(item, coluna.chave)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relatorio-visualizacao-vazia">
          <FiFileText />

          <strong>Nenhum registro encontrado</strong>

          <span>Ajuste os filtros para visualizar os dados.</span>
        </div>
      )}

      <div className="relatorio-visualizacao-footer">
        <span>
          Exibindo {inicioVisualizacao} a {fimVisualizacao} de {dados.length} linha(s)
        </span>

        <span>Visualização atualizada conforme os filtros</span>
      </div>

      {/* Paginação só quando há mais de uma página. */}
      {dados.length > linhasPorPagina && (
        <Paginacao
          paginaAtual={pagina}
          totalItens={dados.length}
          itensPorPagina={linhasPorPagina}
          onChangePagina={onMudarPagina}
        />
      )}
    </section>
  );
}
