import {
  createFileRoute,
} from "@tanstack/react-router";

import DefinirSenhaPage
  from "@/features/auth/DefinirSenhaPage";

export const Route =
  createFileRoute(
    "/definir-senha",
  )({
    component:
      DefinirSenhaPage,
  });
