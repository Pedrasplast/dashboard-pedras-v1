import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./FinanceiroPage.css";

import FinanceiroStatusSincronizacao from "./components/FinanceiroStatusSincronizacao";

import FinanceiroDetalhes from "./components/FinanceiroDetalhes";
import FinanceiroFiltros from "./components/FinanceiroFiltros";
import FinanceiroResumo from "./components/FinanceiroResumo";
import FinanceiroTabela from "./components/FinanceiroTabela";

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
          Number(ano),
        );


      if (!anoExiste) {
        definirAno(
          anosDisponiveis[0],
        );

        definirCategoriaSelecionada(
          null,
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
     LINHAS
  ======================================================= */

  const linhasTabela =
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
     NOME MÊS
  ======================================================= */

  const nomeMes =
    useMemo(
      () =>
        mesesFinanceiro.find(
          (item) =>
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
      },
      [],
    );


  return (
    <main className="financeiro-page">

      {/* ===================================================
          CABEÇALHO
      =================================================== */}

      <header className="financeiro-cabecalho">

        <div>

          <h1 className="financeiro-titulo">
            Financeiro
          </h1>

          <p className="financeiro-subtitulo">
            Previsto x realizado
          </p>

        </div>


        <div className="financeiro-status-canto">
          <FinanceiroStatusSincronizacao
            sincronizacao={
              sincronizacao
            }
            carregando={
              carregandoSincronizacao
            }
          />
        </div>

      </header>


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
        anosDisponiveis={
          anosDisponiveis
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