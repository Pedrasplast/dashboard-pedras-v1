import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";
import {
  AlertTriangle,
  FlaskConical,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

function criarChaveItem() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function converterNumero(valor) {
  const numero = Number(
    String(valor ?? "")
      .trim()
      .replace(",", "."),
  );

  return Number.isFinite(numero) ? numero : 0;
}

function formatarPercentual(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0%";
  }

  return `${numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  })}%`;
}

function montarItensIniciais(receita) {
  if (
    !Array.isArray(receita?.itens) ||
    receita.itens.length === 0
  ) {
    return [
      {
        chave: criarChaveItem(),
        fornecedorId: "",
        percentual: "100",
      },
    ];
  }

  return receita.itens.map((item) => ({
    chave: criarChaveItem(),
    fornecedorId: String(
      item.fornecedorId ?? "",
    ),
    percentual: String(
      item.percentual ?? "",
    ),
  }));
}

export default function CadastroReceitaModal({
  aberto,
  receita,
  fornecedores,
  salvando,
  onCancelar,
  onSalvar,
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [itens, setItens] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) {
      return;
    }

    setNome(receita?.nome ?? "");
    setDescricao(receita?.descricao ?? "");
    setItens(montarItensIniciais(receita));
    setErro("");
  }, [aberto, receita]);

  const total = useMemo(
    () =>
      Math.round(
        (
          itens.reduce(
            (soma, item) =>
              soma +
              converterNumero(
                item.percentual,
              ),
            0,
          ) +
          Number.EPSILON
        ) *
          10000,
      ) / 10000,
    [itens],
  );

  const totalValido =
    Math.abs(total - 100) <= 0.0001;

  const fornecedoresUsados = useMemo(
    () =>
      new Set(
        itens
          .map((item) =>
            String(
              item.fornecedorId || "",
            ),
          )
          .filter(Boolean),
      ),
    [itens],
  );

  const fornecedoresAtivos = useMemo(
    () =>
      fornecedores.filter(
        (fornecedor) =>
          fornecedor.ativo === true,
      ),
    [fornecedores],
  );

  function atualizarItem(
    chave,
    campo,
    valor,
  ) {
    setItens((atuais) =>
      atuais.map((item) =>
        item.chave === chave
          ? {
              ...item,
              [campo]: valor,
            }
          : item,
      ),
    );

    setErro("");
  }

  function adicionarItem() {
    const fornecedorDisponivel =
      fornecedoresAtivos.find(
        (fornecedor) =>
          !fornecedoresUsados.has(
            String(fornecedor.id),
          ),
      );

    setItens((atuais) => [
      ...atuais,
      {
        chave: criarChaveItem(),
        fornecedorId:
          fornecedorDisponivel
            ? String(
                fornecedorDisponivel.id,
              )
            : "",
        percentual: "",
      },
    ]);
  }

  function removerItem(chave) {
    setItens((atuais) =>
      atuais.filter(
        (item) =>
          item.chave !== chave,
      ),
    );

    setErro("");
  }

  function fornecedorPodeSerSelecionado(
    fornecedorId,
    chaveAtual,
  ) {
    return !itens.some(
      (item) =>
        item.chave !== chaveAtual &&
        String(item.fornecedorId) ===
          String(fornecedorId),
    );
  }

  async function handleSubmit(evento) {
    evento.preventDefault();

    setErro("");

    const nomeFinal = String(
      nome ?? "",
    ).trim();

    if (!nomeFinal) {
      setErro(
        "Informe o nome da receita.",
      );

      return;
    }

    if (itens.length === 0) {
      setErro(
        "Adicione pelo menos um fornecedor à receita.",
      );

      return;
    }

    if (
      itens.some(
        (item) =>
          !String(
            item.fornecedorId || "",
          ).trim(),
      )
    ) {
      setErro(
        "Selecione o fornecedor de todos os componentes.",
      );

      return;
    }

    if (
      itens.some((item) => {
        const percentual =
          converterNumero(
            item.percentual,
          );

        return (
          percentual <= 0 ||
          percentual > 100
        );
      })
    ) {
      setErro(
        "Informe percentuais maiores que 0 e menores ou iguais a 100.",
      );

      return;
    }

    if (!totalValido) {
      setErro(
        `A composição precisa totalizar 100%. Total atual: ${formatarPercentual(
          total,
        )}.`,
      );

      return;
    }

    try {
      await onSalvar({
        id: receita?.id ?? null,
        nome: nomeFinal,
        descricao: String(
          descricao ?? "",
        ).trim(),

        itens: itens.map((item) => ({
          fornecedorId: Number(
            item.fornecedorId,
          ),

          percentual:
            converterNumero(
              item.percentual,
            ),
        })),
      });
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível salvar a receita.",
      );
    }
  }

  if (!aberto) {
    return null;
  }

  return (
    <Modal
      asChild
      aberto={true}
      onFechar={onCancelar}
      bloqueado={salvando}
      tamanho="grande"
      fecharAoClicarFora={false}
    >
      <form
        className="cadastro-receita-modal"
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cadastro-receita-modal-titulo"
      >
        <header className="cadastro-receita-modal__header" data-modal-header="">
          <div className="cadastro-receita-modal__icone" data-modal-icone="">
            <FlaskConical size={22} />
          </div>

          <div className="cadastro-receita-modal__titulo">
            <span>
              Cadastro
            </span>

            <ModalTitulo>
              <h2 id="cadastro-receita-modal-titulo">
                {receita
                  ? "Editar receita"
                  : "Nova receita"}
              </h2>
            </ModalTitulo>

            <p>
              A receita é independente
              do produto. O produto será
              relacionado à receita somente
              na programação de cada dia.
            </p>
          </div>

          <button
            type="button"
            className="cadastro-receita-modal__fechar"
            onClick={onCancelar}
            disabled={salvando}
            aria-label="Fechar"
            data-modal-fechar=""
          >
            <X size={18} />
          </button>
        </header>

        <div className="cadastro-receita-modal__body" data-modal-body="">
          <div className="cadastro-receita-modal__campos">
            <label className="cadastro-receita-campo">
              <span>
                Nome da receita *
              </span>

              <input
                type="text"
                value={nome}
                onChange={(evento) =>
                  setNome(
                    evento.target.value,
                  )
                }
                placeholder="Ex.: PP 70/30"
                maxLength={120}
                disabled={salvando}
                autoFocus
              />
            </label>

            <label className="cadastro-receita-campo">
              <span>
                Descrição
              </span>

              <textarea
                value={descricao}
                onChange={(evento) =>
                  setDescricao(
                    evento.target.value,
                  )
                }
                placeholder="Observação opcional sobre a composição"
                rows={3}
                maxLength={500}
                disabled={salvando}
              />
            </label>
          </div>

          <section className="cadastro-receita-composicao">
            <div className="cadastro-receita-composicao__header" data-modal-header="">
              <div>
                <span>
                  Composição
                </span>

                <h3>
                  Fornecedores e percentuais
                </h3>
              </div>

              <div
                className={
                  totalValido
                    ? "cadastro-receita-total cadastro-receita-total--valido"
                    : "cadastro-receita-total cadastro-receita-total--invalido"
                }
              >
                <small>
                  Total
                </small>

                <strong>
                  {formatarPercentual(
                    total,
                  )}
                </strong>
              </div>
            </div>

            <div className="cadastro-receita-componentes">
              {itens.map(
                (item, indice) => (
                  <div
                    className="cadastro-receita-componente"
                    key={item.chave}
                  >
                    <div className="cadastro-receita-componente__ordem">
                      {indice + 1}
                    </div>

                    <label className="cadastro-receita-campo cadastro-receita-campo--fornecedor">
                      <span>
                        Fornecedor
                      </span>

                      <select
                        value={
                          item.fornecedorId
                        }
                        onChange={(evento) =>
                          atualizarItem(
                            item.chave,
                            "fornecedorId",
                            evento.target.value,
                          )
                        }
                        disabled={salvando}
                      >
                        <option value="">
                          Selecione...
                        </option>

                        {fornecedores.map(
                          (fornecedor) => {
                            const selecionado =
                              String(
                                fornecedor.id,
                              ) ===
                              String(
                                item.fornecedorId,
                              );

                            const disponivel =
                              selecionado ||
                              (
                                fornecedor.ativo &&
                                fornecedorPodeSerSelecionado(
                                  fornecedor.id,
                                  item.chave,
                                )
                              );

                            if (!disponivel) {
                              return null;
                            }

                            return (
                              <option
                                key={
                                  fornecedor.id
                                }
                                value={
                                  fornecedor.id
                                }
                              >
                                {
                                  fornecedor.nome
                                }

                                {!fornecedor.ativo
                                  ? " (inativo)"
                                  : ""}
                              </option>
                            );
                          },
                        )}
                      </select>
                    </label>

                    <label className="cadastro-receita-campo cadastro-receita-campo--percentual">
                      <span>
                        Percentual
                      </span>

                      <div className="cadastro-receita-percentual-input">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={
                            item.percentual
                          }
                          onChange={(
                            evento,
                          ) =>
                            atualizarItem(
                              item.chave,
                              "percentual",
                              evento.target.value,
                            )
                          }
                          placeholder="0"
                          disabled={
                            salvando
                          }
                        />

                        <span>
                          %
                        </span>
                      </div>
                    </label>

                    <button
                      type="button"
                      className="cadastro-receita-remover"
                      onClick={() =>
                        removerItem(
                          item.chave,
                        )
                      }
                      disabled={
                        salvando ||
                        itens.length <= 1
                      }
                      title="Remover componente"
                    >
                      <Trash2
                        size={16}
                      />
                    </button>
                  </div>
                ),
              )}
            </div>

            <button
              type="button"
              className="cadastro-receita-adicionar"
              onClick={adicionarItem}
              disabled={
                salvando ||
                fornecedoresAtivos.length <=
                  fornecedoresUsados.size
              }
            >
              <Plus size={16} />

              Adicionar fornecedor
            </button>
          </section>

          {erro && (
            <div className="cadastro-receita-modal__erro">
              <AlertTriangle
                size={17}
              />

              <span>
                {erro}
              </span>
            </div>
          )}
        </div>

        <footer className="cadastro-receita-modal__footer" data-modal-footer="">
          <button
            type="button"
            className="cadastro-receita-botao-secundario"
            onClick={onCancelar}
            disabled={salvando}
            data-modal-acao="secundaria"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="cadastro-receita-botao-primario"
            disabled={
              salvando ||
              !totalValido
            }
            data-modal-acao="primaria"
          >
            <Save size={16} />

            {salvando
              ? "Salvando..."
              : "Salvar receita"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}