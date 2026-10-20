import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const ITENS_POR_PAGINA = 8;

/* =========================================================
   HELPERS
========================================================= */

function numero(valor) {
  const convertido = Number(valor ?? 0);

  return Number.isFinite(convertido)
    ? convertido
    : 0;
}

function formatarNumero(valor) {
  return numero(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

function formatarKgPadrao(valor) {
  return numero(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

function obterTotalPaginas(totalItens) {
  return Math.max(
    1,
    Math.ceil(totalItens / ITENS_POR_PAGINA)
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function NecessidadeDetalhamentoProdutos({
  materialSelecionado = null,
  itens = [],
  percentualCompra = 100,
  formatarKg = formatarKgPadrao,
}) {
  const [paginaAtual, setPaginaAtual] =
    useState(1);

  /* =====================================================
     RESETAR PÁGINA AO TROCAR MATERIAL
  ===================================================== */

  useEffect(() => {
    setPaginaAtual(1);
  }, [materialSelecionado?.id]);

  /* =====================================================
     ORDENAÇÃO
  ===================================================== */

  const itensOrdenados = useMemo(() => {
    return [...(itens ?? [])].sort((a, b) => {
      return numero(b.consumoKg) - numero(a.consumoKg);
    });
  }, [itens]);

  /* =====================================================
     TOTAIS GERAIS
  ===================================================== */

  const totais = useMemo(() => {
    return itensOrdenados.reduce(
      (acumulado, item) => {
        acumulado.quantidadeTotal += numero(
          item.quantidadeTotal
        );

        acumulado.consumoKg += numero(
          item.consumoKg
        );

        return acumulado;
      },
      {
        totalProdutos: itensOrdenados.length,
        quantidadeTotal: 0,
        consumoKg: 0,
      }
    );
  }, [itensOrdenados]);

  /* =====================================================
     PAGINAÇÃO
  ===================================================== */

  const totalPaginas = obterTotalPaginas(
    itensOrdenados.length
  );

  const paginaCorrigida = Math.min(
    paginaAtual,
    totalPaginas
  );

  const indiceInicial =
    (paginaCorrigida - 1) *
    ITENS_POR_PAGINA;

  const indiceFinal =
    indiceInicial + ITENS_POR_PAGINA;

  const itensPagina = itensOrdenados.slice(
    indiceInicial,
    indiceFinal
  );

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  /* =====================================================
     RENDER
  ===================================================== */

  if (!materialSelecionado) {
    return null;
  }

  return (
    <section className="necessidade-detalhamento">
      <div className="necessidade-detalhamento-cabecalho">
        <div>
          <h3>
            Produtos que utilizam{" "}
            {materialSelecionado.material}
          </h3>

          <p>
            Produtos dos pedidos em aberto,
            agrupados pelo código e vinculados
            ao Cadastro de Produto.
          </p>
        </div>

        <div className="necessidade-detalhamento-contador">
          {totais.totalProdutos} produto(s)
        </div>
      </div>

      <div className="necessidade-tabela-wrapper">
        <table className="necessidade-tabela necessidade-tabela-produtos">
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Quantidade total</th>
              <th>KG/UN</th>
              <th>Consumo (kg)</th>
              <th>% Compra</th>
            </tr>
          </thead>

          <tbody>
            {itensPagina.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="necessidade-detalhamento-vazio"
                >
                  Nenhum produto encontrado para
                  este material.
                </td>
              </tr>
            ) : (
              itensPagina.map((item) => (
                <tr key={item.chave}>
                  <td>
                    <strong>{item.codigoProduto}</strong>
                  </td>

                  <td>{item.produto}</td>

                  <td className="alinha-direita">
                    {formatarNumero(
                      item.quantidadeTotal
                    )}
                  </td>

                  <td className="alinha-direita">
                    {formatarKg(item.kgUn)}
                  </td>

                  <td className="alinha-direita">
                    <strong>
                      {formatarKg(item.consumoKg)}
                    </strong>
                  </td>

                  <td className="alinha-direita">
                    {formatarNumero(
                      item.percentualCompra ??
                        percentualCompra
                    )}
                    %
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* =============================================
          PAGINAÇÃO
      ============================================= */}

      {totalPaginas > 1 && (
        <div className="necessidade-paginacao">
          <button
            type="button"
            className="necessidade-paginacao-botao"
            onClick={() =>
              setPaginaAtual((pagina) =>
                Math.max(1, pagina - 1)
              )
            }
            disabled={paginaCorrigida <= 1}
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          <div className="necessidade-paginacao-info">
            Página{" "}
            <strong>{paginaCorrigida}</strong> de{" "}
            <strong>{totalPaginas}</strong>
          </div>

          <button
            type="button"
            className="necessidade-paginacao-botao"
            onClick={() =>
              setPaginaAtual((pagina) =>
                Math.min(
                  totalPaginas,
                  pagina + 1
                )
              )
            }
            disabled={
              paginaCorrigida >= totalPaginas
            }
          >
            Próxima
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* =============================================
          TOTAL FORA DA PAGINAÇÃO
      ============================================= */}

      <div className="necessidade-total-geral">
        <div className="necessidade-total-geral-linha">
          <div className="necessidade-total-geral-titulo">
            Total — {materialSelecionado.material}
          </div>

          <div className="necessidade-total-geral-coluna">
            <span>Produtos</span>
            <strong>
              {formatarNumero(
                totais.totalProdutos
              )}
            </strong>
          </div>

          <div className="necessidade-total-geral-coluna">
            <span>Quantidade total</span>
            <strong>
              {formatarNumero(
                totais.quantidadeTotal
              )}
            </strong>
          </div>

          <div className="necessidade-total-geral-coluna">
            <span>Consumo (kg)</span>
            <strong>
              {formatarKg(
                totais.consumoKg
              )}
            </strong>
          </div>

          <div className="necessidade-total-geral-coluna">
            <span>% Compra</span>
            <strong>
              {formatarNumero(
                percentualCompra
              )}
              %
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}