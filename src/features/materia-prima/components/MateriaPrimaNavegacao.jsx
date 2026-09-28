import {
  BarChart3,
  Boxes,
  CalendarDays,
  FlaskConical,
} from "lucide-react";

import "./MateriaPrimaNavegacao.css";


/* =========================================================
   SEÇÕES DO MÓDULO
========================================================= */

export const MATERIA_PRIMA_SECOES =
  Object.freeze([
    {
      id: "visao-geral",
      titulo: "Visão Geral",
      descricao:
        "Resumo do estoque, consumo e situação da matéria-prima.",
      icone: Boxes,
    },

    {
      id: "receitas",
      titulo: "Receitas",
      descricao:
        "Composição de matéria-prima utilizada por cada produto.",
      icone: FlaskConical,
    },

    {
      id: "programacao",
      titulo: "Programação",
      descricao:
        "Produtos programados e consumo diário previsto.",
      icone: CalendarDays,
    },

    {
      id: "projecao",
      titulo: "Projeção",
      descricao:
        "Simulação diária do estoque e previsão de ruptura.",
      icone: BarChart3,
    },
  ]);


/* =========================================================
   COMPONENTE
========================================================= */

export default function MateriaPrimaNavegacao({
  secaoAtiva,
  onAlterarSecao,
}) {
  return (
    <section className="materia-prima-navegacao">

      {MATERIA_PRIMA_SECOES.map(
        (secao) => {
          const Icone =
            secao.icone;

          const ativo =
            secao.id ===
            secaoAtiva;


          return (
            <button
              key={secao.id}
              type="button"
              className={
                ativo
                  ? "materia-prima-nav-item ativo"
                  : "materia-prima-nav-item"
              }
              onClick={() =>
                onAlterarSecao(
                  secao.id,
                )
              }
            >

              <span className="materia-prima-nav-icone">

                <Icone
                  size={19}
                  strokeWidth={2}
                  aria-hidden="true"
                />

              </span>


              <span className="materia-prima-nav-texto">

                <strong>
                  {secao.titulo}
                </strong>

                <small>
                  {secao.descricao}
                </small>

              </span>

            </button>
          );
        },
      )}

    </section>
  );
}
