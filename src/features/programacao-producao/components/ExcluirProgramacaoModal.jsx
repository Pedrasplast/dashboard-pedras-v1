import { useState } from "react";
import { Trash2, X } from "lucide-react";

import { excluirProgramacaoProducao } from "../services/programacaoProducao.service";

export default function ExcluirProgramacaoModal({ produto, onClose, onDeleted }) {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  if (!produto) return null;

  function fechar() {
    if (!excluindo) onClose?.();
  }

  async function excluir() {
    if (!produto.programacao?.id) return;

    setExcluindo(true);
    setErro("");

    try {
      await excluirProgramacaoProducao({
        id: produto.programacao.id,
        codigoProduto: produto.codigo_produto,
      });

      await onDeleted?.(
        `Programação do produto ${produto.codigo_produto} excluída. O histórico foi preservado.`,
      );
      onClose?.();
    } catch (error) {
      console.error("Erro ao excluir programação:", error);
      setErro(error?.message || "Não foi possível excluir a programação.");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="programacao-modal-fundo" onMouseDown={fechar}>
      <div
        className="programacao-modal programacao-modal-exclusao"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="programacao-modal-header">
          <div>
            <span>Excluir programação</span>
            <h2>{produto.codigo_produto}</h2>
            <p>{produto.produto}</p>
          </div>
          <button type="button" onClick={fechar}>
            <X size={20} />
          </button>
        </header>

        <div className="programacao-exclusao-conteudo">
          <Trash2 size={22} />
          <div>
            <strong>Excluir esta programação?</strong>
            <span>
              O produto volta para "Não programado". Nenhum pedido, estoque ou parâmetro será apagado
              e o registro da programação fica preservado no banco como inativo.
            </span>
          </div>
        </div>

        {erro && <div className="programacao-modal-erro">{erro}</div>}

        <footer className="programacao-modal-footer">
          <button type="button" className="secundario" onClick={fechar} disabled={excluindo}>
            Cancelar
          </button>
          <button type="button" className="perigo" onClick={excluir} disabled={excluindo}>
            <Trash2 size={15} />
            {excluindo ? "Excluindo..." : "Excluir programação"}
          </button>
        </footer>
      </div>
    </div>
  );
}
