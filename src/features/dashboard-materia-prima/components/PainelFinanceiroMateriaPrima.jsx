import {
  AvisosMateriaPrima,
  EficienciaEntregaMateriaPrima,
  IndicadoresPrincipaisMateriaPrima,
} from "./IndicadoresMateriaPrima.jsx";

import InsightsMateriaPrima
  from "./InsightsMateriaPrima.jsx";

import GraficosMensaisMateriaPrima
  from "./GraficosMensaisMateriaPrima.jsx";

import GraficosFornecedorMateriaPrima
  from "./GraficosFornecedorMateriaPrima.jsx";

import TabelasMateriaPrima
  from "./TabelasMateriaPrima.jsx";


export default function PainelFinanceiroMateriaPrima({
  resumo,
  porMaterial,
  porFornecedor,
  evolucao,
  mensal,
  insights,
  materialSelecionado,
  carregando,
}) {
  const misturaMateriais =
    Number(
      resumo?.materiaisDistintos ||
      0,
    ) > 1;


  return (
    <section className="dmp-financeiro">

      <AvisosMateriaPrima
        resumo={
          resumo
        }
        materialSelecionado={
          materialSelecionado
        }
      />


      <IndicadoresPrincipaisMateriaPrima
        resumo={
          resumo
        }
        misturaMateriais={
          misturaMateriais
        }
        carregando={
          carregando
        }
      />


      <EficienciaEntregaMateriaPrima
        resumo={
          resumo
        }
        carregando={
          carregando
        }
      />


      <InsightsMateriaPrima
        insights={
          insights
        }
      />


      <GraficosMensaisMateriaPrima
        mensal={
          mensal
        }
      />


      <GraficosFornecedorMateriaPrima
        porFornecedor={
          porFornecedor
        }
        evolucao={
          evolucao
        }
        misturaMateriais={
          misturaMateriais
        }
      />


      <TabelasMateriaPrima
        porMaterial={
          porMaterial
        }
        porFornecedor={
          porFornecedor
        }
      />

    </section>
  );
}