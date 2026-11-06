import { explicarErro } from "../utils/diagnostico";

/*
 * Erro em português: causa provável + o que fazer, com o texto técnico
 * (completo, quando disponível) num "Detalhe técnico" recolhido.
 */
export default function ErroExplicado({ texto, statusHttp = null, complemento = null }) {
  const explicacao = explicarErro(texto, statusHttp);
  if (!explicacao) return null;

  return (
    <div className="mon-erro">
      <p className="mon-erro__texto">
        <strong>{explicacao.titulo}.</strong> {explicacao.dica}
        {complemento && <span className="mon-erro__complemento"> {complemento}</span>}
      </p>

      {explicacao.pedidos.length > 0 && (
        <p className="mon-erro__pedidos">
          Pedidos com erro:{" "}
          {explicacao.pedidos.map((p) => `${p.pedido} (${p.erro})`).join(", ")}
        </p>
      )}

      <details className="mon-erro__tecnico">
        <summary>Detalhe técnico</summary>
        <pre>{String(texto)}</pre>
      </details>
    </div>
  );
}
