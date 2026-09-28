import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import ConfirmacaoExclusao
  from "@/components/ConfirmacaoExclusao/ConfirmacaoExclusao";

import CompraFuturaModal
  from "./CompraFuturaModal";

import ConfirmarChegadaModal
  from "./ConfirmarChegadaModal";

import useComprasFuturas
  from "./useComprasFuturas";

import "./ComprasFuturas.css";


/* =========================================================
   FORMATADORES
========================================================= */

function formatarData(valor) {
  if (!valor) {
    return "-";
  }

  const [
    ano,
    mes,
    dia,
  ] = valor.split("-");

  return `${dia}/${mes}/${ano}`;
}


function formatarKg(valor) {
  return `${Number(
    valor ?? 0,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  )} kg`;
}


function formatarMoeda(valor) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(valor),
    )
  ) {
    return "-";
  }

  return Number(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}


function formatarPrecoKg(valor) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(valor),
    )
  ) {
    return "-";
  }

  return Number(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}


function formatarCustoKg(valor) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(valor),
    )
  ) {
    return "-";
  }

  return Number(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    },
  );
}


function formatarPercentual(valor) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(valor),
    )
  ) {
    return "-";
  }

  return `${Number(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}%`;
}


/* =========================================================
   COMPRAS FUTURAS
========================================================= */

