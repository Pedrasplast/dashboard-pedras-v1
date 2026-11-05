import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";

import NecessidadeMateriaPrimaPage from "@/features/necessidade-materia-prima/NecessidadeMateriaPrimaPage";

export const Route = createFileRoute("/necessidade-materia-prima")({
  ssr: false,

  component: NecessidadeMateriaPrimaRoute,
});

function NecessidadeMateriaPrimaRoute() {
  return (
    <RotaProtegida permissao="necessidade_materia_prima">
      <NecessidadeMateriaPrimaPage />
    </RotaProtegida>
  );
}
