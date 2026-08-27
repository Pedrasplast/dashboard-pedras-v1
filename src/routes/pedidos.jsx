import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import PedidosPage from "@/features/pedidos/PedidosPage";

export const Route = createFileRoute("/pedidos")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Pedidos | Pedrasplast",
      },
      {
        name: "description",
        content:
          "Acompanhamento dos pedidos comerciais da Pedrasplast.",
      },
    ],
  }),

  component: PedidosRoute,
});

function PedidosRoute() {
  return (
    <RotaProtegida permissao="pedidos">
      <PedidosPage />
    </RotaProtegida>
  );
}