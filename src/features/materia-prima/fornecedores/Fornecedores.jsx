import {
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import FornecedorModal from "./FornecedorModal";
import useFornecedores from "./useFornecedores";

import "./Fornecedores.css";


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


/* =========================================================
   FORNECEDORES
========================================================= */

export default function Fornecedores() {
  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    modalAberto,
    setModalAberto,
  ] = useState(false);

  const [
    fornecedorEmEdicao,
    setFornecedorEmEdicao,
  ] = useState(null);


  const {
    fornecedores,
    carregando,
    erro,
    carregado,
    salvando,
    recarregar,
    salvarFornecedor,
    fornecedorEstaSalvando,
  } =
    useFornecedores();


  /* =======================================================
     FILTRAR FORNECEDORES
  ======================================================= */

  const fornecedoresFiltrados =
    useMemo(
      () => {
        const termo =
          normalizarTexto(
            busca,
          );


        if (!termo) {
          return fornecedores;
        }


        return fornecedores.filter(
          (
            fornecedor,
          ) =>
            normalizarTexto(
              fornecedor
                ?.nome,
            ).includes(
              termo,
            ),
        );
      },
      [
        fornecedores,
        busca,
      ],
    );


  /* =======================================================
     NOVO FORNECEDOR
  ======================================================= */

  function abrirNovoFornecedor() {
    if (salvando) {
      return;
    }


    setFornecedorEmEdicao(
      null,
    );

    setModalAberto(
      true,
    );
  }


  /* =======================================================
     EDITAR FORNECEDOR
  ======================================================= */

  function abrirEdicaoFornecedor(
    fornecedor,
  ) {
    if (
      !fornecedor ||
      salvando
    ) {
      return;
    }


    setFornecedorEmEdicao(
      fornecedor,
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

    setFornecedorEmEdicao(
      null,
    );
  }


  /* =======================================================
     SALVAR FORNECEDOR
  ======================================================= */

  async function salvarDadosFornecedor(
    dados,
  ) {
    const fornecedorSalvo =
      await salvarFornecedor(
        dados,
      );


    setModalAberto(
      false,
    );

    setFornecedorEmEdicao(
      null,
    );


    return fornecedorSalvo;
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <div className="fornecedores-pp">

        {/* =================================================
            BARRA SUPERIOR
        ================================================= */}

        <div className="fornecedores-pp-toolbar">

          <div className="fornecedores-pp-resumo">

            <div className="fornecedores-pp-resumo-icone">

              <Truck
                size={20}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>


            <div>

              <span>
                Fornecedores cadastrados
              </span>

              <strong>
                {
                  fornecedores.length
                }
              </strong>

            </div>

          </div>


          <div className="fornecedores-pp-acoes">

            <label className="fornecedores-pp-busca">

              <Search
                size={17}
                strokeWidth={2}
                aria-hidden="true"
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
                placeholder="Buscar fornecedor..."
              />

            </label>


            <button
              type="button"
              className="fornecedores-pp-recarregar"
              onClick={
                recarregar
              }
              disabled={
                carregando ||
                salvando
              }
              title="Recarregar fornecedores"
            >

              <RefreshCw
                size={17}
                strokeWidth={2}
                className={
                  carregando
                    ? "girando"
                    : ""
                }
                aria-hidden="true"
              />

              <span>
                Atualizar
              </span>

            </button>


            <button
              type="button"
              className="fornecedores-pp-novo"
              onClick={
                abrirNovoFornecedor
              }
              disabled={
                salvando
              }
            >

              <Plus
                size={17}
                strokeWidth={2}
                aria-hidden="true"
              />

              <span>
                Novo fornecedor
              </span>

            </button>

          </div>

        </div>


        {/* =================================================
            CARREGANDO
        ================================================= */}

        {carregando && (

          <div className="fornecedores-pp-estado">

            <span className="fornecedores-pp-loading" />

            <strong>
              Carregando fornecedores
            </strong>

            <p>
              Consultando os fornecedores
              de matéria-prima PP.
            </p>

          </div>

        )}


        {/* =================================================
            ERRO
        ================================================= */}

        {!carregando &&
          erro && (

            <div className="fornecedores-pp-estado fornecedores-pp-erro">

              <Truck
                size={30}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <strong>
                Não foi possível carregar
                os fornecedores
              </strong>

              <p>
                {erro}
              </p>

              <button
                type="button"
                onClick={
                  recarregar
                }
              >
                Tentar novamente
              </button>

            </div>

          )}


        {/* =================================================
            SEM FORNECEDORES
        ================================================= */}

        {!carregando &&
          !erro &&
          carregado &&
          fornecedores.length ===
            0 && (

            <div className="fornecedores-pp-estado">

              <Truck
                size={34}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <strong>
                Nenhum fornecedor
                cadastrado
              </strong>

              <p>
                Cadastre os fornecedores
                ou fontes de PP que serão
                utilizados nas receitas.
              </p>


              <button
                type="button"
                className="fornecedores-pp-vazio-novo"
                onClick={
                  abrirNovoFornecedor
                }
                disabled={
                  salvando
                }
              >

                <Plus
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                <span>
                  Novo fornecedor
                </span>

              </button>

            </div>

          )}


        {/* =================================================
            TABELA
        ================================================= */}

        {!carregando &&
          !erro &&
          fornecedores.length >
            0 && (

            <>

              <div className="fornecedores-pp-tabela-container">

                <table className="fornecedores-pp-tabela">

                  <thead>

                    <tr>

                      <th>
                        Fornecedor
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

                    {fornecedoresFiltrados.map(
                      (
                        fornecedor,
                      ) => {
                        const estaSalvando =
                          fornecedorEstaSalvando(
                            fornecedor.id,
                          );


                        return (
                          <tr
                            key={
                              fornecedor.id
                            }
                          >

                            <td className="fornecedores-pp-nome">

                              <div className="fornecedores-pp-fornecedor">

                                <div className="fornecedores-pp-fornecedor-icone">

                                  <Truck
                                    size={16}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                  />

                                </div>


                                <span>
                                  {
                                    fornecedor.nome
                                  }
                                </span>

                              </div>

                            </td>


                            <td>

                              <span
                                className={
                                  fornecedor
                                    .ativo
                                    ? "fornecedores-pp-status ativo"
                                    : "fornecedores-pp-status inativo"
                                }
                              >
                                {fornecedor
                                  .ativo
                                  ? "Ativo"
                                  : "Inativo"}
                              </span>

                            </td>


                            <td>

                              <button
                                type="button"
                                className="fornecedores-pp-editar"
                                onClick={
                                  () =>
                                    abrirEdicaoFornecedor(
                                      fornecedor,
                                    )
                                }
                                disabled={
                                  salvando
                                }
                              >

                                <Pencil
                                  size={14}
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />

                                <span>
                                  {estaSalvando
                                    ? "Salvando..."
                                    : "Editar"}
                                </span>

                              </button>

                            </td>

                          </tr>
                        );
                      },
                    )}

                  </tbody>

                </table>

              </div>


              <div className="fornecedores-pp-rodape">

                <span>

                  Exibindo{" "}

                  <strong>
                    {
                      fornecedoresFiltrados.length
                    }
                  </strong>

                  {" "}de{" "}

                  <strong>
                    {
                      fornecedores.length
                    }
                  </strong>

                  {" "}fornecedores

                </span>

              </div>

            </>

          )}


        {/* =================================================
            BUSCA SEM RESULTADO
        ================================================= */}

        {!carregando &&
          !erro &&
          fornecedores.length >
            0 &&
          fornecedoresFiltrados.length ===
            0 && (

            <div className="fornecedores-pp-sem-resultado">

              <Search
                size={26}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <strong>
                Nenhum fornecedor
                encontrado
              </strong>

              <p>
                Nenhum fornecedor
                corresponde à busca{" "}

                <b>
                  {busca}
                </b>
                .
              </p>

            </div>

          )}

      </div>


      {/* ===================================================
          MODAL
      =================================================== */}

      <FornecedorModal
        aberto={
          modalAberto
        }
        fornecedor={
          fornecedorEmEdicao
        }
        salvando={
          salvando
        }
        onCancelar={
          fecharModal
        }
        onSalvar={
          salvarDadosFornecedor
        }
      />

    </>
  );
}