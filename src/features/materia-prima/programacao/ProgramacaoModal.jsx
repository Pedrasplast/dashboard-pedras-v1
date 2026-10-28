import "./ProgramacaoLayout.css";
import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";
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
import {
  DIAS_SEMANA,
  INJETORAS,
  NOMES_MESES,
  PERFIS,
  adicionarMeses,
  calcularDiasProgramacao,
  calcularProducaoProgramacao,
  criarDataLocal,
  criarDiasGrade,
  dataEhPassada,
  formatarDataVisual,
  formatarKg,
  formatarMinutos,
  formatarNumero,
  obterInicioMes,
  resumirNomeFeriado,
  validarProgramacao,
} from "./programacaoModal.utils";
import { formatarDataISOLocal, obterHojeISO } from "@/shared/lib/datas";

import "./ProgramacaoModal.css";
import "./ProgramacaoCalendario.css";

/* =========================================================
   COMPONENTE
========================================================= */

export default function ProgramacaoModal({
  aberto,
  item = null,
  produtos = [],
  receitas = [],
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

  const [receitaLoteId, setReceitaLoteId] = useState("");

  const [mesReferencia, setMesReferencia] = useState(() => obterInicioMes(new Date()));

  const [calendario, setCalendario] = useState([]);

  const [periodos, setPeriodos] = useState([]);

  const [carregandoCalendario, setCarregandoCalendario] = useState(false);

  const [erro, setErro] = useState("");

  const hojeISO = obterHojeISO();

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
    setReceitaLoteId("");

    if (item?.tipoProgramacao === "CALENDARIO") {
      const dias = (item?.diasProgramacao ?? []).map((dia) => ({
        data: dia.data,

        perfilHoras: dia.perfilHoras,

        minutosSolicitados: Number(dia.minutosSolicitados ?? 0),

        minutosDescontados: Number(dia.minutosDescontados ?? 0),

        receitaId: dia.receitaId ?? null,

        receitaNome: dia.receitaNome ?? "",

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
      inicio: diasGrade.length > 0 ? formatarDataISOLocal(diasGrade[0]) : "",

      fim: diasGrade.length > 0 ? formatarDataISOLocal(diasGrade[diasGrade.length - 1]) : "",
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
     RECEITA POR DIA
  ======================================================= */

  function obterReceita(receitaId) {
    return (
      receitas.find((receita) => String(receita?.id ?? "") === String(receitaId ?? "")) ?? null
    );
  }

  function aplicarReceitaMarcadas() {
    if (datasMarcadas.length === 0) {
      return;
    }

    const receita = obterReceita(receitaLoteId);

    if (!receita) {
      setErro("Selecione uma receita válida para os dias marcados.");

      return;
    }

    setDiasSelecionados((atuais) => {
      const mapa = new Map(atuais.map((dia) => [dia.data, dia]));

      for (const data of datasMarcadas) {
        if (dataEhPassada(data)) {
          continue;
        }

        const configuracao = calendarioPorData.get(data);

        const atual = mapa.get(data) ?? {
          data,

          perfilHoras: "",

          minutosSolicitados: 0,

          minutosDescontados: 0,

          limiteMinutos: Number(configuracao?.minutosProgramados ?? 1440),

          limitePerfilCodigo: configuracao?.perfilCodigo ?? "24H",
        };

        mapa.set(data, {
          ...atual,

          receitaId: receita.id,

          receitaNome: receita.nome,
        });
      }

      return [...mapa.values()].sort((a, b) => a.data.localeCompare(b.data));
    });

    setErro("");
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
    () => calcularDiasProgramacao(diasSelecionados, calendarioPorData, periodos),
    [diasSelecionados, calendarioPorData, periodos],
  );

  const diasCalculadosPorData = useMemo(
    () => new Map(diasCalculados.map((dia) => [dia.data, dia])),
    [diasCalculados],
  );

  /* =======================================================
     CÁLCULO GERAL
  ======================================================= */

  const calculo = useMemo(
    () => calcularProducaoProgramacao(diasCalculados, produtoSelecionado),
    [diasCalculados, produtoSelecionado],
  );

  /* =======================================================
     SALVAR
  ======================================================= */

  async function enviarFormulario(event) {
    event.preventDefault();

    setErro("");

    const mensagemErro = validarProgramacao({
      item,
      itemLegado,
      injetora,
      codigoProduto,
      produtoSelecionado,
      diasCalculados,
      programacao,
      calculo,
    });

    if (mensagemErro) {
      setErro(mensagemErro);

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
    <Modal
      asChild
      aberto={aberto}
      onFechar={onCancelar}
      bloqueado={salvando}
      tamanho="amplo"
      fecharAoClicarFora={false}
    >
      <div
        className="programacao-modal programacao-modal-calendario"
        role="dialog"
        aria-modal="true"
        aria-labelledby="programacao-modal-titulo"
      >
        <div className="programacao-modal-header" data-modal-header="">
          <div className="programacao-modal-header-icone" data-modal-icone="">
            <CalendarDays size={22} strokeWidth={2} aria-hidden="true" />
          </div>

          <div className="programacao-modal-header-texto">
            <span>Planejamento de produção</span>

            <ModalTitulo>
              <h3 id="programacao-modal-titulo">
                {item ? "Editar programação" : "Nova programação"}
              </h3>
            </ModalTitulo>

            <p>
              Defina a máquina, o produto e os dias de produção. O sistema calcula automaticamente
              horas, peças e consumo da produção.
            </p>
          </div>

          <button
            type="button"
            className="programacao-modal-fechar"
            onClick={onCancelar}
            disabled={salvando}
            aria-label="Fechar"
            data-modal-fechar=""
          >
            <X size={19} />
          </button>
        </div>

        <form className="programacao-modal-form" onSubmit={enviarFormulario} data-modal-form="">
          <div className="programacao-modal-conteudo">
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
                        {produto.materialNome ? ` · ${produto.materialNome}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {produtoSelecionado && (
                <div className="programacao-calendario-config-tecnico">
                  <div>
                    <span>Material</span>

                    <strong>{produtoSelecionado.materialNome || "-"}</strong>
                  </div>

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

                      receitas.length > 0 ? "ok" : "pendente",
                    ].join(" ")}
                  >
                    <span>Receitas disponíveis</span>

                    <strong>
                      {receitas.length > 0
                        ? `${receitas.length} ATIVA${receitas.length === 1 ? "" : "S"}`
                        : "NENHUMA"}
                    </strong>
                  </div>
                </div>
              )}
            </section>

            {!itemLegado && (
              <div className="programacao-calendario-area">
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
                      const dataISO = formatarDataISOLocal(data);

                      const configuracao = calendarioPorData.get(dataISO);

                      const programado = diasCalculadosPorData.get(dataISO);

                      const limite = Number(configuracao?.minutosProgramados ?? 0);

                      const passado = dataISO < hojeISO;

                      const hoje = dataISO === hojeISO;

                      const foraMes = data.getMonth() !== mesReferencia.getMonth();

                      const fechado = limite <= 0;

                      const marcado = marcadasSet.has(dataISO);

                      const observacaoCalendario = String(configuracao?.observacao ?? "").trim();

                      const textoFeriado = `${String(
                        configuracao?.origem ?? "",
                      )} ${observacaoCalendario}`;

                      const feriado =
                        fechado &&
                        /FERIADO|NATAL|TIRADENTES|FINADOS|INDEPEND[ÊE]NCIA|CONSCI[ÊE]NCIA|REP[ÚU]BLICA|APARECIDA|P[ÁA]SCOA|CARNAVAL|CORPUS|PAIX[ÃA]O|TRABALHO/i.test(
                          textoFeriado,
                        );

                      const nomeFeriado = feriado ? resumirNomeFeriado(observacaoCalendario) : "";

                      const disponibilidade =
                        configuracao?.perfilCodigo || (limite >= 1440 ? "24H" : "");

                      /*
                         IMPORTANTE:
                         24H É O PADRÃO NORMAL.
                         NÃO MOSTRAMOS MAIS "24H"
                         DENTRO DO CARD.
                      */
                      const disponibilidadeCard = disponibilidade === "24H" ? "" : disponibilidade;

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
                                <span className="programacao-calendario-feriado-badge">
                                  Feriado
                                </span>
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

                                <small>{feriado ? nomeFeriado || "Feriado" : "Bloqueado"}</small>
                              </>
                            ) : programado ? (
                              <>
                                <strong className="programacao-calendario-horas-programadas">
                                  {Number(programado.minutosSolicitados ?? 0) > 0
                                    ? formatarMinutos(programado.minutosSolicitados)
                                    : "Defina horas"}
                                </strong>

                                {hoje && programado.minutosDescontados > 0 ? (
                                  <small>
                                    {formatarMinutos(programado.minutosEfetivos)} efetivas
                                  </small>
                                ) : (
                                  <small>Programado</small>
                                )}

                                <span
                                  className={
                                    programado.receitaId
                                      ? "programacao-calendario-dia-receita definida"
                                      : "programacao-calendario-dia-receita pendente"
                                  }
                                  title={programado.receitaNome || "Receita pendente"}
                                >
                                  {programado.receitaNome || "Receita pendente"}
                                </span>
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
                                  {disponibilidadeCard || "Disponível"}
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
                </section>

                <div className="programacao-calendario-lote">
                  <div className="programacao-calendario-lote-info">
                    <span>Configuração dos dias selecionados</span>

                    <strong>
                      {datasMarcadas.length}{" "}
                      {datasMarcadas.length === 1 ? "dia selecionado" : "dias selecionados"}
                    </strong>

                    <small>
                      Aplique a jornada e a receita diretamente aos dias marcados. Para usar
                      receitas diferentes, selecione os dias separadamente.
                    </small>
                  </div>

                  <div className="programacao-calendario-lote-acoes">
                    <div className="programacao-calendario-lote-presets">
                      {PERFIS.map((perfil) => (
                        <button
                          key={perfil.codigo}
                          type="button"
                          onClick={() => aplicarPerfil(perfil)}
                          disabled={datasMarcadas.length === 0 || salvando}
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
                        disabled={datasMarcadas.length === 0 || salvando}
                      />

                      <span>h</span>

                      <button
                        type="button"
                        onClick={aplicarOutro}
                        disabled={datasMarcadas.length === 0 || salvando}
                      >
                        Aplicar
                      </button>
                    </div>

                    <div className="programacao-calendario-lote-receita">
                      <span className="programacao-calendario-lote-receita-rotulo">Receita</span>

                      <select
                        value={receitaLoteId}
                        onChange={(event) => setReceitaLoteId(event.target.value)}
                        disabled={datasMarcadas.length === 0 || salvando || receitas.length === 0}
                      >
                        <option value="">Selecionar receita</option>

                        {receitas.map((receita) => (
                          <option key={receita.id} value={receita.id}>
                            {receita.nome}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={aplicarReceitaMarcadas}
                        disabled={
                          datasMarcadas.length === 0 ||
                          salvando ||
                          !receitaLoteId ||
                          receitas.length === 0
                        }
                      >
                        Aplicar receita
                      </button>
                    </div>

                    {algumMarcadoProgramado && (
                      <button
                        type="button"
                        className="programacao-calendario-lote-remover"
                        onClick={removerMarcadosDaProgramacao}
                        disabled={datasMarcadas.length === 0 || salvando}
                      >
                        <Trash2 size={14} />
                        Remover
                      </button>
                    )}

                    <button
                      type="button"
                      className="programacao-calendario-lote-limpar"
                      onClick={() => setDatasMarcadas([])}
                      disabled={datasMarcadas.length === 0 || salvando}
                    >
                      Limpar
                    </button>
                  </div>
                </div>

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
                      <span>Consumo previsto</span>

                      <strong>{formatarKg(calculo.consumoPeriodoKg)}</strong>

                      <small>consumo projetado</small>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {!itemLegado && (
              <label
                className={["programacao-modal-status", ativo ? "ativo" : "inativo"].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(event) => setAtivo(event.target.checked)}
                  disabled={salvando}
                />

                <div>
                  <strong>Programação ativa</strong>

                  <span>
                    Quando ativa, esta programação fica disponível para os cálculos de consumo e
                    projeção.
                  </span>
                </div>

                <span className="programacao-modal-status-badge">
                  {ativo ? "ATIVA" : "INATIVA"}
                </span>
              </label>
            )}

            {erro && <div className="programacao-modal-erro">{erro}</div>}
          </div>
          <div className="programacao-modal-acoes" data-modal-footer="">
            <button
              type="button"
              className="programacao-modal-cancelar"
              onClick={onCancelar}
              disabled={salvando}
              data-modal-acao="secundaria"
            >
              {itemLegado ? "Fechar" : "Cancelar"}
            </button>

            {!itemLegado && (
              <button
                type="submit"
                className="programacao-modal-salvar"
                disabled={salvando}
                data-modal-acao="primaria"
              >
                <Save size={17} />

                <span>{salvando ? "Salvando..." : "Salvar programação"}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
}
