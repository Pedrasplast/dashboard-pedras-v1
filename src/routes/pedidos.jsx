import {
  createFileRoute,
} from "@tanstack/react-router";

import PedidosPage from "@/features/pedidos/PedidosPage";

import RotaProtegida from "@/components/layout/RotaProtegida";

export const Route =
  createFileRoute("/pedidos")({
    ssr: false,

    head: () => ({
      meta: [
        {
          title:
            "Pedidos | Pedrasplast",
        },
        {
          name: "description",
          content:
            "Acompanhamento dos pedidos de venda em aberto integrados ao Omie.",
        },
      ],
    }),

    component: RotaPedidos,
  });

function RotaPedidos() {
  return (
    <RotaProtegida>
      <PedidosPage />
    </RotaProtegida>
  );
}