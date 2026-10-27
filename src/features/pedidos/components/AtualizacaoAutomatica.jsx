import { useEffect, useMemo, useState } from "react";

import { Clock3 } from "lucide-react";

import { obterProximaSincronizacaoPedidos } from "../utils/proximaSincronizacao";
import { formatarHora, formatarDataHora } from "@/shared/lib/datas";

/* =========================================================
   ATUALIZACAO AUTOMATICA
   ---------------------------------------------------------
   Sincronizacao principal de pedidos (cron no Supabase):
   a cada 15 minutos, de segunda a sexta, das 07:00 as 17:45.
   Fora desse horario a "Proxima" mostra a primeira rodada
   do proximo dia util.
========================================================= */

const INTERVALO_RELOGIO = 1000;

/* =========================================================
   PROXIMA ATUALIZACAO
========================================================= */

function obterProximaAtualizacao(dataAtual) {
  return obterProximaSincronizacaoPedidos(dataAtual instanceof Date ? dataAtual : new Date());
}

/* =========================================================
   COMPONENTE
========================================================= */

export default function AtualizacaoAutomatica({ atualizadoEm }) {
  /* =======================================================
     RELOGIO LOCAL

     Serve apenas para atualizar visualmente
     o horario da proxima sincronizacao.

     Nao consulta:
     - Omie
     - Supabase
     - Edge Function
  ======================================================= */

  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAgora(new Date());
    }, INTERVALO_RELOGIO);

    return () => {
      window.clearInterval(intervalo);
    };
  }, []);

  /* =======================================================
     PROXIMA EXECUCAO
  ======================================================= */

  const proximaAtualizacao = useMemo(() => obterProximaAtualizacao(agora), [agora]);

  /* =======================================================
     TOOLTIP
  ======================================================= */

  const tooltip = atualizadoEm
    ? `Última sincronização: ${formatarDataHora(
        atualizadoEm,
      )} | Próxima execução automática: ${formatarDataHora(proximaAtualizacao)}`
    : `Aguardando primeira sincronização. Próxima execução automática: ${formatarDataHora(
        proximaAtualizacao,
      )}`;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="pedidos-atualizacao-minimal" title={tooltip}>
      {/* ICONE */}

      <div className="pedidos-atualizacao-minimal-icone">
        <Clock3 size={15} strokeWidth={2} />
      </div>

      {/* CONTEUDO */}

      <div className="pedidos-atualizacao-minimal-conteudo">
        {/* STATUS */}

        <div className="pedidos-atualizacao-minimal-topo">
          <span className="pedidos-atualizacao-minimal-status">
            <span className="pedidos-atualizacao-minimal-ponto" />
            Atualização automática
          </span>
        </div>

        {/* HORARIOS */}

        <div className="pedidos-atualizacao-minimal-horarios">
          <span>
            <span className="pedidos-atualizacao-minimal-label">Última</span>

            <strong>{formatarHora(atualizadoEm)}</strong>
          </span>

          <span className="pedidos-atualizacao-minimal-divisor">•</span>

          <span>
            <span className="pedidos-atualizacao-minimal-label">Próxima</span>

            <strong className="pedidos-atualizacao-minimal-proxima">
              {formatarHora(proximaAtualizacao)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
