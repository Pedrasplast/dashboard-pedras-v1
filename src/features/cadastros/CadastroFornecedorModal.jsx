import {
  useEffect,
  useState,
} from "react";

import {
  Save,
  Truck,
  X,
} from "lucide-react";

import "./CadastroProdutoModal.css";

/* =========================================================
   UTILITÁRIOS
========================================================= */

function valorParaCampo(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "";
  }

  return String(valor).replace(
    ".",
    ",",
  );
}

function normalizarNumero(valor) {
  const texto =
    String(valor ?? "").trim();

  if (!texto) {
    return null;
  }

  let normalizado =
    texto.replace(/\s/g, "");

  if (
    normalizado.includes(",") &&
    normalizado.includes(".")
  ) {
    normalizado =
      normalizado
        .replace(/\./g, "")
        .replace(",", ".");
  } else {
    normalizado =
      normalizado.replace(
        ",",
        ".",
      );
  }

  const numero =
    Number(normalizado);

  return Number.isFinite(numero)
    ? numero
    : null;
}

/* =========================================================
   MODAL
========================================================= */

export default function CadastroFornecedorModal({
  aberto,
  item = null,
  materiais = [],
  vinculosMateriais = [],
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
    materiaisSelecionados,
    setMateriaisSelecionados,
  ] = useState([]);

  const [
    materialPadraoId,
    setMaterialPadraoId,
  ] = useState("");

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
        setNome(
          item.nome || "",
        );

        setEstoqueMinimoKg(
          valorParaCampo(
            item.estoqueMinimoKg,
          ),
        );

        setEstoqueAlvoKg(
          valorParaCampo(
            item.estoqueAlvoKg,
          ),
        );

        setLeadTimeDias(
          valorParaCampo(
            item.leadTimeDias,
          ),
        );

        setAtivo(
          item.ativo !== false,
        );
      } else {
        setNome("");
        setEstoqueMinimoKg("");
        setEstoqueAlvoKg("");
        setLeadTimeDias("");
        setAtivo(true);
      }

      const vinculosAtivos =
        (
          Array.isArray(
            vinculosMateriais,
          )
            ? vinculosMateriais
            : []
        ).filter(
          (vinculo) =>
            vinculo.ativo !==
            false,
        );

      setMateriaisSelecionados(
        vinculosAtivos.map(
          (vinculo) =>
            String(
              vinculo.materialId,
            ),
        ),
      );

      const vinculoPadrao =
        vinculosAtivos.find(
          (vinculo) =>
            vinculo.padrao ===
            true,
        );

      setMaterialPadraoId(
        vinculoPadrao
          ? String(
              vinculoPadrao.materialId,
            )
          : vinculosAtivos[0]
            ? String(
                vinculosAtivos[0]
                  .materialId,
              )
            : "",
      );

      setErro("");
    },
    [
      aberto,
      item,
      vinculosMateriais,
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

      function fecharEscape(event) {
        if (
          event.key === "Escape" &&
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
     SCROLL
  ======================================================= */

  useEffect(
    () => {
      if (!aberto) {
        return undefined;
      }

      const overflowAnterior =
        document.body.style.overflow;

      document.body.style.overflow =
        "hidden";

      return () => {
        document.body.style.overflow =
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

  async function enviar(event) {
    event.preventDefault();

    setErro("");

    const nomeFinal =
      nome.trim();

    if (!nomeFinal) {
      setErro(
        "Informe o nome do fornecedor.",
      );

      return;
    }

    const minimoFinal =
      normalizarNumero(
        estoqueMinimoKg,
      );

    const alvoFinal =
      normalizarNumero(
        estoqueAlvoKg,
      );

    const leadFinal =
      normalizarNumero(
        leadTimeDias,
      );

    if (
      estoqueMinimoKg.trim() &&
      minimoFinal === null
    ) {
      setErro(
        "Informe um estoque mínimo válido.",
      );

      return;
    }

    if (
      minimoFinal !== null &&
      minimoFinal < 0
    ) {
      setErro(
        "O estoque mínimo não pode ser negativo.",
      );

      return;
    }

    if (
      estoqueAlvoKg.trim() &&
      alvoFinal === null
    ) {
      setErro(
        "Informe um estoque alvo válido.",
      );

      return;
    }

    if (
      alvoFinal !== null &&
      alvoFinal < 0
    ) {
      setErro(
        "O estoque alvo não pode ser negativo.",
      );

      return;
    }

    if (
      minimoFinal !== null &&
      alvoFinal !== null &&
      alvoFinal < minimoFinal
    ) {
      setErro(
        "O estoque alvo não pode ser menor que o estoque mínimo.",
      );

      return;
    }

    if (
      leadTimeDias.trim() &&
      (
        leadFinal === null ||
        !Number.isInteger(
          leadFinal,
        )
      )
    ) {
      setErro(
        "O lead time deve ser um número inteiro.",
      );

      return;
    }

    if (
      leadFinal !== null &&
      leadFinal < 0
    ) {
      setErro(
        "O lead time não pode ser negativo.",
      );

      return;
    }

    if (
      materiaisSelecionados.length ===
      0
    ) {
      setErro(
        "Selecione pelo menos um material fornecido.",
      );

      return;
    }

    const materialPadraoFinal =
      materiaisSelecionados.includes(
        String(
          materialPadraoId,
        ),
      )
        ? String(
            materialPadraoId,
          )
        : materiaisSelecionados[0];

    try {
      await onSalvar?.({
        id:
          item?.id ??
          null,

        nome:
          nomeFinal,

        ativo,

        estoqueMinimoKg:
          minimoFinal,

        estoqueAlvoKg:
          alvoFinal,

        leadTimeDias:
          leadFinal,

        materialIds:
          materiaisSelecionados,

        materialPadraoId:
          materialPadraoFinal,
      });
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível salvar o fornecedor.",
      );
    }
  }

  if (!aberto) {
    return null;
  }

  return (
    <div className="produto-pp-modal-overlay">
      <div
        className="produto-pp-modal cadastro-produto-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cadastro-fornecedor-modal-titulo"
      >
        <div className="produto-pp-modal-header">
          <div className="produto-pp-modal-header-icone">
            <Truck
              size={22}
              aria-hidden="true"
            />
          </div>

          <div className="produto-pp-modal-header-texto">
            <span>
              Cadastro
            </span>

            <h3 id="cadastro-fornecedor-modal-titulo">
              {item
                ? "Editar fornecedor"
                : "Cadastrar fornecedor"}
            </h3>

            <p>
              Dados utilizados no planejamento
              e abastecimento de matéria-prima.
            </p>
          </div>

          <button
            type="button"
            className="produto-pp-modal-fechar"
            onClick={onCancelar}
            disabled={salvando}
            aria-label="Fechar"
          >
            <X size={19} />
          </button>
        </div>

        <form
          className="produto-pp-modal-form"
          onSubmit={enviar}
        >
          <label className="produto-pp-modal-campo">
            <span>
              Nome do fornecedor
            </span>

            <input
              type="text"
              value={nome}
              onChange={(event) => {
                setNome(
                  event.target.value,
                );

                setErro("");
              }}
              placeholder="Ex.: RECICLAM"
              autoComplete="off"
              disabled={salvando}
            />
          </label>

          <div className="produto-pp-modal-grid">
            <label className="produto-pp-modal-campo">
              <span>
                Estoque mínimo
              </span>

              <div className="produto-pp-modal-peso">
                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    estoqueMinimoKg
                  }
                  onChange={(event) => {
                    setEstoqueMinimoKg(
                      event.target.value,
                    );

                    setErro("");
                  }}
                  placeholder="Ex.: 500"
                  disabled={salvando}
                />

                <span>
                  kg
                </span>
              </div>
            </label>

            <label className="produto-pp-modal-campo">
              <span>
                Estoque alvo
              </span>

              <div className="produto-pp-modal-peso">
                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    estoqueAlvoKg
                  }
                  onChange={(event) => {
                    setEstoqueAlvoKg(
                      event.target.value,
                    );

                    setErro("");
                  }}
                  placeholder="Ex.: 1.000"
                  disabled={salvando}
                />

                <span>
                  kg
                </span>
              </div>
            </label>
          </div>

          <label className="produto-pp-modal-campo">
            <span>
              Lead time
            </span>

            <div className="produto-pp-modal-peso">
              <input
                type="number"
                min="0"
                step="1"
                value={
                  leadTimeDias
                }
                onChange={(event) => {
                  setLeadTimeDias(
                    event.target.value,
                  );

                  setErro("");
                }}
                placeholder="Ex.: 3"
                disabled={salvando}
              />

              <span>
                dias
              </span>
            </div>
          </label>

          <div className="produto-pp-modal-campo">
            <span>
              Materiais fornecidos
            </span>

            <div className="cadastro-fornecedor-materiais">
              {materiais
                .filter(
                  (material) =>
                    material.ativo ||
                    materiaisSelecionados.includes(
                      String(
                        material.id,
                      ),
                    ),
                )
                .map(
                  (material) => {
                    const materialId =
                      String(
                        material.id,
                      );

                    const selecionado =
                      materiaisSelecionados.includes(
                        materialId,
                      );

                    return (
                      <div
                        key={
                          material.id
                        }
                        className={
                          selecionado
                            ? "cadastro-fornecedor-material cadastro-fornecedor-material--selecionado"
                            : "cadastro-fornecedor-material"
                        }
                      >
                        <label className="cadastro-fornecedor-material__check">
                          <input
                            type="checkbox"
                            checked={
                              selecionado
                            }
                            onChange={
                              (event) => {
                                const marcado =
                                  event
                                    .target
                                    .checked;

                                setErro(
                                  "",
                                );

                                setMateriaisSelecionados(
                                  (
                                    atual,
                                  ) => {
                                    const proximos =
                                      marcado
                                        ? [
                                            ...new Set([
                                              ...atual,
                                              materialId,
                                            ]),
                                          ]
                                        : atual.filter(
                                            (
                                              id,
                                            ) =>
                                              id !==
                                              materialId,
                                          );

                                    if (
                                      !proximos.includes(
                                        String(
                                          materialPadraoId,
                                        ),
                                      )
                                    ) {
                                      setMaterialPadraoId(
                                        proximos[0] ??
                                          "",
                                      );
                                    }

                                    return proximos;
                                  },
                                );
                              }
                            }
                            disabled={
                              salvando
                            }
                          />

                          <span>
                            {
                              material.nome
                            }
                          </span>
                        </label>

                        {selecionado && (
                          <label className="cadastro-fornecedor-material__padrao">
                            <input
                              type="radio"
                              name="material-padrao"
                              checked={
                                String(
                                  materialPadraoId,
                                ) ===
                                materialId
                              }
                              onChange={
                                () =>
                                  setMaterialPadraoId(
                                    materialId,
                                  )
                              }
                              disabled={
                                salvando
                              }
                            />

                            <span>
                              Padrão
                            </span>
                          </label>
                        )}
                      </div>
                    );
                  },
                )}
            </div>

            {materiais.length ===
              0 && (
              <small className="cadastro-fornecedor-materiais-ajuda">
                Cadastre primeiro
                um material em
                Cadastro &gt;
                Material.
              </small>
            )}

            {materiais.length >
              0 && (
              <small className="cadastro-fornecedor-materiais-ajuda">
                Selecione todos
                os materiais que
                este fornecedor
                vende e marque um
                deles como padrão.
              </small>
            )}
          </div>

          <label className="produto-pp-modal-status">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(event) => {
                setAtivo(
                  event.target.checked,
                );

                setErro("");
              }}
              disabled={salvando}
            />

            <div>
              <strong>
                Fornecedor ativo
              </strong>

              <span>
                Fornecedores inativos permanecem
                no histórico e nas receitas antigas.
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
              onClick={onCancelar}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="produto-pp-modal-salvar"
              disabled={salvando}
            >
              <Save size={17} />

              {salvando
                ? "Salvando..."
                : "Salvar fornecedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}