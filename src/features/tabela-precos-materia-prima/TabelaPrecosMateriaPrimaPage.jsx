
import { useMemo, useState } from "react";

import {
  RefreshCw,
  TableProperties,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";

import { useTabelaPrecos } from "./hooks/useTabelaPrecos";

import TabelaPrecosFiltros from "./components/TabelaPrecosFiltros";

import TabelaPrecosGrid from "./components/TabelaPrecosGrid";

import {
  filtrarTabelaPrecos,
} from "./utils/formatadoresPrecos";

import "./TabelaPrecosMateriaPrima.css";

/* =========================================================
   PÁGINA PRINCIPAL — TABELA DE PREÇOS
========================================================= */

export default function TabelaPrecosMateriaPrimaPage() {
  const [busca, setBusca] = useState("");

  const [ordenacao, setOrdenacao] =
    useState("descricao");

  const {
    data = [],
    isLoading,
    isFetching,
    isError,
    error,
    dataUpdatedAt,
    refetch,
  } = useTabelaPrecos();

  /* =====================================================
     FILTRAGEM LOCAL
  ===================================================== */

  const registros = useMemo(
    () =>
      filtrarTabelaPrecos(data, {
        busca,
        ordenacao,
      }),
    [data, busca, ordenacao]
  );

  /* =====================================================
     LIMPAR FILTROS
  ===================================================== */

  function limparFiltros() {
    setBusca("");
    setOrdenacao("descricao");
  }

  /* =====================================================
     ATUALIZAÇÃO
  ===================================================== */

  function atualizarDados() {
    void refetch();
  }

  const ultimaAtualizacao = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleString(
        "pt-BR"
      )
    : "—";

  /* =====================================================
     RENDERIZAÇÃO
  ===================================================== */

  return (
    <main className="tp-page">
      <div className="tp-container">
        <PageHeader
          eyebrow="Compras"
          title="Tabela de Preços"
          description="Histórico de preços de matérias-primas integrado aos pedidos de compra do Omie."
          icon={TableProperties}
          actions={
            <button
              className="tp-atualizar"
              type="button"
              onClick={atualizarDados}
              disabled={isFetching}
            >
              <RefreshCw
                size={16}
                className={
                  isFetching
                    ? "tp-girando"
                    : ""
                }
              />

              {isFetching
                ? "Atualizando..."
                : "Atualizar"}
            </button>
          }
        />

        <section className="tp-card">
          <div className="tp-card-cabecalho">
            <div>
              <h2>Consulta de preços</h2>

              <p>
                Consulte o último preço registrado
                e a média ponderada dos últimos
                30 dias.
              </p>
            </div>

            <div className="tp-total">
              <strong>{registros.length}</strong>
              <span>materiais</span>
            </div>
          </div>

          <TabelaPrecosFiltros
            busca={busca}
            onBuscaChange={setBusca}
            ordenacao={ordenacao}
            onOrdenacaoChange={setOrdenacao}
            onLimpar={limparFiltros}
          />

          {isLoading ? (
            <div className="tp-estado">
              Carregando tabela de preços...
            </div>
          ) : isError ? (
            <div
              className="tp-erro"
              role="alert"
            >
              <strong>
                Não foi possível carregar os preços.
              </strong>

              <p>
                {error?.message ??
                  "Erro desconhecido."}
              </p>
            </div>
          ) : (
            <TabelaPrecosGrid
              registros={registros}
            />
          )}

          <div className="tp-rodape">
            <span>
              Atualização automática a cada
              10 minutos.
            </span>

            <span>
              Última consulta: {ultimaAtualizacao}
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
