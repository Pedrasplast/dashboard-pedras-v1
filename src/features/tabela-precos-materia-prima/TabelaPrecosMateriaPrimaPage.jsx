
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

   REGRAS:
   - Exibir somente PP e SCRAP.
   - Códigos Omie definidos no Cadastro de Material.
   - Último preço e preço médio de 30 dias.
   - Preservar filtros e ordenação.
   - Não alterar registros no Supabase.
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
     FILTRAGEM E ORDENAÇÃO LOCAL

     O serviço já restringe PP e SCRAP.
     Aqui mantemos apenas busca e ordenação.
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
          description="Preços de PP e SCRAP, com códigos atualizados pelo Cadastro de Material e histórico dos pedidos de compra do Omie."
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
              <h2>Consulta de preços — PP e SCRAP</h2>

              <p>
                Consulte o último preço registrado
                e a média ponderada dos últimos
                30 dias de cada matéria-prima.
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
