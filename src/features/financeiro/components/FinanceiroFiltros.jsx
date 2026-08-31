import {
  memo,
  useMemo,
} from "react";

import {
  mesesFinanceiro,
} from "../utils/financeiro.utils";


function FinanceiroFiltros({
  mes,
  ano,
  tipo,
  anosDisponiveis,
  aoAlterarMes,
  aoAlterarAno,
  aoAlterarTipo,
}) {
  /* =======================================================
     ANOS

     Se ainda estiver carregando, mantém o ano atual
     para evitar o select ficar vazio.
  ======================================================= */

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
          Number(ano),
        ];
      },
      [
        anosDisponiveis,
        ano,
      ],
    );


  return (
    <div className="financeiro-filtros">

      {/* ===================================================
          MÊS
      =================================================== */}

      <div className="financeiro-filtro-grupo">

        <label
          className="financeiro-filtro-label"
          htmlFor="financeiro-mes"
        >
          Mês
        </label>


        <select
          id="financeiro-mes"
          className="financeiro-filtro-select"
          value={mes}
          onChange={(evento) =>
            aoAlterarMes(
              Number(
                evento.target.value,
              ),
            )
          }
        >

          {mesesFinanceiro.map(
            (item) => (
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


      {/* ===================================================
          ANO
      =================================================== */}

      <div className="financeiro-filtro-grupo">

        <label
          className="financeiro-filtro-label"
          htmlFor="financeiro-ano"
        >
          Ano
        </label>


        <select
          id="financeiro-ano"
          className="financeiro-filtro-select"
          value={ano}
          onChange={(evento) =>
            aoAlterarAno(
              Number(
                evento.target.value,
              ),
            )
          }
        >

          {anos.map(
            (itemAno) => (
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


      {/* ===================================================
          TIPO
      =================================================== */}

      <div className="financeiro-filtro-grupo">

        <label
          className="financeiro-filtro-label"
          htmlFor="financeiro-tipo"
        >
          Tipo
        </label>


        <select
          id="financeiro-tipo"
          className="financeiro-filtro-select"
          value={tipo}
          onChange={(evento) =>
            aoAlterarTipo(
              evento.target.value,
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

    </div>
  );
}


export default memo(
  FinanceiroFiltros,
);