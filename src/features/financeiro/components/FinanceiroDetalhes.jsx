import {
  memo,
  useMemo,
  useState,
} from "react";

import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Layers3,
  Search,
  X,
} from "lucide-react";

import {
  useFinanceiroDetalhes,
} from "../hooks/useFinanceiro";

import {
  formatarData,
  formatarMoeda,
} from "../utils/financeiro.utils";


/* =========================================================
   COMPONENTE / STATUS
========================================================= */

function nomeComponente(componente) {
  if (componente === "realizado") {
    return "Realizado";
  }

  if (componente === "a_realizar") {
    return "A realizar";
  }

  return "-";
}


/* =========================================================
   TEXTO PARA BUSCA
========================================================= */

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}


/* =========================================================
   RESUMO DOS LANÇAMENTOS
========================================================= */

function calcularResumoDetalhes(registros) {
  let totalRealizado = 0;
  let totalARealizar = 0;

  let quantidadeRealizado = 0;
  let quantidadeARealizar = 0;

  for (const registro of registros) {
    const valor = Number(
      registro?.valor_componente ?? 0,
    );

    if (
      registro?.componente ===
      "realizado"
    ) {
      totalRealizado += valor;
      quantidadeRealizado += 1;

      continue;
    }

    if (
      registro?.componente ===
      "a_realizar"
    ) {
      totalARealizar += valor;
      quantidadeARealizar += 1;
    }
  }

  return {
    totalRealizado,
    totalARealizar,

    totalGeral:
      totalRealizado +
      totalARealizar,

    quantidade:
      registros.length,

    quantidadeRealizado,
    quantidadeARealizar,
  };
}


/* =========================================================
   LINHA DA TABELA
========================================================= */

const LinhaDetalhe = memo(
  function LinhaDetalhe({
    registro,
  }) {
    const componente =
      registro?.componente;

    return (
      <tr>
        <td className="financeiro-detalhes-data">
          {formatarData(
            registro?.data_referencia,
          )}
        </td>

        <td className="financeiro-detalhes-cliente">
          <span
            title={
              registro
                ?.cliente_fornecedor ||
              ""
            }
          >
            {
              registro
                ?.cliente_fornecedor ||
              "-"
            }
          </span>
        </td>

        <td>
          {
            registro
              ?.numero_documento ||
            "-"
          }
        </td>

        <td>
          {
            registro
              ?.numero_pedido ||
            "-"
          }
        </td>

        <td>
          <span
            className={[
              "financeiro-detalhes-badge",

              componente ===
              "realizado"
                ? "financeiro-detalhes-badge-realizado"
                : "financeiro-detalhes-badge-a-realizar",
            ].join(" ")}
          >
            {nomeComponente(
              componente,
            )}
          </span>
        </td>

        <td>
          {
            registro?.status ||
            "-"
          }
        </td>

        <td className="financeiro-detalhes-numero">
          {formatarMoeda(
            registro
              ?.valor_documento,
          )}
        </td>

        <td className="financeiro-detalhes-numero financeiro-detalhes-valor-principal">
          {formatarMoeda(
            registro
              ?.valor_componente,
          )}
        </td>
      </tr>
    );
  },
);


/* =========================================================
   CARD DE INDICADOR
========================================================= */

function IndicadorDetalhe({
  titulo,
  valor,
  subtitulo,
  icone: Icone,
  variante = "neutro",
}) {
  return (
    <div
      className={[
        "financeiro-detalhes-indicador",
        `financeiro-detalhes-indicador-${variante}`,
      ].join(" ")}
    >
      <div className="financeiro-detalhes-indicador-icone">
        <Icone
          size={20}
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <div className="financeiro-detalhes-indicador-conteudo">
        <span>
          {titulo}
        </span>

        <strong>
          {valor}
        </strong>

        {subtitulo && (
          <small>
            {subtitulo}
          </small>
        )}
      </div>
    </div>
  );
}


/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

