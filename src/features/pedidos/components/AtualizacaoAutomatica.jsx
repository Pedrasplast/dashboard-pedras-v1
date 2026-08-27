import { memo, useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";

import {
  formatarDataHora,
  formatarHorario,
  obterProximaAtualizacao,
} from "../pedidos.utils";

const INTERVALO_RELOGIO = 1000;

function AtualizacaoAutomatica({ atualizadoEm }) {
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    const intervalo = window.setInterval(() => setAgora(new Date()), INTERVALO_RELOGIO);
    return () => window.clearInterval(intervalo);
  }, []);

  const proximaAtualizacao = useMemo(() => obterProximaAtualizacao(agora), [agora]);

  const titulo = atualizadoEm
    ? `Última sincronização: ${formatarDataHora(atualizadoEm)} | Próxima execução automática: ${formatarDataHora(proximaAtualizacao)}`
    : `Aguardando primeira sincronização. Próxima execução automática: ${formatarDataHora(proximaAtualizacao)}`;

  return (
    <div className="pedidos-atualizacao" title={titulo}>
      <Clock3 size={18} />

      <div className="pedidos-atualizacao-textos">
        <span className="pedidos-atualizacao-titulo">Atualização automática</span>

        <span className="pedidos-atualizacao-horarios">
          Última: <strong>{formatarHorario(atualizadoEm)}</strong>
          <span className="pedidos-atualizacao-separador">|</span>
          Próxima: <strong>{formatarHorario(proximaAtualizacao)}</strong>
        </span>
      </div>
    </div>
  );
}

export default memo(AtualizacaoAutomatica);
