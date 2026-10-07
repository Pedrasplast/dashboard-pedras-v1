import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./FinanceiroPage.css";

import {
  WalletCards,
} from "lucide-react";

import PageHeader
  from "@/components/layout/PageHeader";

import FinanceiroStatusSincronizacao
  from "./components/FinanceiroStatusSincronizacao";

import FinanceiroDetalhes
  from "./components/FinanceiroDetalhes";

import FinanceiroFiltros
  from "./components/FinanceiroFiltros";

import FinanceiroResumo
  from "./components/FinanceiroResumo";

import FinanceiroTabela
  from "./components/FinanceiroTabela";

import {
  useFinanceiroAnos,
  useFinanceiroResumo,
  useFinanceiroSincronizacao,
} from "./hooks/useFinanceiro";

import {
  mesesFinanceiro,
  processarFinanceiro,
} from "./utils/financeiro.utils";


/* =========================================================
   PERÍODO INICIAL
========================================================= */

function obterPeriodoAtual() {
  const agora =
    new Date();


  return {
    ano:
      agora.getFullYear(),

    mes:
      agora.getMonth() +
      1,
  };
}


/* =========================================================
   NORMALIZAR TEXTO PARA PESQUISA

   Remove:
   - espaços extras
   - diferenças entre maiúsculas/minúsculas
   - acentos

   Exemplo:
   "Manutenção" -> "manutencao"
========================================================= */

function normalizarTexto(
  valor,
) {
  return String(
    valor ?? "",
  )
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .trim()
    .toLowerCase();
}


/* =========================================================
   PÁGINA
========================================================= */

