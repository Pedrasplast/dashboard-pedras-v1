import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import DashboardPage from "@/features/dashboard/DashboardPage";

export const Route = createFileRoute("/dashboard")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Dashboard | Pedrasplast",
      },
      {
        name: "description",
        content:
          "Dashboard de produção e acompanhamento operacional Pedrasplast.",
      },
    ],
  }),

  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <RotaProtegida permissao="dashboard">
      <DashboardPage />
    </RotaProtegida>
  );
}