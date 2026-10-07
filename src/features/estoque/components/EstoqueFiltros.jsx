import {
  Search,
} from "lucide-react";

import LimparFiltrosButton
  from "@/components/ui/LimparFiltrosButton";

import {
  LOCAL_TODOS,
  SITUACAO_ESTOQUE,
} from "../constants/estoque.constants";


export default function EstoqueFiltros({
  locais = [],

  localSelecionado,

  pesquisa,

  situacao,

  possuiFiltrosAtivos,

  onAlterarLocal,

  onAlterarPesquisa,

  onAlterarSituacao,

  onLimparFiltros,
}) {
  return (
    <section
      className="estoque-filtros"
      aria-label="Filtros do estoque"
    >

      {/* =================================================
          LOCAL
      ================================================= */}

      <label className="estoque-campo estoque-campo--local">

        <span>
          Local de estoque
        </span>


        <select
          value={
            localSelecionado
          }
          onChange={(
            evento,
          ) =>
            onAlterarLocal(
              evento
                .target
                .value,
            )
          }
          disabled={
            locais.length ===
            0
          }
        >

          {locais.map(
            (local) => (
              <option
                key={
                  local.codigoLocalEstoque
                }
                value={
                  String(
                    local.codigoLocalEstoque,
                  )
                }
              >
                {
                  local.codigo
                }{" "}
                —{" "}
                {
                  local.descricao
                }
              </option>
            ),
          )}


          <option
            value={
              LOCAL_TODOS
            }
          >
            Todos os locais ativos
          </option>

        </select>

      </label>


      {/* =================================================
          PESQUISA
      ================================================= */}

      <label className="estoque-campo estoque-campo--pesquisa">

        <span>
          Buscar produto
        </span>


        <div className="estoque-pesquisa">

          <Search
            size={17}
          />


          <input
            type="text"
            value={
              pesquisa
            }
            onChange={(
              evento,
            ) =>
              onAlterarPesquisa(
                evento
                  .target
                  .value,
              )
            }
            placeholder="Código ou descrição..."
            autoComplete="off"
          />

        </div>

      </label>


      {/* =================================================
          SITUAÇÃO
      ================================================= */}

      <label className="estoque-campo estoque-campo--situacao">

        <span>
          Situação
        </span>


        <select
          value={
            situacao
          }
          onChange={(
            evento,
          ) =>
            onAlterarSituacao(
              evento
                .target
                .value,
            )
          }
        >

          <option
            value={
              SITUACAO_ESTOQUE
                .TODOS
            }
          >
            Todos
          </option>


          <option
            value={
              SITUACAO_ESTOQUE
                .COM_SALDO
            }
          >
            Com saldo
          </option>


          <option
            value={
              SITUACAO_ESTOQUE
                .SEM_SALDO
            }
          >
            Sem saldo
          </option>

        </select>

      </label>


      {/* =================================================
          LIMPAR
      ================================================= */}

      <div className="estoque-campo estoque-campo--limpar">

        <span
          aria-hidden="true"
        >
          &nbsp;
        </span>


        <LimparFiltrosButton
          ativo={
            possuiFiltrosAtivos
          }
          onClick={
            onLimparFiltros
          }
        />

      </div>

    </section>
  );
}