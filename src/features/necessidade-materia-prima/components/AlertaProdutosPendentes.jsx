
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

import "./AlertaProdutosPendentes.css";

const SITUACOES = {
  SEM_PARAMETROS: "Produto sem cadastro ativo",
  SEM_CADASTRO_PRODUTO: "Produto sem cadastro",
  SEM_PESO: "Peso KG/UN não informado",
  SEM_VINCULO_MATERIAL: "Matéria-prima não vinculada",
  MATERIAL_INATIVO: "Material inexistente ou inativo",
  DESCONHECIDO: "Cadastro incompleto",
};

export default function AlertaProdutosPendentes({
  pedidos = [],
  resumo = null,
}) {
  const [expandido, setExpandido] = useState(false);

  const pendencias = useMemo(() => {
    const agrupadas = new Map();

    for (const item of pedidos) {
      if (item.situacao_cadastro === "OK") {
        continue;
      }

      const codigo = String(
        item.codigo_produto ?? ""
      ).trim();

      const situacao =
        item.situacao_cadastro || "DESCONHECIDO";

      const chave = `${codigo}:${situacao}`;

      const atual = agrupadas.get(chave);

      if (atual) {
        atual.itens += 1;
        atual.quantidade += Number(item.quantidade) || 0;
        continue;
      }

      agrupadas.set(chave, {
        codigo,
        nome: item.produto || "Produto sem descrição",
        situacao,
        itens: 1,
        quantidade: Number(item.quantidade) || 0,
      });
    }

    return Array.from(agrupadas.values()).sort(
      (a, b) =>
        b.quantidade - a.quantidade ||
        a.codigo.localeCompare(b.codigo, "pt-BR")
    );
  }, [pedidos]);

  const itensPendentes =
    resumo?.itensPendentes ??
    pendencias.reduce(
      (total, item) => total + item.itens,
      0
    );

  if (pendencias.length === 0) {
    return null;
  }

  return (
    <section
      className="necessidade-alerta-cadastro"
      role="region"
      aria-label="Pendências de cadastro dos produtos"
    >
      <div className="necessidade-alerta-cadastro-topo">
        <AlertTriangle
          size={22}
          aria-hidden="true"
        />

        <div className="necessidade-alerta-cadastro-conteudo">
          <strong>
            Atenção: produtos sem parâmetros completos
          </strong>

          <p>
            Encontramos {pendencias.length} código(s)
            de produto com cadastro incompleto,
            afetando {itensPendentes} item(ns)
            dos pedidos em aberto.
          </p>

          <p>
            O consumo calculado é parcial. Regularize
            os produtos antes de utilizar a necessidade
            para decidir as compras.
          </p>
        </div>
      </div>

      <div className="necessidade-alerta-cadastro-acoes">
        <button
          type="button"
          className="necessidade-alerta-cadastro-botao"
          onClick={() =>
            setExpandido((anterior) => !anterior)
          }
          aria-expanded={expandido}
        >
          {expandido ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}

          {expandido
            ? "Ocultar produtos pendentes"
            : "Ver produtos pendentes"}
        </button>

        <Link
          to="/cadastro-produto"
          className="necessidade-alerta-cadastro-link"
        >
          <ExternalLink size={16} />
          Ir para Cadastro de Produto
        </Link>
      </div>

      {expandido && (
        <div className="necessidade-tabela-container">
          <table className="necessidade-tabela">
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
              {pendencias.map((item) => (
                <tr
                  key={`${item.codigo}:${item.situacao}`}
                >
                  <td>{item.codigo || "—"}</td>
                  <td>{item.nome}</td>
                  <td>
                    {item.quantidade.toLocaleString(
                      "pt-BR",
                      { maximumFractionDigits: 2 }
                    )}
                  </td>
                  <td>{item.itens}</td>
                  <td>
                    {SITUACOES[item.situacao] ||
                      item.situacao}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
