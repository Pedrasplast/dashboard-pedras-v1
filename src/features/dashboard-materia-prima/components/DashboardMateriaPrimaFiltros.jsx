import {
  RefreshCw,
} from "lucide-react";


export default function DashboardMateriaPrimaFiltros({
  dataInicial,
  dataFinal,
  fornecedorSelecionado,
  materialSelecionado,
  fornecedores,
  materiais,
  carregando,
  atualizando,
  periodoInvalido,
  onDataInicialChange,
  onDataFinalChange,
  onFornecedorChange,
  onMaterialChange,
  onPeriodoRapido,
  onAtualizar,
}) {
  return (
    <section className="dmp-filtros-card">

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


      <div className="dmp-filtros">

        <label>

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


        <label>

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


        <label>

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


        <label>

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


        <button
          type="button"
          className="dmp-atualizar"
          onClick={
            onAtualizar
          }
          disabled={
            carregando ||
            atualizando ||
            periodoInvalido
          }
        >

          <RefreshCw
            size={16}
            className={
              atualizando
                ? "dmp-girando"
                : ""
            }
          />

          Atualizar

        </button>

      </div>

    </section>
  );
}
