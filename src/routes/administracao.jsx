import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import AdministracaoPage from "@/features/administracao/AdministracaoPage";

export const Route = createFileRoute("/administracao")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Administração | Pedrasplast",
      },
      {
        name: "description",
        content:
          "Administração do sistema Pedrasplast, calendário industrial, feriados e permissões.",
      },
    ],
  }),

  component: AdministracaoRoute,
});

function AdministracaoRoute() {
  return (
    <RotaProtegida exigirAdmin>
      <AdministracaoPage />
    </RotaProtegida>
  );
}
