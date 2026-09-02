import {
  useEffect,
  useState,
} from "react";

import {
  Boxes,
  Save,
  X,
} from "lucide-react";

import "./ProdutoPPModal.css";


/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarNumero(
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


  return Number.isFinite(
    numero,
  )
    ? numero
    : null;
}


function normalizarInteiro(
  valor,
) {
  const numero =
    normalizarNumero(
      valor,
    );


  if (
    numero === null ||
    !Number.isInteger(
      numero,
    )
  ) {
    return null;
  }


  return numero;
}


function formatarValor(
  valor,
  casasMinimas = 0,
  casasMaximas = 2,
) {
  const numero =
    normalizarNumero(
      valor,
    );


  if (
    numero === null
  ) {
    return "-";
  }


  return numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        casasMinimas,

      maximumFractionDigits:
        casasMaximas,
    },
  );
}


/* =========================================================
   MODAL PRODUTO PP
========================================================= */

export default function ProdutoPPModal({
  aberto,
  item = null,
  salvando = false,
  onCancelar,
  onSalvar,
}) {
  const [
    codigoProduto,
    setCodigoProduto,
  ] = useState("");

  const [
    nomeProduto,
    setNomeProduto,
  ] = useState("");

  const [
    pesoKg,
    setPesoKg,
  ] = useState("");

  const [
    cicloSegundos,
    setCicloSegundos,
  ] = useState("");

  const [
    cavidadeMolde,
    setCavidadeMolde,
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
        setCodigoProduto(
          item.codigoProduto ||
            "",
        );


        setNomeProduto(
          item.nomeProduto ||
            item.produto ||
            "",
        );


        setPesoKg(
          item.pesoKg ===
              null ||
          item.pesoKg ===
              undefined
            ? ""
            : String(
                item.pesoKg,
              ).replace(
                ".",
                ",",
              ),
        );


        setCicloSegundos(
          item.cicloSegundos ===
              null ||
          item.cicloSegundos ===
              undefined
            ? ""
            : String(
                item.cicloSegundos,
              ).replace(
                ".",
                ",",
              ),
        );


        setCavidadeMolde(
          item.cavidadeMolde ===
              null ||
          item.cavidadeMolde ===
              undefined
            ? ""
            : String(
                item.cavidadeMolde,
              ),
        );


        setAtivo(
          item.ativo !==
            false,
        );
      } else {
        setCodigoProduto(
          "",
        );

        setNomeProduto(
          "",
        );

        setPesoKg(
          "",
        );

        setCicloSegundos(
          "",
        );

        setCavidadeMolde(
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


      function fecharEscape(
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
        fecharEscape,
      );


      return () => {
        document.removeEventListener(
          "keydown",
          fecharEscape,
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


    setErro(
      "",
    );


    const codigoFinal =
      codigoProduto.trim();

    const nomeFinal =
      nomeProduto.trim();

    const pesoFinal =
      normalizarNumero(
        pesoKg,
      );

    const cicloFinal =
      normalizarNumero(
        cicloSegundos,
      );

    const cavidadeFinal =
      normalizarInteiro(
        cavidadeMolde,
      );


    if (!codigoFinal) {
      setErro(
        "Informe o código do produto.",
      );

      return;
    }


    if (!nomeFinal) {
      setErro(
        "Informe o nome do produto.",
      );

      return;
    }


    if (
      pesoFinal ===
        null ||
      pesoFinal <=
        0
    ) {
      setErro(
        "Informe um peso por peça maior que zero.",
      );

      return;
    }


    if (
      cicloFinal ===
        null ||
      cicloFinal <=
        0
    ) {
      setErro(
        "Informe um ciclo maior que zero.",
      );

      return;
    }


    if (
      cavidadeFinal ===
        null ||
      cavidadeFinal <=
        0
    ) {
      setErro(
        "Informe uma quantidade de cavidades inteira e maior que zero.",
      );

      return;
    }


    try {
      await onSalvar?.({
        codigoProdutoOriginal:
          item
            ?.codigoProduto ??
          null,

        codigoProduto:
          codigoFinal,

        nomeProduto:
          nomeFinal,

        pesoKg:
          pesoFinal,

        cicloSegundos:
          cicloFinal,

        cavidadeMolde:
          cavidadeFinal,

        ativo,
      });
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível salvar o produto.",
      );
    }
  }


  if (!aberto) {
    return null;
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="produto-pp-modal-overlay">

      <div
        className="produto-pp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="produto-pp-modal-titulo"
      >

        <div className="produto-pp-modal-header">

          <div className="produto-pp-modal-header-icone">

            <Boxes
              size={22}
              aria-hidden="true"
            />

          </div>


          <div className="produto-pp-modal-header-texto">

            <span>
              Matéria-Prima
            </span>

            <h3 id="produto-pp-modal-titulo">
              {item
                ? "Editar Produto PP"
                : "Cadastrar Produto PP"}
            </h3>

            <p>
              Informe os dados do produto e
              seus parâmetros de produção.
            </p>

          </div>


          <button
            type="button"
            className="produto-pp-modal-fechar"
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
          className="produto-pp-modal-form"
          onSubmit={
            enviar
          }
        >

          <div className="produto-pp-modal-grid">

            <label className="produto-pp-modal-campo">

              <span>
                Código
              </span>

              <input
                type="text"
                value={
                  codigoProduto
                }
                onChange={
                  (
                    event,
                  ) => {
                    setCodigoProduto(
                      event.target.value,
                    );

                    setErro(
                      "",
                    );
                  }
                }
                placeholder="Ex.: 10187"
                autoComplete="off"
                disabled={
                  salvando
                }
              />

            </label>


            <label className="produto-pp-modal-campo">

              <span>
                Peso por peça
              </span>

              <div className="produto-pp-modal-peso">

                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    pesoKg
                  }
                  onChange={
                    (
                      event,
                    ) => {
                    setPesoKg(
                      event.target.value,
                    );

                    setErro(
                      "",
                    );
                  }
                }
                  placeholder="Ex.: 0,840"
                  autoComplete="off"
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


          <label className="produto-pp-modal-campo">

            <span>
              Nome do produto
            </span>

            <input
              type="text"
              value={
                nomeProduto
              }
              onChange={
                (
                  event,
                ) => {
                  setNomeProduto(
                    event.target.value,
                  );

                  setErro(
                    "",
                  );
                }
              }
              placeholder="Ex.: Suporte Econômico"
              autoComplete="off"
              disabled={
                salvando
              }
            />

          </label>


          <div className="produto-pp-modal-grid">

            <label className="produto-pp-modal-campo">

              <span>
                Ciclo
              </span>

              <div className="produto-pp-modal-peso">

                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    cicloSegundos
                  }
                  onChange={
                    (
                      event,
                    ) => {
                    setCicloSegundos(
                      event.target.value,
                    );

                    setErro(
                      "",
                    );
                  }
                }
                  placeholder="Ex.: 79"
                  autoComplete="off"
                  disabled={
                    salvando
                  }
                />

                <span>
                  s
                </span>

              </div>

            </label>


            <label className="produto-pp-modal-campo">

              <span>
                Cavidades
              </span>

              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={
                  cavidadeMolde
                }
                onChange={
                  (
                    event,
                  ) => {
                    setCavidadeMolde(
                      event.target.value,
                    );

                    setErro(
                      "",
                    );
                  }
                }
                placeholder="Ex.: 1"
                autoComplete="off"
                disabled={
                  salvando
                }
              />

            </label>

          </div>


          <div className="produto-pp-modal-resumo">

            <div>

              <span>
                Peso
              </span>

              <strong>
                {normalizarNumero(
                  pesoKg,
                ) !== null
                  ? `${formatarValor(
                      pesoKg,
                      3,
                      6,
                    )} kg`
                  : "-"}
              </strong>

            </div>


            <div>

              <span>
                Ciclo
              </span>

              <strong>
                {normalizarNumero(
                  cicloSegundos,
                ) !== null
                  ? `${formatarValor(
                      cicloSegundos,
                      0,
                      2,
                    )} s`
                  : "-"}
              </strong>

            </div>


            <div>

              <span>
                Cavidades
              </span>

              <strong>
                {normalizarInteiro(
                  cavidadeMolde,
                ) !== null
                  ? normalizarInteiro(
                      cavidadeMolde,
                    )
                  : "-"}
              </strong>

            </div>

          </div>


          <label className="produto-pp-modal-status">

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
                Produto ativo
              </strong>

              <span>
                Produtos inativos permanecem
                no histórico, mas não devem
                ser utilizados em novas
                programações.
              </span>

            </div>

          </label>


          {erro && (

            <div className="produto-pp-modal-erro">
              {erro}
            </div>

          )}


          <div className="produto-pp-modal-acoes">

            <button
              type="button"
              className="produto-pp-modal-cancelar"
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
              className="produto-pp-modal-salvar"
              disabled={
                salvando
              }
            >

              <Save size={17} />

              {salvando
                ? "Salvando..."
                : item
                  ? "Salvar alterações"
                  : "Salvar produto"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}