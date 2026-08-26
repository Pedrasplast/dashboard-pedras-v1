import { createFileRoute } from "@tanstack/react-router";

import DefinirSenhaPage from "@/features/auth/DefinirSenhaPage";

export const Route = createFileRoute("/definir-senha")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Definir Senha | Pedrasplast",
      },
      {
        name: "description",
        content:
          "Configure sua senha para acessar o sistema Pedrasplast.",
      },
    ],
  }),

  component: DefinirSenhaPage,
});
