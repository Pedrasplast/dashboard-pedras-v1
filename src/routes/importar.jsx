import { createFileRoute } from "@tanstack/react-router";
import ImportadorCargaPage from "@/features/importacao/ImportadorCargaPage";
import RotaProtegida from "@/components/layout/RotaProtegida";

export const Route = createFileRoute("/importar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Importar Carga Máquina | Pedrasplast" },
      {
        name: "description",
        content:
          "Importe planilhas de programação das injetoras e valide os registros antes de enviar.",
      },
      { property: "og:title", content: "Importar Carga Máquina | Pedrasplast" },
      {
        property: "og:description",
        content: "Envio em massa de planilhas de carga máquina.",
      },
    ],
  }),
  component: RotaImportar,
});

function RotaImportar() {
  return (
    <RotaProtegida exigirAdmin>
      <ImportadorCargaPage />
    </RotaProtegida>
  );
}
