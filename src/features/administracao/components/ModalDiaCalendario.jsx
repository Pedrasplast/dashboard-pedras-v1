import { useState } from "react";

import Modal from "@/components/Modal/Modal";
import ModalTitulo from "@/components/Modal/ModalTitulo";

import { Ban, CalendarDays, CheckCircle2, Clock3, RotateCcw, Save, X } from "lucide-react";

import {
  classePerfil,
  formatarDataPtBr,
  formatarDiaSemana,
  mensagemErro,
  montarObservacaoDia,
} from "../calendarioIndustrial.regras";
import {
  removerExcecaoCalendarioIndustrial,
  salvarExcecaoCalendarioIndustrial,
} from "../calendarioIndustrialAdminService";

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

// O estado do formulário fica aqui, e não na página, para que digitar a observação
// não redesenhe o calendário inteiro. O componente nasce a cada dia aberto.
export default function ModalDiaCalendario({ dia, onFechar, onRecarregar, onConcluido, onErro }) {
  const [perfilSelecionado, setPerfilSelecionado] = useState(dia.item?.perfil_codigo || "24H");
  const [observacao, setObservacao] = useState(dia.temExcecao ? dia.item.observacao || "" : "");
  const [salvando, setSalvando] = useState(false);

  function fecharModal() {
    if (salvando) {
      return;
    }

    onFechar();
  }

  async function salvarDia() {
    try {
      setSalvando(true);

      await salvarExcecaoCalendarioIndustrial({
        data: dia.data,
        perfilCodigo: perfilSelecionado,
        observacao: montarObservacaoDia(observacao, perfilSelecionado, dia.ehFeriadoAutomatico),
      });

      await onRecarregar();

      onConcluido("Calendário industrial atualizado com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar exceção do calendário:", error);
      onErro(mensagemErro(error, "Não foi possível salvar a configuração do dia."));
    } finally {
      setSalvando(false);
    }
  }

  async function voltarAoPadrao() {
    try {
      setSalvando(true);

      await removerExcecaoCalendarioIndustrial(dia.data);
      await onRecarregar();

      onConcluido("Exceção removida. O dia voltou ao padrão semanal de 24 horas.");
    } catch (error) {
      console.error("Erro ao remover exceção do calendário:", error);
      onErro(mensagemErro(error, "Não foi possível remover a exceção do dia."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      asChild
      aberto={true}
      onFechar={fecharModal}
      bloqueado={salvando}
      tamanho="medio"
      fecharAoClicarFora={true}
    >
      <section
        className="administracao-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="administracao-modal-titulo"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="administracao-modal-header" data-modal-header="">
          <div className="administracao-modal-icon" data-modal-icone="">
            <CalendarDays size={21} aria-hidden="true" />
          </div>

          <div>
            <span>Calendário industrial</span>
            <ModalTitulo>
              <h3 id="administracao-modal-titulo">{formatarDataPtBr(dia.data)}</h3>
            </ModalTitulo>
            <p>{formatarDiaSemana(dia.data)}</p>
          </div>

          <button
            type="button"
            className="administracao-modal-close"
            onClick={fecharModal}
            disabled={salvando}
            aria-label="Fechar"
            data-modal-fechar=""
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        {dia.ehFeriadoAutomatico && (
          <div className="administracao-modal-feriado">
            <CalendarDays size={16} aria-hidden="true" />
            <span>
              Este dia foi importado automaticamente como feriado nacional. Uma alteração manual
              terá prioridade nas próximas sincronizações.
            </span>
          </div>
        )}

        <div className="administracao-modal-body" data-modal-body="">
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
                    <span className="administracao-perfil-opcao-icon" data-modal-icone="">
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

        <footer className="administracao-modal-footer" data-modal-footer="">
          <div>
            {dia.temExcecao && (
              <button
                type="button"
                className="administracao-btn administracao-btn-perigo-suave"
                onClick={voltarAoPadrao}
                disabled={salvando}
                data-modal-acao="secundaria"
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
              data-modal-acao="secundaria"
            >
              Cancelar
            </button>

            <button
              type="button"
              className="administracao-btn administracao-btn-primario"
              onClick={salvarDia}
              disabled={salvando}
              data-modal-acao="secundaria"
            >
              <Save size={16} aria-hidden="true" />
              {salvando ? "Salvando..." : "Salvar dia"}
            </button>
          </div>
        </footer>
      </section>
    </Modal>
  );
}
