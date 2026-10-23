import {
  RotateCcw,
} from "lucide-react";

import "./DashboardMateriaPrimaFiltros.css";

import {
  ORIGEM_OMIE,
  ORIGENS_DADOS,
} from "../origemOmie.js";


export default function DashboardMateriaPrimaFiltros({
  dataInicial,
  dataFinal,
  tipoData,
  origem = ORIGEM_OMIE,
  fornecedorSelecionado,
  materialSelecionado,
  fornecedores,
  materiais,
  materialPadrao = "1",
  periodoPadrao = { dataInicial: "", dataFinal: "" },
  onDataInicialChange,
  onDataFinalChange,
  onTipoDataChange,
  onOrigemChange,
  onFornecedorChange,
  onMaterialChange,
  onPeriodoRapido,
  onLimparFiltros,
}) {
  const estadoPadrao =
    (dataInicial || "") ===
      periodoPadrao.dataInicial &&
    (dataFinal || "") ===
      periodoPadrao.dataFinal &&
    tipoData ===
      "compra" &&
    origem ===
      ORIGEM_OMIE &&
    fornecedorSelecionado ===
      "todos" &&
    String(
      materialSelecionado,
    ) ===
      String(
        materialPadrao,
      );

  return (
    <section className="dmp-filtros-card">

      <div className="dmp-filtros-topo">

        <label className="dmp-filtro-tipo-data">

          <span className="dmp-filtro-titulo">
            Origem dos dados
          </span>

          <select
            className="dmp-select-tipo-data"
            value={
              origem
            }
            onChange={
              (
                event,
              ) =>
                onOrigemChange?.(
                  event.target.value,
                )
            }
          >
            {ORIGENS_DADOS.map(
              (
                opcao,
              ) => (
                <option
                  key={
                    opcao.value
                  }
                  value={
                    opcao.value
                  }
                >
                  {opcao.label}
                </option>
              ),
            )}
          </select>

        </label>

        <label className="dmp-filtro-tipo-data">

          <span className="dmp-filtro-titulo">
            Filtrar período por
          </span>

          <select
            className="dmp-select-tipo-data"
            value={
              tipoData
            }
            onChange={
              (
                event,
              ) =>
                onTipoDataChange(
                  event.target.value,
                )
            }
          >

            <option value="compra">
              Data da compra
            </option>

            <option value="recebimento">
              Data de recebimento (entrega)
            </option>

          </select>

        </label>


        <div className="dmp-periodo-rapido-grupo">

          <span className="dmp-filtro-titulo">
            Período rápido
          </span>

          <div className="dmp-filtros-rapidos">

            {[7, 15, 30, 60].map(
              (
                dias,
              ) => (

                <button
                  type="button"
                  key={
                    dias
                  }
                  onClick={
                    () =>
                      onPeriodoRapido(
                        dias,
                      )
                  }
                >
                  Últimos {dias} dias
                </button>

              ),
            )}

          </div>

        </div>

      </div>


      <div className="dmp-filtros-info">

        <button
          type="button"
          className="dmp-btn-limpar"
          onClick={
            onLimparFiltros
          }
          disabled={
            estadoPadrao
          }
          title={
            estadoPadrao
              ? "Não há filtros para limpar"
              : "Voltar todos os filtros ao padrão"
          }
        >

          <RotateCcw
            size={14}
            aria-hidden="true"
          />

          Limpar filtros

        </button>

      </div>


      <div className="dmp-filtros">

        <label className="dmp-filtro dmp-filtro-data">

          <span>
            De
          </span>

          <input
            type="date"
            value={
              dataInicial
            }
            onChange={
              (
                event,
              ) =>
                onDataInicialChange(
                  event.target.value,
                )
            }
          />

        </label>


        <label className="dmp-filtro dmp-filtro-data">

          <span>
            Até
          </span>

          <input
            type="date"
            value={
              dataFinal
            }
            onChange={
              (
                event,
              ) =>
                onDataFinalChange(
                  event.target.value,
                )
            }
          />

        </label>


        <label className="dmp-filtro dmp-filtro-material">

          <span>
            Material
          </span>

          <select
            value={
              materialSelecionado
            }
            onChange={
              (
                event,
              ) =>
                onMaterialChange(
                  event.target.value,
                )
            }
          >

            <option value="todos">
              Todos os materiais
            </option>

            {materiais.map(
              (
                item,
              ) => (

                <option
                  key={
                    item.materialId
                  }
                  value={
                    item.materialId
                  }
                >
                  {item.tipoMaterial}
                </option>

              ),
            )}

          </select>

        </label>


        <label className="dmp-filtro dmp-filtro-fornecedor">

          <span>
            Fornecedor
          </span>

          <select
            value={
              fornecedorSelecionado
            }
            onChange={
              (
                event,
              ) =>
                onFornecedorChange(
                  event.target.value,
                )
            }
          >

            <option value="todos">
              Todos os fornecedores
            </option>

            {fornecedores.map(
              (
                item,
              ) => (

                <option
                  key={
                    item.fornecedorId
                  }
                  value={
                    item.fornecedorId
                  }
                >
                  {item.fornecedorNome}
                </option>

              ),
            )}

          </select>

        </label>

      </div>

    </section>
  );
}