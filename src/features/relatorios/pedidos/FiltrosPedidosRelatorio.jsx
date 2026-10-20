import { memo, useMemo } from "react";
import { FiFilter, FiX } from "react-icons/fi";

import CampoFiltro from "@/components/filtros/CampoFiltro";
import Filtros from "@/components/filtros/Filtros";
import { compararPtBR, valoresUnicosOrdenados } from "@/lib/colecoes";
import { normalizarTexto } from "@/lib/texto";

import { obterDataPedidoRelatorio } from "./PedidosRelatorios";

import "./FiltrosPedidosRelatorio.css";

/* =========================================================
   FILTROS DOS RELATÓRIOS DE PEDIDOS

   As opções de produto são obtidas exclusivamente dos itens
   dos pedidos elegíveis para o relatório atual, considerando:
   - Filtro fixo do relatório;
   - Pedido(s) informado(s);
   - Status;
   - Previsão de faturamento;
   - Cliente;
   - Vendedor.

   O próprio filtro de produto NÃO restringe suas opções.
   A lista de clientes segue as mesmas regras, sem filtrar
   pelo cliente já selecionado.
   Não há novas consultas ao Supabase.
========================================================= */

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
  pedidos: "",
});

function obterCodigoProduto(item) {
  return String(
    item?.codigoProduto ?? item?.codigo_produto ?? item?.codigo ?? "",
  ).trim();
}

function obterNumeroPedidoVisual(item) {
  return String(
    item?.pedidoExibicao ??
      item?.pedido_exibicao ??
      item?.pedido ??
      item?.numero_pedido ??
      item?.codigoPedido ??
      item?.codigo_pedido ??
      "",
  ).trim();
}

function obterNumeroPedidoOriginal(item) {
  return String(
    item?.pedidoOriginal ??
      item?.numero_pedido ??
      item?.pedido ??
      item?.codigoPedido ??
      item?.codigo_pedido ??
      "",
  ).trim();
}

function normalizarListaPedidosFiltro(valor) {
  return String(valor ?? "")
    .split(/[;,\n\r\t ]+/)
    .map((numero) => normalizarTexto(numero.trim()))
    .filter(Boolean);
}

function correspondeAosPedidos(item, pedidosFiltro) {
  if (pedidosFiltro.length === 0) return true;

  const visual = normalizarTexto(obterNumeroPedidoVisual(item));
  const original = normalizarTexto(obterNumeroPedidoOriginal(item));

  return pedidosFiltro.some((numero) =>
    numero.includes("/")
      ? visual === numero
      : original === numero ||
        visual === numero ||
        visual.startsWith(`${numero}/`),
  );
}

/* =========================================================
   ELEGIBILIDADE PARA A LISTA DE PRODUTOS

   Repete as regras do relatório sem usar cod_prod.
   Assim a lista não mostra produtos de pedidos encerrados
   quando o status selecionado é "Pedido".
========================================================= */

function filtrarPedidosParaProdutos(pedidos, filtros, relatorio, { ignorarCliente = false, filtrarProduto = false } = {}) {
  const numerosSelecionados = normalizarListaPedidosFiltro(filtros?.pedidos);

  return pedidos.filter((item) => {
    if (relatorio?.filtroFixo && !relatorio.filtroFixo(item)) {
      return false;
    }

    if (!correspondeAosPedidos(item, numerosSelecionados)) {
      return false;
    }

    if (
      relatorio?.filtros?.status &&
      filtros?.status &&
      filtros.status !== "todos" &&
      normalizarTexto(item?.status) !== normalizarTexto(filtros.status)
    ) {
      return false;
    }

    if (relatorio?.filtros?.periodo) {
      const previsao = obterDataPedidoRelatorio(item);

      if ((filtros?.dataInicio || filtros?.dataFim) && !previsao) {
        return false;
      }

      if (filtros?.dataInicio && previsao < filtros.dataInicio) {
        return false;
      }

      if (filtros?.dataFim && previsao > filtros.dataFim) {
        return false;
      }
    }

    if (
      !ignorarCliente &&
      relatorio?.filtros?.cliente &&
      filtros?.cliente &&
      filtros.cliente !== "todos" &&
      String(item?.cliente || "").trim() !== String(filtros.cliente).trim()
    ) {
      return false;
    }

    if (
      relatorio?.filtros?.vendedor &&
      filtros?.vendedor &&
      filtros.vendedor !== "todos" &&
      String(item?.vendedor || "").trim() !== String(filtros.vendedor).trim()
    ) {
      return false;
    }

    if (
      filtrarProduto &&
      relatorio?.filtros?.produto &&
      filtros?.cod_prod &&
      filtros.cod_prod !== "Todos" &&
      obterCodigoProduto(item) !== String(filtros.cod_prod).trim()
    ) {
      return false;
    }

    return true;
  });
}

