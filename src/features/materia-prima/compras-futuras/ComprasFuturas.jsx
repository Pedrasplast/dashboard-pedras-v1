import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  RefreshCw,
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

import CompraFuturaModal from "./CompraFuturaModal";
import useComprasFuturas from "./useComprasFuturas";

import "./ComprasFuturas.css";


/* =========================================================
   FORMATADORES
========================================================= */

function formatarData(
  valor,
) {
  if (!valor) {
    return "-";
  }


  const [
    ano,
    mes,
    dia,
  ] =
    valor.split(
      "-",
    );


  return `${dia}/${mes}/${ano}`;
}


function formatarKg(
  valor,
) {
  return `${Number(
    valor ?? 0,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        3,

      maximumFractionDigits:
        3,
    },
  )} kg`;
}


function normalizarTexto(
  valor,
) {
  return String(
    valor ?? "",
  )
    .toLowerCase()
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}


/* =========================================================
   COMPRAS
========================================================= */

export default function ComprasFuturas() {
  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    statusFiltro,
    setStatusFiltro,
  ] = useState(
    "ABERTAS",
  );

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


  const {
    compras,
    fornecedores,
    carregando,
    carregado,
    erro,
    salvando,
    excluindo,
    recarregar,
    salvarCompraFutura,
    excluirCompraFutura,
    compraEstaSalvando,
    compraEstaExcluindo,
  } =
    useComprasFuturas();


  /* =======================================================
     FILTRO
  ======================================================= */

  const filtradas =
    useMemo(
      () => {
        const termo =
          normalizarTexto(
            busca,
          );


        return compras.filter(
          (
            compra,
          ) => {
            const buscaOk =
              !termo ||
              normalizarTexto(
                compra.fornecedorNome,
              ).includes(
                termo,
              ) ||
              normalizarTexto(
                compra.numeroPedido,
              ).includes(
                termo,
              );


            let statusOk =
              true;


            if (
              statusFiltro ===
              "ABERTAS"
            ) {
              statusOk =
                compra.status ===
                  "PREVISTA" ||
                compra.status ===
                  "CONFIRMADA";
            } else if (
              statusFiltro !==
              "TODOS"
            ) {
              statusOk =
                compra.status ===
                statusFiltro;
            }


            return (
              buscaOk &&
              statusOk
            );
          },
        );
      },
      [
        compras,
        busca,
        statusFiltro,
      ],
    );


  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores =
    useMemo(
      () => {
        const abertas =
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
          );


        return {
          abertas:
            abertas.length,

          quantidadeAberta:
            abertas.reduce(
              (
                total,
                compra,
              ) =>
                total +
                Number(
                  compra.quantidadeKg,
                ),
              0,
            ),

          recebidas:
            compras.filter(
              (
                compra,
              ) =>
                compra.status ===
                "RECEBIDA",
            ).length,
        };
      },
      [
        compras,
      ],
    );


  /* =======================================================
     NOVA COMPRA
  ======================================================= */

  function novo() {
    if (
      salvando ||
      excluindo
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
      excluindo
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
     EXCLUSÃO
  ======================================================= */

  function solicitarExclusao(
    compra,
  ) {
    if (
      !compra ||
      salvando ||
      excluindo
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
    if (excluindo) {
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
    } catch (error) {
      setErroExclusao(
        error
          ?.message ||
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

        <div className="compras-futuras-toolbar">

          <div className="compras-futuras-indicadores">

            <div>

              <span>
                Compras abertas
              </span>

              <strong>
                {indicadores.abertas}
              </strong>

            </div>


            <div>

              <span>
                PP a receber
              </span>

              <strong>
                {formatarKg(
                  indicadores.quantidadeAberta,
                )}
              </strong>

            </div>


            <div>

              <span>
                Recebidas
              </span>

              <strong>
                {indicadores.recebidas}
              </strong>

            </div>

          </div>


          <button
            type="button"
            className="compras-futuras-nova"
            onClick={
              novo
            }
            disabled={
              salvando ||
              excluindo
            }
          >

            <Plus
              size={17}
            />

            Nova compra

          </button>

        </div>


        <div className="compras-futuras-filtros">

          <label className="compras-futuras-busca">

            <Search
              size={16}
            />

            <input
              value={
                busca
              }
              onChange={
                (
                  event,
                ) =>
                  setBusca(
                    event
                      .target
                      .value,
                  )
              }
              placeholder="Buscar fornecedor ou pedido..."
            />

          </label>


          <select
            value={
              statusFiltro
            }
            onChange={
              (
                event,
              ) =>
                setStatusFiltro(
                  event
                    .target
                    .value,
                )
            }
          >

            <option value="ABERTAS">
              Compras abertas
            </option>

            <option value="PREVISTA">
              Previstas
            </option>

            <option value="CONFIRMADA">
              Confirmadas
            </option>

            <option value="RECEBIDA">
              Recebidas
            </option>

            <option value="CANCELADA">
              Canceladas
            </option>

            <option value="TODOS">
              Todas
            </option>

          </select>


          <button
            type="button"
            className="compras-futuras-atualizar"
            onClick={
              recarregar
            }
            disabled={
              carregando ||
              salvando ||
              excluindo
            }
          >

            <RefreshCw
              size={16}
              className={
                carregando
                  ? "girando"
                  : ""
              }
            />

            Atualizar

          </button>

        </div>


        {carregando && (

          <div className="compras-futuras-estado">

            <span className="compras-futuras-loading" />

            <strong>
              Carregando compras
            </strong>

          </div>

        )}


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
              Cadastre as compras de PP
              previstas para recebimento.
            </p>

          </div>

        )}


        {!carregando &&
          !erro &&
          compras.length >
            0 && (

          <div className="compras-futuras-tabela-container">

            <table className="compras-futuras-tabela">

              <thead>

                <tr>
                  <th>Compra</th>
                  <th>Previsão</th>
                  <th>Recebimento</th>
                  <th>Fornecedor</th>
                  <th>Quantidade</th>
                  <th>Pedido</th>
                  <th>Status</th>
                  <th>Ações</th>
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


                    return (
                      <tr
                        key={
                          compra.id
                        }
                      >

                        <td>

                          {formatarData(
                            compra.dataCompra,
                          )}

                        </td>


                        <td>

                          {formatarData(
                            compra.dataPrevista,
                          )}

                        </td>


                        <td>

                          {formatarData(
                            compra.dataRecebimento,
                          )}

                        </td>


                        <td>

                          <strong>
                            {compra.fornecedorNome}
                          </strong>

                        </td>


                        <td className="compras-futuras-quantidade">

                          {formatarKg(
                            compra.quantidadeKg,
                          )}

                        </td>


                        <td>

                          {compra.numeroPedido ||
                            "-"}

                        </td>


                        <td>

                          {statusCompra(
                            compra,
                          )}

                        </td>


                        <td>

                          <div
                            style={{
                              display:
                                "flex",

                              alignItems:
                                "center",

                              gap:
                                "6px",
                            }}
                          >

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
                                excluindo
                              }
                            >

                              <Pencil
                                size={14}
                              />

                              {estaSalvando
                                ? "Salvando..."
                                : "Editar"}

                            </button>


                            <button
                              type="button"
                              className="compras-futuras-editar"
                              onClick={
                                () =>
                                  solicitarExclusao(
                                    compra,
                                  )
                              }
                              disabled={
                                salvando ||
                                excluindo
                              }
                              style={{
                                color:
                                  "#dc2626",

                                borderColor:
                                  "#fecaca",

                                background:
                                  "#ffffff",
                              }}
                            >

                              <Trash2
                                size={14}
                              />

                              {estaExcluindo
                                ? "Excluindo..."
                                : "Excluir"}

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
              Altere os filtros para visualizar
              outras compras.
            </p>

          </div>

        )}

      </div>


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
        salvando={
          salvando
        }
        onCancelar={
          () => {
            if (salvando) {
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
            : "Compra de PP"
        }
        detalhes={[
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