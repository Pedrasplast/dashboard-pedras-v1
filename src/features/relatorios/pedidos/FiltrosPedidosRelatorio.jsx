import {
  useMemo,
} from "react";

import {
  FiFilter,
  FiX,
} from "react-icons/fi";

import "./FiltrosPedidosRelatorio.css";


/* =========================================================
   FILTROS LIMPOS
========================================================= */

function obterFiltrosLimpos(relatorio) {
  return {
    dataInicio: "",
    dataFim: "",

    injetora: "Todos",

    cod_prod: "Todos",

    mp: "Todos",

    tipo: [],

    status:
      relatorio?.filtros?.status
        ? "Pedido"
        : "todos",

    cliente: "todos",

    vendedor: "todos",
  };
}


/* =========================================================
   COMPONENTE
========================================================= */

export default function FiltrosPedidosRelatorio({
  filtros,
  setFiltros,
  pedidos = [],
  relatorio,
}) {


  /* =====================================================
     CLIENTES
  ===================================================== */

  const clientes =
    useMemo(
      () => [
        ...new Set(
          pedidos
            .map(
              (item) =>
                item?.cliente,
            )
            .filter(Boolean),
        ),
      ].sort(
        (a, b) =>
          String(a).localeCompare(
            String(b),
            "pt-BR",
          ),
      ),
      [pedidos],
    );


  /* =====================================================
     VENDEDORES
  ===================================================== */

  const vendedores =
    useMemo(
      () => [
        ...new Set(
          pedidos
            .map(
              (item) =>
                item?.vendedor,
            )
            .filter(
              (valor) =>
                valor &&
                valor !== "-",
            ),
        ),
      ].sort(
        (a, b) =>
          String(a).localeCompare(
            String(b),
            "pt-BR",
          ),
      ),
      [pedidos],
    );


  /* =====================================================
     PRODUTOS
  ===================================================== */

  const produtos =
    useMemo(
      () => {

        const mapa =
          new Map();


        for (
          const item of pedidos
        ) {

          const codigo =
            String(
              item?.codigoProduto ??
                item?.codigo_produto ??
                item?.codigo ??
                "",
            ).trim();


          if (!codigo) {
            continue;
          }


          if (
            !mapa.has(codigo)
          ) {

            mapa.set(
              codigo,
              {
                codigo,

                descricao:
                  item?.produto ??
                  item?.descricao_produto ??
                  "",
              },
            );
          }
        }


        return [
          ...mapa.values(),
        ].sort(
          (a, b) =>
            String(
              a.codigo,
            ).localeCompare(
              String(
                b.codigo,
              ),
              "pt-BR",
              {
                numeric: true,
              },
            ),
        );
      },
      [pedidos],
    );


  /* =====================================================
     STATUS
  ===================================================== */

  const statusDisponiveis =
    useMemo(
      () => [
        ...new Set(
          pedidos
            .map(
              (item) =>
                item?.status,
            )
            .filter(Boolean),
        ),
      ].sort(
        (a, b) =>
          String(a).localeCompare(
            String(b),
            "pt-BR",
          ),
      ),
      [pedidos],
    );


  /* =====================================================
     ALTERAR FILTRO
  ===================================================== */

  const alterar =
    (
      campo,
      valor,
    ) => {

      setFiltros(
        (anteriores) => ({
          ...anteriores,

          [campo]:
            valor,
        }),
      );
    };


  /* =====================================================
     VERIFICAR FILTROS ATIVOS
  ===================================================== */

  const possuiFiltro =
    Boolean(
      filtros?.dataInicio,
    ) ||
    Boolean(
      filtros?.dataFim,
    ) ||
    (
      filtros?.cliente &&
      filtros.cliente !== "todos"
    ) ||
    (
      filtros?.vendedor &&
      filtros.vendedor !== "todos"
    ) ||
    (
      filtros?.cod_prod &&
      filtros.cod_prod !== "Todos"
    ) ||
    (
      relatorio?.filtros?.status &&
      filtros?.status &&
      filtros.status !== "Pedido"
    );


  return (
    <div className="rel-pedidos-filtros">


      <div className="rel-pedidos-filtros-titulo">

        <FiFilter />

        <span>
          Filtros dos pedidos
        </span>

      </div>


      <div className="rel-pedidos-filtros-grid">


        {/* =================================================
            PERÍODO
        ================================================= */}

        {relatorio?.filtros?.periodo && (
          <>

            <label className="rel-pedidos-campo">

              <span>
                Previsão de faturamento — de
              </span>

              <input
                type="date"
                value={
                  filtros?.dataInicio ||
                  ""
                }
                onChange={
                  (evento) =>
                    alterar(
                      "dataInicio",
                      evento.target.value,
                    )
                }
              />

            </label>


            <label className="rel-pedidos-campo">

              <span>
                Previsão de faturamento — até
              </span>

              <input
                type="date"
                value={
                  filtros?.dataFim ||
                  ""
                }
                onChange={
                  (evento) =>
                    alterar(
                      "dataFim",
                      evento.target.value,
                    )
                }
              />

            </label>

          </>
        )}


        {/* =================================================
            CLIENTE
        ================================================= */}

        {relatorio?.filtros?.cliente && (

          <label className="rel-pedidos-campo">

            <span>
              Cliente
            </span>

            <select
              value={
                filtros?.cliente ||
                "todos"
              }
              onChange={
                (evento) =>
                  alterar(
                    "cliente",
                    evento.target.value,
                  )
              }
            >

              <option value="todos">
                Todos os clientes
              </option>

              {clientes.map(
                (cliente) => (

                  <option
                    key={cliente}
                    value={cliente}
                  >
                    {cliente}
                  </option>

                ),
              )}

            </select>

          </label>
        )}


        {/* =================================================
            VENDEDOR
        ================================================= */}

        {relatorio?.filtros?.vendedor && (

          <label className="rel-pedidos-campo">

            <span>
              Vendedor
            </span>

            <select
              value={
                filtros?.vendedor ||
                "todos"
              }
              onChange={
                (evento) =>
                  alterar(
                    "vendedor",
                    evento.target.value,
                  )
              }
            >

              <option value="todos">
                Todos os vendedores
              </option>

              {vendedores.map(
                (vendedor) => (

                  <option
                    key={vendedor}
                    value={vendedor}
                  >
                    {vendedor}
                  </option>

                ),
              )}

            </select>

          </label>
        )}


        {/* =================================================
            PRODUTO
        ================================================= */}

        {relatorio?.filtros?.produto && (

          <label className="rel-pedidos-campo rel-pedidos-campo-produto">

            <span>
              Código do produto
            </span>

            <select
              value={
                filtros?.cod_prod ||
                "Todos"
              }
              onChange={
                (evento) =>
                  alterar(
                    "cod_prod",
                    evento.target.value,
                  )
              }
            >

              <option value="Todos">
                Todos os produtos
              </option>

              {produtos.map(
                (produto) => (

                  <option
                    key={
                      produto.codigo
                    }
                    value={
                      produto.codigo
                    }
                  >

                    {produto.codigo}

                    {produto.descricao
                      ? ` — ${produto.descricao}`
                      : ""}

                  </option>

                ),
              )}

            </select>

          </label>
        )}


        {/* =================================================
            STATUS
        ================================================= */}

        {relatorio?.filtros?.status && (

          <label className="rel-pedidos-campo">

            <span>
              Status
            </span>

            <select
              value={
                filtros?.status ||
                "Pedido"
              }
              onChange={
                (evento) =>
                  alterar(
                    "status",
                    evento.target.value,
                  )
              }
            >

              <option value="Pedido">
                Pedido
              </option>

              <option value="todos">
                Todos os status
              </option>

              {statusDisponiveis
                .filter(
                  (status) =>
                    status !== "Pedido",
                )
                .map(
                  (status) => (

                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>

                  ),
                )}

            </select>

          </label>
        )}

      </div>


      {/* =================================================
          LIMPAR FILTROS
      ================================================= */}

      {possuiFiltro && (

        <button
          type="button"
          className="rel-pedidos-limpar"
          onClick={
            () =>
              setFiltros(
                obterFiltrosLimpos(
                  relatorio,
                ),
              )
          }
        >

          <FiX />

          Limpar filtros

        </button>

      )}

    </div>
  );
}