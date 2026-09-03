import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import ConfirmacaoExclusao
  from "@/components/ConfirmacaoExclusao/ConfirmacaoExclusao";

import ProgramacaoModal from "./ProgramacaoModal";
import useProgramacao from "./useProgramacao";

import "./Programacao.css";


/* =========================================================
   UTILITÁRIOS
========================================================= */

function normalizarTexto(
  valor,
) {
  return String(
    valor ?? "",
  )
    .trim()
    .toLowerCase()
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}


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
    String(
      valor,
    ).split(
      "-",
    );


  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return valor;
  }


  return `${dia}/${mes}/${ano}`;
}


function formatarHora(
  valor,
) {
  if (!valor) {
    return "";
  }


  return String(
    valor,
  ).slice(
    0,
    5,
  );
}


function formatarNumero(
  valor,
  casas = 0,
) {
  const numero =
    Number(
      valor ?? 0,
    );


  return numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        casas,
      maximumFractionDigits:
        casas,
    },
  );
}


function formatarHoras(
  valor,
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "-";
  }


  const numero =
    Number(
      valor,
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "-";
  }


  return `${numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        0,
      maximumFractionDigits:
        2,
    },
  )} h`;
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


/* =========================================================
   PROGRAMAÇÃO
========================================================= */

export default function Programacao() {
  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    filtroData,
    setFiltroData,
  ] = useState("");

  const [
    modalAberto,
    setModalAberto,
  ] = useState(false);

  const [
    itemEmEdicao,
    setItemEmEdicao,
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
    programacao,
    produtos,
    carregando,
    carregado,
    erro,
    salvando,
    excluindo,
    recarregar,
    salvarProgramacao,
    excluirProgramacao,
    itemEstaSalvando,
    itemEstaExcluindo,
  } =
    useProgramacao();


  /* =======================================================
     FILTRO
  ======================================================= */

  const programacaoFiltrada =
    useMemo(
      () => {
        const termo =
          normalizarTexto(
            busca,
          );


        return programacao.filter(
          (
            item,
          ) => {
            const correspondeBusca =
              !termo ||
              normalizarTexto(
                item.codigoProduto,
              ).includes(
                termo,
              ) ||
              normalizarTexto(
                item.descricao,
              ).includes(
                termo,
              ) ||
              normalizarTexto(
                item.injetora,
              ).includes(
                termo,
              );


            const correspondeData =
              !filtroData ||
              (
                filtroData >=
                  item.dataInicio &&
                filtroData <=
                  item.dataFim
              );


            return (
              correspondeBusca &&
              correspondeData
            );
          },
        );
      },
      [
        programacao,
        busca,
        filtroData,
      ],
    );


  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores =
    useMemo(
      () => {
        const ativos =
          programacaoFiltrada.filter(
            (
              item,
            ) =>
              item.ativo,
          );


        return {
          registros:
            ativos.length,

          pecasPeriodo:
            ativos.reduce(
              (
                total,
                item,
              ) =>
                total +
                Number(
                  item
                    .pecasPrevistas ??
                    0,
                ),
              0,
            ),

          consumoPeriodoKg:
            ativos.reduce(
              (
                total,
                item,
              ) =>
                total +
                Number(
                  item
                    .consumoPeriodoKg ??
                    0,
                ),
              0,
            ),
        };
      },
      [
        programacaoFiltrada,
      ],
    );


  /* =======================================================
     NOVO
  ======================================================= */

  function abrirNovo() {
    if (
      salvando ||
      excluindo
    ) {
      return;
    }


    setItemEmEdicao(
      null,
    );

    setModalAberto(
      true,
    );
  }


  /* =======================================================
     EDITAR
  ======================================================= */

  function abrirEdicao(
    item,
  ) {
    if (
      !item ||
      salvando ||
      excluindo
    ) {
      return;
    }


    setItemEmEdicao(
      item,
    );

    setModalAberto(
      true,
    );
  }


  /* =======================================================
     FECHAR MODAL
  ======================================================= */

  function fecharModal() {
    if (salvando) {
      return;
    }


    setModalAberto(
      false,
    );

    setItemEmEdicao(
      null,
    );
  }


  /* =======================================================
     SALVAR
  ======================================================= */

  async function salvar(
    dados,
  ) {
    const resultado =
      await salvarProgramacao(
        dados,
      );


    setModalAberto(
      false,
    );

    setItemEmEdicao(
      null,
    );


    return resultado;
  }


  /* =======================================================
     SOLICITAR EXCLUSÃO
  ======================================================= */

  function solicitarExclusao(
    item,
  ) {
    if (
      !item ||
      salvando ||
      excluindo
    ) {
      return;
    }


    setErroExclusao(
      "",
    );

    setItemParaExcluir(
      item,
    );
  }


  /* =======================================================
     CANCELAR EXCLUSÃO
  ======================================================= */

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


  /* =======================================================
     CONFIRMAR EXCLUSÃO
  ======================================================= */

  async function confirmarExclusao() {
    if (
      !itemParaExcluir ||
      salvando ||
      excluindo
    ) {
      return;
    }


    setErroExclusao(
      "",
    );


    try {
      await excluirProgramacao(
        itemParaExcluir.id,
      );


      setItemParaExcluir(
        null,
      );
    } catch (error) {
      setErroExclusao(
        error
          ?.message ||
          "Não foi possível excluir a programação.",
      );
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <div className="programacao-pp">

        <div className="programacao-pp-toolbar">

          <div className="programacao-pp-indicadores">

            <div>

              <span>
                Programações
              </span>

              <strong>
                {
                  indicadores.registros
                }
              </strong>

            </div>


            <div>

              <span>
                Peças período
              </span>

              <strong>
                {
                  formatarNumero(
                    indicadores
                      .pecasPeriodo,
                  )
                }
              </strong>

            </div>


            <div>

              <span>
                PP período
              </span>

              <strong>
                {
                  formatarKg(
                    indicadores
                      .consumoPeriodoKg,
                  )
                }
              </strong>

            </div>

          </div>


          <div className="programacao-pp-acoes">

            <label className="programacao-pp-busca">

              <Search
                size={16}
                strokeWidth={2}
              />

              <input
                type="search"
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
                placeholder="Buscar produto ou injetora..."
              />

            </label>


            <input
              type="date"
              className="programacao-pp-data"
              value={
                filtroData
              }
              onChange={
                (
                  event,
                ) =>
                  setFiltroData(
                    event
                      .target
                      .value,
                  )
              }
              title="Mostrar programações ativas nesta data"
            />


            <button
              type="button"
              className="programacao-pp-atualizar"
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
                strokeWidth={2}
                className={
                  carregando
                    ? "girando"
                    : ""
                }
              />

              Atualizar

            </button>


            <button
              type="button"
              className="programacao-pp-novo"
              onClick={
                abrirNovo
              }
              disabled={
                salvando ||
                excluindo ||
                produtos.length ===
                  0
              }
            >

              <Plus
                size={17}
                strokeWidth={2}
              />

              Nova programação

            </button>

          </div>

        </div>


        {carregando && (

          <div className="programacao-pp-estado">

            <span className="programacao-pp-loading" />

            <strong>
              Carregando programação
            </strong>

            <p>
              Calculando período real,
              ciclos, cavidades e consumo
              previsto de PP.
            </p>

          </div>

        )}


        {!carregando &&
          erro && (

          <div className="programacao-pp-estado programacao-pp-erro">

            <AlertTriangle
              size={30}
            />

            <strong>
              Não foi possível carregar
              a programação
            </strong>

            <p>
              {erro}
            </p>

          </div>

        )}


        {!carregando &&
          !erro &&
          carregado &&
          programacao.length ===
            0 && (

          <div className="programacao-pp-estado">

            <CalendarDays
              size={34}
              strokeWidth={1.7}
            />

            <strong>
              Nenhuma produção programada
            </strong>

            <p>
              Cadastre o período real de
              produção para calcular o
              consumo previsto de PP.
            </p>


            {produtos.length >
              0 && (

              <button
                type="button"
                className="programacao-pp-vazio-novo"
                onClick={
                  abrirNovo
                }
              >

                <Plus
                  size={16}
                />

                Nova programação

              </button>

            )}

          </div>

        )}


        {!carregando &&
          !erro &&
          programacao.length >
            0 && (

          <>

            <div className="programacao-pp-tabela-container">

              <table className="programacao-pp-tabela">

                <thead>

                  <tr>
                    <th>Período</th>
                    <th>Horas</th>
                    <th>Injetora</th>
                    <th>Código</th>
                    <th>Produto</th>
                    <th>Ciclo</th>
                    <th>Cavidades</th>
                    <th>Peças previstas</th>
                    <th>Peso</th>
                    <th>PP período</th>
                    <th>Receita</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>

                </thead>


                <tbody>

                  {programacaoFiltrada.map(
                    (
                      item,
                    ) => {
                      const estaSalvando =
                        itemEstaSalvando(
                          item.id,
                        );

                      const estaExcluindo =
                        itemEstaExcluindo(
                          item.id,
                        );


                      return (
                        <tr
                          key={
                            item.id
                          }
                        >

                          <td className="programacao-pp-data-coluna">

                            {
                              formatarData(
                                item.dataInicio,
                              )
                            }

                            {item.horaInicio
                              ? ` ${formatarHora(
                                  item.horaInicio,
                                )}`
                              : ""}

                            {" até "}

                            {
                              formatarData(
                                item.dataFim,
                              )
                            }

                            {item.horaFim
                              ? ` ${formatarHora(
                                  item.horaFim,
                                )}`
                              : ""}

                          </td>


                          <td>
                            {
                              formatarHoras(
                                item.horasPeriodo,
                              )
                            }
                          </td>


                          <td>

                            {item
                              .injetora
                              ? `Injetora ${item.injetora}`
                              : "-"}

                          </td>


                          <td className="programacao-pp-codigo">

                            {
                              item.codigoProduto
                            }

                          </td>


                          <td className="programacao-pp-produto">

                            <strong>
                              {item
                                .descricao ||
                                "Sem descrição"}
                            </strong>


                            {item
                              .receitaConfigurada &&
                              item
                                .consumosFornecedores
                                .length >
                                0 && (

                              <small>

                                {item
                                  .consumosFornecedores
                                  .map(
                                    (
                                      fornecedor,
                                    ) =>
                                      `${fornecedor.fornecedorNome}: ${formatarKg(
                                        fornecedor
                                          .consumoPeriodoKg,
                                      )}`,
                                  )
                                  .join(
                                    " • ",
                                  )}

                              </small>

                            )}

                          </td>


                          <td>

                            {item.cicloSegundos
                              ? `${formatarNumero(
                                  item.cicloSegundos,
                                )} s`
                              : "-"}

                          </td>


                          <td>

                            {item.cavidadeMolde
                              ? formatarNumero(
                                  item.cavidadeMolde,
                                )
                              : "-"}

                          </td>


                          <td>

                            {
                              formatarNumero(
                                item.pecasPrevistas,
                              )
                            }

                          </td>


                          <td>

                            {
                              formatarKg(
                                item.pesoKg,
                              )
                            }

                          </td>


                          <td className="programacao-pp-consumo">

                            {
                              formatarKg(
                                item.consumoPeriodoKg,
                              )
                            }

                          </td>


                          <td>

                            {item
                              .receitaConfigurada ? (

                              <span className="programacao-pp-receita ok">

                                <CheckCircle2
                                  size={13}
                                />

                                100%

                              </span>

                            ) : (

                              <span className="programacao-pp-receita pendente">

                                <AlertTriangle
                                  size={13}
                                />

                                Pendente

                              </span>

                            )}

                          </td>


                          <td>

                            <span
                              className={
                                item.ativo
                                  ? "programacao-pp-status ativo"
                                  : "programacao-pp-status inativo"
                              }
                            >
                              {item.ativo
                                ? "Ativa"
                                : "Inativa"}
                            </span>

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
                                className="programacao-pp-editar"
                                onClick={
                                  () =>
                                    abrirEdicao(
                                      item,
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
                                className="programacao-pp-editar"
                                onClick={
                                  () =>
                                    solicitarExclusao(
                                      item,
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


            <div className="programacao-pp-rodape">

              Exibindo{" "}

              <strong>
                {
                  programacaoFiltrada.length
                }
              </strong>

              {" "}de{" "}

              <strong>
                {
                  programacao.length
                }
              </strong>

              {" "}programações

            </div>

          </>

        )}


        {!carregando &&
          !erro &&
          programacao.length >
            0 &&
          programacaoFiltrada.length ===
            0 && (

          <div className="programacao-pp-sem-resultado">

            <Search
              size={27}
            />

            <strong>
              Nenhuma programação encontrada
            </strong>

            <p>
              Altere os filtros para
              visualizar outros períodos.
            </p>

          </div>

        )}

      </div>


      <ProgramacaoModal
        aberto={
          modalAberto
        }
        item={
          itemEmEdicao
        }
        produtos={
          produtos
        }
        programacao={
          programacao
        }
        salvando={
          salvando
        }
        onCancelar={
          fecharModal
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
        titulo="Excluir programação?"
        descricao="Esta programação será removida definitivamente da projeção de matéria-prima."
        itemTitulo={
          itemParaExcluir
            ?.descricao ??
          ""
        }
        itemDescricao={
          itemParaExcluir
            ? `Código ${itemParaExcluir.codigoProduto}`
            : ""
        }
        detalhes={[
          {
            label:
              "Injetora",

            valor:
              itemParaExcluir
                ?.injetora
                ? `Injetora ${itemParaExcluir.injetora}`
                : "Não informada",
          },

          {
            label:
              "Peças previstas",

            valor:
              itemParaExcluir
                ? formatarNumero(
                    itemParaExcluir
                      .pecasPrevistas,
                  )
                : "-",
          },

          {
            label:
              "Início",

            valor:
              itemParaExcluir
                ? `${formatarData(
                    itemParaExcluir
                      .dataInicio,
                  )}${
                    itemParaExcluir
                      .horaInicio
                      ? ` ${formatarHora(
                          itemParaExcluir
                            .horaInicio,
                        )}`
                      : ""
                  }`
                : "-",
          },

          {
            label:
              "Fim",

            valor:
              itemParaExcluir
                ? `${formatarData(
                    itemParaExcluir
                      .dataFim,
                  )}${
                    itemParaExcluir
                      .horaFim
                      ? ` ${formatarHora(
                          itemParaExcluir
                            .horaFim,
                        )}`
                      : ""
                  }`
                : "-",
          },
        ]}
        erro={
          erroExclusao
        }
        processando={
          excluindo
        }
        textoConfirmar="Excluir programação"
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