function FinanceiroDetalhes({
  aberto,
  ano,
  mes,
  categoria,
  aoFechar,
}) {
  const [
    busca,
    definirBusca,
  ] = useState("");

  const [
    filtroComponente,
    definirFiltroComponente,
  ] = useState("todos");


  const codigoCategoria =
    categoria
      ?.codigo_categoria ??
    "";


  /* =======================================================
     QUERY
  ======================================================= */

  const {
    data:
      detalhes = [],

    isLoading:
      carregando,

    isFetching:
      atualizando,

    isError:
      erro,

    error:
      detalheErro,
  } =
    useFinanceiroDetalhes({
      ano,
      mes,
      codigoCategoria,

      habilitado:
        aberto &&
        Boolean(
          codigoCategoria,
        ),
    });


  /* =======================================================
     RESUMO
  ======================================================= */

  const resumo =
    useMemo(
      () =>
        calcularResumoDetalhes(
          detalhes,
        ),
      [detalhes],
    );


  /* =======================================================
     FILTROS
  ======================================================= */

  const detalhesFiltrados =
    useMemo(
      () => {
        const textoBusca =
          normalizarTexto(
            busca,
          );

        const resultado =
          [];

        for (
          const registro
          of detalhes
        ) {
          if (
            filtroComponente !==
              "todos" &&
            registro
              ?.componente !==
              filtroComponente
          ) {
            continue;
          }

          if (!textoBusca) {
            resultado.push(
              registro,
            );

            continue;
          }

          const conteudo =
            normalizarTexto(
              [
                registro
                  ?.cliente_fornecedor,

                registro
                  ?.numero_documento,

                registro
                  ?.numero_pedido,

                registro
                  ?.status,

                registro
                  ?.codigo_titulo_omie,

                nomeComponente(
                  registro
                    ?.componente,
                ),
              ].join(" "),
            );

          if (
            conteudo.includes(
              textoBusca,
            )
          ) {
            resultado.push(
              registro,
            );
          }
        }

        return resultado;
      },
      [
        detalhes,
        busca,
        filtroComponente,
      ],
    );


  /* =======================================================
     FECHAR
  ======================================================= */

  function fecharPainel() {
    definirBusca("");

    definirFiltroComponente(
      "todos",
    );

    aoFechar();
  }


  if (
    !aberto ||
    !categoria
  ) {
    return null;
  }


  return (
    <div className="financeiro-detalhes-overlay">

      {/* FUNDO */}

      <button
        type="button"
        className="financeiro-detalhes-fundo"
        aria-label="Fechar detalhes"
        onClick={
          fecharPainel
        }
      />


      {/* PAINEL */}

      <aside className="financeiro-detalhes-painel">

        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <header className="financeiro-detalhes-cabecalho">

          <div className="financeiro-detalhes-identificacao">

            <span className="financeiro-detalhes-codigo">
              {
                categoria
                  .codigo_categoria
              }
            </span>

            <h2 className="financeiro-detalhes-titulo">
              {
                categoria
                  .categoria
              }
            </h2>

            <div className="financeiro-detalhes-periodo">

              <CalendarDays
                size={15}
                strokeWidth={2}
                aria-hidden="true"
              />

              <span>
                {String(
                  mes,
                ).padStart(
                  2,
                  "0",
                )}
                /
                {ano}
              </span>

            </div>

          </div>


          <button
            type="button"
            className="financeiro-detalhes-fechar"
            aria-label="Fechar"
            onClick={
              fecharPainel
            }
          >
            <X
              size={19}
              aria-hidden="true"
            />
          </button>

        </header>


        {/* =================================================
            INDICADORES PRINCIPAIS
        ================================================= */}

        <section className="financeiro-detalhes-principais">

          <IndicadorDetalhe
            titulo="Previsto"
            valor={formatarMoeda(
              categoria
                .valor_previsto,
            )}
            icone={
              DollarSign
            }
            variante="previsto"
          />

          <IndicadorDetalhe
            titulo="Realizado / a realizar"
            valor={formatarMoeda(
              categoria
                .valor_realizado,
            )}
            icone={
              BarChart3
            }
            variante="total"
          />

        </section>


        {/* =================================================
            COMPOSIÇÃO
        ================================================= */}

        {!carregando &&
          !erro && (
            <section className="financeiro-detalhes-resumo">

              <IndicadorDetalhe
                titulo="Realizado"
                valor={formatarMoeda(
                  resumo
                    .totalRealizado,
                )}
                subtitulo={`${
                  resumo
                    .quantidadeRealizado
                } ${
                  resumo
                    .quantidadeRealizado ===
                  1
                    ? "lançamento"
                    : "lançamentos"
                }`}
                icone={
                  CheckCircle2
                }
                variante="realizado"
              />

              <IndicadorDetalhe
                titulo="A realizar"
                valor={formatarMoeda(
                  resumo
                    .totalARealizar,
                )}
                subtitulo={`${
                  resumo
                    .quantidadeARealizar
                } ${
                  resumo
                    .quantidadeARealizar ===
                  1
                    ? "lançamento"
                    : "lançamentos"
                }`}
                icone={
                  Clock3
                }
                variante="a-realizar"
              />

              <IndicadorDetalhe
                titulo="Total da composição"
                valor={formatarMoeda(
                  resumo
                    .totalGeral,
                )}
                subtitulo={`${
                  resumo
                    .quantidade
                } ${
                  resumo
                    .quantidade ===
                  1
                    ? "registro"
                    : "registros"
                }`}
                icone={
                  Layers3
                }
                variante="composicao"
              />

            </section>
          )}


        {/* =================================================
            FILTROS
        ================================================= */}

        {!carregando &&
          !erro &&
          detalhes.length >
            0 && (
            <div className="financeiro-detalhes-filtros">

              <div className="financeiro-detalhes-busca">

                <Search
                  size={17}
                  aria-hidden="true"
                />

                <input
                  type="text"
                  value={
                    busca
                  }
                  placeholder="Buscar cliente, documento, pedido ou status..."
                  onChange={(evento) =>
                    definirBusca(
                      evento
                        .target
                        .value,
                    )
                  }
                />

                {busca && (
                  <button
                    type="button"
                    aria-label="Limpar busca"
                    onClick={() =>
                      definirBusca(
                        "",
                      )
                    }
                  >
                    <X
                      size={15}
                      aria-hidden="true"
                    />
                  </button>
                )}

              </div>


              <div className="financeiro-detalhes-filtro-componente">

                <button
                  type="button"
                  className={
                    filtroComponente ===
                    "todos"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    definirFiltroComponente(
                      "todos",
                    )
                  }
                >
                  Todos
                </button>

                <button
                  type="button"
                  className={
                    filtroComponente ===
                    "realizado"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    definirFiltroComponente(
                      "realizado",
                    )
                  }
                >
                  Realizado
                </button>

                <button
                  type="button"
                  className={
                    filtroComponente ===
                    "a_realizar"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    definirFiltroComponente(
                      "a_realizar",
                    )
                  }
                >
                  A realizar
                </button>

              </div>


              <span className="financeiro-detalhes-resultado-contagem">
                {
                  detalhesFiltrados
                    .length
                }{" "}
                de{" "}
                {
                  detalhes
                    .length
                }
              </span>

            </div>
          )}


        {/* =================================================
            STATUS
        ================================================= */}

        {carregando && (
          <div className="financeiro-detalhes-status">
            Carregando lançamentos...
          </div>
        )}

        {erro && (
          <div className="financeiro-detalhes-status financeiro-detalhes-erro">
            {detalheErro
              ?.message ||
              "Não foi possível carregar os lançamentos."}
          </div>
        )}

        {!carregando &&
          !erro &&
          detalhes.length ===
            0 && (
            <div className="financeiro-detalhes-status">
              Nenhum lançamento encontrado para esta categoria.
            </div>
          )}

        {!carregando &&
          !erro &&
          detalhes.length >
            0 &&
          detalhesFiltrados
              .length ===
            0 && (
            <div className="financeiro-detalhes-status">
              Nenhum lançamento corresponde aos filtros informados.
            </div>
          )}


        {/* =================================================
            TABELA
        ================================================= */}

        {!carregando &&
          !erro &&
          detalhesFiltrados
              .length >
            0 && (
            <div className="financeiro-detalhes-tabela-container">

              {atualizando && (
                <div className="financeiro-detalhes-atualizando">
                  Atualizando dados...
                </div>
              )}

              <table className="financeiro-detalhes-tabela">

                <thead>
                  <tr>
                    <th>
                      Data
                    </th>

                    <th>
                      Cliente / Fornecedor
                    </th>

                    <th>
                      Documento
                    </th>

                    <th>
                      Pedido
                    </th>

                    <th>
                      Componente
                    </th>

                    <th>
                      Status
                    </th>

                    <th className="financeiro-detalhes-numero">
                      Valor título
                    </th>

                    <th className="financeiro-detalhes-numero">
                      Valor composição
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {detalhesFiltrados.map(
                    (registro) => (
                      <LinhaDetalhe
                        key={
                          registro.id
                        }
                        registro={
                          registro
                        }
                      />
                    ),
                  )}
                </tbody>

              </table>

            </div>
          )}

      </aside>

    </div>
  );
}


export default memo(
  FinanceiroDetalhes,
);