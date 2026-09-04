import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { listarCalendarioIndustrial } from "@/features/calendario-industrial/calendarioIndustrialService";

import { listarPeriodosProgramacao } from "./programacaoCalendarioService";

import "./ProgramacaoModal.css";
import "./ProgramacaoCalendario.css";

/* =========================================================
   CONSTANTES
============================================================ */

const INJETORAS = Array.from(
  {
    length: 11,
  },
  (_, indice) => String(indice + 1).padStart(2, "0"),
);

const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const PERFIS = [
  {
    codigo: "5H",
    minutos: 300,
    rotulo: "5h",
  },

  {
    codigo: "17H",
    minutos: 1020,
    rotulo: "17h",
  },

  {
    codigo: "22H",
    minutos: 1320,
    rotulo: "22h",
  },

  {
    codigo: "24H",
    minutos: 1440,
    rotulo: "24h",
  },
];

/* =========================================================
   UTILITÁRIOS
========================================================= */

function formatarDataISO(data) {
  const ano = data.getFullYear();

  const mes = String(data.getMonth() + 1).padStart(2, "0");

  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function dataHojeLocal() {
  return formatarDataISO(new Date());
}

function criarDataLocal(valor) {
  const [ano, mes, dia] = String(valor ?? "")
    .split("-")
    .map(Number);

  if (!ano || !mes || !dia) {
    return null;
  }

  return new Date(ano, mes - 1, dia, 12, 0, 0);
}

function formatarDataVisual(valor) {
  const data = criarDataLocal(valor);

  if (!data) {
    return valor || "-";
  }

  return data.toLocaleDateString("pt-BR");
}

function formatarNumero(valor, casas = 0) {
  const numero = Number(valor ?? 0);

  if (!Number.isFinite(numero)) {
    return "0";
  }

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,

    maximumFractionDigits: casas,
  });
}

function formatarKg(valor) {
  return `${formatarNumero(valor, 3)} kg`;
}

function formatarMinutos(minutos) {
  const total = Math.max(0, Math.round(Number(minutos ?? 0)));

  const horas = Math.floor(total / 60);

  const resto = total % 60;

  if (resto === 0) {
    return `${horas}h`;
  }

  return `${horas}h${String(resto).padStart(2, "0")}`;
}

function obterInicioMes(referencia) {
  return new Date(referencia.getFullYear(), referencia.getMonth(), 1, 12, 0, 0);
}

function adicionarMeses(referencia, quantidade) {
  return new Date(referencia.getFullYear(), referencia.getMonth() + quantidade, 1, 12, 0, 0);
}

function criarDiasGrade(referencia) {
  const primeiro = obterInicioMes(referencia);

  const ultimo = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0, 12, 0, 0);

  const deslocamentoInicio = (primeiro.getDay() + 6) % 7;

  const inicio = new Date(primeiro);

  inicio.setDate(primeiro.getDate() - deslocamentoInicio);

  const deslocamentoFim = (7 - ((ultimo.getDay() + 6) % 7) - 1) % 7;

  const fim = new Date(ultimo);

  fim.setDate(ultimo.getDate() + deslocamentoFim);

  const dias = [];

  const atual = new Date(inicio);

  while (atual <= fim) {
    dias.push(new Date(atual));

    atual.setDate(atual.getDate() + 1);
  }

  return dias;
}

function minutosHorario(hora) {
  const [horas, minutos] = String(hora ?? "")
    .slice(0, 5)
    .split(":")
    .map(Number);

  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) {
    return null;
  }

  return horas * 60 + minutos;
}

function dataEhPassada(dataISO) {
  if (!dataISO) {
    return false;
  }

  return dataISO < dataHojeLocal();
}

function perfilBasePorLimite(limite) {
  if (limite >= 1440) {
    return "24H";
  }

  if (limite >= 1320) {
    return "22H";
  }

  if (limite >= 1020) {
    return "17H";
  }

  if (limite >= 300) {
    return "5H";
  }

  return null;
}

/* =========================================================
   TEMPO PASSADO HOJE
========================================================= */

