
import { useMemo, useState } from "react";

import {
  AlertTriangle,
  Calculator,
  RefreshCw,
  Search,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";

import {
  useNecessidadeMateriaPrima,
} from "./hooks/useNecessidadeMateriaPrima";

import {
  consolidarNecessidade,
  formatarKg,
  formatarMoeda,
  numero,
} from "./utils/calculosNecessidade";

import "./NecessidadeMateriaPrima.css";

export default function NecessidadeMateriaPrimaPage() {
  const [busca, setBusca] = useState("");
  const [ajustes, setAjustes] = useState({});

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useNecessidadeMateriaPrima();

  function alterarAjuste(id, campo, valor) {
    const convertido = Math.max(
      0,
      numero(valor)
    );

    setAjustes((anterior) => ({
      ...anterior,
      [String(id)]: {
        ...anterior[String(id)],
        [campo]: convertido,
      },
    }));
  }

  const materiais = useMemo(
    () => consolidarNecessidade(data, ajustes),
    [data, ajustes]
  );

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return materiais.filter((item) =>
      item.material.toLowerCase().includes(termo)
    );
  }, [materiais, busca]);

  const semEstoque =
    data && data.estoques.length === 0;

  const possuiAjustes =
    Object.keys(ajustes).length > 0;

  return (
    <main className="necessidade-page">
      <div className="necessidade-container">
        <PageHeader
          eyebrow="Compras"
          title="Necessidade de Matéria-Prima"
          description="Planejamento de matéria-prima baseado nos pedidos de venda, estoque e compras futuras."
          icon={Calculator}
        />

        {semEstoque && (
          <div
            className="necessidade-alerta"
            role="alert"
          >
            <AlertTriangle size={20} />
            <span>
              O estoque de matéria-prima ainda não
              possui dados sincronizados no Supabase.
              A necessidade permanece em simulação
              até a validação dos saldos.
            </span>
          </div>
        )}

        <div className="necessidade-filtros">
          <label className="necessidade-busca">
            <Search size={18} />

            <input
              type="search"
              value={busca}
              placeholder="Buscar matéria-prima..."
              aria-label="Buscar matéria-prima"
              onChange={(event) =>
                setBusca(event.target.value)
              }
            />
          </label>

          <button
            type="button"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            <RefreshCw size={16} />
            {isFetching
              ? "Atualizando..."
              : "Atualizar"}
          </button>

          <button
            type="button"
            disabled={!possuiAjustes}
            onClick={() => setAjustes({})}
          >
            Limpar ajustes
          </button>
        </div>

        <p className="necessidade-observacao">
          Percentual de compra, estoque considerado
          e teto são editáveis apenas nesta tela.
          As alterações não modificam o cadastro.
        </p>

        <p className="necessidade-observacao">
          Atenção: o cálculo de consumo ainda
          depende da validação das quantidades
          pendentes dos pedidos de venda.
        </p>

        {isLoading ? (
          <div className="necessidade-estado">
            Carregando dados...
          </div>
        ) : isError ? (
          <div
            className="necessidade-erro"
            role="alert"
          >
            Não foi possível consultar os dados:
            {" "}
            {error?.message}
          </div>
        ) : (
          <div className="necessidade-tabela-container">
            <table className="necessidade-tabela">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Consumo (kg)</th>
                  <th>% Compra</th>
                  <th>Consumo considerado</th>
                  <th>Estoque API</th>
                  <th>Estoque considerado</th>
                  <th>Compras futuras</th>
                  <th>Saldo projetado</th>
                  <th>Teto</th>
                  <th>Necessidade</th>
                  <th>Último preço</th>
                  <th>Valor estimado</th>
                </tr>
              </thead>

              <tbody>
                {linhas.map((item) => (
                  <tr key={item.id}>
                    <th>{item.material}</th>

                    <td>
                      {formatarKg(item.consumo)}
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        aria-label={`Percentual ${item.material}`}
                        value={item.percentual}
                        onChange={(event) =>
                          alterarAjuste(
                            item.id,
                            "percentual",
                            event.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      {formatarKg(
                        item.consumoConsiderado
                      )}
                    </td>

                    <td>
                      {item.estoqueDisponivel
                        ? formatarKg(item.estoqueApi)
                        : "Sem dados"}
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        aria-label={`Estoque ${item.material}`}
                        value={item.estoque}
                        onChange={(event) =>
                          alterarAjuste(
                            item.id,
                            "estoque",
                            event.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      {formatarKg(
                        item.comprasFuturas
                      )}
                    </td>

                    <td
                      className={
                        item.saldoProjetado < 0
                          ? "necessidade-negativo"
                          : ""
                      }
                    >
                      {item.estoqueDisponivel
                        ? formatarKg(
                            item.saldoProjetado
                          )
                        : "—"}
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        aria-label={`Teto ${item.material}`}
                        value={item.teto}
                        onChange={(event) =>
                          alterarAjuste(
                            item.id,
                            "teto",
                            event.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <strong>
                        {item.estoqueDisponivel
                          ? formatarKg(
                              item.necessidade
                            )
                          : "—"}
                      </strong>
                    </td>

                    <td>
                      {formatarMoeda(item.preco)}
                    </td>

                    <td>
                      {item.estoqueDisponivel
                        ? formatarMoeda(
                            item.valorEstimado
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}

                {linhas.length === 0 && (
                  <tr>
                    <td colSpan={12}>
                      Nenhuma matéria-prima encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
