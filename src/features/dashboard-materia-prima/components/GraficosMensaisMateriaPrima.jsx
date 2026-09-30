import {
  Banknote,
  Scale,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatarMoeda,
  formatarNumero,
} from "../dashboardMateriaPrimaUtils.js";

import {
  formatarKgCompleto,
  formatarMoedaCompleta,
} from "./materiaPrimaFormatters.js";


/* =========================================================
   RÓTULO DAS BARRAS
========================================================= */

function RotuloMensal({
  x,
  y,
  width,
  value,
  tipo,
}) {
  const numero =
    Number(
      value,
    );

  if (
    !Number.isFinite(
      numero,
    ) ||
    numero === 0
  ) {
    return null;
  }


  const texto =
    tipo ===
    "valor"
      ? formatarMoedaCompleta(
          numero,
        )
      : formatarKgCompleto(
          numero,
        );


  return (
    <text
      className="dmp-rotulo-mensal"
      x={
        Number(
          x,
        ) +
        Number(
          width,
        ) /
          2
      }
      y={
        Number(
          y,
        ) -
        10
      }
      textAnchor="middle"
      fill="#334155"
      fontSize={10}
      fontWeight={800}
    >
      {texto}
    </text>
  );
}


/* =========================================================
   TOOLTIP MENSAL
========================================================= */

function TooltipMensal({
  active,
  payload,
  label,
  tipo,
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }


  const item =
    payload[0]?.payload;


  return (
    <div className="dmp-tooltip">

      <strong>
        {label}
        {item?.ano
          ? `/${item.ano}`
          : ""}
      </strong>


      {tipo ===
      "valor" ? (
        <span>
          Valor comprado:{" "}
          {formatarMoeda(
            item?.valorComprado,
            2,
          )}
        </span>
      ) : (
        <span>
          Quantidade:{" "}
          {formatarKgCompleto(
            item?.quantidadeKg,
          )}
        </span>
      )}


      <span>
        Compras:{" "}
        {formatarNumero(
          item?.compras,
          0,
        )}
      </span>

    </div>
  );
}


/* =========================================================
   CARD MENSAL
========================================================= */

