import {
  useMemo,
} from "react";

import {
  Banknote,
  CircleDollarSign,
  Scale,
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

import TooltipFinanceiro
  from "./TooltipFinanceiro.jsx";

import {
  formatarKg,
} from "../dashboardMateriaPrimaUtils.js";

import {
  formatarKgCompacto,
  formatarMoedaCompacta,
} from "./materiaPrimaFormatters.js";


/* =========================================================
   TICK FORNECEDOR / MATERIAL
========================================================= */

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
    fornecedor.length >
    23
      ? `${fornecedor.slice(
          0,
          23,
        )}…`
      : fornecedor;


  const materialCurto =
    material.length >
    25
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


/* =========================================================
   RÓTULOS HORIZONTAIS
========================================================= */

function RotuloHorizontal({
  x,
  y,
  width,
  height,
  value,
  tipo,
}) {
  const texto =
    tipo ===
    "valor"
      ? formatarMoedaCompacta(
          value,
        )
      : formatarKgCompacto(
          value,
        );


  return (
    <text
      x={
        Number(
          x,
        ) +
        Number(
          width,
        ) +
        8
      }
      y={
        Number(
          y,
        ) +
        Number(
          height,
        ) /
          2 +
        4
      }
      fill="#475569"
      fontSize={10.5}
      fontWeight={700}
    >
      {texto}
    </text>
  );
}


/* =========================================================
   TOOLTIP QUANTIDADE
========================================================= */

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


  return (
    <div className="dmp-tooltip">

      {label && (
        <strong>
          {label}
        </strong>
      )}

      <span>
        Quantidade:{" "}
        {formatarKg(
          payload[0]?.value,
          0,
        )}
      </span>

    </div>
  );
}


/* =========================================================
   GRÁFICOS
========================================================= */

export default function GraficosFornecedorMateriaPrima({
  porFornecedor,
  evolucao,
  misturaMateriais,
}) {
  const dadosGraficoFornecedorMaterial =
    useMemo(
      () =>
        (
          porFornecedor ||
          []
        )
          .map(
            (
              item,
            ) => ({
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
          ),
      [
        porFornecedor,
      ],
    );


  const dadosGraficoQuantidade =
    useMemo(
      () =>
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
        ),
      [
        dadosGraficoFornecedorMaterial,
      ],
    );


  const dadosGraficoPrecoCusto =
    useMemo(
      () =>
        dadosGraficoFornecedorMaterial.filter(
          (
            item,
          ) =>
            item.precoMedioKg !==
              null &&
            item.precoMedioKg !==
              undefined &&
            item.custoMedioKg !==
              null &&
            item.custoMedioKg !==
              undefined &&
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
        ),
      [
        dadosGraficoFornecedorMaterial,
      ],
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
    <section className="dmp-grid-graficos">

      {/* =================================================
          VALOR POR FORNECEDOR
      ================================================= */}

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
              Ranking do maior para o menor valor comprado,
              com identificação do material.
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
                  animationDuration={650}
                >

                  <LabelList
                    dataKey="total"
                    content={
                      <RotuloHorizontal
                        tipo="valor"
                      />
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


      {/* =================================================
          QUANTIDADE POR FORNECEDOR
      ================================================= */}

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
              Comparação do volume comprado em kg para cada
              fornecedor e material.
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
                  animationDuration={650}
                >

                  <LabelList
                    dataKey="quantidadeKg"
                    content={
                      <RotuloHorizontal
                        tipo="quantidade"
                      />
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


      {/* =================================================
          PREÇO X CUSTO POR FORNECEDOR
      ================================================= */}

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
              Mostra quanto o preço negociado se transforma em
              custo real após frete, impostos e despesas.
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
                Não há preço e custo por kg suficientes para o
                filtro selecionado.
              </span>

            </div>

          )}

        </div>

      </article>


      {/* =================================================
          EVOLUÇÃO PREÇO X CUSTO
      ================================================= */}

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

          {evolucao?.length >
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
  );
}