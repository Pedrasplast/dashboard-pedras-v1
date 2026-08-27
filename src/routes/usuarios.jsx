import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import GerenciarUsuariosPage from "@/features/usuarios/GerenciarUsuariosPage";

export const Route = createFileRoute("/usuarios")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title:
          "Gerenciar Usuários | Pedrasplast",
      },
      {
        name: "description",
        content:
          "Gerenciamento de usuários e permissões do sistema Pedrasplast.",
      },
    ],
  }),

  component: UsuariosRoute,
});

function UsuariosRoute() {
  return (
    <RotaProtegida exigirAdmin>
      <GerenciarUsuariosPage />
    </RotaProtegida>
  );
}