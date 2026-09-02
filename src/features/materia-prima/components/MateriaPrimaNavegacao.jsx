import {
  ArrowDownToLine,
  BarChart3,
  Boxes,
  CalendarDays,
  FlaskConical,
  Package,
  ShoppingCart,
  Truck,
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
        "Resumo do estoque, consumo e situação do PP.",
      icone: Boxes,
    },

    {
      id: "produtos",
      titulo: "Produtos PP",
      descricao:
        "Definição dos produtos que utilizam PP.",
      icone: Package,
    },

    {
      id: "fornecedores",
      titulo: "Fornecedores",
      descricao:
        "Cadastro dos fornecedores utilizados na composição.",
      icone: Truck,
    },

    {
      id: "receitas",
      titulo: "Receitas",
      descricao:
        "Composição de PP utilizada por cada produto.",
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
      id: "entradas",
      titulo: "Entradas",
      descricao:
        "Registro dos recebimentos reais de matéria-prima.",
      icone: ArrowDownToLine,
    },

    {
      id: "compras-futuras",
      titulo: "Compras Futuras",
      descricao:
        "Controle das compras com recebimento previsto.",
      icone: ShoppingCart,
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