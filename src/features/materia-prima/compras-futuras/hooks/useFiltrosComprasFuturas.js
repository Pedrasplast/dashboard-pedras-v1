import { useMemo, useState } from "react";

import {
  FILTROS_INICIAIS,
  extrairOpcoes,
  extrairTipos,
  filtrarAbertas,
  filtrarCompras,
} from "../utils/comprasFuturasUtils";

/**
 * Compras em aberto + estado dos filtros + opções dos selects + lista filtrada.
 */
export default function useFiltrosComprasFuturas(compras) {
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);

  function alterarFiltro(campo, valor) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
  }

  const abertas = useMemo(() => filtrarAbertas(compras), [compras]);

  const opcoes = useMemo(
    () => ({
      fornecedores: extrairOpcoes(
        abertas,
        "fornecedorId",
        "fornecedorNome",
        "Fornecedor não encontrado",
      ),
      materiais: extrairOpcoes(abertas, "materialId", "materialNome", "Material não encontrado"),
      tipos: extrairTipos(abertas),
    }),
    [abertas],
  );

  const filtradas = useMemo(() => filtrarCompras(abertas, filtros), [abertas, filtros]);

  return {
    filtros,
    alterarFiltro,
    opcoes,
    filtradas,
  };
}
