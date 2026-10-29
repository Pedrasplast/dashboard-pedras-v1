import { Trash2 } from "lucide-react";

import { PERFIS } from "../programacaoModal.utils";

/** Barra que aplica jornada e receita aos dias marcados, ou os remove. */
export default function LoteDiasSelecionados({
  quantidadeMarcada,
  salvando,
  horasOutro,
  receitas,
  receitaId,
  algumMarcadoProgramado,
  onAplicarPerfil,
  onAlterarHorasOutro,
  onAplicarOutro,
  onAlterarReceita,
  onAplicarReceita,
  onRemover,
  onLimpar,
}) {
  const semMarcados = quantidadeMarcada === 0;

  return (
    <div className="programacao-calendario-lote">
      <div className="programacao-calendario-lote-info">
        <span>Configuração dos dias selecionados</span>

        <strong>
          {quantidadeMarcada} {quantidadeMarcada === 1 ? "dia selecionado" : "dias selecionados"}
        </strong>

        <small>
          Aplique a jornada e a receita diretamente aos dias marcados. Para usar receitas
          diferentes, selecione os dias separadamente.
        </small>
      </div>

      <div className="programacao-calendario-lote-acoes">
        <div className="programacao-calendario-lote-presets">
          {PERFIS.map((perfil) => (
            <button
              key={perfil.codigo}
              type="button"
              onClick={() => onAplicarPerfil(perfil)}
              disabled={semMarcados || salvando}
            >
              {perfil.rotulo}
            </button>
          ))}
        </div>

        <div className="programacao-calendario-lote-outro">
          <span>Outro</span>

          <input
            type="number"
            min="0.25"
            max="24"
            step="0.25"
            value={horasOutro}
            onChange={(event) => onAlterarHorasOutro(event.target.value)}
            disabled={semMarcados || salvando}
          />

          <span>h</span>

          <button type="button" onClick={onAplicarOutro} disabled={semMarcados || salvando}>
            Aplicar
          </button>
        </div>

        <div className="programacao-calendario-lote-receita">
          <span className="programacao-calendario-lote-receita-rotulo">Receita</span>

          <select
            value={receitaId}
            onChange={(event) => onAlterarReceita(event.target.value)}
            disabled={semMarcados || salvando || receitas.length === 0}
          >
            <option value="">Selecionar receita</option>

            {receitas.map((receita) => (
              <option key={receita.id} value={receita.id}>
                {receita.nome}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onAplicarReceita}
            disabled={semMarcados || salvando || !receitaId || receitas.length === 0}
          >
            Aplicar receita
          </button>
        </div>

        {algumMarcadoProgramado && (
          <button
            type="button"
            className="programacao-calendario-lote-remover"
            onClick={onRemover}
            disabled={semMarcados || salvando}
          >
            <Trash2 size={14} />
            Remover
          </button>
        )}

        <button
          type="button"
          className="programacao-calendario-lote-limpar"
          onClick={onLimpar}
          disabled={semMarcados || salvando}
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
