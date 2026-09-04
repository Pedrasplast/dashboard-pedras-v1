import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AlertTriangle,
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { useNavigate } from "@/lib/navegacao";

import {
  PREFIXO_FERIADO_NACIONAL,
  ehFeriadoNacionalAutomatico,
  listarCalendarioIndustrialAno,
  removerExcecaoCalendarioIndustrial,
  salvarExcecaoCalendarioIndustrial,
  sincronizarFeriadosNacionais,
} from "./calendarioIndustrialAdminService";

import "./AdministracaoPage.css";

const NOMES_MESES = Object.freeze([
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
]);

const DIAS_SEMANA = Object.freeze(["S", "T", "Q", "Q", "S", "S", "D"]);

const PERFIS = Object.freeze([
  {
    codigo: "SEM_PRODUCAO",
    label: "Sem produção",
    descricao: "Bloqueia totalmente o dia para novas programações.",
    icon: Ban,
  },
  {
    codigo: "5H",
    label: "5 horas",
    descricao: "Disponibilidade administrativa de 5 horas.",
    icon: Clock3,
  },
  {
    codigo: "17H",
    label: "17 horas",
    descricao: "Disponibilidade administrativa de 17 horas.",
    icon: Clock3,
  },
  {
    codigo: "22H",
    label: "22 horas",
    descricao: "Disponibilidade administrativa de 22 horas.",
    icon: Clock3,
  },
  {
    codigo: "24H",
    label: "24 horas",
    descricao: "Liberação explícita do dia para até 24 horas.",
    icon: CheckCircle2,
  },
]);

