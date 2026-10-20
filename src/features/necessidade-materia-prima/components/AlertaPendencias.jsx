import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import Paginacao from "@/components/paginacao/Paginacao";
import { formatarQuantidade } from "../utils/formatadoresNecessidade";
import { agruparPendencias, descricaoPendencia } from "../utils/seletoresNecessidade";
const PENDENCIAS_POR_PAGINA = 8;

function AlertaPendencias({ pedidos }) {
  const [expandido, setExpandido] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const pendencias = useMemo(
    () => agruparPendencias(pedidos),
    [pedidos]
  );

  const totalItens = pendencias.reduce(
    (total, item) => total + item.itens,
    0
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      pendencias.length / PENDENCIAS_POR_PAGINA
    )
  );

  const paginaValida = Math.min(
    Math.max(1, paginaAtual),
    totalPaginas
  );

  const inicio =
    (paginaValida - 1) * PENDENCIAS_POR_PAGINA;

  const pendenciasPagina = pendencias.slice(
    inicio,
    inicio + PENDENCIAS_POR_PAGINA
  );

  if (pendencias.length === 0) {
    return null;
  }

  return (
    <section
      className="necessidade-pendencias"
      aria-label="Produtos com pendências"
    >
      <div className="necessidade-pendencias-cabecalho">
        <AlertTriangle
          size={18}
          aria-hidden="true"
        />

        <div className="necessidade-pendencias-texto">
          <strong>
            Produtos com parâmetros pendentes
          </strong>

          <p>
            {pendencias.length} código(s) e{" "}
            {totalItens} item(ns) dos pedidos
            em aberto precisam de regularização.
            O consumo calculado ainda é parcial.
          </p>
        </div>

        <button
          type="button"
          className="necessidade-pendencias-toggle"
          aria-expanded={expandido}
          onClick={() =>
            setExpandido((anterior) => !anterior)
          }
        >
          {expandido ? (
            <>
              <ChevronUp size={16} />
              Ocultar pendências
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Ver pendências
            </>
          )}
        </button>
      </div>

      {expandido && (
        <div className="necessidade-pendencias-conteudo">
          <div className="necessidade-tabela-container">
            <table className="necessidade-tabela necessidade-tabela-pendencias">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Produto</th>
                  <th>Quantidade nos pedidos</th>
                  <th>Itens afetados</th>
                  <th>Pendência</th>
                </tr>
              </thead>

              <tbody>
                {pendenciasPagina.map((item) => (
                  <tr key={item.codigo}>
                    <td>
                      <strong>{item.codigo}</strong>
                    </td>

                    <td>{item.produto}</td>

                    <td className="necessidade-coluna-numero">
                      {formatarQuantidade(
                        item.quantidade
                      )}
                    </td>

                    <td className="necessidade-coluna-numero">
                      {item.itens}
                    </td>

                    <td>
                      {descricaoPendencia(
                        item.situacao
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacao
            paginaAtual={paginaValida}
            totalItens={pendencias.length}
            itensPorPagina={PENDENCIAS_POR_PAGINA}
            onChangePagina={setPaginaAtual}
          />
        </div>
      )}
    </section>
  );
}


export default AlertaPendencias;
