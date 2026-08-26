import { memo, useMemo } from "react";
import { FiFilter, FiX } from "react-icons/fi";

import CampoFiltro from "@/components/filtros/CampoFiltro";
import Filtros from "@/components/filtros/Filtros";
import { compararPtBR, valoresUnicosOrdenados } from "@/lib/colecoes";

import "./FiltrosPedidosRelatorio.css";

const VALORES_PADRAO_FILTROS_PEDIDOS = Object.freeze({
  dataInicio: "",
  dataFim: "",
  injetora: "Todos",
  cod_prod: "Todos",
  mp: "Todos",
  tipo: [],
  status: "Pedido",
  cliente: "todos",
  vendedor: "todos",
});

function obterCodigoProduto(item) {
  return String(
    item?.codigoProduto ?? item?.codigo_produto ?? item?.codigo ?? "",
  ).trim();
}

function FiltrosPedidosRelatorio({ filtros, setFiltros, pedidos = [], relatorio }) {
  const clientes = useMemo(
    () =>
      valoresUnicosOrdenados(pedidos.map((item) => item?.cliente), {
        comparar: (a, b) => compararPtBR(a, b, { numeric: false }),
      }),
    [pedidos],
  );

  const vendedores = useMemo(
    () =>
      valoresUnicosOrdenados(pedidos.map((item) => item?.vendedor), {
        filtrar: (valor) => Boolean(valor && valor !== "-"),
        comparar: (a, b) => compararPtBR(a, b, { numeric: false }),
      }),
    [pedidos],
  );

  const produtos = useMemo(() => {
    const mapa = new Map();

    for (const item of pedidos) {
      const codigo = obterCodigoProduto(item);
      if (!codigo || mapa.has(codigo)) {
        continue;
      }

      mapa.set(codigo, {
        codigo,
        descricao: item?.produto ?? item?.descricao_produto ?? "",
      });
    }

    return [...mapa.values()].sort((a, b) =>
      compararPtBR(a.codigo, b.codigo, { numeric: true }),
    );
  }, [pedidos]);

  const statusDisponiveis = useMemo(
    () =>
      valoresUnicosOrdenados(pedidos.map((item) => item?.status), {
        comparar: (a, b) => compararPtBR(a, b, { numeric: false }),
      }),
    [pedidos],
  );

  return (
    <Filtros
      filtros={filtros}
      setFiltros={setFiltros}
      valoresPadrao={VALORES_PADRAO_FILTROS_PEDIDOS}
      className="rel-pedidos-filtros"
      mostrarBotaoLimpar
      renderBotaoLimpar={({ limpar }) => (
        <button
          type="button"
          className="rel-pedidos-limpar"
          onClick={limpar}
          title="Limpar todos os filtros"
        >
          <FiX />
          Limpar filtros
        </button>
      )}
    >
      {({ alterar }) => (
        <>
          <div className="rel-pedidos-filtros-titulo">
            <FiFilter />
            <span>Filtros dos pedidos</span>
          </div>

          <div className="rel-pedidos-filtros-grid">
            {relatorio?.filtros?.periodo && (
              <>
                <CampoFiltro titulo="Previsão de faturamento — de" className="rel-pedidos-campo">
                  <input
                    type="date"
                    value={filtros?.dataInicio || ""}
                    onChange={(evento) => alterar("dataInicio", evento.target.value)}
                  />
                </CampoFiltro>

                <CampoFiltro titulo="Previsão de faturamento — até" className="rel-pedidos-campo">
                  <input
                    type="date"
                    value={filtros?.dataFim || ""}
                    onChange={(evento) => alterar("dataFim", evento.target.value)}
                  />
                </CampoFiltro>
              </>
            )}

            {relatorio?.filtros?.cliente && (
              <CampoFiltro titulo="Cliente" className="rel-pedidos-campo">
                <select
                  value={filtros?.cliente || "todos"}
                  onChange={(evento) => alterar("cliente", evento.target.value)}
                >
                  <option value="todos">Todos os clientes</option>
                  {clientes.map((cliente) => (
                    <option key={cliente} value={cliente}>
                      {cliente}
                    </option>
                  ))}
                </select>
              </CampoFiltro>
            )}

            {relatorio?.filtros?.vendedor && (
              <CampoFiltro titulo="Vendedor" className="rel-pedidos-campo">
                <select
                  value={filtros?.vendedor || "todos"}
                  onChange={(evento) => alterar("vendedor", evento.target.value)}
                >
                  <option value="todos">Todos os vendedores</option>
                  {vendedores.map((nomeVendedor) => (
                    <option key={nomeVendedor} value={nomeVendedor}>
                      {nomeVendedor}
                    </option>
                  ))}
                </select>
              </CampoFiltro>
            )}

            {relatorio?.filtros?.produto && (
              <CampoFiltro
                titulo="Código do produto"
                className="rel-pedidos-campo rel-pedidos-campo-produto"
              >
                <select
                  value={filtros?.cod_prod || "Todos"}
                  onChange={(evento) => alterar("cod_prod", evento.target.value)}
                >
                  <option value="Todos">Todos os produtos</option>
                  {produtos.map((produto) => (
                    <option key={produto.codigo} value={produto.codigo}>
                      {produto.codigo}
                      {produto.descricao ? ` — ${produto.descricao}` : ""}
                    </option>
                  ))}
                </select>
              </CampoFiltro>
            )}

            {relatorio?.filtros?.status && (
              <CampoFiltro titulo="Status" className="rel-pedidos-campo">
                <select
                  value={filtros?.status || "Pedido"}
                  onChange={(evento) => alterar("status", evento.target.value)}
                >
                  <option value="Pedido">Pedido</option>
                  <option value="todos">Todos os status</option>
                  {statusDisponiveis
                    .filter((status) => status !== "Pedido")
                    .map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                </select>
              </CampoFiltro>
            )}
          </div>
        </>
      )}
    </Filtros>
  );
}

export default memo(FiltrosPedidosRelatorio);
