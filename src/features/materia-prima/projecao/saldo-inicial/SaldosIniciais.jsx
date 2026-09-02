import {
  AlertTriangle,
  Pencil,
  Plus,
  RefreshCw,
  Scale,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import SaldoInicialModal from "./SaldoInicialModal";

import useSaldosIniciais from "./useSaldosIniciais";

import {
  obterUltimosSaldosPorFornecedor,
} from "./saldoInicialService";

import "./SaldosIniciais.css";


/* =========================================================
   UTILITÁRIOS
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
    String(valor)
      .split("-");


  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return valor;
  }


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
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    },
  )} kg`;
}


function normalizarTexto(
  valor,
) {
  return String(
    valor ?? "",
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}


/* =========================================================
   SALDOS INICIAIS
========================================================= */

export default function SaldosIniciais() {
  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    filtroData,
    setFiltroData,
  ] = useState("");

  const [
    filtroStatus,
    setFiltroStatus,
  ] = useState("todos");

  const [
    modalAberto,
    setModalAberto,
  ] = useState(false);

  const [
    itemEdicao,
    setItemEdicao,
  ] = useState(null);


  const {
    saldos,
    fornecedores,
    carregando,
    carregado,
    erro,
    salvando,
    recarregar,
    salvarSaldoInicial,
    saldoEstaSalvando,
  } =
    useSaldosIniciais();


  /* =======================================================
     ÚLTIMOS SALDOS
  ======================================================= */

  const ultimosSaldos =
    useMemo(
      () =>
        obterUltimosSaldosPorFornecedor(
          saldos,
        ),
      [
        saldos,
      ],
    );


  const idsUltimosSaldos =
    useMemo(
      () =>
        new Set(
          ultimosSaldos.map(
            (
              saldo,
            ) =>
              String(
                saldo.id,
              ),
          ),
        ),
      [
        ultimosSaldos,
      ],
    );


  /* =======================================================
     FILTROS
  ======================================================= */

  const saldosFiltrados =
    useMemo(
      () => {
        const termo =
          normalizarTexto(
            busca,
          );


        return saldos.filter(
          (
            saldo,
          ) => {
            const buscaOk =
              !termo ||
              normalizarTexto(
                saldo.fornecedorNome,
              ).includes(
                termo,
              ) ||
              normalizarTexto(
                saldo.observacao,
              ).includes(
                termo,
              );


            const dataOk =
              !filtroData ||
              saldo.dataBase ===
                filtroData;


            const statusOk =
              filtroStatus ===
                "todos" ||
              (
                filtroStatus ===
                  "ativos" &&
                saldo.ativo
              ) ||
              (
                filtroStatus ===
                  "inativos" &&
                !saldo.ativo
              );


            return (
              buscaOk &&
              dataOk &&
              statusOk
            );
          },
        );
      },
      [
        saldos,
        busca,
        filtroData,
        filtroStatus,
      ],
    );


  /* =======================================================
     INDICADORES
  ======================================================= */

  const saldoAtualTotal =
    useMemo(
      () =>
        ultimosSaldos.reduce(
          (
            total,
            saldo,
          ) =>
            total +
            Number(
              saldo.quantidadeKg ??
                0,
            ),
          0,
        ),
      [
        ultimosSaldos,
      ],
    );


  /* =======================================================
     MODAL
  ======================================================= */

  function novoSaldo() {
    setItemEdicao(null);

    setModalAberto(true);
  }


  function editarSaldo(
    saldo,
  ) {
    setItemEdicao(
      saldo,
    );

    setModalAberto(true);
  }


  function fecharModal() {
    if (salvando) {
      return;
    }


    setModalAberto(false);

    setItemEdicao(null);
  }


  async function salvar(
    dados,
  ) {
    await salvarSaldoInicial(
      dados,
    );


    setModalAberto(false);

    setItemEdicao(null);
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <div className="saldos-iniciais">

        <div className="saldos-iniciais-toolbar">

          <div className="saldos-iniciais-indicadores">

            <div>

              <span>
                Fornecedores com saldo
              </span>

              <strong>
                {ultimosSaldos.length}
              </strong>

            </div>


            <div>

              <span>
                Saldo-base atual
              </span>

              <strong>
                {formatarKg(
                  saldoAtualTotal,
                )}
              </strong>

            </div>


            <div>

              <span>
                Registros históricos
              </span>

              <strong>
                {saldos.length}
              </strong>

            </div>

          </div>


          <button
            type="button"
            className="saldos-iniciais-novo"
            onClick={
              novoSaldo
            }
            disabled={
              salvando
            }
          >

            <Plus size={17} />

            Novo saldo

          </button>

        </div>


        <div className="saldos-iniciais-explicacao">

          <Scale
            size={18}
            aria-hidden="true"
          />

          <div>

            <strong>
              Ponto de partida da projeção
            </strong>

            <p>
              Para cada fornecedor, o sistema
              utilizará o saldo ativo mais
              recente até a data calculada.
              Novas contagens de estoque podem
              ser cadastradas sem apagar o
              histórico anterior.
            </p>

          </div>

        </div>


        <div className="saldos-iniciais-filtros">

          <label className="saldos-iniciais-busca">

            <Search size={16} />

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
                    event.target.value,
                  )
              }
              placeholder="Buscar fornecedor ou observação..."
            />

          </label>


          <input
            type="date"
            value={
              filtroData
            }
            onChange={
              (
                event,
              ) =>
                setFiltroData(
                  event.target.value,
                )
            }
          />


          <select
            value={
              filtroStatus
            }
            onChange={
              (
                event,
              ) =>
                setFiltroStatus(
                  event.target.value,
                )
            }
          >

            <option value="todos">
              Todos os status
            </option>

            <option value="ativos">
              Ativos
            </option>

            <option value="inativos">
              Inativos
            </option>

          </select>


          <button
            type="button"
            className="saldos-iniciais-atualizar"
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

          <div className="saldos-iniciais-estado">

            <span className="saldos-iniciais-loading" />

            <strong>
              Carregando saldos
            </strong>

          </div>

        )}


        {!carregando &&
          erro && (

          <div className="saldos-iniciais-estado saldos-iniciais-erro">

            <AlertTriangle size={30} />

            <strong>
              Erro ao carregar saldos
            </strong>

            <p>
              {erro}
            </p>

          </div>

        )}


        {!carregando &&
          !erro &&
          carregado &&
          saldos.length ===
            0 && (

          <div className="saldos-iniciais-estado">

            <Scale size={34} />

            <strong>
              Nenhum saldo-base cadastrado
            </strong>

            <p>
              Cadastre a quantidade atual de
              PP disponível em cada fornecedor
              para iniciar a projeção.
            </p>


            <button
              type="button"
              className="saldos-iniciais-vazio-novo"
              onClick={
                novoSaldo
              }
            >

              <Plus size={16} />

              Cadastrar saldo

            </button>

          </div>

        )}


        {!carregando &&
          !erro &&
          saldos.length >
            0 && (

          <>

            <div className="saldos-iniciais-tabela-container">

              <table className="saldos-iniciais-tabela">

                <thead>

                  <tr>
                    <th>Data-base</th>
                    <th>Fornecedor</th>
                    <th>Saldo</th>
                    <th>Observação</th>
                    <th>Uso na projeção</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>

                </thead>


                <tbody>

                  {saldosFiltrados.map(
                    (
                      saldo,
                    ) => {

                      const saldoAtual =
                        idsUltimosSaldos.has(
                          String(
                            saldo.id,
                          ),
                        );


                      return (
                        <tr
                          key={
                            saldo.id
                          }
                        >

                          <td className="saldos-iniciais-data">
                            {formatarData(
                              saldo.dataBase,
                            )}
                          </td>


                          <td className="saldos-iniciais-fornecedor">

                            <strong>
                              {saldo.fornecedorNome}
                            </strong>


                            {!saldo.fornecedorAtivo && (

                              <small>
                                Fornecedor inativo
                              </small>

                            )}

                          </td>


                          <td className="saldos-iniciais-quantidade">
                            {formatarKg(
                              saldo.quantidadeKg,
                            )}
                          </td>


                          <td className="saldos-iniciais-observacao">
                            {saldo.observacao ||
                              "-"}
                          </td>


                          <td>

                            {saldoAtual &&
                            saldo.ativo ? (

                              <span className="saldos-iniciais-base atual">
                                Base atual
                              </span>

                            ) : (

                              <span className="saldos-iniciais-base historico">
                                Histórico
                              </span>

                            )}

                          </td>


                          <td>

                            <span
                              className={
                                saldo.ativo
                                  ? "saldos-iniciais-status ativo"
                                  : "saldos-iniciais-status inativo"
                              }
                            >
                              {saldo.ativo
                                ? "Ativo"
                                : "Inativo"}
                            </span>

                          </td>


                          <td>

                            <button
                              type="button"
                              className="saldos-iniciais-editar"
                              onClick={
                                () =>
                                  editarSaldo(
                                    saldo,
                                  )
                              }
                              disabled={
                                salvando
                              }
                            >

                              <Pencil size={14} />

                              {saldoEstaSalvando(
                                saldo.id,
                              )
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


            {saldosFiltrados.length ===
              0 && (

              <div className="saldos-iniciais-sem-resultado">

                <Search size={27} />

                <strong>
                  Nenhum saldo encontrado
                </strong>

                <p>
                  Altere os filtros para
                  visualizar outros registros.
                </p>

              </div>

            )}

          </>

        )}

      </div>


      <SaldoInicialModal
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
          fecharModal
        }
        onSalvar={
          salvar
        }
      />

    </>
  );
}