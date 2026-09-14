import { formatarData, formatarDataHora, formatarNumero } from "../utils/programacaoProducao.utils";

export default function ProjecaoDiariaTabela({ dias }) {
  return (
    <div className="projecao-tabela-wrapper">
      <table className="projecao-tabela">
        <thead>
          <tr>
            <th>Data</th>
            <th>Saldo inicial</th>
            <th>Produção</th>
            <th>Pedidos do dia</th>
            <th>Saída</th>
            <th>Saldo final</th>
            <th>Situação</th>
          </tr>
        </thead>
        <tbody>
          {dias.map((dia) => (
            <tr
              key={dia.data}
              className={dia.situacao === "sem_movimento" ? "sem-movimento" : dia.situacao}
            >
              <td className="projecao-data">
                <strong>{formatarData(dia.data)}</strong>
              </td>
              <td className="projecao-numero">{formatarNumero(dia.saldo_inicial)} un.</td>
              <td className="projecao-numero producao">
                {dia.producao > 0 ? `+${formatarNumero(dia.producao)} un.` : "—"}
              </td>
              <td className="projecao-pedidos">
                {dia.pedidos.length === 0 ? (
                  <span className="projecao-sem-pedido">—</span>
                ) : (
                  dia.pedidos.map((pedido) => {
                    const atendimentoTexto = pedido.atendimento_por_estoque
                      ? "Disponível em estoque"
                      : pedido.atendimento_estimado
                        ? `Disponível em ${formatarDataHora(pedido.atendimento_estimado)}`
                        : "Aguardando programação";

                    return (
                      <div
                        key={`${pedido.codigo_pedido_omie}:${pedido.codigo_produto}`}
                        className="projecao-pedido-item"
                      >
                        <div className="projecao-pedido-principal">
                          <strong>#{pedido.numero_pedido}</strong>
                          <span title={pedido.cliente}>{pedido.cliente}</span>
                          <b>{formatarNumero(pedido.quantidade)} un.</b>
                        </div>
                        <div className="projecao-pedido-secundario">
                          <span>{atendimentoTexto}</span>
                          <em className={`projecao-pedido-status ${pedido.situacao}`}>
                            {pedido.situacao === "risco"
                              ? "Risco"
                              : pedido.situacao === "estoque"
                                ? "Estoque"
                                : "Produção"}
                          </em>
                        </div>
                      </div>
                    );
                  })
                )}
              </td>
              <td className="projecao-numero saida">
                {dia.saida > 0 ? `-${formatarNumero(dia.saida)} un.` : "—"}
              </td>
              <td className={`projecao-numero saldo-final ${dia.saldo_final < 0 ? "negativo" : "positivo"}`}>
                {formatarNumero(dia.saldo_final)} un.
              </td>
              <td>
                {dia.situacao === "risco" ? (
                  <span className="projecao-status risco">Risco</span>
                ) : dia.pedidos.length > 0 ? (
                  <span className="projecao-status atendido">Pedido atendido</span>
                ) : dia.producao > 0 ? (
                  <span className="projecao-status produzindo">Produzindo</span>
                ) : (
                  <span className="projecao-status neutro">Sem movimento</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
