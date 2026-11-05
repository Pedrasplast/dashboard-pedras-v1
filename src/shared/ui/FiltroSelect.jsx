/**
 * Select de filtro com a opção "Todos" no topo.
 *
 * `opcoes` pode ser [{ id, nome }] ou uma lista de strings.
 * `valorTodos` é o valor enviado quando "Todos" está escolhido.
 */
export default function FiltroSelect({
  rotulo,
  textoTodos,
  valor,
  opcoes,
  onChange,
  className,
  valorTodos = "TODOS",
}) {
  return (
    <label className={className}>
      <span>{rotulo}</span>

      <select value={valor} onChange={(event) => onChange(event.target.value)}>
        <option value={valorTodos}>{textoTodos}</option>

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
