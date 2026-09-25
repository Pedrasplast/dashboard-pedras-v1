import {
  X,
} from "lucide-react";

import "./DashboardMateriaPrimaFiltros.css";


export default function DashboardMateriaPrimaFiltros({
  dataInicial,
  dataFinal,
  tipoData,
  fornecedorSelecionado,
  materialSelecionado,
  fornecedores,
  materiais,
  materialPadrao = "1",
  onDataInicialChange,
  onDataFinalChange,
  onTipoDataChange,
  onFornecedorChange,
  onMaterialChange,
  onPeriodoRapido,
  onLimparFiltros,
}) {
  const semPeriodo =
    !dataInicial &&
    !dataFinal;

  const periodoAberto =
    !semPeriodo &&
    (
      !dataInicial ||
      !dataFinal
    );

  const descricaoPeriodo =
    semPeriodo
      ? tipoData ===
          "recebimento"
        ? "Sem período definido: considerando todo o histórico pela data de recebimento."
        : "Sem período definido: considerando todo o histórico pela data da compra."
      : periodoAberto
        ? tipoData ===
            "recebimento"
          ? "Período aberto: considerando a data de recebimento conforme a data inicial ou final informada."
          : "Período aberto: considerando a data da compra conforme a data inicial ou final informada."
        : tipoData ===
            "recebimento"
          ? "O período considera a data de recebimento efetivo do material."
          : "O período considera a data em que a compra foi realizada.";

  const estadoPadrao =
    !dataInicial &&
    !dataFinal &&
    tipoData ===
      "compra" &&
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

        <div className="dmp-periodo-descricao">
          {descricaoPeriodo}
        </div>


        <button
          type="button"
          className={
            `dmp-btn-limpar${
              estadoPadrao
                ? " dmp-btn-limpar-padrao"
                : ""
            }`
          }
          onClick={
            onLimparFiltros
          }
          title="Voltar todos os filtros ao padrão"
        >

          <X
            size={16}
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