import {
  createFileRoute,
} from "@tanstack/react-router";

import RotaProtegida
  from "../components/layout/RotaProtegida";

import FinanceiroEvolucaoMensalPage
  from "../features/financeiro/pages/FinanceiroEvolucaoMensalPage";


export const Route =
  createFileRoute(
    "/financeiro-evolucao-mensal",
  )({
    ssr: false,

    head: () => ({
      meta: [
        {
          title:
            "Evolução Mensal Financeira | Pedrasplast",
        },

        {
          name:
            "description",

          content:
            "Acompanhamento mensal de receitas, despesas, resultado e margem financeira.",
        },
      ],
    }),

    component:
      FinanceiroEvolucaoMensalRoute,
  });


function FinanceiroEvolucaoMensalRoute() {
  return (
    <RotaProtegida
      permissao="financeiro_evolucao_mensal"
    >
      <FinanceiroEvolucaoMensalPage />
    </RotaProtegida>
  );
}