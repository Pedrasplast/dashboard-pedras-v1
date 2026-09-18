import { useEffect, useMemo, useState } from "react";
import { FiFileText, FiX } from "react-icons/fi";
import Paginacao from "@/components/paginacao/Paginacao";
import {
  COLUNAS_NUMERICAS,
  TITULOS_COLUNAS_VISUALIZACAO,
  criarTituloAutomatico,
  obterValorVisualizacao,
} from "../utils/Visualizacao";
import { contarRegistrosRelatorio, deveMostrarContagem } from "../utils/ResumoRelatorio";

const LINHAS_POR_PAGINA = 8;

export default function PreVisualizacaoRelatorio({ relatorio, dados, filtros, textoFiltros, onFechar }) {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const colunas = useMemo(() => {
    const chaves = Array.isArray(relatorio.colunas) ? [...relatorio.colunas] : [];
    if (relatorio.id === "producao-produto") {
      const indice = chaves.indexOf("produto");
      if (indice !== -1 && !chaves.includes("descricao_produto")) {
        chaves.splice(indice + 1, 0, "descricao_produto");
      }
    }
    return chaves.map((chave) => ({
      chave,
      titulo: TITULOS_COLUNAS_VISUALIZACAO[chave] || criarTituloAutomatico(chave),
      numerica: COLUNAS_NUMERICAS.has(chave),
    }));
  }, [relatorio]);

  const quantidadeLinhas = dados.length;
  const totalPaginas = Math.max(1, Math.ceil(quantidadeLinhas / LINHAS_POR_PAGINA));
  const pagina = Math.min(paginaAtual, totalPaginas);
  const inicio = quantidadeLinhas ? (pagina - 1) * LINHAS_POR_PAGINA + 1 : 0;
  const fim = Math.min(pagina * LINHAS_POR_PAGINA, quantidadeLinhas);
  const dadosPagina = useMemo(
    () => dados.slice((pagina - 1) * LINHAS_POR_PAGINA, pagina * LINHAS_POR_PAGINA),
    [dados, pagina]
  );

  useEffect(() => { setPaginaAtual(1); }, [filtros, relatorio.id]);
  useEffect(() => {
    if (paginaAtual > totalPaginas) setPaginaAtual(totalPaginas);
  }, [paginaAtual, totalPaginas]);

  const mostrarContagem = deveMostrarContagem(relatorio);
  return (
    <section className="relatorio-visualizacao">
      <div className="relatorio-visualizacao-header">
        <div>
          <span className="relatorio-visualizacao-eyebrow">Pré-visualização</span>
          <h3>{relatorio.titulo}</h3>
        </div>
        <button type="button" className="relatorio-visualizacao-fechar" onClick={onFechar} aria-label="Fechar visualização">
          <FiX />
        </button>
      </div>
      <div className="relatorio-visualizacao-info">
        <div className="relatorio-visualizacao-info-item">
          <span>Filtros</span>
          <strong>{textoFiltros}</strong>
        </div>
        {mostrarContagem && (
          <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
            <span>Registros</span>
            <strong>{contarRegistrosRelatorio(relatorio, dados)}</strong>
          </div>
        )}
      </div>
      {quantidadeLinhas ? (
        <div className="relatorio-visualizacao-tabela-wrapper">
          <table className="relatorio-visualizacao-tabela">
            <thead>
              <tr>
                {colunas.map((coluna) => (
                  <th key={coluna.chave} className={coluna.numerica ? "coluna-numerica" : ""}>{coluna.titulo}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dadosPagina.map((item, indice) => (
                <tr key={`${relatorio.id}-${(pagina - 1) * LINHAS_POR_PAGINA + indice}`}>
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
        {mostrarContagem && <span>Exibindo {inicio} a {fim} de {quantidadeLinhas} linha(s)</span>}
        <span>Visualização atualizada conforme os filtros</span>
      </div>
      {quantidadeLinhas > LINHAS_POR_PAGINA && (
        <Paginacao
          paginaAtual={pagina}
          totalItens={quantidadeLinhas}
          itensPorPagina={LINHAS_POR_PAGINA}
          onChangePagina={setPaginaAtual}
        />
      )}
    </section>
  );
}
