import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";

import ComprasMateriaPrimaPage from "@/features/compras-materia-prima/ComprasMateriaPrimaPage";

import { useAuthContext } from "@/lib/contextoAuth";

export const Route = createFileRoute("/compras-futuras")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Compras Futuras | Pedrasplast",
      },

      {
        name: "description",

        content: "Controle das compras futuras de matéria-prima da Pedrasplast.",
      },
    ],
  }),

  component: ComprasFuturasRoute,
});

function ComprasFuturasRoute() {
  const { ehAdmin } = useAuthContext();

  return (
    <RotaProtegida permissao="compras_futuras">
      <ComprasMateriaPrimaPage secao="compras-futuras" ehAdmin={ehAdmin} />
    </RotaProtegida>
  );
}
