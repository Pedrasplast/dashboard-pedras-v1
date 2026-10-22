import { FiRefreshCcw, FiSearch } from "react-icons/fi";

import { CampoFiltro } from "@/components/filtros";
import "@/components/filtros/Filtros.css";

import {
  ORDENACAO_PADRAO,
  ORDENACOES_PRECOS,
  PERIODOS_MEDIA,
  PERIODO_PADRAO,
} from "../constants/tabelaPrecos.constants";

/* =========================================================
   FILTROS — TABELA DE PREÇOS
   Busca, ordenação e período da média (30 / 45 / 60 dias),
   com os campos padrão do Design System (CampoFiltro).
========================================================= */

export default function TabelaPrecosFiltros({
  busca = "",
  onBuscaChange,
  ordenacao = ORDENACAO_PADRAO,
  onOrdenacaoChange,
  periodo = PERIODO_PADRAO,
  onPeriodoChange,
  onLimpar,
}) {
  const temFiltros =
    String(busca).trim() !== "" || ordenacao !== ORDENACAO_PADRAO || periodo !== PERIODO_PADRAO;

  return (
    <div className="tp-filtros" role="search" aria-label="Filtros da tabela de preços">
      <CampoFiltro titulo="Buscar material" className="tp-filtro tp-filtro--busca">
        <div className="tp-busca">
          <FiSearch size={16} aria-hidden="true" />

          <input
            id="tp-busca"
            type="search"
            value={busca}
            onChange={(evento) => onBuscaChange(evento.target.value)}
            placeholder="Código ou material..."
            autoComplete="off"
          />
        </div>
      </CampoFiltro>

      <CampoFiltro titulo="Ordenar por" className="tp-filtro tp-filtro--ordenacao">
        <select
          id="tp-ordenacao"
          className="tp-select"
          value={ordenacao}
          onChange={(evento) => onOrdenacaoChange(evento.target.value)}
        >
          {ORDENACOES_PRECOS.map((opcao) => (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label}
            </option>
          ))}
        </select>
      </CampoFiltro>

      <div className="campo-filtro tp-filtro tp-filtro--periodo">
        <span className="campo-filtro__label" id="tp-periodo-rotulo">
          Média dos últimos
        </span>

        <div className="tp-periodos" role="group" aria-labelledby="tp-periodo-rotulo">
          {PERIODOS_MEDIA.map((dias) => (
            <button
              key={dias}
              type="button"
              className={`tp-periodo ${periodo === dias ? "tp-periodo--ativo" : ""}`}
              aria-pressed={periodo === dias}
              onClick={() => onPeriodoChange(dias)}
            >
              {dias} dias
            </button>
          ))}
        </div>
      </div>

      <div className="tp-acoes-filtros">
        <button
          type="button"
          className={`filtros-compartilhados-limpar ${temFiltros ? "filtros-limpar-ativo" : ""}`}
          onClick={onLimpar}
          disabled={!temFiltros}
          aria-label="Limpar filtros da tabela de preços"
        >
          <FiRefreshCcw size={15} aria-hidden="true" />
          Limpar filtros
        </button>
      </div>
    </div>
  );
}
