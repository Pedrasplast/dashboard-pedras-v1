import { createFileRoute } from "@tanstack/react-router";
import GerenciarUsuariosPage from "@/features/usuarios/GerenciarUsuariosPage";
import RotaProtegida from "@/components/layout/RotaProtegida";

export const Route = createFileRoute("/usuarios")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Gerenciar Usuários | Pedrasplast" },
      {
        name: "description",
        content: "Controle permissões, níveis de acesso e perfis dos colaboradores do painel.",
      },
      { property: "og:title", content: "Gerenciar Usuários | Pedrasplast" },
      {
        property: "og:description",
        content: "Administração de perfis e permissões do painel de produção.",
      },
    ],
  }),
  component: RotaUsuarios,
});

function RotaUsuarios() {
  return (
    <RotaProtegida exigirAdmin>
      <GerenciarUsuariosPage />
    </RotaProtegida>
  );
}
