import { createFileRoute } from "@tanstack/react-router";
import HomePage from "@/features/home/HomePage";
import { useAuthContext } from "@/lib/contextoAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Produção | Pedrasplast" },
      {
        name: "description",
        content:
          "Painel de produção Pedrasplast: produtividade por injetora, análise de paradas e eficiência operacional.",
      },
      { property: "og:title", content: "Painel de Produção | Pedrasplast" },
      {
        property: "og:description",
        content: "Visão integrada da produtividade por máquina e monitoramento de eficiência.",
      },
    ],
  }),
  component: PaginaInicial,
});

function PaginaInicial() {
  const { usuario, ehAdmin } = useAuthContext();
  return <HomePage usuario={usuario} ehAdmin={ehAdmin} />;
}
