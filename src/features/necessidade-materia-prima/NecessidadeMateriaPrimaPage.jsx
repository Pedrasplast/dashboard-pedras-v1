
import { useMemo, useState } from "react";

import {
  AlertTriangle,
  Calculator,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import Paginacao from "@/components/paginacao/Paginacao";

import {
  useNecessidadeMateriaPrima,
} from "./hooks/useNecessidadeMateriaPrima";

import {
  consolidarNecessidade,
  numero,
} from "./utils/calculosNecessidade";

import {
  formatarQuantidade,
  formatarPesoKgUn,
  formatarConsumo,
  formatarKg,
  formatarPercentual,
  formatarMoeda,
  formatarPrecoUnitario,
} from "./utils/formatadoresNecessidade";

import "./NecessidadeMateriaPrima.css";

/* ============================================================
   NECESSIDADE DE MATÉRIA-PRIMA

   - Cálculos e formatação separados
   - Materiais habilitados no cadastro
   - Abas por matéria-prima
   - Estoque exclusivo do Omie
   - Percentual e teto editáveis
   - Alerta compacto com paginação
   - Produtos agrupados por código
   - Paginação padrão
   - Resumo principal destacado
============================================================ */

const PRODUTOS_POR_PAGINA = 8;
const PENDENCIAS_POR_PAGINA = 8;

/* ============================================================
   UTILITÁRIOS DE IDENTIFICAÇÃO
============================================================ */

function normalizarCodigo(valor) {
  return String(valor ?? "")
    .trim()
    .toUpperCase();
}

/* ============================================================
   DESCRIÇÃO DAS PENDÊNCIAS
============================================================ */

function descricaoPendencia(situacao) {
  const descricoes = {
    SEM_PARAMETROS: "Produto sem cadastro ativo",
    SEM_CADASTRO: "Produto sem cadastro",
    SEM_MATERIAL: "Matéria-prima não vinculada",
    SEM_PESO: "Peso KG/UN não cadastrado",
    MATERIAL_INATIVO: "Matéria-prima inativa",
    PRODUTO_INATIVO: "Produto inativo",
  };

  return (
    descricoes[situacao] ??
    String(situacao || "Cadastro incompleto")
      .replaceAll("_", " ")
  );
}

/* ============================================================
   AGRUPAR PENDÊNCIAS POR PRODUTO
============================================================ */

function agruparPendencias(pedidos = []) {
  const mapa = new Map();

  for (const pedido of pedidos) {
    if (pedido.situacao_cadastro === "OK") {
      continue;
    }

    const codigo = normalizarCodigo(
      pedido.codigo_produto
    );

    if (!codigo) {
      continue;
    }

    const quantidade = numero(pedido.quantidade);
    const existente = mapa.get(codigo);

    if (existente) {
      existente.quantidade += quantidade;
      existente.itens += 1;
      continue;
    }

    mapa.set(codigo, {
      codigo,
      produto: pedido.produto || "Sem descrição",
      quantidade,
      itens: 1,
      situacao: pedido.situacao_cadastro,
    });
  }

  return Array.from(mapa.values()).sort(
    (a, b) =>
      b.quantidade - a.quantidade ||
      a.codigo.localeCompare(b.codigo, "pt-BR")
  );
}

/* ============================================================
   AGRUPAR PRODUTOS VÁLIDOS POR MATÉRIA-PRIMA

   A formatação não interfere na soma.
============================================================ */

function agruparProdutosPorMaterial(pedidos = []) {
  const agrupamento = new Map();

  for (const pedido of pedidos) {
    if (pedido.situacao_cadastro !== "OK") {
      continue;
    }

    if (pedido.material_id == null) {
      continue;
    }

    const materialId = String(pedido.material_id);
    const codigo = normalizarCodigo(
      pedido.codigo_produto
    );

    const quantidade = Number(pedido.quantidade);
    const consumo = Number(pedido.consumo_kg);
    const peso = Number(pedido.kg_un);

    if (
      !codigo ||
      !Number.isFinite(quantidade) ||
      !Number.isFinite(consumo) ||
      !Number.isFinite(peso) ||
      peso <= 0
    ) {
      continue;
    }

    if (!agrupamento.has(materialId)) {
      agrupamento.set(materialId, new Map());
    }

    const produtos = agrupamento.get(materialId);
    const existente = produtos.get(codigo);

    if (existente) {
      existente.quantidade += quantidade;
      existente.consumo += consumo;
      continue;
    }

    produtos.set(codigo, {
      codigo,
      produto: pedido.produto || "Sem descrição",
      quantidade,
      pesoKgUn: peso,
      consumo,
    });
  }

  const resultado = new Map();

  for (const [id, produtos] of agrupamento) {
    resultado.set(
      id,
      Array.from(produtos.values()).sort(
        (a, b) =>
          b.consumo - a.consumo ||
          a.codigo.localeCompare(b.codigo, "pt-BR")
      )
    );
  }

  return resultado;
}

/* ============================================================
   ALERTA COMPACTO DE PRODUTOS PENDENTES
============================================================ */

function AlertaPendencias({ pedidos }) {
  const [expandido, setExpandido] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const pendencias = useMemo(
    () => agruparPendencias(pedidos),
    [pedidos]
  );

  const totalItens = pendencias.reduce(
    (total, item) => total + item.itens,
    0
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      pendencias.length / PENDENCIAS_POR_PAGINA
    )
  );

  const paginaValida = Math.min(
    Math.max(1, paginaAtual),
    totalPaginas
  );

  const inicio =
    (paginaValida - 1) * PENDENCIAS_POR_PAGINA;

  const pendenciasPagina = pendencias.slice(
    inicio,
    inicio + PENDENCIAS_POR_PAGINA
  );

  if (pendencias.length === 0) {
    return null;
  }

  return (
    <section
      className="necessidade-pendencias"
      aria-label="Produtos com pendências"
    >
      <div className="necessidade-pendencias-cabecalho">
        <AlertTriangle
          size={18}
          aria-hidden="true"
        />

        <div className="necessidade-pendencias-texto">
          <strong>
            Produtos com parâmetros pendentes
          </strong>

          <p>
            {pendencias.length} código(s) e{" "}
            {totalItens} item(ns) dos pedidos
            em aberto precisam de regularização.
            O consumo calculado ainda é parcial.
          </p>
        </div>

        <button
          type="button"
          className="necessidade-pendencias-toggle"
          aria-expanded={expandido}
          onClick={() =>
            setExpandido((anterior) => !anterior)
          }
        >
          {expandido ? (
            <>
              <ChevronUp size={16} />
              Ocultar pendências
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Ver pendências
            </>
          )}
        </button>
      </div>

      {expandido && (
        <div className="necessidade-pendencias-conteudo">
          <div className="necessidade-tabela-container">
            <table className="necessidade-tabela necessidade-tabela-pendencias">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Produto</th>
                  <th>Quantidade nos pedidos</th>
                  <th>Itens afetados</th>
                  <th>Pendência</th>
                </tr>
              </thead>

              <tbody>
                {pendenciasPagina.map((item) => (
                  <tr key={item.codigo}>
                    <td>
                      <strong>{item.codigo}</strong>
                    </td>

                    <td>{item.produto}</td>

                    <td className="necessidade-coluna-numero">
                      {formatarQuantidade(
                        item.quantidade
                      )}
                    </td>

                    <td className="necessidade-coluna-numero">
                      {item.itens}
                    </td>

                    <td>
                      {descricaoPendencia(
                        item.situacao
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacao
            paginaAtual={paginaValida}
            totalItens={pendencias.length}
            itensPorPagina={PENDENCIAS_POR_PAGINA}
            onChangePagina={setPaginaAtual}
          />
        </div>
      )}
    </section>
  );
}

/* ============================================================
   ABAS DE MATÉRIAS-PRIMAS
============================================================ */

function AbasMateriais({
  materiais,
  selecionado,
  onSelecionar,
}) {
  return (
    <div
      className="necessidade-abas"
      role="tablist"
      aria-label="Selecionar matéria-prima"
    >
      {materiais.map((material) => {
        const ativo =
          String(material.id) === String(selecionado);

        return (
          <button
            key={material.id}
            type="button"
            role="tab"
            id={`necessidade-aba-${material.id}`}
            aria-selected={ativo}
            aria-controls="necessidade-painel-material"
            className={
              ativo
                ? "necessidade-aba necessidade-aba-ativa"
                : "necessidade-aba"
            }
            onClick={() =>
              onSelecionar(String(material.id))
            }
          >
            <Package size={16} aria-hidden="true" />

            {material.material}

            {!material.estoqueDisponivel && (
              <AlertTriangle
                size={14}
                className="necessidade-aba-alerta"
                aria-label="Estoque não encontrado"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   PRODUTOS POR MATÉRIA-PRIMA
============================================================ */

function ProdutosDoMaterial({ material, produtos }) {
  const [paginaAtual, setPaginaAtual] = useState(1);

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      produtos.length / PRODUTOS_POR_PAGINA
    )
  );

  const paginaValida = Math.min(
    Math.max(1, paginaAtual),
    totalPaginas
  );

  const inicio =
    (paginaValida - 1) * PRODUTOS_POR_PAGINA;

  const produtosPagina = produtos.slice(
    inicio,
    inicio + PRODUTOS_POR_PAGINA
  );

  const consumoDetalhado = produtos.reduce(
    (total, produto) => total + produto.consumo,
    0
  );

  const diferenca = Math.abs(
    consumoDetalhado - material.consumo
  );

  return (
    <section className="necessidade-detalhamento">
      <div className="necessidade-detalhamento-cabecalho">
        <div>
          <h3>
            Produtos que utilizam {material.material}
          </h3>

          <p>
            Produtos dos pedidos em aberto,
            agrupados pelo código e vinculados
            ao Cadastro de Produto.
          </p>
        </div>

        <span className="necessidade-detalhamento-contador">
          {produtos.length} produto(s)
        </span>
      </div>

      <div className="necessidade-tabela-container">
        <table className="necessidade-tabela necessidade-tabela-produtos">
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>

              <th className="necessidade-coluna-numero">
                Quantidade total
              </th>

              <th className="necessidade-coluna-numero">
                KG/UN
              </th>

              <th className="necessidade-coluna-numero">
                Consumo (kg)
              </th>

              <th className="necessidade-coluna-numero">
                % Compra
              </th>
            </tr>
          </thead>

          <tbody>
            {produtosPagina.map((produto) => (
              <tr key={produto.codigo}>
                <td>
                  <strong>{produto.codigo}</strong>
                </td>

                <td>{produto.produto}</td>

                <td className="necessidade-coluna-numero">
                  {formatarQuantidade(
                    produto.quantidade
                  )}
                </td>

                <td className="necessidade-coluna-numero">
                  {formatarPesoKgUn(
                    produto.pesoKgUn
                  )}
                </td>

                <td className="necessidade-coluna-numero">
                  <strong>
                    {formatarConsumo(
                      produto.consumo
                    )}
                  </strong>
                </td>

                <td className="necessidade-coluna-numero">
                  {formatarPercentual(
                    material.percentual
                  )}
                </td>
              </tr>
            ))}

            {produtosPagina.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="necessidade-detalhamento-vazio"
                >
                  Nenhum produto com parâmetros
                  completos encontrado para
                  esta matéria-prima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginacao
        paginaAtual={paginaValida}
        totalItens={produtos.length}
        itensPorPagina={PRODUTOS_POR_PAGINA}
        onChangePagina={setPaginaAtual}
      />

      {diferenca > 0.01 && (
        <div className="necessidade-alerta" role="alert">
          <AlertTriangle
            size={18}
            aria-hidden="true"
          />

          <span>
            Divergência no consumo de{" "}
            {material.material}: os produtos
            detalhados somam{" "}
            {formatarConsumo(consumoDetalhado)} kg,
            enquanto o resumo principal apresenta{" "}
            {formatarConsumo(material.consumo)} kg.
          </span>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   PÁGINA PRINCIPAL
============================================================ */

export default function NecessidadeMateriaPrimaPage() {
  const [
    materialSelecionado,
    setMaterialSelecionado,
  ] = useState(null);

  const [ajustes, setAjustes] = useState({});

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useNecessidadeMateriaPrima();

  /* ========================================================
     AJUSTES EDITÁVEIS

     Apenas percentual de compra e teto.
  ======================================================== */

  function alterarAjuste(id, campo, valor) {
    if (
      campo !== "percentual" &&
      campo !== "teto"
    ) {
      return;
    }

    const convertido = Math.max(
      0,
      numero(valor)
    );

    const valorFinal =
      campo === "percentual"
        ? Math.min(100, convertido)
        : convertido;

    setAjustes((anterior) => ({
      ...anterior,

      [String(id)]: {
        ...anterior[String(id)],
        [campo]: valorFinal,
      },
    }));
  }

  /* ========================================================
     DADOS CONSOLIDADOS
  ======================================================== */

  const materiais = useMemo(
    () =>
      consolidarNecessidade(
        data,
        ajustes
      ),
    [data, ajustes]
  );

  const produtosPorMaterial = useMemo(
    () =>
      agruparProdutosPorMaterial(
        data?.pedidosAbertos ?? []
      ),
    [data?.pedidosAbertos]
  );

  const materialAtual =
    materiais.find(
      (material) =>
        String(material.id) ===
        String(materialSelecionado)
    ) ??
    materiais[0] ??
    null;

  const produtosDoMaterial = materialAtual
    ? produtosPorMaterial.get(
        String(materialAtual.id)
      ) ?? []
    : [];

  const pedidosAbertos =
    data?.pedidosAbertos ?? [];

  const codigosSemVinculo =
    data?.pendenciasCodigos ?? [];

  const materiaisSemEstoque =
    data?.materiaisSemEstoque ?? [];

  const semEstoqueGlobal =
    Boolean(data) &&
    (data.estoques ?? []).length === 0;

  const necessitaValidacao =
    Boolean(data) &&
    (
      (data?.resumoPedidos?.itensPendentes ?? 0) > 0 ||
      codigosSemVinculo.length > 0 ||
      materiaisSemEstoque.length > 0 ||
      !data.validacao?.calculoHomologado
    );

  /* ========================================================
     INTERFACE
  ======================================================== */

  return (
    <main className="necessidade-page">
      <div className="necessidade-container">
        <PageHeader
          eyebrow="Compras"
          title="Necessidade de Matéria-Prima"
          description="Planejamento baseado nos pedidos de venda, estoque físico do Omie e compras futuras."
          icon={Calculator}
        />

        {isLoading ? (
          <div className="necessidade-estado">
            Carregando dados de matéria-prima...
          </div>
        ) : isError ? (
          <div
            className="necessidade-erro"
            role="alert"
          >
            Não foi possível consultar os dados:{" "}
            {error?.message || "Erro desconhecido."}
          </div>
        ) : (
          <>
            {/* PENDÊNCIAS DOS PRODUTOS */}

            <AlertaPendencias
              pedidos={pedidosAbertos}
            />

            {/* CÓDIGOS OMIE PENDENTES */}

            {codigosSemVinculo.length > 0 && (
              <div
                className="necessidade-alerta"
                role="alert"
              >
                <AlertTriangle
                  size={18}
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    Matérias-primas com pendências
                    de código Omie
                  </strong>

                  <ul>
                    {codigosSemVinculo.map((item) => (
                      <li
                        key={`${item.material_id}-${item.motivo}`}
                      >
                        {item.material} —{" "}
                        {item.codigo_omie || "Sem código"}
                        {" — "}
                        {item.motivo}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ALERTAS DE ESTOQUE */}

            {semEstoqueGlobal && (
              <div
                className="necessidade-alerta"
                role="alert"
              >
                <AlertTriangle
                  size={18}
                  aria-hidden="true"
                />

                Nenhum estoque de matéria-prima
                foi encontrado na integração Omie.
              </div>
            )}

            {materiaisSemEstoque.length > 0 && (
              <div
                className="necessidade-alerta"
                role="alert"
              >
                <AlertTriangle
                  size={18}
                  aria-hidden="true"
                />

                <div>
                  <strong>
                    Estoques ainda não encontrados
                    no Omie
                  </strong>

                  <ul>
                    {materiaisSemEstoque.map((item) => (
                      <li key={item.material_id}>
                        {item.material} —{" "}
                        {item.codigo_omie || "Sem código"}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ABAS DAS MATÉRIAS-PRIMAS */}

            {materiais.length > 0 ? (
              <>
                <AbasMateriais
                  materiais={materiais}
                  selecionado={materialAtual?.id}
                  onSelecionar={setMaterialSelecionado}
                />

                {materialAtual && (
                  <section
                    id="necessidade-painel-material"
                    role="tabpanel"
                    aria-labelledby={
                      `necessidade-aba-${materialAtual.id}`
                    }
                  >
                    {/* RESUMO PRINCIPAL */}

                    <div className="necessidade-tabela-container necessidade-resumo-container">
                      <table className="necessidade-tabela">
                        <thead>
                          <tr>
                            <th>Material</th>
                            <th>Consumo (kg)</th>
                            <th>% Compra</th>
                            <th>Consumo considerado (kg)</th>
                            <th>Estoque OMIE (Kg)</th>
                            <th>Compras futuras (kg)</th>
                            <th>Saldo projetado (Kg)</th>
                            <th>Estoque Segurança (Kg)</th>
                            <th>Necessidade (Kg)</th>
                            <th>Último preço</th>
                            <th>Valor estimado</th>
                          </tr>
                        </thead>

                        <tbody>
                          <tr className="necessidade-linha-resumo necessidade-linha-resumo-destaque">
                            <th>
                              <span className="necessidade-resumo-material">
                                {materialAtual.material}
                              </span>
                            </th>

                            {/* CONSUMO — 2 CASAS */}

                            <td className="necessidade-resumo-celula">
                              <span className="necessidade-resumo-valor">
                                {formatarConsumo(
                                  materialAtual.consumo
                                )}
                              </span>
                            </td>

                            {/* PERCENTUAL EDITÁVEL */}

                            <td className="necessidade-resumo-celula necessidade-resumo-celula-input">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                className="necessidade-resumo-input"
                                value={materialAtual.percentual}
                                aria-label={`Percentual de compra ${materialAtual.material}`}
                                onChange={(event) =>
                                  alterarAjuste(
                                    materialAtual.id,
                                    "percentual",
                                    event.target.value
                                  )
                                }
                              />
                            </td>

                            {/* CONSUMO CONSIDERADO — 2 CASAS */}

                            <td className="necessidade-resumo-celula">
                              <span className="necessidade-resumo-valor">
                                {formatarConsumo(
                                  materialAtual.consumoConsiderado
                                )}
                              </span>
                            </td>

                            {/* ESTOQUE API — 3 CASAS */}

                            <td className="necessidade-resumo-celula">
                              <span className="necessidade-resumo-valor necessidade-resumo-valor-secundario">
                                {materialAtual.estoqueDisponivel
                                  ? formatarKg(
                                      materialAtual.estoqueApi
                                    )
                                  : "Sem dados"}
                              </span>
                            </td>

                            {/* COMPRAS FUTURAS — 3 CASAS */}

                            <td className="necessidade-resumo-celula">
                              <span className="necessidade-resumo-valor">
                                {formatarKg(
                                  materialAtual.comprasFuturas
                                )}
                              </span>
                            </td>

                            {/* SALDO PROJETADO — 3 CASAS */}

                            <td
                              className={`necessidade-resumo-celula ${
                                materialAtual.saldoProjetado !== null &&
                                materialAtual.saldoProjetado < 0
                                  ? "necessidade-negativo"
                                  : ""
                              }`}
                            >
                              <span
                                className={
                                  materialAtual.saldoProjetado !== null &&
                                  materialAtual.saldoProjetado < 0
                                    ? "necessidade-resumo-valor necessidade-resumo-valor-negativo"
                                    : "necessidade-resumo-valor necessidade-resumo-valor-secundario"
                                }
                              >
                                {materialAtual.estoqueDisponivel
                                  ? formatarKg(
                                      materialAtual.saldoProjetado
                                    )
                                  : "—"}
                              </span>
                            </td>

                            {/* TETO EDITÁVEL */}

                            <td className="necessidade-resumo-celula necessidade-resumo-celula-input">
                              <input
                                type="number"
                                min="0"
                                step="0.001"
                                className="necessidade-resumo-input"
                                value={materialAtual.teto}
                                aria-label={`Estoque-teto ${materialAtual.material}`}
                                onChange={(event) =>
                                  alterarAjuste(
                                    materialAtual.id,
                                    "teto",
                                    event.target.value
                                  )
                                }
                              />
                            </td>

                            {/* NECESSIDADE — 3 CASAS */}

                            <td className="necessidade-resumo-celula necessidade-resumo-celula-necessidade">
                              <span className="necessidade-resumo-valor necessidade-resumo-valor-principal">
                                {materialAtual.estoqueDisponivel
                                  ? formatarKg(
                                      materialAtual.necessidade
                                    )
                                  : "—"}
                              </span>
                            </td>

                            {/* ÚLTIMO PREÇO */}

                            <td className="necessidade-resumo-celula">
                              <span className="necessidade-resumo-valor">
                                {formatarPrecoUnitario(
                                  materialAtual.preco
                                )}
                              </span>
                            </td>

                            {/* VALOR ESTIMADO — MOEDA */}

                            <td className="necessidade-resumo-celula necessidade-resumo-celula-valor">
                              <span className="necessidade-resumo-valor necessidade-resumo-valor-destaque">
                                {materialAtual.estoqueDisponivel
                                  ? formatarMoeda(
                                      materialAtual.valorEstimado
                                    )
                                  : "—"}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* PRODUTOS PAGINADOS */}

                    <ProdutosDoMaterial
                      key={materialAtual.id}
                      material={materialAtual}
                      produtos={produtosDoMaterial}
                    />
                  </section>
                )}
              </>
            ) : (
              <div className="necessidade-estado">
                Nenhuma matéria-prima habilitada.
              </div>
            )}

            {/* AVISO DE VALIDAÇÃO */}

            {necessitaValidacao && (
              <p
                className="necessidade-observacao necessidade-observacao-final"
                role="status"
              >
                Os valores apresentados são preliminares
                e não representam uma recomendação
                de compra homologada. Confira os
                cadastros, pedidos e estoques
                antes de comprar.
              </p>
            )}

            {isFetching && (
              <span
                className="necessidade-atualizando"
                role="status"
              >
                Atualizando dados automaticamente...
              </span>
            )}
          </>
        )}
      </div>
    </main>
  );
}
