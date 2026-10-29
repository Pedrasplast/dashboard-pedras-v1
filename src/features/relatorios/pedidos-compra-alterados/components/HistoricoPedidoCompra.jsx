import { FiEdit3 } from "react-icons/fi";

import { protegerDadosPagamento } from "../formatarHistoricoCompras";
import { formatarDataHora } from "@/shared/lib/datas";

const ESTILO_VALOR = {
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

/** Campo alterado com o valor de antes e o de depois. */
function CartaoMudanca({ mudanca }) {
  return (
    <div className="pedidos-alterados-mudanca">
      <strong>{protegerDadosPagamento(mudanca.campo)}</strong>

      <div className="pedidos-alterados-antes-depois">
        <span>
          <small>Antes</small>

          <b style={ESTILO_VALOR}>{protegerDadosPagamento(mudanca.anterior)}</b>
        </span>

        <span className="pedidos-alterados-seta" aria-hidden="true">
          →
        </span>

        <span>
          <small>Depois</small>

          <b style={ESTILO_VALOR}>{protegerDadosPagamento(mudanca.novo)}</b>
        </span>
      </div>
    </div>
  );
}

/** Histórico expandido de um pedido: uma ocorrência por alteração detectada. */
export default function HistoricoPedidoCompra({ pedido }) {
  return (
    <div className="pedidos-alterados-historico">
      <div className="pedidos-alterados-historico-titulo">
        <FiEdit3 aria-hidden="true" />

        <div>
          <strong>
            Histórico do pedido de compra {pedido.numero_pedido || pedido.cod_ped_compra}
          </strong>

          <span>{pedido.detalhes_alteracoes.length} ocorrência(s)</span>
        </div>
      </div>

      <div className="pedidos-alterados-ocorrencias">
        {pedido.detalhes_alteracoes.map((evento) => (
          <article className="pedidos-alterados-ocorrencia" key={evento.id}>
            <div className="pedidos-alterados-ocorrencia-topo">
              <strong>Alteração #{evento.numeroAlteracao}</strong>

              <span>{formatarDataHora(evento.detectado_em)}</span>
            </div>

            <div className="pedidos-alterados-mudancas">
              {evento.mudancas.map((mudanca, indice) => (
                <CartaoMudanca mudanca={mudanca} key={`${evento.id}-${indice}`} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
