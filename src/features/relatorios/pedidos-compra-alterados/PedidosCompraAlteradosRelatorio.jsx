
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
  FiArrowRight,
  FiClock,
} from "react-icons/fi";

import Paginacao from "@/components/paginacao/Paginacao";

import { supabase } from "@/lib/supabaseClient";

import {
  extrairMudancasCompra,
} from "./formatarHistoricoCompras";

import "../pedidos-alterados/PedidosAlteradosRelatorio.css";
import "./PedidosCompraAlteradosRelatorio.css";

const POR_PAGINA = 10;

const localData = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const inicioMes = () => {
  const d = new Date();

  return localData(
    new Date(d.getFullYear(), d.getMonth(), 1)
  );
};

const hora = (v) =>
  v
    ? new Date(v).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      })
    : "-";

const dataBr = (v) =>
  v ? v.split("-").reverse().join("/") : "Sem limite";

const normalizar = (v) =>
  String(v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const CATEGORIAS = [
  {
    id: "valores",
    titulo: "Valores e itens",
    descricao: "Preços, quantidades e itens do pedido",
  },
  {
    id: "pagamento",
    titulo: "Pagamento e parcelas",
    descricao: "Prazos, vencimentos e condições",
  },
  {
    id: "cadastro",
    titulo: "Dados do pedido",
    descricao: "Fornecedor, comprador, etapa e demais campos",
  },
  {
    id: "logistica",
    titulo: "Entrega e logística",
    descricao: "Frete, estoque e previsão de entrega",
  },
];

function categoriaMudanca(nome) {
  const campo = normalizar(nome);

  if (/parcela|pagamento|vencimento|prazo|documento/.test(campo)) {
    return "pagamento";
  }

  if (/frete|estoque|transportadora|entrega|previsao|peso|seguro/.test(campo)) {
    return "logistica";
  }

  if (/preco|valor|quantidade|produto|item|desconto|despesa/.test(campo)) {
    return "valores";
  }

  return "cadastro";
}

function agruparMudancas(lista) {
  const grupos = new Map(
    CATEGORIAS.map(({ id }) => [id, []])
  );

  lista.forEach((mudanca) => {
    grupos
      .get(categoriaMudanca(mudanca.campo))
      .push(mudanca);
  });

  return CATEGORIAS.map((categoria) => ({
    ...categoria,
    mudancas: grupos.get(categoria.id),
  })).filter(
    (categoria) => categoria.mudancas.length > 0
  );
}

function HistoricoEvento({ evento, referencias }) {
  const mudancas =
    evento.mudancas ||
    extrairMudancasCompra(evento, referencias);

  const grupos = agruparMudancas(mudancas);

  return (
    <article className="pc-audit-evento">
      <header className="pc-audit-evento-topo">
        <div className="pc-audit-evento-identificacao">
          <span className="pc-audit-evento-icone">
            <FiClock aria-hidden="true" />
          </span>

          <div>
            <strong>Alteração identificada</strong>

            <span>
              {mudancas.length}{" "}
              {mudancas.length === 1
                ? "mudança relevante"
                : "mudanças relevantes"}
            </span>
          </div>
        </div>

        <time dateTime={evento.detectado_em || undefined}>
          {hora(evento.detectado_em)}
        </time>
      </header>

      {grupos.length ? (
        grupos.map((grupo) => (
          <section
            className="pc-audit-grupo"
            key={grupo.id}
            aria-label={grupo.titulo}
          >
            <header className="pc-audit-grupo-topo">
              <div>
                <h4>{grupo.titulo}</h4>
                <p>{grupo.descricao}</p>
              </div>

              <span className="pc-audit-grupo-contador">
                {grupo.mudancas.length}
              </span>
            </header>

            <div
              className="pc-audit-grade-cabecalho"
              aria-hidden="true"
            >
              <span>O QUE MUDOU</span>
              <span>ANTES</span>
              <span>DEPOIS</span>
            </div>

            <div className="pc-audit-linhas">
              {grupo.mudancas.map((mudanca, indice) => (
                <div
                  className="pc-audit-linha"
                  key={`${evento.id}-${grupo.id}-${indice}`}
                >
                  <div className="pc-audit-campo">
                    {mudanca.campo}
                  </div>

                  <div
                    className="pc-audit-valor pc-audit-valor-antes"
                    data-titulo="Antes"
                  >
                    {mudanca.anterior}
                  </div>

                  <div
                    className="pc-audit-valor pc-audit-valor-depois"
                    data-titulo="Depois"
                  >
                    <FiArrowRight
                      className="pc-audit-seta"
                      aria-hidden="true"
                    />

                    <span>{mudanca.novo}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      ) : (
        <p className="pc-audit-sem-campos">
          Nenhuma diferença detalhada neste evento.
        </p>
      )}
    </article>
  );
}

async function buscarHistorico(de, ate) {
  const { data, error } = await supabase.rpc(
    "listar_relatorio_pedidos_compra_alterados",
    {
      p_data_inicial: de || null,
      p_data_final: ate || null,
      p_limite: 2000,
    }
  );

  if (error) {
    throw error;
  }

  return data || [];
}

export default function PedidosCompraAlteradosRelatorio({
  relatorio,
}) {
  const [de, setDe] = useState(inicioMes);

  const [ate, setAte] = useState(() =>
    localData(new Date())
  );

  const [pesquisa, setPesquisa] = useState("");

  const [pagina, setPagina] = useState(1);

  const [expandidas, setExpandidas] = useState(
    () => new Set()
  );

  const [exportando, setExportando] = useState("");

  const historico = useQuery({
    queryKey: [
      "relatorio-pedidos-compra-alterados",
      de,
      ate,
    ],

    queryFn: () => buscarHistorico(de, ate),

    enabled: !de || !ate || de <= ate,

    staleTime: 30000,

    refetchOnWindowFocus: true,

    retry: 1,

    refetchInterval: 60000,
  });

  const status = useQuery({
    queryKey: ["sincronizacao-pedidos-compra-status"],

    queryFn: async () => {
      const { data, error } = await supabase
        .from("sincronizacao_pedidos_compra_omie")
        .select(
          "status, finalizado_em, total_pedidos, total_alterados, total_paginas, pagina_proxima, mensagem"
        )
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },

    staleTime: 10000,

    refetchInterval: 60000,
  });

  // Consulta opcional das descrições dos locais de estoque.
  // Se não houver permissão, os códigos continuam visíveis.

  const locaisQuery = useQuery({
    queryKey: [
      "locais-estoque-omie-relatorio-compras",
    ],

    queryFn: async () => {
      const { data, error } = await supabase
        .from("locais_estoque_omie")
        .select(
          "codigo_local_estoque,descricao,codigo"
        );

      if (error) {
        throw error;
      }

      return Object.fromEntries(
        (data || []).map((local) => [
          String(local.codigo_local_estoque),

          local.descricao ||
            local.codigo ||
            "Local sem descrição",
        ])
      );
    },

    staleTime: 5 * 60 * 1000,

    retry: false,
  });

  const referencias = useMemo(
    () => ({
      locais: locaisQuery.data || {},
    }),
    [locaisQuery.data]
  );

  /*
   * Os contadores da RPC incluem todos os campos
   * armazenados no evento.
   *
   * A tela recalcula as ocorrências usando apenas
   * as mudanças que passaram pelo filtro visual.
   */

  const registrosVisiveis = useMemo(
    () =>
      (historico.data || [])
        .map((pedido) => {
          const eventos = (
            pedido.detalhes_alteracoes || []
          )
            .map((evento) => ({
              ...evento,

              mudancas: extrairMudancasCompra(
                evento,
                referencias
              ),
            }))
            .filter(
              (evento) =>
                evento.mudancas.length > 0
            )
            .sort(
              (a, b) =>
                new Date(b.detectado_em) -
                new Date(a.detectado_em)
            );

          if (!eventos.length) {
            return null;
          }

          const campos = [
            ...new Set(
              eventos.flatMap((evento) =>
                evento.mudancas.map((m) =>
                  m.campo.replace(
                    /\s*•\s*Item\s+\d+$/,
                    ""
                  )
                )
              )
            ),
          ];

          return {
            ...pedido,

            detalhes_alteracoes: eventos,

            quantidade_alteracoes:
              eventos.length,

            campos_alterados: campos,

            primeira_alteracao:
              eventos[eventos.length - 1]
                .detectado_em,

            ultima_alteracao:
              eventos[0].detectado_em,
          };
        })
        .filter(Boolean),

    [historico.data, referencias]
  );

  const filtrados = useMemo(() => {
    const termo = normalizar(
      pesquisa.trim()
    );

    return registrosVisiveis.filter(
      (r) =>
        !termo ||
        normalizar(
          [
            r.numero_pedido,
            r.cod_ped_compra,
            r.fornecedor_codigo,

            ...(r.campos_alterados || []),

            ...(r.detalhes_alteracoes || [])
              .flatMap((e) =>
                e.mudancas.flatMap((m) => [
                  m.campo,
                  m.anterior,
                  m.novo,
                ])
              ),
          ].join(" ")
        ).includes(termo)
    );
  }, [registrosVisiveis, pesquisa]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      filtrados.length / POR_PAGINA
    )
  );

  const paginaValida = Math.max(
    1,
    Math.min(pagina, totalPaginas)
  );

  const paginaDados = filtrados.slice(
    (paginaValida - 1) * POR_PAGINA,

    paginaValida * POR_PAGINA
  );

  const totalEventos = filtrados.reduce(
    (acc, pedido) =>
      acc +
      Number(
        pedido.quantidade_alteracoes || 0
      ),

    0
  );

  const periodo = `${dataBr(de)} até ${dataBr(ate)}`;

  function alternar(codigo) {
    setExpandidas((anterior) => {
      const novo = new Set(anterior);

      if (novo.has(codigo)) {
        novo.delete(codigo);
      } else {
        novo.add(codigo);
      }

      return novo;
    });
  }

  async function exportar(tipo) {
    if (
      !filtrados.length ||
      exportando
    ) {
      return;
    }

    setExportando(tipo);

    try {
      const m = await import(
        "./ExportarPedidosCompraAlterados.js"
      );

      if (tipo === "pdf") {
        await m.exportarPdfPedidosCompraAlterados(
          filtrados,
          periodo,
          referencias
        );
      } else {
        await m.exportarExcelPedidosCompraAlterados(
          filtrados,
          periodo,
          referencias
        );
      }
    } catch (e) {
      console.error(
        "Falha ao exportar pedidos de compra",
        e
      );

      window.alert(
        e?.message ||
          "Falha ao exportar."
      );
    } finally {
      setExportando("");
    }
  }

  return (
    <>
      <div className="relatorio-selecionado-header">
        <div className="relatorio-selecionado-icone">
          <FiEdit3 />
        </div>

        <div>
          <span className="relatorio-selecionado-categoria">
            Compras
          </span>

          <h2>
            {relatorio?.titulo ||
              "Pedidos de Compra Alterados"}
          </h2>

          <p>
            Alterações relevantes detectadas entre
            sincronizações do Omie. Preenchimentos
            iniciais do cadastro não entram no relatório.
          </p>
        </div>
      </div>

      <div className="relatorio-acoes">
        <button
          type="button"
          className="btn-relatorio btn-relatorio-pdf"
          onClick={() => exportar("pdf")}
          disabled={
            !filtrados.length ||
            !!exportando
          }
        >
          <FiFileText />

          <div>
            <strong>Baixar PDF</strong>

            <span>
              Histórico completo filtrado
            </span>
          </div>
        </button>

        <button
          type="button"
          className="btn-relatorio btn-relatorio-csv"
          onClick={() => exportar("excel")}
          disabled={
            !filtrados.length ||
            !!exportando
          }
        >
          <FiDownload />

          <div>
            <strong>Exportar Excel</strong>

            <span>
              Resumo + valores anteriores/novos
            </span>
          </div>
        </button>
      </div>

      <div className="relatorio-filtros-card">
        <div className="relatorio-filtros-header">
          <div>
            <h3>Parâmetros do relatório</h3>

            <p>
              Período da detecção das mudanças.
              Não confundir com a previsão de
              entrega do pedido.
            </p>
          </div>
        </div>

        <div className="pedidos-alterados-filtros">
          <label className="pedidos-alterados-campo">
            <span>De</span>

            <input
              type="date"
              value={de}
              max={ate || undefined}
              onChange={(e) => {
                setDe(e.target.value);
                setPagina(1);
              }}
            />
          </label>

          <label className="pedidos-alterados-campo">
            <span>Até</span>

            <input
              type="date"
              value={ate}
              min={de || undefined}
              onChange={(e) => {
                setAte(e.target.value);
                setPagina(1);
              }}
            />
          </label>

          <label className="pedidos-alterados-campo pedidos-alterados-pesquisa-campo">
            <span>Buscar</span>

            <div className="pedidos-alterados-pesquisa">
              <FiSearch />

              <input
                value={pesquisa}
                onChange={(e) => {
                  setPesquisa(e.target.value);
                  setPagina(1);
                }}
                placeholder="Pedido, campo ou valor..."
              />
            </div>
          </label>
        </div>
      </div>

      {status.data && (
        <div
          className="relatorio-resumo-card"
          role="status"
        >
          <strong>
            Sincronização automática
            (a cada 20 minutos):
          </strong>{" "}
          {status.data.finalizado_em
            ? hora(
                status.data.finalizado_em
              )
            : "Ainda não concluída"}

          {" • "}

          {status.data.mensagem ||
            status.data.status}
        </div>
      )}

      {status.error && (
        <div className="relatorios-erro">
          {status.error.message}
        </div>
      )}

      {historico.error && (
        <div className="relatorios-erro">
          <FiAlertTriangle />

          {historico.error.message}
        </div>
      )}

      {historico.isLoading && (
        <div className="relatorios-loading">
          Carregando alterações...
        </div>
      )}

      {!historico.isLoading &&
        !historico.error &&
        (filtrados.length ? (
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

              <div className="relatorio-visualizacao-info">
                <div className="relatorio-visualizacao-info-item">
                  <span>Período</span>

                  <strong>
                    {periodo}
                  </strong>
                </div>

                <div className="relatorio-visualizacao-info-item">
                  <span>Pedidos de compra</span>

                  <strong>
                    {filtrados.length}
                  </strong>
                </div>

                <div className="relatorio-visualizacao-info-item relatorio-visualizacao-total">
                  <span>Ocorrências</span>

                  <strong>
                    {totalEventos}
                  </strong>
                </div>
              </div>

              <div className="relatorio-visualizacao-tabela-wrapper pedidos-alterados-tabela-wrapper">
                <table className="relatorio-visualizacao-tabela pedidos-alterados-tabela">
                  <thead>
                    <tr>
                      <th>
                        Pedido de compra
                      </th>

                      <th>
                        Primeira detecção
                      </th>

                      <th>
                        Última detecção
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
                    {paginaDados.map((r) => {
                      const aberta =
                        expandidas.has(
                          r.cod_ped_compra
                        );

                      return (
                        <Fragment
                          key={
                            r.cod_ped_compra
                          }
                        >
                          <tr>
                            <td>
                              <strong className="pedidos-alterados-numero">
                                {r.numero_pedido ||
                                  r.cod_ped_compra}
                              </strong>

                              <small
                                style={{
                                  display:
                                    "block",

                                  opacity: 0.6,
                                }}
                              >
                                Omie:{" "}
                                {
                                  r.cod_ped_compra
                                }
                              </small>
                            </td>

                            <td>
                              {hora(
                                r.primeira_alteracao
                              )}
                            </td>

                            <td>
                              {hora(
                                r.ultima_alteracao
                              )}
                            </td>

                            <td>
                              <span className="pedidos-alterados-contador">
                                {
                                  r.quantidade_alteracoes
                                }
                              </span>
                            </td>

                            <td>
                              <div className="pedidos-alterados-campos">
                                {(
                                  r.campos_alterados ||
                                  []
                                )
                                  .slice(0, 4)
                                  .map((c) => (
                                    <span
                                      key={
                                        c
                                      }
                                    >
                                      {c}
                                    </span>
                                  ))}

                                {(r.campos_alterados ||
                                  []).length >
                                  4 && (
                                  <span>
                                    +
                                    {r
                                      .campos_alterados
                                      .length -
                                      4}{" "}
                                    campos
                                  </span>
                                )}
                              </div>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="pedidos-alterados-ver"
                                onClick={() =>
                                  alternar(
                                    r.cod_ped_compra
                                  )
                                }
                                aria-expanded={
                                  aberta
                                }
                              >
                                {aberta ? (
                                  <FiChevronUp />
                                ) : (
                                  <FiChevronDown />
                                )}

                                {aberta
                                  ? "Fechar"
                                  : "Ver"}
                              </button>
                            </td>
                          </tr>

                          {aberta && (
                            <tr className="pedidos-alterados-historico-linha">
                              <td
                                colSpan={
                                  6
                                }
                              >
                                <div className="pedidos-alterados-historico pc-audit-historico">
                                  <div className="pedidos-alterados-historico-titulo">
                                    <FiEdit3 />

                                    <strong>
                                      Histórico do
                                      pedido de
                                      compra{" "}
                                      {r.numero_pedido ||
                                        r.cod_ped_compra}
                                    </strong>
                                  </div>

                                  <p className="pc-audit-nota">
                                    Exibindo
                                    diferenças
                                    efetivas entre
                                    versões.
                                    Preenchimentos
                                    iniciais de
                                    fornecedor,
                                    comprador,
                                    local e rateio
                                    não são
                                    considerados
                                    alterações.
                                    Horário =
                                    detecção pelo
                                    dashboard.
                                  </p>

                                  <div className="pc-audit-eventos">
                                    {(
                                      r.detalhes_alteracoes ||
                                      []
                                    ).map(
                                      (
                                        evento
                                      ) => (
                                        <HistoricoEvento
                                          key={
                                            evento.id
                                          }
                                          evento={
                                            evento
                                          }
                                          referencias={
                                            referencias
                                          }
                                        />
                                      )
                                    )}
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

              <div className="relatorio-visualizacao-footer">
                <span>
                  Exibindo{" "}
                  {(paginaValida -
                    1) *
                    POR_PAGINA +
                    1}{" "}
                  a{" "}
                  {Math.min(
                    paginaValida *
                      POR_PAGINA,

                    filtrados.length
                  )}{" "}
                  de{" "}
                  {
                    filtrados.length
                  }{" "}
                  pedido(s) de compra
                </span>

                <span>
                  {totalEventos}{" "}
                  ocorrência(s) no
                  período
                </span>
              </div>
            </section>

            {totalPaginas > 1 && (
              <Paginacao
                paginaAtual={
                  paginaValida
                }
                totalItens={
                  filtrados.length
                }
                itensPorPagina={
                  POR_PAGINA
                }
                onChangePagina={
                  setPagina
                }
              />
            )}
          </>
        ) : (
          <div className="relatorio-visualizacao-vazia pedidos-alterados-vazio">
            <FiEdit3 />

            <strong>
              Nenhuma alteração
              detectada neste período
            </strong>

            <span>
              {status.data?.status ===
              "aguardando"
                ? "A primeira sincronização automática criará a base inicial."
                : "Depois que um pedido de compra mudar e for sincronizado novamente, o histórico aparecerá aqui."}
            </span>
          </div>
        ))}
    </>
  );
}