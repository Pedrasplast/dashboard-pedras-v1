import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Boxes,
  Clock3,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingCart,
  Warehouse,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import Paginacao from "@/components/paginacao/Paginacao";

import useEstoque from "./useEstoque";

import "./EstoquePage.css";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const ITENS_POR_PAGINA =
  20;

const LOCAL_MATRIZ =
  "2333946061";

/* =========================================================
   UTILITÁRIOS
========================================================= */

function numero(valor) {
  const convertido =
    Number(
      valor ??
        0,
    );

  return Number.isFinite(
    convertido,
  )
    ? convertido
    : 0;
}

function normalizarTexto(
  valor,
) {
  return String(
    valor ??
      "",
  )
    .trim()
    .toLowerCase()
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}

function normalizarCodigo(
  valor,
) {
  return String(
    valor ??
      "",
  ).trim();
}

function formatarNumero(
  valor,
  casasMaximas = 3,
) {
  return numero(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        casasMaximas,
    },
  );
}

function formatarDataHora(
  valor,
) {
  if (!valor) {
    return "Aguardando sincronização";
  }

  const data =
    new Date(
      valor,
    );

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return "Aguardando sincronização";
  }

  return data.toLocaleString(
    "pt-BR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );
}

/* =========================================================
   TIPO DA SINCRONIZAÇÃO
========================================================= */

function obterModoSincronizacao(
  status,
) {
  const etapa =
    normalizarTexto(
      status?.etapa,
    );

  if (
    etapa.startsWith(
      "rapido",
    )
  ) {
    return "Rápida";
  }

  if (
    etapa ===
    "concluido"
  ) {
    return "Completa";
  }

  if (
    normalizarTexto(
      status?.status,
    ) ===
    "sincronizando"
  ) {
    return "Sincronizando";
  }

  return "Automática";
}

/* =========================================================
   CONSOLIDAR TODOS OS LOCAIS
========================================================= */

function consolidarEstoque(
  registros,
) {
  const mapa =
    new Map();

  for (
    const item of
    registros
  ) {
    const chave =
      String(
        item.codigoProdutoOmie,
      );

    const atual =
      mapa.get(
        chave,
      );

    if (!atual) {
      mapa.set(
        chave,
        {
          ...item,

          codigoLocalEstoque:
            null,

          saldo:
            numero(
              item.saldo,
            ),

          fisico:
            numero(
              item.fisico,
            ),

          reservado:
            numero(
              item.reservado,
            ),

          pendente:
            numero(
              item.pendente,
            ),

          estoqueMinimo:
            numero(
              item.estoqueMinimo,
            ),
        },
      );

      continue;
    }

    atual.saldo +=
      numero(
        item.saldo,
      );

    atual.fisico +=
      numero(
        item.fisico,
      );

    atual.reservado +=
      numero(
        item.reservado,
      );

    atual.pendente +=
      numero(
        item.pendente,
      );

    atual.estoqueMinimo +=
      numero(
        item.estoqueMinimo,
      );

    if (
      item.sincronizadoEm &&
      (
        !atual.sincronizadoEm ||
        new Date(
          item.sincronizadoEm,
        ).getTime() >
          new Date(
            atual.sincronizadoEm,
          ).getTime()
      )
    ) {
      atual.sincronizadoEm =
        item.sincronizadoEm;
    }
  }

  return Array.from(
    mapa.values(),
  );
}

/* =========================================================
   KPI
========================================================= */

function KpiCard({
  titulo,
  valor,
  subtitulo,
  icone: Icone,
  tipo,
}) {
  return (
    <article
      className={
        `estoque-kpi estoque-kpi--${tipo}`
      }
    >
      <div className="estoque-kpi__topo">
        <span>
          {titulo}
        </span>

        <div className="estoque-kpi__icone">
          <Icone
            size={18}
          />
        </div>
      </div>

      <strong>
        {valor}
      </strong>

      <small>
        {subtitulo}
      </small>
    </article>
  );
}

/* =========================================================
   PÁGINA
========================================================= */

