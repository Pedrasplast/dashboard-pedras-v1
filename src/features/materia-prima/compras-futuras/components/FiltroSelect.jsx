import { TODOS } from "../utils/comprasFuturasUtils";

/**
 * Select com a opção "Todos" + lista de opções.
 * `opcoes` pode ser [{ id, nome }] ou uma lista de strings.
 */
export default function FiltroSelect({ rotulo, textoTodos, valor, opcoes, onChange, className }) {
  return (
    <label className={className}>
      <span>{rotulo}</span>

      <select value={valor} onChange={(event) => onChange(event.target.value)}>
        <option value={TODOS}>{textoTodos}</option>

        {opcoes.map((opcao) => {
          const id = typeof opcao === "string" ? opcao : opcao.id;
          const nome = typeof opcao === "string" ? opcao : opcao.nome;

          return (
            <option key={id} value={id}>
              {nome}
            </option>
          );
        })}
      </select>
    </label>
  );
}
