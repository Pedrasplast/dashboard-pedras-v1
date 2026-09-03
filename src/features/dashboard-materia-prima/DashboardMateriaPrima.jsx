import {
  Fragment,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Factory,
  PackageSearch,
  RefreshCw,
  ShoppingCart,
  TriangleAlert,
  Truck,
  Warehouse,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import useDashboardMateriaPrima
  from "./useDashboardMateriaPrima";

import "./DashboardMateriaPrima.css";


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const STATUS = {
  CRITICO: { texto: "Crítico", classe: "critico", prioridade: 1 },
  COMPRAR: { texto: "Comprar", classe: "comprar", prioridade: 2 },
  ATENCAO: { texto: "Atenção", classe: "atencao", prioridade: 3 },
  CONFIGURAR: { texto: "Configurar", classe: "configurar", prioridade: 4 },
  SEM_SALDO: { texto: "Sem saldo", classe: "sem-saldo", prioridade: 5 },
  OK: { texto: "OK", classe: "ok", prioridade: 6 },
};

const CORES_GRAFICO = [
  "#2563eb",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#dc2626",
  "#4f46e5",
  "#65a30d",
];


/* =========================================================
   UTILITÁRIOS
========================================================= */

function numero(valor) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function formatarNumero(valor, casas = 0) {
  return numero(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function formatarKg(valor, casas = 0) {
  if (valor === null || valor === undefined) {
    return "-";
  }

  return `${formatarNumero(valor, casas)} kg`;
}

function formatarDias(valor) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(Number(valor))
  ) {
    return "-";
  }

  return `${formatarNumero(valor, 1)} dias`;
}

function formatarData(valor) {
  if (!valor) {
    return "-";
  }

  const [ano, mes, dia] = String(valor).split("-");

  if (!ano || !mes || !dia) {
    return String(valor);
  }

  return `${dia}/${mes}/${ano}`;
}

function formatarDataISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function adicionarDias(dataISO, quantidade) {
  const [ano, mes, dia] = String(dataISO).split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  data.setDate(data.getDate() + Number(quantidade || 0));

  return formatarDataISO(data);
}

function obterPeriodoInicial() {
  const hoje = formatarDataISO(new Date());

  return {
    inicio: hoje,
    fim: adicionarDias(hoje, 30),
  };
}

function contarDiasPeriodo(dataInicial, dataFinal) {
  if (!dataInicial || !dataFinal) {
    return 0;
  }

  const inicio = new Date(`${dataInicial}T00:00:00`);
  const fim = new Date(`${dataFinal}T00:00:00`);
  const diferenca = fim.getTime() - inicio.getTime();

  if (!Number.isFinite(diferenca) || diferenca < 0) {
    return 0;
  }

  return Math.floor(diferenca / 86400000) + 1;
}

function obterStatus(valor) {
  return (
    STATUS[String(valor || "").trim().toUpperCase()] || {
      texto: valor || "-",
      classe: "neutro",
      prioridade: 99,
    }
  );
}

function calcularCoberturaDias(fornecedor, diasPeriodo) {
  const estoque = fornecedor?.estoqueAtualKg;
  const consumo = numero(fornecedor?.consumoProgramadoKg);

  if (
    estoque === null ||
    estoque === undefined ||
    consumo <= 0 ||
    diasPeriodo <= 0
  ) {
    return null;
  }

  const consumoDiario = consumo / diasPeriodo;

  if (consumoDiario <= 0) {
    return null;
  }

  return Math.max(0, numero(estoque) / consumoDiario);
}


/* =========================================================
   COMPONENTES MENORES
========================================================= */

function BadgeStatus({ status }) {
  const config = obterStatus(status);

  return (
    <span className={`dmp-status ${config.classe}`}>
      {config.texto}
    </span>
  );
}

function KpiCard({
  titulo,
  valor,
  subtitulo,
  icone: Icone,
  tipo = "padrao",
}) {
  return (
    <article className={`dmp-kpi dmp-kpi-${tipo}`}>
      <div className="dmp-kpi-topo">
        <span>{titulo}</span>

        <div className="dmp-kpi-icone">
          <Icone size={18} />
        </div>
      </div>

      <strong>{valor}</strong>
      <small>{subtitulo}</small>
    </article>
  );
}

function TooltipKg({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="dmp-tooltip">
      {label && <strong>{label}</strong>}

      {payload.map((item) => (
        <span key={item.dataKey}>
          {item.name}: {formatarKg(item.value, 0)}
        </span>
      ))}
    </div>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

export default function DashboardMateriaPrima() {
  const periodoInicial = useMemo(() => obterPeriodoInicial(), []);

  const [dataInicial, setDataInicial] = useState(periodoInicial.inicio);
  const [dataFinal, setDataFinal] = useState(periodoInicial.fim);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState("todos");
  const [statusSelecionado, setStatusSelecionado] = useState("todos");

  const periodoInvalido = Boolean(
    dataInicial &&
    dataFinal &&
    dataFinal < dataInicial,
  );

  const {
    dados,
    carregando,
    atualizando,
    erro,
    recarregar,
  } = useDashboardMateriaPrima({
    dataInicial,
    dataFinal,
    habilitado: !periodoInvalido,
  });

  const necessidade = dados?.necessidade || {};
  const consumo = dados?.consumo || {};

  const fornecedores = Array.isArray(necessidade?.fornecedores)
    ? necessidade.fornecedores
    : [];

  const diasPeriodo = useMemo(
    () => contarDiasPeriodo(dataInicial, dataFinal),
    [dataInicial, dataFinal],
  );

  const fornecedoresFiltrados = useMemo(
    () =>
      fornecedores.filter((item) => {
        if (
          fornecedorSelecionado !== "todos" &&
          String(item.fornecedorId) !== String(fornecedorSelecionado)
        ) {
          return false;
        }

        if (
          statusSelecionado !== "todos" &&
          String(item.status).toUpperCase() !== statusSelecionado
        ) {
          return false;
        }

        return true;
      }),
    [
      fornecedores,
      fornecedorSelecionado,
      statusSelecionado,
    ],
  );

  const indicadores = useMemo(() => {
    const estoqueAtualTotal = fornecedoresFiltrados.reduce(
      (total, item) =>
        total +
        (
          item.estoqueAtualKg === null ||
          item.estoqueAtualKg === undefined
            ? 0
            : numero(item.estoqueAtualKg)
        ),
      0,
    );

    const consumoProgramadoKg = fornecedoresFiltrados.reduce(
      (total, item) =>
        total + numero(item.consumoProgramadoKg),
      0,
    );

    const comprasFuturasKg = fornecedoresFiltrados.reduce(
      (total, item) =>
        total + numero(item.comprasFuturasKg),
      0,
    );

    const necessidadeCompraKg = fornecedoresFiltrados.reduce(
      (total, item) =>
        total + numero(item.necessidadeCompraKg),
      0,
    );

    const coberturas = fornecedoresFiltrados
      .map((item) => calcularCoberturaDias(item, diasPeriodo))
      .filter(
        (valor) =>
          valor !== null &&
          Number.isFinite(valor),
      );

    const coberturaMedia =
      coberturas.length > 0
        ? coberturas.reduce((soma, valor) => soma + valor, 0) /
          coberturas.length
        : null;

    const maiorRisco =
      [...fornecedoresFiltrados]
        .sort((a, b) => {
          const prioridade =
            obterStatus(a.status).prioridade -
            obterStatus(b.status).prioridade;

          if (prioridade !== 0) {
            return prioridade;
          }

          return (
            numero(b.necessidadeCompraKg) -
            numero(a.necessidadeCompraKg)
          );
        })[0] || null;

    const fornecedoresComCompra =
      fornecedoresFiltrados
        .filter(
          (item) =>
            numero(item.necessidadeCompraKg) > 0,
        )
        .sort(
          (a, b) =>
            numero(b.necessidadeCompraKg) -
            numero(a.necessidadeCompraKg),
        );

    const maiorNecessidadeCompra =
      fornecedoresComCompra[0] || null;

    const excessoKg = fornecedoresFiltrados.reduce((soma, item) => {
      if (
        item.estoqueAtualKg === null ||
        item.estoqueAtualKg === undefined ||
        item.estoqueAlvoKg === null ||
        item.estoqueAlvoKg === undefined
      ) {
        return soma;
      }

      return (
        soma +
        Math.max(
          0,
          numero(item.estoqueAtualKg) -
            numero(item.estoqueAlvoKg),
        )
      );
    }, 0);

    const rupturas = fornecedoresFiltrados
      .map((item) => item.dataRuptura)
      .filter(Boolean)
      .sort();

    const criticos = fornecedoresFiltrados.filter(
      (item) =>
        String(item.status || "").toUpperCase() ===
        "CRITICO",
    ).length;

    return {
      estoqueAtualTotal,
      consumoProgramadoKg,
      comprasFuturasKg,
      necessidadeCompraKg,
      fornecedoresComCompra:
        fornecedoresComCompra.length,
      fornecedorMaiorNecessidadeCompra:
        maiorNecessidadeCompra?.fornecedorNome || "-",
      maiorNecessidadeCompraKg:
        numero(maiorNecessidadeCompra?.necessidadeCompraKg),
      criticos,
      coberturaMedia,
      maiorRisco: maiorRisco?.fornecedorNome || "-",
      excessoKg,
      primeiraRuptura: rupturas[0] || null,
    };
  }, [
    fornecedoresFiltrados,
    diasPeriodo,
  ]);

  const alertas = useMemo(
    () =>
      fornecedoresFiltrados
        .filter(
          (item) =>
            String(item.status).toUpperCase() !== "OK",
        )
        .sort(
          (a, b) =>
            obterStatus(a.status).prioridade -
              obterStatus(b.status).prioridade ||
            numero(b.necessidadeCompraKg) -
              numero(a.necessidadeCompraKg),
        )
        .slice(0, 8),
    [fornecedoresFiltrados],
  );

  const fornecedoresProjecao = useMemo(
    () =>
      fornecedoresFiltrados.map((item, indice) => ({
        ...item,
        cor:
          CORES_GRAFICO[
            indice % CORES_GRAFICO.length
          ],
        chaveSaldo: `saldo_${item.fornecedorId}`,
        chaveMinimo: `minimo_${item.fornecedorId}`,
        chaveAlvo: `alvo_${item.fornecedorId}`,
      })),
    [fornecedoresFiltrados],
  );

  const dadosProjecao = useMemo(() => {
    const mapa = new Map();

    for (const fornecedor of fornecedoresProjecao) {
      for (const detalhe of fornecedor.detalhes || []) {
        if (
          detalhe.data < dataInicial ||
          detalhe.data > dataFinal
        ) {
          continue;
        }

        if (!mapa.has(detalhe.data)) {
          mapa.set(detalhe.data, {
            data: detalhe.data,
            dataLabel: formatarData(detalhe.data).slice(0, 5),
          });
        }

        const linha = mapa.get(detalhe.data);

        if (
          detalhe.saldoFinalKg !== null &&
          detalhe.saldoFinalKg !== undefined
        ) {
          linha[fornecedor.chaveSaldo] =
            numero(detalhe.saldoFinalKg);
        }

        if (
          fornecedor.estoqueMinimoKg !== null &&
          fornecedor.estoqueMinimoKg !== undefined
        ) {
          linha[fornecedor.chaveMinimo] =
            numero(fornecedor.estoqueMinimoKg);
        }

        if (
          fornecedor.estoqueAlvoKg !== null &&
          fornecedor.estoqueAlvoKg !== undefined
        ) {
          linha[fornecedor.chaveAlvo] =
            numero(fornecedor.estoqueAlvoKg);
        }
      }
    }

    return [...mapa.values()]
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [
    fornecedoresProjecao,
    dataInicial,
    dataFinal,
  ]);

  const dadosCompra = useMemo(
    () =>
      fornecedoresFiltrados
        .filter(
          (item) =>
            numero(item.necessidadeCompraKg) > 0,
        )
        .sort(
          (a, b) =>
            numero(b.necessidadeCompraKg) -
            numero(a.necessidadeCompraKg),
        )
        .slice(0, 10)
        .map((item) => ({
          fornecedor: item.fornecedorNome,
          comprar: numero(item.necessidadeCompraKg),
        })),
    [fornecedoresFiltrados],
  );

  const dadosConsumoFornecedor = useMemo(() => {
    const idsPermitidos = new Set(
      fornecedoresFiltrados.map((item) =>
        String(item.fornecedorId),
      ),
    );

    const lista = Array.isArray(consumo?.porFornecedor)
      ? consumo.porFornecedor
      : [];

    return [...lista]
      .filter((item) =>
        idsPermitidos.has(String(item.fornecedorId)),
      )
      .sort(
        (a, b) =>
          numero(b.consumoKg) -
          numero(a.consumoKg),
      )
      .slice(0, 8)
      .map((item) => ({
        nome: item.fornecedorNome,
        valor: numero(item.consumoKg),
      }));
  }, [
    consumo,
    fornecedoresFiltrados,
  ]);

  const rankingInjetoras = useMemo(
    () =>
      (
        Array.isArray(consumo?.porInjetora)
          ? [...consumo.porInjetora]
          : []
      )
        .sort(
          (a, b) =>
            numero(b.consumoTotalKg) -
            numero(a.consumoTotalKg),
        )
        .slice(0, 8)
        .map((item) => ({
          nome: `Injetora ${item.injetora}`,
          consumo: numero(item.consumoTotalKg),
          pecas: numero(item.pecasPrevistas),
        })),
    [consumo],
  );

  const rankingProdutos = useMemo(() => {
    const mapa = new Map();

    for (const programacao of consumo?.programacoes || []) {
      const codigo = String(
        programacao?.codigoProduto || "Sem código",
      );

      const atual =
        mapa.get(codigo) || {
          codigo,
          descricao: programacao?.descricao || "",
          consumo: 0,
          pecas: 0,
        };

      atual.consumo += numero(
        programacao?.consumoTotalKg ??
          programacao?.consumoProgramaKg ??
          programacao?.consumoKg,
      );

      atual.pecas += numero(programacao?.pecasPrevistas);

      mapa.set(codigo, atual);
    }

    return [...mapa.values()]
      .sort((a, b) => b.consumo - a.consumo)
      .slice(0, 8);
  }, [consumo]);

  function aplicarPeriodoRapido(dias) {
    const inicio = formatarDataISO(new Date());

    setDataInicial(inicio);
    setDataFinal(adicionarDias(inicio, dias));
  }

  return (
    <main className="dmp-page">
      <section className="dmp-header">
        <div>
          <span className="dmp-eyebrow">
            Produção • Gestão de PP
          </span>

          <h1>
            Matéria-Prima — PP
          </h1>

          <p>
            Estoque, consumo programado, cobertura,
            compras futuras e risco de ruptura por fornecedor.
          </p>
        </div>

        <div className="dmp-header-icone">
          <PackageSearch size={28} />
        </div>
      </section>

      <section className="dmp-filtros-card">
        <div className="dmp-filtros-rapidos">
          {[7, 15, 30, 60].map((dias) => (
            <button
              type="button"
              key={dias}
              onClick={() => aplicarPeriodoRapido(dias)}
            >
              {dias} dias
            </button>
          ))}
        </div>

        <div className="dmp-filtros">
          <label>
            <span>De</span>
            <input
              type="date"
              value={dataInicial}
              onChange={(event) =>
                setDataInicial(event.target.value)
              }
            />
          </label>

          <label>
            <span>Até</span>
            <input
              type="date"
              value={dataFinal}
              onChange={(event) =>
                setDataFinal(event.target.value)
              }
            />
          </label>

          <label>
            <span>Fornecedor</span>

            <select
              value={fornecedorSelecionado}
              onChange={(event) =>
                setFornecedorSelecionado(
                  event.target.value,
                )
              }
            >
              <option value="todos">
                Todos
              </option>

              {fornecedores.map((item) => (
                <option
                  key={item.fornecedorId}
                  value={item.fornecedorId}
                >
                  {item.fornecedorNome}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Status</span>

            <select
              value={statusSelecionado}
              onChange={(event) =>
                setStatusSelecionado(
                  event.target.value,
                )
              }
            >
              <option value="todos">Todos</option>
              <option value="CRITICO">Crítico</option>
              <option value="COMPRAR">Comprar</option>
              <option value="ATENCAO">Atenção</option>
              <option value="OK">OK</option>
              <option value="SEM_SALDO">Sem saldo</option>
              <option value="CONFIGURAR">Configurar</option>
            </select>
          </label>

          <button
            type="button"
            className="dmp-atualizar"
            onClick={() => recarregar()}
            disabled={
              carregando ||
              atualizando ||
              periodoInvalido
            }
          >
            <RefreshCw
              size={16}
              className={
                atualizando
                  ? "dmp-girando"
                  : ""
              }
            />
            Atualizar
          </button>
        </div>
      </section>

      {periodoInvalido && (
        <div className="dmp-mensagem erro">
          <AlertTriangle size={17} />
          A data final não pode ser anterior à data inicial.
        </div>
      )}

      {erro && (
        <div className="dmp-mensagem erro">
          <AlertTriangle size={17} />
          {erro}
        </div>
      )}

      {numero(
        necessidade?.resumo?.consumoSemReceitaKg,
      ) > 0 && (
        <div className="dmp-mensagem aviso">
          <TriangleAlert size={17} />
          {formatarKg(
            necessidade?.resumo?.consumoSemReceitaKg,
            0,
          )}{" "}
          de consumo não foi distribuído por fornecedor
          porque existem receitas pendentes.
        </div>
      )}

      <section className="dmp-kpis">
        <KpiCard
          titulo="Estoque atual"
          valor={
            carregando
              ? "..."
              : formatarKg(
                  indicadores.estoqueAtualTotal,
                  0,
                )
          }
          subtitulo="Saldo disponível no início da análise"
          icone={Warehouse}
        />

        <KpiCard
          titulo="Consumo programado"
          valor={
            carregando
              ? "..."
              : formatarKg(
                  indicadores.consumoProgramadoKg,
                  0,
                )
          }
          subtitulo="PP previsto para o período"
          icone={Factory}
        />

        <KpiCard
          titulo="Compras futuras"
          valor={
            carregando
              ? "..."
              : formatarKg(
                  indicadores.comprasFuturasKg,
                  0,
                )
          }
          subtitulo="Entradas já previstas"
          icone={Truck}
          tipo="azul"
        />

        <KpiCard
          titulo={
            indicadores.fornecedoresComCompra === 1
              ? `Necessidade de compra • ${indicadores.fornecedorMaiorNecessidadeCompra}`
              : "Necessidade de compra"
          }
          valor={
            carregando
              ? "..."
              : formatarKg(
                  indicadores.necessidadeCompraKg,
                  0,
                )
          }
          subtitulo={
            indicadores.fornecedoresComCompra === 0
              ? "Nenhum fornecedor do filtro precisa de reposição"
              : indicadores.fornecedoresComCompra === 1
                ? `Fornecedor: ${indicadores.fornecedorMaiorNecessidadeCompra} • comprar ${formatarKg(
                    indicadores.maiorNecessidadeCompraKg,
                    0,
                  )}`
                : `${indicadores.fornecedoresComCompra} fornecedores • maior: ${indicadores.fornecedorMaiorNecessidadeCompra} (${formatarKg(
                    indicadores.maiorNecessidadeCompraKg,
                    0,
                  )})`
          }
          icone={ShoppingCart}
          tipo={
            indicadores.necessidadeCompraKg > 0
              ? "alerta"
              : "ok"
          }
        />

        <KpiCard
          titulo="Fornecedores críticos"
          valor={
            carregando
              ? "..."
              : formatarNumero(indicadores.criticos)
          }
          subtitulo="Risco de ruptura ou prazo vencido"
          icone={TriangleAlert}
          tipo={
            indicadores.criticos > 0
              ? "critico"
              : "ok"
          }
        />

        <KpiCard
          titulo="Cobertura média"
          valor={
            carregando
              ? "..."
              : formatarDias(
                  indicadores.coberturaMedia,
                )
          }
          subtitulo="Estoque atual ÷ consumo médio diário"
          icone={Clock3}
        />

        <KpiCard
          titulo="Maior risco"
          valor={
            carregando
              ? "..."
              : indicadores.maiorRisco
          }
          subtitulo={
            indicadores.primeiraRuptura
              ? `1ª ruptura: ${formatarData(
                  indicadores.primeiraRuptura,
                )}`
              : "Sem ruptura projetada no período"
          }
          icone={AlertTriangle}
          tipo="alerta"
        />

        <KpiCard
          titulo="Acima do estoque alvo"
          valor={
            carregando
              ? "..."
              : formatarKg(
                  indicadores.excessoKg,
                  0,
                )
          }
          subtitulo="Saldo atual excedente ao alvo cadastrado"
          icone={Boxes}
          tipo="azul"
        />
      </section>

      <section className="dmp-grid-principal">
        <article className="dmp-card">
          <div className="dmp-card-header">
            <div>
              <span>Projeção</span>
              <h2>Evolução do estoque</h2>
              <p>
                {fornecedorSelecionado === "todos"
                  ? "Uma linha de saldo para cada fornecedor do filtro."
                  : "Saldo projetado com estoque mínimo e alvo do fornecedor selecionado."}
              </p>
            </div>

            <CalendarDays size={20} />
          </div>

          <div className="dmp-chart-grande">
            {dadosProjecao.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={dadosProjecao}
                  margin={{
                    top: 12,
                    right: 18,
                    left: 8,
                    bottom: 4,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="dataLabel"
                    minTickGap={22}
                  />

                  <YAxis
                    tickFormatter={(valor) =>
                      `${Math.round(
                        numero(valor) / 1000,
                      )}k`
                    }
                  />

                  <Tooltip content={<TooltipKg />} />
                  <Legend
                    iconSize={9}
                    wrapperStyle={{ fontSize: 9 }}
                  />

                  {fornecedoresProjecao.map((fornecedor) => (
                    <Line
                      key={fornecedor.chaveSaldo}
                      type="monotone"
                      dataKey={fornecedor.chaveSaldo}
                      name={fornecedor.fornecedorNome}
                      stroke={fornecedor.cor}
                      strokeWidth={2.6}
                      dot={false}
                      connectNulls
                    />
                  ))}

                  {fornecedorSelecionado !== "todos" &&
                    fornecedoresProjecao.map((fornecedor) => (
                      <Fragment key={`faixas_${fornecedor.fornecedorId}`}>
                        <Line
                          type="monotone"
                          dataKey={fornecedor.chaveMinimo}
                          name={`${fornecedor.fornecedorNome} • mínimo`}
                          stroke="#dc2626"
                          strokeWidth={2}
                          strokeDasharray="6 5"
                          dot={false}
                          connectNulls
                        />

                        <Line
                          type="monotone"
                          dataKey={fornecedor.chaveAlvo}
                          name={`${fornecedor.fornecedorNome} • alvo`}
                          stroke="#059669"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                          connectNulls
                        />
                      </Fragment>
                    ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="dmp-vazio">
                <Warehouse size={28} />
                <strong>Sem projeção disponível</strong>
                <span>
                  Verifique saldo-base, programação e filtros.
                </span>
              </div>
            )}
          </div>
        </article>

        <article className="dmp-card">
          <div className="dmp-card-header">
            <div>
              <span>Prioridades</span>
              <h2>Alertas</h2>
              <p>
                Itens que exigem acompanhamento ou ação.
              </p>
            </div>

            <TriangleAlert size={20} />
          </div>

          <div className="dmp-alertas">
            {alertas.length > 0 ? (
              alertas.map((item) => (
                <div
                  className="dmp-alerta"
                  key={item.fornecedorId}
                >
                  <div>
                    <strong>
                      {item.fornecedorNome}
                    </strong>

                    <span>
                      {numero(
                        item.necessidadeCompraKg,
                      ) > 0
                        ? `Comprar ${formatarKg(
                            item.necessidadeCompraKg,
                            0,
                          )}`
                        : item.dataRuptura
                          ? `Ruptura em ${formatarData(
                              item.dataRuptura,
                            )}`
                          : "Necessita conferência"}
                    </span>
                  </div>

                  <div className="dmp-alerta-direita">
                    <BadgeStatus status={item.status} />

                    <small>
                      {item.dataLimiteCompra
                        ? `até ${formatarData(
                            item.dataLimiteCompra,
                          )}`
                        : ""}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <div className="dmp-vazio compacto">
                <CheckCircle2 size={26} />
                <strong>Nenhum alerta crítico</strong>
                <span>
                  Os fornecedores analisados estão dentro
                  da política.
                </span>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="dmp-grid-graficos">
        <article className="dmp-card">
          <div className="dmp-card-header">
            <div>
              <span>Compras</span>
              <h2>Necessidade por fornecedor</h2>
            </div>

            <ShoppingCart size={19} />
          </div>

          <div className="dmp-chart">
            {dadosCompra.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={dadosCompra}
                  layout="vertical"
                  margin={{
                    top: 8,
                    right: 16,
                    left: 20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    tickFormatter={(valor) =>
                      `${Math.round(
                        numero(valor) / 1000,
                      )}k`
                    }
                  />

                  <YAxis
                    dataKey="fornecedor"
                    type="category"
                    width={112}
                    tick={{ fontSize: 10 }}
                  />

                  <Tooltip content={<TooltipKg />} />

                  <Bar
                    dataKey="comprar"
                    name="Comprar"
                    fill="#d97706"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="dmp-vazio">
                <CheckCircle2 size={26} />
                <strong>Sem compra sugerida</strong>
                <span>
                  Nenhum fornecedor filtrado exige reposição.
                </span>
              </div>
            )}
          </div>
        </article>

        <article className="dmp-card">
          <div className="dmp-card-header">
            <div>
              <span>Dependência</span>
              <h2>Consumo por fornecedor</h2>
            </div>

            <Truck size={19} />
          </div>

          <div className="dmp-chart">
            {dadosConsumoFornecedor.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={dadosConsumoFornecedor}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {dadosConsumoFornecedor.map(
                      (item, indice) => (
                        <Cell
                          key={item.nome}
                          fill={
                            CORES_GRAFICO[
                              indice %
                                CORES_GRAFICO.length
                            ]
                          }
                        />
                      ),
                    )}
                  </Pie>

                  <Tooltip content={<TooltipKg />} />

                  <Legend
                    iconSize={9}
                    wrapperStyle={{ fontSize: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="dmp-vazio">
                <Truck size={26} />
                <strong>Sem consumo distribuído</strong>
                <span>
                  Não há consumo por fornecedor para o filtro.
                </span>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="dmp-grid-rankings">
        <article className="dmp-card">
          <div className="dmp-card-header">
            <div>
              <span>Operação</span>
              <h2>Injetoras que mais consomem PP</h2>
            </div>

            <Factory size={19} />
          </div>

          <div className="dmp-ranking">
            {rankingInjetoras.map((item, indice) => (
              <div
                key={item.nome}
                className="dmp-ranking-item"
              >
                <span className="dmp-ranking-posicao">
                  {indice + 1}
                </span>

                <div>
                  <strong>{item.nome}</strong>
                  <small>
                    {formatarNumero(item.pecas)} peças previstas
                  </small>
                </div>

                <strong className="dmp-ranking-valor">
                  {formatarKg(item.consumo, 0)}
                </strong>
              </div>
            ))}

            {rankingInjetoras.length === 0 && (
              <div className="dmp-vazio compacto">
                Sem programação no período.
              </div>
            )}
          </div>
        </article>

        <article className="dmp-card">
          <div className="dmp-card-header">
            <div>
              <span>Produtos</span>
              <h2>Produtos que mais consomem PP</h2>
            </div>

            <Boxes size={19} />
          </div>

          <div className="dmp-ranking">
            {rankingProdutos.map((item, indice) => (
              <div
                key={item.codigo}
                className="dmp-ranking-item"
              >
                <span className="dmp-ranking-posicao">
                  {indice + 1}
                </span>

                <div>
                  <strong>{item.codigo}</strong>
                  <small>
                    {item.descricao ||
                      `${formatarNumero(
                        item.pecas,
                      )} peças`}
                  </small>
                </div>

                <strong className="dmp-ranking-valor">
                  {formatarKg(item.consumo, 0)}
                </strong>
              </div>
            ))}

            {rankingProdutos.length === 0 && (
              <div className="dmp-vazio compacto">
                Sem programação no período.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="dmp-card dmp-tabela-card">
        <div className="dmp-card-header">
          <div>
            <span>Fornecedores</span>
            <h2>
              Situação gerencial de matéria-prima
            </h2>
            <p>
              Estoque, cobertura, consumo, compra recomendada e risco.
            </p>
          </div>

          <Warehouse size={20} />
        </div>

        <div className="dmp-tabela-wrapper">
          <table className="dmp-tabela">
            <thead>
              <tr>
                <th>Fornecedor</th>
                <th className="numero">Estoque atual</th>
                <th className="numero">Compras futuras</th>
                <th className="numero">Consumo</th>
                <th className="numero">Menor saldo</th>
                <th className="numero">Cobertura</th>
                <th className="numero">Mínimo</th>
                <th className="numero">Alvo</th>
                <th className="numero">Comprar</th>
                <th>Comprar até</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {fornecedoresFiltrados.map((item) => {
                const cobertura = calcularCoberturaDias(
                  item,
                  diasPeriodo,
                );

                return (
                  <tr key={item.fornecedorId}>
                    <td>
                      <strong>
                        {item.fornecedorNome}
                      </strong>
                    </td>

                    <td className="numero">
                      {formatarKg(
                        item.estoqueAtualKg,
                        0,
                      )}
                    </td>

                    <td className="numero">
                      {formatarKg(
                        item.comprasFuturasKg,
                        0,
                      )}
                    </td>

                    <td className="numero">
                      {formatarKg(
                        item.consumoProgramadoKg,
                        0,
                      )}
                    </td>

                    <td
                      className={[
                        "numero",
                        item.menorSaldoProjetadoKg !==
                          null &&
                        item.estoqueMinimoKg !== null &&
                        numero(
                          item.menorSaldoProjetadoKg,
                        ) <
                          numero(
                            item.estoqueMinimoKg,
                          )
                          ? "dmp-negativo"
                          : "",
                      ].join(" ")}
                    >
                      {formatarKg(
                        item.menorSaldoProjetadoKg,
                        0,
                      )}
                    </td>

                    <td className="numero">
                      {formatarDias(cobertura)}
                    </td>

                    <td className="numero">
                      {formatarKg(
                        item.estoqueMinimoKg,
                        0,
                      )}
                    </td>

                    <td className="numero">
                      {formatarKg(
                        item.estoqueAlvoKg,
                        0,
                      )}
                    </td>

                    <td className="numero dmp-compra">
                      {numero(
                        item.necessidadeCompraKg,
                      ) > 0
                        ? formatarKg(
                            item.necessidadeCompraKg,
                            0,
                          )
                        : "-"}
                    </td>

                    <td>
                      {item.dataLimiteCompra
                        ? formatarData(
                            item.dataLimiteCompra,
                          )
                        : "-"}
                    </td>

                    <td>
                      <BadgeStatus status={item.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!carregando &&
          fornecedoresFiltrados.length === 0 && (
          <div className="dmp-vazio dmp-tabela-vazio">
            <Warehouse size={28} />
            <strong>
              Nenhum fornecedor encontrado
            </strong>
            <span>
              Ajuste os filtros do dashboard.
            </span>
          </div>
        )}
      </section>
    </main>
  );
}
