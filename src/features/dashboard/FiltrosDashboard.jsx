import React, {
  useCallback,
  useMemo,
  useState,
} from "react";

import { DayPicker } from "@daypicker/react";
import { ptBR } from "@daypicker/react/locale";

import "@daypicker/react/style.css";
import "./FiltrosDashboard.css";


/*
 * Descrições apresentadas ao lado do número
 * no filtro TIPO.
 */
const DESCRICOES_TIPO = {
  1: "Paradas Planejadas",
  2: "Paradas não Planejadas",
  3: "Intervalos e Dias Sem Produção",
};


/*
 * Turnos disponíveis.
 */
const TURNOS_DISPONIVEIS = [
  "TURNO I",
  "TURNO II",
  "TURNO III",
];


/*
 * Retorna a descrição correspondente ao tipo.
 */
const obterDescricaoTipo = (tipo) => {
  const codigoTipo =
    String(tipo).trim();

  return (
    DESCRICOES_TIPO[codigoTipo] ||
    "Tipo sem descrição"
  );
};


/* =====================================================
   DATA
===================================================== */

const formatarDataISO = (data) => {
  if (
    !(data instanceof Date) ||
    Number.isNaN(data.getTime())
  ) {
    return "";
  }

  const ano =
    data.getFullYear();

  const mes =
    String(
      data.getMonth() + 1,
    ).padStart(2, "0");

  const dia =
    String(
      data.getDate(),
    ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
};


const converterISOParaData = (
  valorISO,
) => {
  if (!valorISO) {
    return undefined;
  }

  const correspondencia =
    String(valorISO).match(
      /^(\d{4})-(\d{2})-(\d{2})$/,
    );

  if (!correspondencia) {
    return undefined;
  }

  const ano =
    Number(correspondencia[1]);

  const mes =
    Number(correspondencia[2]) - 1;

  const dia =
    Number(correspondencia[3]);

  const data =
    new Date(
      ano,
      mes,
      dia,
    );

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes ||
    data.getDate() !== dia
  ) {
    return undefined;
  }

  return data;
};


/*
 * Retorna a data oficial do registro.
 */
const extrairDataRegistro = (
  registro,
) => {
  const valorData =
    registro?.lista_de_data ||
    registro?.inicio ||
    registro?.inicio_dia ||
    registro?.data ||
    null;

  if (!valorData) {
    return null;
  }

  const textoData =
    String(valorData).trim();

  const correspondencia =
    textoData.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );

  if (correspondencia) {
    const dataISO = [
      correspondencia[1],
      correspondencia[2],
      correspondencia[3],
    ].join("-");

    return converterISOParaData(
      dataISO,
    )
      ? dataISO
      : null;
  }

  const data =
    new Date(valorData);

  if (
    Number.isNaN(
      data.getTime(),
    )
  ) {
    return null;
  }

  return formatarDataISO(
    data,
  );
};


const formatarDataVisual = (
  valorISO,
) => {
  const data =
    converterISOParaData(
      valorISO,
    );

  if (!data) {
    return "";
  }

  return data.toLocaleDateString(
    "pt-BR",
  );
};


/* =====================================================
   COMPONENTE
===================================================== */

