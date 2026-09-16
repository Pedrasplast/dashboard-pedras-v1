import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import CadastrosPage from "@/features/cadastros/CadastrosPage";

export const Route = createFileRoute("/cadastro-produto")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Cadastro | Pedrasplast",
      },
      {
        name: "description",
        content:
          "Consulta centralizada de produtos, parâmetros de produção e fornecedores.",
      },
    ],
  }),

  component: CadastroProdutoRoute,
});

function CadastroProdutoRoute() {
  return (
    <RotaProtegida permissao="cadastros">
      <CadastrosPage />
    </RotaProtegida>
  );
}