import { INJETORAS, formatarKg, formatarNumero } from "../programacaoModal.utils";

/** Bloco 01: injetora, produto e os dados técnicos do produto escolhido. */
export default function ConfiguracaoProducao({
  injetora,
  codigoProduto,
  produtos,
  produtoSelecionado,
  receitas,
  calculo,
  bloqueado,
  onAlterarInjetora,
  onAlterarProduto,
}) {
  return (
    <section className="programacao-calendario-configuracao">
      <div className="programacao-calendario-configuracao-cabecalho">
        <div>
          <span className="programacao-calendario-eyebrow">01 · Configuração da produção</span>

          <strong>Máquina e produto</strong>

          <p>Selecione a injetora e o produto que serão considerados nesta programação.</p>
        </div>

        {(injetora || produtoSelecionado) && (
          <div className="programacao-calendario-configuracao-status">
            <span>{injetora ? `INJETORA ${injetora}` : "INJETORA PENDENTE"}</span>

            <strong>{produtoSelecionado ? produtoSelecionado.codigo : "PRODUTO PENDENTE"}</strong>
          </div>
        )}
      </div>

      <div className="programacao-modal-grid programacao-calendario-config">
        <label className="programacao-modal-campo">
          <span>Injetora</span>

          <select
            value={injetora}
            onChange={(event) => onAlterarInjetora(event.target.value)}
            disabled={bloqueado}
          >
            <option value="">Selecione a injetora</option>

            {INJETORAS.map((numero) => (
              <option key={numero} value={numero}>
                Injetora {numero}
              </option>
            ))}
          </select>
        </label>

        <label className="programacao-modal-campo">
          <span>Produto</span>

          <select
            value={codigoProduto}
            onChange={(event) => onAlterarProduto(event.target.value)}
            disabled={bloqueado}
          >
            <option value="">Selecione o produto</option>

            {produtos.map((produto) => (
              <option key={produto.codigo} value={produto.codigo}>
                {produto.codigo}
                {" - "}
                {produto.descricao || "Sem descrição"}
                {produto.materialNome ? ` · ${produto.materialNome}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {produtoSelecionado && (
        <div className="programacao-calendario-config-tecnico">
          <div>
            <span>Material</span>

            <strong>{produtoSelecionado.materialNome || "-"}</strong>
          </div>

          <div>
            <span>Ciclo</span>

            <strong>{formatarNumero(produtoSelecionado.cicloSegundos)}s</strong>
          </div>

          <div>
            <span>Cavidades</span>

            <strong>{formatarNumero(produtoSelecionado.cavidadeMolde)}</strong>
          </div>

          <div>
            <span>Capacidade</span>

            <strong>{formatarNumero(calculo.pecasPorHora)} pç/h</strong>
          </div>

          <div>
            <span>Consumo</span>

            <strong>{formatarKg(calculo.consumoPorHoraKg)}/h</strong>
          </div>

          <div
            className={[
              "programacao-calendario-receita-status",

              receitas.length > 0 ? "ok" : "pendente",
            ].join(" ")}
          >
            <span>Receitas disponíveis</span>

            <strong>
              {receitas.length > 0
                ? `${receitas.length} ATIVA${receitas.length === 1 ? "" : "S"}`
                : "NENHUMA"}
            </strong>
          </div>
        </div>
      )}
    </section>
  );
}
