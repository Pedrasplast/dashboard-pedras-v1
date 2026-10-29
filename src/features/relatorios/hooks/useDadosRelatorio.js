import { useMemo } from "react";

import { useCargaMaquina, useDescricoesProdutos } from "@/lib/cargaMaquina";
import { usePedidosSupabase } from "@/features/pedidos/usePedidosSupabase";

import {
  associarDescricaoProduto,
  contarRegistrosRelatorio,
  filtrarDadosRelatorio,
  listarMpsDisponiveis,
  listarProdutosDisponiveis,
  listarTiposDisponiveis,
  montarColunasVisualizacao,
} from "../utils/filtrosRelatorio";

const ID_PRODUCAO_PRODUTO = "producao-produto";

/**
 * Dados do relatório aberto: escolhe a fonte (produção, pedidos ou nenhuma,
 * nos relatórios customizados), aplica os filtros e a transformação do
 * relatório e devolve as listas usadas pelos filtros da tela.
 */
export function useDadosRelatorio({
  relatorioSelecionado,
  relatorioSelecionadoId,
  dadosExternos,
  filtros,
}) {
  const fonteEhPedidos = relatorioSelecionado?.fonteDados === "pedidos";

  const relatorioEhCustom =
    relatorioSelecionado?.tipoRelatorio === "custom" ||
    relatorioSelecionado?.fonteDados === "custom";

  /* Produção */

  const temDadosExternos = Array.isArray(dadosExternos) && dadosExternos.length > 0;

  const { dados: dadosProducao, loading: carregandoProducao } = useCargaMaquina({
    enabled:
      Boolean(relatorioSelecionado) && !temDadosExternos && !fonteEhPedidos && !relatorioEhCustom,
  });

  const dadosProducaoBrutos = temDadosExternos ? dadosExternos : dadosProducao;

  /* Pedidos */

  const {
    pedidos: pedidosBrutos,
    error: erroPedidos,
    isLoading: carregandoPedidos,
  } = usePedidosSupabase({
    enabled: fonteEhPedidos,
    staleTime: 30 * 1000,
  });

  const dadosBrutos = useMemo(
    () =>
      relatorioEhCustom
        ? []
        : fonteEhPedidos
          ? pedidosBrutos
          : Array.isArray(dadosProducaoBrutos)
            ? dadosProducaoBrutos
            : [],
    [relatorioEhCustom, fonteEhPedidos, pedidosBrutos, dadosProducaoBrutos],
  );

  const loading = relatorioEhCustom
    ? false
    : fonteEhPedidos
      ? carregandoPedidos
      : relatorioSelecionado
        ? carregandoProducao
        : false;

  /* Descrições dos produtos (Estoque OMIE + Parâmetros) */

  const { descricoesProdutos, loadingDescricoes, erroDescricoes } = useDescricoesProdutos({
    enabled: !relatorioEhCustom && relatorioSelecionadoId === ID_PRODUCAO_PRODUTO,
  });

  const carregandoRelatorio =
    loading || (relatorioSelecionadoId === ID_PRODUCAO_PRODUTO && loadingDescricoes);

  /* Colunas e listas dos filtros */

  const colunasVisualizacao = useMemo(
    () => (relatorioEhCustom ? [] : montarColunasVisualizacao(relatorioSelecionado)),
    [relatorioEhCustom, relatorioSelecionado],
  );

  const produtosDisponiveis = useMemo(() => {
    if (fonteEhPedidos || relatorioEhCustom) {
      return [];
    }

    return listarProdutosDisponiveis(dadosBrutos, filtros.injetora);
  }, [dadosBrutos, filtros.injetora, fonteEhPedidos, relatorioEhCustom]);

  const mpsDisponiveis = useMemo(() => {
    if (fonteEhPedidos || relatorioEhCustom || !Array.isArray(dadosBrutos)) {
      return [];
    }

    return listarMpsDisponiveis(dadosBrutos);
  }, [dadosBrutos, fonteEhPedidos, relatorioEhCustom]);

  const tiposDisponiveis = useMemo(() => {
    if (fonteEhPedidos || relatorioEhCustom || !Array.isArray(dadosBrutos)) {
      return [];
    }

    return listarTiposDisponiveis(dadosBrutos);
  }, [dadosBrutos, fonteEhPedidos, relatorioEhCustom]);

  /* Filtrar, transformar e associar descrições */

  const dadosFiltrados = useMemo(
    () =>
      relatorioEhCustom ? [] : filtrarDadosRelatorio(dadosBrutos, relatorioSelecionado, filtros),
    [dadosBrutos, filtros, relatorioEhCustom, relatorioSelecionado],
  );

  const dadosRelatorio = useMemo(() => {
    if (!relatorioSelecionado || relatorioEhCustom) {
      return [];
    }

    if (typeof relatorioSelecionado.transformarDados === "function") {
      return relatorioSelecionado.transformarDados(dadosFiltrados);
    }

    return dadosFiltrados;
  }, [dadosFiltrados, relatorioEhCustom, relatorioSelecionado]);

  const dadosRelatorioFinal = useMemo(() => {
    if (relatorioEhCustom) {
      return [];
    }

    if (relatorioSelecionado?.id !== ID_PRODUCAO_PRODUTO) {
      return dadosRelatorio;
    }

    return associarDescricaoProduto(dadosRelatorio, descricoesProdutos);
  }, [dadosRelatorio, descricoesProdutos, relatorioEhCustom, relatorioSelecionado]);

  /* Contagem original: pedidos em aberto contam números únicos. */
  const totalRegistrosRelatorio = useMemo(
    () => contarRegistrosRelatorio(relatorioSelecionado, dadosRelatorioFinal),
    [relatorioSelecionado, dadosRelatorioFinal],
  );

  return {
    fonteEhPedidos,
    relatorioEhCustom,
    dadosBrutos,
    pedidosBrutos,
    erroPedidos,
    erroDescricoes,
    carregandoRelatorio,
    colunasVisualizacao,
    produtosDisponiveis,
    mpsDisponiveis,
    tiposDisponiveis,
    dadosRelatorioFinal,
    totalRegistrosRelatorio,
  };
}
