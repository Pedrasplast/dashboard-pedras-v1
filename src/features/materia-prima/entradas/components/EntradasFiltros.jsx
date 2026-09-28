import FiltroSelect from "./FiltroSelect";

export default function EntradasFiltros({ filtros, opcoes, onChange }) {
  return (
    <div className="entradas-pp-filtros">
      <FiltroSelect
        rotulo="Fornecedor"
        textoTodos="Todos os fornecedores"
        valor={filtros.fornecedor}
        opcoes={opcoes.fornecedores}
        onChange={(valor) => onChange("fornecedor", valor)}
      />

      <FiltroSelect
        rotulo="Matéria-prima"
        textoTodos="Todas as matérias-primas"
        valor={filtros.material}
        opcoes={opcoes.materiais}
        onChange={(valor) => onChange("material", valor)}
      />

      <FiltroSelect
        className="entradas-pp-filtro-tipo"
        rotulo="Tipo"
        textoTodos="Todos os tipos"
        valor={filtros.tipo}
        opcoes={opcoes.tipos}
        onChange={(valor) => onChange("tipo", valor)}
      />
    </div>
  );
}
