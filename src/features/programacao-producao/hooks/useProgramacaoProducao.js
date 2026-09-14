import { useCallback, useEffect, useMemo, useState } from "react";

import { carregarDadosProgramacaoProducao } from "../services/programacaoProducao.service";
import { montarProgramacao } from "../utils/projecaoProducao.utils";

export function useProgramacaoProducao() {
  const [dados, setDados] = useState({
    pedidos: [],
    estoque: [],
    parametros: [],
    programacoes: [],
    periodos: [],
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState(null);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro("");

    try {
      const novosDados = await carregarDadosProgramacaoProducao();
      setDados(novosDados);
      setAtualizadoEm(new Date());
    } catch (error) {
      console.error("Erro ao carregar programação:", error);
      setErro(error?.message || "Não foi possível carregar a programação.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const programacao = useMemo(
    () => montarProgramacao(dados),
    [dados],
  );

  const resumo = useMemo(() => {
    const pedidosOmie = new Set(
      dados.pedidos
        .filter((pedido) => pedido.status === "Pedido")
        .map((pedido) => pedido.codigo_pedido_omie),
    );

    return {
      pedidosOmie: pedidosOmie.size,
      produtos: programacao.length,
      produtosComFalta: programacao.filter((p) => p.necessidade_producao > 0).length,
      pedidosRisco: programacao.reduce((total, produto) => total + produto.pedidos_risco, 0),
    };
  }, [dados.pedidos, programacao]);

  return {
    programacao,
    resumo,
    loading,
    erro,
    atualizadoEm,
    carregarDados,
  };
}
