
import { FiRefreshCcw, FiSearch } from "react-icons/fi";

import "@/components/filtros/Filtros.css";

import { PERIODOS_MEDIA, PERIODO_PADRAO } from "../constants/tabelaPrecos.constants";

export default function TabelaPrecosFiltros({
  busca = "",
  onBuscaChange,
  ordenacao = "descricao",
  onOrdenacaoChange,
  periodo = PERIODO_PADRAO,
  onPeriodoChange,
  onLimpar,
}) {
  const temFiltros =
    String(busca).trim() !== "" ||
    ordenacao !== "descricao" ||
    periodo !== PERIODO_PADRAO;

  return (
    <div className="tp-filtros">
      <div className="tp-filtro tp-filtro--busca">
        <label htmlFor="tp-busca">
          Buscar material
        </label>

        <div className="tp-busca">
          <FiSearch size={17} aria-hidden="true" />

          <input
            id="tp-busca"
            type="search"
            value={busca}
            onChange={(evento) =>
              onBuscaChange(evento.target.value)
            }
            placeholder="Buscar código ou material..."
            autoComplete="off"
          />
        </div>
      </div>

      <div className="tp-filtro tp-filtro--ordenacao">
        <label htmlFor="tp-ordenacao">
          Ordenar por
        </label>

        <select
          id="tp-ordenacao"
          className="tp-select"
          value={ordenacao}
          onChange={(evento) =>
            onOrdenacaoChange(evento.target.value)
          }
        >
          <option value="descricao">
            Material (A-Z)
          </option>

          <option value="ultima_compra">
            Última compra
          </option>

          <option value="maior_preco">
            Maior preço
          </option>

          <option value="menor_preco">
            Menor preço
          </option>
        </select>
      </div>

      <div className="tp-filtro tp-filtro--periodo">
        <span id="tp-periodo-rotulo">Média dos últimos</span>

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

      <button
        type="button"
        className={`filtros-compartilhados-limpar ${
          temFiltros ? "filtros-limpar-ativo" : ""
        }`}
        onClick={onLimpar}
        disabled={!temFiltros}
        aria-label="Limpar filtros da tabela de preços"
      >
        <FiRefreshCcw size={15} aria-hidden="true" />
        Limpar filtros
      </button>
    </div>
  );
}
