import { useEffect, useMemo, useState } from "react";

/**
 * Paginação genérica.
 * @param itens         lista completa
 * @param itensPorPagina tamanho da página
 * @param chaveReinicio  quando muda, volta para a página 1 (ex.: objeto de filtros)
 */
export default function usePaginacao(itens, itensPorPagina, chaveReinicio) {
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    setPaginaAtual(1);
  }, [chaveReinicio]);

  const totalItens = itens.length;

  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));

  const paginaValida = Math.max(1, Math.min(paginaAtual, totalPaginas));

  useEffect(() => {
    if (paginaAtual !== paginaValida) {
      setPaginaAtual(paginaValida);
    }
  }, [paginaAtual, paginaValida]);

  const itensDaPagina = useMemo(() => {
    const inicio = (paginaValida - 1) * itensPorPagina;

    return itens.slice(inicio, inicio + itensPorPagina);
  }, [itens, paginaValida, itensPorPagina]);

  return {
    paginaAtual: paginaValida,
    setPaginaAtual,
    totalItens,
    totalPaginas,
    itensDaPagina,
  };
}
