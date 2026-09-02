import {
  useEffect,
  useState,
} from "react";

import {
  Save,
  Scale,
  X,
} from "lucide-react";

import "./SaldoInicialModal.css";


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
    texto.includes(",")
      ? texto
          .replace(/\./g, "")
          .replace(",", ".")
      : texto;


  const numero =
    Number(
      normalizado,
    );


  return Number.isFinite(numero)
    ? numero
    : null;
}


/* =========================================================
   MODAL
========================================================= */

export default function SaldoInicialModal({
  aberto,
  item = null,
  fornecedores = [],
  salvando = false,
  onCancelar,
  onSalvar,
}) {
  const [
    fornecedorId,
    setFornecedorId,
  ] = useState("");

  const [
    dataBase,
    setDataBase,
  ] = useState("");

  const [
    quantidadeKg,
    setQuantidadeKg,
  ] = useState("");

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


      if (item) {
        setFornecedorId(
          String(
            item.fornecedorId ??
              "",
          ),
        );

        setDataBase(
          item.dataBase ||
            dataHojeLocal(),
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

        setObservacao(
          item.observacao ||
            "",
        );

        setAtivo(
          item.ativo !==
            false,
        );
      } else {
        setFornecedorId("");

        setDataBase(
          dataHojeLocal(),
        );

        setQuantidadeKg("");

        setObservacao("");

        setAtivo(true);
      }


      setErro("");
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

  async function enviar(
    event,
  ) {
    event.preventDefault();

    setErro("");


    const quantidade =
      normalizarQuantidade(
        quantidadeKg,
      );


    if (!fornecedorId) {
      setErro(
        "Selecione o fornecedor.",
      );

      return;
    }


    if (!dataBase) {
      setErro(
        "Informe a data-base.",
      );

      return;
    }


    if (
      quantidade ===
        null ||
      quantidade < 0
    ) {
      setErro(
        "Informe uma quantidade válida.",
      );

      return;
    }


    try {
      await onSalvar?.({
        id:
          item?.id ??
          null,

        fornecedorId,

        dataBase,

        quantidadeKg:
          quantidade,

        observacao,

        ativo,
      });
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível salvar o saldo.",
      );
    }
  }


  if (!aberto) {
    return null;
  }


  return (
    <div className="saldo-inicial-modal-overlay">

      <div
        className="saldo-inicial-modal"
        role="dialog"
        aria-modal="true"
      >

        <div className="saldo-inicial-modal-header">

          <div className="saldo-inicial-modal-icone">

            <Scale
              size={22}
              aria-hidden="true"
            />

          </div>


          <div className="saldo-inicial-modal-header-texto">

            <span>
              Projeção de PP
            </span>

            <h3>
              {item
                ? "Editar saldo-base"
                : "Novo saldo-base"}
            </h3>

            <p>
              Informe a quantidade disponível
              do fornecedor na data-base.
            </p>

          </div>


          <button
            type="button"
            className="saldo-inicial-modal-fechar"
            onClick={
              onCancelar
            }
            disabled={
              salvando
            }
            aria-label="Fechar"
          >
            <X size={19} />
          </button>

        </div>


        <form
          className="saldo-inicial-modal-form"
          onSubmit={
            enviar
          }
        >

          <label className="saldo-inicial-modal-campo">

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
                ) => {
                  setFornecedorId(
                    event.target.value,
                  );

                  setErro("");
                }
              }
              disabled={
                salvando
              }
            >

              <option value="">
                Selecione o fornecedor
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

                      {!fornecedor.ativo
                        ? " (Inativo)"
                        : ""}
                    </option>

                  ),
                )}

            </select>

          </label>


          <div className="saldo-inicial-modal-grid">

            <label className="saldo-inicial-modal-campo">

              <span>
                Data-base
              </span>

              <input
                type="date"
                value={
                  dataBase
                }
                onChange={
                  (
                    event,
                  ) => {
                    setDataBase(
                      event.target.value,
                    );

                    setErro("");
                  }
                }
                disabled={
                  salvando
                }
              />

            </label>


            <label className="saldo-inicial-modal-campo">

              <span>
                Quantidade disponível
              </span>

              <div className="saldo-inicial-modal-quantidade">

                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    quantidadeKg
                  }
                  onChange={
                    (
                      event,
                    ) => {
                    setQuantidadeKg(
                      event.target.value,
                    );

                    setErro("");
                  }
                }
                placeholder="Ex.: 8500"
                disabled={
                  salvando
                }
              />

                <span>
                  kg
                </span>

              </div>

            </label>

          </div>


          <div className="saldo-inicial-modal-aviso">

            <strong>
              Como funciona a data-base?
            </strong>

            <p>
              Este valor passa a ser o ponto
              de partida do estoque deste
              fornecedor a partir da data
              informada. Um saldo-base mais
              recente poderá substituir este
              ponto de partida no futuro sem
              apagar o histórico.
            </p>

          </div>


          <label className="saldo-inicial-modal-campo">

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
                    event.target.value,
                  )
              }
              placeholder="Ex.: Inventário físico realizado no início do mês..."
              disabled={
                salvando
              }
            />

          </label>


          <label className="saldo-inicial-modal-status">

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
                    event.target.checked,
                  )
              }
              disabled={
                salvando
              }
            />

            <div>

              <strong>
                Saldo ativo
              </strong>

              <span>
                Somente saldos ativos serão
                utilizados pela projeção.
              </span>

            </div>

          </label>


          {erro && (

            <div className="saldo-inicial-modal-erro">
              {erro}
            </div>

          )}


          <div className="saldo-inicial-modal-acoes">

            <button
              type="button"
              className="saldo-inicial-modal-cancelar"
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
              className="saldo-inicial-modal-salvar"
              disabled={
                salvando
              }
            >

              <Save size={17} />

              {salvando
                ? "Salvando..."
                : "Salvar saldo"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}