import { createFileRoute } from "@tanstack/react-router";

import RotaProtegida from "@/components/layout/RotaProtegida";
import ProgramacaoProducaoPage from "@/features/programacao-producao/ProgramacaoProducaoPage";

export const Route = createFileRoute("/programacao-producao")({
  ssr: false,

  head: () => ({
    meta: [
      {
        title: "Programação de Produção | Pedrasplast",
      },
      {
        name: "description",
        content:
          "Programação de produção com pedidos, estoque, ciclos e previsão de atendimento.",
      },
    ],
  }),

  component: ProgramacaoProducaoRoute,
});

function ProgramacaoProducaoRoute() {
  return (
    <RotaProtegida permissao="dashboard">
      <ProgramacaoProducaoPage />
    </RotaProtegida>
  );
}