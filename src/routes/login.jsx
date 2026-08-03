import { createFileRoute } from "@tanstack/react-router";
import LoginPage from "@/features/auth/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar | Painel Pedrasplast" },
      {
        name: "description",
        content: "Acesse o painel de produção Pedrasplast com seu e-mail corporativo.",
      },
      { property: "og:title", content: "Entrar | Painel Pedrasplast" },
      {
        property: "og:description",
        content: "Acesso restrito ao painel de produção Pedrasplast.",
      },
    ],
  }),
  component: LoginPage,
});
