import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import DashboardProdutividade from "@/features/dashboard-produtividade/dashboardProdutividade";

export const Route =
  createFileRoute("/dashboard-produtividade")({
    ssr: false,

    head: () => ({
      meta: [
        {
          title:
            "Dashboard de Produtividade | Pedrasplast",
        },
        {
          name: "description",
          content:
            "Indicadores e análises de produtividade da produção Pedrasplast.",
        },
      ],
    }),

    component: DashboardProdutividadeRoute,
  });

function DashboardProdutividadeRoute() {
  return (
    <RotaProtegida permissao="dashboard_produtividade">
      <DashboardProdutividade />
    </RotaProtegida>
  );
}