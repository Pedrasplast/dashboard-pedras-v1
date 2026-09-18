import { useMemo, useState } from "react";
import { FiChevronRight, FiSearch } from "react-icons/fi";

function buscar(texto) {
  return String(texto || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

/** Busca local apenas sobre relatórios aos quais o usuário já tem acesso. */
export default function CatalogoRelatorios({ relatorios, onSelecionar }) {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const categorias = useMemo(
    () => [...new Set(relatorios.map((relatorio) => relatorio.categoria))],
    [relatorios]
  );
  const exibidos = useMemo(() => relatorios.filter((relatorio) => {
    if (categoriaAtiva !== "Todos" && relatorio.categoria !== categoriaAtiva) return false;
    const texto = buscar(`${relatorio.titulo} ${relatorio.descricao} ${relatorio.categoria}`);
    return texto.includes(buscar(busca.trim()));
  }), [relatorios, categoriaAtiva, busca]);
  const grupos = useMemo(() => {
    const mapa = new Map();
    for (const relatorio of exibidos) {
      if (!mapa.has(relatorio.categoria)) mapa.set(relatorio.categoria, []);
      mapa.get(relatorio.categoria).push(relatorio);
    }
    return mapa;
  }, [exibidos]);

  return (
    <div className="relatorios-lista">
      <div className="relatorios-busca">
        <FiSearch aria-hidden="true" />
        <input
          type="search"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          aria-label="Buscar relatórios"
          placeholder="Buscar por nome, categoria ou descrição..."
        />
        <span>{exibidos.length} de {relatorios.length} relatórios</span>
      </div>
      <div className="relatorios-categorias-filtro" aria-label="Filtrar relatórios por categoria">
        {["Todos", ...categorias].map((categoria) => (
          <button
            key={categoria}
            type="button"
            className={categoriaAtiva === categoria ? "ativa" : ""}
            aria-pressed={categoriaAtiva === categoria}
            onClick={() => setCategoriaAtiva(categoria)}
          >
            {categoria} ({categoria === "Todos" ? relatorios.length : relatorios.filter((item) => item.categoria === categoria).length})
          </button>
        ))}
      </div>
      {exibidos.length === 0 && (
        <div className="relatorios-erro relatorios-sem-resultados">
          Nenhum relatório corresponde à busca. Tente outro termo ou escolha outra categoria.
        </div>
      )}
      {[...grupos.entries()].map(([categoria, relatoriosCategoria]) => (
        <section key={categoria} className="relatorios-categoria">
          <div className="relatorios-categoria-header">
            <h2>{categoria}</h2>
            <span>{relatoriosCategoria.length} relatório(s)</span>
          </div>
          <div className="relatorios-grid">
            {relatoriosCategoria.map((relatorio) => {
              const Icone = relatorio.icone;
              return (
                <button
                  key={relatorio.id}
                  type="button"
                  className="relatorio-card"
                  onClick={() => onSelecionar(relatorio.id)}
                >
                  <div className="relatorio-card-icone"><Icone /></div>
                  <div className="relatorio-card-conteudo">
                    <span className="relatorio-card-categoria">{relatorio.categoria}</span>
                    <h3>{relatorio.titulo}</h3>
                    <p>{relatorio.descricao}</p>
                  </div>
                  <FiChevronRight className="relatorio-card-seta" />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
