import { createFileRoute } from "@tanstack/react-router";
import TelaRelatoriosPage from "@/features/relatorios/TelaRelatoriosPage";
import RotaProtegida from "@/components/layout/RotaProtegida";

export const Route = createFileRoute("/relatorios")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Relatórios de Produção | Pedrasplast" },
      {
        name: "description",
        content:
          "Gere relatórios de produção filtrados por período, injetora e produto em PDF ou Excel.",
      },
      { property: "og:title", content: "Relatórios de Produção | Pedrasplast" },
      {
        property: "og:description",
        content: "Exportação de relatórios detalhados de carga máquina.",
      },
    ],
  }),
  component: RotaRelatorios,
});

function RotaRelatorios() {
  return (
    <RotaProtegida>
      <TelaRelatoriosPage />
    </RotaProtegida>
  );
}
