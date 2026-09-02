import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import MateriaPrima from "@/features/materia-prima/MateriaPrima";


export const Route =
  createFileRoute("/materia-prima")({
    ssr: false,

    head: () => ({
      meta: [
        {
          title:
            "Matéria-Prima | Pedrasplast",
        },
        {
          name: "description",
          content:
            "Controle, programação e projeção de matéria-prima PP da Pedrasplast.",
        },
      ],
    }),

    component: MateriaPrimaRoute,
  });


function MateriaPrimaRoute() {
  return (
    <RotaProtegida permissao="materia_prima">

      <MateriaPrima />

    </RotaProtegida>
  );
}