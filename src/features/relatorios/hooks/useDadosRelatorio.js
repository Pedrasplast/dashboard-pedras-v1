import { useMemo } from "react";
import {
  useCargaMaquina,
  useDescricoesProdutos,
  normalizarCodigoProduto,
} from "@/lib/cargaMaquina";
import { usePedidosSupabase } from "@/features/pedidos/usePedidosSupabase";
import { valoresUnicos } from "@/lib/colecoes";
import { filtrarDadosRelatorio } from "../utils/FiltrarDadosRelatorio";

const DADOS_VAZIOS = [];

/** Fonte, opções de filtros e transformação são compartilhadas por tela, PDF e Excel. */
export function useDadosRelatorio({ relatorio, filtros, dadosExternos }) {
  const fonteEhPedidos = relatorio?.fonteDados === "pedidos";
  const relatorioEhCustom = relatorio?.tipoRelatorio === "custom" ||
    relatorio?.fonteDados === "custom";
  const temDadosExternos = Array.isArray(dadosExternos) && dadosExternos.length > 0;

  const { dados: dadosProducao, loading: carregandoProducao } = useCargaMaquina({
    enabled: Boolean(relatorio) && !temDadosExternos && !fonteEhPedidos && !relatorioEhCustom,
  });
  const {
    pedidos: pedidosBrutos,
    error: erroPedidos,
    isLoading: carregandoPedidos,
  } = usePedidosSupabase({ enabled: fonteEhPedidos, staleTime: 30 * 1000 });

  const {
    descricoesProdutos,
    loadingDescricoes,
    erroDescricoes,
  } = useDescricoesProdutos({
    enabled: !relatorioEhCustom && relatorio?.id === "producao-produto",
  });

  const dadosBrutos = relatorioEhCustom ? DADOS_VAZIOS : fonteEhPedidos
    ? pedidosBrutos
    : temDadosExternos ? dadosExternos : dadosProducao;
  const listaBruta = Array.isArray(dadosBrutos) ? dadosBrutos : DADOS_VAZIOS;

  const produtosDisponiveis = useMemo(() => {
    if (fonteEhPedidos || relatorioEhCustom) return [];
    const lista = filtros.injetora && filtros.injetora !== "Todos"
      ? listaBruta.filter((item) =>
        String(item.injetora || "").trim() === String(filtros.injetora).trim()
      ) : listaBruta;
    return valoresUnicos(lista.map((item) => item.cod_prod || item.produto));
  }, [listaBruta, filtros.injetora, fonteEhPedidos, relatorioEhCustom]);

  const mpsDisponiveis = useMemo(() => {
    if (fonteEhPedidos || relatorioEhCustom) return [];
    return valoresUnicos(listaBruta.map((item) => item.mp || item.materia_prima));
  }, [listaBruta, fonteEhPedidos, relatorioEhCustom]);

  const tiposDisponiveis = useMemo(() => {
    if (fonteEhPedidos || relatorioEhCustom) return [];
    return [...new Set(listaBruta
      .map((item) => String(item.tipo ?? "").trim())
      .filter((tipo) => ["1", "2", "3"].includes(tipo))
    )].sort((a, b) => Number(a) - Number(b));
  }, [listaBruta, fonteEhPedidos, relatorioEhCustom]);

  const dadosFiltrados = useMemo(
    () => relatorioEhCustom ? [] : filtrarDadosRelatorio(listaBruta, relatorio, filtros),
    [listaBruta, relatorio, filtros, relatorioEhCustom]
  );

  const dadosRelatorio = useMemo(() => {
    if (!relatorio || relatorioEhCustom) return [];
    return typeof relatorio.transformarDados === "function"
      ? relatorio.transformarDados(dadosFiltrados)
      : dadosFiltrados;
  }, [relatorio, relatorioEhCustom, dadosFiltrados]);

  const dadosRelatorioFinal = useMemo(() => {
    if (relatorioEhCustom || relatorio?.id !== "producao-produto") return dadosRelatorio;
    return dadosRelatorio.map((item) => {
      const codigo = normalizarCodigoProduto(
        item.produto || item.cod_prod || item.codigo_produto || ""
      );
      const descricaoCadastrada = descricoesProdutos instanceof Map
        ? descricoesProdutos.get(codigo)
        : descricoesProdutos?.[codigo];
      const descricaoExistente = String(item.descricao_produto ?? "").trim();
      return {
        ...item,
        descricao_produto: descricaoCadastrada ||
          (descricaoExistente && descricaoExistente !== "-" ? descricaoExistente : "-"),
      };
    });
  }, [dadosRelatorio, descricoesProdutos, relatorio, relatorioEhCustom]);

  const carregandoRelatorio = !relatorioEhCustom && (
    (fonteEhPedidos ? carregandoPedidos : Boolean(relatorio) && carregandoProducao) ||
    (relatorio?.id === "producao-produto" && loadingDescricoes)
  );

  return {
    fonteEhPedidos,
    relatorioEhCustom,
    ComponenteCustomizado: relatorioEhCustom ? relatorio?.componenteCustomizado : null,
    dadosBrutos: listaBruta,
    pedidosBrutos,
    erroPedidos,
    erroDescricoes,
    produtosDisponiveis,
    mpsDisponiveis,
    tiposDisponiveis,
    dadosRelatorioFinal,
    carregandoRelatorio,
  };
}
