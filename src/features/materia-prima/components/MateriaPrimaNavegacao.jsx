import {
  BarChart3,
  CalendarDays,
  Scale,
} from "lucide-react";

import "./MateriaPrimaNavegacao.css";


/* =========================================================
   SEÇÕES
========================================================= */

export const MATERIA_PRIMA_SECOES =
  Object.freeze([
    {
      id: "saldo-base",
      titulo: "Saldo-base",
      descricao:
        "Inventário físico por material e fornecedor.",
      icone: Scale,
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
        "Saldo diário projetado e previsão de ruptura.",
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
    <nav
      className="materia-prima-navegacao"
      aria-label="Navegação de matéria-prima"
    >

      <div className="materia-prima-navegacao-tabs">

        {MATERIA_PRIMA_SECOES.map(
          (
            secao,
          ) => {
            const Icone =
              secao.icone;

            const ativo =
              secao.id ===
              secaoAtiva;


            return (
              <button
                key={
                  secao.id
                }
                type="button"
                className={
                  ativo
                    ? "materia-prima-nav-item ativo"
                    : "materia-prima-nav-item"
                }
                onClick={
                  () =>
                    onAlterarSecao(
                      secao.id,
                    )
                }
                aria-selected={
                  ativo
                }
              >

                <Icone
                  className="materia-prima-nav-icone"
                  size={17}
                  strokeWidth={2}
                  aria-hidden="true"
                />


                <span>
                  {secao.titulo}
                </span>


                {ativo && (
                  <i
                    className="materia-prima-nav-indicador"
                    aria-hidden="true"
                  />
                )}

              </button>
            );
          },
        )}

      </div>

    </nav>
  );
}