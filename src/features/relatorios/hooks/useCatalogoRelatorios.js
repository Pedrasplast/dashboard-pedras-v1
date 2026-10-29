import { useEffect, useMemo, useState } from "react";

import { usePermissoes } from "@/hooks/usePermissoes";
import { normalizarTexto } from "@/shared/lib/texto";

import { RELATORIOS } from "../config/Relatorio.config";

/**
 * Catálogo da Central de Relatórios: só os relatórios que o usuário pode
 * acessar, agrupados por categoria, com o filtro de categoria e a busca.
 */
export function useCatalogoRelatorios() {
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todos");

  const [buscaRelatorios, setBuscaRelatorios] = useState("");

  const { podeAcessarRelatorio, loadingPermissoes, erroPermissoes } = usePermissoes();

  const relatoriosPermitidosIds = useMemo(
    () =>
      new Set(
        RELATORIOS.filter((relatorio) => podeAcessarRelatorio(relatorio.id)).map(
          (relatorio) => relatorio.id,
        ),
      ),
    [podeAcessarRelatorio],
  );

  const erroPermissoesRelatorios = erroPermissoes
    ? erroPermissoes.message || "Não foi possível verificar as permissões dos relatórios."
    : "";

  const relatoriosDisponiveis = useMemo(
    () => RELATORIOS.filter((relatorio) => relatoriosPermitidosIds.has(relatorio.id)),
    [relatoriosPermitidosIds],
  );

  const relatoriosPorCategoria = useMemo(() => {
    const mapa = new Map();

    for (const relatorio of relatoriosDisponiveis) {
      if (!mapa.has(relatorio.categoria)) {
        mapa.set(relatorio.categoria, []);
      }

      mapa.get(relatorio.categoria).push(relatorio);
    }

    return mapa;
  }, [relatoriosDisponiveis]);

  const categorias = useMemo(() => [...relatoriosPorCategoria.keys()], [relatoriosPorCategoria]);

  /* Categorias e contagens consideram só os relatórios permitidos. */
  const categoriasCatalogo = useMemo(
    () => [
      {
        nome: "Todos",
        quantidade: relatoriosDisponiveis.length,
      },

      ...categorias.map((categoria) => ({
        nome: categoria,
        quantidade: relatoriosPorCategoria.get(categoria)?.length || 0,
      })),
    ],
    [categorias, relatoriosDisponiveis.length, relatoriosPorCategoria],
  );

  const relatoriosCatalogo = useMemo(() => {
    const listaBase =
      categoriaSelecionada === "Todos"
        ? relatoriosDisponiveis
        : relatoriosPorCategoria.get(categoriaSelecionada) || [];

    const termo = normalizarTexto(buscaRelatorios).trim();

    if (!termo) {
      return listaBase;
    }

    return listaBase.filter((relatorio) => {
      const conteudo = normalizarTexto(
        [relatorio.categoria, relatorio.titulo, relatorio.descricao].join(" "),
      );

      return conteudo.includes(termo);
    });
  }, [buscaRelatorios, categoriaSelecionada, relatoriosDisponiveis, relatoriosPorCategoria]);

  useEffect(() => {
    if (categoriaSelecionada !== "Todos" && !categorias.includes(categoriaSelecionada)) {
      setCategoriaSelecionada("Todos");
    }
  }, [categoriaSelecionada, categorias]);

  return {
    permissoesCarregadas: !loadingPermissoes,
    relatoriosPermitidosIds,
    erroPermissoesRelatorios,
    relatoriosDisponiveis,
    categoriasCatalogo,
    relatoriosCatalogo,
    categoriaSelecionada,
    setCategoriaSelecionada,
    buscaRelatorios,
    setBuscaRelatorios,
  };
}
