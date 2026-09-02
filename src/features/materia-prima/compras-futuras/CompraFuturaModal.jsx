import {
  useEffect,
  useState,
} from "react";

import {
  Save,
  ShoppingCart,
  X,
} from "lucide-react";

import {
  STATUS_COMPRA_FUTURA,
} from "./comprasFuturasService";

import "./CompraFuturaModal.css";


/* =========================================================
   DATA LOCAL
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


function normalizarQuantidade(
  valor,
) {
  const texto =
    String(
      valor ?? "",
    ).trim();


  if (!texto) {
    return null;
  }


  const normalizado =
    texto.includes(
      ",",
    )
      ? texto
          .replace(
            /\./g,
            "",
          )
          .replace(
            ",",
            ".",
          )
      : texto;


  const numero =
    Number(
      normalizado,
    );


  return Number.isFinite(
    numero,
  )
    ? numero
    : null;
}


/* =========================================================
   MODAL
========================================================= */

export default function CompraFuturaModal({
  aberto,
  item = null,
  fornecedores = [],
  salvando = false,
  onCancelar,
  onSalvar,
}) {
  const [
    dataCompra,
    setDataCompra,
  ] = useState("");

  const [
    dataPrevista,
    setDataPrevista,
  ] = useState("");

  const [
    dataRecebimento,
    setDataRecebimento,
  ] = useState("");

  const [
    fornecedorId,
    setFornecedorId,
  ] = useState("");

  const [
    quantidadeKg,
    setQuantidadeKg,
  ] = useState("");

  const [
    numeroPedido,
    setNumeroPedido,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState(
    "PREVISTA",
  );

  const [
    observacao,
    setObservacao,
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
     CARREGAR
  ======================================================= */

  useEffect(
    () => {
      if (!aberto) {
        return;
      }


      const hoje =
        dataHojeLocal();


      if (item) {
        setDataCompra(
          item.dataCompra ||
            hoje,
        );

        setDataPrevista(
          item.dataPrevista ||
            hoje,
        );

        setDataRecebimento(
          item.dataRecebimento ||
            "",
        );

        setFornecedorId(
          String(
            item.fornecedorId ??
              "",
          ),
        );

        setQuantidadeKg(
          String(
            item.quantidadeKg ??
              "",
          ).replace(
            ".",
            ",",
          ),
        );

        setNumeroPedido(
          item.numeroPedido ||
            "",
        );

        setStatus(
          item.status ||
            "PREVISTA",
        );

        setObservacao(
          item.observacao ||
            "",
        );

        setAtivo(
          item.ativo !==
            false,
        );
      } else {
        setDataCompra(
          hoje,
        );

        setDataPrevista(
          hoje,
        );

        setDataRecebimento(
          "",
        );

        setFornecedorId(
          "",
        );

        setQuantidadeKg(
          "",
        );

        setNumeroPedido(
          "",
        );

        setStatus(
          "PREVISTA",
        );

        setObservacao(
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
     ESC
  ======================================================= */

  useEffect(
    () => {
      if (!aberto) {
        return undefined;
      }


      function teclado(
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
        teclado,
      );


      return () =>
        document.removeEventListener(
          "keydown",
          teclado,
        );
    },
    [
      aberto,
      salvando,
      onCancelar,
    ],
  );


  /* =======================================================
     ALTERAR STATUS
  ======================================================= */

  function alterarStatus(
    novoStatus,
  ) {
    setStatus(
      novoStatus,
    );


    /*
     * A data real de recebimento NÃO é
     * preenchida automaticamente.
     *
     * Quando a compra for alterada para
     * RECEBIDA, o usuário deverá informar
     * manualmente a data em que o material
     * realmente chegou.
     */
    if (
      novoStatus !==
      "RECEBIDA"
    ) {
      setDataRecebimento(
        "",
      );
    }


    setErro(
      "",
    );
  }


  /* =======================================================
     SALVAR
  ======================================================= */

  async function enviar(
    event,
  ) {
    event.preventDefault();


    setErro(
      "",
    );


    const quantidade =
      normalizarQuantidade(
        quantidadeKg,
      );


    if (!dataCompra) {
      setErro(
        "Informe a data da compra.",
      );

      return;
    }


    if (!dataPrevista) {
      setErro(
        "Informe a previsão de chegada.",
      );

      return;
    }


    if (
      dataPrevista <
      dataCompra
    ) {
      setErro(
        "A previsão não pode ser anterior à data da compra.",
      );

      return;
    }


    if (!fornecedorId) {
      setErro(
        "Selecione o fornecedor.",
      );

      return;
    }


    if (
      quantidade ===
        null ||
      quantidade <=
        0
    ) {
      setErro(
        "Informe uma quantidade maior que zero.",
      );

      return;
    }


    if (
      status ===
        "RECEBIDA" &&
      !dataRecebimento
    ) {
      setErro(
        "Informe a data real de recebimento.",
      );

      return;
    }


    try {
      await onSalvar?.({
        id:
          item?.id ??
          null,

        dataCompra,

        dataPrevista,

        dataRecebimento:
          status ===
            "RECEBIDA"
            ? dataRecebimento
            : null,

        fornecedorId,

        quantidadeKg:
          quantidade,

        numeroPedido,

        status,

        observacao,

        ativo,
      });
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível salvar a compra.",
      );
    }
  }


  if (!aberto) {
    return null;
  }


  return (
    <div className="compra-futura-modal-overlay">

      <div className="compra-futura-modal">

        <div className="compra-futura-modal-header">

          <div className="compra-futura-modal-icone">

            <ShoppingCart
              size={22}
              aria-hidden="true"
            />

          </div>


          <div className="compra-futura-modal-header-texto">

            <span>
              Matéria-Prima PP
            </span>

            <h3>
              {item
                ? "Editar compra"
                : "Nova compra futura"}
            </h3>

            <p>
              Cadastre a compra e acompanhe
              até o recebimento.
            </p>

          </div>


          <button
            type="button"
            className="compra-futura-modal-fechar"
            onClick={
              onCancelar
            }
            disabled={
              salvando
            }
          >
            <X size={19} />
          </button>

        </div>


        <form
          className="compra-futura-modal-form"
          onSubmit={
            enviar
          }
        >

          <div className="compra-futura-modal-grid">

            <label className="compra-futura-modal-campo">

              <span>
                Data da compra
              </span>

              <input
                type="date"
                value={
                  dataCompra
                }
                onChange={
                  (
                    event,
                  ) => {
                    const valor =
                      event
                        .target
                        .value;


                    setDataCompra(
                      valor,
                    );


                    if (
                      dataPrevista <
                      valor
                    ) {
                      setDataPrevista(
                        valor,
                      );
                    }
                  }
                }
                disabled={
                  salvando
                }
              />

            </label>


            <label className="compra-futura-modal-campo">

              <span>
                Previsão de chegada
              </span>

              <input
                type="date"
                min={
                  dataCompra
                }
                value={
                  dataPrevista
                }
                onChange={
                  (
                    event,
                  ) =>
                    setDataPrevista(
                      event
                        .target
                        .value,
                    )
                }
                disabled={
                  salvando
                }
              />

            </label>

          </div>


          <label className="compra-futura-modal-campo">

            <span>
              Fornecedor / fonte
            </span>

            <select
              value={
                fornecedorId
              }
              onChange={
                (
                  event,
                ) =>
                  setFornecedorId(
                    event
                      .target
                      .value,
                  )
              }
              disabled={
                salvando
              }
            >

              <option value="">
                Selecione
              </option>


              {fornecedores
                .filter(
                  (
                    fornecedor,
                  ) =>
                    fornecedor.ativo ||
                    String(
                      fornecedor.id,
                    ) ===
                      String(
                        fornecedorId,
                      ),
                )
                .map(
                  (
                    fornecedor,
                  ) => (

                    <option
                      key={
                        fornecedor.id
                      }
                      value={
                        fornecedor.id
                      }
                    >
                      {fornecedor.nome}

                      {!fornecedor
                        .ativo
                        ? " (Inativo)"
                        : ""}
                    </option>

                  ),
                )}

            </select>

          </label>


          <div className="compra-futura-modal-grid">

            <label className="compra-futura-modal-campo">

              <span>
                Quantidade
              </span>

              <div className="compra-futura-modal-quantidade">

                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    quantidadeKg
                  }
                  onChange={
                    (
                      event,
                    ) =>
                      setQuantidadeKg(
                        event
                          .target
                          .value,
                      )
                  }
                  placeholder="Ex.: 10000"
                  disabled={
                    salvando
                  }
                />

                <span>
                  kg
                </span>

              </div>

            </label>


            <label className="compra-futura-modal-campo">

              <span>
                Pedido / OC
              </span>

              <input
                type="text"
                value={
                  numeroPedido
                }
                onChange={
                  (
                    event,
                  ) =>
                    setNumeroPedido(
                      event
                        .target
                        .value,
                    )
                }
                placeholder="Ex.: OC 12345"
                disabled={
                  salvando
                }
              />

            </label>

          </div>


          <label className="compra-futura-modal-campo">

            <span>
              Status
            </span>

            <select
              value={
                status
              }
              onChange={
                (
                  event,
                ) =>
                  alterarStatus(
                    event
                      .target
                      .value,
                  )
              }
              disabled={
                salvando
              }
            >

              {STATUS_COMPRA_FUTURA.map(
                (
                  opcao,
                ) => (

                  <option
                    key={
                      opcao.valor
                    }
                    value={
                      opcao.valor
                    }
                  >
                    {opcao.nome}
                  </option>

                ),
              )}

            </select>

          </label>


          {status ===
            "RECEBIDA" && (

            <label className="compra-futura-modal-campo compra-futura-modal-recebimento">

              <span>
                Data real do recebimento
              </span>

              <input
                type="date"
                value={
                  dataRecebimento
                }
                onChange={
                  (
                    event,
                  ) => {
                    setDataRecebimento(
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

              <small>
                Informe a data em que o
                material realmente chegou.
                Ao salvar como Recebida,
                esta compra aparecerá
                automaticamente na tela
                Entradas.
              </small>

            </label>

          )}


          <label className="compra-futura-modal-campo">

            <span>
              Observação
            </span>

            <textarea
              rows={3}
              value={
                observacao
              }
              onChange={
                (
                  event,
                ) =>
                  setObservacao(
                    event
                      .target
                      .value,
                  )
              }
              placeholder="Informações adicionais..."
              disabled={
                salvando
              }
            />

          </label>


          <label className="compra-futura-modal-status">

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
                Compra ativa
              </strong>

              <span>
                Compras inativas não entram
                nos cálculos da projeção.
              </span>
            </div>

          </label>


          {erro && (

            <div className="compra-futura-modal-erro">
              {erro}
            </div>

          )}


          <div className="compra-futura-modal-acoes">

            <button
              type="button"
              className="compra-futura-modal-cancelar"
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
              className="compra-futura-modal-salvar"
              disabled={
                salvando
              }
            >

              <Save size={17} />

              {salvando
                ? "Salvando..."
                : "Salvar compra"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}