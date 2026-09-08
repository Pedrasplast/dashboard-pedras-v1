import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import DashboardParadas from "@/features/dashboard-paradas/DashboardParadas";

export const Route =
  createFileRoute("/dashboard-paradas")({
    ssr: false,

    head: () => ({
      meta: [
        {
          title:
            "Dashboard de Paradas | Pedrasplast",
        },
        {
          name: "description",
          content:
            "Análise gerencial das paradas, perdas, recorrências e principais causas operacionais.",
        },
      ],
    }),

    component: DashboardParadasRoute,
  });

function DashboardParadasRoute() {
  return (
    <RotaProtegida permissao="dashboard_paradas">
      <DashboardParadas />
    </RotaProtegida>
  );
}