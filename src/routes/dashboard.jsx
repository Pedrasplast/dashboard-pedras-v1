import { createFileRoute } from "@tanstack/react-router";
import DashboardPage from "@/features/dashboard/DashboardPage";
import RotaProtegida from "@/components/layout/RotaProtegida";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard de Produção | Pedrasplast" },
      {
        name: "description",
        content:
          "Indicadores de eficiência, peças conformes, horas trabalhadas e paradas por injetora.",
      },
      { property: "og:title", content: "Dashboard de Produção | Pedrasplast" },
      {
        property: "og:description",
        content: "Indicadores de eficiência e paradas das injetoras em tempo real.",
      },
    ],
  }),
  component: RotaDashboard,
});

function RotaDashboard() {
  return (
    <RotaProtegida>
      <DashboardPage />
    </RotaProtegida>
  );
}
