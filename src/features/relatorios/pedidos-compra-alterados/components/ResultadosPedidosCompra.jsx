import { Fragment } from "react";

import { FiChevronDown, FiChevronUp } from "react-icons/fi";

import Paginacao from "@/components/paginacao/Paginacao";

import { protegerDadosPagamento } from "../formatarHistoricoCompras";
import HistoricoPedidoCompra from "./HistoricoPedidoCompra";
import { formatarDataHora } from "@/shared/lib/datas";

const ESTILO_TEXTO_FORNECEDOR = { fontSize: 12 };

/** Nome do fornecedor, "consultando" ou "não identificado". */
function CelulaFornecedor({ nomeFornecedor, consultando }) {
  return (
    <td
      style={{
        maxWidth: 320,
        minWidth: 180,
        overflowWrap: "anywhere",
      }}
      title={
        nomeFornecedor ? protegerDadosPagamento(nomeFornecedor) : "Nome do fornecedor indisponível"
      }
    >
      {consultando ? (
        <span style={{ ...ESTILO_TEXTO_FORNECEDOR, color: "#64748b" }}>
          Consultando fornecedor...
        </span>
      ) : nomeFornecedor ? (
        <strong style={{ ...ESTILO_TEXTO_FORNECEDOR, color: "#1e293b" }}>
          {protegerDadosPagamento(nomeFornecedor)}
        </strong>
      ) : (
        <span style={{ ...ESTILO_TEXTO_FORNECEDOR, color: "#b45309" }}>
          Fornecedor não identificado
        </span>
      )}
    </td>
  );
}

/** Seção "Alterações encontradas": resumo, tabela com histórico expansível e paginação. */
export default function ResultadosPedidosCompra({
  periodo,
  filtrados,
  pedidosPagina,
  paginaAtual,
  porPagina,
  totalEventos,
  abertos,
  nomesFornecedores,
  consultandoFornecedores,
  onAlternar,
  onMudarPagina,
}) {
  return (
    <section className="relatorio-visualizacao pedidos-alterados-visualizacao">
      <div className="relatorio-visualizacao-header">
        <div>
          <span className="relatorio-visualizacao-eyebrow">Auditoria</span>

          <h3>Alterações encontradas</h3>
        </div>
      </div>

      <div className="relatorio-visualizacao-info">
        <div className="relatorio-visualizacao-info-item">
          <span>Período</span>

          <strong>{periodo}</strong>
        </div>

        <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
          <span>Pedidos</span>

          <strong>{filtrados.length}</strong>
        </div>
      </div>

      <div className="relatorio-visualizacao-tabela-wrapper pedidos-alterados-tabela-wrapper">
        <table className="relatorio-visualizacao-tabela pedidos-alterados-tabela">
          <thead>
            <tr>
              <th>Pedido de compra</th>

              <th>Fornecedor</th>

              <th>Última alteração</th>

              <th>Nº alterações</th>

              <th>O que foi alterado</th>

              <th>Histórico</th>
            </tr>
          </thead>

          <tbody>
            {pedidosPagina.map((pedido) => {
              const codigo = pedido.cod_ped_compra;

              const expandido = abertos.has(codigo);

              const codigoFornecedor = String(pedido.fornecedor_codigo ?? "").trim();

              return (
                <Fragment key={`compra-${codigo}`}>
                  <tr>
                    <td>
                      <strong className="pedidos-alterados-numero">
                        {pedido.numero_pedido || codigo}
                      </strong>
                    </td>

                    <CelulaFornecedor
                      nomeFornecedor={nomesFornecedores[codigoFornecedor]}
                      consultando={consultandoFornecedores}
                    />

                    <td>{formatarDataHora(pedido.ultima_alteracao)}</td>

                    <td>
                      <span className="pedidos-alterados-contador">
                        {pedido.quantidade_alteracoes}
                      </span>
                    </td>

                    <td>
                      <div className="pedidos-alterados-campos">
                        {pedido.campos_alterados.map((campo) => (
                          <span key={campo}>{protegerDadosPagamento(campo)}</span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="pedidos-alterados-ver"
                        onClick={() => onAlternar(codigo)}
                        aria-expanded={expandido}
                      >
                        {expandido ? <FiChevronUp /> : <FiChevronDown />}

                        {expandido ? "Fechar" : "Ver"}
                      </button>
                    </td>
                  </tr>

                  {expandido && (
                    <tr className="pedidos-alterados-historico-linha">
                      <td colSpan={6}>
                        <HistoricoPedidoCompra pedido={pedido} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="relatorio-visualizacao-footer">
        <span>
          {/* Pedaços de texto iguais aos de antes: a quebra muda a largura medida. */}
          Exibindo {(paginaAtual - 1) * porPagina + 1}
          {" a"} {Math.min(paginaAtual * porPagina, filtrados.length)} de {filtrados.length}{" "}
          {"pedido(s) de compra"}
        </span>

        <span>{totalEventos} alteração(ões) no período</span>
      </div>
      {filtrados.length > porPagina && (
        <Paginacao
          paginaAtual={paginaAtual}
          totalItens={filtrados.length}
          itensPorPagina={porPagina}
          onChangePagina={onMudarPagina}
        />
      )}
    </section>
  );
}
