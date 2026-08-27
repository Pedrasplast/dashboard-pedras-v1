import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import ImportadorCargaPage from "@/features/importacao/ImportadorCargaPage";

export const Route = createFileRoute("/importar")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Importar Carga | Pedrasplast",
      },
      {
        name: "description",
        content:
          "Importação da carga de máquinas para o sistema Pedrasplast.",
      },
    ],
  }),

  component: ImportarRoute,
});

function ImportarRoute() {
  return (
    <RotaProtegida permissao="importar">
      <ImportadorCargaPage />
    </RotaProtegida>
  );
}