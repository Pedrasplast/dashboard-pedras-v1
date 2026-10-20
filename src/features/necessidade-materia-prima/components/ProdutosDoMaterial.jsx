import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import Paginacao from "@/components/paginacao/Paginacao";
import {
  formatarQuantidade,
  formatarConsumo,
  formatarMoeda,
} from "../utils/formatadoresNecessidade";
const PRODUTOS_POR_PAGINA = 8;

function ProdutosDoMaterial({ material, produtos }) {
  const [paginaAtual, setPaginaAtual] = useState(1);

  const totalPaginas = Math.max(1, Math.ceil(produtos.length / PRODUTOS_POR_PAGINA));

  const paginaValida = Math.min(Math.max(1, paginaAtual), totalPaginas);

  const inicio = (paginaValida - 1) * PRODUTOS_POR_PAGINA;

  const produtosPagina = produtos.slice(inicio, inicio + PRODUTOS_POR_PAGINA);

  const consumoDetalhado = produtos.reduce((total, produto) => total + produto.consumo, 0);

  const diferenca = Math.abs(consumoDetalhado - material.consumo);

  return (
    <section className="necessidade-detalhamento">
      <div className="necessidade-detalhamento-cabecalho">
        <div>
          <h3>Produtos que utilizam {material.material}</h3>

          <p>
            Produtos dos pedidos em aberto, agrupados pelo código e vinculados ao Cadastro de
            Produto.
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

              <th className="necessidade-coluna-numero">Quantidade total</th>

              <th className="necessidade-coluna-numero">KG/UN</th>

              <th className="necessidade-coluna-numero">Consumo</th>

              <th className="necessidade-coluna-numero">Valor total (R$)</th>
            </tr>
          </thead>

          <tbody>
            {produtosPagina.map((produto) => (
              <tr key={produto.codigo}>
                <td>
                  <strong>{produto.codigo}</strong>
                </td>

                <td>{produto.produto}</td>

                <td className="necessidade-coluna-numero">
                  {Number(produto.quantidade).toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })} Un.
                </td>

                <td className="necessidade-coluna-numero">
                  {Number(produto.pesoKgUn).toLocaleString("pt-BR", {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  })}{" "}
                  kg
                </td>

                <td className="necessidade-coluna-numero">
                  <strong>{formatarConsumo(produto.consumo)} kg</strong>
                </td>

                <td className="necessidade-coluna-numero">
                  <strong>
                    {material.preco != null &&
                    Number.isFinite(Number(material.preco)) &&
                    Number(material.preco) > 0
                      ? formatarMoeda(produto.consumo * Number(material.preco))
                      : "—"}
                  </strong>
                </td>
              </tr>
            ))}

            {produtosPagina.length === 0 && (
              <tr>
                <td colSpan={6} className="necessidade-detalhamento-vazio">
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
