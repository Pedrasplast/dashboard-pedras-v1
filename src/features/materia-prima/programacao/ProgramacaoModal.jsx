import "./ProgramacaoLayout.css";
import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";
import { AlertTriangle, CalendarDays, Save, X } from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import {
  adicionarMeses,
  calcularDiasProgramacao,
  calcularProducaoProgramacao,
  criarDataLocal,
  criarDiasGrade,
  obterInicioMes,
  validarProgramacao,
} from "./programacaoModal.utils";
import {
  alternarDataMarcada,
  aplicarJornadaNosDias,
  aplicarReceitaNosDias,
  converterHorasOutro,
  normalizarDiasItem,
  podeMarcarData,
  removerDiasMarcados,
  validarJornadaNasDatas,
} from "./programacaoModal.dias";
import CalendarioProducao from "./modal/CalendarioProducao";
import ConfiguracaoProducao from "./modal/ConfiguracaoProducao";
import LoteDiasSelecionados from "./modal/LoteDiasSelecionados";
import ResumoProgramacao from "./modal/ResumoProgramacao";
import { useCalendarioProgramacao } from "./modal/useCalendarioProgramacao";
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
      const dias = normalizarDiasItem(item);

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

  const { calendario, periodos, carregandoCalendario } = useCalendarioProgramacao({
    aberto,
    inicio: periodoGrade.inicio,
    fim: periodoGrade.fim,
    onErro: setErro,
  });

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
     MARCAÇÃO E AÇÕES DOS DIAS MARCADOS
  ======================================================= */

  function alternarMarcacaoDia(dataISO) {
    if (!podeMarcarData(dataISO, calendarioPorData)) {
      return;
    }

    setErro("");

    setDatasMarcadas((atuais) => alternarDataMarcada(atuais, dataISO));
  }

  function aplicarHorasMarcadas(jornada) {
    if (datasMarcadas.length === 0) {
      return;
    }

    const mensagem = validarJornadaNasDatas(
      datasMarcadas,
      calendarioPorData,
      jornada.minutosSolicitados,
    );

    if (mensagem) {
      setErro(mensagem);

      return;
    }

    setDiasSelecionados((atuais) =>
      aplicarJornadaNosDias(atuais, datasMarcadas, calendarioPorData, jornada),
    );

    setErro("");
  }

  function aplicarPerfil(perfil) {
    aplicarHorasMarcadas({
      perfilHoras: perfil.codigo,

      minutosSolicitados: perfil.minutos,
    });
  }

  function aplicarOutro() {
    const minutos = converterHorasOutro(horasOutroLote);

    if (minutos === null) {
      setErro("No campo Outro, informe um valor maior que 0 e de no máximo 24 horas.");

      return;
    }

    aplicarHorasMarcadas({
      perfilHoras: "OUTRO",

      minutosSolicitados: minutos,
    });
  }

  function aplicarReceitaMarcadas() {
    if (datasMarcadas.length === 0) {
      return;
    }

    const receita =
      receitas.find((receita) => String(receita?.id ?? "") === String(receitaLoteId ?? "")) ?? null;

    if (!receita) {
      setErro("Selecione uma receita válida para os dias marcados.");

      return;
    }

    setDiasSelecionados((atuais) =>
      aplicarReceitaNosDias(atuais, datasMarcadas, calendarioPorData, receita),
    );

    setErro("");
  }

  function removerMarcadosDaProgramacao() {
    if (datasMarcadas.length === 0) {
      return;
    }

    setDiasSelecionados((atuais) => removerDiasMarcados(atuais, datasMarcadas));

    setDatasMarcadas([]);
    setErro("");
  }

  const algumMarcadoProgramado = useMemo(
    () => datasMarcadas.some((data) => programacaoPorData.has(data)),
    [datasMarcadas, programacaoPorData],
  );

  /* =======================================================
     PRODUTO E CÁLCULO
  ======================================================= */

  const produtoSelecionado = useMemo(
    () =>
      produtos.find((produto) => String(produto?.codigo ?? "") === String(codigoProduto)) ?? null,
    [produtos, codigoProduto],
  );

  const diasCalculados = useMemo(
    () => calcularDiasProgramacao(diasSelecionados, calendarioPorData, periodos),
    [diasSelecionados, calendarioPorData, periodos],
  );

  const diasCalculadosPorData = useMemo(
    () => new Map(diasCalculados.map((dia) => [dia.data, dia])),
    [diasCalculados],
  );

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

            <ConfiguracaoProducao
              injetora={injetora}
              codigoProduto={codigoProduto}
              produtos={produtos}
              produtoSelecionado={produtoSelecionado}
              receitas={receitas}
              calculo={calculo}
              bloqueado={salvando || itemLegado}
              onAlterarInjetora={(valor) => {
                setInjetora(valor);

                setErro("");
              }}
              onAlterarProduto={(valor) => {
                setCodigoProduto(valor);

                setErro("");
              }}
            />

            {!itemLegado && (
              <div className="programacao-calendario-area">
                <CalendarioProducao
                  mesReferencia={mesReferencia}
                  diasGrade={diasGrade}
                  hojeISO={hojeISO}
                  calendarioPorData={calendarioPorData}
                  diasCalculadosPorData={diasCalculadosPorData}
                  marcadasSet={marcadasSet}
                  carregandoCalendario={carregandoCalendario}
                  onMesAnterior={() => setMesReferencia((atual) => adicionarMeses(atual, -1))}
                  onMesAtual={() => setMesReferencia(obterInicioMes(new Date()))}
                  onProximoMes={() => setMesReferencia((atual) => adicionarMeses(atual, 1))}
                  onAlternarDia={alternarMarcacaoDia}
                />

                <LoteDiasSelecionados
                  quantidadeMarcada={datasMarcadas.length}
                  salvando={salvando}
                  horasOutro={horasOutroLote}
                  receitas={receitas}
                  receitaId={receitaLoteId}
                  algumMarcadoProgramado={algumMarcadoProgramado}
                  onAplicarPerfil={aplicarPerfil}
                  onAlterarHorasOutro={setHorasOutroLote}
                  onAplicarOutro={aplicarOutro}
                  onAlterarReceita={setReceitaLoteId}
                  onAplicarReceita={aplicarReceitaMarcadas}
                  onRemover={removerMarcadosDaProgramacao}
                  onLimpar={() => setDatasMarcadas([])}
                />

                <ResumoProgramacao quantidadeDias={diasCalculados.length} calculo={calculo} />
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
