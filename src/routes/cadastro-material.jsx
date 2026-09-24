import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import CadastrosPage from "@/features/cadastros/CadastrosPage";

export const Route = createFileRoute("/cadastro-material")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Cadastro de material | Pedrasplast",
      },
      {
        name: "description",
        content: "Cadastro de materiais utilizados nas compras de matéria-prima.",
      },
    ],
  }),

  component: CadastroMaterialRoute,
});

function CadastroMaterialRoute() {
  return (
    <RotaProtegida permissao="cadastros">
      <CadastrosPage key="materiais" tipo="materiais" />
    </RotaProtegida>
  );
}