export default function FinanceiroPage() {
  const periodoInicial =
    useMemo(
      () =>
        obterPeriodoAtual(),
      [],
    );


  const [
    ano,
    definirAno,
  ] =
    useState(
      periodoInicial.ano,
    );


  const [
    mes,
    definirMes,
  ] =
    useState(
      periodoInicial.mes,
    );


  const [
    tipo,
    definirTipo,
  ] =
    useState(
      "todos",
    );


  /*
   * Categoria utilizada para filtrar
   * a tabela da visão geral.
   *
   * "todas" = nenhuma categoria específica.
   */
  const [
    categoriaFiltro,
    definirCategoriaFiltro,
  ] =
    useState(
      "todas",
    );


  /*
   * Pesquisa livre.
   *
   * Pesquisa por:
   * - código
   * - categoria
   * - tipo
   */
  const [
    buscaLivre,
    definirBuscaLivre,
  ] =
    useState(
      "",
    );


  /*
   * Categoria aberta no modal de detalhes.
   *
   * Não confundir com categoriaFiltro.
   */
  const [
    categoriaSelecionada,
    definirCategoriaSelecionada,
  ] =
    useState(
      null,
    );


  /* =======================================================
     ANOS DISPONÍVEIS NO BANCO
  ======================================================= */

  const {
    data:
      anosDisponiveis = [],
  } =
    useFinanceiroAnos();


  /* =======================================================
     SE O ANO ATUAL NÃO EXISTIR NO BANCO

     Selecionamos automaticamente o ano mais recente.
  ======================================================= */

  useEffect(
    () => {
      if (
        !Array.isArray(
          anosDisponiveis,
        ) ||
        anosDisponiveis.length ===
          0
      ) {
        return;
      }


      const anoExiste =
        anosDisponiveis.includes(
          Number(
            ano,
          ),
        );


      if (!anoExiste) {
        definirAno(
          anosDisponiveis[0],
        );

        definirCategoriaSelecionada(
          null,
        );

        definirCategoriaFiltro(
          "todas",
        );

        definirBuscaLivre(
          "",
        );
      }
    },
    [
      anosDisponiveis,
      ano,
    ],
  );


  /* =======================================================
     RESUMO FINANCEIRO
  ======================================================= */

  const {
    data:
      dadosFinanceiro = [],

    isLoading:
      carregandoFinanceiro,

    isFetching:
      atualizandoFinanceiro,

    isError:
      erroFinanceiro,

    error:
      detalheErroFinanceiro,
  } =
    useFinanceiroResumo(
      ano,
      mes,
    );


  /* =======================================================
     SINCRONIZAÇÃO
  ======================================================= */

  const {
    data:
      sincronizacao,

    isLoading:
      carregandoSincronizacao,
  } =
    useFinanceiroSincronizacao();


  /* =======================================================
     PROCESSAR
  ======================================================= */

  const financeiro =
    useMemo(
      () =>
        processarFinanceiro(
          dadosFinanceiro,
        ),
      [
        dadosFinanceiro,
      ],
    );


  /* =======================================================
     FILTRO POR TIPO

     Primeiro selecionamos:
     - todos
     - receitas
     - despesas

     Depois os outros filtros são aplicados.
  ======================================================= */

  const linhasPorTipo =
    useMemo(
      () => {
        if (
          tipo ===
          "receitas"
        ) {
          return financeiro
            .receitas;
        }


        if (
          tipo ===
          "despesas"
        ) {
          return financeiro
            .despesas;
        }


        return financeiro
          .linhas;
      },
      [
        financeiro,
        tipo,
      ],
    );


  /* =======================================================
     CATEGORIAS DISPONÍVEIS

     É gerada automaticamente a partir
     dos dados do período selecionado.

     Cada opção utiliza o código como valor,
     evitando problemas com categorias de mesmo nome.
  ======================================================= */

  const categoriasDisponiveis =
    useMemo(
      () => {
        const mapa =
          new Map();


        for (
          const linha of
          linhasPorTipo
        ) {
          const codigo =
            String(
              linha
                ?.codigo_categoria ??
                "",
            ).trim();


          const categoria =
            String(
              linha
                ?.categoria ??
                "",
            ).trim();


          if (
            !codigo &&
            !categoria
          ) {
            continue;
          }


          const chave =
            codigo ||
            categoria;


          if (
            mapa.has(
              chave,
            )
          ) {
            continue;
          }


          mapa.set(
            chave,
            {
              valor:
                chave,

              codigo,

              categoria,

              label:
                codigo &&
                categoria
                  ? `${codigo} - ${categoria}`
                  : categoria ||
                    codigo,
            },
          );
        }


        return Array
          .from(
            mapa.values(),
          )
          .sort(
            (
              primeiro,
              segundo,
            ) =>
              primeiro.label
                .localeCompare(
                  segundo.label,
                  "pt-BR",
                  {
                    numeric:
                      true,
                  },
                ),
          );
      },
      [
        linhasPorTipo,
      ],
    );


  /* =======================================================
     CORRIGIR CATEGORIA QUANDO TIPO MUDAR

     Exemplo:
     usuário escolheu uma despesa e depois
     alterou Tipo para Receitas.

     A categoria antiga deixa de ser válida.
  ======================================================= */

  useEffect(
    () => {
      if (
        categoriaFiltro ===
        "todas"
      ) {
        return;
      }


      const existe =
        categoriasDisponiveis
          .some(
            (
              categoria,
            ) =>
              categoria.valor ===
              categoriaFiltro,
          );


      if (!existe) {
        definirCategoriaFiltro(
          "todas",
        );
      }
    },
    [
      categoriasDisponiveis,
      categoriaFiltro,
    ],
  );


  /* =======================================================
     FILTRAR TABELA

     Ordem:
     1. Tipo
     2. Categoria
     3. Pesquisa livre
  ======================================================= */

  const linhasTabela =
    useMemo(
      () => {
        let resultado =
          linhasPorTipo;


        /* ===============================================
           CATEGORIA
        =============================================== */

        if (
          categoriaFiltro !==
          "todas"
        ) {
          resultado =
            resultado.filter(
              (
                linha,
              ) => {
                const codigo =
                  String(
                    linha
                      ?.codigo_categoria ??
                      "",
                  ).trim();


                const categoria =
                  String(
                    linha
                      ?.categoria ??
                      "",
                  ).trim();


                return (
                  codigo ===
                    categoriaFiltro ||
                  categoria ===
                    categoriaFiltro
                );
              },
            );
        }


        /* ===============================================
           PESQUISA LIVRE
        =============================================== */

        const termo =
          normalizarTexto(
            buscaLivre,
          );


        if (termo) {
          resultado =
            resultado.filter(
              (
                linha,
              ) => {
                const conteudo =
                  normalizarTexto(
                    [
                      linha
                        ?.codigo_categoria,

                      linha
                        ?.categoria,

                      linha
                        ?.tipo,
                    ]
                      .filter(
                        Boolean,
                      )
                      .join(
                        " ",
                      ),
                  );


                return conteudo.includes(
                  termo,
                );
              },
            );
        }


        return resultado;
      },
      [
        linhasPorTipo,
        categoriaFiltro,
        buscaLivre,
      ],
    );


  /* =======================================================
     NOME MÊS
  ======================================================= */

  const nomeMes =
    useMemo(
      () =>
        mesesFinanceiro.find(
          (
            item,
          ) =>
            item.valor ===
            mes,
        )?.nome ??
        "",
      [
        mes,
      ],
    );


  /* =======================================================
     DETALHES
  ======================================================= */

  const abrirDetalhes =
    useCallback(
      (
        categoria,
      ) => {
        definirCategoriaSelecionada(
          categoria,
        );
      },
      [],
    );


  const fecharDetalhes =
    useCallback(
      () => {
        definirCategoriaSelecionada(
          null,
        );
      },
      [],
    );


  /* =======================================================
     FILTROS
  ======================================================= */

  const alterarMes =
    useCallback(
      (
        novoMes,
      ) => {
        definirMes(
          novoMes,
        );

        definirCategoriaSelecionada(
          null,
        );

        definirCategoriaFiltro(
          "todas",
        );

        definirBuscaLivre(
          "",
        );
      },
      [],
    );


  const alterarAno =
    useCallback(
      (
        novoAno,
      ) => {
        definirAno(
          novoAno,
        );

        definirCategoriaSelecionada(
          null,
        );

        definirCategoriaFiltro(
          "todas",
        );

        definirBuscaLivre(
          "",
        );
      },
      [],
    );


  const alterarTipo =
    useCallback(
      (
        novoTipo,
      ) => {
        definirTipo(
          novoTipo,
        );

        definirCategoriaSelecionada(
          null,
        );

        definirCategoriaFiltro(
          "todas",
        );
      },
      [],
    );


  const alterarCategoriaFiltro =
    useCallback(
      (
        novaCategoria,
      ) => {
        definirCategoriaFiltro(
          novaCategoria,
        );

        definirCategoriaSelecionada(
          null,
        );
      },
      [],
    );


  const alterarBuscaLivre =
    useCallback(
      (
        novoValor,
      ) => {
        definirBuscaLivre(
          novoValor,
        );

        definirCategoriaSelecionada(
          null,
        );
      },
      [],
    );


  const limparFiltros =
    useCallback(
      () => {
        definirTipo(
          "todos",
        );

        definirCategoriaFiltro(
          "todas",
        );

        definirBuscaLivre(
          "",
        );

        definirCategoriaSelecionada(
          null,
        );
      },
      [],
    );


  const possuiFiltroAdicional =
    tipo !== "todos" ||
    categoriaFiltro !== "todas" ||
    Boolean(
      buscaLivre.trim(),
    );


  return (
    <main className="financeiro-page">

      {/* ===================================================
          CABEÇALHO
      =================================================== */}

      <PageHeader
        eyebrow="Gestão financeira"
        title="Financeiro"
        description="Previsto x realizado"
        icon={
          WalletCards
        }
        className="financeiro-cabecalho"
        actions={
          <FinanceiroStatusSincronizacao
            sincronizacao={
              sincronizacao
            }
            carregando={
              carregandoSincronizacao
            }
          />
        }
      />


      {/* ===================================================
          FILTROS
      =================================================== */}

      <FinanceiroFiltros
        mes={
          mes
        }

        ano={
          ano
        }

        tipo={
          tipo
        }

        categoria={
          categoriaFiltro
        }

        busca={
          buscaLivre
        }

        categoriasDisponiveis={
          categoriasDisponiveis
        }

        anosDisponiveis={
          anosDisponiveis
        }

        possuiFiltroAdicional={
          possuiFiltroAdicional
        }

        aoAlterarMes={
          alterarMes
        }

        aoAlterarAno={
          alterarAno
        }

        aoAlterarTipo={
          alterarTipo
        }

        aoAlterarCategoria={
          alterarCategoriaFiltro
        }

        aoAlterarBusca={
          alterarBuscaLivre
        }

        aoLimparFiltros={
          limparFiltros
        }
      />


      {/* ===================================================
          PERÍODO
      =================================================== */}

      <div className="financeiro-periodo">

        <span>
          Período selecionado
        </span>

        <strong>
          {nomeMes} / {ano}
        </strong>

      </div>


      {/* ===================================================
          CARREGANDO
      =================================================== */}

      {carregandoFinanceiro && (
        <div className="financeiro-status">
          Carregando dados financeiros...
        </div>
      )}


      {/* ===================================================
          ERRO
      =================================================== */}

      {erroFinanceiro && (
        <div className="financeiro-status financeiro-status-erro">

          {detalheErroFinanceiro
            ?.message ||
            "Não foi possível carregar os dados financeiros."}

        </div>
      )}


      {/* ===================================================
          DADOS
      =================================================== */}

      {!carregandoFinanceiro &&
        !erroFinanceiro && (
          <>

            {/* =============================================
                RESUMO

                Os cards continuam representando o período
                completo. Categoria e pesquisa livre filtram
                somente a tabela.
            ============================================= */}

            <FinanceiroResumo
              resumo={
                financeiro
                  .resumo
              }
            />


            {atualizandoFinanceiro && (
              <div className="financeiro-atualizando">
                Atualizando dados...
              </div>
            )}


            <section className="financeiro-conteudo">

              <div className="financeiro-tabela-cabecalho">

                <div>

                  <h2>
                    Categorias financeiras
                  </h2>

                  <span>
                    {
                      linhasTabela
                        .length
                    }{" "}
                    categoria
                    {
                      linhasTabela
                        .length ===
                      1
                        ? ""
                        : "s"
                    }

                    {possuiFiltroAdicional && (
                      <>
                        {" "}
                        encontrada
                        {
                          linhasTabela
                            .length ===
                          1
                            ? ""
                            : "s"
                        }
                      </>
                    )}
                  </span>

                </div>

              </div>


              <FinanceiroTabela
                linhas={
                  linhasTabela
                }

                aoDetalhar={
                  abrirDetalhes
                }
              />

            </section>

          </>
        )}


      {/* ===================================================
          DETALHAMENTO
      =================================================== */}

      <FinanceiroDetalhes
        aberto={
          Boolean(
            categoriaSelecionada,
          )
        }

        ano={
          ano
        }

        mes={
          mes
        }

        categoria={
          categoriaSelecionada
        }

        aoFechar={
          fecharDetalhes
        }
      />

    </main>
  );
}