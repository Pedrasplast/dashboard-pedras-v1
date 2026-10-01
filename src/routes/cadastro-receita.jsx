import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import CadastroReceitasPage from "@/features/cadastros/receitas/CadastroReceitasPage";

export const Route = createFileRoute("/cadastro-receita")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Cadastro de receita | Pedrasplast",
      },
      {
        name: "description",
        content:
          "Cadastro independente de receitas de matéria-prima utilizadas na programação.",
      },
    ],
  }),

  component: CadastroReceitaRoute,
});

function CadastroReceitaRoute() {
  return (
    <RotaProtegida permissao="cadastro_receita">
      <CadastroReceitasPage />
    </RotaProtegida>
  );
}