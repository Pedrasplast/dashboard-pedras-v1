import {
  AlertTriangle,
  Boxes,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import ProdutoPPModal from "./ProdutoPPModal";
import useProdutosPP from "./useProdutosPP";

import "./ProdutosPP.css";


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
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    );
}


function formatarKg(
  valor,
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "-";
  }


  return `${Number(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        3,
      maximumFractionDigits:
        6,
    },
  )} kg`;
}


/* =========================================================
   PRODUTOS PP
========================================================= */

export default function ProdutosPP() {
  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    filtroStatus,
    setFiltroStatus,
  ] = useState(
    "todos",
  );

  const [
    modalAberto,
    setModalAberto,
  ] = useState(false);

  const [
    produtoEdicao,
    setProdutoEdicao,
  ] = useState(null);


  const {
    produtos,
    carregando,
    carregado,
    erro,
    salvando,
    recarregar,
    salvarProduto,
    produtoEstaSalvando,
  } =
    useProdutosPP();


  /* =======================================================
     FILTROS
  ======================================================= */

  const produtosFiltrados =
    useMemo(
      () => {
        const termo =
          normalizarTexto(
            busca,
          );


        return produtos.filter(
          (
            produto,
          ) => {
            const buscaOk =
              !termo ||
              normalizarTexto(
                produto.codigoProduto,
              ).includes(
                termo,
              ) ||
              normalizarTexto(
                produto.nomeProduto,
              ).includes(
                termo,
              );


            const statusOk =
              filtroStatus ===
                "todos" ||
              (
                filtroStatus ===
                  "ativos" &&
                produto.ativo
              ) ||
              (
                filtroStatus ===
                  "inativos" &&
                !produto.ativo
              );


            return (
              buscaOk &&
              statusOk
            );
          },
        );
      },
      [
        produtos,
        busca,
        filtroStatus,
      ],
    );


  /* =======================================================
     INDICADORES
  ======================================================= */

  const indicadores =
    useMemo(
      () => ({
        total:
          produtos.length,

        ativos:
          produtos.filter(
            (
              produto,
            ) =>
              produto.ativo,
          ).length,

        inativos:
          produtos.filter(
            (
              produto,
            ) =>
              !produto.ativo,
          ).length,
      }),
      [
        produtos,
      ],
    );


  /* =======================================================
     NOVO
  ======================================================= */

  function novoProduto() {
    if (salvando) {
      return;
    }


    setProdutoEdicao(
      null,
    );

    setModalAberto(
      true,
    );
  }


  /* =======================================================
     EDITAR
  ======================================================= */

  function editarProduto(
    produto,
  ) {
    if (
      !produto ||
      salvando
    ) {
      return;
    }


    setProdutoEdicao(
      produto,
    );

    setModalAberto(
      true,
    );
  }


  /* =======================================================
     FECHAR
  ======================================================= */

  function fecharModal() {
    if (salvando) {
      return;
    }


    setModalAberto(
      false,
    );

    setProdutoEdicao(
      null,
    );
  }


  /* =======================================================
     SALVAR
  ======================================================= */

  async function salvar(
    dados,
  ) {
    await salvarProduto(
      dados,
    );


    setModalAberto(
      false,
    );

    setProdutoEdicao(
      null,
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <div className="produtos-pp">

        <div className="produtos-pp-toolbar">

          <div className="produtos-pp-indicadores">

            <div>

              <span>
                Produtos PP
              </span>

              <strong>
                {indicadores.total}
              </strong>

            </div>


            <div>

              <span>
                Ativos
              </span>

              <strong>
                {indicadores.ativos}
              </strong>

            </div>


            <div>

              <span>
                Inativos
              </span>

              <strong>
                {indicadores.inativos}
              </strong>

            </div>

          </div>


          <button
            type="button"
            className="produtos-pp-novo"
            onClick={
              novoProduto
            }
            disabled={
              salvando
            }
          >

            <Plus size={17} />

            Cadastrar produto

          </button>

        </div>


        <div className="produtos-pp-explicacao">

          <Boxes
            size={18}
            aria-hidden="true"
          />


          <div>

            <strong>
              Cadastro próprio de Produtos PP
            </strong>

            <p>
              Os produtos desta tela são
              cadastrados diretamente no módulo
              de Matéria-Prima. Não existe mais
              vínculo com os produtos dos
              pedidos.
            </p>

          </div>

        </div>


        <div className="produtos-pp-filtros">

          <label className="produtos-pp-busca">

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
              placeholder="Buscar por código ou produto..."
            />

          </label>


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
            className="produtos-pp-atualizar"
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

          <div className="produtos-pp-estado">

            <span className="produtos-pp-loading" />

            <strong>
              Carregando produtos
            </strong>

          </div>

        )}


        {!carregando &&
          erro && (

          <div className="produtos-pp-estado produtos-pp-erro">

            <AlertTriangle
              size={30}
            />

            <strong>
              Erro ao carregar produtos
            </strong>

            <p>
              {erro}
            </p>

          </div>

        )}


        {!carregando &&
          !erro &&
          carregado &&
          produtos.length ===
            0 && (

          <div className="produtos-pp-estado">

            <Boxes
              size={35}
              strokeWidth={1.7}
            />

            <strong>
              Nenhum Produto PP cadastrado
            </strong>

            <p>
              Cadastre os produtos que utilizam
              matéria-prima PP e informe o peso
              de cada peça.
            </p>


            <button
              type="button"
              className="produtos-pp-vazio-novo"
              onClick={
                novoProduto
              }
            >

              <Plus size={16} />

              Cadastrar primeiro produto

            </button>

          </div>

        )}


        {!carregando &&
          !erro &&
          produtos.length >
            0 && (

          <>

            <div className="produtos-pp-tabela-container">

              <table className="produtos-pp-tabela">

                <thead>

                  <tr>
                    <th>Código</th>
                    <th>Produto</th>
                    <th>Material</th>
                    <th>Peso por peça</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>

                </thead>


                <tbody>

                  {produtosFiltrados.map(
                    (
                      produto,
                    ) => (

                    <tr
                      key={
                        produto.codigoProduto
                      }
                    >

                      <td className="produtos-pp-codigo">
                        {produto.codigoProduto}
                      </td>


                      <td className="produtos-pp-produto">

                        <strong>
                          {produto.nomeProduto}
                        </strong>

                      </td>


                      <td>

                        <span className="produtos-pp-material">
                          PP
                        </span>

                      </td>


                      <td className="produtos-pp-peso">
                        {formatarKg(
                          produto.pesoKg,
                        )}
                      </td>


                      <td>

                        <span
                          className={
                            produto.ativo
                              ? "produtos-pp-status ativo"
                              : "produtos-pp-status inativo"
                          }
                        >
                          {produto.ativo
                            ? "Ativo"
                            : "Inativo"}
                        </span>

                      </td>


                      <td>

                        <button
                          type="button"
                          className="produtos-pp-editar"
                          onClick={
                            () =>
                              editarProduto(
                                produto,
                              )
                          }
                          disabled={
                            salvando
                          }
                        >

                          <Pencil size={14} />

                          {produtoEstaSalvando(
                            produto.codigoProduto,
                          )
                            ? "Salvando..."
                            : "Editar"}

                        </button>

                      </td>

                    </tr>

                    ),
                  )}

                </tbody>

              </table>

            </div>


            <div className="produtos-pp-rodape">

              Exibindo{" "}

              <strong>
                {produtosFiltrados.length}
              </strong>

              {" "}de{" "}

              <strong>
                {produtos.length}
              </strong>

              {" "}produtos

            </div>


            {produtosFiltrados.length ===
              0 && (

              <div className="produtos-pp-sem-resultado">

                <Search size={27} />

                <strong>
                  Nenhum produto encontrado
                </strong>

                <p>
                  Altere os filtros para
                  visualizar outros produtos.
                </p>

              </div>

            )}

          </>

        )}

      </div>


      <ProdutoPPModal
        aberto={
          modalAberto
        }
        item={
          produtoEdicao
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