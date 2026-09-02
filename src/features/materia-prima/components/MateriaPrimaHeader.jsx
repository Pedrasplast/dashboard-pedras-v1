import {
  ClipboardList,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import "./MateriaPrimaHeader.css";

export default function MateriaPrimaHeader() {
  return (
    <PageHeader
      eyebrow="Controle de PP"
      title="Matéria-Prima"
      description="Controle de fornecedores, receitas, programação, entradas, compras futuras e projeção do estoque de PP."
      icon={ClipboardList}
      className="materia-prima-header"
    />
  );
}
