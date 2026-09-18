import { useMemo, useState } from "react";

import {
  FiActivity,
  FiAlertTriangle,
  FiChevronRight,
  FiDollarSign,
  FiFolder,
  FiGrid,
  FiLayers,
  FiShoppingBag,
  FiShoppingCart,
  FiSliders,
} from "react-icons/fi";

/* =====================================================
   ÍCONES DAS CATEGORIAS
===================================================== */

const ICONES_CATEGORIAS = {
  Todos: FiGrid,
  Produção: FiActivity,
  Paradas: FiAlertTriangle,
  Pedidos: FiShoppingCart,
  Compras: FiShoppingBag,
  Financeiro: FiDollarSign,
  "Matéria-Prima": FiLayers,
};

/* =====================================================
   CATÁLOGO DE RELATÓRIOS

   VERSÃO 1:
   - Painel branco e seleção azul.
   - Sem barra de pesquisa.
   - Navegação somente por categorias.
   - Utiliza os relatórios autorizados recebidos
     do componente principal.
===================================================== */

export default function CatalogoRelatorios({ relatorios, onSelecionar }) {
  /* =====================================================
     CATEGORIA ATIVA
  ===================================================== */

  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");

  /* =====================================================
     CATEGORIAS DISPONÍVEIS
  ===================================================== */

  const categorias = useMemo(() => {
    return [...new Set(relatorios.map((relatorio) => relatorio.categoria))];
  }, [relatorios]);

  /* =====================================================
     CONTAGEM POR CATEGORIA
  ===================================================== */

  const contagens = useMemo(() => {
    const totais = {
      Todos: relatorios.length,
    };

    for (const relatorio of relatorios) {
      totais[relatorio.categoria] = (totais[relatorio.categoria] || 0) + 1;
    }

    return totais;
  }, [relatorios]);

  /* =====================================================
     FILTRAR RELATÓRIOS POR CATEGORIA
  ===================================================== */

  const exibidos = useMemo(() => {
    if (categoriaAtiva === "Todos") {
      return relatorios;
    }

    return relatorios.filter((relatorio) => relatorio.categoria === categoriaAtiva);
  }, [relatorios, categoriaAtiva]);

  /* =====================================================
     AGRUPAR RELATÓRIOS POR CATEGORIA
  ===================================================== */

  const grupos = useMemo(() => {
    const mapa = new Map();

    for (const relatorio of exibidos) {
      if (!mapa.has(relatorio.categoria)) {
        mapa.set(relatorio.categoria, []);
      }

      mapa.get(relatorio.categoria).push(relatorio);
    }

    return mapa;
  }, [exibidos]);

  /* =====================================================
     RENDERIZAÇÃO
  ===================================================== */

  return (
    <div className="relatorios-lista">
      {/* ================================================
          SELETOR DE CATEGORIAS — VERSÃO 1
      ================================================ */}

      <section
        className="relatorios-filtros-catalogo"
        aria-label="Seleção de categorias dos relatórios"
      >
        {/* CABEÇALHO */}

        <div className="relatorios-filtros-catalogo-topo">
          <div className="relatorios-filtros-catalogo-titulo">
            <span className="relatorios-filtros-catalogo-icone">
              <FiSliders aria-hidden="true" />
            </span>

            <div>
              <strong className="categoria">Categoria</strong>

              <p>Escolha uma categoria para encontrar seus relatórios.</p>
            </div>
          </div>

          {/* TOTAL EXIBIDO */}
        </div>

        {/* ============================================
            BOTÕES DAS CATEGORIAS
        ============================================ */}

        <div
          className="relatorios-categorias-filtro"
          role="group"
          aria-label="Filtrar relatórios por categoria"
        >
          {["Todos", ...categorias].map((categoria) => {
            const Icone = ICONES_CATEGORIAS[categoria] || FiFolder;

            const ativa = categoriaAtiva === categoria;

            return (
              <button
                key={categoria}
                type="button"
                className={ativa ? "ativa" : ""}
                aria-pressed={ativa}
                onClick={() => setCategoriaAtiva(categoria)}
              >
                {/* ÍCONE */}

                <Icone className="relatorios-filtro-icone" aria-hidden="true" />

                {/* NOME */}

                <span className="relatorios-filtro-nome">{categoria}</span>

                {/* CONTAGEM */}

                <span className="relatorios-filtro-contagem">{contagens[categoria] || 0}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================================================
          SEM RESULTADOS
      ================================================ */}

      {exibidos.length === 0 && (
        <div className="relatorios-erro relatorios-sem-resultados">
          Nenhum relatório disponível nesta categoria.
        </div>
      )}

      {/* ================================================
          LISTA DE RELATÓRIOS
      ================================================ */}

      {[...grupos.entries()].map(([categoria, relatoriosCategoria]) => (
        <section key={categoria} className="relatorios-categoria">
          {/* CABEÇALHO DA CATEGORIA */}

          <div className="relatorios-categoria-header">
            <h2>{categoria}</h2>

            <span>{relatoriosCategoria.length} relatório(s)</span>
          </div>

          {/* CARDS DOS RELATÓRIOS */}

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
                  {/* ÍCONE */}

                  <div className="relatorio-card-icone">
                    <Icone />
                  </div>

                  {/* INFORMAÇÕES */}

                  <div className="relatorio-card-conteudo">
                    <span className="relatorio-card-categoria">{relatorio.categoria}</span>

                    <h3>{relatorio.titulo}</h3>

                    <p>{relatorio.descricao}</p>
                  </div>

                  {/* SETA */}

                  <FiChevronRight className="relatorio-card-seta" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
