import { Fragment, useEffect, useMemo, useState } from "react";

import {
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiEdit3,
  FiGitBranch,
  FiSearch,
} from "react-icons/fi";

import { useQuery } from "@tanstack/react-query";

import {
  buscarMetadadosDesdobramentoPedidos,
  buscarPedidosAlterados,
} from "../services/relatoriosAlterados.service";

// Paginação padrão já utilizada no sistema.
import Paginacao from "@/components/paginacao/Paginacao";

import LayoutRelatorio from "../components/LayoutRelatorio";

import {
  aplicarDesdobramentoPedidos,
  extrairMudancas,
  obterPeriodoPadrao,
  pesquisarPedidosAlterados,
} from "./formatadoresPedidosAlterados";

import "./PedidosAlteradosRelatorio.css";
import { formatarDataHora } from "@/shared/lib/datas";

/* =====================================================
   CONFIGURAÇÕES
===================================================== */

const ITENS_POR_PAGINA = 8;

/* =====================================================


/* =====================================================
   COMPONENTE PRINCIPAL
===================================================== */

export default function PedidosAlteradosRelatorio({ relatorio: relatorioConfig } = {}) {
  /* =================================================
     PERÍODO INICIAL
  ================================================= */

  const periodoPadrao = useMemo(() => obterPeriodoPadrao(), []);

  /* =================================================
     ESTADOS DOS FILTROS
  ================================================= */

  const [dataInicial, setDataInicial] = useState(periodoPadrao.inicio);

  const [dataFinal, setDataFinal] = useState(periodoPadrao.fim);

  const [pesquisa, setPesquisa] = useState("");

  /* =================================================
     PAGINAÇÃO
  ================================================= */

  const [paginaAtual, setPaginaAtual] = useState(1);

  /* =================================================
     HISTÓRICO EXPANDIDO
  ================================================= */

  const [pedidosExpandidos, setPedidosExpandidos] = useState(() => new Set());

  /* =================================================
     EXPORTAÇÃO
  ================================================= */

  const [exportando, setExportando] = useState(null);

  /* =================================================
     CONSULTA PRINCIPAL DO RELATÓRIO

     IMPORTANTE:
     O carregamento dos pedidos NÃO depende mais da consulta
     auxiliar de desdobramentos. Primeiro o relatório carrega
     normalmente pela RPC. A identificação de desdobramento é
     buscada em uma segunda consulta, sem bloquear a tela.
  ================================================= */

  const {
    data: relatorioBase = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["relatorio-pedidos-alterados", dataInicial, dataFinal],

    queryFn: () => buscarPedidosAlterados(dataInicial, dataFinal),

    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  /* =================================================
     CONSULTA AUXILIAR DE DESDOBRAMENTOS

     Se essa consulta falhar por qualquer motivo, os pedidos
     continuam aparecendo normalmente. Apenas o selo /1, /2 e
     a mensagem de desdobramento ficam temporariamente sem ser
     exibidos.
  ================================================= */

  const { data: mapaMetadadosPedidoExibicao } = useQuery({
    queryKey: ["mapa-metadados-pedidos-desdobrados-v3"],

    queryFn: async () => {
      try {
        return await buscarMetadadosDesdobramentoPedidos();
      } catch (erro) {
        console.warn("Não foi possível carregar os metadados de desdobramento dos pedidos:", erro);

        return new Map();
      }
    },

    enabled: relatorioBase.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  });

  /* =================================================
     APLICAR NUMERAÇÃO VISUAL / DESDOBRAMENTO

     Enquanto o mapa auxiliar ainda não chegou, usa exatamente
     os dados originais retornados pela RPC. Assim o relatório
     nunca fica vazio aguardando a consulta de desdobramento.
  ================================================= */

  const relatorio = useMemo(
    () => aplicarDesdobramentoPedidos(relatorioBase, mapaMetadadosPedidoExibicao),
    [relatorioBase, mapaMetadadosPedidoExibicao],
  );

  /* =================================================
     FILTRAGEM LOCAL
  ================================================= */

  const pedidosFiltrados = useMemo(
    () => pesquisarPedidosAlterados(relatorio, pesquisa),
    [relatorio, pesquisa],
  );

  /* =================================================
     TOTAL DE ALTERAÇÕES

     Calculado sobre todos os registros filtrados,
     independentemente da página atual.
  ================================================= */

  const totalAlteracoes = useMemo(
    () =>
      pedidosFiltrados.reduce(
        (total, pedido) => total + Number(pedido?.quantidade_alteracoes ?? 0),
        0,
      ),

    [pedidosFiltrados],
  );

  /* =================================================
     PAGINAÇÃO PADRÃO

     10 pedidos por página.
  ================================================= */

  const totalItens = pedidosFiltrados.length;

  const totalPaginas = Math.max(1, Math.ceil(totalItens / ITENS_POR_PAGINA));

  /* =================================================
     GARANTIR PÁGINA VÁLIDA
  ================================================= */

  const paginaValida = Math.max(1, Math.min(paginaAtual, totalPaginas));

  useEffect(() => {
    if (paginaAtual !== paginaValida) {
      setPaginaAtual(paginaValida);
    }
  }, [paginaAtual, paginaValida]);

  /* =================================================
     PEDIDOS DA PÁGINA ATUAL

     Somente a tabela recebe paginação.
  ================================================= */

  const pedidosPagina = useMemo(() => {
    const inicio = (paginaValida - 1) * ITENS_POR_PAGINA;

    return pedidosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [pedidosFiltrados, paginaValida]);

  /* =================================================
     INTERVALO EXIBIDO
  ================================================= */

  const inicioExibicao = totalItens > 0 ? (paginaValida - 1) * ITENS_POR_PAGINA + 1 : 0;

  const fimExibicao = Math.min(paginaValida * ITENS_POR_PAGINA, totalItens);

  /* =================================================
     EXPANDIR HISTÓRICO DO PEDIDO
  ================================================= */

  function alternarPedido(codigo) {
    setPedidosExpandidos((atual) => {
      const proximo = new Set(atual);

      if (proximo.has(codigo)) {
        proximo.delete(codigo);
      } else {
        proximo.add(codigo);
      }

      return proximo;
    });
  }

  /* =================================================
     ALTERAR DATA INICIAL
  ================================================= */

  function alterarDataInicial(valor) {
    setDataInicial(valor);

    setPaginaAtual(1);
  }

  /* =================================================
     ALTERAR DATA FINAL
  ================================================= */

  function alterarDataFinal(valor) {
    setDataFinal(valor);

    setPaginaAtual(1);
  }

  /* =================================================
     ALTERAR PESQUISA
  ================================================= */

  function limparFiltros() {
    setDataInicial(periodoPadrao.inicio);
    setDataFinal(periodoPadrao.fim);
    setPesquisa("");
    setPaginaAtual(1);
  }

  function alterarPesquisa(valor) {
    setPesquisa(valor);

    setPaginaAtual(1);
  }

  /* =================================================
     EXPORTAR PDF

     Exporta todos os pedidos filtrados.
     Não utiliza pedidosPagina.
  ================================================= */

  async function exportarPDF() {
    if (pedidosFiltrados.length === 0 || exportando) {
      return;
    }

    try {
      setExportando("pdf");

      const { exportarPdfPedidosAlterados } = await import("./ExportarPedidosAlteradosPDF.js");

      await exportarPdfPedidosAlterados({
        pedidos: pedidosFiltrados,

        dataInicial,

        dataFinal,

        pesquisa,

        extrairMudancas,

        formatarDataHora: formatarDataHora,
      });
    } catch (erro) {
      console.error("Erro ao exportar PDF:", erro);

      window.alert("Não foi possível gerar o PDF.");
    } finally {
      setExportando(null);
    }
  }

  /* =================================================
     EXPORTAR EXCEL

     Exporta todos os pedidos filtrados.
     Não utiliza pedidosPagina.
  ================================================= */

  async function exportarExcel() {
    if (pedidosFiltrados.length === 0 || exportando) {
      return;
    }

    try {
      setExportando("excel");

      const { exportarExcelPedidosAlterados } = await import("./ExportarPedidosAlteradosExcel.js");

      await exportarExcelPedidosAlterados({
        pedidos: pedidosFiltrados,

        dataInicial,

        dataFinal,

        pesquisa,

        extrairMudancas,

        formatarDataHora: formatarDataHora,
      });
    } catch (erro) {
      console.error("Erro ao exportar Excel:", erro);

      window.alert("Não foi possível gerar o Excel.");
    } finally {
      setExportando(null);
    }
  }

  /* =====================================================
     RENDERIZAÇÃO
  ===================================================== */

  return (
    <>
      <LayoutRelatorio
        relatorio={relatorioConfig}
        categoria="Pedidos"
        titulo="Pedidos Alterados"
        descricao="Acompanhe alterações realizadas no conteúdo dos pedidos, sem considerar o avanço normal de status ou etapa."
        fixo
        filtrosAtivos={
          (dataInicial !== periodoPadrao.inicio ? 1 : 0) +
          (dataFinal !== periodoPadrao.fim ? 1 : 0) +
          (pesquisa.trim() ? 1 : 0)
        }
        filtros={
          <div className="pedidos-alterados-filtros">
            {/* DATA INICIAL */}

            <label className="pedidos-alterados-campo">
              <span>De</span>

              <input
                type="date"
                value={dataInicial}
                max={dataFinal || undefined}
                onChange={(event) => alterarDataInicial(event.target.value)}
              />
            </label>

            {/* DATA FINAL */}

            <label className="pedidos-alterados-campo">
              <span>Até</span>

              <input
                type="date"
                value={dataFinal}
                min={dataInicial || undefined}
                onChange={(event) => alterarDataFinal(event.target.value)}
              />
            </label>

            {/* PESQUISA */}

            <label className="pedidos-alterados-campo pedidos-alterados-pesquisa-campo">
              <span>Buscar</span>

              <div className="pedidos-alterados-pesquisa">
                <FiSearch />

                <input
                  type="text"
                  value={pesquisa}
                  onChange={(event) => alterarPesquisa(event.target.value)}
                  placeholder="Pedido, cliente, vendedor ou campo alterado..."
                />
              </div>
            </label>
          </div>
        }
        acoes={{
          onPdf: exportarPDF,
          onExcel: exportarExcel,
          onLimpar: limparFiltros,
          limparDesabilitado:
            dataInicial === periodoPadrao.inicio &&
            dataFinal === periodoPadrao.fim &&
            !pesquisa.trim(),
          desabilitado: totalItens === 0 || Boolean(exportando),
          gerandoPdf: exportando === "pdf",
          gerandoExcel: exportando === "excel",
        }}
        indicadores={[
          {
            rotulo: "Pedidos alterados",
            valor: totalItens.toLocaleString("pt-BR"),
            destaque: true,
          },
          { rotulo: "Alterações", valor: totalAlteracoes.toLocaleString("pt-BR") },
          {
            rotulo: "Período",
            texto: true,
            valor: `${dataInicial ? dataInicial.split("-").reverse().join("/") : "início"} até ${
              dataFinal ? dataFinal.split("-").reverse().join("/") : "hoje"
            }`,
          },
        ]}
      >
        {/* ===============================================
          ERRO DA CONSULTA
      =============================================== */}

        {error && (
          <div className="relatorios-erro pedidos-alterados-erro">
            <FiAlertTriangle />

            <span>{error.message || "Não foi possível carregar as alterações dos pedidos."}</span>
          </div>
        )}

        {/* ===============================================
          CARREGAMENTO
      =============================================== */}

        {!error && isLoading && (
          <div className="relatorios-loading pedidos-alterados-loading">
            <div className="relatorios-loading-card">
              <div className="relatorios-spinner" />

              <p>Carregando alterações dos pedidos...</p>
            </div>
          </div>
        )}

        {/* ===============================================
          TABELA DE AUDITORIA
      =============================================== */}

        {!error && !isLoading && totalItens > 0 && (
          <>
            <section className="relatorio-visualizacao pedidos-alterados-visualizacao">
              {/* CABEÇALHO */}

              <div className="relatorio-visualizacao-header">
                <div>
                  <span className="relatorio-visualizacao-eyebrow">Auditoria</span>

                  <h3>Alterações encontradas</h3>
                </div>
              </div>

              {/* INFORMAÇÕES */}

              <div className="relatorio-visualizacao-info">
                <div className="relatorio-visualizacao-info-item">
                  <span>Período</span>

                  <strong>
                    {dataInicial ? dataInicial.split("-").reverse().join("/") : "Sem data inicial"}

                    {" até "}

                    {dataFinal ? dataFinal.split("-").reverse().join("/") : "Sem data final"}
                  </strong>
                </div>

                <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
                  <span>Pedidos</span>

                  <strong>{totalItens}</strong>
                </div>
              </div>

              {/* =====================================
                TABELA
            ===================================== */}

              <div className="relatorio-visualizacao-tabela-wrapper pedidos-alterados-tabela-wrapper">
                <table className="relatorio-visualizacao-tabela pedidos-alterados-tabela">
                  <thead>
                    <tr>
                      <th>Pedido</th>

                      <th>Cliente</th>

                      <th>Vendedor</th>

                      <th>Última alteração</th>

                      <th>Nº alterações</th>

                      <th>O que foi alterado</th>

                      <th>Histórico</th>
                    </tr>
                  </thead>

                  {/* =================================
                    CORPO DA TABELA

                    Usa pedidosPagina.
                ================================= */}

                  <tbody>
                    {pedidosPagina.map((pedido) => {
                      const codigo = pedido.codigo_pedido_omie;

                      const expandido = pedidosExpandidos.has(codigo);

                      const campos = Array.isArray(pedido.campos_alterados)
                        ? pedido.campos_alterados
                        : [];

                      const ocorrencias = Array.isArray(pedido.detalhes_alteracoes)
                        ? pedido.detalhes_alteracoes
                        : [];

                      return (
                        <Fragment key={`pedido-${codigo}`}>
                          {/* =========================
                            LINHA DO PEDIDO
                        ========================= */}

                          <tr>
                            {/* PEDIDO */}

                            <td>
                              <div className="pedidos-alterados-pedido-identificacao">
                                <strong className="pedidos-alterados-numero">
                                  {pedido.numero_pedido || codigo}
                                </strong>

                                {pedido.pedido_desdobrado && (
                                  <span
                                    className={`pedidos-alterados-desdobramento-badge ${
                                      pedido.pedido_desdobramento_original ? "original" : "derivado"
                                    }`}
                                    title={
                                      pedido.pedido_desdobramento_original
                                        ? "Pedido original que possui desdobramento"
                                        : `Pedido gerado pelo desdobramento do pedido ${
                                            pedido.numero_pedido_original || ""
                                          }`
                                    }
                                  >
                                    <FiGitBranch />

                                    {pedido.pedido_desdobramento_original
                                      ? "Desdobrado"
                                      : "Parte desdobrada"}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* CLIENTE */}

                            <td>{pedido.cliente || "-"}</td>

                            {/* VENDEDOR */}

                            <td>{pedido.vendedor || "-"}</td>

                            {/* ÚLTIMA ALTERAÇÃO */}

                            <td>{formatarDataHora(pedido.ultima_alteracao)}</td>

                            {/* QUANTIDADE DE ALTERAÇÕES */}

                            <td>
                              <span className="pedidos-alterados-contador">
                                {pedido.quantidade_alteracoes}
                              </span>
                            </td>

                            {/* CAMPOS ALTERADOS */}

                            <td>
                              <div className="pedidos-alterados-campos">
                                {campos.map((campo) => (
                                  <span key={campo}>{campo}</span>
                                ))}
                              </div>
                            </td>

                            {/* BOTÃO HISTÓRICO */}

                            <td>
                              <button
                                type="button"
                                className="pedidos-alterados-ver"
                                onClick={() => alternarPedido(codigo)}
                                aria-expanded={expandido}
                              >
                                {expandido ? <FiChevronUp /> : <FiChevronDown />}

                                {expandido ? "Fechar" : "Ver"}
                              </button>
                            </td>
                          </tr>

                          {/* =========================
                            HISTÓRICO EXPANDIDO
                        ========================= */}

                          {expandido && (
                            <tr className="pedidos-alterados-historico-linha">
                              <td colSpan={7}>
                                <div className="pedidos-alterados-historico">
                                  {/* TÍTULO */}

                                  <div className="pedidos-alterados-historico-titulo">
                                    <FiEdit3 />

                                    <div>
                                      <strong>
                                        Histórico do pedido {pedido.numero_pedido || codigo}
                                      </strong>

                                      <span>
                                        {ocorrencias.length} ocorrência
                                        {ocorrencias.length !== 1 ? "s" : ""}
                                      </span>
                                    </div>
                                  </div>

                                  {pedido.pedido_desdobrado && (
                                    <div className="pedidos-alterados-desdobramento-aviso">
                                      <FiGitBranch />

                                      <div>
                                        <strong>
                                          {pedido.pedido_desdobramento_original
                                            ? `Pedido ${
                                                pedido.numero_pedido_original ||
                                                pedido.numero_pedido ||
                                                codigo
                                              } desdobrado`
                                            : `Pedido gerado por desdobramento de ${
                                                pedido.numero_pedido_original || "pedido original"
                                              }`}
                                        </strong>

                                        <span>
                                          {pedido.pedido_desdobramento_original
                                            ? `Este é o pedido original. O sistema identificou ${
                                                pedido.pedido_desdobramento_quantidade_derivados
                                              } ${
                                                pedido.pedido_desdobramento_quantidade_derivados ===
                                                1
                                                  ? "pedido derivado"
                                                  : "pedidos derivados"
                                              } vinculado${
                                                pedido.pedido_desdobramento_quantidade_derivados ===
                                                1
                                                  ? ""
                                                  : "s"
                                              } a ele.`
                                            : `Esta é a parte ${
                                                pedido.pedido_desdobramento_indice
                                              } do desdobramento. O sufixo /${
                                                pedido.pedido_desdobramento_indice
                                              } é apenas visual para diferenciar os pedidos; no Omie e no Supabase o número-base permanece ${
                                                pedido.numero_pedido_original || "o mesmo"
                                              }.`}
                                        </span>

                                        {pedido.pedido_desdobramento_partes?.length > 1 && (
                                          <div className="pedidos-alterados-desdobramento-partes">
                                            <small>Pedidos relacionados:</small>

                                            <div>
                                              {pedido.pedido_desdobramento_partes.map((parte) => (
                                                <span
                                                  key={`${codigo}-desdobramento-${parte.codigo_pedido_omie}`}
                                                  className={
                                                    Number(parte.codigo_pedido_omie) ===
                                                    Number(codigo)
                                                      ? "atual"
                                                      : ""
                                                  }
                                                >
                                                  {parte.numero_exibicao}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* OCORRÊNCIAS */}

                                  <div className="pedidos-alterados-ocorrencias">
                                    {ocorrencias.map((ocorrencia, indice) => {
                                      const mudancas = extrairMudancas(ocorrencia);

                                      return (
                                        <article
                                          key={ocorrencia.id || `${codigo}-${indice}`}
                                          className="pedidos-alterados-ocorrencia"
                                        >
                                          {/* TOPO */}

                                          <div className="pedidos-alterados-ocorrencia-topo">
                                            <strong>
                                              Alteração #{ocorrencias.length - indice}
                                            </strong>

                                            <span>{formatarDataHora(ocorrencia.alterado_em)}</span>
                                          </div>

                                          {/* MUDANÇAS */}

                                          {mudancas.length > 0 ? (
                                            <div className="pedidos-alterados-mudancas">
                                              {mudancas.map((mudanca) => (
                                                <div
                                                  key={`${ocorrencia.id}-${mudanca.chave}`}
                                                  className="pedidos-alterados-mudanca"
                                                >
                                                  <strong>{mudanca.campo}</strong>

                                                  <div className="pedidos-alterados-antes-depois">
                                                    {/* ANTES */}

                                                    <span>
                                                      <small>Antes</small>

                                                      <b>{mudanca.anterior}</b>
                                                    </span>

                                                    {/* SETA */}

                                                    <span className="pedidos-alterados-seta">
                                                      →
                                                    </span>

                                                    {/* DEPOIS */}

                                                    <span>
                                                      <small>Depois</small>

                                                      <b>{mudanca.novo}</b>
                                                    </span>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="pedidos-alterados-sem-detalhe">
                                              {ocorrencia.resumo ||
                                                "Alteração registrada sem detalhamento disponível."}
                                            </p>
                                          )}
                                        </article>
                                      );
                                    })}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* =====================================
                RODAPÉ

                Mantém totais gerais, mas exibe
                o intervalo da página.
            ===================================== */}

              <div className="relatorio-visualizacao-footer">
                <span>
                  Exibindo {inicioExibicao} a {fimExibicao} de {totalItens} pedido(s)
                </span>

                <span>{totalAlteracoes} alteração(ões) no período</span>
              </div>
              {totalPaginas > 1 && (
                <Paginacao
                  paginaAtual={paginaValida}
                  totalItens={totalItens}
                  itensPorPagina={ITENS_POR_PAGINA}
                  onChangePagina={setPaginaAtual}
                />
              )}
            </section>
          </>
        )}

        {/* ===============================================
          NENHUMA ALTERAÇÃO
      =============================================== */}

        {!error && !isLoading && totalItens === 0 && (
          <div className="rl-vazio pedidos-alterados-vazio">
            <FiEdit3 />

            <strong>Nenhuma alteração encontrada</strong>

            <span>Não existem pedidos com alterações reais no período selecionado.</span>
          </div>
        )}
      </LayoutRelatorio>
    </>
  );
}
