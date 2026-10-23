import {
  useEffect,
  useMemo,
  useRef,
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

import {
  ORIGEM_OMIE,
} from "./origemOmie.js";

import PainelFinanceiroMateriaPrima
  from "./components/PainelFinanceiroMateriaPrima.jsx";

import {
  criarComprasMensais,
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
  periodoMesAtual,
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
  "pedrasplast:dashboard-materia-prima:filtros:v2";


const FILTROS_PADRAO = {
  dataInicial: "",
  dataFinal: "",
  tipoData: "compra",
  origem: ORIGEM_OMIE,
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
      ...periodoMesAtual(),
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
        ...periodoMesAtual(),
      };
    }

    return {
      ...FILTROS_PADRAO,
      ...JSON.parse(
        salvo,
      ),
      /* O período sempre abre no mês atual (os demais filtros ficam salvos). */
      ...periodoMesAtual(),
    };
  } catch {
    return {
      ...FILTROS_PADRAO,
      ...periodoMesAtual(),
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

  /* =======================================================
     MÊS ATUAL AUTOMÁTICO

     Se o período ainda é o mês atual automático e o mês
     virar com a tela aberta, passa para o novo mês ao
     voltar para a tela. Período escolhido à mão não muda.
  ======================================================= */

  const periodoAutomaticoRef =
    useRef(
      periodoMesAtual(),
    );

  useEffect(
    () => {
      function atualizarMes() {
        const novo =
          periodoMesAtual();

        const anterior =
          periodoAutomaticoRef.current;

        if (
          novo.dataInicial ===
          anterior.dataInicial
        ) {
          return;
        }

        periodoAutomaticoRef.current =
          novo;

        setFiltros(
          (
            atual,
          ) =>
            atual.dataInicial ===
              anterior.dataInicial &&
            atual.dataFinal ===
              anterior.dataFinal
              ? {
                  ...atual,
                  ...novo,
                }
              : atual,
        );
      }

      window.addEventListener(
        "focus",
        atualizarMes,
      );

      document.addEventListener(
        "visibilitychange",
        atualizarMes,
      );

      const intervalo =
        window.setInterval(
          atualizarMes,
          60 * 60 * 1000,
        );

      return () => {
        window.removeEventListener(
          "focus",
          atualizarMes,
        );

        document.removeEventListener(
          "visibilitychange",
          atualizarMes,
        );

        window.clearInterval(
          intervalo,
        );
      };
    },
    [],
  );

  const {
    dataInicial,
    dataFinal,
    tipoData,
    origem,
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

      origem,

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


  /* Só fornecedores com compra do material selecionado no período. */
  const fornecedoresFiltro =
    useMemo(
      () => {
        const doMaterial =
          criarFinanceiroFiltrado({
            financeiro,
            fornecedorSelecionado:
              "todos",
            materialSelecionado,
          });

        return criarFornecedoresFiltro({
          compras:
            doMaterial.compras.filter(
              (item) =>
                item.status !==
                  "CANCELADA" &&
                Number(item.quantidadeKg) > 0,
            ),
          recebimentos:
            doMaterial.recebimentos,
        });
      },
      [
        financeiro,
        materialSelecionado,
      ],
    );


  /* Fornecedor escolhido sem compra do material: volta para "todos". */
  useEffect(
    () => {
      if (
        carregando ||
        fornecedorSelecionado ===
          "todos" ||
        fornecedoresFiltro.some(
          (item) =>
            String(item.fornecedorId) ===
            String(fornecedorSelecionado),
        )
      ) {
        return;
      }

      setFiltros(
        (atual) => ({
          ...atual,
          fornecedorSelecionado:
            "todos",
        }),
      );
    },
    [
      carregando,
      fornecedorSelecionado,
      fornecedoresFiltro,
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
     BASE TEMPORAL DOS GRÁFICOS

     COMPRA
     -> utiliza dataCompra

     RECEBIMENTO
     -> utiliza dataRecebimento

     Fornecedor, material e período já foram filtrados
     anteriormente.
  ======================================================= */

  const financeiroTemporal =
    useMemo(
      () => {
        if (
          tipoData !==
          "recebimento"
        ) {
          return financeiroFiltrado;
        }

        return {
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
      },
      [
        financeiroFiltrado,
        tipoData,
      ],
    );


  /* =======================================================
     EVOLUÇÃO FINANCEIRA
  ======================================================= */

  const evolucaoFinanceira =
    useMemo(
      () =>
        criarEvolucaoFinanceira(
          financeiroTemporal,
        ),
      [
        financeiroTemporal,
      ],
    );


  /* =======================================================
     COMPRAS MENSAIS

     Janeiro até o último mês com compra.
     Meses sem movimentação aparecem com zero.
  ======================================================= */

  const comprasMensais =
    useMemo(
      () =>
        criarComprasMensais(
          financeiroTemporal,
        ),
      [
        financeiroTemporal,
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
    const periodo =
      periodoMesAtual();

    periodoAutomaticoRef.current =
      periodo;

    setFiltros({
      ...FILTROS_PADRAO,
      ...periodo,
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
            Visão gerencial de compras, preços, custo efetivo,
            concentração por fornecedor e desempenho de entrega.
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

        origem={
          origem
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

        periodoPadrao={
          periodoAutomaticoRef.current
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

        onOrigemChange={
          (
            valor,
          ) =>
            /* Fornecedores mudam de cadastro entre Manual e Omie. */
            setFiltros(
              (
                atual,
              ) => ({
                ...atual,
                origem:
                  valor,
                fornecedorSelecionado:
                  "todos",
              }),
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

        mensal={
          comprasMensais
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