export default function FiltrosDashboard({
  filtros,
  setFiltros,
  rawDados = [],

  exibirPeriodo = true,
  exibirInjetora = true,
  exibirTurno = false,
  exibirProduto = true,
  exibirMp = true,
  exibirTipo = true,

  tiposDisponiveis = [],
  produtosDisponiveis = [],
  mpsDisponiveis = [],

  /*
   * FALSE:
   * mantém exatamente o layout usado
   * no Dashboard de Produção.
   *
   * TRUE:
   * usa a organização específica
   * da tela de relatórios.
   */
  modoRelatorio = false,
}) {
  const [
    calendarioAberto,
    setCalendarioAberto,
  ] = useState(null);


  /* =====================================================
     DATAS DISPONÍVEIS
  ===================================================== */

  const datasComDados =
    useMemo(() => {
      return new Set(
        rawDados
          .map(extrairDataRegistro)
          .filter(Boolean),
      );
    }, [rawDados]);


  const datasOrdenadas =
    useMemo(() => {
      return [
        ...datasComDados,
      ].sort();
    }, [datasComDados]);


  const primeiraDataDisponivel =
    datasOrdenadas[0] ||
    null;


  const ultimaDataDisponivel =
    datasOrdenadas[
      datasOrdenadas.length - 1
    ] || null;


  const dataInicioSelecionada =
    useMemo(() => {
      return converterISOParaData(
        filtros.dataInicio,
      );
    }, [
      filtros.dataInicio,
    ]);


  const dataFimSelecionada =
    useMemo(() => {
      return converterISOParaData(
        filtros.dataFim,
      );
    }, [
      filtros.dataFim,
    ]);


  const mesInicialCalendario =
    useMemo(() => {
      return (
        dataInicioSelecionada ||
        dataFimSelecionada ||
        converterISOParaData(
          ultimaDataDisponivel,
        ) ||
        new Date()
      );
    }, [
      dataInicioSelecionada,
      dataFimSelecionada,
      ultimaDataDisponivel,
    ]);


  /* =====================================================
     TIPO
  ===================================================== */

  const toggleTipo =
    useCallback(
      (tipo) => {
        setFiltros(
          (anterior) => {
            const tiposAtuais =
              Array.isArray(
                anterior.tipo,
              )
                ? anterior.tipo
                : [];

            const novosTipos =
              tiposAtuais.includes(
                tipo,
              )
                ? tiposAtuais.filter(
                    (
                      tipoAtual,
                    ) =>
                      tipoAtual !==
                      tipo,
                  )
                : [
                    ...tiposAtuais,
                    tipo,
                  ];

            return {
              ...anterior,

              tipo:
                novosTipos,
            };
          },
        );
      },
      [
        setFiltros,
      ],
    );


  /* =====================================================
     LIMPAR SOMENTE AS DATAS

     Usado no modo RELATÓRIO.
  ===================================================== */

  const limparDatas =
    useCallback(() => {
      setFiltros(
        (anterior) => ({
          ...anterior,

          dataInicio: "",

          dataFim: "",
        }),
      );

      setCalendarioAberto(
        null,
      );
    }, [
      setFiltros,
    ]);


  /* =====================================================
     LIMPAR TODOS OS FILTROS

     Usado no DASHBOARD principal.
  ===================================================== */

  const limparTodosFiltros =
    useCallback(() => {
      setFiltros(
        (anterior) => ({
          ...anterior,

          /*
           * Período
           */
          dataInicio: "",
          dataFim: "",

          /*
           * Injetora
           */
          injetora: "Todos",

          /*
           * Turno
           */
          turno: "Todos",

          /*
           * Produto
           */
          cod_prod: "Todos",

          /*
           * Matéria-prima
           */
          mp: "Todos",

          /*
           * Tipos de parada
           */
          tipo: [],
        }),
      );

      /*
       * Fecha qualquer calendário
       * que esteja aberto.
       */
      setCalendarioAberto(
        null,
      );
    }, [
      setFiltros,
    ]);


  /* =====================================================
     VERIFICA SE EXISTE ALGUM FILTRO ATIVO
  ===================================================== */

  const possuiFiltroAtivo =
    useMemo(() => {
      const possuiTipo =
        Array.isArray(
          filtros.tipo,
        ) &&
        filtros.tipo.length > 0;

      return Boolean(
        filtros.dataInicio ||
        filtros.dataFim ||

        (
          filtros.injetora &&
          filtros.injetora !==
            "Todos"
        ) ||

        (
          filtros.turno &&
          filtros.turno !==
            "Todos"
        ) ||

        (
          filtros.cod_prod &&
          filtros.cod_prod !==
            "Todos"
        ) ||

        (
          filtros.mp &&
          filtros.mp !==
            "Todos"
        ) ||

        possuiTipo,
      );
    }, [
      filtros.dataInicio,
      filtros.dataFim,
      filtros.injetora,
      filtros.turno,
      filtros.cod_prod,
      filtros.mp,
      filtros.tipo,
    ]);


  /* =====================================================
     VALIDA DATA
  ===================================================== */

  const dataPossuiRegistro =
    useCallback(
      (data) => {
        const dataISO =
          formatarDataISO(
            data,
          );

        return (
          dataISO !== "" &&
          datasComDados.has(
            dataISO,
          )
        );
      },
      [
        datasComDados,
      ],
    );


  const desabilitarDataInicio =
    useCallback(
      (data) => {
        if (
          !dataPossuiRegistro(
            data,
          )
        ) {
          return true;
        }

        if (
          dataFimSelecionada &&
          data >
            dataFimSelecionada
        ) {
          return true;
        }

        return false;
      },
      [
        dataPossuiRegistro,
        dataFimSelecionada,
      ],
    );


  const desabilitarDataFim =
    useCallback(
      (data) => {
        if (
          !dataPossuiRegistro(
            data,
          )
        ) {
          return true;
        }

        if (
          dataInicioSelecionada &&
          data <
            dataInicioSelecionada
        ) {
          return true;
        }

        return false;
      },
      [
        dataPossuiRegistro,
        dataInicioSelecionada,
      ],
    );


  /* =====================================================
     SELEÇÃO DAS DATAS
  ===================================================== */

  const selecionarDataInicio =
    useCallback(
      (data) => {
        if (
          !data ||
          !dataPossuiRegistro(
            data,
          )
        ) {
          return;
        }

        const novaDataInicio =
          formatarDataISO(
            data,
          );

        setFiltros(
          (anterior) => ({
            ...anterior,

            dataInicio:
              novaDataInicio,

            dataFim:
              anterior.dataFim &&
              anterior.dataFim <
                novaDataInicio
                ? ""
                : anterior.dataFim,
          }),
        );

        setCalendarioAberto(
          null,
        );
      },
      [
        dataPossuiRegistro,
        setFiltros,
      ],
    );


  const selecionarDataFim =
    useCallback(
      (data) => {
        if (
          !data ||
          !dataPossuiRegistro(
            data,
          )
        ) {
          return;
        }

        const novaDataFim =
          formatarDataISO(
            data,
          );

        if (
          filtros.dataInicio &&
          novaDataFim <
            filtros.dataInicio
        ) {
          return;
        }

        setFiltros(
          (anterior) => ({
            ...anterior,

            dataFim:
              novaDataFim,
          }),
        );

        setCalendarioAberto(
          null,
        );
      },
      [
        dataPossuiRegistro,
        filtros.dataInicio,
        setFiltros,
      ],
    );


  /* =====================================================
     INJETORAS
  ===================================================== */

  const injetorasDisponiveis =
    useMemo(() => {
      return [
        ...new Set(
          rawDados
            .map(
              (registro) =>
                registro.injetora,
            )
            .filter(Boolean),
        ),
      ].sort(
        (a, b) =>
          String(a).localeCompare(
            String(b),
            "pt-BR",
            {
              numeric: true,
              sensitivity:
                "base",
            },
          ),
      );
    }, [
      rawDados,
    ]);


  /* =====================================================
     CAMPO DATA INICIAL
  ===================================================== */

  const campoDataInicial = (
    <div className="calendar-field">

      <button
        type="button"
        className="calendar-trigger"
        disabled={
          datasOrdenadas.length ===
          0
        }
        onClick={() =>
          setCalendarioAberto(
            (atual) =>
              atual === "inicio"
                ? null
                : "inicio",
          )
        }
      >
        <span>
          Data inicial
        </span>

        <strong>
          {filtros.dataInicio
            ? formatarDataVisual(
                filtros.dataInicio,
              )
            : "Selecionar"}
        </strong>
      </button>


      {calendarioAberto ===
        "inicio" && (
        <div className="calendar-popover">

          <DayPicker
            mode="single"
            locale={ptBR}
            selected={
              dataInicioSelecionada
            }
            onSelect={
              selecionarDataInicio
            }
            disabled={
              desabilitarDataInicio
            }
            modifiers={{
              comDados:
                dataPossuiRegistro,
            }}
            modifiersClassNames={{
              comDados:
                "calendar-day-has-data",
            }}
            defaultMonth={
              mesInicialCalendario
            }
            startMonth={
              converterISOParaData(
                primeiraDataDisponivel,
              )
            }
            endMonth={
              converterISOParaData(
                ultimaDataDisponivel,
              )
            }
            showOutsideDays={
              false
            }
          />

          <small className="calendar-info">
            Somente dias com dados
            podem ser selecionados.
          </small>

        </div>
      )}

    </div>
  );


  /* =====================================================
     CAMPO DATA FINAL
  ===================================================== */

  const campoDataFinal = (
    <div className="calendar-field">

      <button
        type="button"
        className="calendar-trigger"
        disabled={
          datasOrdenadas.length ===
          0
        }
        onClick={() =>
          setCalendarioAberto(
            (atual) =>
              atual === "fim"
                ? null
                : "fim",
          )
        }
      >
        <span>
          Data final
        </span>

        <strong>
          {filtros.dataFim
            ? formatarDataVisual(
                filtros.dataFim,
              )
            : "Selecionar"}
        </strong>
      </button>


      {calendarioAberto ===
        "fim" && (
        <div className="calendar-popover">

          <DayPicker
            mode="single"
            locale={ptBR}
            selected={
              dataFimSelecionada
            }
            onSelect={
              selecionarDataFim
            }
            disabled={
              desabilitarDataFim
            }
            modifiers={{
              comDados:
                dataPossuiRegistro,
            }}
            modifiersClassNames={{
              comDados:
                "calendar-day-has-data",
            }}
            defaultMonth={
              mesInicialCalendario
            }
            startMonth={
              converterISOParaData(
                primeiraDataDisponivel,
              )
            }
            endMonth={
              converterISOParaData(
                ultimaDataDisponivel,
              )
            }
            showOutsideDays={
              false
            }
          />

          <small className="calendar-info">
            Somente dias com dados
            podem ser selecionados.
          </small>

        </div>
      )}

    </div>
  );


  /* =====================================================
     TELA
  ===================================================== */

  return (
    <div className="filter-section">


      {/* =================================================
          PERÍODO — RELATÓRIO

          Aqui continua limpando SOMENTE
          a data inicial e final.
      ================================================= */}

      {exibirPeriodo &&
        modoRelatorio && (
          <div className="periodo-relatorio-area">

            <label className="periodo-relatorio-label">
              PERÍODO
            </label>

            <div className="periodo-relatorio-linha">

              <div className="date-inputs-container">

                {campoDataInicial}

                {campoDataFinal}

              </div>


              <button
                type="button"
                className="clear-date-btn clear-date-btn-relatorio"
                onClick={
                  limparDatas
                }
                disabled={
                  !filtros.dataInicio &&
                  !filtros.dataFim
                }
              >
                ✕ LIMPAR
              </button>

            </div>


            {datasOrdenadas.length ===
              0 && (
              <small className="calendar-empty">
                Nenhuma data encontrada
                na base.
              </small>
            )}

          </div>
        )}


      {/* =================================================
          PERÍODO — DASHBOARD ORIGINAL

          AGORA:
          o botão LIMPAR remove TODOS
          os filtros do Dashboard.
      ================================================= */}

      {exibirPeriodo &&
        !modoRelatorio && (
          <>

            <div className="filter-header-row">

              <label>
                PERÍODO
              </label>


              <button
                type="button"
                className="clear-date-btn"
                onClick={
                  limparTodosFiltros
                }
                disabled={
                  !possuiFiltroAtivo
                }
                title="Limpar todos os filtros"
              >
                ✕ LIMPAR
              </button>

            </div>


            <div className="date-inputs-container">

              {campoDataInicial}

              {campoDataFinal}

            </div>


            {datasOrdenadas.length ===
              0 && (
              <small className="calendar-empty">
                Nenhuma data encontrada
                na base.
              </small>
            )}

          </>
        )}


      {/* =================================================
          INJETORA
      ================================================= */}

      {exibirInjetora && (
        <>

          <label>
            INJETORA
          </label>


          <select
            value={
              filtros.injetora ||
              "Todos"
            }
            onChange={(
              evento,
            ) =>
              setFiltros(
                (
                  anterior,
                ) => ({
                  ...anterior,

                  injetora:
                    evento.target
                      .value,

                  /*
                   * Ao trocar a injetora,
                   * volta o produto para Todos.
                   */
                  cod_prod:
                    "Todos",
                }),
              )
            }
          >

            <option value="Todos">
              Todas
            </option>


            {injetorasDisponiveis.map(
              (
                injetora,
              ) => (
                <option
                  key={
                    injetora
                  }
                  value={
                    injetora
                  }
                >
                  {injetora}
                </option>
              ),
            )}

          </select>

        </>
      )}


      {/* =================================================
          TURNO
      ================================================= */}

      {exibirTurno && (
        <>

          <label>
            TURNO
          </label>


          <select
            value={
              filtros.turno ||
              "Todos"
            }
            onChange={(
              evento,
            ) =>
              setFiltros(
                (
                  anterior,
                ) => ({
                  ...anterior,

                  turno:
                    evento.target
                      .value,
                }),
              )
            }
          >

            <option value="Todos">
              Todos os turnos
            </option>


            {TURNOS_DISPONIVEIS.map(
              (
                turno,
              ) => (
                <option
                  key={
                    turno
                  }
                  value={
                    turno
                  }
                >
                  {turno}
                </option>
              ),
            )}

          </select>

        </>
      )}


      {/* =================================================
          PRODUTO
      ================================================= */}

      {exibirProduto && (
        <>

          <label>
            CÓD. PROD
          </label>


          <select
            value={
              filtros.cod_prod ||
              "Todos"
            }
            disabled={
              exibirInjetora &&
              filtros.injetora ===
                "Todos"
            }
            onChange={(
              evento,
            ) =>
              setFiltros(
                (
                  anterior,
                ) => ({
                  ...anterior,

                  cod_prod:
                    evento.target
                      .value,
                }),
              )
            }
          >

            <option value="Todos">
              Todos
            </option>


            {produtosDisponiveis.map(
              (
                produto,
              ) => (
                <option
                  key={
                    produto
                  }
                  value={
                    produto
                  }
                >
                  {produto}
                </option>
              ),
            )}

          </select>

        </>
      )}


      {/* =================================================
          MATÉRIA-PRIMA
      ================================================= */}

      {exibirMp && (
        <>

          <label>
            MATÉRIA-PRIMA
          </label>


          <select
            value={
              filtros.mp ||
              "Todos"
            }
            onChange={(
              evento,
            ) =>
              setFiltros(
                (
                  anterior,
                ) => ({
                  ...anterior,

                  mp:
                    evento.target
                      .value,
                }),
              )
            }
          >

            <option value="Todos">
              Todas
            </option>


            {mpsDisponiveis.map(
              (
                mp,
              ) => (
                <option
                  key={
                    mp
                  }
                  value={
                    mp
                  }
                >
                  {mp}
                </option>
              ),
            )}

          </select>

        </>
      )}


      {/* =================================================
          TIPO
      ================================================= */}

      {exibirTipo &&
        tiposDisponiveis.length >
          0 && (
          <>

            <label>
              TIPO
            </label>


            <div className="checkbox-group tipo-checkbox-group">

              {tiposDisponiveis.map(
                (
                  tipo,
                ) => (
                  <label
                    key={
                      tipo
                    }
                    className="checkbox-label tipo-checkbox-label"
                  >

                    <input
                      type="checkbox"
                      checked={(
                        filtros.tipo ||
                        []
                      ).includes(
                        tipo,
                      )}
                      onChange={() =>
                        toggleTipo(
                          tipo,
                        )
                      }
                    />


                    <div className="tipo-label-conteudo">

                      <strong className="tipo-label-numero">
                        {tipo}
                      </strong>


                      <span className="tipo-label-descricao">
                        {obterDescricaoTipo(
                          tipo,
                        )}
                      </span>

                    </div>

                  </label>
                ),
              )}

            </div>

          </>
        )}

    </div>
  );
}