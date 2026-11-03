import { useEffect, useMemo, useState } from "react";

import { FiAlertTriangle, FiFileText, FiRefreshCw, FiSearch, FiX } from "react-icons/fi";

import Paginacao from "@/components/paginacao/Paginacao";

import {
  DATAS_REFERENCIA_ENTRADAS_COMPRAS,
  SITUACOES_ENTRADAS_COMPRAS,
} from "./services/entradasComprasMateriaPrimaService";

import useEntradasComprasMateriaPrima from "./hooks/useEntradasComprasMateriaPrima";

import {
  criarDadosExportacaoEntradasCompras,
  exportarEntradasComprasExcel,
  exportarEntradasComprasPDF,
} from "./export/entradasComprasExport";

import LayoutRelatorio from "../../components/LayoutRelatorio";
import { normalizarTextoSemAparar } from "@/shared/lib/texto";
import "./EntradasComprasMateriaPrima.css";
import {
  formatarNumero,
  formatarKg,
  formatarMoeda,
  criarFiltrosIniciais,
  combinaSituacao,
  opcoesUnicas,
  obterDataReferencia,
  montarTextoFiltros,
} from "./entradasCompras.regras";
import TabelaEntradasCompras from "./components/TabelaEntradasCompras";

const ITENS_POR_PAGINA = 10;

/* =========================================================
   RELATÓRIO
========================================================= */

