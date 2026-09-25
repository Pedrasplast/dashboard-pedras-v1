import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CircleDollarSign,
} from "lucide-react";

import useDashboardMateriaPrima
  from "./useDashboardMateriaPrima.js";

import DashboardMateriaPrimaFiltros
  from "./components/DashboardMateriaPrimaFiltros.jsx";

import PainelFinanceiroMateriaPrima
  from "./components/PainelFinanceiroMateriaPrima.jsx";

import {
  criarEvolucaoFinanceira,
  criarFinanceiroFiltrado,
  criarFinanceiroPorFornecedor,
  criarFinanceiroPorMaterial,
  criarFornecedoresFiltro,
  criarInsightsGerenciais,
  criarMateriaisFiltro,
  criarResumoFinanceiro,
} from "./dashboardMateriaPrimaSelectors.js";

import {
  adicionarDias,
  formatarDataISO,
} from "./dashboardMateriaPrimaUtils.js";

import "./DashboardMateriaPrima.css";


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const DATA_INICIAL_SEM_FILTRO =
  "0001-01-01";

const DATA_FINAL_SEM_FILTRO =
  "9999-12-31";

const MATERIAL_PADRAO =
  "1";

const STORAGE_FILTROS =
  "pedrasplast:dashboard-materia-prima:filtros";


const FILTROS_PADRAO = {
  dataInicial: "",
  dataFinal: "",
  tipoData: "compra",
  fornecedorSelecionado: "todos",
  materialSelecionado: MATERIAL_PADRAO,
};


/* =========================================================
   PERSISTÊNCIA DOS FILTROS
========================================================= */

function carregarFiltros() {
  if (
    typeof window ===
    "undefined"
  ) {
    return {
      ...FILTROS_PADRAO,
    };
  }

  try {
    const salvo =
      window.localStorage.getItem(
        STORAGE_FILTROS,
      );

    if (!salvo) {
      return {
        ...FILTROS_PADRAO,
      };
    }

    return {
      ...FILTROS_PADRAO,
      ...JSON.parse(
        salvo,
      ),
    };
  } catch {
    return {
      ...FILTROS_PADRAO,
    };
  }
}


/* =========================================================
   DASHBOARD
========================================================= */

