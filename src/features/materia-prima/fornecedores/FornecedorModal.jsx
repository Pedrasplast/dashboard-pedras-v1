import {
  useEffect,
  useState,
} from "react";

import {
  Save,
  Truck,
  X,
} from "lucide-react";

import "./FornecedorModal.css";


/* =========================================================
   UTILITÁRIOS
========================================================= */

function valorCampoNumero(
  valor,
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "";
  }


  return String(
    valor,
  );
}


function converterNumeroOpcional(
  valor,
  nomeCampo,
) {
  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ""
  ) {
    return null;
  }


  const numero =
    Number(
      String(valor)
        .trim()
        .replace(
          ",",
          ".",
        ),
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    throw new Error(
      `Informe um valor válido para ${nomeCampo}.`,
    );
  }


  if (
    numero < 0
  ) {
    throw new Error(
      `${nomeCampo} não pode ser negativo.`,
    );
  }


  return numero;
}


/* =========================================================
   MODAL FORNECEDOR
========================================================= */

export default function FornecedorModal({
  aberto,
  fornecedor = null,
  salvando = false,
  onCancelar,
  onSalvar,
}) {
  const [
    nome,
    setNome,
  ] = useState("");

  const [
    estoqueMinimoKg,
    setEstoqueMinimoKg,
  ] = useState("");

  const [
    estoqueAlvoKg,
    setEstoqueAlvoKg,
  ] = useState("");

  const [
    leadTimeDias,
    setLeadTimeDias,
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
     CARREGAR DADOS NO FORMULÁRIO
  ======================================================= */

  useEffect(
    () => {
      if (!aberto) {
        return;
      }


      if (fornecedor) {
        setNome(
          String(
            fornecedor
              ?.nome ??
              "",
          ),
        );

        setEstoqueMinimoKg(
          valorCampoNumero(
            fornecedor
              ?.estoqueMinimoKg,
          ),
        );

        setEstoqueAlvoKg(
          valorCampoNumero(
            fornecedor
              ?.estoqueAlvoKg,
          ),
        );

        setLeadTimeDias(
          valorCampoNumero(
            fornecedor
              ?.leadTimeDias,
          ),
        );

        setAtivo(
          fornecedor
            ?.ativo !==
          false,
        );
      } else {
        setNome(
          "",
        );

        setEstoqueMinimoKg(
          "",
        );

        setEstoqueAlvoKg(
          "",
        );

        setLeadTimeDias(
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
      fornecedor,
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
          event.key !==
          "Escape"
        ) {
          return;
        }


        if (salvando) {
          return;
        }


        onCancelar?.();
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


    const nomeFinal =
      String(
        nome ??
        "",
      ).trim();


    setErro(
      "",
    );


    if (!nomeFinal) {
      setErro(
        "Informe o nome do fornecedor.",
      );

      return;
    }


    try {
      const estoqueMinimoFinal =
        converterNumeroOpcional(
          estoqueMinimoKg,
          "o estoque mínimo",
        );

      const estoqueAlvoFinal =
        converterNumeroOpcional(
          estoqueAlvoKg,
          "o estoque alvo",
        );

      const leadTimeFinal =
        converterNumeroOpcional(
          leadTimeDias,
          "o prazo de entrega",
        );


      if (
        leadTimeFinal !== null &&
        !Number.isInteger(
          leadTimeFinal,
        )
      ) {
        setErro(
          "O prazo de entrega precisa ser informado em dias inteiros.",
        );

        return;
      }


      if (
        estoqueMinimoFinal !== null &&
        estoqueAlvoFinal !== null &&
        estoqueAlvoFinal <
          estoqueMinimoFinal
      ) {
        setErro(
          "O estoque alvo deve ser maior ou igual ao estoque mínimo.",
        );

        return;
      }


      await onSalvar?.({
        id:
          fornecedor
            ?.id ??
          null,

        nome:
          nomeFinal,

        estoqueMinimoKg:
          estoqueMinimoFinal,

        estoqueAlvoKg:
          estoqueAlvoFinal,

        leadTimeDias:
          leadTimeFinal,

        ativo:
          Boolean(
            ativo,
          ),
      });
    } catch (error) {
      setErro(
        error
          ?.message ||
          "Não foi possível salvar o fornecedor.",
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
    <div className="fornecedor-modal-overlay">

      <div
        className="fornecedor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fornecedor-modal-titulo"
      >

        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <div className="fornecedor-modal-header">

          <div className="fornecedor-modal-header-icone">

            <Truck
              size={22}
              strokeWidth={2}
              aria-hidden="true"
            />

          </div>


          <div className="fornecedor-modal-header-texto">

            <span>
              Matéria-Prima PP
            </span>

            <h3 id="fornecedor-modal-titulo">
              {fornecedor
                ? "Editar fornecedor"
                : "Novo fornecedor"}
            </h3>

            <p>
              Cadastre o fornecedor e os
              parâmetros utilizados no
              planejamento de compras.
            </p>

          </div>


          <button
            type="button"
            className="fornecedor-modal-fechar"
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
          className="fornecedor-modal-form"
          onSubmit={
            enviarFormulario
          }
        >

          {/* ===============================================
              NOME
          =============================================== */}

          <label className="fornecedor-modal-campo">

            <span className="fornecedor-modal-label">
              Nome do fornecedor
            </span>


            <input
              type="text"
              value={
                nome
              }
              onChange={
                (
                  event,
                ) => {
                  setNome(
                    event
                      .target
                      .value,
                  );

                  setErro(
                    "",
                  );
                }
              }
              placeholder="Ex.: Fornecedor A"
              autoFocus
              disabled={
                salvando
              }
            />

          </label>


          {/* ===============================================
              ESTOQUE MÍNIMO
          =============================================== */}

          <label className="fornecedor-modal-campo">

            <span className="fornecedor-modal-label">
              Estoque mínimo (kg)
            </span>


            <input
              type="number"
              min="0"
              step="0.001"
              value={
                estoqueMinimoKg
              }
              onChange={
                (
                  event,
                ) => {
                  setEstoqueMinimoKg(
                    event
                      .target
                      .value,
                  );

                  setErro(
                    "",
                  );
                }
              }
              placeholder="Ex.: 2000"
              disabled={
                salvando
              }
            />

          </label>


          {/* ===============================================
              ESTOQUE ALVO
          =============================================== */}

          <label className="fornecedor-modal-campo">

            <span className="fornecedor-modal-label">
              Estoque alvo (kg)
            </span>


            <input
              type="number"
              min="0"
              step="0.001"
              value={
                estoqueAlvoKg
              }
              onChange={
                (
                  event,
                ) => {
                  setEstoqueAlvoKg(
                    event
                      .target
                      .value,
                  );

                  setErro(
                    "",
                  );
                }
              }
              placeholder="Ex.: 6000"
              disabled={
                salvando
              }
            />

          </label>


          {/* ===============================================
              PRAZO DE ENTREGA
          =============================================== */}

          <label className="fornecedor-modal-campo">

            <span className="fornecedor-modal-label">
              Prazo de entrega (dias)
            </span>


            <input
              type="number"
              min="0"
              step="1"
              value={
                leadTimeDias
              }
              onChange={
                (
                  event,
                ) => {
                  setLeadTimeDias(
                    event
                      .target
                      .value,
                  );

                  setErro(
                    "",
                  );
                }
              }
              placeholder="Ex.: 5"
              disabled={
                salvando
              }
            />

            <small>
              O estoque mínimo dispara a necessidade de compra. O estoque alvo define até onde repor e o prazo será usado para calcular a data limite da compra.
            </small>

          </label>


          {/* ===============================================
              STATUS
          =============================================== */}

          <div className="fornecedor-modal-campo">

            <span className="fornecedor-modal-label">
              Status
            </span>


            <div className="fornecedor-modal-opcoes">

              <label
                className={
                  ativo
                    ? "fornecedor-modal-opcao ativo"
                    : "fornecedor-modal-opcao"
                }
              >

                <input
                  type="radio"
                  name="fornecedor-status"
                  checked={
                    ativo ===
                    true
                  }
                  onChange={
                    () =>
                      setAtivo(
                        true,
                      )
                  }
                  disabled={
                    salvando
                  }
                />

                <span>
                  Ativo
                </span>

              </label>


              <label
                className={
                  !ativo
                    ? "fornecedor-modal-opcao ativo"
                    : "fornecedor-modal-opcao"
                }
              >

                <input
                  type="radio"
                  name="fornecedor-status"
                  checked={
                    ativo ===
                    false
                  }
                  onChange={
                    () =>
                      setAtivo(
                        false,
                      )
                  }
                  disabled={
                    salvando
                  }
                />

                <span>
                  Inativo
                </span>

              </label>

            </div>


            <small>
              Fornecedores inativos
              permanecem registrados,
              mas poderão ser ocultados
              das novas receitas.
            </small>

          </div>


          {/* ===============================================
              ERRO
          =============================================== */}

          {erro && (

            <div className="fornecedor-modal-erro">
              {erro}
            </div>

          )}


          {/* ===============================================
              AÇÕES
          =============================================== */}

          <div className="fornecedor-modal-acoes">

            <button
              type="button"
              className="fornecedor-modal-btn-cancelar"
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
              className="fornecedor-modal-btn-salvar"
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
                  : "Salvar"}
              </span>

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}