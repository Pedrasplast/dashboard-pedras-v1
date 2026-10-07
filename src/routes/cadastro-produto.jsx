import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import CadastrosPage from "@/features/cadastros/CadastrosPage";

export const Route = createFileRoute("/cadastro-produto")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Cadastro de produto | Pedrasplast",
      },
      {
        name: "description",
        content: "Cadastro de produtos e parâmetros de produção.",
      },
    ],
  }),

  component: CadastroProdutoRoute,
});

function CadastroProdutoRoute() {
  return (
    <RotaProtegida permissao="cadastro_produto">
      <CadastrosPage key="produtos" tipo="produtos" />
    </RotaProtegida>
  );
}