// A ordem dos imports define a ordem do CSS: o do Modal vem antes dos demais, como sempre foi.
import ModalDiaCalendario from "./components/ModalDiaCalendario";

import { useCallback, useMemo, useState } from "react";

import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck, Users } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { useNavigate } from "@/lib/navegacao";

import { criarDiaSelecionado } from "./calendarioIndustrial.regras";
import CalendarioAnual from "./components/CalendarioAnual";
import ResumoCalendario from "./components/ResumoCalendario";
import TabelaExcecoes from "./components/TabelaExcecoes";
import useCalendarioIndustrial from "./hooks/useCalendarioIndustrial";
import { obterHojeISO } from "@/shared/lib/datas";

import "./AdministracaoPage.css";

export default function AdministracaoPage() {
  const navigate = useNavigate();

  const {
    ano,
    setAno,
    loading,
    sincronizando,
    mensagem,
    setMensagem,
    mapaCalendario,
    excecoes,
    indicadores,
    carregarCalendario,
    sincronizarFeriados,
  } = useCalendarioIndustrial();

  const [diaSelecionado, setDiaSelecionado] = useState(null);

  const hojeIso = useMemo(() => obterHojeISO(), []);

  const abrirDia = useCallback(
    (dataIso) => {
      setDiaSelecionado(criarDiaSelecionado(dataIso, mapaCalendario.get(dataIso)));
    },
    [mapaCalendario],
  );

  function concluirDia(texto) {
    setMensagem({ tipo: "sucesso", texto });
    setDiaSelecionado(null);
  }

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

      <ResumoCalendario indicadores={indicadores} />

      <CalendarioAnual
        ano={ano}
        setAno={setAno}
        loading={loading}
        mapaCalendario={mapaCalendario}
        hojeIso={hojeIso}
        onAbrirDia={abrirDia}
      />

      <TabelaExcecoes ano={ano} excecoes={excecoes} onAbrirDia={abrirDia} />

      {diaSelecionado && (
        <ModalDiaCalendario
          dia={diaSelecionado}
          onFechar={() => setDiaSelecionado(null)}
          onRecarregar={carregarCalendario}
          onConcluido={concluirDia}
          onErro={(texto) => setMensagem({ tipo: "erro", texto })}
        />
      )}
    </main>
  );
}
