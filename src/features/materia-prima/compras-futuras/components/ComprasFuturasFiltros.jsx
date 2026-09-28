import FiltroSelect from "./FiltroSelect";

const CLASSE_CAMPO = "compras-futuras-filtro-campo";

export default function ComprasFuturasFiltros({ filtros, opcoes, onChange }) {
  return (
    <div className="compras-futuras-filtros">
      <FiltroSelect
        className={CLASSE_CAMPO}
        rotulo="Fornecedor"
        textoTodos="Todos os fornecedores"
        valor={filtros.fornecedor}
        opcoes={opcoes.fornecedores}
        onChange={(valor) => onChange("fornecedor", valor)}
      />

      <FiltroSelect
        className={CLASSE_CAMPO}
        rotulo="Matéria-prima"
        textoTodos="Todas as matérias-primas"
        valor={filtros.material}
        opcoes={opcoes.materiais}
        onChange={(valor) => onChange("material", valor)}
      />

      <FiltroSelect
        className={`${CLASSE_CAMPO} compras-futuras-filtro-tipo`}
        rotulo="Tipo"
        textoTodos="Todos os tipos"
        valor={filtros.tipo}
        opcoes={opcoes.tipos}
        onChange={(valor) => onChange("tipo", valor)}
      />
    </div>
  );
}
