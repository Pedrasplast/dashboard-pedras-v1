import { useMemo, useState } from "react";
import { RefreshCw, TableProperties } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Paginacao from "@/components/paginacao/Paginacao";
import { useTabelaPrecos } from "./hooks/useTabelaPrecos";
import TabelaPrecosFiltros from "./components/TabelaPrecosFiltros";
import TabelaPrecosGrid from "./components/TabelaPrecosGrid";
import { filtrarTabelaPrecos } from "./utils/formatadoresPrecos";
import "./TabelaPrecosMateriaPrima.css";

/* =========================================================
   TABELA DE PREÇOS — PP E SCRAP
   Paginação padrão após busca e ordenação.
   A regra de preço de referência fica em formatadoresPrecos.js.
========================================================= */

const ITENS_POR_PAGINA = 8;

export default function TabelaPrecosMateriaPrimaPage() {
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState("descricao");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const {
    data = [],
    isLoading,
    isFetching,
    isError,
    error,
    dataUpdatedAt,
    refetch,
  } = useTabelaPrecos();

  const registros = useMemo(
    () => filtrarTabelaPrecos(data, { busca, ordenacao }),
    [data, busca, ordenacao],
  );

  const totalItens = registros.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / ITENS_POR_PAGINA));
  const paginaValida = Math.min(Math.max(1, paginaAtual), totalPaginas);
  const indiceInicial = (paginaValida - 1) * ITENS_POR_PAGINA;
  const registrosPagina = useMemo(
    () => registros.slice(indiceInicial, indiceInicial + ITENS_POR_PAGINA),
    [registros, indiceInicial],
  );

  function alterarBusca(valor) {
    setBusca(valor);
    setPaginaAtual(1);
  }

  function alterarOrdenacao(valor) {
    setOrdenacao(valor);
    setPaginaAtual(1);
  }

  function limparFiltros() {
    setBusca("");
    setOrdenacao("descricao");
    setPaginaAtual(1);
  }

  function atualizarDados() {
    void refetch();
  }

  const ultimaAtualizacao = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleString("pt-BR") : "—";

  return (
    <main className="tp-page">
      <div className="tp-container">
        <PageHeader
          eyebrow="Compras"
          title="Tabela de Preços"
          description="Atualizados pelo Cadastro de Material e histórico dos pedidos de compra do Omie."
          icon={TableProperties}
          actions={
            <button
              className="tp-atualizar"
              type="button"
              onClick={atualizarDados}
              disabled={isFetching}
            >
              <RefreshCw size={16} className={isFetching ? "tp-girando" : ""} />
              {isFetching ? "Atualizando..." : "Atualizar"}
            </button>
          }
        />

        <section className="tp-card">
          <div className="tp-card-cabecalho">
            <div>
              <h2>Tabela de Preços</h2>
              <p>
                Consulte o último preço registrado e a média ponderada dos últimos 30 dias. Quando
                não houver média válida, o preço de referência será o da última compra.
              </p>
            </div>
            <div className="tp-total">
              <strong>{registros.length}</strong>
              <span>materiais</span>
            </div>
          </div>

          <TabelaPrecosFiltros
            busca={busca}
            onBuscaChange={alterarBusca}
            ordenacao={ordenacao}
            onOrdenacaoChange={alterarOrdenacao}
            onLimpar={limparFiltros}
          />

          {isLoading ? (
            <div className="tp-estado">Carregando tabela de preços...</div>
          ) : isError ? (
            <div className="tp-erro" role="alert">
              <strong>Não foi possível carregar os preços.</strong>
              <p>{error?.message ?? "Erro desconhecido."}</p>
            </div>
          ) : (
            <>
              <TabelaPrecosGrid registros={registrosPagina} />
              {totalItens > ITENS_POR_PAGINA && (
                <Paginacao
                  paginaAtual={paginaValida}
                  totalItens={totalItens}
                  itensPorPagina={ITENS_POR_PAGINA}
                  onChangePagina={setPaginaAtual}
                />
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
