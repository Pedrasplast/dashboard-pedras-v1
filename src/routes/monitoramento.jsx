import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import MonitoramentoPage from "@/features/monitoramento/MonitoramentoPage";

export const Route = createFileRoute("/monitoramento")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Monitoramento | Pedrasplast",
      },
      {
        name: "description",
        content: "Situação das rotinas automáticas do sistema Pedrasplast.",
      },
    ],
  }),

  component: MonitoramentoRoute,
});

function MonitoramentoRoute() {
  return (
    <RotaProtegida exigirAdmin>
      <MonitoramentoPage />
    </RotaProtegida>
  );
}
