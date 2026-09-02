import {
  ClipboardList,
} from "lucide-react";

export default function MateriaPrimaHeader() {
  return (
    <section className="materia-prima-header">

      <div>

        <span className="materia-prima-eyebrow">
          Controle de PP
        </span>

        <h1>
          Matéria-Prima
        </h1>

        <p>
          Controle de fornecedores,
          receitas, programação,
          entradas, compras futuras e
          projeção do estoque de PP.
        </p>

      </div>


      <div className="materia-prima-header-icone">

        <ClipboardList
          size={28}
          strokeWidth={1.9}
          aria-hidden="true"
        />

      </div>

    </section>
  );
}