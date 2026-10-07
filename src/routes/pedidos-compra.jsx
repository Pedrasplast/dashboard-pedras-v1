import {
  createFileRoute,
} from "@tanstack/react-router";

import RotaProtegida
  from "@/components/layout/RotaProtegida";

import PedidosCompraPage
  from "@/features/compras/pedido-compra/PedidosCompraPage";


export const Route =
  createFileRoute(
    "/pedidos-compra",
  )({
    ssr: false,

    head: () => ({
      meta: [
        {
          title:
            "Pedidos de Compra | Pedrasplast",
        },

        {
          name:
            "description",

          content:
            "Acompanhamento dos pedidos de compra, previsões e recebimentos da Pedrasplast.",
        },
      ],
    }),

    component:
      PedidosCompraRoute,
  });


function PedidosCompraRoute() {
  return (
    <RotaProtegida
      permissao="pedidos_compra"
    >
      <PedidosCompraPage />
    </RotaProtegida>
  );
}