export default function DashboardMateriaPrima() {
  const [
    filtros,
    setFiltros,
  ] =
    useState(
      carregarFiltros,
    );


  const {
    dataInicial,
    dataFinal,
    tipoData,
    fornecedorSelecionado,
    materialSelecionado,
  } =
    filtros;


  /* =======================================================
     PERSISTIR FILTROS
  ======================================================= */

  useEffect(
    () => {
      try {
        window.localStorage.setItem(
          STORAGE_FILTROS,
          JSON.stringify(
            filtros,
          ),
        );
      } catch {
        // O dashboard continua funcionando
        // mesmo se o navegador bloquear o storage.
      }
    },
    [
      filtros,
    ],
  );


  /* =======================================================
     ALTERAR UM FILTRO
  ======================================================= */

  function alterarFiltro(
    campo,
    valor,
  ) {
    setFiltros(
      (
        atual,
      ) => ({
        ...atual,

        [campo]:
          valor,
      }),
    );
  }


  /* =======================================================
     PERÍODO
  ======================================================= */

  const periodoInvalido =
    Boolean(
      dataInicial &&
      dataFinal &&
      dataFinal <
        dataInicial,
    );


  /*
   * Datas ficam vazias visualmente.
   * A consulta usa período amplo quando
   * não existe filtro por data.
   */
  const dataInicialConsulta =
    dataInicial ||
    DATA_INICIAL_SEM_FILTRO;


  const dataFinalConsulta =
    dataFinal ||
    DATA_FINAL_SEM_FILTRO;


  /* =======================================================
     DADOS
  ======================================================= */

  const {
    dados,
    carregando,
    erro,
  } =
    useDashboardMateriaPrima({
      dataInicial:
        dataInicialConsulta,

      dataFinal:
        dataFinalConsulta,

      tipoData,

      habilitado:
        !periodoInvalido,
    });


  const financeiro =
    dados?.financeiro || {
      compras:
        [],

      recebimentos:
        [],
    };


  /* =======================================================
     FILTROS DISPONÍVEIS
  ======================================================= */

  const materiaisFiltro =
    useMemo(
      () =>
        criarMateriaisFiltro(
          financeiro,
        ),
      [
        financeiro,
      ],
    );


  const fornecedoresFiltro =
    useMemo(
      () =>
        criarFornecedoresFiltro(
          financeiro,
        ),
      [
        financeiro,
      ],
    );


  /* =======================================================
     FINANCEIRO FILTRADO
  ======================================================= */

  const financeiroFiltrado =
    useMemo(
      () =>
        criarFinanceiroFiltrado({
          financeiro,
          fornecedorSelecionado,
          materialSelecionado,
        }),
      [
        financeiro,
        fornecedorSelecionado,
        materialSelecionado,
      ],
    );


  const resumoFinanceiro =
    useMemo(
      () =>
        criarResumoFinanceiro(
          financeiroFiltrado,
        ),
      [
        financeiroFiltrado,
      ],
    );


  const financeiroPorMaterial =
    useMemo(
      () =>
        criarFinanceiroPorMaterial(
          financeiroFiltrado,
        ),
      [
        financeiroFiltrado,
      ],
    );


  const financeiroPorFornecedor =
    useMemo(
      () =>
        criarFinanceiroPorFornecedor(
          financeiroFiltrado,
        ),
      [
        financeiroFiltrado,
      ],
    );


  /* =======================================================
     EVOLUÇÃO FINANCEIRA
  ======================================================= */

  const evolucaoFinanceira =
    useMemo(
      () => {
        if (
          tipoData !==
          "recebimento"
        ) {
          return criarEvolucaoFinanceira(
            financeiroFiltrado,
          );
        }


        const financeiroPorRecebimento = {
          ...financeiroFiltrado,

          compras:
            (
              financeiroFiltrado
                .compras ||
              []
            ).map(
              (
                item,
              ) => ({
                ...item,

                dataCompra:
                  item.dataRecebimento ||
                  item.dataCompra,
              }),
            ),
        };


        return criarEvolucaoFinanceira(
          financeiroPorRecebimento,
        );
      },
      [
        financeiroFiltrado,
        tipoData,
      ],
    );


  /* =======================================================
     INSIGHTS
  ======================================================= */

  const insightsGerenciais =
    useMemo(
      () =>
        criarInsightsGerenciais({
          resumo:
            resumoFinanceiro,

          porMaterial:
            financeiroPorMaterial,

          porFornecedor:
            financeiroPorFornecedor,
        }),
      [
        resumoFinanceiro,
        financeiroPorMaterial,
        financeiroPorFornecedor,
      ],
    );


  /* =======================================================
     PERÍODO RÁPIDO
  ======================================================= */

  function aplicarPeriodoRapido(
    dias,
  ) {
    const fim =
      formatarDataISO(
        new Date(),
      );


    const inicio =
      adicionarDias(
        fim,
        -(dias - 1),
      );


    setFiltros(
      (
        atual,
      ) => ({
        ...atual,

        dataInicial:
          inicio,

        dataFinal:
          fim,
      }),
    );
  }


  /* =======================================================
     LIMPAR FILTROS
  ======================================================= */

  function limparFiltros() {
    setFiltros({
      ...FILTROS_PADRAO,
    });
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="dmp-page">

      <section className="dmp-header">

        <div>

          <span className="dmp-eyebrow">
            Compras • Custos • Fornecedores
          </span>

          <h1>
            Gestão de Matéria-Prima
          </h1>

          <p>
            Visão gerencial de compras, preços, custo efetivo, concentração por fornecedor e desempenho de entrega.
          </p>

        </div>


        <div className="dmp-header-icone">

          <CircleDollarSign
            size={30}
          />

        </div>

      </section>


      <DashboardMateriaPrimaFiltros
        dataInicial={
          dataInicial
        }

        dataFinal={
          dataFinal
        }

        tipoData={
          tipoData
        }

        fornecedorSelecionado={
          fornecedorSelecionado
        }

        materialSelecionado={
          materialSelecionado
        }

        fornecedores={
          fornecedoresFiltro
        }

        materiais={
          materiaisFiltro
        }

        materialPadrao={
          MATERIAL_PADRAO
        }

        onDataInicialChange={
          (
            valor,
          ) =>
            alterarFiltro(
              "dataInicial",
              valor,
            )
        }

        onDataFinalChange={
          (
            valor,
          ) =>
            alterarFiltro(
              "dataFinal",
              valor,
            )
        }

        onTipoDataChange={
          (
            valor,
          ) =>
            alterarFiltro(
              "tipoData",
              valor,
            )
        }

        onFornecedorChange={
          (
            valor,
          ) =>
            alterarFiltro(
              "fornecedorSelecionado",
              valor,
            )
        }

        onMaterialChange={
          (
            valor,
          ) =>
            alterarFiltro(
              "materialSelecionado",
              valor,
            )
        }

        onPeriodoRapido={
          aplicarPeriodoRapido
        }

        onLimparFiltros={
          limparFiltros
        }
      />


      {periodoInvalido && (

        <div className="dmp-mensagem erro">

          <AlertTriangle
            size={18}
          />

          <span>
            A data final não pode ser anterior à data inicial.
          </span>

        </div>

      )}


      {erro && (

        <div className="dmp-mensagem erro">

          <AlertTriangle
            size={18}
          />

          <span>
            {erro}
          </span>

        </div>

      )}


      <PainelFinanceiroMateriaPrima
        resumo={
          resumoFinanceiro
        }

        porMaterial={
          financeiroPorMaterial
        }

        porFornecedor={
          financeiroPorFornecedor
        }

        evolucao={
          evolucaoFinanceira
        }

        insights={
          insightsGerenciais
        }

        materialSelecionado={
          materialSelecionado
        }

        carregando={
          carregando
        }
      />

    </main>
  );
}