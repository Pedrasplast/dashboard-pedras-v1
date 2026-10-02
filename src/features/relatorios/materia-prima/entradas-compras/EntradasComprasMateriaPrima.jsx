import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FiAlertTriangle,
  FiDownload,
  FiEye,
  FiFileText,
  FiRefreshCw,
  FiSearch,
  FiShoppingCart,
  FiX,
} from "react-icons/fi";

import Paginacao
  from "@/components/paginacao/Paginacao";

import {
  DATAS_REFERENCIA_ENTRADAS_COMPRAS,
  SITUACOES_ENTRADAS_COMPRAS,
} from "./services/entradasComprasMateriaPrimaService";

import useEntradasComprasMateriaPrima
  from "./hooks/useEntradasComprasMateriaPrima";

import {
  criarDadosExportacaoEntradasCompras,
  exportarEntradasComprasExcel,
  exportarEntradasComprasPDF,
} from "./export/entradasComprasExport";

import "./EntradasComprasMateriaPrima.css";


const ITENS_POR_PAGINA = 10;


/* =========================================================
   FORMATADORES
========================================================= */

function formatarData(valor) {
  if (!valor) {
    return "-";
  }

  const partes = String(valor).split("-");

  if (partes.length !== 3) {
    return String(valor);
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


function formatarNumero(
  valor,
  casas = 0,
) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "0";
  }

  return numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    },
  );
}


function formatarKg(valor) {
  return `${formatarNumero(valor, 3)} kg`;
}


function formatarMoeda(
  valor,
  casas = 2,
) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "-";
  }

  return numero.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    },
  );
}


function formatarPreco(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "-";
  }

  return `${formatarMoeda(valor, 3)}/kg`;
}


function formatarPercentual(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "-";
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "-";
  }

  return `${numero.toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  )}%`;
}