function GraficoMensal({
  tipo,
  mensal,
  titulo,
  descricao,
  totalTitulo,
  total,
  media,
}) {
  const ehValor =
    tipo ===
    "valor";


  const dataKey =
    ehValor
      ? "valorComprado"
      : "quantidadeKg";


  const formatador =
    ehValor
      ? formatarMoedaCompleta
      : formatarKgCompleto;


  const gradiente =
    ehValor
      ? "gradienteValorMensal"
      : "gradienteQuantidadeMensal";


  const classe =
    ehValor
      ? "dmp-card-mensal-valor"
      : "dmp-card-mensal-quantidade";


  const corInicial =
    ehValor
      ? "#2563eb"
      : "#0f766e";


  const corFinal =
    ehValor
      ? "#60a5fa"
      : "#2dd4bf";


  const IconeVazio =
    ehValor
      ? Banknote
      : Scale;


  return (
    <article
      className={`dmp-card dmp-card-mensal ${classe}`}
    >

      <div className="dmp-card-header dmp-card-header-mensal">

        <div className="dmp-card-header-mensal-titulo">

          <span>
            Evolução mensal
          </span>

          <h2>
            {titulo}
          </h2>

          <p className="dmp-periodo-mensal">
            {descricao}
          </p>

        </div>


        <div className="dmp-chart-header-resumo">

          <div className="dmp-chart-header-resumo-principal">

            <small>
              {totalTitulo}
            </small>

            <strong>
              {formatador(
                total,
              )}
            </strong>

          </div>


          <div>

            <small>
              Média mensal
            </small>

            <span>
              {formatador(
                media,
              )}
            </span>

          </div>

        </div>

      </div>


      <div className="dmp-chart dmp-chart-mensal">

        {mensal.length >
        0 ? (

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={
                mensal
              }
              margin={{
                top:
                  42,

                right:
                  24,

                left:
                  16,

                bottom:
                  8,
              }}
              barCategoryGap="28%"
            >

              <defs>

                <linearGradient
                  id={
                    gradiente
                  }
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="0%"
                    stopColor={
                      corInicial
                    }
                  />

                  <stop
                    offset="100%"
                    stopColor={
                      corFinal
                    }
                  />

                </linearGradient>

              </defs>


              <CartesianGrid
                strokeDasharray="3 7"
                vertical={
                  false
                }
                stroke="#e8eef5"
              />


              <XAxis
                dataKey="mesLabel"
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                interval={0}
                tick={{
                  fontSize:
                    11,

                  fontWeight:
                    700,

                  fill:
                    "#64748b",
                }}
                dy={8}
              />


              <YAxis
                axisLine={
                  false
                }
                tickLine={
                  false
                }
                width={
                  ehValor
                    ? 105
                    : 94
                }
                tick={{
                  fontSize:
                    9.5,

                  fill:
                    "#94a3b8",
                }}
                tickFormatter={
                  formatador
                }
              />


              <Tooltip
                content={
                  <TooltipMensal
                    tipo={
                      tipo
                    }
                  />
                }
                cursor={{
                  fill:
                    ehValor
                      ? "rgba(37, 99, 235, 0.04)"
                      : "rgba(15, 118, 110, 0.04)",
                }}
              />


              <Bar
                dataKey={
                  dataKey
                }
                name={
                  ehValor
                    ? "Valor comprado"
                    : "Quantidade comprada"
                }
                fill={`url(#${gradiente})`}
                radius={[
                  8,
                  8,
                  3,
                  3,
                ]}
                maxBarSize={48}
                isAnimationActive={
                  true
                }
                animationDuration={700}
              >

                <LabelList
                  dataKey={
                    dataKey
                  }
                  content={
                    <RotuloMensal
                      tipo={
                        tipo
                      }
                    />
                  }
                />

              </Bar>

            </BarChart>

          </ResponsiveContainer>

        ) : (

          <div className="dmp-vazio">

            <IconeVazio
              size={28}
            />

            <strong>
              Sem compras no período
            </strong>

            <span>
              Não existem dados para os filtros selecionados.
            </span>

          </div>

        )}

      </div>

    </article>
  );
}


/* =========================================================
   GRÁFICOS MENSAIS
========================================================= */

export default function GraficosMensaisMateriaPrima({
  mensal,
}) {
  const dados =
    Array.isArray(
      mensal,
    )
      ? mensal
      : [];


  const quantidadeMeses =
    dados.length;


  const totalValor =
    dados.reduce(
      (
        total,
        item,
      ) =>
        total +
        Number(
          item.valorComprado ||
          0,
        ),
      0,
    );


  const totalQuantidade =
    dados.reduce(
      (
        total,
        item,
      ) =>
        total +
        Number(
          item.quantidadeKg ||
          0,
        ),
      0,
    );


  const mediaValor =
    quantidadeMeses >
    0
      ? totalValor /
        quantidadeMeses
      : 0;


  const mediaQuantidade =
    quantidadeMeses >
    0
      ? totalQuantidade /
        quantidadeMeses
      : 0;


  const periodo =
    quantidadeMeses >
    0
      ? `${dados[0].mesLabel} → ${
          dados[
            quantidadeMeses -
            1
          ].mesLabel
        }/${dados[0].ano}`
      : "-";


  return (
    <section className="dmp-grid-graficos">

      <GraficoMensal
        tipo="valor"
        mensal={
          dados
        }
        titulo="Valor comprado por mês"
        descricao={
          periodo
        }
        totalTitulo="Total do período"
        total={
          totalValor
        }
        media={
          mediaValor
        }
      />


      <GraficoMensal
        tipo="quantidade"
        mensal={
          dados
        }
        titulo="Quantidade comprada por mês"
        descricao={
          periodo
        }
        totalTitulo="Volume do período"
        total={
          totalQuantidade
        }
        media={
          mediaQuantidade
        }
      />

    </section>
  );
}