function FiltrosPedidosRelatorio({
  filtros,
  setFiltros,
  pedidos = [],
  relatorio,
}) {
  /* Clientes disponíveis: mesmos filtros do relatório, exceto
     o próprio cliente; o produto selecionado também é considerado. */
  const pedidosElegiveisClientes = useMemo(
    () => filtrarPedidosParaProdutos(pedidos, filtros, relatorio, {
      ignorarCliente: true,
      filtrarProduto: true,
    }),
    [pedidos, filtros, relatorio],
  );

  const clientes = useMemo(
    () =>
      valoresUnicosOrdenados(
        pedidosElegiveisClientes.map((item) => item?.cliente),
        {
          filtrar: (valor) => Boolean(valor && valor !== "-"),
          comparar: (a, b) => compararPtBR(a, b, { numeric: false }),
        },
      ),
    [pedidosElegiveisClientes],
  );

  const vendedores = useMemo(
    () =>
      valoresUnicosOrdenados(pedidos.map((item) => item?.vendedor), {
        filtrar: (valor) => Boolean(valor && valor !== "-"),
        comparar: (a, b) => compararPtBR(a, b, { numeric: false }),
      }),
    [pedidos],
  );

  const pedidosElegiveis = useMemo(
    () => filtrarPedidosParaProdutos(pedidos, filtros, relatorio),
    [pedidos, filtros, relatorio],
  );

  const produtos = useMemo(() => {
    const mapa = new Map();

    for (const item of pedidosElegiveis) {
      const codigo = obterCodigoProduto(item);
      if (!codigo || codigo === "-") continue;

      const descricao = String(
        item?.produto ?? item?.descricao_produto ?? "",
      ).trim();

      const existente = mapa.get(codigo);
      if (!existente) {
        mapa.set(codigo, { codigo, descricao });
      } else if (!existente.descricao && descricao) {
        mapa.set(codigo, { codigo, descricao });
      }
    }

    return [...mapa.values()].sort((a, b) =>
      compararPtBR(a.codigo, b.codigo, { numeric: true }),
    );
  }, [pedidosElegiveis]);

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
            <CampoFiltro
              titulo="Pedido(s)"
              className="rel-pedidos-campo rel-pedidos-campo-pedidos"
            >
              <input
                type="text"
                value={filtros?.pedidos || ""}
                onChange={(evento) =>
                  alterar("pedidos", evento.target.value)
                }
                placeholder="Ex.: 3105, 3106, 3107, 3105/1"
                autoComplete="off"
              />
            </CampoFiltro>

            {relatorio?.filtros?.periodo && (
              <>
                <CampoFiltro
                  titulo="Previsão de faturamento — de"
                  className="rel-pedidos-campo"
                >
                  <input
                    type="date"
                    value={filtros?.dataInicio || ""}
                    onChange={(evento) =>
                      alterar("dataInicio", evento.target.value)
                    }
                  />
                </CampoFiltro>

                <CampoFiltro
                  titulo="Previsão de faturamento — até"
                  className="rel-pedidos-campo"
                >
                  <input
                    type="date"
                    value={filtros?.dataFim || ""}
                    onChange={(evento) =>
                      alterar("dataFim", evento.target.value)
                    }
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
