import {
  useEffect,
  useState,
} from "react";

import {
  Boxes,
  Save,
  X,
} from "lucide-react";

import "./CadastroProdutoModal.css";

/* =========================================================
   NÚMEROS
========================================================= */

function valorParaCampo(
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
  ).replace(
    ".",
    ",",
  );
}

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

  let normalizado =
    texto.replace(
      /\s/g,
      "",
    );

  if (
    normalizado.includes(",") &&
    normalizado.includes(".")
  ) {
    normalizado =
      normalizado
        .replace(
          /\./g,
          "",
        )
        .replace(
          ",",
          ".",
        );
  } else {
    normalizado =
      normalizado.replace(
        ",",
        ".",
      );
  }

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

export default function CadastroProdutoModal({
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
    cavidadeMolde,
    setCavidadeMolde,
  ] = useState("1");

  const [
    cicloSegundos,
    setCicloSegundos,
  ] = useState("");

  const [
    kgUn,
    setKgUn,
  ] = useState("");

  const [
    kgHaste,
    setKgHaste,
  ] = useState("");

  const [
    usaPp,
    setUsaPp,
  ] = useState(true);

  const [
    ativo,
    setAtivo,
  ] = useState(true);

  /*
   * Estes dois valores não aparecem
   * mais na interface.
   *
   * Continuam armazenados no estado
   * somente para preservar o que já
   * existe no banco ao editar.
   */
  const [
    tempoInjecaoSegundos,
    setTempoInjecaoSegundos,
  ] = useState("");

  const [
    tempoResfriamentoSegundos,
    setTempoResfriamentoSegundos,
  ] = useState("");

  const [
    erro,
    setErro,
  ] = useState("");

  /* =======================================================
     CARREGAR PRODUTO
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
            "",
        );

        setPesoKg(
          valorParaCampo(
            item.pesoKg,
          ),
        );

        setCavidadeMolde(
          valorParaCampo(
            item.cavidadeMolde ??
              1,
          ),
        );

        setCicloSegundos(
          valorParaCampo(
            item.cicloSegundos,
          ),
        );

        setKgUn(
          valorParaCampo(
            item.kgUn,
          ),
        );

        setKgHaste(
          valorParaCampo(
            item.kgHaste,
          ),
        );

        setUsaPp(
          item.usaPp ===
            true,
        );

        setAtivo(
          item.ativo !==
            false,
        );

        setTempoInjecaoSegundos(
          valorParaCampo(
            item.tempoInjecaoSegundos,
          ),
        );

        setTempoResfriamentoSegundos(
          valorParaCampo(
            item.tempoResfriamentoSegundos,
          ),
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

        setCavidadeMolde(
          "1",
        );

        setCicloSegundos(
          "",
        );

        setKgUn(
          "",
        );

        setKgHaste(
          "",
        );

        setUsaPp(
          true,
        );

        setAtivo(
          true,
        );

        setTempoInjecaoSegundos(
          "",
        );

        setTempoResfriamentoSegundos(
          "",
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
     BLOQUEAR SCROLL DO FUNDO
  ======================================================= */

  useEffect(
    () => {
      if (!aberto) {
        return undefined;
      }

      const overflowAnterior =
        document
          .body
          .style
          .overflow;

      document
        .body
        .style
        .overflow =
        "hidden";

      return () => {
        document
          .body
          .style
          .overflow =
          overflowAnterior;
      };
    },
    [
      aberto,
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

    const pesoFinal =
      normalizarNumero(
        pesoKg,
      );

    const cavidadeFinal =
      normalizarNumero(
        cavidadeMolde,
      );

    const cicloFinal =
      normalizarNumero(
        cicloSegundos,
      );

    const kgUnFinal =
      normalizarNumero(
        kgUn,
      );

    const kgHasteFinal =
      normalizarNumero(
        kgHaste,
      );

    const injecaoFinal =
      normalizarNumero(
        tempoInjecaoSegundos,
      );

    const resfriamentoFinal =
      normalizarNumero(
        tempoResfriamentoSegundos,
      );

    if (
      pesoKg.trim() &&
      pesoFinal === null
    ) {
      setErro(
        "Informe um peso válido.",
      );

      return;
    }

    if (
      pesoFinal !== null &&
      pesoFinal < 0
    ) {
      setErro(
        "O peso não pode ser negativo.",
      );

      return;
    }

    if (
      cavidadeFinal === null ||
      !Number.isInteger(
        cavidadeFinal,
      ) ||
      cavidadeFinal <= 0
    ) {
      setErro(
        "Informe uma quantidade de cavidades maior que zero.",
      );

      return;
    }

    if (
      cicloSegundos.trim() &&
      (
        cicloFinal === null ||
        cicloFinal <= 0
      )
    ) {
      setErro(
        "Informe um ciclo maior que zero.",
      );

      return;
    }

    if (
      kgUn.trim() &&
      (
        kgUnFinal === null ||
        kgUnFinal < 0
      )
    ) {
      setErro(
        "Informe um Kg/unidade válido.",
      );

      return;
    }

    if (
      kgHaste.trim() &&
      (
        kgHasteFinal === null ||
        kgHasteFinal < 0
      )
    ) {
      setErro(
        "Informe um Kg/haste válido.",
      );

      return;
    }

    try {
      await onSalvar?.({
        codigoProduto:
          codigoFinal,

        codigoOriginal:
          item
            ?.codigoProduto ??
          null,

        nomeProduto:
          nomeFinal,

        usaPp,

        pesoKg:
          pesoFinal,

        ativo,

        cavidadeMolde:
          cavidadeFinal,

        cicloSegundos:
          cicloFinal,

        /*
         * Preserva silenciosamente
         * os campos removidos da UI.
         */
        tempoInjecaoSegundos:
          injecaoFinal,

        tempoResfriamentoSegundos:
          resfriamentoFinal,

        kgUn:
          kgUnFinal,

        kgHaste:
          kgHasteFinal,
      });
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível salvar o produto.",
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
    <div className="produto-pp-modal-overlay">
      <div
        className="produto-pp-modal cadastro-produto-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cadastro-produto-modal-titulo"
      >
        {/* ===============================================
            CABEÇALHO
        =============================================== */}

        <div className="produto-pp-modal-header">
          <div className="produto-pp-modal-header-icone">
            <Boxes
              size={22}
              aria-hidden="true"
            />
          </div>

          <div className="produto-pp-modal-header-texto">
            <span>
              Cadastro
            </span>

            <h3 id="cadastro-produto-modal-titulo">
              {item
                ? "Editar produto"
                : "Cadastrar produto"}
            </h3>

            <p>
              Dados gerais e parâmetros utilizados
              no planejamento de produção.
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
            <X
              size={19}
            />
          </button>
        </div>

        {/* ===============================================
            FORMULÁRIO
        =============================================== */}

        <form
          className="produto-pp-modal-form"
          onSubmit={
            enviar
          }
        >
          {/* =============================================
              CÓDIGO / PESO
          ============================================= */}

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
                onChange={(
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
                }}
                placeholder="Ex.: 11374"
                autoComplete="off"
                disabled={
                  salvando ||
                  Boolean(
                    item,
                  )
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
                  onChange={(
                    event,
                  ) => {
                    setPesoKg(
                      event
                        .target
                        .value,
                    );

                    setErro(
                      "",
                    );
                  }}
                  placeholder="Ex.: 0,300"
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

          {/* =============================================
              NOME
          ============================================= */}

          <label className="produto-pp-modal-campo">
            <span>
              Nome do produto
            </span>

            <input
              type="text"
              value={
                nomeProduto
              }
              onChange={(
                event,
              ) => {
                setNomeProduto(
                  event
                    .target
                    .value,
                );

                setErro(
                  "",
                );
              }}
              placeholder="Ex.: Suporte 90x90"
              autoComplete="off"
              disabled={
                salvando
              }
            />
          </label>

          {/* =============================================
              CICLO / CAVIDADES
          ============================================= */}

          <div className="produto-pp-modal-grid">
            <label className="produto-pp-modal-campo">
              <span>
                Cavidades
              </span>

              <input
                type="number"
                min="1"
                step="1"
                value={
                  cavidadeMolde
                }
                onChange={(
                  event,
                ) => {
                  setCavidadeMolde(
                    event
                      .target
                      .value,
                  );

                  setErro(
                    "",
                  );
                }}
                disabled={
                  salvando
                }
              />
            </label>

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
                  onChange={(
                    event,
                  ) => {
                    setCicloSegundos(
                      event
                        .target
                        .value,
                    );

                    setErro(
                      "",
                    );
                  }}
                  placeholder="Ex.: 45"
                  disabled={
                    salvando
                  }
                />

                <span>
                  s
                </span>
              </div>
            </label>
          </div>

          {/* =============================================
              KG UNIDADE / KG HASTE
          ============================================= */}

          <div className="produto-pp-modal-grid">
            <label className="produto-pp-modal-campo">
              <span>
                Kg/unidade
              </span>

              <div className="produto-pp-modal-peso">
                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    kgUn
                  }
                  onChange={(
                    event,
                  ) => {
                    setKgUn(
                      event
                        .target
                        .value,
                    );

                    setErro(
                      "",
                    );
                  }}
                  placeholder="Ex.: 0,2470"
                  disabled={
                    salvando
                  }
                />

                <span>
                  kg
                </span>
              </div>
            </label>

            <label className="produto-pp-modal-campo">
              <span>
                Kg/haste
              </span>

              <div className="produto-pp-modal-peso">
                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    kgHaste
                  }
                  onChange={(
                    event,
                  ) => {
                    setKgHaste(
                      event
                        .target
                        .value,
                    );

                    setErro(
                      "",
                    );
                  }}
                  placeholder="Ex.: 0,1040"
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

          {/* =============================================
              OPÇÕES
          ============================================= */}

          <div className="cadastro-produto-modal-status-grid">
            <label className="produto-pp-modal-status">
              <input
                type="checkbox"
                checked={
                  usaPp
                }
                onChange={(
                  event,
                ) => {
                  setUsaPp(
                    event
                      .target
                      .checked,
                  );

                  setErro(
                    "",
                  );
                }}
                disabled={
                  salvando
                }
              />

              <div>
                <strong>
                  Usa PP
                </strong>

                <span>
                  Produto utiliza PP no cálculo
                  de matéria-prima.
                </span>
              </div>
            </label>

            <label className="produto-pp-modal-status">
              <input
                type="checkbox"
                checked={
                  ativo
                }
                onChange={(
                  event,
                ) => {
                  setAtivo(
                    event
                      .target
                      .checked,
                  );

                  setErro(
                    "",
                  );
                }}
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
                  no histórico do sistema.
                </span>
              </div>
            </label>
          </div>

          {/* =============================================
              ERRO
          ============================================= */}

          {erro && (
            <div className="produto-pp-modal-erro">
              {erro}
            </div>
          )}

          {/* =============================================
              AÇÕES
          ============================================= */}

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
              <Save
                size={17}
              />

              {salvando
                ? "Salvando..."
                : "Salvar produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}