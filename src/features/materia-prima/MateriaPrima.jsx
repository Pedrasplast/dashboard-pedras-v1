import {
  useMemo,
  useState,
} from "react";

import MateriaPrimaHeader from "./components/MateriaPrimaHeader";

import MateriaPrimaNavegacao, {
  MATERIA_PRIMA_SECOES,
} from "./components/MateriaPrimaNavegacao";

import Programacao from "./programacao/Programacao";
import ProjecaoDiaria from "./projecao/ProjecaoDiaria";
import SaldosIniciais from "./projecao/saldo-inicial/SaldosIniciais";

import "./MateriaPrima.css";


/* =========================================================
   MATÉRIA-PRIMA
========================================================= */

export default function MateriaPrima() {
  const [
    secaoAtivaId,
    setSecaoAtivaId,
  ] = useState(
    "programacao",
  );


  /* =======================================================
     SEÇÃO ATIVA
  ======================================================= */

  const secaoAtiva =
    useMemo(
      () =>
        MATERIA_PRIMA_SECOES.find(
          (
            secao,
          ) =>
            secao.id ===
            secaoAtivaId,
        ) ||
        MATERIA_PRIMA_SECOES[0],
      [
        secaoAtivaId,
      ],
    );


  /* =======================================================
     CONTEÚDO
  ======================================================= */

  function renderizarSecao() {
    switch (
      secaoAtivaId
    ) {
      case "programacao":
        return (
          <Programacao />
        );


      case "saldo-base":
        return (
          <SaldosIniciais />
        );


      case "projecao":
        return (
          <ProjecaoDiaria />
        );


      default:
        return (
          <Programacao />
        );
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="materia-prima-page">

      <div className="materia-prima-container">

        <MateriaPrimaHeader />


        <MateriaPrimaNavegacao
          secaoAtiva={
            secaoAtivaId
          }
          onAlterarSecao={
            setSecaoAtivaId
          }
        />


        <section className="materia-prima-conteudo">

          <div className="materia-prima-conteudo-header">

            <div className="materia-prima-conteudo-icone">

              <secaoAtiva.icone
                size={23}
                strokeWidth={2}
                aria-hidden="true"
              />

            </div>


            <div>

              <span>
                Matéria-Prima
              </span>


              <h2>
                {secaoAtiva.titulo}
              </h2>


              <p>
                {secaoAtiva.descricao}
              </p>

            </div>

          </div>


          {renderizarSecao()}

        </section>

      </div>

    </main>
  );
}