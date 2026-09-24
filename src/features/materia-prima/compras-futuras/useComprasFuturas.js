import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  buscarComprasFuturas,
  confirmarChegadaCompraFutura as confirmarChegadaCompraFuturaService,
  excluirCompraFutura as excluirCompraFuturaService,
  salvarCompraFutura as salvarCompraFuturaService,
} from "./comprasFuturasService";

export default function useComprasFuturas({
  carregar = true,
} = {}) {
  const [compras, setCompras] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [fornecedorMateriais, setFornecedorMateriais] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvandoId, setSalvandoId] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [excluindoId, setExcluindoId] = useState(null);
  const [confirmandoChegada, setConfirmandoChegada] = useState(false);
  const [confirmandoChegadaId, setConfirmandoChegadaId] = useState(null);

  const carregarCompras = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resultado = await buscarComprasFuturas();

      setCompras(
        Array.isArray(resultado?.compras)
          ? resultado.compras
          : [],
      );

      setFornecedores(
        Array.isArray(resultado?.fornecedores)
          ? resultado.fornecedores
          : [],
      );

      setMateriais(
        Array.isArray(resultado?.materiais)
          ? resultado.materiais
          : [],
      );

      setFornecedorMateriais(
        Array.isArray(resultado?.fornecedorMateriais)
          ? resultado.fornecedorMateriais
          : [],
      );

      setCarregado(true);
    } catch (error) {
      console.error(
        "Erro ao carregar compras futuras:",
        error,
      );

      setCompras([]);
      setFornecedores([]);
      setMateriais([]);
      setFornecedorMateriais([]);
      setErro(
        error?.message ||
        "Não foi possível carregar as compras futuras.",
      );
      setCarregado(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (!carregar || carregado || carregando) {
      return;
    }

    void carregarCompras();
  }, [
    carregar,
    carregado,
    carregando,
    carregarCompras,
  ]);

  const recarregar = useCallback(async () => {
    await carregarCompras();
  }, [carregarCompras]);

  const salvarCompraFutura = useCallback(
    async (dados) => {
      setSalvando(true);
      setSalvandoId(dados?.id ?? null);

      try {
        const resultado =
          await salvarCompraFuturaService(dados);

        await carregarCompras();

        return resultado;
      } finally {
        setSalvando(false);
        setSalvandoId(null);
      }
    },
    [carregarCompras],
  );

  const confirmarChegadaCompraFutura = useCallback(
    async ({
      id,
      dataRecebimento,
    }) => {
      if (id === null || id === undefined) {
        throw new Error(
          "Compra futura não informada.",
        );
      }

      setConfirmandoChegada(true);
      setConfirmandoChegadaId(id);

      try {
        const resultado =
          await confirmarChegadaCompraFuturaService(
            id,
            dataRecebimento,
          );

        await carregarCompras();

        return resultado;
      } finally {
        setConfirmandoChegada(false);
        setConfirmandoChegadaId(null);
      }
    },
    [carregarCompras],
  );

  const excluirCompraFutura = useCallback(
    async (id) => {
      if (id === null || id === undefined) {
        throw new Error(
          "Compra futura não informada.",
        );
      }

      setExcluindo(true);
      setExcluindoId(id);

      try {
        const resultado =
          await excluirCompraFuturaService(id);

        await carregarCompras();

        return resultado;
      } finally {
        setExcluindo(false);
        setExcluindoId(null);
      }
    },
    [carregarCompras],
  );

  const compraEstaSalvando = useCallback(
    (id) => {
      if (!salvando) return false;

      if (id === null || id === undefined) {
        return salvandoId === null;
      }

      return String(id) === String(salvandoId);
    },
    [salvando, salvandoId],
  );

  const compraEstaExcluindo = useCallback(
    (id) => {
      if (!excluindo) return false;

      return String(id) === String(excluindoId);
    },
    [excluindo, excluindoId],
  );

  const compraEstaConfirmandoChegada = useCallback(
    (id) => {
      if (!confirmandoChegada) return false;

      return String(id) === String(confirmandoChegadaId);
    },
    [
      confirmandoChegada,
      confirmandoChegadaId,
    ],
  );

  return {
    compras,
    fornecedores,
    materiais,
    fornecedorMateriais,
    carregando,
    carregado,
    erro,
    salvando,
    excluindo,
    confirmandoChegada,
    recarregar,
    salvarCompraFutura,
    confirmarChegadaCompraFutura,
    excluirCompraFutura,
    compraEstaSalvando,
    compraEstaExcluindo,
    compraEstaConfirmandoChegada,
  };
}