export default function EstoquePage() {
  /* =======================================================
     ESTADOS
  ======================================================= */

  const [
    localSelecionado,
    setLocalSelecionado,
  ] =
    useState("");

  const [
    pesquisa,
    setPesquisa,
  ] =
    useState("");

  const [
    situacao,
    setSituacao,
  ] =
    useState(
      "todos",
    );

  const [
    paginaAtual,
    setPaginaAtual,
  ] =
    useState(1);

  /* =======================================================
     DADOS
  ======================================================= */

  const {
    locais,
    estoque,
    pedidosAbertos,
    resumoPedidosAbertos,
    statusSincronizacao,
    carregando,
    atualizando,
    erro,
    recarregar,
  } =
    useEstoque({
      codigoLocalEstoque:
        localSelecionado,
    });

  /* =======================================================
     PEDIDOS EM ABERTO POR PRODUTO
  ======================================================= */

  const pedidosPorProduto =
    useMemo(() => {
      const mapa =
        new Map();

      for (
        const item of
        pedidosAbertos
      ) {
        const codigo =
          normalizarCodigo(
            item.codigoProduto,
          );

        if (!codigo) {
          continue;
        }

        mapa.set(
          codigo,
          numero(
            item.quantidade,
          ),
        );
      }

      return mapa;
    }, [
      pedidosAbertos,
    ]);

  function obterQuantidadeEmPedidos(
    item,
  ) {
    const codigo =
      normalizarCodigo(
        item?.codigoProduto,
      );

    if (!codigo) {
      return 0;
    }

    return numero(
      pedidosPorProduto.get(
        codigo,
      ),
    );
  }

  /* =======================================================
     LOCAL PADRÃO
  ======================================================= */

  useEffect(() => {
    if (
      localSelecionado ||
      locais.length ===
        0
    ) {
      return;
    }

    const localPadrao =
      locais.find(
        (local) =>
          local.padrao,
      );

    const matriz =
      locais.find(
        (local) =>
          String(
            local.codigoLocalEstoque,
          ) ===
          LOCAL_MATRIZ,
      );

    setLocalSelecionado(
      String(
        localPadrao
          ?.codigoLocalEstoque ??
          matriz
            ?.codigoLocalEstoque ??
          locais[0]
            ?.codigoLocalEstoque ??
          "todos",
      ),
    );
  }, [
    locais,
    localSelecionado,
  ]);

  /* =======================================================
     CONSOLIDAÇÃO
  ======================================================= */

  const estoqueExibicao =
    useMemo(() => {
      if (
        localSelecionado ===
        "todos"
      ) {
        return consolidarEstoque(
          estoque,
        );
      }

      return estoque;
    }, [
      estoque,
      localSelecionado,
    ]);

  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores =
    useMemo(() => {
      const produtos =
        new Set(
          estoqueExibicao.map(
            (item) =>
              String(
                item.codigoProdutoOmie,
              ),
          ),
        );

      const comSaldo =
        estoqueExibicao.filter(
          (item) =>
            numero(
              item.saldo,
            ) !==
            0,
        ).length;

      const saldoTotal =
        estoqueExibicao.reduce(
          (
            total,
            item,
          ) =>
            total +
            numero(
              item.saldo,
            ),
          0,
        );

      return {
        produtos:
          produtos.size,

        comSaldo,

        saldoTotal,

        quantidadePedidosAbertos:
          numero(
            resumoPedidosAbertos
              .quantidadeTotal,
          ),

        pedidosAbertos:
          numero(
            resumoPedidosAbertos
              .pedidosDistintos,
          ),
      };
    }, [
      estoqueExibicao,
      resumoPedidosAbertos,
    ]);

  /* =======================================================
     FILTROS + ORDENAÇÃO

     PRIORIDADE:
     1º Tem saldo + tem pedidos em aberto
     2º Mais pedidos em aberto
     3º Maior saldo
     4º Tem saldo, sem pedidos
     5º Sem saldo
     6º Descrição A → Z
  ======================================================= */

  const estoqueFiltrado =
    useMemo(() => {
      const termo =
        normalizarTexto(
          pesquisa,
        );

      const filtrados =
        estoqueExibicao.filter(
          (item) => {
            if (
              situacao ===
                "com_saldo" &&
              numero(
                item.saldo,
              ) ===
                0
            ) {
              return false;
            }

            if (
              situacao ===
                "sem_saldo" &&
              numero(
                item.saldo,
              ) !==
                0
            ) {
              return false;
            }

            if (!termo) {
              return true;
            }

            const conteudo =
              normalizarTexto(
                `${
                  item.codigoProduto
                } ${
                  item.codigoIntegracao
                } ${
                  item.descricao
                }`,
              );

            return conteudo.includes(
              termo,
            );
          },
        );

      return [
        ...filtrados,
      ].sort(
        (
          itemA,
          itemB,
        ) => {
          const saldoA =
            numero(
              itemA.saldo,
            );

          const saldoB =
            numero(
              itemB.saldo,
            );

          const codigoA =
            normalizarCodigo(
              itemA.codigoProduto,
            );

          const codigoB =
            normalizarCodigo(
              itemB.codigoProduto,
            );

          const pedidosA =
            numero(
              pedidosPorProduto.get(
                codigoA,
              ),
            );

          const pedidosB =
            numero(
              pedidosPorProduto.get(
                codigoB,
              ),
            );

          /* =============================================
             GRUPO DE PRIORIDADE

             0 = saldo + pedidos
             1 = saldo sem pedidos
             2 = sem saldo + pedidos
             3 = sem saldo e sem pedidos
          ============================================= */

          function obterGrupo(
            saldo,
            pedidos,
          ) {
            if (
              saldo > 0 &&
              pedidos > 0
            ) {
              return 0;
            }

            if (
              saldo > 0 &&
              pedidos === 0
            ) {
              return 1;
            }

            if (
              saldo === 0 &&
              pedidos > 0
            ) {
              return 2;
            }

            return 3;
          }

          const grupoA =
            obterGrupo(
              saldoA,
              pedidosA,
            );

          const grupoB =
            obterGrupo(
              saldoB,
              pedidosB,
            );

          /* =============================================
             1º GRUPO DE PRIORIDADE
          ============================================= */

          if (
            grupoA !==
            grupoB
          ) {
            return (
              grupoA -
              grupoB
            );
          }

          /* =============================================
             2º PEDIDOS EM ABERTO — MAIOR PARA MENOR

             Principalmente dentro do grupo:
             saldo > 0 + pedidos > 0
          ============================================= */

          if (
            pedidosA !==
            pedidosB
          ) {
            return (
              pedidosB -
              pedidosA
            );
          }

          /* =============================================
             3º SALDO — MAIOR PARA MENOR
          ============================================= */

          if (
            saldoA !==
            saldoB
          ) {
            return (
              saldoB -
              saldoA
            );
          }

          /* =============================================
             4º DESCRIÇÃO — A → Z
          ============================================= */

          return String(
            itemA.descricao ??
              "",
          ).localeCompare(
            String(
              itemB.descricao ??
                "",
            ),
            "pt-BR",
            {
              sensitivity:
                "base",
            },
          );
        },
      );
    }, [
      estoqueExibicao,
      pesquisa,
      situacao,
      pedidosPorProduto,
    ]);

  /* =======================================================
     PAGINAÇÃO
  ======================================================= */

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        estoqueFiltrado.length /
          ITENS_POR_PAGINA,
      ),
    );

  useEffect(() => {
    setPaginaAtual(
      1,
    );
  }, [
    localSelecionado,
    pesquisa,
    situacao,
  ]);

  useEffect(() => {
    if (
      paginaAtual >
      totalPaginas
    ) {
      setPaginaAtual(
        totalPaginas,
      );
    }
  }, [
    paginaAtual,
    totalPaginas,
  ]);

  const itensPagina =
    useMemo(() => {
      const inicio =
        (
          paginaAtual -
          1
        ) *
        ITENS_POR_PAGINA;

      return estoqueFiltrado.slice(
        inicio,
        inicio +
          ITENS_POR_PAGINA,
      );
    }, [
      estoqueFiltrado,
      paginaAtual,
    ]);

  /* =======================================================
     LOCAL ATUAL
  ======================================================= */

  const localAtual =
    useMemo(() => {
      if (
        localSelecionado ===
        "todos"
      ) {
        return "Todos os locais ativos";
      }

      const local =
        locais.find(
          (item) =>
            String(
              item.codigoLocalEstoque,
            ) ===
            String(
              localSelecionado,
            ),
        );

      return local
        ? `${local.codigo} — ${local.descricao}`
        : "Local de estoque";
    }, [
      locais,
      localSelecionado,
    ]);

  const modoSincronizacao =
    obterModoSincronizacao(
      statusSincronizacao,
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="estoque-page">
      <div className="estoque-container">

        <PageHeader
          eyebrow="Produção"
          title="Estoque"
          description="Consulta do estoque de produtos acabados integrado ao Omie."
          icon={Warehouse}
          className="estoque-header"
          actions={
            <div
              className="estoque-atualizacao"
              title={
                statusSincronizacao
                  ?.mensagem ||
                "Sincronização automática do estoque"
              }
            >
              <Clock3
                size={18}
              />

              <div className="estoque-atualizacao__textos">
                <span className="estoque-atualizacao__titulo">
                  Última atualização
                </span>

                <span className="estoque-atualizacao__horario">
                  <strong>
                    {formatarDataHora(
                      statusSincronizacao
                        ?.ultima_sincronizacao,
                    )}
                  </strong>

                  <span>
                    •
                  </span>

                  {
                    modoSincronizacao
                  }
                </span>
              </div>
            </div>
          }
        />

        <section
          className="estoque-filtros"
          aria-label="Filtros do estoque"
        >
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
                setLocalSelecionado(
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

              <option value="todos">
                Todos os locais ativos
              </option>
            </select>
          </label>

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
                  setPesquisa(
                    evento
                      .target
                      .value,
                  )
                }
                placeholder="Código ou descrição..."
              />
            </div>
          </label>

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
                setSituacao(
                  evento
                    .target
                    .value,
                )
              }
            >
              <option value="todos">
                Todos
              </option>

              <option value="com_saldo">
                Com saldo
              </option>

              <option value="sem_saldo">
                Sem saldo
              </option>
            </select>
          </label>

          <button
            type="button"
            className="estoque-atualizar"
            onClick={() =>
              void recarregar()
            }
            disabled={
              atualizando
            }
          >
            <RefreshCw
              size={17}
              className={
                atualizando
                  ? "girando"
                  : ""
              }
            />

            {atualizando
              ? "Atualizando..."
              : "Atualizar"}
          </button>
        </section>

        {erro && (
          <div
            className="estoque-mensagem estoque-mensagem--erro"
            role="alert"
          >
            {erro}
          </div>
        )}

        <section
          className="estoque-kpis"
          aria-label="Indicadores do estoque"
        >
          <KpiCard
            titulo="Produtos"
            valor={
              carregando
                ? "-"
                : formatarNumero(
                    indicadores.produtos,
                    0,
                  )
            }
            subtitulo={
              localAtual
            }
            icone={
              Boxes
            }
            tipo="azul"
          />

          <KpiCard
            titulo="Com saldo"
            valor={
              carregando
                ? "-"
                : formatarNumero(
                    indicadores.comSaldo,
                    0,
                  )
            }
            subtitulo="Saldo diferente de zero"
            icone={
              PackageCheck
            }
            tipo="verde"
          />

          <KpiCard
            titulo="Saldo total"
            valor={
              carregando
                ? "-"
                : formatarNumero(
                    indicadores.saldoTotal,
                  )
            }
            subtitulo="Quantidade disponível no local"
            icone={
              Warehouse
            }
            tipo="roxo"
          />

          <KpiCard
            titulo="Quantidade em aberto"
            valor={
              carregando
                ? "-"
                : formatarNumero(
                    indicadores
                      .quantidadePedidosAbertos,
                  )
            }
            subtitulo={
              carregando
                ? "Carregando pedidos..."
                : `${
                    formatarNumero(
                      indicadores
                        .pedidosAbertos,
                      0,
                    )
                  } pedidos • mesma base da tela de Pedidos`
            }
            icone={
              ShoppingCart
            }
            tipo="laranja"
          />
        </section>

        <section className="estoque-tabela-card">
          <div className="estoque-tabela-topo">
            <div>
              <span className="estoque-tabela-eyebrow">
                Produtos acabados
              </span>

              <h2>
                Posição de estoque
              </h2>
            </div>

            <div className="estoque-tabela-meta">
              <span>
                {localAtual}
              </span>

              <strong>
                {formatarNumero(
                  estoqueFiltrado.length,
                  0,
                )}{" "}
                produtos
              </strong>
            </div>
          </div>

          <div className="estoque-tabela-scroll">
            <table className="estoque-tabela">
              <thead>
                <tr>
                  <th>
                    Código
                  </th>

                  <th>
                    Produto
                  </th>

                  <th className="numero">
                    Saldo
                  </th>

                  <th className="numero">
                    Pedidos em aberto
                  </th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="estoque-vazio"
                    >
                      Carregando estoque...
                    </td>
                  </tr>
                ) : itensPagina.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="estoque-vazio"
                    >
                      Nenhum produto encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  itensPagina.map(
                    (
                      item,
                    ) => {
                      const quantidadePedidos =
                        obterQuantidadeEmPedidos(
                          item,
                        );

                      return (
                        <tr
                          key={
                            item.codigoProdutoOmie
                          }
                        >
                          <td>
                            <span className="estoque-codigo">
                              {
                                item.codigoProduto ||
                                "-"
                              }
                            </span>
                          </td>

                          <td>
                            <div className="estoque-produto">
                              <strong>
                                {
                                  item.descricao ||
                                  "Produto sem descrição"
                                }
                              </strong>

                              {item.codigoIntegracao && (
                                <small>
                                  Integração:{" "}
                                  {
                                    item.codigoIntegracao
                                  }
                                </small>
                              )}
                            </div>
                          </td>

                          <td className="numero">
                            <span
                              className={
                                numero(
                                  item.saldo,
                                ) !==
                                0
                                  ? "estoque-valor estoque-valor--saldo"
                                  : "estoque-valor estoque-valor--zero"
                              }
                            >
                              {formatarNumero(
                                item.saldo,
                              )}
                            </span>
                          </td>

                          <td className="numero">
                            <span
                              className={
                                quantidadePedidos >
                                0
                                  ? "estoque-valor"
                                  : "estoque-valor estoque-valor--zero"
                              }
                            >
                              {formatarNumero(
                                quantidadePedidos,
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>

          <Paginacao
            paginaAtual={
              paginaAtual
            }
            totalItens={
              estoqueFiltrado.length
            }
            itensPorPagina={
              ITENS_POR_PAGINA
            }
            onChangePagina={
              setPaginaAtual
            }
          />
        </section>
      </div>
    </main>
  );
}