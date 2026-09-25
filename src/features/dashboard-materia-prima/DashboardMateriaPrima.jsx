import {
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
  obterPeriodoInicial,
} from "./dashboardMateriaPrimaUtils.js";

import "./DashboardMateriaPrima.css";


export default function DashboardMateriaPrima() {
  const periodoInicial =
    useMemo(
      () =>
        obterPeriodoInicial(),
      [],
    );

  const [
    dataInicial,
    setDataInicial,
  ] =
    useState(
      periodoInicial.inicio,
    );

  const [
    dataFinal,
    setDataFinal,
  ] =
    useState(
      periodoInicial.fim,
    );

  const [
    tipoData,
    setTipoData,
  ] =
    useState(
      "compra",
    );

  const [
    fornecedorSelecionado,
    setFornecedorSelecionado,
  ] =
    useState(
      "todos",
    );

  const [
    materialSelecionado,
    setMaterialSelecionado,
  ] =
    useState(
      "1",
    );

  const periodoInvalido =
    Boolean(
      dataInicial &&
      dataFinal &&
      dataFinal <
        dataInicial,
    );

  const {
    dados,
    carregando,
    atualizando,
    erro,
    recarregar,
  } =
    useDashboardMateriaPrima({
      dataInicial,
      dataFinal,
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
            (financeiroFiltrado.compras || []).map(
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


  function aplicarPeriodoRapido(
    dias,
  ) {
    const hoje =
      new Date();

    const fim =
      formatarDataISO(
        hoje,
      );

    const inicio =
      adicionarDias(
        fim,
        -(dias - 1),
      );

    setDataInicial(
      inicio,
    );

    setDataFinal(
      fim,
    );
  }

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
        carregando={
          carregando
        }
        atualizando={
          atualizando
        }
        periodoInvalido={
          periodoInvalido
        }
        onDataInicialChange={
          setDataInicial
        }
        onDataFinalChange={
          setDataFinal
        }
        onTipoDataChange={
          setTipoData
        }
        onFornecedorChange={
          setFornecedorSelecionado
        }
        onMaterialChange={
          setMaterialSelecionado
        }
        onPeriodoRapido={
          aplicarPeriodoRapido
        }
        onAtualizar={
          () =>
            recarregar()
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