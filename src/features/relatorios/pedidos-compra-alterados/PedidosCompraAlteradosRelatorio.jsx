import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiSearch,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";

import Paginacao from "@/components/paginacao/Paginacao";
import { supabase } from "@/lib/supabaseClient";

import {
  extrairMudancasCompra,
  protegerDadosPagamento,
} from "./formatarHistoricoCompras";

import "../pedidos-alterados/PedidosAlteradosRelatorio.css";
import "./PedidosCompraAlteradosRelatorio.css";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const POR_PAGINA = 8;
const FUSO = "America/Sao_Paulo";
const FORNECEDORES_VAZIOS = Object.freeze({});

/* =========================================================
   DATAS
========================================================= */

function dataHoje() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const ler = (tipo) =>
    partes.find((p) => p.type === tipo)?.value || "00";

  return `${ler("year")}-${ler("month")}-${ler("day")}`;
}

function dataBR(valor) {
  return valor
    ? valor.split("-").reverse().join("/")
    : "Sem limite";
}

function dataHora(valor) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return data.toLocaleString("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function normalizar(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* =========================================================
   CONSULTAR HISTÓRICO
========================================================= */

async function buscarHistorico(inicial, final) {
  const { data, error } = await supabase.rpc(
    "listar_relatorio_pedidos_compra_alterados",
    {
      p_data_inicial: inicial || null,
      p_data_final: final || null,
      p_limite: 2000,
    }
  );

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

/* =========================================================
   CONSULTAR SINCRONIZAÇÃO
========================================================= */

async function buscarSincronizacao() {
  const { data, error } = await supabase
    .from("sincronizacao_pedidos_compra_omie")
    .select(
      [
        "status",
        "finalizado_em",
        "atualizado_em",
        "pagina_proxima",
        "mensagem",
      ].join(",")
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   CONSULTAR NOMES DOS FORNECEDORES
========================================================= */

async function buscarNomesFornecedores() {
  const { data, error } = await supabase.functions.invoke(
    "nomes-fornecedores-pedidos-compra",
    {
      body: {},
    }
  );

  if (error) {
    throw error;
  }

  if (
    !data ||
    !data.fornecedores ||
    typeof data.fornecedores !== "object" ||
    Array.isArray(data.fornecedores)
  ) {
    throw new Error(
      "A consulta não retornou os nomes dos fornecedores."
    );
  }

  return {
    nomes: data.fornecedores,

    pendentes: Number(
      data.pendentes || 0
    ),

    falhaOmie:
      data.consulta_omie_falhou === true,
  };
}

/* =========================================================
   LOCAIS DE ESTOQUE
========================================================= */

async function buscarLocais() {
  const { data, error } = await supabase
    .from("locais_estoque_omie")
    .select(
      "codigo_local_estoque,descricao,codigo"
    );

  if (error) {
    console.warn(
      "Locais de estoque indisponíveis:",
      error.message
    );

    return {};
  }

  return Object.fromEntries(
    (data || []).map((local) => [
      String(local.codigo_local_estoque),

      local.descricao ||
        local.codigo ||
        "Local sem descrição",
    ])
  );
}

/* =========================================================
   REFERÊNCIAS DOS PRODUTOS
========================================================= */

async function buscarItens() {
  const porPedido = {};
  const lote = 500;

  try {
    for (
      let inicio = 0;
      inicio < 10000;
      inicio += lote
    ) {
      const { data, error } = await supabase
        .from("pedidos_compra_itens_front")
        .select(
          "cod_ped_compra,codigo_item,codigo_comercial,descricao,unidade"
        )
        .order("cod_ped_compra", {
          ascending: true,
        })
        .order("codigo_item", {
          ascending: true,
        })
        .range(
          inicio,
          inicio + lote - 1
        );

      if (error) {
        throw error;
      }

      for (const item of data || []) {
        const codigo = String(
          item.cod_ped_compra
        );

        if (!porPedido[codigo]) {
          porPedido[codigo] = {};
        }

        porPedido[codigo][
          String(item.codigo_item)
        ] = item;
      }

      if ((data || []).length < lote) {
        return porPedido;
      }
    }

    console.warn(
      "Limite de referências de produto alcançado."
    );
  } catch (error) {
    console.warn(
      "Referências de produtos indisponíveis:",
      error.message
    );
  }

  return porPedido;
}

/* =========================================================
   PREPARAR PEDIDO E HISTÓRICO
========================================================= */

function prepararPedido(pedido, referencias) {
  const refsPedido = {
    ...referencias,

    itens:
      referencias.itensPorPedido[
        String(pedido.cod_ped_compra)
      ] || {},
  };

  const eventos = (
    Array.isArray(pedido.detalhes_alteracoes)
      ? pedido.detalhes_alteracoes
      : []
  )
    .map((evento) => ({
      id: evento.id,

      detectado_em:
        evento.detectado_em,

      mudancas: extrairMudancasCompra(
        evento,
        refsPedido
      ),
    }))
    .filter(
      (evento) =>
        evento.mudancas.length > 0
    )
    .sort(
      (a, b) =>
        new Date(b.detectado_em) -
          new Date(a.detectado_em) ||
        Number(b.id) -
          Number(a.id)
    )
    .map((evento, indice, todos) => ({
      ...evento,

      numeroAlteracao:
        todos.length - indice,
    }));

  if (!eventos.length) {
    return null;
  }

  return {
    cod_ped_compra:
      pedido.cod_ped_compra,

    numero_pedido:
      pedido.numero_pedido,

    fornecedor_codigo:
      pedido.fornecedor_codigo,

    detalhes_alteracoes:
      eventos,

    primeira_alteracao:
      eventos[eventos.length - 1]
        .detectado_em,

    ultima_alteracao:
      eventos[0].detectado_em,

    quantidade_alteracoes:
      eventos.length,

    campos_alterados: [
      ...new Set(
        eventos.flatMap((evento) =>
          evento.mudancas.map(
            (mudanca) =>
              mudanca.tituloCurto
          )
        )
      ),
    ],
  };
}

/* =========================================================
   INDICADOR DE SINCRONIZAÇÃO
========================================================= */

function IndicadorSincronizacao({
  dados,
  carregando,
  erro,
}) {
  const falha =
    Boolean(erro) ||
    dados?.status === "erro";

  const concluida =
    dados?.status === "sucesso" &&
    Number(
      dados?.pagina_proxima ?? 1
    ) === 1;

  const andamento =
    !falha &&
    !concluida &&
    (
      dados?.status === "executando" ||
      dados?.status === "sucesso"
    );

  const instante = falha
    ? dados?.atualizado_em ||
      dados?.finalizado_em
    : dados?.finalizado_em;

  const cor = falha
    ? "#b91c1c"
    : concluida
      ? "#15803d"
      : "#1d4ed8";

  const fundo = falha
    ? "#fef2f2"
    : concluida
      ? "#f0fdf4"
      : "#eff6ff";

  const borda = falha
    ? "#fecaca"
    : concluida
      ? "#bbf7d0"
      : "#bfdbfe";

  const mensagem = falha
    ? protegerDadosPagamento(
        erro
          ? "Não foi possível consultar o status no Supabase."
          : (
              dados?.mensagem ||
              "Falha na sincronização automática."
            )
      )
    : "";

  return (
    <div
      role={falha ? "alert" : "status"}
      aria-live={
        falha ? "assertive" : "polite"
      }
      title={
        falha
          ? mensagem
          : "Última sincronização automática"
      }
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        marginLeft: "auto",
        padding: "9px 12px",
        minWidth: 0,
        maxWidth: "100%",
        borderRadius: 11,
        border: `1px solid ${borda}`,
        background: fundo,
      }}
    >
      <span
        style={{
          display: "flex",
          color: cor,
          flexShrink: 0,
        }}
      >
        {falha ? (
          <FiAlertTriangle size={17} />
        ) : concluida ? (
          <FiCheckCircle size={17} />
        ) : (
          <FiClock size={17} />
        )}
      </span>

      <span
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          minWidth: 0,
        }}
      >
        <strong
          style={{
            fontSize: 11,
            color: cor,
          }}
        >
          {falha
            ? "Erro na atualização"
            : andamento
              ? "Sincronização em andamento"
              : "Última sincronização"}
        </strong>

        <span
          style={{
            fontSize: 12,
            color: "#334155",
            fontWeight: 650,
          }}
        >
          {carregando && !dados
            ? "Consultando..."
            : dataHora(instante)}
        </span>

        {falha && (
          <span
            style={{
              fontSize: 11,
              color: cor,
              overflowWrap: "anywhere",
              maxWidth: 340,
            }}
          >
            {mensagem}
          </span>
        )}
      </span>
    </div>
  );
}

