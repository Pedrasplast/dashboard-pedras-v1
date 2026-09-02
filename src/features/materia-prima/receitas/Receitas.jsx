import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import useReceitas from "./useReceitas";

import "./Receitas.css";


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


function converterNumero(
  valor,
) {
  const numero =
    Number(
      String(
        valor ?? "",
      )
        .trim()
        .replace(
          ",",
          ".",
        ),
    );


  return Number.isFinite(
    numero,
  )
    ? numero
    : 0;
}


function formatarPercentual(
  valor,
) {
  const numero =
    Number(
      valor,
    );


  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "0%";
  }


  return `${numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        0,
      maximumFractionDigits:
        4,
    },
  )}%`;
}


function formatarPeso(
  valor,
) {
  const numero =
    Number(
      valor,
    );


  if (
    valor === null ||
    valor === undefined ||
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
        3,
      maximumFractionDigits:
        6,
    },
  )} kg`;
}


function criarChaveItem() {
  return `${Date.now()}-${Math.random()}`;
}


/* =========================================================
   RECEITAS
========================================================= */

export default function Receitas() {
  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    receitaEmEdicao,
    setReceitaEmEdicao,
  ] = useState(null);

  const [
    itensEdicao,
    setItensEdicao,
  ] = useState([]);

  const [
    erroEdicao,
    setErroEdicao,
  ] = useState("");


  const {
    receitas,
    fornecedores,
    carregando,
    carregado,
    erro,
    recarregar,
    salvarReceita,
    receitaEstaSalvando,
  } =
    useReceitas();


  /* =======================================================
     FILTRAR RECEITAS
  ======================================================= */

  const receitasFiltradas =
    useMemo(
      () => {
        const termo =
          normalizarTexto(
            busca,
          );


        if (!termo) {
          return receitas;
        }


        return receitas.filter(
          (
            receita,
          ) =>
            normalizarTexto(
              receita
                ?.codigo,
            ).includes(
              termo,
            ) ||
            normalizarTexto(
              receita
                ?.descricao,
            ).includes(
              termo,
            ),
        );
      },
      [
        receitas,
        busca,
      ],
    );


  /* =======================================================
     INDICADORES
  ======================================================= */

  const quantidadeConfiguradas =
    useMemo(
      () =>
        receitas.filter(
          (
            receita,
          ) =>
            receita
              ?.configurada ===
            true,
        ).length,
      [
        receitas,
      ],
    );


  const quantidadePendentes =
    Math.max(
      receitas.length -
        quantidadeConfiguradas,
      0,
    );


  /* =======================================================
     TOTAL DA EDIÇÃO
  ======================================================= */

  const totalEdicao =
    useMemo(
      () =>
        Math.round(
          (
            itensEdicao.reduce(
              (
                total,
                item,
              ) =>
                total +
                converterNumero(
                  item
                    ?.percentual,
                ),
              0,
            ) +
            Number.EPSILON
          ) *
            10000,
        ) /
        10000,
      [
        itensEdicao,
      ],
    );


  const totalValido =
    Math.abs(
      totalEdicao -
        100,
    ) <=
    0.0001;


  /* =======================================================
     FORNECEDORES UTILIZADOS
  ======================================================= */

  const fornecedoresUtilizados =
    useMemo(
      () =>
        new Set(
          itensEdicao
            .map(
              (
                item,
              ) =>
                String(
                  item
                    ?.fornecedorId ??
                    "",
                ),
            )
            .filter(
              Boolean,
            ),
        ),
      [
        itensEdicao,
      ],
    );


  const podeAdicionarFornecedor =
    fornecedores.some(
      (
        fornecedor,
      ) =>
        fornecedor
          ?.ativo ===
          true &&
        !fornecedoresUtilizados.has(
          String(
            fornecedor
              ?.id,
          ),
        ),
    );


  /* =======================================================
     ABRIR EDITOR
  ======================================================= */

  function abrirEditor(
    receita,
  ) {
    if (!receita) {
      return;
    }


    setReceitaEmEdicao(
      receita,
    );


    setItensEdicao(
      (
        Array.isArray(
          receita
            ?.itens,
        )
          ? receita
              .itens
          : []
      ).map(
        (
          item,
        ) => ({
          chave:
            `existente-${item.id}`,

          fornecedorId:
            String(
              item
                .fornecedorId,
            ),

          percentual:
            String(
              item
                .percentual,
            ).replace(
              ".",
              ",",
            ),
        }),
      ),
    );


    setErroEdicao(
      "",
    );
  }


  /* =======================================================
     FECHAR EDITOR
  ======================================================= */

  function fecharEditor() {
    if (
      receitaEmEdicao &&
      receitaEstaSalvando(
        receitaEmEdicao
          .codigo,
      )
    ) {
      return;
    }


    setReceitaEmEdicao(
      null,
    );

    setItensEdicao(
      [],
    );

    setErroEdicao(
      "",
    );
  }


  /* =======================================================
     ADICIONAR FORNECEDOR
  ======================================================= */

  function adicionarFornecedor() {
    const fornecedor =
      fornecedores.find(
        (
          registro,
        ) =>
          registro
            ?.ativo ===
            true &&
          !fornecedoresUtilizados.has(
            String(
              registro
                ?.id,
            ),
          ),
      );


    if (!fornecedor) {
      setErroEdicao(
        "Não existem outros fornecedores ativos disponíveis.",
      );

      return;
    }


    setItensEdicao(
      (
        itensAtuais,
      ) => [
        ...itensAtuais,

        {
          chave:
            criarChaveItem(),

          fornecedorId:
            String(
              fornecedor.id,
            ),

          percentual:
            "",
        },
      ],
    );


    setErroEdicao(
      "",
    );
  }


  /* =======================================================
     ALTERAR FORNECEDOR
  ======================================================= */

  function alterarFornecedor(
    chave,
    fornecedorId,
  ) {
    setItensEdicao(
      (
        itensAtuais,
      ) =>
        itensAtuais.map(
          (
            item,
          ) =>
            item.chave ===
            chave
              ? {
                  ...item,

                  fornecedorId,
                }
              : item,
        ),
    );


    setErroEdicao(
      "",
    );
  }


  /* =======================================================
     ALTERAR PERCENTUAL
  ======================================================= */

  function alterarPercentual(
    chave,
    percentual,
  ) {
    setItensEdicao(
      (
        itensAtuais,
      ) =>
        itensAtuais.map(
          (
            item,
          ) =>
            item.chave ===
            chave
              ? {
                  ...item,

                  percentual,
                }
              : item,
        ),
    );


    setErroEdicao(
      "",
    );
  }


  /* =======================================================
     REMOVER ITEM
  ======================================================= */

  function removerFornecedor(
    chave,
  ) {
    setItensEdicao(
      (
        itensAtuais,
      ) =>
        itensAtuais.filter(
          (
            item,
          ) =>
            item.chave !==
            chave,
        ),
    );


    setErroEdicao(
      "",
    );
  }


  /* =======================================================
     FORNECEDORES DISPONÍVEIS POR LINHA
  ======================================================= */

  function fornecedorPodeAparecer(
    fornecedor,
    itemAtual,
  ) {
    if (
      String(
        fornecedor
          ?.id,
      ) ===
      String(
        itemAtual
          ?.fornecedorId,
      )
    ) {
      return true;
    }


    if (
      fornecedor
        ?.ativo !==
      true
    ) {
      return false;
    }


    return !fornecedoresUtilizados.has(
      String(
        fornecedor
          ?.id,
      ),
    );
  }


  /* =======================================================
     SALVAR EDIÇÃO
  ======================================================= */

  async function salvarEdicao() {
    if (!receitaEmEdicao) {
      return;
    }


    setErroEdicao(
      "",
    );


    if (
      itensEdicao.length ===
      0
    ) {
      setErroEdicao(
        "Adicione pelo menos um fornecedor à receita.",
      );

      return;
    }


    if (
      itensEdicao.some(
        (
          item,
        ) =>
          !String(
            item
              ?.fornecedorId ??
              "",
          ).trim(),
      )
    ) {
      setErroEdicao(
        "Selecione o fornecedor de todos os itens.",
      );

      return;
    }


    if (
      itensEdicao.some(
        (
          item,
        ) => {
          const percentual =
            converterNumero(
              item
                ?.percentual,
            );


          return (
            percentual <=
              0 ||
            percentual >
              100
          );
        },
      )
    ) {
      setErroEdicao(
        "Todos os percentuais precisam ser maiores que 0 e menores ou iguais a 100.",
      );

      return;
    }


    if (!totalValido) {
      setErroEdicao(
        `A receita precisa totalizar 100%. O total atual é ${formatarPercentual(
          totalEdicao,
        )}.`,
      );

      return;
    }


    try {
      await salvarReceita({
        codigoProduto:
          receitaEmEdicao
            .codigo,

        itens:
          itensEdicao.map(
            (
              item,
            ) => ({
              fornecedorId:
                item
                  .fornecedorId,

              percentual:
                converterNumero(
                  item
                    .percentual,
                ),
            }),
          ),
      });


      fecharEditor();
    } catch (error) {
      setErroEdicao(
        error
          ?.message ||
          "Não foi possível salvar a receita.",
      );
    }
  }


  /* =======================================================
     SALVANDO
  ======================================================= */

  const salvandoEdicao =
    receitaEmEdicao
      ? receitaEstaSalvando(
          receitaEmEdicao
            .codigo,
        )
      : false;


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <div className="receitas-pp">

        {/* =================================================
            BARRA SUPERIOR
        ================================================= */}

        <div className="receitas-pp-toolbar">

          <div className="receitas-pp-indicadores">

            <div className="receitas-pp-indicador">

              <span>
                Produtos PP
              </span>

              <strong>
                {
                  receitas.length
                }
              </strong>

            </div>


            <div className="receitas-pp-indicador">

              <span>
                Configurados
              </span>

              <strong>
                {
                  quantidadeConfiguradas
                }
              </strong>

            </div>


            <div className="receitas-pp-indicador">

              <span>
                Pendentes
              </span>

              <strong>
                {
                  quantidadePendentes
                }
              </strong>

            </div>

          </div>


          <div className="receitas-pp-acoes">

            <label className="receitas-pp-busca">

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
                placeholder="Buscar por código ou produto..."
              />

            </label>


            <button
              type="button"
              className="receitas-pp-atualizar"
              onClick={
                recarregar
              }
              disabled={
                carregando
              }
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

          </div>

        </div>


        {/* =================================================
            CARREGANDO
        ================================================= */}

        {carregando && (

          <div className="receitas-pp-estado">

            <span className="receitas-pp-loading" />

            <strong>
              Carregando receitas
            </strong>

            <p>
              Consultando produtos,
              fornecedores e composições
              de PP.
            </p>

          </div>

        )}


        {/* =================================================
            ERRO
        ================================================= */}

        {!carregando &&
          erro && (

            <div className="receitas-pp-estado receitas-pp-erro">

              <AlertTriangle
                size={30}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <strong>
                Não foi possível carregar
                as receitas
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
            SEM PRODUTOS PP
        ================================================= */}

        {!carregando &&
          !erro &&
          carregado &&
          receitas.length ===
            0 && (

            <div className="receitas-pp-estado">

              <FlaskConical
                size={34}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <strong>
                Nenhum produto PP disponível
              </strong>

              <p>
                Primeiro configure os produtos
                que utilizam PP e informe o
                peso da peça na seção Produtos
                PP.
              </p>

            </div>

          )}


        {/* =================================================
            TABELA
        ================================================= */}

        {!carregando &&
          !erro &&
          receitas.length >
            0 && (

            <>

              <div className="receitas-pp-tabela-container">

                <table className="receitas-pp-tabela">

                  <thead>

                    <tr>

                      <th>
                        Código
                      </th>

                      <th>
                        Produto
                      </th>

                      <th>
                        Peso
                      </th>

                      <th>
                        Fornecedores
                      </th>

                      <th>
                        Total
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

                    {receitasFiltradas.map(
                      (
                        receita,
                      ) => {

                        const salvando =
                          receitaEstaSalvando(
                            receita.codigo,
                          );


                        return (
                          <tr
                            key={
                              receita.codigo
                            }
                          >

                            <td className="receitas-pp-codigo">
                              {
                                receita.codigo
                              }
                            </td>


                            <td className="receitas-pp-produto">

                              <strong>
                                {receita
                                  .descricao ||
                                  "Sem descrição"}
                              </strong>


                              {receita
                                .itens
                                .length >
                                0 && (

                                <small>
                                  {receita
                                    .itens
                                    .map(
                                      (
                                        item,
                                      ) =>
                                        `${item.fornecedorNome} ${formatarPercentual(
                                          item.percentual,
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
                                formatarPeso(
                                  receita
                                    .pesoKg,
                                )
                              }
                            </td>


                            <td>
                              {
                                receita
                                  .quantidadeFornecedores
                              }
                            </td>


                            <td>

                              <strong
                                className={
                                  receita
                                    .configurada
                                    ? "receitas-pp-total valido"
                                    : "receitas-pp-total"
                                }
                              >
                                {
                                  formatarPercentual(
                                    receita
                                      .percentualTotal,
                                  )
                                }
                              </strong>

                            </td>


                            <td>

                              {receita
                                .configurada ? (

                                <span className="receitas-pp-status configurada">

                                  <CheckCircle2
                                    size={13}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                  />

                                  Configurada

                                </span>

                              ) : receita
                                  .possuiItens ? (

                                <span className="receitas-pp-status incompleta">

                                  <AlertTriangle
                                    size={13}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                  />

                                  Incompleta

                                </span>

                              ) : (

                                <span className="receitas-pp-status pendente">
                                  A configurar
                                </span>

                              )}

                            </td>


                            <td>

                              <button
                                type="button"
                                className="receitas-pp-configurar"
                                onClick={
                                  () =>
                                    abrirEditor(
                                      receita,
                                    )
                                }
                                disabled={
                                  salvando
                                }
                              >

                                {receita
                                  .possuiItens ? (

                                  <Pencil
                                    size={14}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                  />

                                ) : (

                                  <Plus
                                    size={14}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                  />

                                )}


                                <span>
                                  {salvando
                                    ? "Salvando..."
                                    : receita
                                        .possuiItens
                                      ? "Editar"
                                      : "Configurar"}
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


              <div className="receitas-pp-rodape">

                Exibindo{" "}

                <strong>
                  {
                    receitasFiltradas.length
                  }
                </strong>

                {" "}de{" "}

                <strong>
                  {
                    receitas.length
                  }
                </strong>

                {" "}produtos PP

              </div>

            </>

          )}


        {/* =================================================
            BUSCA VAZIA
        ================================================= */}

        {!carregando &&
          !erro &&
          receitas.length >
            0 &&
          receitasFiltradas.length ===
            0 && (

            <div className="receitas-pp-sem-resultado">

              <Search
                size={26}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              <strong>
                Nenhum produto encontrado
              </strong>

              <p>
                Nenhum produto corresponde
                à busca{" "}

                <b>
                  {busca}
                </b>
                .
              </p>

            </div>

          )}

      </div>


      {/* ===================================================
          EDITOR DA RECEITA
      =================================================== */}

      {receitaEmEdicao && (

        <div className="receitas-editor-overlay">

          <div
            className="receitas-editor"
            role="dialog"
            aria-modal="true"
          >

            {/* ===============================================
                CABEÇALHO
            =============================================== */}

            <div className="receitas-editor-header">

              <div className="receitas-editor-header-icone">

                <FlaskConical
                  size={22}
                  strokeWidth={2}
                  aria-hidden="true"
                />

              </div>


              <div className="receitas-editor-header-texto">

                <span>
                  Receita de PP
                </span>

                <h3>
                  Produto{" "}
                  {
                    receitaEmEdicao.codigo
                  }
                </h3>

                <p>
                  {receitaEmEdicao
                    .descricao ||
                    "Sem descrição"}
                </p>

              </div>


              <button
                type="button"
                className="receitas-editor-fechar"
                onClick={
                  fecharEditor
                }
                disabled={
                  salvandoEdicao
                }
              >

                <X
                  size={19}
                  strokeWidth={2}
                  aria-hidden="true"
                />

              </button>

            </div>


            {/* ===============================================
                INFORMAÇÕES
            =============================================== */}

            <div className="receitas-editor-info">

              <div>

                <span>
                  Peso da peça
                </span>

                <strong>
                  {
                    formatarPeso(
                      receitaEmEdicao
                        .pesoKg,
                    )
                  }
                </strong>

              </div>


              <div>

                <span>
                  Total da receita
                </span>

                <strong
                  className={
                    totalValido
                      ? "valido"
                      : "invalido"
                  }
                >
                  {
                    formatarPercentual(
                      totalEdicao,
                    )
                  }
                </strong>

              </div>

            </div>


            {/* ===============================================
                ITENS
            =============================================== */}

            <div className="receitas-editor-body">

              <div className="receitas-editor-titulo">

                <div>

                  <strong>
                    Composição
                  </strong>

                  <span>
                    A soma dos fornecedores
                    precisa totalizar 100%.
                  </span>

                </div>


                <button
                  type="button"
                  className="receitas-editor-adicionar"
                  onClick={
                    adicionarFornecedor
                  }
                  disabled={
                    !podeAdicionarFornecedor ||
                    salvandoEdicao
                  }
                >

                  <Plus
                    size={15}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  Adicionar fornecedor

                </button>

              </div>


              {itensEdicao.length ===
                0 ? (

                <div className="receitas-editor-vazio">

                  <FlaskConical
                    size={28}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />

                  <strong>
                    Receita ainda vazia
                  </strong>

                  <p>
                    Adicione um fornecedor
                    para iniciar a composição.
                  </p>


                  {podeAdicionarFornecedor && (

                    <button
                      type="button"
                      onClick={
                        adicionarFornecedor
                      }
                    >
                      <Plus
                        size={15}
                        strokeWidth={2}
                        aria-hidden="true"
                      />

                      Adicionar fornecedor
                    </button>

                  )}

                </div>

              ) : (

                <div className="receitas-editor-itens">

                  {itensEdicao.map(
                    (
                      item,
                    ) => (

                      <div
                        key={
                          item.chave
                        }
                        className="receitas-editor-item"
                      >

                        <label>

                          <span>
                            Fornecedor
                          </span>

                          <select
                            value={
                              item
                                .fornecedorId
                            }
                            onChange={
                              (
                                event,
                              ) =>
                                alterarFornecedor(
                                  item.chave,
                                  event
                                    .target
                                    .value,
                                )
                            }
                            disabled={
                              salvandoEdicao
                            }
                          >

                            <option value="">
                              Selecione
                            </option>


                            {fornecedores
                              .filter(
                                (
                                  fornecedor,
                                ) =>
                                  fornecedorPodeAparecer(
                                    fornecedor,
                                    item,
                                  ),
                              )
                              .map(
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
                                      fornecedor.nome
                                    }

                                    {!fornecedor
                                      .ativo
                                      ? " (Inativo)"
                                      : ""}
                                  </option>

                                ),
                              )}

                          </select>

                        </label>


                        <label className="receitas-editor-percentual">

                          <span>
                            Percentual
                          </span>

                          <div>

                            <input
                              type="text"
                              inputMode="decimal"
                              value={
                                item
                                  .percentual
                              }
                              onChange={
                                (
                                  event,
                                ) =>
                                  alterarPercentual(
                                    item.chave,
                                    event
                                      .target
                                      .value,
                                  )
                              }
                              placeholder="0"
                              disabled={
                                salvandoEdicao
                              }
                            />

                            <span>
                              %
                            </span>

                          </div>

                        </label>


                        <button
                          type="button"
                          className="receitas-editor-remover"
                          onClick={
                            () =>
                              removerFornecedor(
                                item.chave,
                              )
                          }
                          disabled={
                            salvandoEdicao
                          }
                          title="Remover fornecedor"
                        >

                          <Trash2
                            size={16}
                            strokeWidth={2}
                            aria-hidden="true"
                          />

                        </button>

                      </div>

                    ),
                  )}

                </div>

              )}


              {/* =============================================
                  TOTAL
              ============================================= */}

              <div
                className={
                  totalValido
                    ? "receitas-editor-total valido"
                    : "receitas-editor-total"
                }
              >

                <div>

                  {totalValido ? (

                    <CheckCircle2
                      size={19}
                      strokeWidth={2}
                      aria-hidden="true"
                    />

                  ) : (

                    <AlertTriangle
                      size={19}
                      strokeWidth={2}
                      aria-hidden="true"
                    />

                  )}


                  <span>
                    Total da composição
                  </span>

                </div>


                <strong>
                  {
                    formatarPercentual(
                      totalEdicao,
                    )
                  }
                </strong>

              </div>


              {/* =============================================
                  ERRO
              ============================================= */}

              {erroEdicao && (

                <div className="receitas-editor-erro">

                  <AlertTriangle
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  <span>
                    {erroEdicao}
                  </span>

                </div>

              )}

            </div>


            {/* ===============================================
                AÇÕES
            =============================================== */}

            <div className="receitas-editor-acoes">

              <button
                type="button"
                className="receitas-editor-cancelar"
                onClick={
                  fecharEditor
                }
                disabled={
                  salvandoEdicao
                }
              >
                Cancelar
              </button>


              <button
                type="button"
                className="receitas-editor-salvar"
                onClick={
                  salvarEdicao
                }
                disabled={
                  salvandoEdicao ||
                  itensEdicao.length ===
                    0
                }
              >

                <Save
                  size={17}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                <span>
                  {salvandoEdicao
                    ? "Salvando..."
                    : "Salvar receita"}
                </span>

              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}