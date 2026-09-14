import { useEffect, useState } from "react";
import { Timer, X } from "lucide-react";

import { JORNADAS } from "../programacaoProducao.constants";
import { salvarProgramacaoProducao } from "../services/programacaoProducao.service";
import {
  dataHoraLocalParaInput,
  formatarNumero,
  numero,
} from "../utils/programacaoProducao.utils";

export default function ProgramacaoProducaoModal({
  produto,
  onClose,
  onSaved,
}) {
  const [inicio, setInicio] = useState("");
  const [jornada, setJornada] = useState(22);
  const [sabado, setSabado] = useState(false);
  const [jornadaSabado, setJornadaSabado] = useState(5);
  const [domingo, setDomingo] = useState(false);
  const [jornadaDomingo, setJornadaDomingo] = useState(5);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!produto) return;

    setInicio(
      produto.programacao?.inicio_em
        ? dataHoraLocalParaInput(produto.programacao.inicio_em)
        : dataHoraLocalParaInput(new Date()),
    );
    setJornada(
      JORNADAS.includes(numero(produto.programacao?.jornada_horas))
        ? numero(produto.programacao.jornada_horas)
        : 22,
    );
    setSabado(Boolean(produto.programacao?.trabalha_sabado));
    setJornadaSabado(
      JORNADAS.includes(numero(produto.programacao?.jornada_sabado_horas))
        ? numero(produto.programacao.jornada_sabado_horas)
        : 5,
    );
    setDomingo(Boolean(produto.programacao?.trabalha_domingo));
    setJornadaDomingo(
      JORNADAS.includes(numero(produto.programacao?.jornada_domingo_horas))
        ? numero(produto.programacao.jornada_domingo_horas)
        : 5,
    );
    setErro("");
  }, [produto]);

  if (!produto) return null;

  function fechar() {
    if (!salvando) onClose?.();
  }

  async function salvar() {
    setErro("");

    const inicioData = new Date(inicio);
    if (!inicio || Number.isNaN(inicioData.getTime())) {
      setErro("Informe uma data e hora de início válidas.");
      return;
    }

    if (!JORNADAS.includes(numero(jornada))) {
      setErro("Escolha uma jornada de 5, 17, 22 ou 24 horas.");
      return;
    }

    if (sabado && !JORNADAS.includes(numero(jornadaSabado))) {
      setErro("Escolha quantas horas serão trabalhadas no sábado.");
      return;
    }

    if (domingo && !JORNADAS.includes(numero(jornadaDomingo))) {
      setErro("Escolha quantas horas serão trabalhadas no domingo.");
      return;
    }

    setSalvando(true);

    try {
      await salvarProgramacaoProducao({
        codigoProduto: produto.codigo_produto,
        inicio: inicioData,
        jornadaHoras: numero(jornada),
        trabalhaSabado: sabado,
        jornadaSabadoHoras: numero(jornadaSabado),
        trabalhaDomingo: domingo,
        jornadaDomingoHoras: numero(jornadaDomingo),
      });

      await onSaved?.(
        `Programação do produto ${produto.codigo_produto} salva. O término foi recalculado automaticamente.`,
      );
      onClose?.();
    } catch (error) {
      console.error("Erro ao salvar programação:", error);
      setErro(error?.message || "Não foi possível salvar a programação.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="programacao-modal-fundo" onMouseDown={fechar}>
      <div className="programacao-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header className="programacao-modal-header">
          <div>
            <span>Programar produção</span>
            <h2>{produto.codigo_produto}</h2>
            <p>{produto.produto}</p>
          </div>
          <button type="button" onClick={fechar}>
            <X size={20} />
          </button>
        </header>

        <div className="programacao-modal-resumo">
          <div>
            <span>Estoque</span>
            <strong>{formatarNumero(produto.estoque_inicial)}</strong>
          </div>
          <div>
            <span>Pedidos</span>
            <strong>{formatarNumero(produto.quantidade_pedida)}</strong>
          </div>
          <div>
            <span>Produzir</span>
            <strong>{formatarNumero(produto.necessidade_producao)}</strong>
          </div>
          <div>
            <span>Ciclo</span>
            <strong>{formatarNumero(produto.ciclo_segundos)} s</strong>
          </div>
        </div>

        <div className="programacao-modal-corpo">
          <section className="programacao-modal-secao">
            <div className="programacao-modal-secao-titulo">
              <div>
                <strong>Configuração principal</strong>
                <span>Defina quando a produção começa e a jornada utilizada de segunda a sexta.</span>
              </div>
            </div>

            <div className="programacao-form-grid">
              <label className="programacao-campo">
                <span>Início da produção</span>
                <input
                  type="datetime-local"
                  value={inicio}
                  onChange={(event) => setInicio(event.target.value)}
                />
              </label>

              <div className="programacao-jornada">
                <span>Jornada de segunda a sexta</span>
                <div>
                  {JORNADAS.map((horas) => (
                    <button
                      key={horas}
                      type="button"
                      className={jornada === horas ? "ativo" : ""}
                      onClick={() => setJornada(horas)}
                    >
                      <strong>{horas} h</strong>
                      <small>por dia</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="programacao-modal-secao">
            <div className="programacao-modal-secao-titulo">
              <div>
                <strong>Fim de semana</strong>
                <span>Ative somente os dias em que realmente haverá produção e escolha a jornada específica.</span>
              </div>
            </div>

            <div className="programacao-fim-semana-detalhes">
              <div className={`programacao-dia-fim-semana ${sabado ? "ativo" : ""}`}>
                <div className="programacao-dia-topo">
                  <div>
                    <strong>Sábado</strong>
                    <span>{sabado ? `${jornadaSabado} h de produção` : "Sem produção"}</span>
                  </div>
                  <label className="programacao-switch">
                    <input
                      type="checkbox"
                      checked={sabado}
                      onChange={(event) => setSabado(event.target.checked)}
                    />
                    <span aria-hidden="true" />
                  </label>
                </div>

                {sabado && (
                  <div className="programacao-jornada-fim-semana">
                    <small>Horas trabalhadas no sábado</small>
                    <div>
                      {JORNADAS.map((horas) => (
                        <button
                          key={horas}
                          type="button"
                          className={jornadaSabado === horas ? "ativo" : ""}
                          onClick={() => setJornadaSabado(horas)}
                        >
                          {horas} h
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={`programacao-dia-fim-semana ${domingo ? "ativo" : ""}`}>
                <div className="programacao-dia-topo">
                  <div>
                    <strong>Domingo</strong>
                    <span>{domingo ? `${jornadaDomingo} h de produção` : "Sem produção"}</span>
                  </div>
                  <label className="programacao-switch">
                    <input
                      type="checkbox"
                      checked={domingo}
                      onChange={(event) => setDomingo(event.target.checked)}
                    />
                    <span aria-hidden="true" />
                  </label>
                </div>

                {domingo && (
                  <div className="programacao-jornada-fim-semana">
                    <small>Horas trabalhadas no domingo</small>
                    <div>
                      {JORNADAS.map((horas) => (
                        <button
                          key={horas}
                          type="button"
                          className={jornadaDomingo === horas ? "ativo" : ""}
                          onClick={() => setJornadaDomingo(horas)}
                        >
                          {horas} h
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="programacao-regra-info">
            <Timer size={18} />
            <div>
              <strong>O cálculo é automático</strong>
              <span>
                No primeiro dia, o sistema considera somente as horas restantes após o horário de início.
                Depois aplica a jornada configurada em cada dia da projeção.
              </span>
            </div>
          </div>

          {erro && <div className="programacao-modal-erro">{erro}</div>}
        </div>

        <footer className="programacao-modal-footer">
          <button type="button" className="secundario" onClick={fechar} disabled={salvando}>
            Cancelar
          </button>
          <button type="button" className="primario" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar e calcular"}
          </button>
        </footer>
      </div>
    </div>
  );
}
