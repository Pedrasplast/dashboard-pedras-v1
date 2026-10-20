
import { Search, X } from "lucide-react";

import {
  ORDENACOES_PRECOS,
} from "../constants/tabelaPrecos.constants";

/* =========================================================
   FILTROS DA TABELA DE PREÇOS

   Componente controlado pela página.
========================================================= */

export default function TabelaPrecosFiltros({
  busca,
  onBuscaChange,
  ordenacao,
  onOrdenacaoChange,
  onLimpar,
}) {
  const possuiFiltros =
    busca.trim().length > 0 ||
    ordenacao !== "descricao";

  return (
    <div className="tp-filtros">
      <label className="tp-busca">
        <Search size={17} aria-hidden="true" />

        <input
          type="search"
          value={busca}
          onChange={(event) =>
            onBuscaChange(event.target.value)
          }
          placeholder="Buscar código ou material..."
          aria-label="Buscar materiais"
        />
      </label>

      <select
        className="tp-select"
        value={ordenacao}
        onChange={(event) =>
          onOrdenacaoChange(event.target.value)
        }
        aria-label="Ordenar materiais"
      >
        {ORDENACOES_PRECOS.map((opcao) => (
          <option
            key={opcao.value}
            value={opcao.value}
          >
            {opcao.label}
          </option>
        ))}
      </select>

      <button
        className="tp-limpar"
        type="button"
        disabled={!possuiFiltros}
        onClick={onLimpar}
      >
        <X size={16} />
        Limpar
      </button>
    </div>
  );
}
