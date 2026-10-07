import {
  Warehouse,
} from "lucide-react";

import PageHeader
  from "@/components/layout/PageHeader";

import EstoqueFiltros
  from "./components/EstoqueFiltros";

import EstoqueKpis
  from "./components/EstoqueKpis";

import EstoqueStatusSincronizacao
  from "./components/EstoqueStatusSincronizacao";

import EstoqueTabela
  from "./components/EstoqueTabela";

import useEstoque
  from "./hooks/useEstoque";

import useEstoqueFiltros
  from "./hooks/useEstoqueFiltros";

import useEstoquePaginacao
  from "./hooks/useEstoquePaginacao";

import useEstoqueProcessado
  from "./hooks/useEstoqueProcessado";

import "./EstoquePage.css";


export default function EstoquePage() {
  /* =======================================================
     PRIMEIRO CARREGAMENTO DE LOCAIS

     useEstoque precisa receber o local selecionado.
     No primeiro render ainda não existe local,
     então a consulta de estoque fica aguardando.
  ======================================================= */

  const {
    locais:
      locaisIniciais,
  } =
    useEstoque({
      codigoLocalEstoque:
        "",
    });


  /* =======================================================
     FILTROS
  ======================================================= */

  const filtros =
    useEstoqueFiltros({
      locais:
        locaisIniciais,
    });


  /* =======================================================
     DADOS

     Agora que sabemos o local selecionado,
     carregamos o estoque correspondente.
  ======================================================= */

  const {
    locais,
    estoque,
    pedidosAbertos,
    resumoPedidosAbertos,
    statusSincronizacao,
    carregando,
    erro,
  } =
    useEstoque({
      codigoLocalEstoque:
        filtros
          .localSelecionado,
    });


  /* =======================================================
     PROCESSAMENTO
  ======================================================= */

  const {
    estoqueFiltrado,
    indicadores,
    localAtual,
  } =
    useEstoqueProcessado({
      estoque,

      pedidosAbertos,

      resumoPedidosAbertos,

      locais,

      localSelecionado:
        filtros
          .localSelecionado,

      pesquisa:
        filtros
          .pesquisa,

      situacao:
        filtros
          .situacao,
    });


  /* =======================================================
     PAGINAÇÃO
  ======================================================= */

  const paginacao =
    useEstoquePaginacao({
      itens:
        estoqueFiltrado,

      localSelecionado:
        filtros
          .localSelecionado,

      pesquisa:
        filtros
          .pesquisa,

      situacao:
        filtros
          .situacao,
    });


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="estoque-page">

      <div className="estoque-container">

        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <PageHeader
          eyebrow="Produção"
          title="Estoque"
          description="Consulta do estoque de produtos acabados integrado ao Omie."
          icon={
            Warehouse
          }
          className="estoque-header"
          actions={
            <EstoqueStatusSincronizacao
              status={
                statusSincronizacao
              }
            />
          }
        />


        {/* =================================================
            FILTROS
        ================================================= */}

        <EstoqueFiltros
          locais={
            locais
          }

          localSelecionado={
            filtros
              .localSelecionado
          }

          pesquisa={
            filtros
              .pesquisa
          }

          situacao={
            filtros
              .situacao
          }

          possuiFiltrosAtivos={
            filtros
              .possuiFiltrosAtivos
          }

          onAlterarLocal={
            filtros
              .setLocalSelecionado
          }

          onAlterarPesquisa={
            filtros
              .setPesquisa
          }

          onAlterarSituacao={
            filtros
              .setSituacao
          }

          onLimparFiltros={
            filtros
              .limparFiltros
          }
        />


        {/* =================================================
            ERRO
        ================================================= */}

        {erro && (
          <div
            className="estoque-mensagem estoque-mensagem--erro"
            role="alert"
          >
            {erro}
          </div>
        )}


        {/* =================================================
            INDICADORES
        ================================================= */}

        <EstoqueKpis
          indicadores={
            indicadores
          }

          localAtual={
            localAtual
          }

          carregando={
            carregando
          }
        />


        {/* =================================================
            TABELA
        ================================================= */}

        <EstoqueTabela
          itens={
            paginacao
              .itensPagina
          }

          totalItens={
            estoqueFiltrado
              .length
          }

          localAtual={
            localAtual
          }

          carregando={
            carregando
          }

          paginaAtual={
            paginacao
              .paginaAtual
          }

          itensPorPagina={
            paginacao
              .itensPorPagina
          }

          onChangePagina={
            paginacao
              .setPaginaAtual
          }
        />

      </div>

    </main>
  );
}