export default function EntradasComprasMateriaPrima({ relatorio }) {
  const [filtros, setFiltros] = useState(criarFiltrosIniciais);

  const [visualizacaoAberta, setVisualizacaoAberta] = useState(false);

  const [exportando, setExportando] = useState(null);

  const [paginaAtual, setPaginaAtual] = useState(1);

  const { dados, carregando, atualizando, erro } = useEntradasComprasMateriaPrima();

  const periodoInvalido = Boolean(
    filtros.dataInicio && filtros.dataFim && filtros.dataFim < filtros.dataInicio,
  );

  /* =======================================================
     OPÇÕES EM CASCATA
     Situação → Material → Fornecedor: cada filtro mostra só o
     que existe com as escolhas anteriores.
  ======================================================= */

  const opcoesMateriais = useMemo(
    () =>
      opcoesUnicas(
        dados.registros.filter((registro) => combinaSituacao(registro, filtros.situacao)),
        "materialId",
        "material",
      ),
    [dados.registros, filtros.situacao],
  );

  const opcoesFornecedores = useMemo(
    () =>
      opcoesUnicas(
        dados.registros.filter(
          (registro) =>
            combinaSituacao(registro, filtros.situacao) &&
            (filtros.materialId === "TODOS" ||
              String(registro.materialId) === String(filtros.materialId)),
        ),
        "fornecedorId",
        "fornecedor",
      ),
    [dados.registros, filtros.situacao, filtros.materialId],
  );

  /* Escolha que deixou de existir volta para "Todos". */
  useEffect(() => {
    if (carregando) return;
    const temMaterial =
      filtros.materialId === "TODOS" ||
      opcoesMateriais.some((item) => String(item.id) === String(filtros.materialId));
    const temFornecedor =
      filtros.fornecedorId === "TODOS" ||
      opcoesFornecedores.some((item) => String(item.id) === String(filtros.fornecedorId));
    if (temMaterial && temFornecedor) return;
    setFiltros((atuais) => ({
      ...atuais,
      ...(temMaterial ? {} : { materialId: "TODOS" }),
      ...(temFornecedor ? {} : { fornecedorId: "TODOS" }),
    }));
  }, [carregando, filtros.materialId, filtros.fornecedorId, opcoesMateriais, opcoesFornecedores]);

  /* =======================================================
     FILTRAGEM
  ======================================================= */

  const filtrados = useMemo(() => {
    if (periodoInvalido) {
      return [];
    }

    const termo = normalizarTextoSemAparar(filtros.busca);

    return dados.registros.filter((registro) => {
      if (filtros.situacao === "RECEBIDAS" && registro.situacao !== "RECEBIDA") {
        return false;
      }

      if (filtros.situacao === "FUTURAS" && registro.situacao !== "FUTURA") {
        return false;
      }

      if (filtros.situacao === "ENCERRADAS" && registro.situacao !== "ENCERRADA") {
        return false;
      }

      if (
        filtros.fornecedorId !== "TODOS" &&
        String(registro.fornecedorId) !== String(filtros.fornecedorId)
      ) {
        return false;
      }

      if (
        filtros.materialId !== "TODOS" &&
        String(registro.materialId) !== String(filtros.materialId)
      ) {
        return false;
      }

      if (termo) {
        const conteudoBusca = normalizarTextoSemAparar(
          [registro.pedido, registro.numeroNf, registro.fornecedor, registro.material].join(" "),
        );

        if (!conteudoBusca.includes(termo)) {
          return false;
        }
      }

      if (filtros.dataInicio || filtros.dataFim) {
        const data = obterDataReferencia(registro, filtros.dataReferencia);

        if (!data) {
          return false;
        }

        if (filtros.dataInicio && data < filtros.dataInicio) {
          return false;
        }

        if (filtros.dataFim && data > filtros.dataFim) {
          return false;
        }
      }

      return true;
    });
  }, [dados.registros, filtros, periodoInvalido]);

  /* =======================================================
     TOTAIS DINÂMICOS
  ======================================================= */

  const resumo = useMemo(
    () => ({
      registros: filtrados.length,

      quantidadeKg: filtrados.reduce(
        (total, registro) => total + Number(registro.quantidadeKg ?? 0),
        0,
      ),

      valorTotal: filtrados.reduce((total, registro) => total + Number(registro.total ?? 0), 0),
    }),
    [filtrados],
  );

  const textoFiltros = useMemo(() => montarTextoFiltros(filtros, dados), [filtros, dados]);

  const dadosExportacao = useMemo(
    () => criarDadosExportacaoEntradasCompras(filtrados, resumo),
    [filtrados, resumo],
  );

  const relatorioExportacao = useMemo(
    () => ({
      ...relatorio,

      id: "materia-prima-entradas-compras",

      categoria: relatorio?.categoria || "Matéria-Prima",

      titulo: relatorio?.titulo || "Entradas e Compras de Matéria-Prima",

      descricao:
        relatorio?.descricao || "Consolida materiais recebidos e compras futuras de matéria-prima.",

      colunas: [
        "pedido",
        "recebido",
        "emissao",
        "previsao_recebimento",
        "fornecedor_mp",
        "material_mp",
        "quantidade_kg",
        "preco",
        "ipi",
        "total",
      ],
    }),
    [relatorio],
  );

  /* =======================================================
     PAGINAÇÃO
  ======================================================= */

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / ITENS_POR_PAGINA));

  const paginaValida = Math.min(paginaAtual, totalPaginas);

  const inicio = (paginaValida - 1) * ITENS_POR_PAGINA;

  const registrosPagina = useMemo(
    () => filtrados.slice(inicio, inicio + ITENS_POR_PAGINA),
    [filtrados, inicio],
  );

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtros]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  function alterarFiltro(campo, valor) {
    setFiltros((atuais) => ({
      ...atuais,
      [campo]: valor,
    }));
  }

  function limparFiltros() {
    setFiltros(criarFiltrosIniciais());
  }

  /* =======================================================
     EXPORTAÇÃO PDF
  ======================================================= */

  async function exportarPDF() {
    if (filtrados.length === 0 || exportando || periodoInvalido) {
      return;
    }

    try {
      setExportando("pdf");

      await exportarEntradasComprasPDF({
        relatorio: relatorioExportacao,

        dados: dadosExportacao,

        textoFiltros,
      });
    } catch (errorExportacao) {
      console.error("Erro ao exportar Entradas e Compras em PDF:", errorExportacao);

      window.alert("Não foi possível gerar o PDF.");
    } finally {
      setExportando(null);
    }
  }

  /* =======================================================
     EXPORTAÇÃO EXCEL
  ======================================================= */

  async function exportarExcel() {
    if (filtrados.length === 0 || exportando || periodoInvalido) {
      return;
    }

    try {
      setExportando("excel");

      await exportarEntradasComprasExcel({
        relatorio: relatorioExportacao,

        dados: dadosExportacao,

        textoFiltros,
      });
    } catch (errorExportacao) {
      console.error("Erro ao exportar Entradas e Compras em Excel:", errorExportacao);

      window.alert("Não foi possível gerar o Excel.");
    } finally {
      setExportando(null);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <LayoutRelatorio
      relatorio={relatorio}
      categoria={relatorio?.categoria || "Matéria-Prima"}
      titulo={relatorio?.titulo || "Entradas e Compras de Matéria-Prima"}
      descricao={
        relatorio?.descricao ||
        "Consolida materiais recebidos e compras futuras com filtros e totalização dinâmica."
      }
      fixo
      filtros={
        <div className="entradas-compras-filtros">
          <label>
            <span>De</span>

            <input
              type="date"
              value={filtros.dataInicio}
              max={filtros.dataFim || undefined}
              onChange={(event) => alterarFiltro("dataInicio", event.target.value)}
            />
          </label>

          <label>
            <span>Até</span>

            <input
              type="date"
              value={filtros.dataFim}
              min={filtros.dataInicio || undefined}
              onChange={(event) => alterarFiltro("dataFim", event.target.value)}
            />
          </label>

          <label>
            <span>Período por</span>

            <select
              value={filtros.dataReferencia}
              onChange={(event) => alterarFiltro("dataReferencia", event.target.value)}
            >
              {DATAS_REFERENCIA_ENTRADAS_COMPRAS.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Situação</span>

            <select
              value={filtros.situacao}
              onChange={(event) => alterarFiltro("situacao", event.target.value)}
            >
              {SITUACOES_ENTRADAS_COMPRAS.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Material</span>

            <select
              value={filtros.materialId}
              onChange={(event) => alterarFiltro("materialId", event.target.value)}
            >
              <option value="TODOS">Todos</option>

              {opcoesMateriais.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Fornecedor</span>

            <select
              value={filtros.fornecedorId}
              onChange={(event) => alterarFiltro("fornecedorId", event.target.value)}
            >
              <option value="TODOS">Todos</option>

              {opcoesFornecedores.map((fornecedor) => (
                <option key={fornecedor.id} value={fornecedor.id}>
                  {fornecedor.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="entradas-compras-busca">
            <span>Buscar</span>

            <div>
              <FiSearch />

              <input
                type="search"
                value={filtros.busca}
                onChange={(event) => alterarFiltro("busca", event.target.value)}
                placeholder="Pedido, NF, fornecedor..."
              />
            </div>
          </label>

          {atualizando && (
            <span className="entradas-compras-atualizando">
              <FiRefreshCw className="entradas-compras-girando" />
              Atualizando dados...
            </span>
          )}
        </div>
      }
      acoes={{
        onVisualizar: () => {
          setPaginaAtual(1);
          setVisualizacaoAberta(true);
        },
        onPdf: exportarPDF,
        onExcel: exportarExcel,
        onLimpar: limparFiltros,
        limparDesabilitado: JSON.stringify(filtros) === JSON.stringify(criarFiltrosIniciais()),
        desabilitado: filtrados.length === 0 || periodoInvalido || Boolean(exportando),
        gerandoPdf: exportando === "pdf",
        gerandoExcel: exportando === "excel",
      }}
      indicadores={[
        {
          rotulo: "Registros",
          valor: carregando ? "..." : formatarNumero(resumo.registros),
        },
        {
          rotulo: "Quantidade total",
          valor: carregando ? "..." : formatarKg(resumo.quantidadeKg),
        },
        {
          rotulo: "Valor total",
          valor: carregando ? "..." : formatarMoeda(resumo.valorTotal),
          destaque: true,
        },
      ]}
    >
      {/* =================================================
          ESTADOS
      ================================================= */}

      {periodoInvalido && (
        <div className="entradas-compras-mensagem entradas-compras-mensagem-erro">
          <FiAlertTriangle />

          <span>A data final não pode ser anterior à data inicial.</span>
        </div>
      )}

      {erro && (
        <div className="entradas-compras-mensagem entradas-compras-mensagem-erro">
          <FiAlertTriangle />

          <span>{erro}</span>
        </div>
      )}

      {/* =================================================
          VISUALIZAÇÃO
      ================================================= */}

      {visualizacaoAberta && (
        <section className="relatorio-visualizacao">
          <div className="relatorio-visualizacao-header">
            <div>
              <span className="relatorio-visualizacao-eyebrow">Pré-visualização</span>

              <h3>{relatorioExportacao.titulo}</h3>
            </div>

            <button
              type="button"
              className="relatorio-visualizacao-fechar"
              onClick={() => setVisualizacaoAberta(false)}
              aria-label="Fechar visualização"
            >
              <FiX />
            </button>
          </div>

          <div className="relatorio-visualizacao-info entradas-compras-visualizacao-info">
            <div className="relatorio-visualizacao-info-item entradas-compras-info-filtros">
              <span>Filtros</span>

              <strong>{textoFiltros}</strong>
            </div>

            <div className="relatorio-visualizacao-info-item">
              <span>Registros</span>

              <strong>{formatarNumero(resumo.registros)}</strong>
            </div>

            <div className="relatorio-visualizacao-info-item">
              <span>Quantidade total</span>

              <strong>{formatarKg(resumo.quantidadeKg)}</strong>
            </div>

            <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
              <span>Valor total</span>

              <strong>{formatarMoeda(resumo.valorTotal)}</strong>
            </div>
          </div>

          {carregando ? (
            <div className="relatorio-visualizacao-vazia">
              <FiRefreshCw className="entradas-compras-girando" />

              <strong>Carregando relatório...</strong>

              <span>Aguarde enquanto os dados são carregados.</span>
            </div>
          ) : filtrados.length > 0 ? (
            <TabelaEntradasCompras registros={registrosPagina} />
          ) : (
            <div className="relatorio-visualizacao-vazia">
              <FiFileText />

              <strong>Nenhum registro encontrado</strong>

              <span>Ajuste os filtros para visualizar os dados.</span>
            </div>
          )}

          <div className="relatorio-visualizacao-footer entradas-compras-footer">
            <span>{filtrados.length} registro(s)</span>

            <strong>Valor total filtrado: {formatarMoeda(resumo.valorTotal)}</strong>
          </div>

          {!carregando && filtrados.length > ITENS_POR_PAGINA && (
            <Paginacao
              paginaAtual={paginaValida}
              totalItens={filtrados.length}
              itensPorPagina={ITENS_POR_PAGINA}
              onChangePagina={setPaginaAtual}
            />
          )}
        </section>
      )}

      {!visualizacaoAberta && (
        <div className="rl-vazio">
          <strong>
            {filtrados.length > 0
              ? "Clique em Visualizar para conferir os dados"
              : carregando
                ? "Carregando dados..."
                : "Nenhum registro com os filtros atuais"}
          </strong>
          <span>
            {filtrados.length > 0
              ? "Ou baixe direto em PDF ou Excel."
              : "Ajuste os filtros para ver os dados."}
          </span>
        </div>
      )}
    </LayoutRelatorio>
  );
}