function dataIsoLocal(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function obterHojeIso() {
  const hoje = new Date();

  return dataIsoLocal(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
}

function obterAnoAtual() {
  return new Date().getFullYear();
}

function formatarDataPtBr(dataIso) {
  if (!dataIso) {
    return "—";
  }

  const [ano, mes, dia] = String(dataIso).split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

function formatarDiaSemana(dataIso) {
  const [ano, mes, dia] = String(dataIso).split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  }).format(data);
}

function obterDiasDoMes(ano, mes) {
  const quantidadeDias = new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const deslocamentoSegunda = (primeiroDiaSemana + 6) % 7;
  const dias = [];

  for (let i = 0; i < deslocamentoSegunda; i += 1) {
    dias.push(null);
  }

  for (let dia = 1; dia <= quantidadeDias; dia += 1) {
    dias.push({
      dia,
      data: dataIsoLocal(ano, mes, dia),
    });
  }

  while (dias.length % 7 !== 0) {
    dias.push(null);
  }

  return dias;
}

function classePerfil(perfilCodigo) {
  if (perfilCodigo === "SEM_PRODUCAO") {
    return "bloqueado";
  }

  if (perfilCodigo === "24H") {
    return "liberado";
  }

  if (["5H", "17H", "22H"].includes(perfilCodigo)) {
    return "parcial";
  }

  return "padrao";
}

function mensagemErro(error, fallback) {
  return error?.message || error?.details || fallback;
}

export default function AdministracaoPage() {
  const navigate = useNavigate();

  const [ano, setAno] = useState(obterAnoAtual());
  const [calendario, setCalendario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: "", texto: "" });

  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [perfilSelecionado, setPerfilSelecionado] = useState("24H");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const sincronizacaoAutomaticaRef = useRef(new Set());

  const hojeIso = useMemo(() => obterHojeIso(), []);

  const mapaCalendario = useMemo(
    () => new Map(calendario.map((item) => [String(item.data), item])),
    [calendario],
  );

  const excecoes = useMemo(
    () =>
      calendario
        .filter((item) => item.origem === "EXCECAO")
        .sort((a, b) => String(a.data).localeCompare(String(b.data))),
    [calendario],
  );

  const indicadores = useMemo(() => {
    let bloqueados = 0;
    let feriadosAutomaticos = 0;
    let manuais = 0;
    let liberacoes = 0;

    for (const item of excecoes) {
      if (item.perfil_codigo === "SEM_PRODUCAO") {
        bloqueados += 1;
      }

      if (ehFeriadoNacionalAutomatico(item)) {
        feriadosAutomaticos += 1;
      } else {
        manuais += 1;
      }

      if (item.perfil_codigo === "24H") {
        liberacoes += 1;
      }
    }

    return {
      bloqueados,
      feriadosAutomaticos,
      manuais,
      liberacoes,
    };
  }, [excecoes]);

  const carregarCalendario = useCallback(async () => {
    try {
      setLoading(true);

      const dados = await listarCalendarioIndustrialAno(ano);
      setCalendario(dados);
    } catch (error) {
      console.error("Erro ao carregar calendário industrial:", error);
      setMensagem({
        tipo: "erro",
        texto: mensagemErro(error, "Não foi possível carregar o calendário industrial."),
      });
    } finally {
      setLoading(false);
    }
  }, [ano]);

  useEffect(() => {
    void carregarCalendario();
  }, [carregarCalendario]);

  useEffect(() => {
    const anoAtual = obterAnoAtual();

    if (
      loading ||
      calendario.length === 0 ||
      ano < anoAtual ||
      ano > anoAtual + 1 ||
      sincronizacaoAutomaticaRef.current.has(ano)
    ) {
      return undefined;
    }

    sincronizacaoAutomaticaRef.current.add(ano);

    const chave = `pedrasplast:feriados-industriais:${ano}`;
    const ultimaSincronizacao = Number(window.localStorage.getItem(chave) || 0);
    const seteDias = 7 * 24 * 60 * 60 * 1000;

    if (Date.now() - ultimaSincronizacao < seteDias) {
      return undefined;
    }

    let cancelado = false;

    const executar = async () => {
      try {
        setSincronizando(true);

        await sincronizarFeriadosNacionais({
          ano,
          calendarioAtual: calendario,
        });

        if (cancelado) {
          return;
        }

        window.localStorage.setItem(chave, String(Date.now()));
        await carregarCalendario();
      } catch (error) {
        console.warn("Sincronização automática de feriados não concluída:", error);
      } finally {
        if (!cancelado) {
          setSincronizando(false);
        }
      }
    };

    void executar();

    return () => {
      cancelado = true;
    };
  }, [ano, calendario, loading, carregarCalendario]);

  useEffect(() => {
    if (!mensagem.texto) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setMensagem({ tipo: "", texto: "" });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [mensagem]);

  const abrirDia = useCallback(
    (dataIso) => {
      const item = mapaCalendario.get(dataIso);
      const temExcecao = item?.origem === "EXCECAO";

      setDiaSelecionado({
        data: dataIso,
        item,
        temExcecao,
        ehFeriadoAutomatico: temExcecao && ehFeriadoNacionalAutomatico(item),
      });

      setPerfilSelecionado(item?.perfil_codigo || "24H");
      setObservacao(temExcecao ? item.observacao || "" : "");
    },
    [mapaCalendario],
  );

  const fecharModal = useCallback(() => {
    if (salvando) {
      return;
    }

    setDiaSelecionado(null);
    setPerfilSelecionado("24H");
    setObservacao("");
  }, [salvando]);

  const salvarDia = useCallback(async () => {
    if (!diaSelecionado?.data) {
      return;
    }

    try {
      setSalvando(true);

      let observacaoFinal = String(observacao || "").trim();

      if (!observacaoFinal) {
        observacaoFinal =
          perfilSelecionado === "SEM_PRODUCAO"
            ? "SEM PRODUÇÃO — AJUSTE MANUAL DO CALENDÁRIO INDUSTRIAL"
            : "AJUSTE MANUAL DO CALENDÁRIO INDUSTRIAL";
      }

      // Se o administrador liberar/alterar um feriado importado, a decisão passa a ser manual.
      if (
        diaSelecionado.ehFeriadoAutomatico &&
        perfilSelecionado !== "SEM_PRODUCAO" &&
        observacaoFinal.toUpperCase().startsWith(PREFIXO_FERIADO_NACIONAL)
      ) {
        observacaoFinal = `AJUSTE MANUAL — ${observacaoFinal}`;
      }

      await salvarExcecaoCalendarioIndustrial({
        data: diaSelecionado.data,
        perfilCodigo: perfilSelecionado,
        observacao: observacaoFinal,
      });

      await carregarCalendario();

      setMensagem({
        tipo: "sucesso",
        texto: "Calendário industrial atualizado com sucesso.",
      });

      setDiaSelecionado(null);
      setObservacao("");
    } catch (error) {
      console.error("Erro ao salvar exceção do calendário:", error);
      setMensagem({
        tipo: "erro",
        texto: mensagemErro(error, "Não foi possível salvar a configuração do dia."),
      });
    } finally {
      setSalvando(false);
    }
  }, [
    diaSelecionado,
    perfilSelecionado,
    observacao,
    carregarCalendario,
  ]);

  const voltarAoPadrao = useCallback(async () => {
    if (!diaSelecionado?.data || !diaSelecionado?.temExcecao) {
      return;
    }

    try {
      setSalvando(true);

      await removerExcecaoCalendarioIndustrial(diaSelecionado.data);
      await carregarCalendario();

      setMensagem({
        tipo: "sucesso",
        texto: "Exceção removida. O dia voltou ao padrão semanal de 24 horas.",
      });

      setDiaSelecionado(null);
      setObservacao("");
    } catch (error) {
      console.error("Erro ao remover exceção do calendário:", error);
      setMensagem({
        tipo: "erro",
        texto: mensagemErro(error, "Não foi possível remover a exceção do dia."),
      });
    } finally {
      setSalvando(false);
    }
  }, [diaSelecionado, carregarCalendario]);

  const sincronizarFeriados = useCallback(async () => {
    try {
      setSincronizando(true);

      const resultado = await sincronizarFeriadosNacionais({
        ano,
        calendarioAtual: calendario,
      });

      await carregarCalendario();

      setMensagem({
        tipo: "sucesso",
        texto: `Feriados sincronizados: ${resultado.inseridos} novo(s), ${resultado.atualizados} atualizado(s) e ${resultado.preservados} decisão(ões) manual(is) preservada(s).`,
      });
    } catch (error) {
      console.error("Erro ao sincronizar feriados nacionais:", error);
      setMensagem({
        tipo: "erro",
        texto: mensagemErro(error, "Não foi possível sincronizar os feriados nacionais."),
      });
    } finally {
      setSincronizando(false);
    }
  }, [ano, calendario, carregarCalendario]);

  return (
    <main className="administracao-page">
      <PageHeader
        eyebrow="Administração"
        title="Calendário Industrial"
        description="Controle os dias de produção, feriados, paralisações e liberações especiais utilizados pela Programação de Matéria-Prima."
        icon={ShieldCheck}
        actions={
          <div className="administracao-header-actions">
            <button
              type="button"
              className="administracao-btn administracao-btn-secundario"
              onClick={() => navigate("/usuarios")}
            >
              <Users size={17} aria-hidden="true" />
              Usuários e permissões
            </button>

            <button
              type="button"
              className="administracao-btn administracao-btn-primario"
              onClick={sincronizarFeriados}
              disabled={sincronizando || loading}
            >
              <RefreshCw
                size={17}
                className={sincronizando ? "administracao-spin" : ""}
                aria-hidden="true"
              />
              {sincronizando ? "Sincronizando..." : "Sincronizar feriados"}
            </button>
          </div>
        }
      />

      {mensagem.texto && (
        <div className={`administracao-alerta ${mensagem.tipo}`} role="status">
          {mensagem.tipo === "erro" ? (
            <AlertTriangle size={17} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={17} aria-hidden="true" />
          )}
          <span>{mensagem.texto}</span>
        </div>
      )}

      <section className="administracao-resumo-grid" aria-label="Resumo do calendário">
        <article className="administracao-resumo-card">
          <span className="administracao-resumo-icone vermelho">
            <Ban size={18} aria-hidden="true" />
          </span>
          <div>
            <span className="administracao-resumo-label">Dias bloqueados</span>
            <strong>{indicadores.bloqueados}</strong>
          </div>
        </article>

        <article className="administracao-resumo-card">
          <span className="administracao-resumo-icone azul">
            <CalendarDays size={18} aria-hidden="true" />
          </span>
          <div>
            <span className="administracao-resumo-label">Feriados nacionais</span>
            <strong>{indicadores.feriadosAutomaticos}</strong>
          </div>
        </article>

        <article className="administracao-resumo-card">
          <span className="administracao-resumo-icone amarelo">
            <Clock3 size={18} aria-hidden="true" />
          </span>
          <div>
            <span className="administracao-resumo-label">Exceções manuais</span>
            <strong>{indicadores.manuais}</strong>
          </div>
        </article>

        <article className="administracao-resumo-card">
          <span className="administracao-resumo-icone verde">
            <CheckCircle2 size={18} aria-hidden="true" />
          </span>
          <div>
            <span className="administracao-resumo-label">Liberações 24h</span>
            <strong>{indicadores.liberacoes}</strong>
          </div>
        </article>
      </section>

      <section className="administracao-calendario-section">
        <div className="administracao-section-header">
          <div>
            <span className="administracao-section-eyebrow">Planejamento anual</span>
            <h2>Calendário {ano}</h2>
            <p>
              Clique em qualquer dia para bloquear, reduzir horas ou liberar uma exceção.
            </p>
          </div>

          <div className="administracao-ano-controle" aria-label="Selecionar ano">
            <button
              type="button"
              onClick={() => setAno((valor) => valor - 1)}
              aria-label="Ano anterior"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>

            <strong>{ano}</strong>

            <button
              type="button"
              onClick={() => setAno((valor) => valor + 1)}
              aria-label="Próximo ano"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="administracao-legenda">
          <span><i className="legenda-dot padrao" />Padrão 24h</span>
          <span><i className="legenda-dot bloqueado" />Sem produção</span>
          <span><i className="legenda-dot parcial" />Jornada especial</span>
          <span><i className="legenda-dot liberado" />Liberação 24h</span>
          <span><i className="legenda-dot feriado" />Feriado nacional</span>
        </div>

        {loading ? (
          <div className="administracao-loading">Carregando calendário industrial...</div>
        ) : (
          <div className="administracao-meses-grid">
            {NOMES_MESES.map((nomeMes, mes) => {
              const dias = obterDiasDoMes(ano, mes);

              return (
                <article className="administracao-mes-card" key={nomeMes}>
                  <header className="administracao-mes-header">
                    <h3>{nomeMes}</h3>
                  </header>

                  <div className="administracao-semana-header" aria-hidden="true">
                    {DIAS_SEMANA.map((dia, indice) => (
                      <span key={`${dia}-${indice}`}>{dia}</span>
                    ))}
                  </div>

                  <div className="administracao-dias-grid">
                    {dias.map((dia, indice) => {
                      if (!dia) {
                        return (
                          <span
                            key={`vazio-${indice}`}
                            className="administracao-dia-vazio"
                            aria-hidden="true"
                          />
                        );
                      }

                      const item = mapaCalendario.get(dia.data);
                      const temExcecao = item?.origem === "EXCECAO";
                      const perfil = item?.perfil_codigo || "24H";
                      const automatico = temExcecao && ehFeriadoNacionalAutomatico(item);
                      const hoje = dia.data === hojeIso;

                      const classes = [
                        "administracao-dia",
                        temExcecao ? "com-excecao" : "",
                        !temExcecao && perfil === "24H" ? "padrao-24h" : "",
                        classePerfil(perfil),
                        automatico ? "feriado-automatico" : "",
                        hoje ? "hoje" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      const titulo = temExcecao
                        ? `${formatarDataPtBr(dia.data)} — ${item.perfil_nome}${
                            item.observacao ? ` — ${item.observacao}` : ""
                          }`
                        : `${formatarDataPtBr(dia.data)} — padrão 24 horas`;

                      return (
                        <button
                          key={dia.data}
                          type="button"
                          className={classes}
                          onClick={() => abrirDia(dia.data)}
                          title={titulo}
                        >
                          <span className="administracao-dia-numero">{dia.dia}</span>

                          {automatico && (
                            <span className="administracao-dia-marca">F</span>
                          )}

                          {temExcecao && !automatico && (
                            <span className="administracao-dia-marca">
                              {perfil === "SEM_PRODUCAO" ? "×" : perfil}
                            </span>
                          )}

                          {!temExcecao && perfil === "24H" && (
                            <span className="administracao-dia-marca administracao-dia-marca-padrao">
                              24H
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="administracao-excecoes-section">
        <div className="administracao-section-header administracao-section-header-lista">
          <div>
            <span className="administracao-section-eyebrow">Exceções cadastradas</span>
            <h2>Alterações do ano</h2>
            <p>Feriados importados e decisões manuais que substituem o padrão de 24 horas.</p>
          </div>
        </div>

        {excecoes.length === 0 ? (
          <div className="administracao-vazio">
            <CalendarDays size={24} aria-hidden="true" />
            <strong>Nenhuma exceção cadastrada para {ano}.</strong>
            <span>Use o calendário ou sincronize os feriados nacionais.</span>
          </div>
        ) : (
          <div className="administracao-tabela-wrap">
            <table className="administracao-tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Origem</th>
                  <th>Configuração</th>
                  <th>Observação</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {excecoes.map((item) => {
                  const automatico = ehFeriadoNacionalAutomatico(item);

                  return (
                    <tr key={item.data}>
                      <td>
                        <strong>{formatarDataPtBr(item.data)}</strong>
                        <span className="administracao-tabela-secundario">
                          {formatarDiaSemana(item.data)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            automatico
                              ? "administracao-origem-badge automatico"
                              : "administracao-origem-badge manual"
                          }
                        >
                          {automatico ? "Feriado nacional" : "Manual"}
                        </span>
                      </td>
                      <td>
                        <span className={`administracao-perfil-badge ${classePerfil(item.perfil_codigo)}`}>
                          {item.perfil_codigo === "SEM_PRODUCAO"
                            ? "SEM PRODUÇÃO"
                            : item.perfil_codigo}
                        </span>
                      </td>
                      <td className="administracao-observacao-col">
                        {item.observacao || "—"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="administracao-editar-btn"
                          onClick={() => abrirDia(item.data)}
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {diaSelecionado && (
        <div className="administracao-modal-overlay" role="presentation" onMouseDown={fecharModal}>
          <section
            className="administracao-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="administracao-modal-titulo"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="administracao-modal-header">
              <div className="administracao-modal-icon">
                <CalendarDays size={21} aria-hidden="true" />
              </div>

              <div>
                <span>Calendário industrial</span>
                <h3 id="administracao-modal-titulo">
                  {formatarDataPtBr(diaSelecionado.data)}
                </h3>
                <p>{formatarDiaSemana(diaSelecionado.data)}</p>
              </div>

              <button
                type="button"
                className="administracao-modal-close"
                onClick={fecharModal}
                disabled={salvando}
                aria-label="Fechar"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </header>

            {diaSelecionado.ehFeriadoAutomatico && (
              <div className="administracao-modal-feriado">
                <CalendarDays size={16} aria-hidden="true" />
                <span>
                  Este dia foi importado automaticamente como feriado nacional. Uma alteração manual terá prioridade nas próximas sincronizações.
                </span>
              </div>
            )}

            <div className="administracao-modal-body">
              <fieldset className="administracao-perfis-fieldset">
                <legend>Disponibilidade do dia</legend>

                <div className="administracao-perfis-grid">
                  {PERFIS.map((perfil) => {
                    const Icon = perfil.icon;
                    const ativo = perfilSelecionado === perfil.codigo;

                    return (
                      <button
                        key={perfil.codigo}
                        type="button"
                        className={
                          ativo
                            ? `administracao-perfil-opcao ativo ${classePerfil(perfil.codigo)}`
                            : `administracao-perfil-opcao ${classePerfil(perfil.codigo)}`
                        }
                        onClick={() => setPerfilSelecionado(perfil.codigo)}
                      >
                        <span className="administracao-perfil-opcao-icon">
                          <Icon size={17} aria-hidden="true" />
                        </span>
                        <span>
                          <strong>{perfil.label}</strong>
                          <small>{perfil.descricao}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="administracao-observacao-field">
                <span>Observação</span>
                <textarea
                  rows={4}
                  value={observacao}
                  onChange={(event) => setObservacao(event.target.value)}
                  placeholder="Ex.: FERIADO MUNICIPAL, FÉRIAS COLETIVAS, MANUTENÇÃO GERAL..."
                />
              </label>
            </div>

            <footer className="administracao-modal-footer">
              <div>
                {diaSelecionado.temExcecao && (
                  <button
                    type="button"
                    className="administracao-btn administracao-btn-perigo-suave"
                    onClick={voltarAoPadrao}
                    disabled={salvando}
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    Voltar ao padrão 24h
                  </button>
                )}
              </div>

              <div className="administracao-modal-footer-right">
                <button
                  type="button"
                  className="administracao-btn administracao-btn-secundario"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="administracao-btn administracao-btn-primario"
                  onClick={salvarDia}
                  disabled={salvando}
                >
                  <Save size={16} aria-hidden="true" />
                  {salvando ? "Salvando..." : "Salvar dia"}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
