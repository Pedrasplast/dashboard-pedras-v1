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
    dataFim,
    setDataFim,
  ] = useState(
    dataHojeLocal(),
  );

  const [
    codigoProduto,
    setCodigoProduto,
  ] = useState("");

  const [
    quantidade,
    setQuantidade,
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

        setDataFim(
          item.dataFim ||
            item.dataInicio ||
            dataHojeLocal(),
        );

        setCodigoProduto(
          String(
            item
              .codigoProduto ??
              "",
          ),
        );

        setQuantidade(
          String(
            item
              .quantidade ??
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

        setDataFim(
          hoje,
        );

        setCodigoProduto(
          "",
        );

        setQuantidade(
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
          quantidade:
            Number(
              quantidade,
            ),

          pesoKg:
            produtoSelecionado
              ?.pesoKg,

          receitaItens:
            produtoSelecionado
              ?.receitaItens ??
            [],

          dataInicio,

          dataFim,
        }),
      [
        quantidade,
        produtoSelecionado,
        dataInicio,
        dataFim,
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


    if (!dataFim) {
      setErro(
        "Informe a data final.",
      );

      return;
    }


    if (
      dataFim <
      dataInicio
    ) {
      setErro(
        "A data final não pode ser anterior à data inicial.",
      );

      return;
    }


    if (!codigoProduto) {
      setErro(
        "Selecione o produto.",
      );

      return;
    }


    const quantidadeNumero =
      Number(
        quantidade,
      );


    if (
      !Number.isInteger(
        quantidadeNumero,
      ) ||
      quantidadeNumero <=
        0
    ) {
      setErro(
        "Informe uma quantidade diária inteira maior que zero.",
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

        dataFim,

        codigoProduto,

        quantidade:
          quantidadeNumero,

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

        {/* =================================================
            CABEÇALHO
        ================================================= */}

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
              Defina o período e a
              quantidade diária de
              produção.
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


        {/* =================================================
            FORMULÁRIO
        ================================================= */}

        <form
          className="programacao-modal-form"
          onSubmit={
            enviarFormulario
          }
        >

          {/* ===============================================
              PERÍODO
          =============================================== */}

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

          </div>


          {/* ===============================================
              INJETORA
          =============================================== */}

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
                ) => (

                  <option
                    key={
                      numero
                    }
                    value={
                      numero
                    }
                  >
                    Injetora{" "}
                    {numero}
                  </option>

                ),
              )}

            </select>

          </label>


          {/* ===============================================
              PRODUTO
          =============================================== */}

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


          {/* ===============================================
              QUANTIDADE POR DIA
          =============================================== */}

          <label className="programacao-modal-campo">

            <span>
              Quantidade por dia
            </span>

            <div className="programacao-modal-quantidade">

              <input
                type="number"
                min="1"
                step="1"
                value={
                  quantidade
                }
                onChange={
                  (
                    event,
                  ) => {
                    setQuantidade(
                      event
                        .target
                        .value,
                    );

                    setErro(
                      "",
                    );
                  }
                }
                placeholder="Ex.: 1000"
                disabled={
                  salvando
                }
              />

              <span>
                peças/dia
              </span>

            </div>

          </label>


          {/* ===============================================
              PREVISÃO
          =============================================== */}

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
                    Dias programados
                  </span>

                  <strong>
                    {
                      calculo
                        .quantidadeDias
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
                    Consumo por dia
                  </span>

                  <strong>
                    {
                      formatarKg(
                        calculo
                          .consumoDiarioKg,
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


          {/* ===============================================
              STATUS
          =============================================== */}

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
                na projeção diária de PP.
              </span>

            </div>

          </label>


          {/* ===============================================
              ERRO
          =============================================== */}

          {erro && (

            <div className="programacao-modal-erro">
              {erro}
            </div>

          )}


          {/* ===============================================
              AÇÕES
          =============================================== */}

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