import { useHistoricoRotina } from "../hooks/useMonitoramento";
import { resumirResultado } from "../utils/diagnostico";
import { formatarDataHora, formatarDuracao } from "../utils/monitoramento.utils";
import ErroExplicado from "./ErroExplicado";

/* Duração informada pela função; senão, o tempo entre disparo e resposta. */
function duracaoDaExecucao(execucao) {
  if (execucao.duracao_ms !== null && execucao.duracao_ms !== undefined) {
    return formatarDuracao(execucao.duracao_ms);
  }
  if (Number.isFinite(execucao.segundos)) {
    return formatarDuracao(execucao.segundos * 1000);
  }
  return "—";
}

export default function HistoricoRotina({ rotina, monitorada }) {
  const { data, isLoading, isError, error } = useHistoricoRotina(rotina, true);

  if (!monitorada) {
    return (
      <p className="mon-historico__vazio">
        Esta rotina roda direto no banco, sem chamar o Omie. O resultado da última execução aparece
        acima.
      </p>
    );
  }

  if (isLoading) return <p className="mon-historico__vazio">Carregando histórico…</p>;
  if (isError) return <p className="mon-historico__vazio mon-texto-erro">{error.message}</p>;
  if (!data?.length) {
    return (
      <p className="mon-historico__vazio">
        Nenhuma execução registrada ainda. O registro começa na próxima vez que a rotina rodar.
      </p>
    );
  }

  return (
    <div className="mon-historico">
      <table>
        <thead>
          <tr>
            <th>Início</th>
            <th>Duração</th>
            <th>Resultado</th>
            <th>Detalhe</th>
          </tr>
        </thead>
        <tbody>
          {data.map((execucao) => {
            const situacao =
              execucao.sucesso === null ? "rodando" : execucao.sucesso ? "ok" : "erro";
            const resultado = resumirResultado(execucao.resultado);
            return (
              <tr key={execucao.disparado_em} className={`mon-historico__linha--${situacao}`}>
                <td>{formatarDataHora(execucao.disparado_em)}</td>
                <td>{duracaoDaExecucao(execucao)}</td>
                <td>
                  <span className={`mon-selo mon-selo--${situacao}`}>
                    {situacao === "ok" ? "OK" : situacao === "erro" ? "Erro" : "Rodando"}
                  </span>
                </td>
                <td className="mon-historico__detalhe">
                  {execucao.erro ? (
                    <ErroExplicado texto={execucao.erro} statusHttp={execucao.status_http} />
                  ) : (
                    resultado ?? (execucao.status_http ? `HTTP ${execucao.status_http}` : "—")
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
