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
  LabelList,
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


function formatarMoedaCompacta(
  valor,
) {
  const numero =
    Number(
      valor,
    );

  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "R$ 0";
  }

  if (
    Math.abs(
      numero,
    ) >= 1000000
  ) {
    return `R$ ${(numero / 1000000).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          1,

        maximumFractionDigits:
          1,
      },
    )} mi`;
  }

  if (
    Math.abs(
      numero,
    ) >= 1000
  ) {
    return `R$ ${(numero / 1000).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          0,

        maximumFractionDigits:
          1,
      },
    )} mil`;
  }

  return formatarMoeda(
    numero,
    0,
  );
}


function formatarKgCompacto(
  valor,
) {
  const numero =
    Number(
      valor,
    );

  if (
    !Number.isFinite(
      numero,
    )
  ) {
    return "0 kg";
  }

  if (
    Math.abs(
      numero,
    ) >= 1000000
  ) {
    return `${(numero / 1000000).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          1,

        maximumFractionDigits:
          1,
      },
    )} mi kg`;
  }

  if (
    Math.abs(
      numero,
    ) >= 1000
  ) {
    return `${(numero / 1000).toLocaleString(
      "pt-BR",
      {
        minimumFractionDigits:
          0,

        maximumFractionDigits:
          1,
      },
    )} mil kg`;
  }

  return formatarKg(
    numero,
    0,
  );
}


function TickFornecedorMaterial({
  x,
  y,
  payload,
}) {
  const valor =
    String(
      payload?.value ??
      "",
    );

  const separador =
    " • ";

  const indice =
    valor.indexOf(
      separador,
    );

  const fornecedor =
    indice >= 0
      ? valor.slice(
          0,
          indice,
        )
      : valor;

  const material =
    indice >= 0
      ? valor.slice(
          indice +
            separador.length,
        )
      : "";

  const fornecedorCurto =
    fornecedor.length > 23
      ? `${fornecedor.slice(
          0,
          23,
        )}…`
      : fornecedor;

  const materialCurto =
    material.length > 25
      ? `${material.slice(
          0,
          25,
        )}…`
      : material;

  return (
    <g
      transform={`translate(${x},${y})`}
    >
      <text
        x={-10}
        y={-4}
        textAnchor="end"
        fill="#334155"
        fontSize={11.5}
        fontWeight={700}
      >
        {fornecedorCurto}
      </text>

      {materialCurto && (
        <text
          x={-10}
          y={12}
          textAnchor="end"
          fill="#94a3b8"
          fontSize={9.5}
          fontWeight={500}
        >
          {materialCurto}
        </text>
      )}
    </g>
  );
}


function RotuloValorBarra({
  x,
  y,
  width,
  height,
  value,
}) {
  return (
    <text
      x={Number(
        x,
      ) +
        Number(
          width,
        ) +
        8}
      y={Number(
        y,
      ) +
        Number(
          height,
        ) /
          2 +
        4}
      fill="#475569"
      fontSize={10.5}
      fontWeight={700}
    >
      {formatarMoedaCompacta(
        value,
      )}
    </text>
  );
}


function RotuloQuantidadeBarra({
  x,
  y,
  width,
  height,
  value,
}) {
  return (
    <text
      x={Number(
        x,
      ) +
        Number(
          width,
        ) +
        8}
      y={Number(
        y,
      ) +
        Number(
          height,
        ) /
          2 +
        4}
      fill="#475569"
      fontSize={10.5}
      fontWeight={700}
    >
      {formatarKgCompacto(
        value,
      )}
    </text>
  );
}


