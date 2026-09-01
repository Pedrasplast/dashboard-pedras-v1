import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

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


function formatarNumero(
  valor,
) {
  return Number(
    valor ?? 0,
  ).toLocaleString(
    "pt-BR",
    {
      maximumFractionDigits:
        0,
    },
  );
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


  const {
    programacao,
    produtos,
    carregando,
    carregado,
    erro,
    salvando,
    recarregar,
    salvarProgramacao,
    itemEstaSalvando,
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
                (
                  Number(
                    item.quantidade ??
                      0,
                  ) *
                  Number(
                    item.quantidadeDias ??
                      0,
                  )
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
     NOVO / EDITAR
  ======================================================= */

  function abrirNovo() {
    if (salvando) {
      return;
    }


    setItemEmEdicao(
      null,
    );

    setModalAberto(
      true,
    );
  }


  function abrirEdicao(
    item,
  ) {
    if (
      !item ||
      salvando
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
                salvando
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
              Calculando períodos,
              receitas e consumo previsto.
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
                Cadastre um período de
                produção para calcular
                o consumo diário e total
                de PP.
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
                      <th>Dias</th>
                      <th>Injetora</th>
                      <th>Código</th>
                      <th>Produto</th>
                      <th>Qtd./dia</th>
                      <th>Peso</th>
                      <th>PP/dia</th>
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

                              {" até "}

                              {
                                formatarData(
                                  item.dataFim,
                                )
                              }

                            </td>


                            <td>
                              {
                                item.quantidadeDias
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
                              {
                                formatarNumero(
                                  item.quantidade,
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


                            <td>
                              {
                                formatarKg(
                                  item.consumoDiarioKg,
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
                                  salvando
                                }
                              >

                                <Pencil
                                  size={14}
                                />

                                {estaSalvando
                                  ? "Salvando..."
                                  : "Editar"}

                              </button>

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

    </>
  );
}