export default function ComprasFuturas() {
  const [
    fornecedorFiltro,
    setFornecedorFiltro,
  ] = useState("TODOS");

  const [
    materialFiltro,
    setMaterialFiltro,
  ] = useState("TODOS");

  const [
    tipoFiltro,
    setTipoFiltro,
  ] = useState("TODOS");

  const [
    modalAberto,
    setModalAberto,
  ] = useState(false);

  const [
    itemEdicao,
    setItemEdicao,
  ] = useState(null);

  const [
    itemParaExcluir,
    setItemParaExcluir,
  ] = useState(null);

  const [
    erroExclusao,
    setErroExclusao,
  ] = useState("");

  const [
    itemParaConfirmarChegada,
    setItemParaConfirmarChegada,
  ] = useState(null);


  const {
    compras,
    fornecedores,
    materiais,
    fornecedorMateriais,
    carregando,
    carregado,
    erro,
    salvando,
    excluindo,
    confirmandoChegada,
    salvarCompraFutura,
    confirmarChegadaCompraFutura,
    excluirCompraFutura,
    compraEstaSalvando,
    compraEstaExcluindo,
    compraEstaConfirmandoChegada,
  } = useComprasFuturas();


  /* =======================================================
     COMPRAS ABERTAS
  ======================================================= */

  const comprasAbertas =
    useMemo(
      () =>
        compras.filter(
          (
            compra,
          ) =>
            compra.ativo &&
            (
              compra.status ===
                "PREVISTA" ||
              compra.status ===
                "CONFIRMADA"
            ),
        ),
      [
        compras,
      ],
    );


  /* =======================================================
     FORNECEDORES PARA FILTRO
  ======================================================= */

  const fornecedoresFiltro =
    useMemo(
      () => {
        const mapa =
          new Map();

        comprasAbertas.forEach(
          (
            compra,
          ) => {
            if (
              compra.fornecedorId ===
                null ||
              compra.fornecedorId ===
                undefined
            ) {
              return;
            }

            mapa.set(
              String(
                compra.fornecedorId,
              ),
              compra.fornecedorNome ||
                "Fornecedor não encontrado",
            );
          },
        );

        return Array.from(
          mapa.entries(),
        )
          .map(
            ([
              id,
              nome,
            ]) => ({
              id,
              nome,
            }),
          )
          .sort(
            (
              a,
              b,
            ) =>
              a.nome.localeCompare(
                b.nome,
                "pt-BR",
              ),
          );
      },
      [
        comprasAbertas,
      ],
    );


  /* =======================================================
     MATERIAIS PARA FILTRO
  ======================================================= */

  const materiaisFiltro =
    useMemo(
      () => {
        const mapa =
          new Map();

        comprasAbertas.forEach(
          (
            compra,
          ) => {
            if (
              compra.materialId ===
                null ||
              compra.materialId ===
                undefined
            ) {
              return;
            }

            mapa.set(
              String(
                compra.materialId,
              ),
              compra.materialNome ||
                "Material não encontrado",
            );
          },
        );

        return Array.from(
          mapa.entries(),
        )
          .map(
            ([
              id,
              nome,
            ]) => ({
              id,
              nome,
            }),
          )
          .sort(
            (
              a,
              b,
            ) =>
              a.nome.localeCompare(
                b.nome,
                "pt-BR",
              ),
          );
      },
      [
        comprasAbertas,
      ],
    );


  /* =======================================================
     TIPOS PARA FILTRO
  ======================================================= */

  const tiposFiltro =
    useMemo(
      () =>
        Array.from(
          new Set(
            comprasAbertas
              .map(
                (
                  compra,
                ) =>
                  String(
                    compra
                      .tipoClassificacao ??
                      "",
                  ).trim(),
              )
              .filter(
                Boolean,
              ),
          ),
        ).sort(
          (
            a,
            b,
          ) =>
            a.localeCompare(
              b,
              "pt-BR",
            ),
        ),
      [
        comprasAbertas,
      ],
    );


  /* =======================================================
     FILTROS
  ======================================================= */

  const filtradas =
    useMemo(
      () =>
        comprasAbertas.filter(
          (
            compra,
          ) => {
            const fornecedorOk =
              fornecedorFiltro ===
                "TODOS" ||
              String(
                compra
                  .fornecedorId,
              ) ===
                fornecedorFiltro;

            const materialOk =
              materialFiltro ===
                "TODOS" ||
              String(
                compra
                  .materialId,
              ) ===
                materialFiltro;

            const tipoOk =
              tipoFiltro ===
                "TODOS" ||
              String(
                compra
                  .tipoClassificacao ??
                  "",
              ).trim() ===
                tipoFiltro;

            return (
              fornecedorOk &&
              materialOk &&
              tipoOk
            );
          },
        ),
      [
        comprasAbertas,
        fornecedorFiltro,
        materialFiltro,
        tipoFiltro,
      ],
    );


  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores =
    useMemo(
      () => ({
        abertas:
          filtradas.length,

        quantidadeAberta:
          filtradas.reduce(
            (
              total,
              compra,
            ) =>
              total +
              Number(
                compra
                  .quantidadeKg ??
                  0,
              ),
            0,
          ),

        valorAberto:
          filtradas.reduce(
            (
              total,
              compra,
            ) =>
              total +
              Number(
                compra
                  .valorTotal ??
                  0,
              ),
            0,
          ),
      }),
      [
        filtradas,
      ],
    );


  /* =======================================================
     NOVA COMPRA
  ======================================================= */

  function novo() {
    if (
      salvando ||
      excluindo ||
      confirmandoChegada
    ) {
      return;
    }

    setItemEdicao(
      null,
    );

    setModalAberto(
      true,
    );
  }


  /* =======================================================
     EDITAR
  ======================================================= */

  function editar(
    compra,
  ) {
    if (
      !compra ||
      salvando ||
      excluindo ||
      confirmandoChegada
    ) {
      return;
    }

    setItemEdicao(
      compra,
    );

    setModalAberto(
      true,
    );
  }


  /* =======================================================
     SALVAR
  ======================================================= */

  async function salvar(
    dados,
  ) {
    await salvarCompraFutura(
      dados,
    );

    setModalAberto(
      false,
    );

    setItemEdicao(
      null,
    );
  }


  /* =======================================================
     CONFIRMAR CHEGADA
  ======================================================= */

  function solicitarConfirmacaoChegada(
    compra,
  ) {
    if (
      !compra ||
      salvando ||
      excluindo ||
      confirmandoChegada ||
      (
        compra.status !==
          "PREVISTA" &&
        compra.status !==
          "CONFIRMADA"
      )
    ) {
      return;
    }

    setItemParaConfirmarChegada(
      compra,
    );
  }


  function cancelarConfirmacaoChegada() {
    if (
      confirmandoChegada
    ) {
      return;
    }

    setItemParaConfirmarChegada(
      null,
    );
  }


  async function confirmarChegada({
    id,
    dataRecebimento,
  }) {
    await confirmarChegadaCompraFutura({
      id,
      dataRecebimento,
    });

    setItemParaConfirmarChegada(
      null,
    );
  }


  /* =======================================================
     EXCLUSÃO
  ======================================================= */

  function solicitarExclusao(
    compra,
  ) {
    if (
      !compra ||
      salvando ||
      excluindo ||
      confirmandoChegada
    ) {
      return;
    }

    setErroExclusao(
      "",
    );

    setItemParaExcluir(
      compra,
    );
  }


  function cancelarExclusao() {
    if (
      excluindo
    ) {
      return;
    }

    setErroExclusao(
      "",
    );

    setItemParaExcluir(
      null,
    );
  }


  async function confirmarExclusao() {
    if (
      !itemParaExcluir ||
      excluindo
    ) {
      return;
    }

    setErroExclusao(
      "",
    );

    try {
      await excluirCompraFutura(
        itemParaExcluir.id,
      );

      setItemParaExcluir(
        null,
      );
    } catch (
      error
    ) {
      setErroExclusao(
        error?.message ||
          "Não foi possível excluir a compra futura.",
      );
    }
  }


  /* =======================================================
     STATUS
  ======================================================= */

  function statusCompra(
    compra,
  ) {
    if (
      compra.status ===
      "RECEBIDA"
    ) {
      return (
        <span className="compras-futuras-status recebida">

          <CheckCircle2
            size={13}
          />

          Recebida

        </span>
      );
    }

    if (
      compra.status ===
      "CONFIRMADA"
    ) {
      return (
        <span className="compras-futuras-status confirmada">

          <Clock3
            size={13}
          />

          Confirmada

        </span>
      );
    }

    if (
      compra.status ===
      "CANCELADA"
    ) {
      return (
        <span className="compras-futuras-status cancelada">

          <XCircle
            size={13}
          />

          Cancelada

        </span>
      );
    }

    return (
      <span className="compras-futuras-status prevista">

        <Clock3
          size={13}
        />

        Prevista

      </span>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>

      <div className="compras-futuras">

        {/* =================================================
            AÇÃO SUPERIOR
        ================================================= */}

        <div className="compras-futuras-toolbar">

          <button
            type="button"
            className="compras-futuras-nova"
            onClick={
              novo
            }
            disabled={
              salvando ||
              excluindo ||
              confirmandoChegada
            }
          >

            <Plus
              size={17}
            />

            Nova compra

          </button>

        </div>


        {/* =================================================
            RESUMO + FILTROS
        ================================================= */}

        <div className="compras-futuras-resumo-filtros">

          <div className="compras-futuras-indicadores">

            <div>

              <span>
                Compras abertas
              </span>

              <strong>
                {
                  indicadores
                    .abertas
                }
              </strong>

            </div>


            <div>

              <span>
                Matéria-prima a receber
              </span>

              <strong>
                {formatarKg(
                  indicadores
                    .quantidadeAberta,
                )}
              </strong>

            </div>


            <div>

              <span>
                Valor em aberto
              </span>

              <strong>
                {formatarMoeda(
                  indicadores
                    .valorAberto,
                )}
              </strong>

            </div>

          </div>


          <div className="compras-futuras-filtros">

            <label className="compras-futuras-filtro-campo">

              <span>
                Fornecedor
              </span>

              <select
                value={
                  fornecedorFiltro
                }
                onChange={
                  (
                    event,
                  ) =>
                    setFornecedorFiltro(
                      event
                        .target
                        .value,
                    )
                }
              >

                <option value="TODOS">
                  Todos os fornecedores
                </option>


                {fornecedoresFiltro.map(
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
                      {
                        fornecedor
                          .nome
                      }
                    </option>

                  ),
                )}

              </select>

            </label>


            <label className="compras-futuras-filtro-campo">

              <span>
                Matéria-prima
              </span>

              <select
                value={
                  materialFiltro
                }
                onChange={
                  (
                    event,
                  ) =>
                    setMaterialFiltro(
                      event
                        .target
                        .value,
                    )
                }
              >

                <option value="TODOS">
                  Todas as matérias-primas
                </option>


                {materiaisFiltro.map(
                  (
                    material,
                  ) => (

                    <option
                      key={
                        material.id
                      }
                      value={
                        material.id
                      }
                    >
                      {
                        material
                          .nome
                      }
                    </option>

                  ),
                )}

              </select>

            </label>


            <label className="compras-futuras-filtro-campo compras-futuras-filtro-tipo">

              <span>
                Tipo
              </span>

              <select
                value={
                  tipoFiltro
                }
                onChange={
                  (
                    event,
                  ) =>
                    setTipoFiltro(
                      event
                        .target
                        .value,
                    )
                }
              >

                <option value="TODOS">
                  Todos os tipos
                </option>


                {tiposFiltro.map(
                  (
                    tipo,
                  ) => (

                    <option
                      key={
                        tipo
                      }
                      value={
                        tipo
                      }
                    >
                      {tipo}
                    </option>

                  ),
                )}

              </select>

            </label>

          </div>

        </div>


        {/* =================================================
            CARREGANDO
        ================================================= */}

        {carregando && (

          <div className="compras-futuras-estado">

            <span className="compras-futuras-loading" />

            <strong>
              Carregando compras
            </strong>

          </div>

        )}


        {/* =================================================
            ERRO
        ================================================= */}

        {!carregando &&
          erro && (

          <div className="compras-futuras-estado compras-futuras-erro">

            <AlertTriangle
              size={30}
            />

            <strong>
              Erro ao carregar compras
            </strong>

            <p>
              {erro}
            </p>

          </div>

        )}


        {/* =================================================
            SEM COMPRAS
        ================================================= */}

        {!carregando &&
          !erro &&
          carregado &&
          compras.length ===
            0 && (

          <div className="compras-futuras-estado">

            <ShoppingCart
              size={34}
            />

            <strong>
              Nenhuma compra cadastrada
            </strong>

            <p>
              Cadastre as compras de matéria-prima previstas para recebimento.
            </p>

          </div>

        )}


        {/* =================================================
            TABELA
        ================================================= */}

        {!carregando &&
          !erro &&
          filtradas.length >
            0 && (

          <div className="compras-futuras-tabela-container">

            <table className="compras-futuras-tabela">

              <thead>

                <tr>

                  <th>
                    Pedido (OC)
                  </th>

                  <th>
                    Emissão
                  </th>

                  <th>
                    Previsão Recebimento
                  </th>

                  <th>
                    Fornecedor
                  </th>

                  <th>
                    Material
                  </th>

                  <th>
                    Tipo
                  </th>

                  <th>
                    Quantidade(kg)
                  </th>

                  <th>
                    Preço/kg
                  </th>

                  <th>
                    IPI
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Custo/kg
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Ações
                  </th>

                </tr>

              </thead>


              <tbody>

                {filtradas.map(
                  (
                    compra,
                  ) => {
                    const estaSalvando =
                      compraEstaSalvando(
                        compra.id,
                      );

                    const estaExcluindo =
                      compraEstaExcluindo(
                        compra.id,
                      );

                    const estaConfirmandoChegada =
                      compraEstaConfirmandoChegada(
                        compra.id,
                      );


                    return (
                      <tr
                        key={
                          compra.id
                        }
                      >

                        <td>

                          <strong>
                            {
                              compra
                                .numeroPedido ||
                              "-"
                            }
                          </strong>

                        </td>


                        <td>

                          {formatarData(
                            compra
                              .dataCompra,
                          )}

                        </td>


                        <td>

                          {formatarData(
                            compra
                              .dataPrevista,
                          )}

                        </td>


                        <td>

                          <strong>
                            {
                              compra
                                .fornecedorNome
                            }
                          </strong>

                        </td>


                        <td>

                          <strong>
                            {
                              compra
                                .materialNome ||
                              "-"
                            }
                          </strong>

                        </td>


                        <td>

                          <strong>
                            {
                              compra
                                .tipoClassificacao ||
                              "-"
                            }
                          </strong>

                        </td>


                        <td className="compras-futuras-quantidade">

                          {Number(
                            compra
                              .quantidadeKg ??
                              0,
                          ).toLocaleString(
                            "pt-BR",
                            {
                              minimumFractionDigits:
                                0,
                              maximumFractionDigits:
                                0,
                            },
                          )}

                        </td>


                        <td className="compras-futuras-financeiro">

                          {formatarPrecoKg(
                            compra
                              .precoUnitario,
                          )}

                        </td>


                        <td className="compras-futuras-financeiro">

                          <span>

                            {formatarPercentual(
                              compra
                                .ipiPercentual,
                            )}

                          </span>


                          {compra
                            .valorIpi !==
                            null && (

                            <small>

                              {formatarMoeda(
                                compra
                                  .valorIpi,
                              )}

                            </small>

                          )}

                        </td>


                        <td className="compras-futuras-total">

                          {formatarMoeda(
                            compra
                              .valorTotal,
                          )}

                        </td>


                        <td className="compras-futuras-financeiro">

                          {formatarCustoKg(
                            compra
                              .custoEfetivoKg,
                          )}

                        </td>


                        <td>

                          {statusCompra(
                            compra,
                          )}

                        </td>


                        <td>

                          <div className="compras-futuras-acoes">

                            {(
                              compra.status ===
                                "PREVISTA" ||
                              compra.status ===
                                "CONFIRMADA"
                            ) && (

                              <button
                                type="button"
                                className="compras-futuras-confirmar-chegada"
                                onClick={
                                  () =>
                                    solicitarConfirmacaoChegada(
                                      compra,
                                    )
                                }
                                disabled={
                                  salvando ||
                                  excluindo ||
                                  confirmandoChegada
                                }
                              >

                                <CheckCircle2
                                  size={14}
                                />

                                {
                                  estaConfirmandoChegada
                                    ? "Confirmando..."
                                    : "Confirmar chegada"
                                }

                              </button>

                            )}


                            <button
                              type="button"
                              className="compras-futuras-editar"
                              onClick={
                                () =>
                                  editar(
                                    compra,
                                  )
                              }
                              disabled={
                                salvando ||
                                excluindo ||
                                confirmandoChegada
                              }
                            >

                              <Pencil
                                size={14}
                              />

                              {
                                estaSalvando
                                  ? "Salvando..."
                                  : "Editar"
                              }

                            </button>


                            <button
                              type="button"
                              className="compras-futuras-editar compras-futuras-excluir"
                              onClick={
                                () =>
                                  solicitarExclusao(
                                    compra,
                                  )
                              }
                              disabled={
                                salvando ||
                                excluindo ||
                                confirmandoChegada
                              }
                            >

                              <Trash2
                                size={14}
                              />

                              {
                                estaExcluindo
                                  ? "Excluindo..."
                                  : "Excluir"
                              }

                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  },
                )}

              </tbody>

            </table>

          </div>

        )}


        {/* =================================================
            SEM RESULTADO
        ================================================= */}

        {!carregando &&
          !erro &&
          compras.length >
            0 &&
          filtradas.length ===
            0 && (

          <div className="compras-futuras-estado">

            <Search
              size={27}
            />

            <strong>
              Nenhuma compra encontrada
            </strong>

            <p>
              Altere os filtros para visualizar outras compras.
            </p>

          </div>

        )}

      </div>


      {/* ===================================================
          MODAL COMPRA
      =================================================== */}

      <CompraFuturaModal
        aberto={
          modalAberto
        }
        item={
          itemEdicao
        }
        fornecedores={
          fornecedores
        }
        materiais={
          materiais
        }
        fornecedorMateriais={
          fornecedorMateriais
        }
        salvando={
          salvando
        }
        onCancelar={
          () => {
            if (
              salvando
            ) {
              return;
            }

            setModalAberto(
              false,
            );

            setItemEdicao(
              null,
            );
          }
        }
        onSalvar={
          salvar
        }
      />


      {/* ===================================================
          CONFIRMAR CHEGADA
      =================================================== */}

      <ConfirmarChegadaModal
        aberto={
          Boolean(
            itemParaConfirmarChegada,
          )
        }
        item={
          itemParaConfirmarChegada
        }
        processando={
          confirmandoChegada
        }
        onCancelar={
          cancelarConfirmacaoChegada
        }
        onConfirmar={
          confirmarChegada
        }
      />


      {/* ===================================================
          EXCLUSÃO
      =================================================== */}

      <ConfirmacaoExclusao
        aberto={
          Boolean(
            itemParaExcluir,
          )
        }
        titulo="Excluir compra futura?"
        descricao="Esta compra será removida das previsões de recebimento e deixará de participar da projeção de estoque."
        itemTitulo={
          itemParaExcluir
            ?.fornecedorNome ??
          ""
        }
        itemDescricao={
          itemParaExcluir
            ?.numeroPedido
            ? `Pedido ${itemParaExcluir.numeroPedido}`
            : `Compra de ${itemParaExcluir?.materialNome || "matéria-prima"}`
        }
        detalhes={[
          {
            label:
              "Material",

            valor:
              itemParaExcluir
                ?.materialNome ||
              "-",
          },

          {
            label:
              "Tipo",

            valor:
              itemParaExcluir
                ?.tipoClassificacao ||
              "-",
          },

          {
            label:
              "Quantidade",

            valor:
              itemParaExcluir
                ? formatarKg(
                    itemParaExcluir
                      .quantidadeKg,
                  )
                : "-",
          },

          {
            label:
              "Valor total",

            valor:
              itemParaExcluir
                ? formatarMoeda(
                    itemParaExcluir
                      .valorTotal,
                  )
                : "-",
          },

          {
            label:
              "Status",

            valor:
              itemParaExcluir
                ?.status ===
                "CONFIRMADA"
                ? "Confirmada"
                : itemParaExcluir
                    ?.status ===
                    "RECEBIDA"
                  ? "Recebida"
                  : itemParaExcluir
                      ?.status ===
                      "CANCELADA"
                    ? "Cancelada"
                    : "Prevista",
          },

          {
            label:
              "Data da compra",

            valor:
              itemParaExcluir
                ? formatarData(
                    itemParaExcluir
                      .dataCompra,
                  )
                : "-",
          },

          {
            label:
              "Previsão",

            valor:
              itemParaExcluir
                ? formatarData(
                    itemParaExcluir
                      .dataPrevista,
                  )
                : "-",
          },
        ]}
        erro={
          erroExclusao
        }
        processando={
          excluindo
        }
        textoConfirmar="Excluir compra"
        onCancelar={
          cancelarExclusao
        }
        onConfirmar={
          confirmarExclusao
        }
      />

    </>
  );
}