function TooltipQuantidade({
  active,
  payload,
  label,
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  const valor =
    payload[0]?.value;

  return (
    <div className="dmp-tooltip">

      {label && (
        <strong>
          {label}
        </strong>
      )}

      <span>
        Quantidade: {formatarKg(
          valor,
          0,
        )}
      </span>

    </div>
  );
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
    (porFornecedor || [])
      .map(
        (item) => ({
          ...item,

          fornecedorMaterial:
            `${item.fornecedor} • ${item.material}`,
        }),
      )
      .sort(
        (
          a,
          b,
        ) =>
          Number(
            b.total ||
              0,
          ) -
          Number(
            a.total ||
              0,
          ),
      );


  const dadosGraficoQuantidade =
    [
      ...dadosGraficoFornecedorMaterial,
    ].sort(
      (
        a,
        b,
      ) =>
        Number(
          b.quantidadeKg ||
            0,
        ) -
        Number(
          a.quantidadeKg ||
            0,
        ),
    );


  const dadosGraficoPrecoCusto =
    dadosGraficoFornecedorMaterial.filter(
      (item) =>
        item.precoMedioKg !== null &&
        item.precoMedioKg !== undefined &&
        item.custoMedioKg !== null &&
        item.custoMedioKg !== undefined &&
        Number.isFinite(
          Number(
            item.precoMedioKg,
          ),
        ) &&
        Number.isFinite(
          Number(
            item.custoMedioKg,
          ),
        ),
    );


  const alturaGraficoFornecedor =
    Math.max(
      315,
      dadosGraficoFornecedorMaterial.length *
        52 +
        70,
    );


  const alturaGraficoPrecoCusto =
    Math.max(
      315,
      dadosGraficoPrecoCusto.length *
        64 +
        80,
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
                Destaques
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
                Ranking financeiro
              </span>

              <h2>
                Valor comprado por fornecedor
              </h2>

              <p>
                Ranking do maior para o menor valor comprado, com identificação do material.
              </p>

            </div>

            <Banknote
              size={21}
            />

          </div>


          <div
            className="dmp-chart"
            style={{
              height:
                alturaGraficoFornecedor,
            }}
          >

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
                      12,

                    right:
                      105,

                    left:
                      18,

                    bottom:
                      8,
                  }}
                  barCategoryGap="30%"
                >

                  <CartesianGrid
                    strokeDasharray="3 5"
                    horizontal={
                      false
                    }
                    stroke="#e8eef5"
                  />

                  <XAxis
                    type="number"
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={{
                      fontSize:
                        10.5,

                      fill:
                        "#94a3b8",
                    }}
                    tickFormatter={
                      formatarMoedaCompacta
                    }
                  />

                  <YAxis
                    dataKey="fornecedorMaterial"
                    type="category"
                    width={190}
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={
                      <TickFornecedorMaterial />
                    }
                    interval={0}
                  />

                  <Tooltip
                    content={
                      <TooltipFinanceiro />
                    }
                    cursor={{
                      fill:
                        "#f8fafc",
                    }}
                  />

                  <Bar
                    dataKey="total"
                    name="Total comprado"
                    fill="#2563eb"
                    radius={[
                      0,
                      8,
                      8,
                      0,
                    ]}
                    barSize={24}
                    isAnimationActive={
                      true
                    }
                    animationDuration={650}
                  >

                    <LabelList
                      dataKey="total"
                      content={
                        <RotuloValorBarra />
                      }
                    />

                  </Bar>

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
                Volume
              </span>

              <h2>
                Quantidade comprada por fornecedor
              </h2>

              <p>
                Comparação do volume comprado em kg para cada fornecedor e material.
              </p>

            </div>

            <Scale
              size={21}
            />

          </div>


          <div
            className="dmp-chart"
            style={{
              height:
                alturaGraficoFornecedor,
            }}
          >

            {dadosGraficoQuantidade.length >
            0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={
                    dadosGraficoQuantidade
                  }
                  layout="vertical"
                  margin={{
                    top:
                      12,

                    right:
                      105,

                    left:
                      18,

                    bottom:
                      8,
                  }}
                  barCategoryGap="30%"
                >

                  <CartesianGrid
                    strokeDasharray="3 5"
                    horizontal={
                      false
                    }
                    stroke="#e8eef5"
                  />

                  <XAxis
                    type="number"
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={{
                      fontSize:
                        10.5,

                      fill:
                        "#94a3b8",
                    }}
                    tickFormatter={
                      formatarKgCompacto
                    }
                  />

                  <YAxis
                    dataKey="fornecedorMaterial"
                    type="category"
                    width={190}
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={
                      <TickFornecedorMaterial />
                    }
                    interval={0}
                  />

                  <Tooltip
                    content={
                      <TooltipQuantidade />
                    }
                    cursor={{
                      fill:
                        "#f8fafc",
                    }}
                  />

                  <Bar
                    dataKey="quantidadeKg"
                    name="Quantidade comprada"
                    fill="#0f766e"
                    radius={[
                      0,
                      8,
                      8,
                      0,
                    ]}
                    barSize={24}
                    isAnimationActive={
                      true
                    }
                    animationDuration={650}
                  >

                    <LabelList
                      dataKey="quantidadeKg"
                      content={
                        <RotuloQuantidadeBarra />
                      }
                    />

                  </Bar>

                </BarChart>

              </ResponsiveContainer>

            ) : (

              <div className="dmp-vazio">

                <Scale
                  size={28}
                />

                <strong>
                  Sem volume comprado
                </strong>

                <span>
                  Não há quantidades para o filtro selecionado.
                </span>

              </div>

            )}

          </div>

        </article>


        <article className="dmp-card">

          <div className="dmp-card-header">

            <div>

              <span>
                Comparativo de custo
              </span>

              <h2>
                Preço médio x custo efetivo por fornecedor
              </h2>

              <p>
                Mostra quanto o preço negociado se transforma em custo real após frete, impostos e despesas.
              </p>

            </div>

            <CircleDollarSign
              size={21}
            />

          </div>


          <div
            className="dmp-chart"
            style={{
              height:
                alturaGraficoPrecoCusto,
            }}
          >

            {dadosGraficoPrecoCusto.length >
            0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={
                    dadosGraficoPrecoCusto
                  }
                  layout="vertical"
                  margin={{
                    top:
                      18,

                    right:
                      30,

                    left:
                      18,

                    bottom:
                      8,
                  }}
                  barCategoryGap="24%"
                  barGap={4}
                >

                  <CartesianGrid
                    strokeDasharray="3 5"
                    horizontal={
                      false
                    }
                    stroke="#e8eef5"
                  />

                  <XAxis
                    type="number"
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={{
                      fontSize:
                        10.5,

                      fill:
                        "#94a3b8",
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

                  <YAxis
                    dataKey="fornecedorMaterial"
                    type="category"
                    width={190}
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={
                      <TickFornecedorMaterial />
                    }
                    interval={0}
                  />

                  <Tooltip
                    content={
                      <TooltipFinanceiro />
                    }
                    cursor={{
                      fill:
                        "#f8fafc",
                    }}
                  />

                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize:
                        11,

                      paddingTop:
                        8,
                    }}
                  />

                  <Bar
                    dataKey="precoMedioKg"
                    name="Preço médio/kg"
                    fill="#2563eb"
                    radius={[
                      0,
                      6,
                      6,
                      0,
                    ]}
                    barSize={12}
                  />

                  <Bar
                    dataKey="custoMedioKg"
                    name="Custo efetivo/kg"
                    fill="#059669"
                    radius={[
                      0,
                      6,
                      6,
                      0,
                    ]}
                    barSize={12}
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (

              <div className="dmp-vazio">

                <CircleDollarSign
                  size={28}
                />

                <strong>
                  Sem custo comparável
                </strong>

                <span>
                  Não há preço e custo por kg suficientes para o filtro selecionado.
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


          <div
            className="dmp-chart"
            style={{
              height:
                alturaGraficoPrecoCusto,
            }}
          >

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
                    strokeDasharray="3 5"
                    vertical={
                      false
                    }
                    stroke="#e8eef5"
                  />

                  <XAxis
                    dataKey="dataLabel"
                    minTickGap={18}
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={{
                      fontSize:
                        10.5,

                      fill:
                        "#94a3b8",
                    }}
                  />

                  <YAxis
                    axisLine={
                      false
                    }
                    tickLine={
                      false
                    }
                    tick={{
                      fontSize:
                        10.5,

                      fill:
                        "#94a3b8",
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
                    iconType="circle"
                    iconSize={8}
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
                    dot={
                      false
                    }
                    activeDot={{
                      r:
                        4,
                    }}
                    connectNulls
                  />

                  <Line
                    type="monotone"
                    dataKey="custoMedioKg"
                    name="Custo efetivo/kg"
                    stroke="#059669"
                    strokeWidth={2.8}
                    dot={
                      false
                    }
                    activeDot={{
                      r:
                        4,
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
                  Variação mín.–máx.
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