import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import DashboardMateriaPrima from "@/features/dashboard-materia-prima/DashboardMateriaPrima";

export const Route =
  createFileRoute("/dashboard-materia-prima")({
    ssr: false,

    head: () => ({
      meta: [
        {
          title:
            "Dashboard de Matéria-Prima | Pedrasplast",
        },
        {
          name: "description",
          content:
            "Acompanhamento e análise de matéria-prima da Pedrasplast.",
        },
      ],
    }),

    component: DashboardMateriaPrimaRoute,
  });

function DashboardMateriaPrimaRoute() {
  return (
    <RotaProtegida permissao="dashboard_materia_prima">
      <DashboardMateriaPrima />
    </RotaProtegida>
  );
}