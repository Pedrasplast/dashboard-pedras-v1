import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import "./Paginacao.css";


function criarPaginas(
  paginaAtual,
  totalPaginas,
) {
  /*
   * Poucas páginas:
   * mostra todas.
   */
  if (totalPaginas <= 7) {
    return Array.from(
      {
        length: totalPaginas,
      },
      (_, indice) =>
        indice + 1,
    );
  }


  /*
   * Muitas páginas:
   *
   * 1 2 3 ... 10
   * 1 ... 4 5 6 ... 10
   * 1 ... 8 9 10
   */

  if (paginaAtual <= 4) {
    return [
      1,
      2,
      3,
      4,
      5,
      "...",
      totalPaginas,
    ];
  }


  if (
    paginaAtual >=
    totalPaginas - 3
  ) {
    return [
      1,
      "...",
      totalPaginas - 4,
      totalPaginas - 3,
      totalPaginas - 2,
      totalPaginas - 1,
      totalPaginas,
    ];
  }


  return [
    1,
    "...",
    paginaAtual - 1,
    paginaAtual,
    paginaAtual + 1,
    "...",
    totalPaginas,
  ];
}


export default function Paginacao({
  paginaAtual = 1,
  totalItens = 0,
  itensPorPagina = 10,
  onChangePagina,
}) {
  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        totalItens /
          itensPorPagina,
      ),
    );


  /*
   * Se não há itens,
   * não mostramos paginação.
   */
  if (
    totalItens <= 0
  ) {
    return null;
  }


  const paginas =
    criarPaginas(
      paginaAtual,
      totalPaginas,
    );


  const primeiroItem =
    (
      paginaAtual - 1
    ) *
      itensPorPagina +
    1;


  const ultimoItem =
    Math.min(
      paginaAtual *
        itensPorPagina,
      totalItens,
    );


  function irParaPagina(
    pagina,
  ) {
    if (
      typeof pagina !==
      "number"
    ) {
      return;
    }


    if (
      pagina < 1 ||
      pagina >
        totalPaginas ||
      pagina ===
        paginaAtual
    ) {
      return;
    }


    onChangePagina?.(
      pagina,
    );
  }


  return (
    <div className="paginacao">

      {/* ===============================================
          INFORMACAO
      =============================================== */}

      <div className="paginacao-info">

        Mostrando{" "}

        <strong>
          {primeiroItem}
        </strong>

        {" "}a{" "}

        <strong>
          {ultimoItem}
        </strong>

        {" "}de{" "}

        <strong>
          {totalItens}
        </strong>

        {" "}registros

      </div>


      {/* ===============================================
          CONTROLES
      =============================================== */}

      <div className="paginacao-controles">

        {/* ANTERIOR */}

        <button
          type="button"
          className="paginacao-botao paginacao-navegacao"
          onClick={() =>
            irParaPagina(
              paginaAtual - 1,
            )
          }
          disabled={
            paginaAtual <= 1
          }
          aria-label="Página anterior"
          title="Página anterior"
        >

          <ChevronLeft
            size={17}
          />

          <span>
            Anterior
          </span>

        </button>


        {/* PAGINAS */}

        <div className="paginacao-paginas">

          {paginas.map(
            (
              pagina,
              indice,
            ) => {

              if (
                pagina ===
                "..."
              ) {
                return (
                  <span
                    key={`reticencias-${indice}`}
                    className="paginacao-reticencias"
                  >
                    ...
                  </span>
                );
              }


              const ativa =
                pagina ===
                paginaAtual;


              return (
                <button
                  key={
                    pagina
                  }
                  type="button"
                  className={
                    `paginacao-botao paginacao-numero ${
                      ativa
                        ? "ativa"
                        : ""
                    }`
                  }
                  onClick={() =>
                    irParaPagina(
                      pagina,
                    )
                  }
                  aria-current={
                    ativa
                      ? "page"
                      : undefined
                  }
                  title={
                    `Página ${pagina}`
                  }
                >
                  {pagina}
                </button>
              );
            },
          )}

        </div>


        {/* PROXIMA */}

        <button
          type="button"
          className="paginacao-botao paginacao-navegacao"
          onClick={() =>
            irParaPagina(
              paginaAtual + 1,
            )
          }
          disabled={
            paginaAtual >=
            totalPaginas
          }
          aria-label="Próxima página"
          title="Próxima página"
        >

          <span>
            Próxima
          </span>

          <ChevronRight
            size={17}
          />

        </button>

      </div>

    </div>
  );
}