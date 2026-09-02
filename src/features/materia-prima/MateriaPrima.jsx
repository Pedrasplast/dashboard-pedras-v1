import {
  useMemo,
  useState,
} from "react";

import MateriaPrimaHeader from "./components/MateriaPrimaHeader";
import MateriaPrimaNavegacao, {
  MATERIA_PRIMA_SECOES,
} from "./components/MateriaPrimaNavegacao";

import ComprasFuturas from "./compras-futuras/ComprasFuturas";
import Entradas from "./entradas/Entradas";
import Fornecedores from "./fornecedores/Fornecedores";
import ProdutosPP from "./produtos/ProdutosPP";
import Programacao from "./programacao/Programacao";
import Projecao from "./projecao/Projecao";
import Receitas from "./receitas/Receitas";
import VisaoGeral from "./visao-geral/VisaoGeral";

import "./MateriaPrima.css";


/* =========================================================
   MATÉRIA-PRIMA
========================================================= */

export default function MateriaPrima() {
  const [
    secaoAtivaId,
    setSecaoAtivaId,
  ] = useState(
    "visao-geral",
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
     CONTEÚDO DA SEÇÃO
  ======================================================= */

  function renderizarSecao() {
    switch (
      secaoAtivaId
    ) {
      case "visao-geral":
        return (
          <VisaoGeral />
        );


      case "produtos":
        return (
          <ProdutosPP />
        );


      case "fornecedores":
        return (
          <Fornecedores />
        );


      case "receitas":
        return (
          <Receitas />
        );


      case "programacao":
        return (
          <Programacao />
        );


      case "entradas":
        return (
          <Entradas />
        );


      case "compras-futuras":
        return (
          <ComprasFuturas />
        );


      case "projecao":
        return (
          <Projecao />
        );


      default:
        return (
          <div className="materia-prima-conteudo-vazio">

            <div className="materia-prima-conteudo-vazio-icone">

              <secaoAtiva.icone
                size={32}
                strokeWidth={1.7}
                aria-hidden="true"
              />

            </div>


            <strong>
              {secaoAtiva.titulo}
            </strong>


            <p>
              Esta área será desenvolvida
              na etapa correspondente do
              módulo de Matéria-Prima.
            </p>

          </div>
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