function calcularMinutosPassadosEmPeriodos(periodos, agoraMinutos) {
  let total = 0;

  for (const periodo of periodos) {
    const inicio = minutosHorario(periodo.horaInicio);

    const fim = minutosHorario(periodo.horaFim);

    if (inicio === null || fim === null) {
      continue;
    }

    const cruzaMeiaNoite = fim <= inicio;

    const duracaoBruta = cruzaMeiaNoite ? 1440 - inicio + fim : fim - inicio;

    let decorrido = 0;

    if (!cruzaMeiaNoite) {
      if (agoraMinutos <= inicio) {
        decorrido = 0;
      } else if (agoraMinutos >= fim) {
        decorrido = duracaoBruta;
      } else {
        decorrido = agoraMinutos - inicio;
      }
    } else if (agoraMinutos < fim) {
      decorrido = 1440 - inicio + agoraMinutos;
    } else if (agoraMinutos >= inicio) {
      decorrido = agoraMinutos - inicio;
    } else {
      decorrido = 0;
    }

    const desconto = Number(periodo.descontoIntervaloMinutos ?? 0);

    if (decorrido >= duracaoBruta && desconto > 0) {
      decorrido -= desconto;
    }

    total += Math.max(0, Math.min(Number(periodo.duracaoMinutos ?? decorrido), decorrido));
  }

  return Math.max(0, Math.round(total));
}

function calcularMinutosDescontadosHoje({
  data,
  perfilHoras,
  minutosSolicitados,
  limiteMinutos,
  periodos,
}) {
  if (data !== dataHojeLocal()) {
    return 0;
  }

  if (!perfilHoras || minutosSolicitados <= 0) {
    return 0;
  }

  const agora = new Date();

  const agoraMinutos = agora.getHours() * 60 + agora.getMinutes();

  if (perfilHoras === "24H") {
    return Math.min(Math.max(0, minutosSolicitados - 1), agoraMinutos);
  }

  const perfilCalculo = perfilHoras === "OUTRO" ? perfilBasePorLimite(limiteMinutos) : perfilHoras;

  if (!perfilCalculo) {
    return 0;
  }

  if (perfilCalculo === "24H") {
    return Math.min(Math.max(0, minutosSolicitados - 1), agoraMinutos);
  }

  const periodosPerfil = periodos.filter((periodo) => periodo.perfilCodigo === perfilCalculo);

  const passados = calcularMinutosPassadosEmPeriodos(periodosPerfil, agoraMinutos);

  return Math.min(Math.max(0, minutosSolicitados - 1), passados);
}

/* =========================================================
   CONFLITOS
========================================================= */