function normalizarTexto(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


/* =========================================================
   FILTROS
========================================================= */

function criarFiltrosIniciais() {
  return {
    dataInicio: "",
    dataFim: "",
    dataReferencia: "PREVISAO",
    situacao: "TODAS",
    fornecedorId: "TODOS",
    materialId: "TODOS",
    tipo: "TODOS",
    busca: "",
  };
}


function obterDataReferencia(
  registro,
  referencia,
) {
  if (referencia === "EMISSAO") {
    return registro.emissao;
  }

  if (referencia === "RECEBIMENTO") {
    return registro.recebido;
  }

  return registro.previsaoRecebimento;
}


function obterNomeOpcao(
  opcoes,
  valor,
) {
  return opcoes.find(
    (opcao) =>
      opcao.valor === valor,
  )?.nome || valor;
}


function montarTextoFiltros(
  filtros,
  dados,
) {
  const partes = [];

  const nomeReferencia = obterNomeOpcao(
    DATAS_REFERENCIA_ENTRADAS_COMPRAS,
    filtros.dataReferencia,
  );

  if (
    filtros.dataInicio ||
    filtros.dataFim
  ) {
    partes.push(
      `${nomeReferencia}: ${
        filtros.dataInicio
          ? formatarData(filtros.dataInicio)
          : "sem início"
      } até ${
        filtros.dataFim
          ? formatarData(filtros.dataFim)
          : "sem fim"
      }`,
    );
  } else {
    partes.push(
      `${nomeReferencia}: todos os períodos`,
    );
  }

  partes.push(
    `Situação: ${obterNomeOpcao(
      SITUACOES_ENTRADAS_COMPRAS,
      filtros.situacao,
    )}`,
  );

  if (filtros.fornecedorId !== "TODOS") {
    const fornecedor = dados.fornecedores.find(
      (item) =>
        String(item.id) ===
        String(filtros.fornecedorId),
    );

    partes.push(
      `Fornecedor: ${
        fornecedor?.nome ||
        filtros.fornecedorId
      }`,
    );
  }

  if (filtros.materialId !== "TODOS") {
    const material = dados.materiais.find(
      (item) =>
        String(item.id) ===
        String(filtros.materialId),
    );

    partes.push(
      `Material: ${
        material?.nome ||
        filtros.materialId
      }`,
    );
  }

  if (filtros.tipo !== "TODOS") {
    partes.push(
      `Tipo: ${filtros.tipo}`,
    );
  }

  if (String(filtros.busca).trim()) {
    partes.push(
      `Busca: ${String(filtros.busca).trim()}`,
    );
  }

  return partes.join(" | ");
}


/* =========================================================
   TABELA
========================================================= */

function TabelaRelatorio({
  registros,
}) {
  return (
    <div className="relatorio-visualizacao-tabela-wrapper entradas-compras-tabela-wrapper">
      <table className="relatorio-visualizacao-tabela entradas-compras-tabela">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Recebido</th>
            <th>Emissão</th>
            <th>Previsão de recebimento</th>
            <th>Fornecedor</th>
            <th>Material</th>
            <th>Tipo</th>
            <th className="coluna-numerica">
              Quantidade
            </th>
            <th className="coluna-numerica">
              Preço
            </th>
            <th className="coluna-numerica">
              IPI
            </th>
            <th className="coluna-numerica">
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {registros.map((registro) => (
            <tr key={registro.id}>
              <td>
                <strong className="entradas-compras-pedido">
                  {registro.pedido || "-"}
                </strong>
              </td>

              <td>
                {registro.situacao === "FUTURA"
                  ? (
                    <span className="entradas-compras-a-receber">
                      A receber
                    </span>
                  )
                  : formatarData(registro.recebido)}
              </td>

              <td>
                {formatarData(registro.emissao)}
              </td>

              <td>
                {formatarData(
                  registro.previsaoRecebimento,
                )}
              </td>

              <td>
                {registro.fornecedor || "-"}
              </td>

              <td>
                {registro.material || "-"}
              </td>

              <td>
                {registro.tipo || "-"}
              </td>

              <td className="coluna-numerica entradas-compras-numero">
                {formatarKg(registro.quantidadeKg)}
              </td>

              <td className="coluna-numerica entradas-compras-numero">
                {formatarPreco(registro.preco)}
              </td>

              <td className="coluna-numerica entradas-compras-numero">
                {formatarPercentual(
                  registro.ipiPercentual,
                )}
              </td>

              <td className="coluna-numerica entradas-compras-total">
                {formatarMoeda(registro.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


/* =========================================================
   RELATÓRIO
========================================================= */

export default function EntradasComprasMateriaPrima({
  relatorio,
}) {
  const [
    filtros,
    setFiltros,
  ] = useState(
    criarFiltrosIniciais,
  );

  const [
    visualizacaoAberta,
    setVisualizacaoAberta,
  ] = useState(false);

  const [
    exportando,
    setExportando,
  ] = useState(null);

  const [
    paginaAtual,
    setPaginaAtual,
  ] = useState(1);

  const {
    dados,
    carregando,
    atualizando,
    erro,
  } = useEntradasComprasMateriaPrima();

  const periodoInvalido = Boolean(
    filtros.dataInicio &&
    filtros.dataFim &&
    filtros.dataFim < filtros.dataInicio,
  );


  /* =======================================================
     FILTRAGEM
  ======================================================= */

  const filtrados = useMemo(() => {
    if (periodoInvalido) {
      return [];
    }

    const termo = normalizarTexto(
      filtros.busca,
    );

    return dados.registros.filter((registro) => {
      if (
        filtros.situacao === "RECEBIDAS" &&
        registro.situacao !== "RECEBIDA"
      ) {
        return false;
      }

      if (
        filtros.situacao === "FUTURAS" &&
        registro.situacao !== "FUTURA"
      ) {
        return false;
      }

      if (
        filtros.fornecedorId !== "TODOS" &&
        String(registro.fornecedorId) !==
          String(filtros.fornecedorId)
      ) {
        return false;
      }

      if (
        filtros.materialId !== "TODOS" &&
        String(registro.materialId) !==
          String(filtros.materialId)
      ) {
        return false;
      }

      if (
        filtros.tipo !== "TODOS" &&
        String(registro.tipo) !==
          String(filtros.tipo)
      ) {
        return false;
      }

      if (termo) {
        const conteudoBusca = normalizarTexto(
          [
            registro.pedido,
            registro.numeroNf,
            registro.fornecedor,
            registro.material,
            registro.tipo,
          ].join(" "),
        );

        if (!conteudoBusca.includes(termo)) {
          return false;
        }
      }

      if (
        filtros.dataInicio ||
        filtros.dataFim
      ) {
        const data = obterDataReferencia(
          registro,
          filtros.dataReferencia,
        );

        if (!data) {
          return false;
        }

        if (
          filtros.dataInicio &&
          data < filtros.dataInicio
        ) {
          return false;
        }

        if (
          filtros.dataFim &&
          data > filtros.dataFim
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    dados.registros,
    filtros,
    periodoInvalido,
  ]);


  /* =======================================================
     TOTAIS DINÂMICOS
  ======================================================= */

  const resumo = useMemo(
    () => ({
      registros:
        filtrados.length,

      quantidadeKg:
        filtrados.reduce(
          (total, registro) =>
            total +
            Number(
              registro.quantidadeKg ?? 0,
            ),
          0,
        ),

      valorTotal:
        filtrados.reduce(
          (total, registro) =>
            total +
            Number(
              registro.total ?? 0,
            ),
          0,
        ),
    }),
    [filtrados],
  );


  const textoFiltros = useMemo(
    () =>
      montarTextoFiltros(
        filtros,
        dados,
      ),
    [
      filtros,
      dados,
    ],
  );


  const dadosExportacao = useMemo(
    () =>
      criarDadosExportacaoEntradasCompras(
        filtrados,
        resumo,
      ),
    [
      filtrados,
      resumo,
    ],
  );


  const relatorioExportacao = useMemo(
    () => ({
      ...relatorio,

      id:
        "materia-prima-entradas-compras",

      categoria:
        relatorio?.categoria ||
        "Matéria-Prima",

      titulo:
        relatorio?.titulo ||
        "Entradas e Compras de Matéria-Prima",

      descricao:
        relatorio?.descricao ||
        "Consolida materiais recebidos e compras futuras de matéria-prima.",

      colunas: [
        "pedido",
        "recebido",
        "emissao",
        "previsao_recebimento",
        "fornecedor_mp",
        "material_mp",
        "tipo",
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

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      filtrados.length /
        ITENS_POR_PAGINA,
    ),
  );

  const paginaValida = Math.min(
    paginaAtual,
    totalPaginas,
  );

  const inicio =
    (paginaValida - 1) *
    ITENS_POR_PAGINA;

  const registrosPagina = useMemo(
    () =>
      filtrados.slice(
        inicio,
        inicio + ITENS_POR_PAGINA,
      ),
    [
      filtrados,
      inicio,
    ],
  );


  useEffect(() => {
    setPaginaAtual(1);
  }, [filtros]);


  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [
    paginaAtual,
    totalPaginas,
  ]);


  function alterarFiltro(
    campo,
    valor,
  ) {
    setFiltros((atuais) => ({
      ...atuais,
      [campo]: valor,
    }));
  }


  function limparFiltros() {
    setFiltros(
      criarFiltrosIniciais(),
    );
  }


  /* =======================================================
     EXPORTAÇÃO PDF
  ======================================================= */

  async function exportarPDF() {
    if (
      filtrados.length === 0 ||
      exportando ||
      periodoInvalido
    ) {
      return;
    }

    try {
      setExportando("pdf");

      await exportarEntradasComprasPDF({
        relatorio:
          relatorioExportacao,

        dados:
          dadosExportacao,

        textoFiltros,
      });
    } catch (errorExportacao) {
      console.error(
        "Erro ao exportar Entradas e Compras em PDF:",
        errorExportacao,
      );

      window.alert(
        "Não foi possível gerar o PDF.",
      );
    } finally {
      setExportando(null);
    }
  }


  /* =======================================================
     EXPORTAÇÃO EXCEL
  ======================================================= */

  async function exportarExcel() {
    if (
      filtrados.length === 0 ||
      exportando ||
      periodoInvalido
    ) {
      return;
    }

    try {
      setExportando("excel");

      await exportarEntradasComprasExcel({
        relatorio:
          relatorioExportacao,

        dados:
          dadosExportacao,

        textoFiltros,
      });
    } catch (errorExportacao) {
      console.error(
        "Erro ao exportar Entradas e Compras em Excel:",
        errorExportacao,
      );

      window.alert(
        "Não foi possível gerar o Excel.",
      );
    } finally {
      setExportando(null);
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <div className="relatorio-selecionado-header">
        <div className="relatorio-selecionado-icone">
          <FiShoppingCart />
        </div>

        <div>
          <span className="relatorio-selecionado-categoria">
            {relatorio?.categoria ||
              "Matéria-Prima"}
          </span>

          <h2>
            {relatorio?.titulo ||
              "Entradas e Compras de Matéria-Prima"}
          </h2>

          <p>
            {relatorio?.descricao ||
              "Consolida materiais recebidos e compras futuras com filtros e totalização dinâmica."}
          </p>
        </div>
      </div>


      {/* =================================================
          AÇÕES
      ================================================= */}

      <div className="relatorio-acoes">
        <button
          type="button"
          className="btn-relatorio"
          onClick={() => {
            setPaginaAtual(1);
            setVisualizacaoAberta(true);
          }}
          disabled={
            filtrados.length === 0 ||
            periodoInvalido
          }
        >
          <FiEye />

          <div>
            <strong>Visualizar</strong>
            <span>
              Conferir antes de exportar
            </span>
          </div>
        </button>


        <button
          type="button"
          className="btn-relatorio btn-relatorio-pdf"
          onClick={exportarPDF}
          disabled={
            filtrados.length === 0 ||
            periodoInvalido ||
            Boolean(exportando)
          }
        >
          {exportando === "pdf" ? (
            <FiRefreshCw className="entradas-compras-girando" />
          ) : (
            <FiFileText />
          )}

          <div>
            <strong>Baixar PDF</strong>
            <span>
              Relatório formatado
            </span>
          </div>
        </button>


        <button
          type="button"
          className="btn-relatorio btn-relatorio-csv"
          onClick={exportarExcel}
          disabled={
            filtrados.length === 0 ||
            periodoInvalido ||
            Boolean(exportando)
          }
        >
          {exportando === "excel" ? (
            <FiRefreshCw className="entradas-compras-girando" />
          ) : (
            <FiDownload />
          )}

          <div>
            <strong>
              Exportar Excel
            </strong>

            <span>
              Tabela XLSX
            </span>
          </div>
        </button>
      </div>


      {/* =================================================
          FILTROS
      ================================================= */}

      <div className="relatorio-filtros-card">
        <div className="relatorio-filtros-header entradas-compras-filtros-header">
          <div>
            <h3>
              Parâmetros do relatório
            </h3>

            <p>
              Quantidade e valor total são recalculados conforme os filtros.
            </p>
          </div>

          <button
            type="button"
            className="entradas-compras-limpar"
            onClick={limparFiltros}
          >
            Limpar filtros
          </button>
        </div>


        <div className="entradas-compras-filtros">
          <label>
            <span>De</span>

            <input
              type="date"
              value={filtros.dataInicio}
              max={
                filtros.dataFim ||
                undefined
              }
              onChange={(event) =>
                alterarFiltro(
                  "dataInicio",
                  event.target.value,
                )
              }
            />
          </label>


          <label>
            <span>Até</span>

            <input
              type="date"
              value={filtros.dataFim}
              min={
                filtros.dataInicio ||
                undefined
              }
              onChange={(event) =>
                alterarFiltro(
                  "dataFim",
                  event.target.value,
                )
              }
            />
          </label>


          <label>
            <span>
              Período por
            </span>

            <select
              value={filtros.dataReferencia}
              onChange={(event) =>
                alterarFiltro(
                  "dataReferencia",
                  event.target.value,
                )
              }
            >
              {DATAS_REFERENCIA_ENTRADAS_COMPRAS.map(
                (opcao) => (
                  <option
                    key={opcao.valor}
                    value={opcao.valor}
                  >
                    {opcao.nome}
                  </option>
                ),
              )}
            </select>
          </label>


          <label>
            <span>Situação</span>

            <select
              value={filtros.situacao}
              onChange={(event) =>
                alterarFiltro(
                  "situacao",
                  event.target.value,
                )
              }
            >
              {SITUACOES_ENTRADAS_COMPRAS.map(
                (opcao) => (
                  <option
                    key={opcao.valor}
                    value={opcao.valor}
                  >
                    {opcao.nome}
                  </option>
                ),
              )}
            </select>
          </label>


          <label>
            <span>
              Fornecedor
            </span>

            <select
              value={filtros.fornecedorId}
              onChange={(event) =>
                alterarFiltro(
                  "fornecedorId",
                  event.target.value,
                )
              }
            >
              <option value="TODOS">
                Todos
              </option>

              {dados.fornecedores.map(
                (fornecedor) => (
                  <option
                    key={fornecedor.id}
                    value={fornecedor.id}
                  >
                    {fornecedor.nome}
                  </option>
                ),
              )}
            </select>
          </label>


          <label>
            <span>Material</span>

            <select
              value={filtros.materialId}
              onChange={(event) =>
                alterarFiltro(
                  "materialId",
                  event.target.value,
                )
              }
            >
              <option value="TODOS">
                Todos
              </option>

              {dados.materiais.map(
                (material) => (
                  <option
                    key={material.id}
                    value={material.id}
                  >
                    {material.nome}
                  </option>
                ),
              )}
            </select>
          </label>


          <label>
            <span>Tipo</span>

            <select
              value={filtros.tipo}
              onChange={(event) =>
                alterarFiltro(
                  "tipo",
                  event.target.value,
                )
              }
            >
              <option value="TODOS">
                Todos
              </option>

              {dados.tipos.map((tipo) => (
                <option
                  key={tipo}
                  value={tipo}
                >
                  {tipo}
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
                onChange={(event) =>
                  alterarFiltro(
                    "busca",
                    event.target.value,
                  )
                }
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
      </div>


      {/* =================================================
          ESTADOS
      ================================================= */}

      {periodoInvalido && (
        <div className="entradas-compras-mensagem entradas-compras-mensagem-erro">
          <FiAlertTriangle />

          <span>
            A data final não pode ser anterior à data inicial.
          </span>
        </div>
      )}


      {erro && (
        <div className="entradas-compras-mensagem entradas-compras-mensagem-erro">
          <FiAlertTriangle />

          <span>
            {erro}
          </span>
        </div>
      )}


      {/* =================================================
          RESUMO DINÂMICO
      ================================================= */}

      <div className="relatorio-resumo-grid entradas-compras-resumo">
        <div className="relatorio-resumo-card">
          <span>
            Registros
          </span>

          <strong>
            {carregando
              ? "..."
              : formatarNumero(
                  resumo.registros,
                )}
          </strong>
        </div>


        <div className="relatorio-resumo-card">
          <span>
            Quantidade total
          </span>

          <strong>
            {carregando
              ? "..."
              : formatarKg(
                  resumo.quantidadeKg,
                )}
          </strong>
        </div>


        <div className="relatorio-resumo-card">
          <span>
            Valor total
          </span>

          <strong className="entradas-compras-resumo-total">
            {carregando
              ? "..."
              : formatarMoeda(
                  resumo.valorTotal,
                )}
          </strong>
        </div>
      </div>


      {/* =================================================
          VISUALIZAÇÃO
      ================================================= */}

      {visualizacaoAberta && (
        <section className="relatorio-visualizacao">
          <div className="relatorio-visualizacao-header">
            <div>
              <span className="relatorio-visualizacao-eyebrow">
                Pré-visualização
              </span>

              <h3>
                {relatorioExportacao.titulo}
              </h3>
            </div>

            <button
              type="button"
              className="relatorio-visualizacao-fechar"
              onClick={() =>
                setVisualizacaoAberta(false)
              }
              aria-label="Fechar visualização"
            >
              <FiX />
            </button>
          </div>


          <div className="relatorio-visualizacao-info entradas-compras-visualizacao-info">
            <div className="relatorio-visualizacao-info-item entradas-compras-info-filtros">
              <span>
                Filtros
              </span>

              <strong>
                {textoFiltros}
              </strong>
            </div>


            <div className="relatorio-visualizacao-info-item">
              <span>
                Registros
              </span>

              <strong>
                {formatarNumero(
                  resumo.registros,
                )}
              </strong>
            </div>


            <div className="relatorio-visualizacao-info-item">
              <span>
                Quantidade total
              </span>

              <strong>
                {formatarKg(
                  resumo.quantidadeKg,
                )}
              </strong>
            </div>


            <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
              <span>
                Valor total
              </span>

              <strong>
                {formatarMoeda(
                  resumo.valorTotal,
                )}
              </strong>
            </div>
          </div>


          {carregando ? (
            <div className="relatorio-visualizacao-vazia">
              <FiRefreshCw className="entradas-compras-girando" />

              <strong>
                Carregando relatório...
              </strong>

              <span>
                Aguarde enquanto os dados são carregados.
              </span>
            </div>
          ) : filtrados.length > 0 ? (
            <TabelaRelatorio
              registros={registrosPagina}
            />
          ) : (
            <div className="relatorio-visualizacao-vazia">
              <FiFileText />

              <strong>
                Nenhum registro encontrado
              </strong>

              <span>
                Ajuste os filtros para visualizar os dados.
              </span>
            </div>
          )}


          <div className="relatorio-visualizacao-footer entradas-compras-footer">
            <span>
              {filtrados.length} registro(s)
            </span>

            <strong>
              Valor total filtrado:{" "}
              {formatarMoeda(
                resumo.valorTotal,
              )}
            </strong>
          </div>


          {!carregando &&
            filtrados.length >
              ITENS_POR_PAGINA && (
              <Paginacao
                paginaAtual={paginaValida}
                totalItens={filtrados.length}
                itensPorPagina={ITENS_POR_PAGINA}
                onChangePagina={setPaginaAtual}
              />
            )}
        </section>
      )}
    </>
  );
}