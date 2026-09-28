import {
  createFileRoute,
} from "@tanstack/react-router";

import RotaProtegida
  from "@/components/layout/RotaProtegida";

import ComprasMateriaPrimaPage
  from "@/features/compras-materia-prima/ComprasMateriaPrimaPage";


export const Route =
  createFileRoute(
    "/entradas-materia-prima",
  )({
    ssr: false,

    head: () => ({
      meta: [
        {
          title:
            "Entradas de Matéria-Prima | Pedrasplast",
        },
        {
          name:
            "description",

          content:
            "Registro dos recebimentos de matéria-prima da Pedrasplast.",
        },
      ],
    }),

    component:
      EntradasMateriaPrimaRoute,
  });


function EntradasMateriaPrimaRoute() {
  return (
    <RotaProtegida
      permissao="compras"
    >

      <ComprasMateriaPrimaPage
        secao="entradas"
      />

    </RotaProtegida>
  );
}