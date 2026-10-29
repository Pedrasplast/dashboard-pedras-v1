import { useMemo, useState } from "react";

import { FiAlertTriangle, FiEdit3, FiSearch } from "react-icons/fi";

/*
 * A ordem dos imports define a ordem do CSS: ResultadosPedidosCompra traz o
 * Paginacao.css, que precisa vir antes do LayoutRelatorio.css (como era antes).
 */
import ResultadosPedidosCompra from "./components/ResultadosPedidosCompra";
import LayoutRelatorio from "../components/LayoutRelatorio";

import IndicadorSincronizacao from "./components/IndicadorSincronizacao";
import {
  dataBR,
  dataHoje,
  filtrarPedidosCompra,
  inicioDoMes,
} from "./pedidosCompraAlterados.regras";
import { useDadosPedidosCompraAlterados } from "./useDadosPedidosCompraAlterados";

// Usa as mesmas classes e o mesmo CSS do relatório de Pedidos Alterados.
import "../pedidos-alterados/PedidosAlteradosRelatorio.css";

const POR_PAGINA = 8;

export default function PedidosCompraAlteradosRelatorio({ relatorio }) {
  const [dataInicial, setDataInicial] = useState(() => inicioDoMes(dataHoje()));

  const [dataFinal, setDataFinal] = useState(dataHoje);

  const [pesquisa, setPesquisa] = useState("");

  const [pagina, setPagina] = useState(1);

  const [abertos, setAbertos] = useState(() => new Set());

  const [exportando, setExportando] = useState("");

  const periodoValido = !dataInicial || !dataFinal || dataInicial <= dataFinal;

  const { historico, sincronizacao, fornecedoresQuery, nomesFornecedores, referencias, pedidos } =
    useDadosPedidosCompraAlterados({ dataInicial, dataFinal, periodoValido });

  const filtrados = useMemo(
    () => filtrarPedidosCompra(pedidos, pesquisa, nomesFornecedores),
    [pedidos, pesquisa, nomesFornecedores],
  );

  /* Período padrão: do dia 1 do mês até hoje (Brasília). */
  const hoje = dataHoje();

  const inicioPadrao = inicioDoMes(hoje);

  /* =====================================================
     PAGINAÇÃO E INDICADORES
  ===================================================== */

  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));

  const paginaAtual = Math.min(Math.max(1, pagina), paginas);

  const paginaPedidos = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  const totalEventos = filtrados.reduce((soma, pedido) => soma + pedido.quantidade_alteracoes, 0);

  const periodo = `${dataBR(dataInicial)} até ` + dataBR(dataFinal);

  function alternar(codigo) {
    setAbertos((atual) => {
      const novo = new Set(atual);

      if (novo.has(codigo)) {
        novo.delete(codigo);
      } else {
        novo.add(codigo);
      }

      return novo;
    });
  }

  async function exportar(tipo) {
    if (exportando || !filtrados.length) {
      return;
    }

    setExportando(tipo);

    try {
      const modulo = await import("./ExportarPedidosCompraAlterados.js");

      if (tipo === "pdf") {
        await modulo.exportarPdfPedidosCompraAlterados(filtrados, periodo, referencias);
      } else {
        await modulo.exportarExcelPedidosCompraAlterados(filtrados, periodo, referencias);
      }
    } catch (error) {
      console.error("Falha ao exportar relatório de compras:", error.message);

      window.alert("Não foi possível exportar o relatório. Confira o console para detalhes.");
    } finally {
      setExportando("");
    }
  }

  const exibirResultados = !historico.isLoading && !historico.error && periodoValido;

  return (
    <>
      <LayoutRelatorio
        relatorio={relatorio}
        categoria="Compras"
        titulo={relatorio?.titulo || "Pedidos de Compra Alterados"}
        descricao="Histórico das alterações relevantes detectadas entre sincronizações do Omie."
        fixo
        extrasCabecalho={
          <IndicadorSincronizacao
            dados={sincronizacao.data}
            carregando={sincronizacao.isLoading}
            erro={sincronizacao.error}
          />
        }
        filtrosAtivos={
          (dataInicial !== inicioPadrao ? 1 : 0) +
          (dataFinal !== hoje ? 1 : 0) +
          (pesquisa.trim() ? 1 : 0)
        }
        filtros={
          <div className="pedidos-alterados-filtros">
            <label className="pedidos-alterados-campo">
              <span>De</span>

              <input
                type="date"
                value={dataInicial}
                max={dataFinal || undefined}
                onChange={(e) => {
                  setDataInicial(e.target.value);
                  setPagina(1);
                }}
              />
            </label>

            <label className="pedidos-alterados-campo">
              <span>Até</span>

              <input
                type="date"
                value={dataFinal}
                min={dataInicial || undefined}
                onChange={(e) => {
                  setDataFinal(e.target.value);
                  setPagina(1);
                }}
              />
            </label>

            <label className="pedidos-alterados-campo pedidos-alterados-pesquisa-campo">
              <span>Buscar</span>

              <div className="pedidos-alterados-pesquisa">
                <FiSearch />

                <input
                  type="text"
                  value={pesquisa}
                  placeholder="Pedido, fornecedor, campo ou valor..."
                  onChange={(e) => {
                    setPesquisa(e.target.value);
                    setPagina(1);
                  }}
                />
              </div>
            </label>
          </div>
        }
        acoes={{
          onPdf: () => exportar("pdf"),
          onExcel: () => exportar("excel"),
          onLimpar: () => {
            const hojeAoLimpar = dataHoje();
            setDataInicial(inicioDoMes(hojeAoLimpar));
            setDataFinal(hojeAoLimpar);
            setPesquisa("");
            setPagina(1);
          },
          limparDesabilitado:
            dataInicial === inicioPadrao && dataFinal === hoje && !pesquisa.trim(),
          desabilitado: !filtrados.length || Boolean(exportando),
          gerandoPdf: exportando === "pdf",
          gerandoExcel: exportando === "excel",
        }}
        indicadores={[
          {
            rotulo: "Pedidos alterados",
            valor: filtrados.length.toLocaleString("pt-BR"),
            destaque: true,
          },
          { rotulo: "Alterações", valor: Number(totalEventos || 0).toLocaleString("pt-BR") },
          { rotulo: "Período", valor: periodo, texto: true },
        ]}
      >
        {/* AVISO DE FORNECEDORES */}

        {fornecedoresQuery.error && (
          <div className="relatorios-erro" role="alert">
            <FiAlertTriangle />

            <span>
              Não foi possível consultar os nomes dos fornecedores. Os pedidos continuam
              disponíveis, mas alguns fornecedores podem aparecer como não identificados.
            </span>
          </div>
        )}

        {!fornecedoresQuery.error && fornecedoresQuery.data?.pendentes > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "10px 14px",
              marginBottom: 12,
              border: "1px solid #fde68a",
              borderRadius: 10,
              background: "#fffbeb",
              color: "#92400e",
              fontSize: 12,
            }}
          >
            <FiAlertTriangle
              style={{
                flexShrink: 0,
              }}
            />

            <span>
              {fornecedoresQuery.data.pendentes} fornecedor(es) ainda não identificado(s) no
              cadastro do Omie.
            </span>
          </div>
        )}

        {/* ERROS DO RELATÓRIO */}

        {!periodoValido && (
          <div className="relatorios-erro">A data inicial não pode ser posterior à data final.</div>
        )}

        {historico.error && (
          <div className="relatorios-erro pedidos-alterados-erro">
            <FiAlertTriangle />

            <span>{historico.error.message}</span>
          </div>
        )}

        {historico.isLoading && (
          <div className="relatorios-loading pedidos-alterados-loading">
            Carregando alterações dos pedidos de compra...
          </div>
        )}

        {exibirResultados && filtrados.length > 0 && (
          <ResultadosPedidosCompra
            periodo={periodo}
            filtrados={filtrados}
            pedidosPagina={paginaPedidos}
            paginaAtual={paginaAtual}
            porPagina={POR_PAGINA}
            totalEventos={totalEventos}
            abertos={abertos}
            nomesFornecedores={nomesFornecedores}
            consultandoFornecedores={fornecedoresQuery.isLoading && !fornecedoresQuery.data}
            onAlternar={alternar}
            onMudarPagina={setPagina}
          />
        )}

        {exibirResultados && filtrados.length === 0 && (
          <div className="rl-vazio pedidos-alterados-vazio">
            <FiEdit3 />

            <strong>Nenhuma alteração detectada neste período</strong>

            <span>As alterações relevantes aparecerão aqui após a sincronização automática.</span>
          </div>
        )}
      </LayoutRelatorio>
    </>
  );
}
