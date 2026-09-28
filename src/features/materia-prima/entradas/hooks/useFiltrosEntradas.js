import { useMemo, useState } from "react";

import {
  FILTROS_INICIAIS,
  descreverPeriodo,
  extrairOpcoes,
  extrairTipos,
  filtrarEntradas,
} from "../utils/entradasUtils";

/**
 * Estado dos filtros + opções dos selects + lista filtrada/ordenada.
 */
export default function useFiltrosEntradas(entradas) {
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);

  function alterarFiltro(campo, valor) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
  }

  function limparFiltros() {
    setFiltros(FILTROS_INICIAIS);
  }

  const possuiFiltroAtivo = Object.keys(FILTROS_INICIAIS).some(
    (campo) => filtros[campo] !== FILTROS_INICIAIS[campo],
  );

  const opcoes = useMemo(
    () => ({
      fornecedores: extrairOpcoes(
        entradas,
        "fornecedorId",
        "fornecedorNome",
        "Fornecedor não encontrado",
      ),
      materiais: extrairOpcoes(entradas, "materialId", "materialNome", "Material não encontrado"),
      tipos: extrairTipos(entradas),
    }),
    [entradas],
  );

  const descricaoPeriodo = useMemo(() => descreverPeriodo(filtros), [filtros]);

  const filtradas = useMemo(() => filtrarEntradas(entradas, filtros), [entradas, filtros]);

  return {
    filtros,
    alterarFiltro,
    limparFiltros,
    possuiFiltroAtivo,
    opcoes,
    descricaoPeriodo,
    filtradas,
  };
}
