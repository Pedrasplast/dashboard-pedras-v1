import {
  ClipboardList,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import "./MateriaPrimaHeader.css";

export default function MateriaPrimaHeader() {
  return (
    <PageHeader
      eyebrow="Controle de Matéria-Prima"
      title="Matéria-Prima"
      description="Controle de receitas, programação e projeção dos estoques de matéria-prima."
      icon={ClipboardList}
      className="materia-prima-header"
    />
  );
}
