import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  Clock3,
  History,
  PackageCheck,
  RotateCcw,
  X,
} from "lucide-react";

import {
  buscarHistoricoRecebimentoFisico,
  buscarItensRecebimentoFisico,
  estornarRecebimentoFisicoItem,
  receberSaldoFisicoCompleto,
  registrarRecebimentoFisicoItem,
} from "../services/recebimentoFisico.service";
import {
  formatarNumero,
} from "../utils/pedidosCompra.utils";

function obterCodigoPedidoCompra(pedido) {
  const codigo = Number(
    pedido?.cod_ped_compra ??
      pedido?.codigo_pedido_compra ??
      pedido?.codigoPedidoCompra ??
      null,
  );

  return Number.isFinite(codigo) && codigo > 0
    ? codigo
    : null;
}

function formatarDataHora(valor) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

function rotuloMovimento(tipo) {
  return tipo === "ESTORNO"
    ? "Estorno"
    : "Recebimento";
}

export default function PedidosCompraRecebimentoFisicoModal({
  pedido,
  aberto,
  onFechar,
  onAlterado,
}) {
  const [itens, setItens] =
    useState([]);
  const [historico, setHistorico] =
    useState([]);
  const [quantidades, setQuantidades] =
    useState({});
  const [observacoes, setObservacoes] =
    useState({});
  const [estornoAberto, setEstornoAberto] =
    useState(null);
  const [quantidadeEstorno, setQuantidadeEstorno] =
    useState("");
  const [motivoEstorno, setMotivoEstorno] =
    useState("");
  const [aba, setAba] =
    useState("itens");
  const [carregando, setCarregando] =
    useState(false);
  const [salvando, setSalvando] =
    useState(false);
  const [erro, setErro] =
    useState("");
  const [mensagem, setMensagem] =
    useState("");
  const [confirmarReceberTudoAberto, setConfirmarReceberTudoAberto] =
    useState(false);

  const codPedidoCompra =
    obterCodigoPedidoCompra(
      pedido,
    );

  async function recarregar() {
    if (!codPedidoCompra) {
      setItens([]);
      setHistorico([]);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const [
        itensCarregados,
        historicoCarregado,
      ] = await Promise.all([
        buscarItensRecebimentoFisico(
          codPedidoCompra,
        ),
        buscarHistoricoRecebimentoFisico(
          codPedidoCompra,
        ),
      ]);

      const itensOmie = Array.isArray(pedido?.itens)
        ? pedido.itens
        : [];

      const mapaOmie = new Map(
        itensOmie.map((item) => [
          String(item?.codigo_item ?? ""),
          item,
        ]),
      );

      const itensComSituacaoVisual = itensCarregados.map((item) => {
        const itemOmie = mapaOmie.get(
          String(item?.codigo_item ?? ""),
        );

        const quantidadePedida = Math.max(
          Number(item?.quantidade_pedida ?? itemOmie?.quantidade ?? 0),
          0,
        );

        const recebidoManual = Math.max(
          Number(item?.quantidade_recebida_fisica ?? 0),
          0,
        );

        const recebidoOmie = Math.min(
          Math.max(Number(itemOmie?.quantidade_recebida ?? 0), 0),
          quantidadePedida,
        );

        const recebidoConsiderado = Math.max(
          recebidoManual,
          recebidoOmie,
        );

        const pendenteConsiderado = Math.max(
          quantidadePedida - recebidoConsiderado,
          0,
        );

        const situacaoVisual =
          quantidadePedida > 0 && pendenteConsiderado <= 0
            ? "COMPLETO"
            : recebidoConsiderado > 0
              ? "PARCIAL"
              : "NAO_RECEBIDO";

        const origemVisual =
          recebidoManual > 0 && recebidoOmie > 0
            ? "OMIE_E_MANUAL"
            : recebidoOmie > 0
              ? "OMIE"
              : recebidoManual > 0
                ? "MANUAL"
                : "NENHUMA";

        return {
          ...item,
          quantidade_recebida_fisica_manual: recebidoManual,
          quantidade_recebida_omie: recebidoOmie,
          quantidade_recebida_fisica: recebidoConsiderado,
          quantidade_pendente_fisica: pendenteConsiderado,
          situacao_recebimento_fisico: situacaoVisual,
          origem_recebimento_visual: origemVisual,
        };
      });

      setItens(
        itensComSituacaoVisual,
      );
      setHistorico(
        historicoCarregado,
      );
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível carregar o recebimento físico.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(
    () => {
      if (!aberto) {
        return;
      }

      setAba("itens");
      setQuantidades({});
      setObservacoes({});
      setEstornoAberto(null);
      setQuantidadeEstorno("");
      setMotivoEstorno("");
      setErro("");
      setMensagem("");
      setConfirmarReceberTudoAberto(false);

      recarregar();
    },
    [aberto, codPedidoCompra],
  );

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
    [aberto],
  );

  const resumo =
    useMemo(
      () => {
        const totalItens =
          itens.length;
        const completos =
          itens.filter(
            (item) =>
              item.situacao_recebimento_fisico ===
              "COMPLETO",
          ).length;
        const parcial =
          itens.some(
            (item) =>
              Number(
                item.quantidade_recebida_fisica ??
                  0,
              ) > 0,
          );

        const situacao =
          totalItens > 0 &&
          completos === totalItens
            ? "COMPLETO"
            : parcial
              ? "PARCIAL"
              : "NAO_RECEBIDO";

        return {
          totalItens,
          completos,
          situacao,
        };
      },
      [itens],
    );

  if (!aberto || !pedido) {
    return null;
  }

  async function depoisDeAlterar(
    mensagemSucesso,
  ) {
    await recarregar();
    setMensagem(
      mensagemSucesso,
    );
    onAlterado?.();
  }

  async function registrarItem(item) {
    const quantidade = Number(
      String(
        quantidades[item.codigo_item] ??
          "",
      ).replace(",", "."),
    );

    if (
      !Number.isFinite(quantidade) ||
      quantidade <= 0
    ) {
      setErro(
        "Informe uma quantidade válida para o recebimento.",
      );
      return;
    }

    if (
      quantidade >
      Number(
        item.quantidade_pendente_fisica ??
          0,
      )
    ) {
      setErro(
        `A quantidade máxima para este item é ${formatarNumero(
          item.quantidade_pendente_fisica,
          2,
        )}.`,
      );
      return;
    }

    setSalvando(true);
    setErro("");
    setMensagem("");

    try {
      await registrarRecebimentoFisicoItem({
        codPedidoCompra,
        codigoItem:
          item.codigo_item,
        quantidade,
        observacao:
          observacoes[
            item.codigo_item
          ],
      });

      setQuantidades(
        (atual) => ({
          ...atual,
          [item.codigo_item]: "",
        }),
      );
      setObservacoes(
        (atual) => ({
          ...atual,
          [item.codigo_item]: "",
        }),
      );

      await depoisDeAlterar(
        "Recebimento físico registrado.",
      );
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível registrar o recebimento.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function receberRestanteItem(item) {
    const restante = Number(
      item.quantidade_pendente_fisica ??
        0,
    );

    if (restante <= 0) {
      return;
    }

    setSalvando(true);
    setErro("");
    setMensagem("");

    try {
      await registrarRecebimentoFisicoItem({
        codPedidoCompra,
        codigoItem:
          item.codigo_item,
        quantidade: restante,
        observacao:
          observacoes[
            item.codigo_item
          ],
      });

      await depoisDeAlterar(
        "Saldo físico do item recebido.",
      );
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível receber o saldo do item.",
      );
    } finally {
      setSalvando(false);
    }
  }

  function receberTudo() {
    const existemPendentes =
      itens.some(
        (item) =>
          Number(
            item.quantidade_pendente_fisica ??
              0,
          ) > 0,
      );

    if (!existemPendentes) {
      return;
    }

    setConfirmarReceberTudoAberto(true);
  }

  async function confirmarReceberTudo() {
    setSalvando(true);
    setErro("");
    setMensagem("");

    try {
      const total =
        await receberSaldoFisicoCompleto({
          codPedidoCompra,
          itens,
          observacao:
            "Recebimento físico completo pelo botão Receber tudo.",
        });

      setConfirmarReceberTudoAberto(false);

      await depoisDeAlterar(
        `${total} item(ns) atualizado(s) como recebido(s) fisicamente.`,
      );
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível receber todo o pedido.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarEstorno(item) {
    const quantidade = Number(
      String(
        quantidadeEstorno ?? "",
      ).replace(",", "."),
    );

    if (
      !Number.isFinite(quantidade) ||
      quantidade <= 0
    ) {
      setErro(
        "Informe uma quantidade válida para o estorno.",
      );
      return;
    }

    if (
      quantidade >
      Number(
        item.quantidade_recebida_fisica ??
          0,
      )
    ) {
      setErro(
        "O estorno não pode ser maior que o total físico recebido.",
      );
      return;
    }

    if (!motivoEstorno.trim()) {
      setErro(
        "Informe o motivo do estorno.",
      );
      return;
    }

    setSalvando(true);
    setErro("");
    setMensagem("");

    try {
      await estornarRecebimentoFisicoItem({
        codPedidoCompra,
        codigoItem:
          item.codigo_item,
        quantidade,
        observacao:
          motivoEstorno,
      });

      setEstornoAberto(null);
      setQuantidadeEstorno("");
      setMotivoEstorno("");

      await depoisDeAlterar(
        "Estorno registrado no histórico.",
      );
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível registrar o estorno.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="compras-rf-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onFechar?.();
        }
      }}
    >
      <section
        className="compras-rf-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Recebimento físico do pedido"
      >
        <header className="compras-rf-cabecalho">
          <div>
            <span className="compras-rf-sobretitulo">
              Recebimento físico
            </span>

            <h2>
              Pedido {pedido.numero_pedido || "-"}
            </h2>

            <p>
              {pedido.fornecedor_nome || "Fornecedor não informado"}
            </p>
          </div>

          <button
            type="button"
            className="compras-rf-fechar"
            onClick={onFechar}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="compras-rf-resumo">
          <div>
            <span>Status físico</span>
            <strong>
              {resumo.situacao === "COMPLETO"
                ? "Completo"
                : resumo.situacao === "PARCIAL"
                  ? "Parcial"
                  : "Não recebido"}
            </strong>
          </div>

          <div>
            <span>Itens completos</span>
            <strong>
              {resumo.completos}/{resumo.totalItens}
            </strong>
          </div>

          <button
            type="button"
            className="compras-rf-btn compras-rf-btn--sucesso"
            onClick={receberTudo}
            disabled={
              salvando ||
              carregando ||
              resumo.situacao === "COMPLETO"
            }
          >
            <PackageCheck size={16} />
            Receber tudo
          </button>
        </div>

        <nav className="compras-rf-abas">
          <button
            type="button"
            className={
              aba === "itens"
                ? "ativo"
                : ""
            }
            onClick={() =>
              setAba("itens")
            }
          >
            <PackageCheck size={15} />
            Itens
          </button>

          <button
            type="button"
            className={
              aba === "historico"
                ? "ativo"
                : ""
            }
            onClick={() =>
              setAba("historico")
            }
          >
            <History size={15} />
            Histórico
          </button>
        </nav>

        {erro && (
          <div className="compras-rf-mensagem compras-rf-mensagem--erro">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="compras-rf-mensagem compras-rf-mensagem--sucesso">
            {mensagem}
          </div>
        )}

        <div className="compras-rf-conteudo">
          {carregando ? (
            <div className="compras-rf-vazio">
              Carregando recebimento físico...
            </div>
          ) : aba === "historico" ? (
            historico.length ? (
              <div className="compras-rf-historico">
                {historico.map(
                  (movimento) => (
                    <article
                      key={movimento.id}
                      className={`compras-rf-historico-item compras-rf-historico-item--${String(
                        movimento.tipo_movimento,
                      ).toLowerCase()}`}
                    >
                      <div className="compras-rf-historico-icone">
                        {movimento.tipo_movimento ===
                        "ESTORNO" ? (
                          <RotateCcw size={16} />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                      </div>

                      <div className="compras-rf-historico-corpo">
                        <div className="compras-rf-historico-topo">
                          <strong>
                            {rotuloMovimento(
                              movimento.tipo_movimento,
                            )}
                          </strong>

                          <span>
                            {movimento.tipo_movimento ===
                            "ESTORNO"
                              ? "-"
                              : "+"}
                            {formatarNumero(
                              movimento.quantidade_movimentada,
                              2,
                            )}{" "}
                            {movimento.unidade || ""}
                          </span>
                        </div>

                        <p>
                          {movimento.codigo_comercial || "-"} - {movimento.descricao_produto || "Item"}
                        </p>

                        <small>
                          <Clock3 size={13} />
                          {formatarDataHora(
                            movimento.registrado_em,
                          )}
                          {" · "}
                          {movimento.usuario_nome || "-"}
                        </small>

                        {movimento.observacao && (
                          <em>
                            {movimento.observacao}
                          </em>
                        )}
                      </div>
                    </article>
                  ),
                )}
              </div>
            ) : (
              <div className="compras-rf-vazio">
                Nenhuma movimentação física registrada.
              </div>
            )
          ) : (
            <div className="compras-rf-itens">
              {itens.map((item) => {
                const recebido = Number(
                  item.quantidade_recebida_fisica ??
                    0,
                );
                const pendente = Number(
                  item.quantidade_pendente_fisica ??
                    0,
                );
                const completo =
                  item.situacao_recebimento_fisico ===
                  "COMPLETO";

                return (
                  <article
                    key={item.codigo_item}
                    className={`compras-rf-item${
                      completo
                        ? " compras-rf-item--completo"
                        : ""
                    }`}
                  >
                    <div className="compras-rf-item-cabecalho">
                      <div>
                        <strong>
                          {item.codigo_comercial ||
                            `OMIE ${item.codigo_produto || "-"}`}
                        </strong>
                        <span>
                          {item.descricao_produto ||
                            "Produto não identificado"}
                        </span>
                      </div>

                      <span
                        className={`compras-rf-status compras-rf-status--${String(
                          item.situacao_recebimento_fisico,
                        )
                          .toLowerCase()
                          .replaceAll("_", "-")}`}
                      >
                        {completo
                          ? "Completo"
                          : recebido > 0
                            ? "Parcial"
                            : "Não recebido"}
                      </span>
                    </div>

                    <div className="compras-rf-item-numeros">
                      <span>
                        <small>Pedido</small>
                        <strong>
                          {formatarNumero(
                            item.quantidade_pedida,
                            2,
                          )}{" "}
                          {item.unidade || ""}
                        </strong>
                      </span>

                      <span>
                        <small>Recebido físico</small>
                        <strong>
                          {formatarNumero(
                            recebido,
                            2,
                          )}{" "}
                          {item.unidade || ""}
                        </strong>

                        {item.origem_recebimento_visual === "OMIE" && (
                          <small>Origem: Omie</small>
                        )}

                        {item.origem_recebimento_visual === "MANUAL" && (
                          <small>Origem: controle físico</small>
                        )}

                        {item.origem_recebimento_visual === "OMIE_E_MANUAL" && (
                          <small>Omie + controle físico</small>
                        )}
                      </span>

                      <span>
                        <small>Pendente físico</small>
                        <strong>
                          {formatarNumero(
                            pendente,
                            2,
                          )}{" "}
                          {item.unidade || ""}
                        </strong>
                      </span>
                    </div>

                    {!completo && (
                      <div className="compras-rf-lancamento">
                        <label>
                          Recebendo agora
                          <input
                            type="number"
                            min="0"
                            step="any"
                            max={pendente}
                            value={
                              quantidades[
                                item.codigo_item
                              ] ?? ""
                            }
                            onChange={(event) =>
                              setQuantidades(
                                (atual) => ({
                                  ...atual,
                                  [item.codigo_item]:
                                    event.target.value,
                                }),
                              )
                            }
                            placeholder={`Máx. ${formatarNumero(
                              pendente,
                              2,
                            )}`}
                          />
                        </label>

                        <label className="compras-rf-observacao">
                          Observação opcional
                          <input
                            type="text"
                            value={
                              observacoes[
                                item.codigo_item
                              ] ?? ""
                            }
                            onChange={(event) =>
                              setObservacoes(
                                (atual) => ({
                                  ...atual,
                                  [item.codigo_item]:
                                    event.target.value,
                                }),
                              )
                            }
                            placeholder="Ex.: entrega parcial, avaria..."
                          />
                        </label>

                        <div className="compras-rf-acoes-item">
                          <button
                            type="button"
                            className="compras-rf-btn"
                            disabled={salvando}
                            onClick={() =>
                              registrarItem(item)
                            }
                          >
                            Registrar
                          </button>

                          <button
                            type="button"
                            className="compras-rf-btn compras-rf-btn--secundario"
                            disabled={salvando}
                            onClick={() =>
                              receberRestanteItem(
                                item,
                              )
                            }
                          >
                            Receber saldo
                          </button>
                        </div>
                      </div>
                    )}

                    {recebido > 0 && (
                      <div className="compras-rf-estorno-area">
                        {estornoAberto ===
                        item.codigo_item ? (
                          <div className="compras-rf-estorno-form">
                            <label>
                              Quantidade a estornar
                              <input
                                type="number"
                                min="0"
                                step="any"
                                max={recebido}
                                value={
                                  quantidadeEstorno
                                }
                                onChange={(event) =>
                                  setQuantidadeEstorno(
                                    event.target.value,
                                  )
                                }
                              />
                            </label>

                            <label>
                              Motivo do estorno
                              <input
                                type="text"
                                value={motivoEstorno}
                                onChange={(event) =>
                                  setMotivoEstorno(
                                    event.target.value,
                                  )
                                }
                                placeholder="Obrigatório"
                              />
                            </label>

                            <div className="compras-rf-acoes-item">
                              <button
                                type="button"
                                className="compras-rf-btn compras-rf-btn--perigo"
                                disabled={salvando}
                                onClick={() =>
                                  confirmarEstorno(
                                    item,
                                  )
                                }
                              >
                                Confirmar estorno
                              </button>

                              <button
                                type="button"
                                className="compras-rf-btn compras-rf-btn--secundario"
                                disabled={salvando}
                                onClick={() => {
                                  setEstornoAberto(
                                    null,
                                  );
                                  setQuantidadeEstorno(
                                    "",
                                  );
                                  setMotivoEstorno(
                                    "",
                                  );
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="compras-rf-link-estorno"
                            onClick={() => {
                              setEstornoAberto(
                                item.codigo_item,
                              );
                              setQuantidadeEstorno(
                                "",
                              );
                              setMotivoEstorno(
                                "",
                              );
                            }}
                          >
                            <RotateCcw size={14} />
                            Corrigir / estornar recebimento
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {confirmarReceberTudoAberto && (
          <div
            className="compras-rf-confirmacao-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget &&
                !salvando
              ) {
                setConfirmarReceberTudoAberto(false);
              }
            }}
          >
            <section
              className="compras-rf-confirmacao"
              role="dialog"
              aria-modal="true"
              aria-label="Confirmar recebimento físico completo"
            >
              <div className="compras-rf-confirmacao-icone">
                <PackageCheck size={24} />
              </div>

              <div className="compras-rf-confirmacao-conteudo">
                <span className="compras-rf-sobretitulo">
                  Confirmar recebimento
                </span>

                <h3>
                  Receber todo o saldo físico do pedido {pedido.numero_pedido || "-"}?
                </h3>

                <p>
                  Todos os itens que ainda possuem saldo físico pendente serão marcados como recebidos.
                </p>

                <div className="compras-rf-confirmacao-resumo">
                  <span>
                    <small>Itens pendentes</small>
                    <strong>
                      {itens.filter(
                        (item) =>
                          Number(
                            item.quantidade_pendente_fisica ?? 0,
                          ) > 0,
                      ).length}
                    </strong>
                  </span>

                  <span>
                    <small>Fornecedor</small>
                    <strong>
                      {pedido.fornecedor_nome || "-"}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="compras-rf-confirmacao-acoes">
                <button
                  type="button"
                  className="compras-rf-btn compras-rf-btn--secundario"
                  onClick={() =>
                    setConfirmarReceberTudoAberto(false)
                  }
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="compras-rf-btn compras-rf-btn--sucesso"
                  onClick={confirmarReceberTudo}
                  disabled={salvando}
                >
                  <PackageCheck size={16} />
                  {salvando
                    ? "Confirmando..."
                    : "Confirmar recebimento"}
                </button>
              </div>
            </section>
          </div>
        )}

      </section>
    </div>
  );
}
