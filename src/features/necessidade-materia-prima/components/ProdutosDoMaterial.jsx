import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import Paginacao from "@/components/paginacao/Paginacao";

import {
  formatarQuantidade,
  formatarConsumo,
  formatarMoeda,
} from "../utils/formatadoresNecessidade";

const PRODUTOS_POR_PAGINA = 8;

function estoqueNegativo(valor) {
  return (
    valor !== null &&
    valor !== undefined &&
    valor !== "" &&
    Number.isFinite(Number(valor)) &&
    Number(valor) < 0
  );
}

function ProdutosDoMaterial({ material, produtos }) {
  const [paginaAtual, setPaginaAtual] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(produtos.length / PRODUTOS_POR_PAGINA));

  const paginaValida = Math.min(Math.max(1, paginaAtual), totalPaginas);

  const inicio = (paginaValida - 1) * PRODUTOS_POR_PAGINA;

  const produtosPagina = produtos.slice(inicio, inicio + PRODUTOS_POR_PAGINA);

  const consumoDetalhado = produtos.reduce((total, produto) => total + (produto.consumo ?? 0), 0);

  const diferenca = Math.abs(consumoDetalhado - material.consumo);

  return (
    <section className="necessidade-detalhamento">
      <div className="necessidade-detalhamento-cabecalho">
        <div>
          <h3>Produtos que utilizam {material.material}</h3>

          <p>
            Produção necessária para atender os pedidos e recompor o estoque mínimo dos produtos, no
            depósito MATRIZ/M.P.Prod.
          </p>
        </div>

        <span className="necessidade-detalhamento-contador">{produtos.length} produto(s)</span>
      </div>

      <div className="necessidade-tabela-container">
        <table className="necessidade-tabela necessidade-tabela-produtos">
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>

              <th className="necessidade-coluna-numero">Pedidos (un.)</th>

              <th className="necessidade-coluna-numero">Estoque atual</th>

              <th className="necessidade-coluna-numero">Estoque mínimo</th>

              <th className="necessidade-coluna-numero">A produzir</th>

              <th className="necessidade-coluna-numero">KG/UN</th>

              <th className="necessidade-coluna-numero">Consumo (kg)</th>

              <th className="necessidade-coluna-numero">Valor total (R$)</th>
            </tr>
          </thead>

          <tbody>
            {produtosPagina.map((produto) => {
              const atualNegativo = estoqueNegativo(produto.estoqueAtual);

              const minimoNegativo = estoqueNegativo(produto.estoqueMinimo);

              return (
                <tr key={produto.codigo}>
                  <td>
                    <strong>{produto.codigo}</strong>
                  </td>

                  <td>{produto.produto}</td>

                  {/* PEDIDOS ABERTOS */}

                  <td className="necessidade-coluna-numero">
                    {formatarQuantidade(produto.quantidade)}
                  </td>

                  {/* ESTOQUE ATUAL */}

                  <td
                    className={[
                      "necessidade-coluna-numero",
                      atualNegativo ? "necessidade-estoque-negativo" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={
                      atualNegativo
                        ? {
                            color: "#dc2626",
                            fontWeight: 800,
                          }
                        : undefined
                    }
                  >
                    {produto.estoqueAtual == null ? "—" : formatarQuantidade(produto.estoqueAtual)}
                  </td>

                  {/* ESTOQUE MÍNIMO DO OMIE */}

                  <td
                    className={[
                      "necessidade-coluna-numero",
                      minimoNegativo ? "necessidade-estoque-negativo" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={
                      minimoNegativo
                        ? {
                            color: "#dc2626",
                            fontWeight: 800,
                          }
                        : undefined
                    }
                  >
                    {produto.estoqueMinimo == null
                      ? "—"
                      : formatarQuantidade(produto.estoqueMinimo)}
                  </td>

                  {/* QUANTIDADE NECESSÁRIA A PRODUZIR */}

                  <td className="necessidade-coluna-numero">
                    <strong>
                      {produto.quantidadeProduzir == null
                        ? "Sem estoque"
                        : formatarQuantidade(produto.quantidadeProduzir)}
                    </strong>
                  </td>

                  {/* PESO POR UNIDADE */}

                  <td className="necessidade-coluna-numero">
                    {Number(produto.pesoKgUn).toLocaleString("pt-BR", {
                      minimumFractionDigits: 3,
                      maximumFractionDigits: 3,
                    })}{" "}
                    kg
                  </td>

                  {/* CONSUMO DE MATÉRIA-PRIMA */}

                  <td className="necessidade-coluna-numero">
                    <strong>
                      {produto.consumo == null ? "—" : `${formatarConsumo(produto.consumo)} kg`}
                    </strong>
                  </td>

                  {/* VALOR TOTAL */}

                  <td className="necessidade-coluna-numero">
                    <strong>
                      {produto.consumo != null &&
                      material.preco != null &&
                      Number.isFinite(Number(material.preco)) &&
                      Number(material.preco) > 0
                        ? formatarMoeda(produto.consumo * Number(material.preco))
                        : "—"}
                    </strong>
                  </td>
                </tr>
              );
            })}

            {produtosPagina.length === 0 && (
              <tr>
                <td colSpan={9} className="necessidade-detalhamento-vazio">
                  Nenhum produto com parâmetros completos encontrado para esta matéria-prima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginacao
        paginaAtual={paginaValida}
        totalItens={produtos.length}
        itensPorPagina={PRODUTOS_POR_PAGINA}
        onChangePagina={setPaginaAtual}
      />

      {diferenca > 0.01 && (
        <div className="necessidade-alerta" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />

          <span>
            Divergência no consumo de {material.material}: os produtos detalhados somam{" "}
            {formatarConsumo(consumoDetalhado)} kg, enquanto o resumo principal apresenta{" "}
            {formatarConsumo(material.consumo)} kg.
          </span>
        </div>
      )}
    </section>
  );
}

export default ProdutosDoMaterial;