/* =========================================================
   CARTÃO DE MUDANÇA

   Exibe:
   - Campo alterado
   - Antes
   - Depois
========================================================= */

function CartaoMudanca({ mudanca }) {
  return (
    <div className="pedidos-alterados-mudanca">
      <strong>
        {protegerDadosPagamento(
          mudanca.campo
        )}
      </strong>

      <div className="pedidos-alterados-antes-depois">
        <span>
          <small>Antes</small>

          <b
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {protegerDadosPagamento(
              mudanca.anterior
            )}
          </b>
        </span>

        <span
          className="pedidos-alterados-seta"
          aria-hidden="true"
        >
          →
        </span>

        <span>
          <small>Depois</small>

          <b
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {protegerDadosPagamento(
              mudanca.novo
            )}
          </b>
        </span>
      </div>
    </div>
  );
}

/* =========================================================
   HISTÓRICO DO PEDIDO
========================================================= */

function HistoricoPedido({ pedido }) {
  return (
    <div className="pedidos-alterados-historico">
      <div className="pedidos-alterados-historico-titulo">
        <FiEdit3 aria-hidden="true" />

        <div>
          <strong>
            Histórico do pedido de compra{" "}
            {pedido.numero_pedido ||
              pedido.cod_ped_compra}
          </strong>

          <span>
            {pedido.detalhes_alteracoes.length}{" "}
            ocorrência(s)
          </span>
        </div>
      </div>

      <div className="pedidos-alterados-ocorrencias">
        {pedido.detalhes_alteracoes.map(
          (evento) => (
            <article
              className="pedidos-alterados-ocorrencia"
              key={evento.id}
            >
              <div className="pedidos-alterados-ocorrencia-topo">
                <strong>
                  Alteração #
                  {evento.numeroAlteracao}
                </strong>

                <span>
                  {dataHora(
                    evento.detectado_em
                  )}
                </span>
              </div>

              <div className="pedidos-alterados-mudancas">
                {evento.mudancas.map(
                  (mudanca, indice) => (
                    <CartaoMudanca
                      mudanca={mudanca}
                      key={`${evento.id}-${indice}`}
                    />
                  )
                )}
              </div>
            </article>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function PedidosCompraAlteradosRelatorio({
  relatorio,
}) {
  /* =====================================================
     ESTADOS
  ===================================================== */

  const [dataInicial, setDataInicial] =
    useState(
      () =>
        `${dataHoje().slice(0, 8)}01`
    );

  const [dataFinal, setDataFinal] =
    useState(dataHoje);

  const [pesquisa, setPesquisa] =
    useState("");

  const [pagina, setPagina] =
    useState(1);

  const [abertos, setAbertos] =
    useState(() => new Set());

  const [exportando, setExportando] =
    useState("");

  const periodoValido =
    !dataInicial ||
    !dataFinal ||
    dataInicial <= dataFinal;

  /* =====================================================
     CONSULTAR HISTÓRICO
  ===================================================== */

  const historico = useQuery({
    queryKey: [
      "relatorio-pedidos-compra-alterados",
      dataInicial,
      dataFinal,
    ],

    queryFn: () =>
      buscarHistorico(
        dataInicial,
        dataFinal
      ),

    enabled: periodoValido,

    staleTime: 30000,

    refetchOnWindowFocus: true,

    refetchInterval: 60000,

    retry: 1,
  });

  /* =====================================================
     CONSULTAR STATUS DA SINCRONIZAÇÃO
  ===================================================== */

  const sincronizacao = useQuery({
    queryKey: [
      "sincronizacao-pedidos-compra-status",
    ],

    queryFn: buscarSincronizacao,

    staleTime: 10000,

    refetchInterval: 30000,

    retry: false,
  });

  /* =====================================================
     CONSULTAR NOMES DOS FORNECEDORES
  ===================================================== */

  const fornecedoresQuery = useQuery({
    queryKey: [
      "nomes-fornecedores-pedidos-compra",
    ],

    queryFn: buscarNomesFornecedores,

    staleTime: 30 * 60 * 1000,

    refetchOnWindowFocus: false,

    retry: 1,
  });

  const nomesFornecedores =
    fornecedoresQuery.data?.nomes || FORNECEDORES_VAZIOS;

  /* =====================================================
     CONSULTAR LOCAIS
  ===================================================== */

  const locais = useQuery({
    queryKey: [
      "locais-estoque-omie-relatorio-compras",
    ],

    queryFn: buscarLocais,

    staleTime: 300000,

    retry: false,
  });

  /* =====================================================
     CONSULTAR REFERÊNCIAS DOS PRODUTOS
  ===================================================== */

  const itens = useQuery({
    queryKey: [
      "referencias-itens-pedidos-compra",
    ],

    queryFn: buscarItens,

    staleTime: 300000,

    refetchInterval: 60000,

    retry: false,
  });

  /* =====================================================
     REFERÊNCIAS

     CORREÇÃO:
     Compartilha o mesmo mapa usado pela coluna
     Fornecedor com o formatador do histórico.
  ===================================================== */

  const referencias = useMemo(
    () => ({
      fornecedores: nomesFornecedores,

      locais: locais.data || {},

      itensPorPedido:
        itens.data || {},
    }),

    [
      nomesFornecedores,
      locais.data,
      itens.data,
    ]
  );

  /* =====================================================
     PREPARAR HISTÓRICO
  ===================================================== */

  const pedidos = useMemo(
    () =>
      (historico.data || [])
        .map((pedido) =>
          prepararPedido(
            pedido,
            referencias
          )
        )
        .filter(Boolean),

    [
      historico.data,
      referencias,
    ]
  );

  /* =====================================================
     FILTRO DE BUSCA
  ===================================================== */

  const filtrados = useMemo(() => {
    const termo = normalizar(
      pesquisa.trim()
    );

    if (!termo) {
      return pedidos;
    }

    return pedidos.filter((pedido) => {
      const codigoFornecedor =
        String(
          pedido.fornecedor_codigo ?? ""
        );

      const nomeFornecedor =
        nomesFornecedores[codigoFornecedor] || "";

      return normalizar(
        [
          pedido.numero_pedido,

          pedido.cod_ped_compra,

          pedido.fornecedor_codigo,

          nomeFornecedor,

          ...pedido.campos_alterados,

          ...pedido.detalhes_alteracoes.flatMap(
            (evento) =>
              evento.mudancas.flatMap(
                (mudanca) => [
                  mudanca.campo,
                  mudanca.anterior,
                  mudanca.novo,
                  mudanca.variacao,
                ]
              )
          ),
        ].join(" ")
      ).includes(termo);
    });
  }, [
    pedidos,
    pesquisa,
    nomesFornecedores,
  ]);

  /* =====================================================
     PAGINAÇÃO
  ===================================================== */

  const paginas = Math.max(
    1,
    Math.ceil(
      filtrados.length / POR_PAGINA
    )
  );

  const paginaAtual = Math.min(
    Math.max(1, pagina),
    paginas
  );

  const paginaPedidos = filtrados.slice(
    (paginaAtual - 1) * POR_PAGINA,
    paginaAtual * POR_PAGINA
  );

  /* =====================================================
     INDICADORES
  ===================================================== */

  const totalEventos = filtrados.reduce(
    (soma, pedido) =>
      soma +
      pedido.quantidade_alteracoes,
    0
  );

  const periodo =
    `${dataBR(dataInicial)} até ` +
    dataBR(dataFinal);

  /* =====================================================
     EXPANDIR / RECOLHER
  ===================================================== */

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

  /* =====================================================
     EXPORTAÇÃO
  ===================================================== */

  async function exportar(tipo) {
    if (
      exportando ||
      !filtrados.length
    ) {
      return;
    }

    setExportando(tipo);

    try {
      const modulo = await import(
        "./ExportarPedidosCompraAlterados.js"
      );

      if (tipo === "pdf") {
        await modulo.exportarPdfPedidosCompraAlterados(
          filtrados,
          periodo,
          referencias
        );
      } else {
        await modulo.exportarExcelPedidosCompraAlterados(
          filtrados,
          periodo,
          referencias
        );
      }
    } catch (error) {
      console.error(
        "Falha ao exportar relatório de compras:",
        error.message
      );

      window.alert(
        "Não foi possível exportar o relatório. Confira o console para detalhes."
      );
    } finally {
      setExportando("");
    }
  }

  /* =====================================================
     TELA
  ===================================================== */

  return (
    <>
      {/* CABEÇALHO */}

      <div
        className="relatorio-selecionado-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div className="relatorio-selecionado-icone">
          <FiEdit3 />
        </div>

        <div
          style={{
            flex: "1 1 270px",
            minWidth: 0,
          }}
        >
          <span className="relatorio-selecionado-categoria">
            Compras
          </span>

          <h2>
            {relatorio?.titulo ||
              "Pedidos de Compra Alterados"}
          </h2>

          <p>
            Histórico das alterações relevantes
            detectadas entre sincronizações do Omie.
          </p>
        </div>

        <IndicadorSincronizacao
          dados={sincronizacao.data}
          carregando={sincronizacao.isLoading}
          erro={sincronizacao.error}
        />
      </div>

      {/* EXPORTAÇÕES */}

      <div className="relatorio-acoes">
        <button
          type="button"
          className="btn-relatorio btn-relatorio-pdf"
          disabled={
            !filtrados.length ||
            Boolean(exportando)
          }
          onClick={() =>
            exportar("pdf")
          }
        >
          <FiFileText />

          <div>
            <strong>
              {exportando === "pdf"
                ? "Gerando PDF..."
                : "Baixar PDF"}
            </strong>

            <span>
              Histórico completo filtrado
            </span>
          </div>
        </button>

        <button
          type="button"
          className="btn-relatorio btn-relatorio-csv"
          disabled={
            !filtrados.length ||
            Boolean(exportando)
          }
          onClick={() =>
            exportar("excel")
          }
        >
          <FiDownload />

          <div>
            <strong>
              {exportando === "excel"
                ? "Gerando Excel..."
                : "Exportar Excel"}
            </strong>

            <span>
              Resumo + histórico expandido
            </span>
          </div>
        </button>
      </div>

      {/* FILTROS */}

      <div className="relatorio-filtros-card">
        <div className="relatorio-filtros-header">
          <div>
            <h3>
              Parâmetros do relatório
            </h3>

            <p>
              Período em que as alterações foram
              detectadas pelo dashboard.
            </p>
          </div>
        </div>

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
      </div>

      {/* AVISO DE FORNECEDORES */}

      {fornecedoresQuery.error && (
        <div
          className="relatorios-erro"
          role="alert"
        >
          <FiAlertTriangle />

          <span>
            Não foi possível consultar os nomes dos
            fornecedores. Os pedidos continuam disponíveis,
            mas alguns fornecedores podem aparecer
            como não identificados.
          </span>
        </div>
      )}

      {!fornecedoresQuery.error &&
        fornecedoresQuery.data?.pendentes > 0 && (
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
              {
                fornecedoresQuery.data.pendentes
              }{" "}
              fornecedor(es) ainda não identificado(s)
              no cadastro do Omie.
            </span>
          </div>
        )}

      {/* ERROS DO RELATÓRIO */}

      {!periodoValido && (
        <div className="relatorios-erro">
          A data inicial não pode ser posterior
          à data final.
        </div>
      )}

      {historico.error && (
        <div className="relatorios-erro pedidos-alterados-erro">
          <FiAlertTriangle />

          <span>
            {historico.error.message}
          </span>
        </div>
      )}

      {/* CARREGAMENTO */}

      {historico.isLoading && (
        <div className="relatorios-loading pedidos-alterados-loading">
          Carregando alterações dos pedidos
          de compra...
        </div>
      )}

      {/* RESULTADOS */}

      {!historico.isLoading &&
        !historico.error &&
        periodoValido &&
        filtrados.length > 0 && (
          <>
            <section className="relatorio-visualizacao pedidos-alterados-visualizacao">
              <div className="relatorio-visualizacao-header">
                <div>
                  <span className="relatorio-visualizacao-eyebrow">
                    Auditoria
                  </span>

                  <h3>
                    Alterações encontradas
                  </h3>
                </div>
              </div>

              {/* RESUMO */}

              <div className="relatorio-visualizacao-info">
                <div className="relatorio-visualizacao-info-item">
                  <span>
                    Período
                  </span>

                  <strong>
                    {periodo}
                  </strong>
                </div>

                <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
                  <span>
                    Pedidos
                  </span>

                  <strong>
                    {filtrados.length}
                  </strong>
                </div>
              </div>

              {/* TABELA */}

              <div className="relatorio-visualizacao-tabela-wrapper pedidos-alterados-tabela-wrapper">
                <table className="relatorio-visualizacao-tabela pedidos-alterados-tabela">
                  <thead>
                    <tr>
                      <th>
                        Pedido de compra
                      </th>

                      <th>
                        Fornecedor
                      </th>

                      <th>
                        Última alteração
                      </th>

                      <th>
                        Nº alterações
                      </th>

                      <th>
                        O que foi alterado
                      </th>

                      <th>
                        Histórico
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginaPedidos.map((pedido) => {
                      const codigo =
                        pedido.cod_ped_compra;

                      const expandido =
                        abertos.has(codigo);

                      const codigoFornecedor =
                        String(
                          pedido.fornecedor_codigo ?? ""
                        ).trim();

                      const nomeFornecedor =
                        nomesFornecedores[
                          codigoFornecedor
                        ];

                      return (
                        <Fragment
                          key={`compra-${codigo}`}
                        >
                          <tr>
                            {/* PEDIDO */}

                            <td>
                              <strong className="pedidos-alterados-numero">
                                {pedido.numero_pedido ||
                                  codigo}
                              </strong>

                            
                            </td>

                            {/* FORNECEDOR */}

                            <td
                              style={{
                                maxWidth: 320,
                                minWidth: 180,
                                overflowWrap: "anywhere",
                              }}
                              title={
                                nomeFornecedor
                                  ? protegerDadosPagamento(
                                      nomeFornecedor
                                    )
                                  : "Nome do fornecedor indisponível"
                              }
                            >
                              {fornecedoresQuery.isLoading &&
                              !fornecedoresQuery.data ? (
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "#64748b",
                                  }}
                                >
                                  Consultando fornecedor...
                                </span>
                              ) : nomeFornecedor ? (
                                <strong
                                  style={{
                                    fontSize: 12,
                                    color: "#1e293b",
                                  }}
                                >
                                  {protegerDadosPagamento(
                                    nomeFornecedor
                                  )}
                                </strong>
                              ) : (
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "#b45309",
                                  }}
                                >
                                  Fornecedor não identificado
                                </span>
                              )}
                            </td>

                            {/* ÚLTIMA ALTERAÇÃO */}

                            <td>
                              {dataHora(
                                pedido.ultima_alteracao
                              )}
                            </td>

                            {/* NÚMERO DE ALTERAÇÕES */}

                            <td>
                              <span className="pedidos-alterados-contador">
                                {
                                  pedido.quantidade_alteracoes
                                }
                              </span>
                            </td>

                            {/* CAMPOS ALTERADOS */}

                            <td>
                              <div className="pedidos-alterados-campos">
                                {pedido.campos_alterados.map(
                                  (campo) => (
                                    <span key={campo}>
                                      {protegerDadosPagamento(
                                        campo
                                      )}
                                    </span>
                                  )
                                )}
                              </div>
                            </td>

                            {/* BOTÃO HISTÓRICO */}

                            <td>
                              <button
                                type="button"
                                className="pedidos-alterados-ver"
                                onClick={() =>
                                  alternar(codigo)
                                }
                                aria-expanded={
                                  expandido
                                }
                              >
                                {expandido ? (
                                  <FiChevronUp />
                                ) : (
                                  <FiChevronDown />
                                )}

                                {expandido
                                  ? "Fechar"
                                  : "Ver"}
                              </button>
                            </td>
                          </tr>

                          {/* HISTÓRICO EXPANDIDO */}

                          {expandido && (
                            <tr className="pedidos-alterados-historico-linha">
                              <td colSpan={6}>
                                <HistoricoPedido
                                  pedido={pedido}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* RODAPÉ */}

              <div className="relatorio-visualizacao-footer">
                <span>
                  Exibindo{" "}
                  {(paginaAtual - 1) *
                    POR_PAGINA +
                    1}{" "}
                  a{" "}
                  {Math.min(
                    paginaAtual * POR_PAGINA,
                    filtrados.length
                  )}{" "}
                  de{" "}
                  {filtrados.length}{" "}
                  pedido(s) de compra
                </span>

                <span>
                  {totalEventos}{" "}
                  alteração(ões) no período
                </span>
              </div>
            </section>

            {/* PAGINAÇÃO */}

            {paginas > 1 && (
              <Paginacao
                paginaAtual={paginaAtual}
                totalItens={filtrados.length}
                itensPorPagina={POR_PAGINA}
                onChangePagina={setPagina}
              />
            )}
          </>
        )}

      {/* NENHUM RESULTADO */}

      {!historico.isLoading &&
        !historico.error &&
        periodoValido &&
        filtrados.length === 0 && (
          <div className="relatorio-visualizacao-vazia pedidos-alterados-vazio">
            <FiEdit3 />

            <strong>
              Nenhuma alteração detectada neste período
            </strong>

            <span>
              As alterações relevantes aparecerão
              aqui após a sincronização automática.
            </span>
          </div>
        )}
    </>
  );
}