import { useMemo, useState } from "react";
import { TableProperties } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import Paginacao from "@/components/paginacao/Paginacao";

import { useTabelaPrecos } from "./hooks/useTabelaPrecos";
import TabelaPrecosFiltros from "./components/TabelaPrecosFiltros";
import TabelaPrecosGrid from "./components/TabelaPrecosGrid";

import { filtrarTabelaPrecos } from "./utils/formatadoresPrecos";

import "./TabelaPrecosMateriaPrima.css";

/* =========================================================
   TABELA DE PREÇOS — PP E SCRAP

   - Carregamento automático pelo useTabelaPrecos
   - Busca por material
   - Ordenação dos registros
   - Botão padrão para limpar filtros
   - Paginação de 8 registros
   - Preço de referência conforme regra existente

   O botão de atualização manual foi removido.
========================================================= */

const ITENS_POR_PAGINA = 8;

export default function TabelaPrecosMateriaPrimaPage() {
  /* =====================================================
     ESTADOS DOS FILTROS E PAGINAÇÃO
  ===================================================== */

  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState("descricao");
  const [paginaAtual, setPaginaAtual] = useState(1);

  /* =====================================================
     CONSULTA DOS PREÇOS
  ===================================================== */

  const { data = [], isLoading, isError, error } = useTabelaPrecos();

  /* =====================================================
     BUSCA E ORDENAÇÃO
  ===================================================== */

  const registros = useMemo(
    () =>
      filtrarTabelaPrecos(data, {
        busca,
        ordenacao,
      }),
    [data, busca, ordenacao],
  );

  /* =====================================================
     PAGINAÇÃO
  ===================================================== */

  const totalItens = registros.length;

  const totalPaginas = Math.max(1, Math.ceil(totalItens / ITENS_POR_PAGINA));

  const paginaValida = Math.min(Math.max(1, paginaAtual), totalPaginas);

  const indiceInicial = (paginaValida - 1) * ITENS_POR_PAGINA;

  const registrosPagina = useMemo(
    () => registros.slice(indiceInicial, indiceInicial + ITENS_POR_PAGINA),
    [registros, indiceInicial],
  );

  /* =====================================================
     ALTERAR BUSCA
  ===================================================== */

  function alterarBusca(valor) {
    setBusca(valor);
    setPaginaAtual(1);
  }

  /* =====================================================
     ALTERAR ORDENAÇÃO
  ===================================================== */

  function alterarOrdenacao(valor) {
    setOrdenacao(valor);
    setPaginaAtual(1);
  }

  /* =====================================================
     LIMPAR FILTROS
  ===================================================== */

  function limparFiltros() {
    setBusca("");
    setOrdenacao("descricao");
    setPaginaAtual(1);
  }

  /* =====================================================
     RENDERIZAÇÃO
  ===================================================== */

  return (
    <main className="tp-page">
      <div className="tp-container">
        {/* CABEÇALHO PRINCIPAL */}

        <PageHeader
          eyebrow="Compras"
          title="Tabela de Preços"
          description="Atualizados pelo Cadastro de Material e histórico dos pedidos de compra do Omie."
          icon={TableProperties}
        />

        {/* CONTEÚDO */}

        <section className="tp-card">
          <div className="tp-card-cabecalho">
            <div>
              <h2>Tabela de Preços</h2>

              <p>
                Preço médio ponderado = valor total comprado ÷ quantidade total comprada nos últimos
                30 dias. Sem média válida, utiliza-se o preço da última compra.
              </p>
            </div>
          </div>

          {/* FILTROS */}

          <TabelaPrecosFiltros
            busca={busca}
            onBuscaChange={alterarBusca}
            ordenacao={ordenacao}
            onOrdenacaoChange={alterarOrdenacao}
            onLimpar={limparFiltros}
          />

          {/* ESTADOS E TABELA */}

          {isLoading ? (
            <div className="tp-estado">Carregando tabela de preços...</div>
          ) : isError ? (
            <div className="tp-erro" role="alert">
              <strong>Não foi possível carregar os preços.</strong>

              <p>{error?.message ?? "Erro desconhecido."}</p>
            </div>
          ) : (
            <>
              {/* TABELA DE PREÇOS */}

              <TabelaPrecosGrid registros={registrosPagina} />

              {/* PAGINAÇÃO PADRÃO */}

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
