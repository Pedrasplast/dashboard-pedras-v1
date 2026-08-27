import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import TelaRelatoriosPage from "@/features/relatorios/TelaRelatoriosPage";

export const Route = createFileRoute("/relatorios")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Relatórios | Pedrasplast",
      },
      {
        name: "description",
        content:
          "Relatórios e análises operacionais da Pedrasplast.",
      },
    ],
  }),

  component: RelatoriosRoute,
});

function RelatoriosRoute() {
  return (
    <RotaProtegida permissao="relatorios">
      <TelaRelatoriosPage />
    </RotaProtegida>
  );
}