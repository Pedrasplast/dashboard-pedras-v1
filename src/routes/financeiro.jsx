import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "../components/layout/RotaProtegida";
import FinanceiroPage from "../features/financeiro/FinanceiroPage";


export const Route =
  createFileRoute(
    "/financeiro",
  )({
    ssr: false,

    head: () => ({
      meta: [
        {
          title:
            "Financeiro | Pedrasplast",
        },
        {
          name:
            "description",

          content:
            "Acompanhamento financeiro previsto e realizado integrado ao Omie.",
        },
      ],
    }),

    component:
      FinanceiroRoute,
  });


function FinanceiroRoute() {
  return (
    <RotaProtegida permissao="financeiro">
      <FinanceiroPage />
    </RotaProtegida>
  );
}