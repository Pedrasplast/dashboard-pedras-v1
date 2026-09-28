import {
  createFileRoute,
} from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import ComprasMateriaPrimaPage from "@/features/compras-materia-prima/ComprasMateriaPrimaPage";


export const Route =
  createFileRoute(
    "/compras-futuras",
  )({
    ssr: false,

    head: () => ({
      meta: [
        {
          title:
            "Compras Futuras | Pedrasplast",
        },
        {
          name: "description",
          content:
            "Controle das compras futuras de matéria-prima da Pedrasplast.",
        },
      ],
    }),

    component:
      ComprasFuturasRoute,
  });


function ComprasFuturasRoute() {
  return (
    <RotaProtegida permissao="materia_prima">

      <ComprasMateriaPrimaPage secao="compras-futuras" />

    </RotaProtegida>
  );
}
