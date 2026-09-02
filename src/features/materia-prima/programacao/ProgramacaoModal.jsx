import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Save,
  X,
} from "lucide-react";

import {
  calcularConsumoProgramacao,
  verificarConflitoInjetora,
} from "./programacaoService";

import "./ProgramacaoModal.css";


/* =========================================================
   UTILITÁRIOS
========================================================= */

function dataHojeLocal() {
  const agora =
    new Date();

  const ano =
    agora.getFullYear();

  const mes =
    String(
      agora.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    );

  const dia =
    String(
      agora.getDate(),
    ).padStart(
      2,
      "0",
    );


  return `${ano}-${mes}-${dia}`;
}


function horaAtualLocal() {
  const agora =
    new Date();

  const hora =
    String(
      agora.getHours(),
    ).padStart(
      2,
      "0",
    );

  const minuto =
    String(
      agora.getMinutes(),
    ).padStart(
      2,
      "0",
    );


  return `${hora}:${minuto}`;
}


function converterDataHoraParaNumero(
  data,
  hora,
) {
  if (
    !data ||
    !hora
  ) {
    return null;
  }


  const [
    ano,
    mes,
    dia,
  ] =
    String(
      data,
    )
      .split(
        "-",
      )
      .map(
        Number,
      );

  const [
    horas,
    minutos,
  ] =
    String(
      hora,
    )
      .split(
        ":",
      )
      .map(
        Number,
      );


  if (
    !Number.isInteger(
      ano,
    ) ||
    !Number.isInteger(
      mes,
    ) ||
    !Number.isInteger(
      dia,
    ) ||
    !Number.isInteger(
      horas,
    ) ||
    !Number.isInteger(
      minutos,
    )
  ) {
    return null;
  }


  return Date.UTC(
    ano,
    mes - 1,
    dia,
    horas,
    minutos,
  );
}


function formatarKg(
  valor,
) {
  const numero =
    Number(
      valor,
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "0,000 kg";
  }


  return `${numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        3,

      maximumFractionDigits:
        3,
    },
  )} kg`;
}


function formatarNumero(
  valor,
  casas = 0,
) {
  const numero =
    Number(
      valor,
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "0";
  }


  return numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        casas,
      maximumFractionDigits:
        casas,
    },
  );
}


function formatarHoras(
  valor,
) {
  const numero =
    Number(
      valor,
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "0 h";
  }


  return `${numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        0,
      maximumFractionDigits:
        2,
    },
  )} h`;
}


/* =========================================================
   INJETORAS
========================================================= */

const INJETORAS =
  Array.from(
    {
      length: 11,
    },
    (
      _,
      indice,
    ) =>
      String(
        indice + 1,
      ).padStart(
        2,
        "0",
      ),
  );


/* =========================================================
   MODAL
========================================================= */

