import {
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  X,
} from "lucide-react";

import "./CompraFuturaModal.css";

function dataHojeLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarData(valor) {
  if (!valor) return "-";

  const [ano, mes, dia] = String(valor).split("-");

  if (!ano || !mes || !dia) return String(valor);

  return `${dia}/${mes}/${ano}`;
}

function formatarKg(valor) {
  return `${Number(valor ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} kg`;
}

export default function ConfirmarChegadaModal({
  aberto,
  item = null,
  processando = false,
  onCancelar,
  onConfirmar,
}) {
  const [dataRecebimento, setDataRecebimento] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto) return;

    setDataRecebimento(dataHojeLocal());
    setErro("");
  }, [aberto, item?.id]);

  useEffect(() => {
    if (!aberto) return undefined;

    function teclado(event) {
      if (event.key === "Escape" && !processando) {
        onCancelar?.();
      }
    }

    document.addEventListener("keydown", teclado);

    return () => document.removeEventListener("keydown", teclado);
  }, [aberto, processando, onCancelar]);

  async function enviar(event) {
    event.preventDefault();
    setErro("");

    if (!item?.id) {
      setErro("Compra não informada.");
      return;
    }

    if (!dataRecebimento) {
      setErro("Informe a data real de chegada.");
      return;
    }

    if (item.dataCompra && dataRecebimento < item.dataCompra) {
      setErro("A data da chegada não pode ser anterior à data da compra.");
      return;
    }

    if (dataRecebimento > dataHojeLocal()) {
      setErro("A data da chegada não pode ser futura.");
      return;
    }

    try {
      await onConfirmar?.({
        id: item.id,
        dataRecebimento,
      });
    } catch (error) {
      setErro(
        error?.message ||
          "Não foi possível confirmar a chegada da compra.",
      );
    }
  }

  if (!aberto || !item) return null;

  return (
    <div className="compra-futura-modal-overlay">
      <div
        className="compra-futura-modal"
        style={{ maxWidth: "560px" }}
      >
        <div className="compra-futura-modal-header">
          <div
            className="compra-futura-modal-icone"
            style={{
              background: "#ecfdf5",
              color: "#047857",
            }}
          >
            <CheckCircle2 size={22} aria-hidden="true" />
          </div>

          <div className="compra-futura-modal-header-texto">
            <span>Matéria-Prima PP</span>
            <h3>Confirmar chegada</h3>
            <p>
              Informe somente a data em que o material realmente chegou.
            </p>
          </div>

          <button
            type="button"
            className="compra-futura-modal-fechar"
            onClick={onCancelar}
            disabled={processando}
            aria-label="Fechar"
          >
            <X size={19} />
          </button>
        </div>

        <form
          className="compra-futura-modal-form"
          onSubmit={enviar}
        >
          <section className="compra-futura-modal-secao">
            <div className="compra-futura-modal-secao-titulo">
              <strong>Compra selecionada</strong>
              <span>
                Os dados abaixo são apenas para conferência e não serão alterados.
              </span>
            </div>

            <div className="compra-futura-modal-resumo">
              <div>
                <span>Fornecedor</span>
                <strong>{item.fornecedorNome || "-"}</strong>
              </div>

              <div>
                <span>Pedido</span>
                <strong>{item.numeroPedido || "-"}</strong>
              </div>

              <div>
                <span>Quantidade</span>
                <strong>{formatarKg(item.quantidadeKg)}</strong>
              </div>

              <div>
                <span>Previsão</span>
                <strong>{formatarData(item.dataPrevista)}</strong>
              </div>
            </div>

            <label className="compra-futura-modal-campo compra-futura-modal-recebimento">
              <span>Data real da chegada</span>

              <input
                type="date"
                min={item.dataCompra || undefined}
                max={dataHojeLocal()}
                value={dataRecebimento}
                onChange={(event) => {
                  setDataRecebimento(event.target.value);
                  setErro("");
                }}
                disabled={processando}
                autoFocus
              />

              <small>
                Ao confirmar, a compra muda para Recebida e passa a aparecer na tela Entradas.
              </small>
            </label>
          </section>

          {erro && (
            <div className="compra-futura-modal-erro">
              {erro}
            </div>
          )}

          <div className="compra-futura-modal-acoes">
            <button
              type="button"
              className="compra-futura-modal-cancelar"
              onClick={onCancelar}
              disabled={processando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="compra-futura-modal-salvar"
              disabled={processando}
            >
              <CheckCircle2 size={17} />
              {processando ? "Confirmando..." : "Confirmar chegada"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
