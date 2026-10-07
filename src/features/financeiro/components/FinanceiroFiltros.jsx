import {
  memo,
  useMemo,
} from "react";

import {
  Search,
  X,
} from "lucide-react";

import LimparFiltrosButton
  from "@/components/ui/LimparFiltrosButton";

import {
  mesesFinanceiro,
} from "../utils/financeiro.utils";

import "./FinanceiroFiltros.css";


function FinanceiroFiltros({
  mes,
  ano,
  tipo,

  categoria =
    "todas",

  busca =
    "",

  categoriasDisponiveis =
    [],

  anosDisponiveis,

  possuiFiltroAdicional =
    false,

  aoAlterarMes,
  aoAlterarAno,
  aoAlterarTipo,
  aoAlterarCategoria,
  aoAlterarBusca,
  aoLimparFiltros,
}) {
  const anos =
    useMemo(
      () => {
        if (
          Array.isArray(
            anosDisponiveis,
          ) &&
          anosDisponiveis.length >
            0
        ) {
          return anosDisponiveis;
        }


        return [
          Number(
            ano,
          ),
        ];
      },
      [
        anosDisponiveis,
        ano,
      ],
    );


  const categorias =
    Array.isArray(
      categoriasDisponiveis,
    )
      ? categoriasDisponiveis
      : [];


  return (
    <div className="financeiro-filtros">

      <div
        className="
          financeiro-filtro-grupo
          financeiro-filtro-grupo-mes
        "
      >
        <label
          className="financeiro-filtro-label"
          htmlFor="financeiro-mes"
        >
          Mês
        </label>


        <select
          id="financeiro-mes"
          className="financeiro-filtro-select"
          value={
            mes
          }
          onChange={
            (
              evento,
            ) =>
              aoAlterarMes(
                Number(
                  evento
                    .target
                    .value,
                ),
              )
          }
        >
          {mesesFinanceiro.map(
            (
              item,
            ) => (
              <option
                key={
                  item.valor
                }
                value={
                  item.valor
                }
              >
                {item.nome}
              </option>
            ),
          )}
        </select>
      </div>


      <div
        className="
          financeiro-filtro-grupo
          financeiro-filtro-grupo-ano
        "
      >
        <label
          className="financeiro-filtro-label"
          htmlFor="financeiro-ano"
        >
          Ano
        </label>


        <select
          id="financeiro-ano"
          className="financeiro-filtro-select"
          value={
            ano
          }
          onChange={
            (
              evento,
            ) =>
              aoAlterarAno(
                Number(
                  evento
                    .target
                    .value,
                ),
              )
          }
        >
          {anos.map(
            (
              itemAno,
            ) => (
              <option
                key={
                  itemAno
                }
                value={
                  itemAno
                }
              >
                {itemAno}
              </option>
            ),
          )}
        </select>
      </div>


      <div
        className="
          financeiro-filtro-grupo
          financeiro-filtro-grupo-tipo
        "
      >
        <label
          className="financeiro-filtro-label"
          htmlFor="financeiro-tipo"
        >
          Tipo
        </label>


        <select
          id="financeiro-tipo"
          className="financeiro-filtro-select"
          value={
            tipo
          }
          onChange={
            (
              evento,
            ) =>
              aoAlterarTipo(
                evento
                  .target
                  .value,
              )
          }
        >
          <option value="todos">
            Todos
          </option>

          <option value="receitas">
            Receitas
          </option>

          <option value="despesas">
            Despesas
          </option>
        </select>
      </div>


      <div
        className="
          financeiro-filtro-grupo
          financeiro-filtro-grupo-categoria
        "
      >
        <label
          className="financeiro-filtro-label"
          htmlFor="financeiro-categoria"
        >
          Categoria
        </label>


        <select
          id="financeiro-categoria"
          className="financeiro-filtro-select"
          value={
            categoria
          }
          onChange={
            (
              evento,
            ) =>
              aoAlterarCategoria(
                evento
                  .target
                  .value,
              )
          }
        >
          <option value="todas">
            Todas as categorias
          </option>


          {categorias.map(
            (
              item,
            ) => (
              <option
                key={
                  item.valor
                }
                value={
                  item.valor
                }
              >
                {item.label}
              </option>
            ),
          )}
        </select>
      </div>


      <div
        className="
          financeiro-filtro-grupo
          financeiro-filtro-grupo-busca
        "
      >
        <label
          className="financeiro-filtro-label"
          htmlFor="financeiro-busca"
        >
          Buscar
        </label>


        <div className="financeiro-filtro-busca-wrapper">

          <Search
            className="financeiro-filtro-busca-icone"
            size={
              15
            }
            aria-hidden="true"
          />


          <input
            id="financeiro-busca"
            type="search"
            className="
              financeiro-filtro-select
              financeiro-filtro-busca-input
            "
            value={
              busca
            }
            placeholder="Digite código ou categoria..."
            autoComplete="off"
            onChange={
              (
                evento,
              ) =>
                aoAlterarBusca(
                  evento
                    .target
                    .value,
                )
            }
          />


          {Boolean(
            busca,
          ) && (
            <button
              type="button"
              className="financeiro-filtro-busca-limpar"
              aria-label="Limpar pesquisa"
              title="Limpar pesquisa"
              onClick={
                () =>
                  aoAlterarBusca(
                    "",
                  )
              }
            >
              <X
                size={
                  15
                }
              />
            </button>
          )}

        </div>
      </div>


      <div
        className="
          financeiro-filtro-grupo
          financeiro-filtro-grupo-limpar
        "
      >
        <span
          className="
            financeiro-filtro-label
            financeiro-filtro-label-vazio
          "
          aria-hidden="true"
        >
          &nbsp;
        </span>


        <LimparFiltrosButton
          ativo={
            possuiFiltroAdicional
          }
          onClick={
            aoLimparFiltros
          }
        />
      </div>

    </div>
  );
}


export default memo(
  FinanceiroFiltros,
);