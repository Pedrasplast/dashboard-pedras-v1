import {
  BadgeDollarSign,
  Banknote,
  Building2,
  CircleDollarSign,
  Clock3,
  Gauge,
  PackageCheck,
  ReceiptText,
  Scale,
  ShoppingCart,
  Truck,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import KpiCard
  from "./KpiCard.jsx";

import TooltipFinanceiro
  from "./TooltipFinanceiro.jsx";

import {
  formatarKg,
  formatarMoeda,
  formatarMoedaKg,
  formatarNumero,
} from "../dashboardMateriaPrimaUtils.js";


function formatarPercentual(
  valor,
  casas = 1,
) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(
        valor,
      ),
    )
  ) {
    return "-";
  }

  return `${Number(
    valor,
  ).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits:
        casas,

      maximumFractionDigits:
        casas,
    },
  )}%`;
}


function formatarDias(
  valor,
) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(
      Number(
        valor,
      ),
    )
  ) {
    return "-";
  }

  return `${formatarNumero(
    valor,
    1,
  )} dias`;
}


export default function PainelFinanceiroMateriaPrima({
  resumo,
  porMaterial,
  porFornecedor,
  evolucao,
  insights,
  materialSelecionado,
  carregando,
}) {
  const misturaMateriais =
    resumo.materiaisDistintos >
    1;


  const dadosGraficoFornecedorMaterial =
    (porFornecedor || []).map(
      (item) => ({
        ...item,

        fornecedorMaterial:
          `${item.fornecedor} • ${item.material}`,
      }),
    );

  return (
    <section className="dmp-financeiro">

      {resumo.comprasSemPreco >
        0 && (

        <div className="dmp-mensagem aviso">

          <ReceiptText
            size={18}
          />

          <span>
            {resumo.comprasSemPreco} compra(s) do período ainda não possuem preço financeiro preenchido.
          </span>

        </div>

      )}


      {misturaMateriais &&
        materialSelecionado ===
          "todos" && (

        <div className="dmp-mensagem informativa">

          <BadgeDollarSign
            size={18}
          />

          <span>
            Existem {resumo.materiaisDistintos} materiais no período. Preço médio e custo por kg permanecem separados por material para não gerar uma média gerencial distorcida.
          </span>

        </div>

      )}


      <section className="dmp-secao">

        <div className="dmp-secao-titulo">

          <div>

            <span>
              Visão executiva
            </span>

            <h2>
              Indicadores principais
            </h2>

          </div>

          <small>
            Valores considerando os filtros selecionados
          </small>

        </div>


        <div className="dmp-kpis">

          <KpiCard
            titulo="Subtotal dos materiais"
            valor={
              carregando
                ? "..."
                : formatarMoeda(
                    resumo.subtotalProdutos,
                    2,
                  )
            }
            subtitulo="Somente quantidade × preço do material"
            icone={
              Banknote
            }
            tipo="azul"
          />


          <KpiCard
            titulo="Total comprado"
            valor={
              carregando
                ? "..."
                : formatarMoeda(
                    resumo.valorTotal,
                    2,
                  )
            }
            subtitulo={
              `${resumo.compras} compra(s) • ticket ${formatarMoeda(
                resumo.ticketMedio,
                2,
              )}`
            }
            icone={
              CircleDollarSign
            }
            tipo="ok"
          />


          <KpiCard
            titulo="Quantidade comprada"
            valor={
              carregando
                ? "..."
                : formatarKg(
                    resumo.quantidadeCompradaKg,
                    0,
                  )
            }
            subtitulo={
              `Média de ${formatarKg(
                resumo.quantidadeMediaCompraKg,
                0,
              )} por compra`
            }
            icone={
              Scale
            }
          />


          <KpiCard
            titulo="Preço médio"
            valor={
              carregando
                ? "..."
                : formatarMoedaKg(
                    resumo.precoMedioKg,
                    3,
                  )
            }
            subtitulo={
              misturaMateriais
                ? "Selecione um material para analisar"
                : "Preço de compra ponderado"
            }
            icone={
              BadgeDollarSign
            }
          />


          <KpiCard
            titulo="Custo efetivo médio"
            valor={
              carregando
                ? "..."
                : formatarMoedaKg(
                    resumo.custoEfetivoMedioKg,
                    3,
                  )
            }
            subtitulo={
              misturaMateriais
                ? "Selecione um material para analisar"
                : "Preço + impostos + frete + despesas"
            }
            icone={
              CircleDollarSign
            }
            tipo="ok"
          />


          <KpiCard
            titulo="Acréscimos líquidos"
            valor={
              carregando
                ? "..."
                : formatarMoeda(
                    resumo.acrescimosLiquidos,
                    2,
                  )
            }
            subtitulo={
              `${formatarPercentual(
                resumo.impactoAcrescimosPercentual,
                1,
              )} sobre o valor base`
            }
            icone={
              Gauge
            }
            tipo={
              resumo.acrescimosLiquidos >
                0
                ? "alerta"
                : "ok"
            }
          />


          <KpiCard
            titulo="Compras em aberto"
            valor={
              carregando
                ? "..."
                : formatarMoeda(
                    resumo.valorComprasAbertas,
                    2,
                  )
            }
            subtitulo={
              `${resumo.comprasAbertas} compra(s) • ${formatarKg(
                resumo.quantidadeComprasAbertasKg,
                0,
              )}`
            }
            icone={
              ShoppingCart
            }
            tipo="alerta"
          />


          <KpiCard
            titulo="Recebido no período"
            valor={
              carregando
                ? "..."
                : formatarMoeda(
                    resumo.valorRecebidoPeriodo,
                    2,
                  )
            }
            subtitulo={
              `${resumo.recebimentosPeriodo} recebimento(s) • ${formatarKg(
                resumo.quantidadeRecebidaKg,
                0,
              )}`
            }
            icone={
              PackageCheck
            }
            tipo="ok"
          />


          <KpiCard
            titulo="Fornecedores ativos"
            valor={
              carregando
                ? "..."
                : formatarNumero(
                    resumo.fornecedoresDistintos,
                    0,
                  )
            }
            subtitulo={
              `${resumo.materiaisDistintos} material(is) no período`
            }
            icone={
              Building2
            }
          />

        </div>

      </section>


      <section className="dmp-secao">

        <div className="dmp-secao-titulo">

          <div>

            <span>
              Fornecimento
            </span>

            <h2>
              Eficiência de entrega
            </h2>

          </div>

          <small>
            Calculado sobre recebimentos do período
          </small>

        </div>


        <div className="dmp-mini-kpis">

          <article>

            <Clock3
              size={19}
            />

            <div>

              <span>
                Prazo médio
              </span>

              <strong>
                {carregando
                  ? "..."
                  : formatarDias(
                      resumo.prazoMedioEntregaDias,
                    )}
              </strong>

              <small>
                Compra até recebimento
              </small>

            </div>

          </article>


          <article>

            <PackageCheck
              size={19}
            />

            <div>

              <span>
                Pontualidade
              </span>

              <strong>
                {carregando
                  ? "..."
                  : formatarPercentual(
                      resumo.pontualidadePercentual,
                      1,
                    )}
              </strong>

              <small>
                Recebimentos dentro da previsão
              </small>

            </div>

          </article>


          <article>

            <Truck
              size={19}
            />

            <div>

              <span>
                Entregas avaliadas
              </span>

              <strong>
                {carregando
                  ? "..."
                  : formatarNumero(
                      resumo.entregasAvaliadas,
                      0,
                    )}
              </strong>

              <small>
                Com datas suficientes para cálculo
              </small>

            </div>

          </article>


          <article>

            <ReceiptText
              size={19}
            />

            <div>

              <span>
                Atrasos
              </span>

              <strong>
                {carregando
                  ? "..."
                  : formatarNumero(
                      resumo.atrasos,
                      0,
                    )}
              </strong>

              <small>
                Média de {formatarDias(
                  resumo.atrasoMedioDias,
                )}
              </small>

            </div>

          </article>

        </div>

      </section>


      {insights?.length >
        0 && (

        <section className="dmp-secao">

          <div className="dmp-secao-titulo">

            <div>

              <span>
                Leitura gerencial
              </span>

              <h2>
                Destaques do período
              </h2>

            </div>

            <small>
              Informações descritivas calculadas a partir das compras
            </small>

          </div>


          <div className="dmp-insights">

            {insights.map(
              (
                item,
                indice,
              ) => (

              <article
                key={
                  `${item.titulo}_${indice}`
                }
              >

                <span>
                  {item.titulo}
                </span>

                <strong>
                  {item.valor}
                </strong>

                <small>
                  {item.detalhe}
                </small>

              </article>

            ))}

          </div>

        </section>

      )}


      <section className="dmp-grid-graficos">

        <article className="dmp-card">

          <div className="dmp-card-header">

            <div>

              <span>
                Participação
              </span>

              <h2>
                Valor comprado por fornecedor e material
              </h2>

              <p>
                Comparação do valor total comprado por fornecedor, separado por material.
              </p>

            </div>

            <Banknote
              size={21}
            />

          </div>


          <div className="dmp-chart">

            {dadosGraficoFornecedorMaterial.length >
            0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={
                    dadosGraficoFornecedorMaterial
                  }
                  layout="vertical"
                  margin={{
                    top:
                      8,
                    right:
                      24,
                    left:
                      110,
                    bottom:
                      0,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={
                      false
                    }
                  />

                  <XAxis
                    type="number"
                    tick={{
                      fontSize:
                        11,
                    }}
                    tickFormatter={
                      (
                        valor,
                      ) =>
                        `${Math.round(
                          Number(
                            valor,
                          ) /
                          1000,
                        )}k`
                    }
                  />

                  <YAxis
                    dataKey="fornecedorMaterial"
                    type="category"
                    width={210}
                    tick={{
                      fontSize:
                        12,
                    }}
                  />

                  <Tooltip
                    content={
                      <TooltipFinanceiro />
                    }
                  />

                  <Bar
                    dataKey="total"
                    name="Total comprado"
                    fill="#2563eb"
                    radius={[
                      0,
                      7,
                      7,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (

              <div className="dmp-vazio">

                <Banknote
                  size={28}
                />

                <strong>
                  Sem valores financeiros
                </strong>

                <span>
                  Não há compras para o filtro selecionado.
                </span>

              </div>

            )}

          </div>

        </article>


        <article className="dmp-card">

          <div className="dmp-card-header">

            <div>

              <span>
                Tendência
              </span>

              <h2>
                Preço x custo efetivo por kg
              </h2>

              <p>
                {misturaMateriais
                  ? "Selecione um material para comparar preço e custo unitário."
                  : "Evolução das médias ponderadas por data de compra."}
              </p>

            </div>

            <CircleDollarSign
              size={21}
            />

          </div>


          <div className="dmp-chart">

            {evolucao.length >
            0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={
                    evolucao
                  }
                  margin={{
                    top:
                      12,
                    right:
                      24,
                    left:
                      10,
                    bottom:
                      4,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={
                      false
                    }
                  />

                  <XAxis
                    dataKey="dataLabel"
                    minTickGap={18}
                    tick={{
                      fontSize:
                        11,
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize:
                        11,
                    }}
                    tickFormatter={
                      (
                        valor,
                      ) =>
                        Number(
                          valor,
                        ).toLocaleString(
                          "pt-BR",
                          {
                            minimumFractionDigits:
                              2,
                            maximumFractionDigits:
                              2,
                          },
                        )
                    }
                  />

                  <Tooltip
                    content={
                      <TooltipFinanceiro />
                    }
                  />

                  <Legend
                    iconSize={10}
                    wrapperStyle={{
                      fontSize:
                        11,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="precoMedioKg"
                    name="Preço médio/kg"
                    stroke="#2563eb"
                    strokeWidth={2.8}
                    dot={{
                      r:
                        3,
                    }}
                    connectNulls
                  />

                  <Line
                    type="monotone"
                    dataKey="custoMedioKg"
                    name="Custo efetivo/kg"
                    stroke="#059669"
                    strokeWidth={2.8}
                    dot={{
                      r:
                        3,
                    }}
                    connectNulls
                  />

                </LineChart>

              </ResponsiveContainer>

            ) : (

              <div className="dmp-vazio">

                <CircleDollarSign
                  size={28}
                />

                <strong>
                  {misturaMateriais
                    ? "Selecione um material"
                    : "Sem histórico financeiro"}
                </strong>

                <span>
                  {misturaMateriais
                    ? "Custos unitários de materiais diferentes não são misturados."
                    : "Não há compras com preço para o período selecionado."}
                </span>

              </div>

            )}

          </div>

        </article>

      </section>


      <section className="dmp-card dmp-tabela-card">

        <div className="dmp-card-header">

          <div>

            <span>
              Materiais
            </span>

            <h2>
              Análise gerencial por material
            </h2>

            <p>
              Preço e custo por kg, subtotal do material, custos adicionais, dispersão de preço e total efetivo.
            </p>

          </div>

          <BadgeDollarSign
            size={21}
          />

        </div>


        <div className="dmp-tabela-wrapper">

          <table className="dmp-tabela dmp-tabela-material">

            <thead>

              <tr>

                <th>
                  Material
                </th>

                <th className="numero">
                  Fornec.
                </th>

                <th className="numero">
                  Compras
                </th>

                <th className="numero">
                  Quantidade
                </th>

                <th className="numero">
                  Preço médio/kg
                </th>

                <th className="numero">
                  Custo médio/kg
                </th>

                <th className="numero">
                  Acréscimo/kg
                </th>

                <th className="numero">
                  Impacto
                </th>

                <th className="numero">
                  Menor preço
                </th>

                <th className="numero">
                  Maior preço
                </th>

                <th className="numero">
                  Amplitude
                </th>

                <th className="numero">
                  Último preço
                </th>

                <th className="numero">
                  Var. última
                </th>

                <th className="numero">
                  Participação
                </th>

                <th className="numero">
                  Subtotal
                </th>

                <th className="numero">
                  Total
                </th>

              </tr>

            </thead>


            <tbody>

              {porMaterial.map(
                (
                  item,
                ) => (

                  <tr
                    key={
                      item.materialId
                    }
                  >

                    <td>
                      <strong>
                        {item.material}
                      </strong>
                    </td>

                    <td className="numero">
                      {item.fornecedores}
                    </td>

                    <td className="numero">
                      {item.compras}
                    </td>

                    <td className="numero">
                      {formatarKg(
                        item.quantidadeKg,
                        0,
                      )}
                    </td>

                    <td className="numero">
                      {formatarMoedaKg(
                        item.precoMedioKg,
                        3,
                      )}
                    </td>

                    <td className="numero dmp-custo">
                      {formatarMoedaKg(
                        item.custoMedioKg,
                        3,
                      )}
                    </td>

                    <td className="numero">
                      {formatarMoedaKg(
                        item.custoAdicionalKg,
                        3,
                      )}
                    </td>

                    <td className="numero">
                      {formatarPercentual(
                        item.impactoCustoPercentual,
                        1,
                      )}
                    </td>

                    <td className="numero">
                      {formatarMoedaKg(
                        item.precoMinimoKg,
                        2,
                      )}
                    </td>

                    <td className="numero">
                      {formatarMoedaKg(
                        item.precoMaximoKg,
                        2,
                      )}
                    </td>

                    <td className="numero">
                      {formatarPercentual(
                        item.amplitudePrecoPercentual,
                        1,
                      )}
                    </td>

                    <td className="numero">
                      {formatarMoedaKg(
                        item.ultimoPrecoKg,
                        2,
                      )}
                    </td>

                    <td
                      className={
                        [
                          "numero",
                          item.variacaoUltimaCompraPercentual >
                            0
                            ? "dmp-variacao-alta"
                            : item.variacaoUltimaCompraPercentual <
                                0
                              ? "dmp-variacao-baixa"
                              : "",
                        ].join(
                          " ",
                        )
                      }
                    >
                      {formatarPercentual(
                        item.variacaoUltimaCompraPercentual,
                        1,
                      )}
                    </td>

                    <td className="numero">
                      {formatarPercentual(
                        item.participacaoValorPercentual,
                        1,
                      )}
                    </td>

                    <td className="numero dmp-subtotal">
                      {formatarMoeda(
                        item.subtotal,
                        2,
                      )}
                    </td>

                    <td className="numero dmp-total">
                      {formatarMoeda(
                        item.total,
                        2,
                      )}
                    </td>

                  </tr>

                ),
              )}

            </tbody>

          </table>

        </div>

      </section>


      <section className="dmp-card dmp-tabela-card">

        <div className="dmp-card-header">

          <div>

            <span>
              Fornecedores
            </span>

            <h2>
              Comparativo por material e fornecedor
            </h2>

            <p>
              Preço, custo, subtotal, total efetivo, participação e desempenho de entrega por fornecedor.
            </p>

          </div>

          <Building2
            size={21}
          />

        </div>


        <div className="dmp-tabela-wrapper">

          <table className="dmp-tabela dmp-tabela-fornecedor">

            <thead>

              <tr>

                <th>
                  Material
                </th>

                <th>
                  Fornecedor
                </th>

                <th className="numero">
                  Compras
                </th>

                <th className="numero">
                  Quantidade
                </th>

                <th className="numero">
                  Preço médio/kg
                </th>

                <th className="numero">
                  Custo médio/kg
                </th>

                <th className="numero">
                  Último preço
                </th>

                <th className="numero">
                  Menor preço
                </th>

                <th className="numero">
                  Maior preço
                </th>

                <th className="numero">
                  Participação
                </th>

                <th className="numero">
                  Prazo médio entrega
                </th>

                <th className="numero">
                  Subtotal
                </th>

                <th className="numero">
                  Total
                </th>

              </tr>

            </thead>


            <tbody>

              {porFornecedor.map(
                (
                  item,
                ) => (

                  <tr
                    key={
                      `${item.materialId}_${item.fornecedorId}`
                    }
                  >

                    <td>
                      <strong>
                        {item.material}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {item.fornecedor}
                      </strong>
                    </td>

                    <td className="numero">
                      {item.compras}
                    </td>

                    <td className="numero">
                      {formatarKg(
                        item.quantidadeKg,
                        0,
                      )}
                    </td>

                    <td className="numero">
                      {formatarMoedaKg(
                        item.precoMedioKg,
                        3,
                      )}
                    </td>

                    <td className="numero dmp-custo">
                      {formatarMoedaKg(
                        item.custoMedioKg,
                        3,
                      )}
                    </td>

                    <td className="numero">
                      {formatarMoedaKg(
                        item.ultimoPrecoKg,
                        2,
                      )}
                    </td>

                    <td className="numero">
                      {formatarMoedaKg(
                        item.precoMinimoKg,
                        2,
                      )}
                    </td>

                    <td className="numero">
                      {formatarMoedaKg(
                        item.precoMaximoKg,
                        2,
                      )}
                    </td>

                    <td className="numero">
                      {formatarPercentual(
                        item.participacaoMaterialPercentual,
                        1,
                      )}
                    </td>

                    <td className="numero">
                      {formatarDias(
                        item.prazoMedioEntregaDias,
                      )}
                    </td>

                    <td className="numero dmp-subtotal">
                      {formatarMoeda(
                        item.subtotal,
                        2,
                      )}
                    </td>

                    <td className="numero dmp-total">
                      {formatarMoeda(
                        item.total,
                        2,
                      )}
                    </td>

                  </tr>

                ),
              )}

            </tbody>

          </table>

        </div>

      </section>

    </section>
  );
}