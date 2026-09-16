import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import EstoquePage from "@/features/estoque/EstoquePage";

export const Route = createFileRoute("/estoque")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Estoque | Pedrasplast",
      },
      {
        name: "description",
        content:
          "Consulta do estoque de produtos acabados integrado ao Omie.",
      },
    ],
  }),

  component: EstoqueRoute,
});

function EstoqueRoute() {
  return (
    <RotaProtegida permissao="estoque">
      <EstoquePage />
    </RotaProtegida>
  );
}