function existeConflito({ programacao, injetora, dias, ignorarId }) {
  if (!injetora || !Array.isArray(dias) || dias.length === 0) {
    return null;
  }

  const datas = new Set(dias.filter((dia) => !dataEhPassada(dia.data)).map((dia) => dia.data));

  return (
    (Array.isArray(programacao) ? programacao : []).find((item) => {
      if (
        item?.ativo === false ||
        String(item?.injetora ?? "") !== String(injetora) ||
        String(item?.id ?? "") === String(ignorarId ?? "")
      ) {
        return false;
      }

      if (item?.tipoProgramacao === "CALENDARIO") {
        return (item?.diasProgramacao ?? []).some((dia) => datas.has(dia.data));
      }

      return [...datas].some(
        (data) => data >= String(item?.dataInicio ?? "") && data <= String(item?.dataFim ?? ""),
      );
    }) ?? null
  );
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function ProgramacaoModal({
  aberto,
  item = null,
  produtos = [],
  programacao = [],
  salvando = false,
  onCancelar,
  onSalvar,
}) {
  const [codigoProduto, setCodigoProduto] = useState("");

  const [injetora, setInjetora] = useState("");

  const [ativo, setAtivo] = useState(true);

  const [diasSelecionados, setDiasSelecionados] = useState([]);

  const [datasMarcadas, setDatasMarcadas] = useState([]);

  const [horasOutroLote, setHorasOutroLote] = useState("8");

  const [mesReferencia, setMesReferencia] = useState(() => obterInicioMes(new Date()));

  const [calendario, setCalendario] = useState([]);

  const [periodos, setPeriodos] = useState([]);

  const [carregandoCalendario, setCarregandoCalendario] = useState(false);

  const [erro, setErro] = useState("");

  const hojeISO = dataHojeLocal();

  const itemLegado = Boolean(item) && item?.tipoProgramacao !== "CALENDARIO";

  /* =======================================================
     INICIALIZAÇÃO
  ======================================================= */

  useEffect(() => {
    if (!aberto) {
      return;
    }

    setCodigoProduto(String(item?.codigoProduto ?? ""));

    setInjetora(String(item?.injetora ?? ""));

    setAtivo(item?.ativo !== false);

    setErro("");
    setDatasMarcadas([]);
    setHorasOutroLote("8");

    if (item?.tipoProgramacao === "CALENDARIO") {
      const dias = (item?.diasProgramacao ?? []).map((dia) => ({
        data: dia.data,

        perfilHoras: dia.perfilHoras,

        minutosSolicitados: Number(dia.minutosSolicitados ?? 0),

        minutosDescontados: Number(dia.minutosDescontados ?? 0),

        limiteMinutos: 1440,

        limitePerfilCodigo: "24H",
      }));

      setDiasSelecionados(dias);

      const primeiroEditavel = dias.find((dia) => dia.data >= hojeISO);

      const referencia = criarDataLocal(primeiroEditavel?.data);

      setMesReferencia(obterInicioMes(referencia || new Date()));
    } else {
      setDiasSelecionados([]);
      setMesReferencia(obterInicioMes(new Date()));
    }
  }, [aberto, item, hojeISO]);

  /* =======================================================
     CALENDÁRIO
  ======================================================= */

  const diasGrade = useMemo(() => criarDiasGrade(mesReferencia), [mesReferencia]);

  const periodoGrade = useMemo(
    () => ({
      inicio: diasGrade.length > 0 ? formatarDataISO(diasGrade[0]) : "",

      fim: diasGrade.length > 0 ? formatarDataISO(diasGrade[diasGrade.length - 1]) : "",
    }),
    [diasGrade],
  );

  useEffect(() => {
    if (!aberto || !periodoGrade.inicio || !periodoGrade.fim) {
      return;
    }

    let cancelado = false;

    async function carregar() {
      setCarregandoCalendario(true);

      try {
        const [dias, periodosConfigurados] = await Promise.all([
          listarCalendarioIndustrial({
            dataInicio: periodoGrade.inicio,

            dataFim: periodoGrade.fim,
          }),

          listarPeriodosProgramacao(),
        ]);

        if (cancelado) {
          return;
        }

        setCalendario(dias);

        setPeriodos(periodosConfigurados);
      } catch (error) {
        if (!cancelado) {
          setErro(error?.message || "Não foi possível carregar o calendário de programação.");
        }
      } finally {
        if (!cancelado) {
          setCarregandoCalendario(false);
        }
      }
    }

    void carregar();

    return () => {
      cancelado = true;
    };
  }, [aberto, periodoGrade.inicio, periodoGrade.fim]);

  const calendarioPorData = useMemo(
    () => new Map(calendario.map((dia) => [dia.data, dia])),
    [calendario],
  );

  const programacaoPorData = useMemo(
    () => new Map(diasSelecionados.map((dia) => [dia.data, dia])),
    [diasSelecionados],
  );

  const marcadasSet = useMemo(() => new Set(datasMarcadas), [datasMarcadas]);

  /* =======================================================
     MARCAÇÃO DE DIAS
  ======================================================= */

  function alternarMarcacaoDia(dataISO) {
    if (dataEhPassada(dataISO)) {
      return;
    }

    const configuracao = calendarioPorData.get(dataISO);

    const limite = Number(configuracao?.minutosProgramados ?? 0);

    if (limite <= 0) {
      return;
    }

    setErro("");

    setDatasMarcadas((atuais) => {
      if (atuais.includes(dataISO)) {
        return atuais.filter((data) => data !== dataISO);
      }

      return [...atuais, dataISO].sort();
    });
  }

  /* =======================================================
     APLICAR HORAS
  ======================================================= */

  function aplicarHorasMarcadas({ perfilHoras, minutosSolicitados }) {
    if (datasMarcadas.length === 0) {
      return;
    }

    if (
      !Number.isFinite(minutosSolicitados) ||
      minutosSolicitados <= 0 ||
      minutosSolicitados > 1440
    ) {
      setErro("Informe uma quantidade de horas válida entre 0 e 24.");

      return;
    }

    for (const data of datasMarcadas) {
      const configuracao = calendarioPorData.get(data);

      const limite = Number(configuracao?.minutosProgramados ?? 1440);

      if (limite <= 0) {
        setErro(`${formatarDataVisual(data)} está marcado como Sem Produção.`);

        return;
      }

      if (minutosSolicitados > limite) {
        setErro(`${formatarDataVisual(data)} não possui disponibilidade suficiente.`);

        return;
      }
    }

    setDiasSelecionados((atuais) => {
      const mapa = new Map(atuais.map((dia) => [dia.data, dia]));

      for (const data of datasMarcadas) {
        const configuracao = calendarioPorData.get(data);

        mapa.set(data, {
          ...(mapa.get(data) || {}),

          data,

          perfilHoras,

          minutosSolicitados,

          limiteMinutos: Number(configuracao?.minutosProgramados ?? 1440),

          limitePerfilCodigo: configuracao?.perfilCodigo ?? "24H",
        });
      }

      return [...mapa.values()].sort((a, b) => a.data.localeCompare(b.data));
    });

    setDatasMarcadas([]);
    setErro("");
  }

  function aplicarPerfil(perfil) {
    aplicarHorasMarcadas({
      perfilHoras: perfil.codigo,

      minutosSolicitados: perfil.minutos,
    });
  }

  function aplicarOutro() {
    const horas = Number(horasOutroLote);

    if (!Number.isFinite(horas) || horas <= 0 || horas > 24) {
      setErro("No campo Outro, informe um valor maior que 0 e de no máximo 24 horas.");

      return;
    }

    aplicarHorasMarcadas({
      perfilHoras: "OUTRO",

      minutosSolicitados: Math.round(horas * 60),
    });
  }

  /* =======================================================
     REMOVER DIAS
  ======================================================= */

  function removerMarcadosDaProgramacao() {
    if (datasMarcadas.length === 0) {
      return;
    }

    const remover = new Set(datasMarcadas);

    setDiasSelecionados((atuais) =>
      atuais.filter((dia) => {
        if (dataEhPassada(dia.data)) {
          return true;
        }

        return !remover.has(dia.data);
      }),
    );

    setDatasMarcadas([]);
    setErro("");
  }

  const algumMarcadoProgramado = useMemo(
    () => datasMarcadas.some((data) => programacaoPorData.has(data)),
    [datasMarcadas, programacaoPorData],
  );

  /* =======================================================
     PRODUTO
  ======================================================= */

  const produtoSelecionado = useMemo(
    () =>
      produtos.find((produto) => String(produto?.codigo ?? "") === String(codigoProduto)) ?? null,
    [produtos, codigoProduto],
  );

  /* =======================================================
     DIAS CALCULADOS
  ======================================================= */

  const diasCalculados = useMemo(
    () =>
      diasSelecionados.map((dia) => {
        const configuracao = calendarioPorData.get(dia.data);

        const limiteMinutos = Number(configuracao?.minutosProgramados ?? dia.limiteMinutos ?? 1440);

        const minutosDescontados = dataEhPassada(dia.data)
          ? Number(dia?.minutosDescontados ?? 0)
          : calcularMinutosDescontadosHoje({
              data: dia.data,

              perfilHoras: dia.perfilHoras,

              minutosSolicitados: Number(dia.minutosSolicitados ?? 0),

              limiteMinutos,

              periodos,
            });

        return {
          ...dia,

          limiteMinutos,

          minutosDescontados,

          minutosEfetivos: Math.max(0, Number(dia.minutosSolicitados ?? 0) - minutosDescontados),
        };
      }),
    [diasSelecionados, calendarioPorData, periodos],
  );

  const diasCalculadosPorData = useMemo(
    () => new Map(diasCalculados.map((dia) => [dia.data, dia])),
    [diasCalculados],
  );

  /* =======================================================
     CÁLCULO GERAL
  ======================================================= */

  const calculo = useMemo(() => {
    const minutosEfetivos = diasCalculados.reduce(
      (total, dia) => total + Number(dia.minutosEfetivos ?? 0),
      0,
    );

    const ciclo = Number(produtoSelecionado?.cicloSegundos ?? 0);

    const cavidades = Number(produtoSelecionado?.cavidadeMolde ?? 0);

    const peso = Number(produtoSelecionado?.pesoKg ?? 0);

    const segundos = minutosEfetivos * 60;

    const valido =
      ciclo > 0 && Number.isInteger(cavidades) && cavidades > 0 && peso > 0 && segundos > 0;

    const ciclosCompletos = valido ? Math.floor(segundos / ciclo) : 0;

    const pecasPrevistas = ciclosCompletos * cavidades;

    const pecasPorHora = valido ? (3600 / ciclo) * cavidades : 0;

    const consumoPeriodoKg = pecasPrevistas * peso;

    const consumoPorHoraKg = pecasPorHora * peso;

    return {
      minutosEfetivos,
      pecasPrevistas,
      pecasPorHora,
      consumoPeriodoKg,
      consumoPorHoraKg,
    };
  }, [diasCalculados, produtoSelecionado]);

  /* =======================================================
     SALVAR
  ======================================================= */

  async function enviarFormulario(event) {
    event.preventDefault();

    setErro("");

    if (itemLegado) {
      setErro("Esta programação pertence ao modelo antigo.");

      return;
    }

    if (!injetora) {
      setErro("Selecione a injetora.");

      return;
    }

    if (!codigoProduto || !produtoSelecionado) {
      setErro("Selecione o produto.");

      return;
    }

    if (diasCalculados.length === 0) {
      setErro("Programe pelo menos um dia.");

      return;
    }

    if (!item && diasCalculados.some((dia) => dataEhPassada(dia.data))) {
      setErro("Não é permitido programar uma data anterior ao dia atual.");

      return;
    }

    for (const dia of diasCalculados) {
      if (dataEhPassada(dia.data)) {
        continue;
      }

      if (!dia.perfilHoras || dia.minutosSolicitados <= 0) {
        setErro(`Defina as horas de ${formatarDataVisual(dia.data)}.`);

        return;
      }

      if (dia.minutosSolicitados > dia.limiteMinutos) {
        setErro(`${formatarDataVisual(dia.data)} ultrapassa a disponibilidade permitida.`);

        return;
      }

      if (dia.minutosEfetivos <= 0) {
        setErro(`Não restam horas produtivas disponíveis em ${formatarDataVisual(dia.data)}.`);

        return;
      }
    }

    const conflito = existeConflito({
      programacao,
      injetora,
      dias: diasCalculados,
      ignorarId: item?.id ?? null,
    });

    if (conflito) {
      setErro(`A Injetora ${injetora} já possui programação em um dos dias selecionados.`);

      return;
    }

    if (calculo.pecasPrevistas <= 0) {
      setErro("As horas selecionadas não são suficientes para completar um ciclo.");

      return;
    }

    try {
      await onSalvar?.({
        id: item?.id ?? null,

        codigoProduto,

        injetora,

        ativo,

        quantidade: calculo.pecasPrevistas,

        dias: diasCalculados,
      });
    } catch (error) {
      setErro(error?.message || "Não foi possível salvar a programação.");
    }
  }

  if (!aberto) {
    return null;
  }

  return (
    <div className="programacao-modal-overlay">
      <div
        className="programacao-modal programacao-modal-calendario"
        role="dialog"
        aria-modal="true"
        aria-labelledby="programacao-modal-titulo"
      >
        <div className="programacao-modal-header">
          <div className="programacao-modal-header-icone">
            <CalendarDays size={22} strokeWidth={2} aria-hidden="true" />
          </div>

          <div className="programacao-modal-header-texto">
            <span>Planejamento de produção · PP</span>

            <h3 id="programacao-modal-titulo">
              {item ? "Editar programação" : "Nova programação"}
            </h3>

            <p>
              Defina a máquina, o produto e os dias de produção. O sistema calcula automaticamente
              horas, peças e consumo de PP.
            </p>
          </div>

          <button
            type="button"
            className="programacao-modal-fechar"
            onClick={onCancelar}
            disabled={salvando}
            aria-label="Fechar"
          >
            <X size={19} />
          </button>
        </div>

        <form className="programacao-modal-form" onSubmit={enviarFormulario}>
          {itemLegado && (
            <div className="programacao-calendario-legado">
              <AlertTriangle size={18} />

              <div>
                <strong>Programação antiga</strong>

                <span>Este registro pertence ao modelo anterior e está preservado.</span>
              </div>
            </div>
          )}

          <section className="programacao-calendario-configuracao">
            <div className="programacao-calendario-configuracao-cabecalho">
              <div>
                <span className="programacao-calendario-eyebrow">
                  01 · Configuração da produção
                </span>

                <strong>Máquina e produto</strong>

                <p>Selecione a injetora e o produto que serão considerados nesta programação.</p>
              </div>

              {(injetora || produtoSelecionado) && (
                <div className="programacao-calendario-configuracao-status">
                  <span>{injetora ? `INJETORA ${injetora}` : "INJETORA PENDENTE"}</span>

                  <strong>
                    {produtoSelecionado ? produtoSelecionado.codigo : "PRODUTO PENDENTE"}
                  </strong>
                </div>
              )}
            </div>

            <div className="programacao-modal-grid programacao-calendario-config">
              <label className="programacao-modal-campo">
                <span>Injetora</span>

                <select
                  value={injetora}
                  onChange={(event) => {
                    setInjetora(event.target.value);
                    setErro("");
                  }}
                  disabled={salvando || itemLegado}
                >
                  <option value="">Selecione a injetora</option>

                  {INJETORAS.map((numero) => (
                    <option key={numero} value={numero}>
                      Injetora {numero}
                    </option>
                  ))}
                </select>
              </label>

              <label className="programacao-modal-campo">
                <span>Produto</span>

                <select
                  value={codigoProduto}
                  onChange={(event) => {
                    setCodigoProduto(event.target.value);
                    setErro("");
                  }}
                  disabled={salvando || itemLegado}
                >
                  <option value="">Selecione o produto</option>

                  {produtos.map((produto) => (
                    <option key={produto.codigo} value={produto.codigo}>
                      {produto.codigo}
                      {" - "}
                      {produto.descricao || "Sem descrição"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {produtoSelecionado && (
              <div className="programacao-calendario-config-tecnico">
                <div>
                  <span>Ciclo</span>
                  <strong>{formatarNumero(produtoSelecionado.cicloSegundos)}s</strong>
                </div>

                <div>
                  <span>Cavidades</span>
                  <strong>{formatarNumero(produtoSelecionado.cavidadeMolde)}</strong>
                </div>

                <div>
                  <span>Capacidade</span>
                  <strong>{formatarNumero(calculo.pecasPorHora)} pç/h</strong>
                </div>

                <div>
                  <span>Consumo</span>
                  <strong>{formatarKg(calculo.consumoPorHoraKg)}/h</strong>
                </div>

                <div
                  className={[
                    "programacao-calendario-receita-status",
                    produtoSelecionado.receitaConfigurada ? "ok" : "pendente",
                  ].join(" ")}
                >
                  <span>Receita</span>
                  <strong>
                    {produtoSelecionado.receitaConfigurada ? "CONFIGURADA" : "PENDENTE"}
                  </strong>
                </div>
              </div>
            )}
          </section>

          {!itemLegado && (
            <>
              <section className="programacao-calendario-bloco">
                <div className="programacao-calendario-cabecalho">
                  <div className="programacao-calendario-cabecalho-texto">
                    <span className="programacao-calendario-eyebrow">
                      02 · Calendário de produção
                    </span>

                    <strong>
                      {NOMES_MESES[mesReferencia.getMonth()]} {mesReferencia.getFullYear()}
                    </strong>

                    <p>
                      Clique nos dias disponíveis. Depois aplique 5h, 17h, 22h, 24h ou uma jornada
                      personalizada.
                    </p>
                  </div>

                  <div className="programacao-calendario-navegacao">
                    <button
                      type="button"
                      onClick={() => setMesReferencia((atual) => adicionarMeses(atual, -1))}
                      aria-label="Mês anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      type="button"
                      className="programacao-calendario-navegacao-hoje"
                      onClick={() => setMesReferencia(obterInicioMes(new Date()))}
                    >
                      Hoje
                    </button>

                    <button
                      type="button"
                      onClick={() => setMesReferencia((atual) => adicionarMeses(atual, 1))}
                      aria-label="Próximo mês"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="programacao-calendario-legenda">
                  <span>
                    <i className="disponivel" />
                    Disponível
                  </span>

                  <span>
                    <i className="selecionado" />
                    Selecionado
                  </span>

                  <span>
                    <i className="programado" />
                    Programado
                  </span>

                  <span>
                    <i className="fechado" />
                    Sem produção
                  </span>
                </div>

                <div className="programacao-calendario-grade">
                  {DIAS_SEMANA.map((dia) => (
                    <div key={dia} className="programacao-calendario-semana">
                      {dia}
                    </div>
                  ))}

                  {diasGrade.map((data) => {
                    const dataISO = formatarDataISO(data);

                    const configuracao = calendarioPorData.get(dataISO);

                    const programado = diasCalculadosPorData.get(dataISO);

                    const limite = Number(configuracao?.minutosProgramados ?? 0);

                    const passado = dataISO < hojeISO;

                    const hoje = dataISO === hojeISO;

                    const foraMes = data.getMonth() !== mesReferencia.getMonth();

                    const fechado = limite <= 0;

                    const marcado = marcadasSet.has(dataISO);

                    const observacaoCalendario = String(configuracao?.observacao ?? "").trim();

                    const feriado =
                      fechado &&
                      /FERIADO|NATAL|TIRADENTES|FINADOS|INDEPENDÊNCIA|CONSCIÊNCIA|REPÚBLICA|APARECIDA|PÁSCOA|CARNAVAL|CORPUS/i.test(
                        observacaoCalendario,
                      );

                    const disponibilidade =
                      configuracao?.perfilCodigo || (limite >= 1440 ? "24H" : "");

                    return (
                      <button
                        key={dataISO}
                        type="button"
                        className={[
                          "programacao-calendario-dia",
                          programado ? "programado" : "",
                          marcado ? "marcado" : "",
                          hoje ? "hoje" : "",
                          foraMes ? "fora-mes" : "",
                          passado ? "passado" : "",
                          fechado ? "indisponivel" : "",
                          feriado ? "feriado" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => alternarMarcacaoDia(dataISO)}
                        disabled={passado || fechado || carregandoCalendario}
                      >
                        <div className="programacao-calendario-dia-topo">
                          <strong>{data.getDate()}</strong>

                          <div className="programacao-calendario-dia-badges">
                            {hoje && (
                              <span className="programacao-calendario-hoje-badge">Hoje</span>
                            )}

                            {feriado && (
                              <span className="programacao-calendario-feriado-badge">Feriado</span>
                            )}

                            {marcado && (
                              <span className="programacao-calendario-check">
                                <Check size={12} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="programacao-calendario-dia-conteudo">
                          {passado ? (
                            <>
                              <span className="programacao-calendario-status-passado">
                                Encerrado
                              </span>
                              <small>Dia anterior</small>
                            </>
                          ) : fechado ? (
                            <>
                              <strong className="programacao-calendario-status-fechado">
                                Sem produção
                              </strong>

                              <small>{feriado ? "Feriado" : "Bloqueado"}</small>
                            </>
                          ) : programado ? (
                            <>
                              <strong className="programacao-calendario-horas-programadas">
                                {formatarMinutos(programado.minutosSolicitados)}
                              </strong>

                              {hoje && programado.minutosDescontados > 0 ? (
                                <small>
                                  {formatarMinutos(programado.minutosEfetivos)} efetivas
                                </small>
                              ) : (
                                <small>Programado</small>
                              )}
                            </>
                          ) : marcado ? (
                            <>
                              <strong className="programacao-calendario-definir">
                                Selecionado
                              </strong>
                              <small>Defina a jornada</small>
                            </>
                          ) : (
                            <>
                              <span className="programacao-calendario-disponibilidade">
                                {disponibilidade || "Disponível"}
                              </span>

                              <strong className="programacao-calendario-adicionar">
                                + Selecionar
                              </strong>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {datasMarcadas.length > 0 && (
                  <div className="programacao-calendario-lote">
                    <div className="programacao-calendario-lote-info">
                      <span>Jornada dos dias selecionados</span>

                      <strong>
                        {datasMarcadas.length}{" "}
                        {datasMarcadas.length === 1 ? "dia selecionado" : "dias selecionados"}
                      </strong>

                      <small>Escolha uma jornada para aplicar em lote.</small>
                    </div>

                    <div className="programacao-calendario-lote-acoes">
                      <div className="programacao-calendario-lote-presets">
                        {PERFIS.map((perfil) => (
                          <button
                            key={perfil.codigo}
                            type="button"
                            onClick={() => aplicarPerfil(perfil)}
                            disabled={salvando}
                          >
                            {perfil.rotulo}
                          </button>
                        ))}
                      </div>

                      <div className="programacao-calendario-lote-outro">
                        <span>Outro</span>

                        <input
                          type="number"
                          min="0.25"
                          max="24"
                          step="0.25"
                          value={horasOutroLote}
                          onChange={(event) => setHorasOutroLote(event.target.value)}
                          disabled={salvando}
                        />

                        <span>h</span>

                        <button type="button" onClick={aplicarOutro} disabled={salvando}>
                          Aplicar
                        </button>
                      </div>

                      {algumMarcadoProgramado && (
                        <button
                          type="button"
                          className="programacao-calendario-lote-remover"
                          onClick={removerMarcadosDaProgramacao}
                          disabled={salvando}
                        >
                          <Trash2 size={14} />
                          Remover
                        </button>
                      )}

                      <button
                        type="button"
                        className="programacao-calendario-lote-limpar"
                        onClick={() => setDatasMarcadas([])}
                        disabled={salvando}
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                )}
              </section>

              <section className="programacao-calendario-resumo-bloco">
                <div className="programacao-calendario-resumo-cabecalho">
                  <div>
                    <span className="programacao-calendario-eyebrow">
                      03 · Resultado da programação
                    </span>

                    <strong>Resumo operacional</strong>
                  </div>

                  <span className="programacao-calendario-resumo-situacao">
                    {diasCalculados.length > 0
                      ? `${diasCalculados.length} DIA${
                          diasCalculados.length === 1 ? "" : "S"
                        } PROGRAMADO${diasCalculados.length === 1 ? "" : "S"}`
                      : "AGUARDANDO PROGRAMAÇÃO"}
                  </span>
                </div>

                <div className="programacao-calendario-resumo">
                  <div className="dias">
                    <span>Dias programados</span>
                    <strong>{diasCalculados.length}</strong>
                    <small>dias de produção</small>
                  </div>

                  <div className="horas">
                    <span>Horas efetivas</span>
                    <strong>{formatarMinutos(calculo.minutosEfetivos)}</strong>
                    <small>tempo produtivo</small>
                  </div>

                  <div className="pecas">
                    <span>Peças previstas</span>
                    <strong>{formatarNumero(calculo.pecasPrevistas)}</strong>
                    <small>produção estimada</small>
                  </div>

                  <div className="pp">
                    <span>PP previsto</span>
                    <strong>{formatarKg(calculo.consumoPeriodoKg)}</strong>
                    <small>consumo projetado</small>
                  </div>
                </div>
              </section>
            </>
          )}

          {!itemLegado && (
            <label className={["programacao-modal-status", ativo ? "ativo" : "inativo"].join(" ")}>
              <input
                type="checkbox"
                checked={ativo}
                onChange={(event) => setAtivo(event.target.checked)}
                disabled={salvando}
              />

              <div>
                <strong>Programação ativa</strong>

                <span>
                  Quando ativa, esta programação entra automaticamente na projeção de consumo de PP.
                </span>
              </div>

              <span className="programacao-modal-status-badge">{ativo ? "ATIVA" : "INATIVA"}</span>
            </label>
          )}

          {erro && <div className="programacao-modal-erro">{erro}</div>}

          <div className="programacao-modal-acoes">
            <button
              type="button"
              className="programacao-modal-cancelar"
              onClick={onCancelar}
              disabled={salvando}
            >
              {itemLegado ? "Fechar" : "Cancelar"}
            </button>

            {!itemLegado && (
              <button type="submit" className="programacao-modal-salvar" disabled={salvando}>
                <Save size={17} />

                <span>{salvando ? "Salvando..." : "Salvar programação"}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
