import { createFileRoute } from "@tanstack/react-router";
import CadastroPage from "@/features/auth/CadastroPage";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta | Painel Pedrasplast" },
      {
        name: "description",
        content: "Crie sua conta de operador para acompanhar a produção das injetoras.",
      },
      { property: "og:title", content: "Criar conta | Painel Pedrasplast" },
      {
        property: "og:description",
        content: "Cadastro de novos usuários do painel de produção Pedrasplast.",
      },
    ],
  }),
  component: CadastroPage,
});