export default function ProgramacaoModal({
  aberto,
  item = null,
  produtos = [],
  programacao = [],
  salvando = false,
  onCancelar,
  onSalvar,
}) {
  const [
    dataInicio,
    setDataInicio,
  ] = useState(
    dataHojeLocal(),
  );

  const [
    horaInicio,
    setHoraInicio,
  ] = useState(
    horaAtualLocal(),
  );

  const [
    dataFim,
    setDataFim,
  ] = useState(
    dataHojeLocal(),
  );

  const [
    horaFim,
    setHoraFim,
  ] = useState("");

  const [
    codigoProduto,
    setCodigoProduto,
  ] = useState("");

  const [
    injetora,
    setInjetora,
  ] = useState("");

  const [
    ativo,
    setAtivo,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");


  /* =======================================================
     CARREGAR FORMULÁRIO
  ======================================================= */

  useEffect(
    () => {
      if (!aberto) {
        return;
      }


      if (item) {
        setDataInicio(
          item.dataInicio ||
            dataHojeLocal(),
        );

        setHoraInicio(
          item.horaInicio ||
            "",
        );

        setDataFim(
          item.dataFim ||
            item.dataInicio ||
            dataHojeLocal(),
        );

        setHoraFim(
          item.horaFim ||
            "",
        );

        setCodigoProduto(
          String(
            item
              .codigoProduto ??
              "",
          ),
        );

        setInjetora(
          String(
            item
              .injetora ??
              "",
          ),
        );

        setAtivo(
          item
            .ativo !==
          false,
        );
      } else {
        const hoje =
          dataHojeLocal();


        setDataInicio(
          hoje,
        );

        setHoraInicio(
          horaAtualLocal(),
        );

        setDataFim(
          hoje,
        );

        setHoraFim(
          "",
        );

        setCodigoProduto(
          "",
        );

        setInjetora(
          "",
        );

        setAtivo(
          true,
        );
      }


      setErro(
        "",
      );
    },
    [
      aberto,
      item,
    ],
  );


  /* =======================================================
     PRODUTO SELECIONADO
  ======================================================= */

  const produtoSelecionado =
    useMemo(
      () =>
        produtos.find(
          (
            produto,
          ) =>
            String(
              produto
                ?.codigo,
            ) ===
            String(
              codigoProduto,
            ),
        ) ??
        null,
      [
        produtos,
        codigoProduto,
      ],
    );


  /* =======================================================
     CÁLCULO
  ======================================================= */

  const calculo =
    useMemo(
      () =>
        calcularConsumoProgramacao({
          dataInicio,

          horaInicio,

          dataFim,

          horaFim,

          cicloSegundos:
            produtoSelecionado
              ?.cicloSegundos,

          cavidadeMolde:
            produtoSelecionado
              ?.cavidadeMolde,

          pesoKg:
            produtoSelecionado
              ?.pesoKg,

          receitaItens:
            produtoSelecionado
              ?.receitaItens ??
            [],
        }),
      [
        dataInicio,
        horaInicio,
        dataFim,
        horaFim,
        produtoSelecionado,
      ],
    );


  /* =======================================================
     INJETORAS OCUPADAS NO PERÍODO
  ======================================================= */

  const injetorasOcupadas =
    useMemo(
      () => {
        const ocupadas =
          new Set();


        if (
          !dataInicio ||
          !horaInicio ||
          !dataFim ||
          !horaFim
        ) {
          return ocupadas;
        }


        INJETORAS.forEach(
          (
            numero,
          ) => {
            const conflito =
              verificarConflitoInjetora({
                programacao,

                injetora:
                  numero,

                dataInicio,

                horaInicio,

                dataFim,

                horaFim,

                ignorarId:
                  item
                    ?.id ??
                  null,
              });


            if (conflito) {
              ocupadas.add(
                numero,
              );
            }
          },
        );


        return ocupadas;
      },
      [
        programacao,
        dataInicio,
        horaInicio,
        dataFim,
        horaFim,
        item,
      ],
    );


  /* =======================================================
     FECHAR COM ESC
  ======================================================= */

  useEffect(
    () => {
      if (!aberto) {
        return undefined;
      }


      function fecharComEscape(
        event,
      ) {
        if (
          event.key ===
            "Escape" &&
          !salvando
        ) {
          onCancelar?.();
        }
      }


      document.addEventListener(
        "keydown",
        fecharComEscape,
      );


      return () => {
        document.removeEventListener(
          "keydown",
          fecharComEscape,
        );
      };
    },
    [
      aberto,
      salvando,
      onCancelar,
    ],
  );


  /* =======================================================
     SALVAR
  ======================================================= */

  async function enviarFormulario(
    event,
  ) {
    event.preventDefault();


    setErro(
      "",
    );


    if (!dataInicio) {
      setErro(
        "Informe a data inicial.",
      );

      return;
    }


    if (!horaInicio) {
      setErro(
        "Informe a hora inicial.",
      );

      return;
    }


    if (!dataFim) {
      setErro(
        "Informe a data final.",
      );

      return;
    }


    if (!horaFim) {
      setErro(
        "Informe a hora final.",
      );

      return;
    }


    const inicio =
      converterDataHoraParaNumero(
        dataInicio,
        horaInicio,
      );

    const fim =
      converterDataHoraParaNumero(
        dataFim,
        horaFim,
      );


    if (
      inicio === null ||
      fim === null ||
      fim <= inicio
    ) {
      setErro(
        "A data e hora final precisam ser posteriores à data e hora inicial.",
      );

      return;
    }


    if (!codigoProduto) {
      setErro(
        "Selecione o produto.",
      );

      return;
    }


    if (
      !produtoSelecionado
    ) {
      setErro(
        "Produto selecionado não encontrado.",
      );

      return;
    }


    if (
      injetora &&
      injetorasOcupadas.has(
        injetora,
      )
    ) {
      setErro(
        `A Injetora ${injetora} já possui uma programação ativa neste período.`,
      );

      return;
    }


    if (
      !Number.isFinite(
        Number(
          produtoSelecionado
            ?.cicloSegundos,
        ),
      ) ||
      Number(
        produtoSelecionado
          ?.cicloSegundos,
      ) <= 0
    ) {
      setErro(
        "O produto selecionado não possui ciclo válido.",
      );

      return;
    }


    if (
      !Number.isInteger(
        Number(
          produtoSelecionado
            ?.cavidadeMolde,
        ),
      ) ||
      Number(
        produtoSelecionado
          ?.cavidadeMolde,
      ) <= 0
    ) {
      setErro(
        "O produto selecionado não possui quantidade de cavidades válida.",
      );

      return;
    }


    if (
      calculo.ciclosCompletos <= 0
    ) {
      setErro(
        "O período informado não é suficiente para completar um ciclo de produção.",
      );

      return;
    }


    try {
      await onSalvar?.({
        id:
          item
            ?.id ??
          null,

        dataInicio,

        horaInicio,

        dataFim,

        horaFim,

        codigoProduto,

        injetora:
          injetora ||
          null,

        ativo,
      });
    } catch (error) {
      setErro(
        error
          ?.message ||
          "Não foi possível salvar a programação.",
      );
    }
  }


  /* =======================================================
     NÃO RENDERIZAR
  ======================================================= */

  if (!aberto) {
    return null;
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="programacao-modal-overlay">

      <div
        className="programacao-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="programacao-modal-titulo"
      >

        <div className="programacao-modal-header">

          <div className="programacao-modal-header-icone">

            <CalendarDays
              size={22}
              strokeWidth={2}
              aria-hidden="true"
            />

          </div>


          <div className="programacao-modal-header-texto">

            <span>
              Matéria-Prima PP
            </span>

            <h3 id="programacao-modal-titulo">
              {item
                ? "Editar programação"
                : "Nova programação"}
            </h3>

            <p>
              Defina o período real de
              produção para calcular o
              consumo previsto de PP.
            </p>

          </div>


          <button
            type="button"
            className="programacao-modal-fechar"
            onClick={
              onCancelar
            }
            disabled={
              salvando
            }
            aria-label="Fechar"
          >

            <X
              size={19}
              strokeWidth={2}
              aria-hidden="true"
            />

          </button>

        </div>


        <form
          className="programacao-modal-form"
          onSubmit={
            enviarFormulario
          }
        >

          <div className="programacao-modal-grid">

            <label className="programacao-modal-campo">

              <span>
                Data início
              </span>

              <input
                type="date"
                value={
                  dataInicio
                }
                onChange={
                  (
                    event,
                  ) => {
                    const novaData =
                      event
                        .target
                        .value;


                    setDataInicio(
                      novaData,
                    );


                    if (
                      dataFim <
                      novaData
                    ) {
                      setDataFim(
                        novaData,
                      );
                    }


                    setErro(
                      "",
                    );
                  }
                }
                disabled={
                  salvando
                }
              />

            </label>


            <label className="programacao-modal-campo">

              <span>
                Hora início
              </span>

              <input
                type="time"
                value={
                  horaInicio
                }
                onChange={
                  (
                    event,
                  ) => {
                    setHoraInicio(
                      event
                        .target
                        .value,
                    );

                    setErro(
                      "",
                    );
                  }
                }
                disabled={
                  salvando
                }
              />

            </label>

          </div>


          <div className="programacao-modal-grid">

            <label className="programacao-modal-campo">

              <span>
                Data fim
              </span>

              <input
                type="date"
                min={
                  dataInicio
                }
                value={
                  dataFim
                }
                onChange={
                  (
                    event,
                  ) => {
                    setDataFim(
                      event
                        .target
                        .value,
                    );

                    setErro(
                      "",
                    );
                  }
                }
                disabled={
                  salvando
                }
              />

            </label>


            <label className="programacao-modal-campo">

              <span>
                Hora fim
              </span>

              <input
                type="time"
                value={
                  horaFim
                }
                onChange={
                  (
                    event,
                  ) => {
                    setHoraFim(
                      event
                        .target
                        .value,
                    );

                    setErro(
                      "",
                    );
                  }
                }
                disabled={
                  salvando
                }
              />

            </label>

          </div>


          <label className="programacao-modal-campo">

            <span>
              Injetora
            </span>

            <select
              value={
                injetora
              }
              onChange={
                (
                  event,
                ) => {
                  setInjetora(
                    event
                      .target
                      .value,
                  );

                  setErro(
                    "",
                  );
                }
              }
              disabled={
                salvando
              }
            >

              <option value="">
                Não informar
              </option>


              {INJETORAS.map(
                (
                  numero,
                ) => {

                  const ocupada =
                    injetorasOcupadas.has(
                      numero,
                    );


                  return (
                    <option
                      key={
                        numero
                      }
                      value={
                        numero
                      }
                      disabled={
                        ocupada
                      }
                    >
                      Injetora{" "}
                      {numero}

                      {ocupada
                        ? " - Ocupada"
                        : ""}
                    </option>
                  );
                },
              )}

            </select>

          </label>


          <label className="programacao-modal-campo">

            <span>
              Produto
            </span>

            <select
              value={
                codigoProduto
              }
              onChange={
                (
                  event,
                ) => {
                  setCodigoProduto(
                    event
                      .target
                      .value,
                  );

                  setErro(
                    "",
                  );
                }
              }
              disabled={
                salvando
              }
            >

              <option value="">
                Selecione o produto
              </option>


              {produtos.map(
                (
                  produto,
                ) => (

                  <option
                    key={
                      produto.codigo
                    }
                    value={
                      produto.codigo
                    }
                  >
                    {produto.codigo}
                    {" - "}
                    {produto
                      .descricao ||
                      "Sem descrição"}
                  </option>

                ),
              )}

            </select>

          </label>


          {produtoSelecionado && (

            <div className="programacao-modal-previsao">

              <div className="programacao-modal-previsao-header">

                <span>
                  Consumo total do período
                </span>

                <strong>
                  {
                    formatarKg(
                      calculo
                        .consumoPeriodoKg,
                    )
                  }
                </strong>

              </div>


              <div className="programacao-modal-previsao-info">

                <div>
                  <span>
                    Horas programadas
                  </span>

                  <strong>
                    {
                      formatarHoras(
                        calculo
                          .horasPeriodo,
                      )
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Ciclo
                  </span>

                  <strong>
                    {formatarNumero(
                      produtoSelecionado
                        .cicloSegundos,
                      0,
                    )}{" "}
                    s
                  </strong>
                </div>


                <div>
                  <span>
                    Cavidades
                  </span>

                  <strong>
                    {
                      formatarNumero(
                        produtoSelecionado
                          .cavidadeMolde,
                      )
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Peças / hora
                  </span>

                  <strong>
                    {
                      formatarNumero(
                        calculo
                          .pecasPorHora,
                        0,
                      )
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Peças previstas
                  </span>

                  <strong>
                    {
                      formatarNumero(
                        calculo
                          .pecasPrevistas,
                      )
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Peso da peça
                  </span>

                  <strong>
                    {
                      formatarKg(
                        produtoSelecionado
                          .pesoKg,
                      )
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    PP / hora
                  </span>

                  <strong>
                    {
                      formatarKg(
                        calculo
                          .consumoPorHoraKg,
                      )
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Receita
                  </span>

                  <strong>
                    {produtoSelecionado
                      .receitaConfigurada
                      ? "100% configurada"
                      : "Pendente"}
                  </strong>
                </div>

              </div>


              {produtoSelecionado
                .receitaConfigurada &&
                calculo
                  .consumosFornecedores
                  .length >
                  0 && (

                <div className="programacao-modal-fornecedores">

                  {calculo
                    .consumosFornecedores
                    .map(
                      (
                        fornecedor,
                      ) => (

                        <div
                          key={
                            fornecedor
                              .fornecedorId
                          }
                        >

                          <span>
                            {
                              fornecedor
                                .fornecedorNome
                            }

                            {" · "}

                            {
                              fornecedor
                                .percentual
                            }
                            %
                          </span>


                          <strong>
                            {
                              formatarKg(
                                fornecedor
                                  .consumoPeriodoKg,
                              )
                            }
                          </strong>

                        </div>

                      ),
                    )}

                </div>

              )}


              {!produtoSelecionado
                .receitaConfigurada && (

                <p className="programacao-modal-aviso">
                  A divisão do consumo por
                  fornecedor ficará disponível
                  quando a receita deste produto
                  estiver configurada em 100%.
                </p>

              )}

            </div>

          )}


          <label className="programacao-modal-status">

            <input
              type="checkbox"
              checked={
                ativo
              }
              onChange={
                (
                  event,
                ) =>
                  setAtivo(
                    event
                      .target
                      .checked,
                  )
              }
              disabled={
                salvando
              }
            />

            <div>

              <strong>
                Programação ativa
              </strong>

              <span>
                Programações ativas entram
                na projeção de consumo de PP.
              </span>

            </div>

          </label>


          {erro && (

            <div className="programacao-modal-erro">
              {erro}
            </div>

          )}


          <div className="programacao-modal-acoes">

            <button
              type="button"
              className="programacao-modal-cancelar"
              onClick={
                onCancelar
              }
              disabled={
                salvando
              }
            >
              Cancelar
            </button>


            <button
              type="submit"
              className="programacao-modal-salvar"
              disabled={
                salvando
              }
            >

              <Save
                size={17}
                strokeWidth={2}
                aria-hidden="true"
              />

              <span>
                {salvando
                  ? "Salvando..."
                  : "Salvar programação"}
              </span>

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}