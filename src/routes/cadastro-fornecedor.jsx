import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import CadastrosPage from "@/features/cadastros/CadastrosPage";

export const Route = createFileRoute("/cadastro-fornecedor")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Cadastro de fornecedor | Pedrasplast",
      },
      {
        name: "description",
        content: "Cadastro de fornecedores e parâmetros de abastecimento.",
      },
    ],
  }),

  component: CadastroFornecedorRoute,
});

function CadastroFornecedorRoute() {
  return (
    <RotaProtegida permissao="cadastros">
      <CadastrosPage key="fornecedores" tipo="fornecedores" />
    </RotaProtegida>
  );
}
