
import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";

import TabelaPrecosMateriaPrimaPage from "@/features/tabela-precos-materia-prima/TabelaPrecosMateriaPrimaPage";

export const Route = createFileRoute(
  "/tabela-precos-materia-prima"
)({
  ssr: false,

  component: TabelaPrecosMateriaPrimaRoute,
});

function TabelaPrecosMateriaPrimaRoute() {
  return (
    <RotaProtegida permissao="tabela_precos_materia_prima">
      <TabelaPrecosMateriaPrimaPage />
    </RotaProtegida>
  );
}
