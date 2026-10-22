import { useHistoricoRotina } from "../hooks/useMonitoramento";
import { formatarDataHora, formatarDuracao } from "../utils/monitoramento.utils";

export default function HistoricoRotina({ rotina, monitorada }) {
  const { data, isLoading, isError, error } = useHistoricoRotina(rotina, true);

  if (!monitorada) {
    return (
      <p className="mon-historico__vazio">
        Esta rotina roda direto no banco, sem chamar o Omie. O resultado da
        última execução aparece acima.
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
            const situacao = execucao.sucesso === null ? "rodando" : execucao.sucesso ? "ok" : "erro";
            return (
              <tr key={execucao.disparado_em} className={`mon-historico__linha--${situacao}`}>
                <td>{formatarDataHora(execucao.disparado_em)}</td>
                <td>{formatarDuracao(execucao.duracao_ms)}</td>
                <td>
                  <span className={`mon-selo mon-selo--${situacao}`}>
                    {situacao === "ok" ? "OK" : situacao === "erro" ? "Erro" : "Rodando"}
                  </span>
                </td>
                <td className="mon-historico__detalhe">
                  {execucao.erro
                    ? <span className="mon-texto-erro">{execucao.erro}</span>
                    : execucao.status_http
                      ? `HTTP ${execucao.status_http}`
                      : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
